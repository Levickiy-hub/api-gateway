import rateLimiter from '../../infrastructure/middleware/RateLimiterMiddleware.js';
import { logger } from '../../infrastructure/services/LoggerService.js';

export default class GatewayController {
    static async handleRequest(req, res, workerManager) {
        const requestData = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            remoteAddress: req.socket?.remoteAddress
        };

        try {
            const isAllowed = await rateLimiter(requestData);
            if (!isAllowed) {
                logger.warn(`⛔ Rate limit exceeded for ${requestData.headers['x-forwarded-for'] || requestData.remoteAddress || 'unknown IP'}`);
                res.writeHead(429, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Too Many Requests' }));
            }

            const responseData = await workerManager.sendRequestToWorker(requestData);
            res.writeHead(responseData.statusCode, responseData.headers);
            return res.end(responseData.body);
        } catch (err) {
            logger.error(`❌ Error handling request: ${err.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    }
}