import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import models from '../../models/index.js';
import { addUserToBlacklist, removeUserFromBlacklist } from '../../utils/tokenBlacklist.js';

const { Mahasiswa } = models;
const router = express.Router();
const EPORTAL_API = process.env.EPORTAL_API_URL || 'https://eportal.uika-bogor.ac.id';

router.get('/callback', async (req, res) => {
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

        // Helper cek nilai valid (bukan null, undefined, atau string "null")
        const isValid = (val) => val && val.toString().trim() !== 'null' && val.toString().trim() !== 'undefined' && val.toString().trim() !== '';

        let nama = eportalUser.email;
        let siakadUserId = null;
        let siakadRole = 'MAHASISWA';

        if (roleUpper === 'MAHASISWA' && isValid(eportalUser.npm)) {
            const mahasiswa = await Mahasiswa.findOne({
                where: { npm: eportalUser.npm },
                attributes: ['nama', 'npm', 'siakUserId'],
            });
            if (mahasiswa) {
                nama = mahasiswa.nama;
                siakadUserId = mahasiswa.siakUserId;
                siakadRole = 'MAHASISWA';
            }

        } else if (roleUpper === 'DOSEN' && isValid(eportalUser.nidn)) {
            const nidn = eportalUser.nidn;
            const nidnWithZero = nidn.startsWith('0') ? nidn : '0' + nidn;
            const nidnWithoutZero = nidn.replace(/^0+/, '');

            const dosenResult = await models.sequelize.query(
                `SELECT id, siak_user_id, nama FROM siak_dosen 
                 WHERE nidn IN (:nidn, :nidnWithZero, :nidnWithoutZero) 
                 AND deleted_at IS NULL LIMIT 1`,
                {
                    replacements: { nidn, nidnWithZero, nidnWithoutZero },
                    type: models.sequelize.QueryTypes.SELECT,
                }
            );

            if (dosenResult.length > 0) {
                nama = dosenResult[0].nama;
                siakadUserId = dosenResult[0].siak_user_id;
                siakadRole = 'DOSEN';
            }

        } else if (['PEGAWAI', 'ADMIN'].includes(roleUpper)) {
            // Cari di siak_pegawai by email
            const pegawaiResult = await models.sequelize.query(
                `SELECT sp.id, sp.siak_user_id, sp.nama 
                FROM siak_pegawai sp
                JOIN siak_user su ON su.id = sp.siak_user_id
                WHERE su.email = :email
                AND sp.deleted_at IS NULL LIMIT 1`,
                {
                    replacements: { email: eportalUser.email },
                    type: models.sequelize.QueryTypes.SELECT,
                }
            );

            if (pegawaiResult.length > 0) {
                nama = pegawaiResult[0].nama;
                siakadUserId = pegawaiResult[0].siak_user_id;
                siakadRole = 'AKADEMIK_UNIV';
            }
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