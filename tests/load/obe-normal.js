import http from 'k6/http';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';
import { check, sleep, group } from 'k6';

// =====================================================================
// KONFIGURASI BEBAN NORMAL (200 VU — Simulasi Harian, trafik staf, margin konservatif)
// =====================================================================
// Skenario ini mensimulasikan Kaprodi/Koordinator MK/Dosen Pengampu (staf)
// yang mengakses data OBE bersamaan pada jam kerja biasa -- BUKAN periode
// puncak/deadline (itu dicakup di skenario ekstrem/breakpoint, lihat
// obe-get-stress.js & obe-cbt-sync-stress.js).
//
// Modul OBE dirancang generik untuk seluruh program studi di NL-SIAK
// (siak_obe punya siak_program_studi_id sendiri per prodi); Teknik
// Informatika baru pilot project implementasi & pengujian saat ini, bukan
// batas cakupan sistem. Estimasi beban dihitung dari total dosen aktif
// se-universitas (294 orang, dicek langsung dari database), bukan cuma
// dosen TI. Perhitungan konkurensi ketat (5-15% aktif bersamaan) memberi
// 15-44 orang -- tapi 200 VU sengaja dipilih jauh di atas itu sebagai
// MARGIN KONSERVATIF, bukan estimasi ketat: mewakili skenario "hampir
// seluruh dosen aktif kampus mengakses bersamaan" (200 dari 294, ~68%),
// jadi bukti sistem tetap lancar bahkan pada kondisi jauh lebih berat
// dari kondisi harian sebenarnya, sebelum masuk ke skenario ekstrem
// (breakpoint testing) yang levelnya lebih tinggi lagi.
export const options = {
    // Skenario Beban Normal: Mensimulasikan 200 pengguna mengakses sistem secara bersamaan
    stages: [
        { duration: '20s', target: 200 },  // Naik ke 200 user dalam 20 detik
        { duration: '90s', target: 200 },  // Tahan 200 user selama 90 detik
        { duration: '20s', target: 0 },    // Turun kembali ke 0 user
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.05'],
    },
};

const BASE_URL = 'https://api-siak.uika-bogor.ac.id';

const DUMMY_IDS = {
    id_obe: "019e7e03-a16c-707f-89b1-e62050644836",        // OBE TI Kurikulum 2025
    id_mk: "019e7f79-3ab9-778c-9c55-0dec062cb6eb",         // TIF117 - Rangkaian Digital
    id_prodi: "0197ea6f-2c4f-7afb-a06e-2f13f589c195",      // Teknik Informatika
    tahun_kurikulum: "019e7dfc-b5a8-757f-a9be-954d00fb6912", // Kurikulum 2025
    periodeId: "0197fce6-e176-7c62-b315-00b0c4b4ed8b",     // 2025 Genap
    id_jenjang: "0197e936-e8cd-7212-9086-4f2e0cb6a9bc",    // D4
    id_rencana_evaluasi: "019e8138-186d-703c-ad7f-3d31e210f248", // TIF117 - UTS
};

// =====================================================================
// AUTENTIKASI — semua endpoint /api/akademik/* mewajibkan Bearer token
// (middleware verifySsoToken). Token di-generate SENDIRI di sini (bukan
// login user asli) supaya skrip tidak perlu menyimpan username/password
// nyata. JWT_SECRET & USER_ID WAJIB dikirim lewat -e saat run, JANGAN
// di-hardcode di file ini (file ini di-commit ke git, secret tidak boleh
// ikut ter-commit). Lihat PANDUAN-STRESS-TESTING-K6.md bagian 3-4.
// =====================================================================
const JWT_SECRET = __ENV.JWT_SECRET;
const USER_ID = __ENV.USER_ID || '0197eeb1-836d-7d8d-933d-4e8c9f4e7733';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET wajib diisi, contoh: k6 run -e JWT_SECRET=xxx tests/load/obe-normal.js (lihat PANDUAN-STRESS-TESTING-K6.md)');
}

function base64url(input) {
    return encoding.b64encode(input, 'rawurl');
}

function signJwt(payload) {
    const headerEncoded = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = base64url(JSON.stringify(payload));
    const data = `${headerEncoded}.${payloadEncoded}`;
    const signature = crypto.hmac('sha256', JWT_SECRET, data, 'base64rawurl');
    return `${data}.${signature}`;
}

const now = Math.floor(Date.now() / 1000);
const AUTH_TOKEN = signJwt({ id: USER_ID, iat: now, exp: now + 7200 });

export default function () {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTH_TOKEN}` };

    // Jalur endpoint pada grup ini disamakan dengan yang benar-benar dipakai
    // di index.html (public/tes-response-untuk-be/index.html), supaya stress
    // test menguji rute yang sama persis dengan yang dipegang saat demo.
    group('1. GET Mata Kuliah & Pemetaan', () => {
        check(http.get(`${BASE_URL}/api/akademik/koordinator-mk/mata-kuliah/${DUMMY_IDS.id_mk}/pemetaan-cpl`, { headers }), { 'GET Pemetaan CPL': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/mata-kuliah/${DUMMY_IDS.id_mk}/pemetaan-cpmk`, { headers }), { 'GET Pemetaan CPMK': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah?size=10`, { headers }), { 'GET MK Hal 1': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah?page=3&size=10`, { headers }), { 'GET MK Pagination': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/mata-kuliah/${DUMMY_IDS.id_mk}`, { headers }), { 'GET MK Detail': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah?page=1&size=10&programStudiId=${DUMMY_IDS.id_prodi}&tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}&search=Data`, { headers }), { 'GET MK Filter': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah?search=pemrograman`, { headers }), { 'GET MK Search': (r) => r.status === 200 });
        sleep(0.5);
    });

    group('2. GET RPS & Rencana Evaluasi', () => {
        check(http.get(`${BASE_URL}/api/akademik/rps/mata-kuliah/${DUMMY_IDS.id_mk}/detail?periodeId=${DUMMY_IDS.periodeId}`, { headers }), { 'GET Detail RPS': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/koordinator-mk/mata-kuliah/${DUMMY_IDS.id_mk}/rencana-pembelajaran?periodeId=${DUMMY_IDS.periodeId}`, { headers }), { 'GET Rencana Pb': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/koordinator-mk/mata-kuliah/${DUMMY_IDS.id_mk}/rencana-evaluasi?periodeId=${DUMMY_IDS.periodeId}`, { headers }), { 'GET Rencana Evaluasi': (r) => r.status === 200 });
        sleep(0.5);
    });

    group('3. GET Skala Nilai, Predikat & Template Evaluasi', () => {
        check(http.get(`${BASE_URL}/api/akademik/skala-nilai/?tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}&jenjangId=${DUMMY_IDS.id_jenjang}`, { headers }), { 'GET Skala Nilai': (r) => r.status === 200 });

        check(http.get(`${BASE_URL}/api/akademik/predikat-kelulusan?prodiId=${DUMMY_IDS.id_prodi}&tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}`, { headers }), { 'GET Predikat Kelulusan': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/predikat-kelulusan?tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}&prodiId=${DUMMY_IDS.id_prodi}`, { headers }), { 'GET Predikat Kelulusan Filter': (r) => r.status === 200 });

        check(http.get(`${BASE_URL}/api/akademik/template-evaluasi`, { headers }), { 'GET Template All': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/template-evaluasi?kurikulumId=${DUMMY_IDS.tahun_kurikulum}&prodiId=${DUMMY_IDS.id_prodi}&jenisMk=Kuliah&search=teknik`, { headers }), { 'GET Template Combo': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/template-evaluasi?search=informatika`, { headers }), { 'GET Template Search': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/template-evaluasi?prodiId=${DUMMY_IDS.id_prodi}`, { headers }), { 'GET Template Prodi': (r) => r.status === 200 });
        sleep(0.5);
    });

    group('4. GET Manajemen Capaian & Matriks OBE', () => {
        check(http.get(`${BASE_URL}/api/akademik/obe/profil-lulusan/${DUMMY_IDS.id_obe}`, { headers }), { 'GET Profil Lulusan': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/capaian-pembelajaran/${DUMMY_IDS.id_obe}`, { headers }), { 'GET CPL': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/capaian-pembelajaran/${DUMMY_IDS.id_obe}?kategori=Sikap&search=religius`, { headers }), { 'GET CPL Filter': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/pemetaan/pl-ke-cpl/${DUMMY_IDS.id_obe}`, { headers }), { 'GET Matriks PL-CPL': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/pemetaan/cpl-ke-mk/${DUMMY_IDS.id_obe}`, { headers }), { 'GET Matriks CPL-MK': (r) => r.status === 200 });
        sleep(0.5);
    });

    // Sebelumnya ada 2 URL export Excel yang TIDAK TERDAFTAR di rute manapun
    // (manajemen-pl & manajemen-cpl) -- diganti dengan rute yang benar-benar
    // ada (matriks-pl-cpl Excel + pemetaan-cpl-mk PDF, keduanya terverifikasi
    // di routes/akademik/obe.router.js).
    group('5. GET Export Laporan', () => {
        check(http.get(`${BASE_URL}/api/akademik/obe/export/excel/matriks-pl-cpl/${DUMMY_IDS.id_obe}`, { headers }), { 'GET Export Excel Matriks PL-CPL': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/export/pdf/pemetaan-cpl-mk/${DUMMY_IDS.id_obe}`, { headers }), { 'GET Export PDF Matriks CPL-MK': (r) => r.status === 200 });
        sleep(0.5);
    });

    // Grup baru: representasi Jalur D (integrasi CBT) pada stress test --
    // sebelumnya tidak ada satu pun endpoint CBT yang diuji di sini.
    group('6. GET Breakdown Nilai dari CBT (Jalur D)', () => {
        check(http.get(`${BASE_URL}/api/akademik/cbt/komponen/${DUMMY_IDS.id_rencana_evaluasi}/nilai`, { headers }), { 'GET Breakdown Nilai CBT': (r) => r.status === 200 });
        sleep(1);
    });
}
