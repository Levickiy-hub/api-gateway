import { logger } from '../services/LoggerService.js';
import UUIDService from '../services/UUIDService.js';

export function loggerMiddleware(req, res) {
    const startTime = process.hrtime();
    const requestId = req.headers['x-request-id'] || UUIDService.generateUUID();
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;

    // Логируем входящий запрос
    const { method, url, headers } = req;
    const requestBody = [];
    const responseBody = [];

    req.on('data', (chunk) => {
        requestBody.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on('end', async () => {
        const parsedBody = Buffer.concat(requestBody).toString();

        await logger.access('Входящий запрос', {
            requestId,
            clientIp,
            method,
            url,
            headers,
            body: parsedBody || null
        });
    });

    // Перехватываем тело ответа
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (chunk, encoding, callback) {
        responseBody.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return originalWrite.apply(res, arguments);
    };

    res.end = function (chunk, encoding, callback) {
        if (chunk) {
            responseBody.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        originalEnd.apply(res, arguments);
    };

    // Логируем исходящий ответ
    res.on('finish', async () => {
        const duration = process.hrtime(startTime);
        const latency = (duration[0] * 1000 + duration[1] / 1e6).toFixed(2);
        const parsedResponseBody = Buffer.concat(responseBody).toString();

        await logger.access('Исходящий ответ', {
            requestId,
            clientIp,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            responseTimeMs: latency,
            responseBody: parsedResponseBody || null
        });
    });
}
