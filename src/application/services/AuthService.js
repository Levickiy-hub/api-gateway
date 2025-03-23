import crypto from 'crypto';

export default class AuthService {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }

    validateToken(authHeader) {
        if (!authHeader) return { isValid: false, error: 'Missing token' };

        const token = authHeader.split(' ')[1]; // Ожидаем "Bearer <token>"
        if (!token) return { isValid: false, error: 'Invalid token format' };

        const [headerB64, payloadB64, signatureB64] = token.split('.');
        if (!headerB64 || !payloadB64 || !signatureB64) {
            return { isValid: false, error: 'Invalid JWT structure' };
        }

        try {
            // Декодируем header и payload
            const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf8'));
            const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));

            // Проверяем срок действия токена
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                return { isValid: false, error: 'Token expired' };
            }

            // Проверяем подпись токена (HS256)
            if (header.alg !== 'HS256') {
                return { isValid: false, error: 'Unsupported algorithm' };
            }

            const expectedSignature = crypto
                .createHmac('sha256', this.secretKey)
                .update(`${headerB64}.${payloadB64}`)
                .digest('base64url');

            if (signatureB64 !== expectedSignature) {
                return { isValid: false, error: 'Invalid signature' };
            }

            return { isValid: true, user: payload };

        } catch (error) {
            return { isValid: false, error: 'Invalid token' };
        }
    }

    isRoutePublic(routeConfig) {
        return routeConfig?.security?.public === true;
    }
}
