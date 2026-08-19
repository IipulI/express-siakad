import models from "../models/index.js"
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt";
import { Op } from "sequelize"

const { Mahasiswa, Dosen, User, UserRole, Role } = models;

export const login = async(data) => {
    // 1. Build the query safely so we don't pass 'undefined' to Sequelize
    const searchConditions = [];
    if (data.username) searchConditions.push({ username: { [Op.iLike]: data.username } });
    if (data.email) searchConditions.push({ email: { [Op.iLike]: data.email } });

    // Guard clause to ensure they sent at least something
    if (searchConditions.length === 0) {
        throw new Error("Username atau email harus diisi");
    }

    // 2. Safely find the user
    const user = await User.findOne({
        where: { [Op.or]: searchConditions },
        include: [
            {
                attributes: ["id", "siakUserId", "siakRoleId"],
                model: UserRole,
                as: "userRole",
                include: {
                    attributes: ["id", "nama"],
                    model: Role,
                    as: "role"
                }
            },
            {
                attributes: ["id", "nama", 'npm'],
                model: Mahasiswa,
                as: "mahasiswa",
                required: false,
            },
            {
                // FIX 2026-08-19: model Pegawai udah gak ada (digabung ke Dosen
                // waktu merge siak_pegawai lama -> siak_pegawai baru, lihat
                // migration merge-siak-pegawai-into-siak-dosen) -- include-nya
                // sebelumnya nunjuk ke model undefined, bikin login langsung
                // (bukan SSO) SELALU error "Include unexpected".
                attributes: ["id", "nama", "nidn", "nip", "isDosen", "isPegawai"],
                model: Dosen,
                as: "dosen",
                required: false,
            }
        ]
    });

    if (!user) {
        throw new Error("User not found");
    }

    // 3. Compare passwords (I added .trim() just in case of hidden spaces)
    const isMatch = await bcrypt.compare(data.password.trim(), user.password);

    if (!isMatch) {
        throw new Error("Passwords don't match");
    }

    // 4. Generate Token (Remember to move "secret text" to a .env file later!)
    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
        },
        "mGrp2pcdUoy2GJcGQgmKOuutNccZJgOrwRXDzbeYwOhA8vyggf2QOiZBTNl65Lf3",
        { expiresIn: "30d" }
    );

    let accountInfo
    if (user.mahasiswa !== null){
        accountInfo = {
            id: user.mahasiswa.id,
            nama: user.mahasiswa.nama,
            code: user.mahasiswa.npm
        }
    }
    else if (user.dosen !== null){
        // siak_pegawai sekarang tabel gabungan dosen & pegawai non-dosen (lihat
        // migration merge-siak-pegawai-into-siak-dosen) -- pakai nidn kalau ada,
        // fallback ke nip buat pegawai yang bukan dosen.
        accountInfo = {
            id: user.dosen.id,
            nama: user.dosen.nama,
            code: user.dosen.nidn || user.dosen.nip
        }
    }

    console.log(user.userRole)

    // FIX 2026-08-19: kalau siak_user_role kosong (banyak akun emang gak
    // pernah dapet baris eksplisit di sana -- role selama ini kebanyakan
    // ditentuin lewat SSO, dititipin di token doang, gak pernah disinkron ke
    // tabel ini), roles balik [] dan FE (FormLogin.tsx: data.user.roles[0])
    // gak nemu cabang manapun yang cocok -- macet di "Login Berhasil", gak
    // pernah pindah ke dashboard. Sekarang kalau kosong, infer role DASAR
    // dari record yang udah ada (mirip cara SSO nentuin role dari
    // rolePermissions, bukan nge-hardcode admin/koordinator) -- BUKAN
    // AKADEMIK_UNIV, itu tetap harus eksplisit di siak_user_role.
    let roles = user.userRole.map(ur => ur.role.nama);
    if (roles.length === 0) {
        if (user.dosen !== null) roles = ['DOSEN'];
        else if (user.mahasiswa !== null) roles = ['MAHASISWA'];
    }

    const res = {
        token,
        user: {
            id: user.id,
            username: user.username,
            roles
        },
        account_info: accountInfo
    }

    return res
}