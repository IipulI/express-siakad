import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import models from '../../models/index.js';
import { addUserToBlacklist, removeUserFromBlacklist } from '../../utils/tokenBlacklist.js';
import { UnprocessableEntityError } from "../../utils/custom-error.js";

const { Mahasiswa } = models;
const router = express.Router();
const EPORTAL_API = process.env.EPORTAL_API_URL || 'https://eportal.uika-bogor.ac.id';

router.get('/callback', async (req, res, next) => {
    const { token, role_id, appModule_id, unit_id } = req.query;

    if (!token || !role_id || !appModule_id) {
        return res.status(400).json({ status: 400, message: 'Parameter SSO tidak lengkap.' });
    }

    try {
        const { data: eportalRes } = await axios.post(
            `${EPORTAL_API}/api/sso/introspect`,
            {},
            {
                headers: {
                    'X-SSO-Client-ID': process.env.SSO_CLIENT_ID,
                    'X-SSO-Client-Secret': process.env.SSO_CLIENT_SECRET,
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        let parsedRes = eportalRes;
        if (typeof eportalRes === 'string') {
            const jsonMatch = eportalRes.match(/\{.*\}/s);
            if (jsonMatch) parsedRes = JSON.parse(jsonMatch[0]);
        }

        if (parsedRes.status !== 200 || !parsedRes.valid) {
            return res.status(401).json({ status: 401, message: 'Sesi E-Portal tidak valid.' });
        }

        const eportalUser = parsedRes.user;
        const institutionalRole = eportalUser.institutional_role || eportalUser.role;
        const roleUpper = institutionalRole?.toUpperCase();
        const rolePermissions = parsedRes.access.role_permissions

        // Helper cek nilai valid (bukan null, undefined, atau string "null")
        const isValid = (val) => val && val.toString().trim() !== 'null' && val.toString().trim() !== 'undefined' && val.toString().trim() !== '';

        let nama = eportalUser.email;
        let siakadUserId = null;
        let siakadRole = null

        let accountInfo = {}
        // FIX 2026-08-19: sama kayak cabang admin di bawah -- commit 28a7d8e
        // ganti cek dari institutional_role (roleUpper === 'MAHASISWA'/'DOSEN')
        // ke rolePermissions doang, jadi lebih sempit. Digabung lagi biar gak
        // nge-exclude akun yang institutional_role-nya udah bener tapi
        // permission granularnya belum di-setting di e-portal.
        if (rolePermissions.includes('mahasiswa.siakad.view') || (roleUpper === 'MAHASISWA' && isValid(eportalUser.npm))) {
            const mahasiswa = await Mahasiswa.findOne({
                where: { npm: eportalUser.npm },
                attributes: ['id', 'nama', 'npm', 'semester', 'siakUserId'],
            });
            if (mahasiswa) {
                accountInfo.nama = mahasiswa.nama
                accountInfo.npm = mahasiswa.npm
                accountInfo.semester = mahasiswa.semester
                nama = mahasiswa.nama;
                siakadUserId = mahasiswa.siakUserId;
                siakadRole = 'MAHASISWA';
            }

        } else if (rolePermissions.includes('dosen.siakad.view') || (roleUpper === 'DOSEN' && isValid(eportalUser.nidn))) {
            // FIX 2026-08-19: e-portal kadang ngirim NIP di field nidn (dengan
            // spasi nempel), bukan NIDN asli -- tambah trim + fallback cocokin
            // ke kolom nip juga, supaya dosen kayak gini tetap kebaca.
            const nidn = (eportalUser.nidn || '').trim();
            const nidnWithZero = nidn.startsWith('0') ? nidn : '0' + nidn;
            const nidnWithoutZero = nidn.replace(/^0+/, '');

            const dosenResult = await models.sequelize.query(
                `SELECT id, siak_user_id, nama FROM siak_pegawai
                 WHERE (nidn IN (:nidn, :nidnWithZero, :nidnWithoutZero) OR nip = :nidn)
                 AND deleted_at IS NULL LIMIT 1`,
                {
                    replacements: { nidn, nidnWithZero, nidnWithoutZero },
                    type: models.sequelize.QueryTypes.SELECT,
                }
            );

            if (dosenResult.length > 0) {
                accountInfo.nama = dosenResult.nama
                accountInfo.code = dosenResult.nip

                nama = dosenResult[0].nama;
                siakadUserId = dosenResult[0].siak_user_id;
                siakadRole = 'DOSEN';
            }

        } else if (
            rolePermissions.includes('admin.siakad.view') ||
            ['PEGAWAI', 'ADMIN'].includes(roleUpper) ||
            // FIX 2026-08-19b: ['PEGAWAI','ADMIN'].includes(roleUpper) itu exact-match,
            // padahal jabatan riil di e-portal namanya majemuk kayak "Admin Kepegawaian"
            // atau "Kabiro" (bukan cuma "Admin" polos) -- roleUpper-nya jadi gak pernah
            // sama persis, ketolak ke branch else (mentok di 500 "User tidak dapat
            // ditemukan") walau role_permissions utk role_id itu emang belum di-set
            // e-portal. Tambah partial-match utk 2 jabatan yang udah kekonfirmasi dites
            // user (Admin Kepegawaian, Kabiro) -- role lain yang belum pernah disebut
            // TETAP gak ditambah, sengaja gak nebak2.
            roleUpper?.includes('ADMIN') || roleUpper?.includes('PEGAWAI') || roleUpper?.includes('KABIRO')
        ) {
            // FIX 2026-08-19: commit 28a7d8e ganti cek admin dari institutional_role
            // (broad: PEGAWAI/ADMIN) ke rolePermissions.includes('admin.siakad.view')
            // doang (sempit: butuh permission spesifik itu ada di e-portal). Beberapa
            // role kayak Kabiro/Admin Kepegawaian institutional_role-nya PEGAWAI/ADMIN
            // tapi belum tentu punya permission granular 'admin.siakad.view' di
            // e-portal -- jadi ketolak padahal dulu jalan. Sekarang diterima kalau
            // SALAH SATU kriteria (permission spesifik ATAU institutional_role lama)
            // kepenuhan, biar gak nge-exclude role yang dulu udah bisa masuk.
            // Cari di siak_pegawai by email, fallback ke nidn/nip -- email e-portal
            // kadang beda sama email lokal siak_pegawai (kasus nyata: Fitrah Satrya,
            // email e-portal fitrah.satrya@gmail.com vs email lokal beda), NIDN lebih
            // stabil buat dicocokin (sama kayak yang dipakai cabang DOSEN di atas).
            const nidnRaw = (eportalUser.nidn || '').trim();
            const nidn = isValid(nidnRaw) ? nidnRaw : null;
            const nidnWithZero = nidn ? (nidn.startsWith('0') ? nidn : '0' + nidn) : null;
            const nidnWithoutZero = nidn ? nidn.replace(/^0+/, '') : null;

            const pegawaiResult = await models.sequelize.query(
                `SELECT sp.id, sp.siak_user_id, sp.nama, sp.nip
                FROM siak_pegawai sp
                WHERE (sp.email = :email OR sp.nidn IN (:nidn, :nidnWithZero, :nidnWithoutZero) OR sp.nip = :nidn)
                AND sp.deleted_at IS NULL LIMIT 1`,
                {
                    replacements: { email: eportalUser.email, nidn, nidnWithZero, nidnWithoutZero },
                    type: models.sequelize.QueryTypes.SELECT,
                }
            );

            if (pegawaiResult.length > 0) {
                accountInfo.nama = pegawaiResult.nama
                accountInfo.code = pegawaiResult.nip

                nama = pegawaiResult[0].nama;
                siakadUserId = pegawaiResult[0].siak_user_id;
                siakadRole = 'AKADEMIK_UNIV';
            }
        } else {
            throw new UnprocessableEntityError("User tidak dapat ditemukan")
        }

        console.log('[SSO] siakadUserId:', siakadUserId, '| role:', siakadRole);

        const eportalUserId = eportalUser.sso_id || eportalUser.id;
        removeUserFromBlacklist(eportalUserId);

        const siakadToken = jwt.sign(
            {
                id: siakadUserId,
                username: eportalUser.npm || eportalUser.nidn || eportalUser.email,
                roles: [siakadRole],
                eportal_user_id: eportalUserId,
            },
            process.env.THIRD_PARTY_JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            status: 200,
            message: 'SSO SIAKAD berhasil.',
            data: {
                token: siakadToken,
                user: {
                    id: siakadUserId,
                    username: eportalUser.npm || eportalUser.nidn || eportalUser.email,
                    roles: [siakadRole],
                },
                account_info: {
                    id: siakadUserId,
                    nama: nama,
                    code: eportalUser.npm || eportalUser.nidn || eportalUser.email,
                },
            },
        });

    } catch (error) {
        console.error('[SSO SIAKAD Error]', error.message);
        return res.status(500).json({
            status: 500,
            message: 'Internal server error saat verifikasi ke SSO E-Portal.',
            debug: error.response?.data?.message || error.message,
        });
    }
});

router.post('/logout', async (req, res) => {
    console.log('[SSO Logout] SIAKAD hit, body:', req.body);

    const { user_id, secret } = req.body;
    const validSecret = process.env.EXTERNAL_SYNC_API_KEY || 'secret_sso_uika';

    if (secret !== validSecret) {
        return res.status(401).json({ status: 401, message: 'Invalid secret.' });
    }

    if (!user_id) {
        return res.status(400).json({ status: 400, message: 'user_id wajib diisi.' });
    }

    addUserToBlacklist(user_id);
    return res.json({ status: 200, message: `User ${user_id} berhasil di-logout dari SIAKAD.` });
});

export default router;