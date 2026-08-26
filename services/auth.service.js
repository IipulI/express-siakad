import models from "../models/index.js"
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt";
import { Op } from "sequelize"

const { Mahasiswa, Dosen, User, UserRole, Role, ProgramStudi } = models;

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
                attributes: ["id", "nama", 'npm', 'semester'],
                model: Mahasiswa,
                as: "mahasiswa",
                required: false,
            },
            {
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

    let roles = user.userRole.map(ur => ur.role.nama);
    if (roles.length === 0) {
        if (user.dosen !== null) {
            const kaprodiDi = await ProgramStudi.findOne({ where: { kaprodiId: user.dosen.id }, attributes: ['id'] });
            roles = kaprodiDi ? ['AKADEMIK_UNIV'] : ['DOSEN'];
        } else if (user.mahasiswa !== null) {
            roles = ['MAHASISWA'];
        }
    }

    // 4. Generate Token (Remember to move "secret text" to a .env file later!)
    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            roles,
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
        accountInfo = {
            id: user.dosen.id,
            nama: user.dosen.nama,
            code: user.dosen.nidn || user.dosen.nip
        }
    }

    console.log(user.userRole)

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