import models from '../models/index.js';

const { MataKuliah, JadwalKuliah } = models;

// userRole itu hasMany (lihat models/user.models.js) walau praktiknya tiap user
// baru punya 1 role -- tetep di-treat sebagai array biar bener sesuai model.
export const isAdminAkademik = (req) => (req.user?.userRole || []).some((ur) => ur?.role?.nama === 'AKADEMIK_UNIV');

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