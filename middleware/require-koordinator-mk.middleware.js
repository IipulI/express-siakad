import models from '../models/index.js';

const { MataKuliah, JadwalKuliah, KelasKuliah, ProgramStudi } = models;

// FIX 2026-08-19: role admin sebelumnya CUMA dicek dari tabel siak_user_role
// (req.user.userRole, di-populate attachUser.middleware.js) -- ini beres buat
// akun yang role-nya di-assign manual di DB (kayak akun test adminakademik).
// TAPI login lewat SSO (routes/sso/sso.js) SAMA SEKALI GAK NULIS ke tabel itu
// -- role dari SSO cuma "dititipin" di dalam JWT-nya sendiri (klaim `roles`,
// ditentukan dari rolePermissions e-portal tiap kali login), gak pernah
// disinkronkan ke siak_user_role. Makanya user yang admin/kaprodi/koordinator
// beneran menurut SSO tapi belum (atau gak pernah) punya baris siak_user_role
// bakal ke-anggap "bukan admin" oleh checker manapun yang cuma baca DB --
// diblok padahal harusnya boleh. Sekarang dicek DUA-DUANYA: klaim `roles` di
// token (req.auth, punya SSO) ATAU baris di siak_user_role (punya direct
// login/manual) -- salah satu match AKADEMIK_UNIV udah cukup.
// userRole itu hasMany (lihat models/user.models.js) walau praktiknya tiap user
// baru punya 1 role -- tetep di-treat sebagai array biar bener sesuai model.
export const isAdminAkademik = (req) =>
    (req.auth?.roles || []).includes('AKADEMIK_UNIV') ||
    (req.user?.userRole || []).some((ur) => ur?.role?.nama === 'AKADEMIK_UNIV');

export const resolveDariParamsMk = async (req) => req.params.id || req.params.mataKuliahId || null;

// requireKoordinatorMK: cuma boleh lewat kalau requester itu koordinator_mk_id
// dari mata kuliah yang dituju, atau admin akademik (AKADEMIK_UNIV). Dipakai di
// semua endpoint yang bisa UBAH data OBE per-MK (pemetaan CPL/CPMK, RPS, Rencana
// Pembelajaran/Evaluasi), baik yang lewat /akademik/koordinator-mk/... maupun
// endpoint lama di /akademik/obe/... yang sebelumnya kebuka buat siapa aja yang
// login (lihat obe.router.js).
export const requireKoordinatorMK = (resolveMataKuliahId = resolveDariParamsMk) => async (req, res, next) => {
    try {
        if (isAdminAkademik(req)) return next();

        const dosenId = req.user?.dosen?.id;
        if (!dosenId) {
            return res.status(403).json({ status: 403, message: 'Hanya dosen (koordinator mata kuliah) atau admin akademik yang bisa mengakses menu ini.' });
        }

        const mataKuliahId = await resolveMataKuliahId(req);
        if (!mataKuliahId) {
            return res.status(404).json({ status: 404, message: 'Mata kuliah/data terkait tidak ditemukan.' });
        }

        const mk = await MataKuliah.findByPk(mataKuliahId, { attributes: ['id', 'koordinatorMkId'] });
        if (!mk || mk.koordinatorMkId !== dosenId) {
            return res.status(403).json({ status: 403, message: 'Anda bukan koordinator mata kuliah ini, tidak dapat mengakses/mengubah datanya.' });
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const requireDosenLogin = (req, res, next) => {
    if (isAdminAkademik(req) || req.user?.dosen?.id) return next();
    return res.status(403).json({ status: 403, message: 'Hanya dosen atau admin akademik yang bisa mengakses menu ini.' });
};

// cekKepemilikanKelas: cuma boleh lewat kalau requester itu dosen yang beneran
// PUNYA jadwal di kelas kuliah yang dituju (siak_jadwal_kuliah.siak_dosen_id),
// atau admin akademik. Dipakai di semua endpoint kelas-kuliah sisi dosen (nilai,
// capaian, RPS-dari-kelas, dst) yang sebelumnya jadi placeholder kosong (lihat
// dosen-pengampu_router.js) atau gak ada pengecekan sama sekali (lihat
// routes/dosen/kelas-kuliah.routes.js) -- siapa aja yang login bisa lihat/ubah
// nilai kelas dosen lain kalau tau ID kelasnya.
export const cekKepemilikanKelas = async (req, res, next) => {
    try {
        if (isAdminAkademik(req)) return next();

        const dosenId = req.user?.dosen?.id;
        if (!dosenId) {
            return res.status(403).json({ status: 403, message: 'Hanya dosen atau admin akademik yang bisa mengakses menu ini.' });
        }

        const kelasKuliahId = req.params.id || req.params.kelasId || req.params.krsId;
        const ampu = await JadwalKuliah.findOne({
            where: { siakKelasKuliahId: kelasKuliahId, siakDosenId: dosenId },
            attributes: ['id'],
        });
        if (!ampu) {
            return res.status(403).json({ status: 403, message: 'Anda bukan pengajar kelas ini, tidak dapat mengakses datanya.' });
        }

        next();
    } catch (error) {
        next(error);
    }
};

// requireKaprodi: cuma boleh lewat kalau requester itu kaprodi_id dari program
// studi PEMILIK kelas kuliah yang dituju (siak_program_studi.kaprodi_id), atau
// admin akademik. FIX 2026-08-19: middleware ini di kaprodi_router.js
// sebelumnya CUMA placeholder (`next()` doang) -- siapa aja yang login bisa
// akses (termasuk RESET NILAI & FINALISASI) kelas kuliah MANAPUN, gak peduli
// prodi apa. kaprodi_id sendiri sudah ada dari sononya di data ProgramStudi
// (dosen yang ditunjuk jadi kaprodi tiap prodi), jadi dicek langsung dari situ.
export const requireKaprodi = async (req, res, next) => {
    try {
        if (isAdminAkademik(req)) return next();

        const dosenId = req.user?.dosen?.id;
        if (!dosenId) {
            return res.status(403).json({ status: 403, message: 'Hanya Kaprodi atau admin akademik yang bisa mengakses menu ini.' });
        }

        const kelasKuliahId = req.params.id || req.params.kelasId || req.params.krsId;
        const kelas = await KelasKuliah.findByPk(kelasKuliahId, { attributes: ['id', 'siakProgramStudiId'] });
        if (!kelas) {
            return res.status(404).json({ status: 404, message: 'Kelas kuliah tidak ditemukan.' });
        }

        const prodi = await ProgramStudi.findByPk(kelas.siakProgramStudiId, { attributes: ['id', 'kaprodiId'] });
        if (!prodi || prodi.kaprodiId !== dosenId) {
            return res.status(403).json({ status: 403, message: 'Anda bukan Kaprodi program studi pemilik kelas ini.' });
        }

        next();
    } catch (error) {
        next(error);
    }
};