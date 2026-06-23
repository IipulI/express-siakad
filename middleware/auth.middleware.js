import { expressjwt } from 'express-jwt';
import 'dotenv/config';

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