import { expressjwt } from 'express-jwt';
import 'dotenv/config';
import { isUserBlacklisted } from '../utils/tokenBlacklist.js';

const SSO_SECRET_KEY = process.env.THIRD_PARTY_JWT_SECRET;
if (!SSO_SECRET_KEY) {
    throw new Error('THIRD_PARTY_JWT_SECRET must be defined in your .env file');
}

export const verifySsoToken = expressjwt({
    secret: SSO_SECRET_KEY,
    algorithms: ['HS256'],
    getToken: (req) => {
        // Coba dari header Authorization dulu
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }
        // Fallback dari query param (untuk SSO callback)
        if (req.query.token) {
            return req.query.token;
        }
        return null;
    },
});

export const checkBlacklist = (req, res, next) => {
    const user = req.auth; // express-jwt simpan decoded token di req.auth
    const userIdToCheck = user?.eportal_user_id || user?.id;

    if (userIdToCheck && isUserBlacklisted(userIdToCheck)) {
        return res.status(401).json({
            status: 401,
            message: 'Session telah berakhir. Silakan login kembali.'
        });
    }
    next();
};