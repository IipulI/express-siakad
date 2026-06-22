import http from 'k6/http';
import { check, sleep, group } from 'k6';

// =====================================================================
// KONFIGURASI BEBAN (MUTATION HEAVY)
// =====================================================================
export const options = {
    stages: [
        { duration: '10s', target: 5 },
        { duration: '30s', target: 10 },
        { duration: '15s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.05'],
    },
};

const BASE_URL = 'http://localhost:3000';

// =====================================================================
// ⚠️ SILAKAN ISI UUID DI BAWAH INI SESUAI DENGAN DATABASE ANDA ⚠️
// =====================================================================
const DUMMY_IDS = {
    id_obe: "MASUKKAN_UUID_OBE_DISINI",
    id_mk: "MASUKKAN_UUID_MK_DISINI",
    id_prodi: "MASUKKAN_UUID_PRODI_DISINI",
    tahun_kurikulum: "MASUKKAN_UUID_TAHUN_KURIKULUM_DISINI",
    id_pl: "MASUKKAN_UUID_PL_DISINI",
    id_cpl: "MASUKKAN_UUID_CPL_DISINI",
    id_indikator_kerja: "MASUKKAN_UUID_INDIKATOR_KERJA_DISINI",
    id_predikat_kelulusan: "MASUKKAN_UUID_PREDIKAT_DISINI",
    id_skala_nilai: "MASUKKAN_UUID_SKALA_NILAI_DISINI",
    id_matkul_baru_ekivalensi: "MASUKKAN_UUID_EKIVALENSI_DISINI",
    rpsId: "MASUKKAN_UUID_RPS_DISINI",
    rencanaPembelajaranId: "MASUKKAN_UUID_RENCANA_PEMBELAJARAN_DISINI",
    evaluasiId: "MASUKKAN_UUID_EVALUASI_DISINI",
    persyaratanId: "MASUKKAN_UUID_PERSYARATAN_DISINI"
};

export default function () {
    const headers = { 'Content-Type': 'application/json' };

    group('Actions (POST, PUT, DELETE)', () => {
        // -----------------------------------------------------------------
        // A. MATA KULIAH
        // -----------------------------------------------------------------
        const payloadPostMk = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/obe/mata-kuliah`, payloadPostMk, { headers });

        const payloadPutMk = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.put(`${BASE_URL}/api/akademik/obe/mata-kuliah/${DUMMY_IDS.id_mk}`, payloadPutMk, { headers });

        // http.del(`${BASE_URL}/api/akademik/obe/mata-kuliah/${DUMMY_IDS.id_mk}`, null, { headers });


        // -----------------------------------------------------------------
        // B. PEMETAAN CPL & CPMK 
        // -----------------------------------------------------------------
        const payloadPemetaanCpl = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/obe/mata-kuliah/${DUMMY_IDS.id_mk}/pemetaan-cpl`, payloadPemetaanCpl, { headers });

        const payloadPemetaanCpmk = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/obe/mata-kuliah/${DUMMY_IDS.id_mk}/pemetaan-cpmk`, payloadPemetaanCpmk, { headers });


        // -----------------------------------------------------------------
        // C. RPS & RENCANA PEMBELAJARAN
        // -----------------------------------------------------------------
        const payloadPostDetailRps = JSON.stringify({
             // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/rps/mata-kuliah/${DUMMY_IDS.id_mk}/detail`, payloadPostDetailRps, { headers });
        // http.del(`${BASE_URL}/api/rps/detail/${DUMMY_IDS.rpsId}`, null, { headers });

        const payloadRencanaPb = JSON.stringify({
             // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/rps/mata-kuliah/${DUMMY_IDS.id_mk}/rencana-pembelajaran`, payloadRencanaPb, { headers });

        const payloadUpdateRencanaPb = JSON.stringify({
             // ISI BODY JSON DI SINI
        });
        // http.put(`${BASE_URL}/api/akademik/rps/rencana-pembelajaran/${DUMMY_IDS.rencanaPembelajaranId}`, payloadUpdateRencanaPb, { headers });
        // http.del(`${BASE_URL}/api/rps/rencana-pembelajaran/${DUMMY_IDS.rencanaPembelajaranId}`, null, { headers });

        const payloadRencanaEv = JSON.stringify({
             // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/rps/mata-kuliah/${DUMMY_IDS.id_mk}/rencana-evaluasi`, payloadRencanaEv, { headers });
        // http.del(`${BASE_URL}/api/akademik/rps/rencana-evaluasi/${DUMMY_IDS.evaluasiId}`, null, { headers });


        // -----------------------------------------------------------------
        // D. KURIKULUM & SYARAT MK
        // -----------------------------------------------------------------
        const payloadAssignMkk = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/assign`, payloadAssignMkk, { headers });

        const payloadUpdateMkk = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.put(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/${DUMMY_IDS.persyaratanId}`, payloadUpdateMkk, { headers });
        // http.del(`${BASE_URL}/api/akademik/mata-kuliah-kurikulum/${DUMMY_IDS.persyaratanId}`, null, { headers });


        // -----------------------------------------------------------------
        // E. SKALA NILAI
        // -----------------------------------------------------------------
        const payloadSkalaNilai = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/skala-nilai`, payloadSkalaNilai, { headers });
        // http.del(`${BASE_URL}/api/akademik/skala-nilai/${DUMMY_IDS.id_skala_nilai}`, null, { headers });


        // -----------------------------------------------------------------
        // F. EKIVALENSI & PREDIKAT KELULUSAN
        // -----------------------------------------------------------------
        const payloadEkivalensi = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/ekivalensi-mata-kuliah/bulk`, payloadEkivalensi, { headers });
        // http.del(`${BASE_URL}/api/akademik/ekivalensi-mata-kuliah/${DUMMY_IDS.id_matkul_baru_ekivalensi}`, null, { headers });

        const payloadPredikat = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/predikat-kelulusan`, payloadPredikat, { headers });

        const payloadUpdatePredikat = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.put(`${BASE_URL}/api/akademik/predikat-kelulusan/${DUMMY_IDS.id_predikat_kelulusan}`, payloadUpdatePredikat, { headers });
        // http.del(`${BASE_URL}/api/akademik/predikat-kelulusan/${DUMMY_IDS.id_predikat_kelulusan}`, null, { headers });


        // -----------------------------------------------------------------
        // G. TEMPLATE EVALUASI
        // -----------------------------------------------------------------
        const payloadTemplateEv = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/template-evaluasi`, payloadTemplateEv, { headers });
        // http.del(`${BASE_URL}/api/akademik/template-evaluasi?kurikulumId=${DUMMY_IDS.tahun_kurikulum}&prodiId=${DUMMY_IDS.id_prodi}&jenisMk=Kuliah`, null, { headers });


        // -----------------------------------------------------------------
        // H. MANAJEMEN PL & CPL (OBE)
        // -----------------------------------------------------------------
        const payloadPl = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/obe/profil-lulusan`, payloadPl, { headers });

        const payloadUpdatePl = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.put(`${BASE_URL}/api/akademik/obe/profil-lulusan/${DUMMY_IDS.id_pl}`, payloadUpdatePl, { headers });
        // http.del(`${BASE_URL}/api/akademik/obe/profil-lulusan/${DUMMY_IDS.id_pl}`, null, { headers });

        const payloadIk = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/obe/indikator-kinerja`, payloadIk, { headers });

        const payloadUpdateIk = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.put(`${BASE_URL}/api/akademik/obe/indikator-kinerja/${DUMMY_IDS.id_indikator_kerja}`, payloadUpdateIk, { headers });
        // http.del(`${BASE_URL}/api/akademik/obe/indikator-kinerja/${DUMMY_IDS.id_indikator_kerja}`, null, { headers });

        const payloadCpl = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/obe/capaian-pembelajaran/${DUMMY_IDS.id_obe}`, payloadCpl, { headers });

        const payloadUpdateCpl = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.put(`${BASE_URL}/api/akademik/obe/capaian-pembelajaran/${DUMMY_IDS.id_cpl}`, payloadUpdateCpl, { headers });
        // http.del(`${BASE_URL}/api/akademik/obe/capaian-pembelajaran/${DUMMY_IDS.id_cpl}`, null, { headers });


        // -----------------------------------------------------------------
        // I. MATRIKS OBE (PL-CPL & CPL-MK)
        // -----------------------------------------------------------------
        const payloadMatriksPlCpl = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/obe/pemetaan/pl-ke-cpl/${DUMMY_IDS.id_obe}`, payloadMatriksPlCpl, { headers });

        const payloadMatriksCplMk = JSON.stringify({
            // ISI BODY JSON DI SINI
        });
        // http.post(`${BASE_URL}/api/akademik/obe/pemetaan/cpl-ke-mk/${DUMMY_IDS.id_obe}`, payloadMatriksCplMk, { headers });
        
        sleep(1);
    });
}
