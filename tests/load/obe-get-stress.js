import http from 'k6/http';
import { check, sleep, group } from 'k6';

// =====================================================================
// KONFIGURASI BEBAN (GET HEAVY)
// =====================================================================
export const options = {
    // Skenario Beban Ekstrem: Mensimulasikan lonjakan hingga 200 pengguna (Virtual Users)
    stages: [
        { duration: '30s', target: 100 }, // Naik ke 100 user dalam 30 detik
        { duration: '1m', target: 200 },  // Lonjakan ekstrem ke 200 user
        { duration: '30s', target: 0 },   // Turun kembali ke 0 user
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.05'],
    },
};

const BASE_URL = 'https://api-siak.uika-bogor.ac.id';

const DUMMY_IDS = {
    id_obe: "019e7e03-a16c-707f-89b1-e62050644836",         // OBE TI Kurikulum 2025
    id_mk: "019e7f79-3ab9-778c-9c55-0dec062cb6eb",          // TIF117 - Rangkaian Digital
    id_prodi: "0197ea6f-2c4f-7afb-a06e-2f13f589c195",       // Teknik Informatika
    tahun_kurikulum: "019e7dfc-b5a8-757f-a9be-954d00fb6912", // Kurikulum 2025
    periodeId: "0197fce6-e176-7c62-b315-00b0c4b4ed8b",      // 2025 Genap
    id_jenjang: "0197e936-e8cd-7212-9086-4f2e0cb6a9bc",     // D4
};

export default function () {
    const headers = { 'Content-Type': 'application/json' };

    group('1. GET Mata Kuliah & Pemetaan', () => {
        check(http.get(`${BASE_URL}/api/akademik/obe/mata-kuliah/${DUMMY_IDS.id_mk}/pemetaan-cpl`, { headers }), { 'GET Pemetaan CPL': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/mata-kuliah/${DUMMY_IDS.id_mk}/pemetaan-cpmk`, { headers }), { 'GET Pemetaan CPMK': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/mata-kuliah`, { headers }), { 'GET MK Hal 1': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/mata-kuliah?page=3&size=10`, { headers }), { 'GET MK Pagination': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/mata-kuliah/${DUMMY_IDS.id_mk}`, { headers }), { 'GET MK Detail': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/mata-kuliah?page=1&limit=10&prodiId=${DUMMY_IDS.id_prodi}&tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}&jenis=Kuliah&search=Data`, { headers }), { 'GET MK Filter': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/mata-kuliah?search=pemrograman`, { headers }), { 'GET MK Search': (r) => r.status === 200 });
        sleep(0.5);
    });

    group('2. GET RPS & Rencana Evaluasi', () => {
        check(http.get(`${BASE_URL}/api/akademik/rps/mata-kuliah/${DUMMY_IDS.id_mk}/detail?periodeId=${DUMMY_IDS.periodeId}`, { headers }), { 'GET Detail RPS': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/rps/mata-kuliah/${DUMMY_IDS.id_mk}/rencana-pembelajaran?periodeId=${DUMMY_IDS.periodeId}`, { headers }), { 'GET Rencana Pb': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/rps/mata-kuliah/${DUMMY_IDS.id_mk}/rencana-evaluasi`, { headers }), { 'GET Rencana Evaluasi': (r) => r.status === 200 });
        sleep(0.5);
    });

    group('3. GET Skala Nilai, Predikat & Template Evaluasi', () => {
        check(http.get(`${BASE_URL}/api/akademik/skala-nilai/?programStudiId=${DUMMY_IDS.id_prodi}&tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}`, { headers }), { 'GET Skala Nilai': (r) => r.status === 200 });

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

    group('5. GET Export Laporan', () => {
        check(http.get(`${BASE_URL}/api/akademik/obe/export/excel/manajemen-pl/${DUMMY_IDS.id_obe}`, { headers }), { 'GET Export Excel PL': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/export/excel/manajemen-cpl/${DUMMY_IDS.id_obe}`, { headers }), { 'GET Export Excel CPL': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/export/excel/matriks-pl-cpl/${DUMMY_IDS.id_obe}`, { headers }), { 'GET Export Excel Matriks PL-CPL': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/obe/export/pdf/pemetaan-cpl-mk/${DUMMY_IDS.id_obe}`, { headers }), { 'GET Export PDF Matriks CPL-MK': (r) => r.status === 200 });
        sleep(1);
    });
}
