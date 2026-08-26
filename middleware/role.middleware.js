import ResponseBuilder from '../utils/response.js';

const deny = (res) =>
    new ResponseBuilder(res)
        .status('failure')
        .code(403)
        .message('Anda tidak memiliki akses untuk endpoint ini.')
        .json();

const hasRole = (req, roleName) =>
    (req.user?.userRole || []).some((ur) => ur.role?.nama?.toLowerCase() === roleName);

// Middleware di bawah ini harus dipasang setelah `attachUser`.
// Tabel siak_pegawai (model Dosen) dipakai bareng untuk akun dosen maupun
// admin/staff akademik, dibedakan lewat flag isDosen / isPegawai. Jadi
// req.user.dosen truthy saja belum cukup buat mastiin akun itu dosen atau admin.

// Patokan utama: req.user.dosen.isDosen.
// Safety net: role.nama === 'dosen' (lowercase) di tabel siak_role.
export const requireDosen = (req, res, next) => {
    const isDosen = Boolean(req.user?.dosen?.isDosen) || hasRole(req, 'dosen');

    if (!isDosen) return deny(res);
    next();
};

// Patokan utama: req.user.mahasiswa (relasi hasOne).
// Safety net: role.nama === 'mahasiswa' (lowercase) di tabel siak_role.
export const requireMahasiswa = (req, res, next) => {
    const isMahasiswa = Boolean(req.user?.mahasiswa) || hasRole(req, 'mahasiswa');

    if (!isMahasiswa) return deny(res);
    next();
};

// Patokan utama: req.user.dosen.isPegawai.
// Safety net: role.nama === 'admin' (lowercase) di tabel siak_role.
export const requireAdmin = (req, res, next) => {
    const isAdmin = Boolean(req.user?.dosen?.isPegawai) || hasRole(req, 'admin') || hasRole('akademik_univ');

    if (!isAdmin) return deny(res);
    next();
};
