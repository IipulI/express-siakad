import http from 'k6/http';
import { check, sleep, group } from 'k6';

// =====================================================================
// KONFIGURASI BEBAN (GET HEAVY)
// =====================================================================
export const options = {
    // Skenario Spike Test: Mensimulasikan lonjakan hingga 5000 pengguna (Virtual Users)
    stages: [
        { duration: '30s', target: 1000 }, // Naik ke 1000 user dalam 30 detik
        { duration: '1m', target: 3000 },  // Lonjakan ekstrem ke 5000 user
        { duration: '30s', target: 0 },    // Turun kembali ke 0 user
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.05'],
    },
};

const BASE_URL = 'http://localhost:3000';

const DUMMY_IDS = {
    id_obe: "019ddedf-b94a-722b-ae17-343be402d2bf",
    id_mk: "019ddf3b-422d-733f-bcf3-a37fa814d0fb",
    id_prodi: "0197ea6f-2c4f-7afb-a06e-2f13f589c195",
    tahun_kurikulum: "019dded8-e448-73e2-9ef5-5d0caacf58b9",
    periodeId: "0197fce6-e176-7c62-b315-00b0c4b4ed8b",
    id_jenjang: "0197e936-aa62-773f-a388-000271fd993d",
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

    group('3. GET Kurikulum, Skala Nilai, Ekivalensi dll', () => {
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/dropdown-prasyarat?prodiId=${DUMMY_IDS.id_prodi}&tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}`, { headers }), { 'GET Prasyarat': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/dropdown-konsentrasi?prodiId=${DUMMY_IDS.id_prodi}`, { headers }), { 'GET Konsentrasi': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/per-semester?prodiId=${DUMMY_IDS.id_prodi}&tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}`, { headers }), { 'GET MK Per Semester': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/${DUMMY_IDS.id_mk}`, { headers }), { 'GET Detail MKK': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/rekap-sks?prodiId=${DUMMY_IDS.id_prodi}`, { headers }), { 'GET Rekap SKS 1': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/rekap-sks?prodiId=${DUMMY_IDS.id_prodi}&page=2&size=10`, { headers }), { 'GET Rekap SKS 2': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/rekap-sks?prodiId=${DUMMY_IDS.id_prodi}&tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}`, { headers }), { 'GET Rekap SKS 3': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/rekap-sks?jenjangId=${DUMMY_IDS.id_jenjang}`, { headers }), { 'GET Rekap SKS 4': (r) => r.status === 200 });

        check(http.get(`${BASE_URL}/api/akademik/skala-nilai/?programStudiId=${DUMMY_IDS.id_prodi}&tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}`, { headers }), { 'GET Skala Nilai': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/ekivalensi-mata-kuliah/?prodiId=${DUMMY_IDS.id_prodi}&kurikulumBaruId=${DUMMY_IDS.tahun_kurikulum}&kurikulumLamaId=0197e916-6603-7042-878e-d3594d3eada7`, { headers }), { 'GET Ekivalensi': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/ekivalensi-mata-kuliah/dropdown-lama?prodiId=${DUMMY_IDS.id_prodi}&kurikulumLamaId=0197e916-6603-7042-878e-d3594d3eada7`, { headers }), { 'GET Ekivalensi Dropdown': (r) => r.status === 200 });

        check(http.get(`${BASE_URL}/api/akademik/predikat-kelulusan?prodiId=${DUMMY_IDS.id_prodi}&tahunKurikulumId=${DUMMY_IDS.tahun_kurikulum}`, { headers }), { 'GET Predikat Kelulusan': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/predikat-kelulusan?tahunKurikulumId=0197e916-6603-7042-878e-d3594d3eada7&jenjangId=0197e936-aa62-773f-a388-000271fd993d`, { headers }), { 'GET Predikat Kelulusan Jenjang': (r) => r.status === 200 });

        check(http.get(`${BASE_URL}/api/akademik/template-evaluasi`, { headers }), { 'GET Template All': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/template-evaluasi?kurikulumId=${DUMMY_IDS.tahun_kurikulum}&prodiId=${DUMMY_IDS.id_prodi}&jenisMk=Kuliah&search=teknik`, { headers }), { 'GET Template Combo': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/template-evaluasi?search=informatika`, { headers }), { 'GET Template Search': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/template-evaluasi?prodiId=${DUMMY_IDS.id_prodi}`, { headers }), { 'GET Template Prodi': (r) => r.status === 200 });
        check(http.get(`${BASE_URL}/api/akademik/template-evaluasi/detail?kurikulumId=${DUMMY_IDS.tahun_kurikulum}&prodiId=${DUMMY_IDS.id_prodi}&jenisMk=Kuliah`, { headers }), { 'GET Template Detail': (r) => r.status === 200 });
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
