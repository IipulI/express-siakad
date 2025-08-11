import { expressjwt } from 'express-jwt';
import 'dotenv/config';

const SSO_SECRET_KEY = process.env.THIRD_PARTY_JWT_SECRET;
if (!SSO_SECRET_KEY) {
    throw new Error('THIRD_PARTY_JWT_SECRET must be defined in your .env file');
}

export const verifySsoToken = expressjwt({
    secret: SSO_SECRET_KEY,
    algorithms: ['HS256'],
});