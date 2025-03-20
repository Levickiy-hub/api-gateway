import { logger } from '../services/LoggerService.js';
import UUIDService from '../services/UUIDService.js';

export function loggerMiddleware(req, res) {
    const startTime = process.hrtime(); // Засекаем время
    const requestId = req.headers['x-request-id'] || UUIDService.generateUUID(); // Берем из заголовка или создаем новый

    // Логируем входящий запрос
    const { method, url, headers } = req;
    const requestBody = [];

    req.on('data', (chunk) => {
        requestBody.push(chunk);
    });

    req.on('end', async () => {
        const parsedBody = Buffer.concat(requestBody).toString();

        logger.info(`🆔 [${requestId}] 📥 Входящий запрос: ${method} ${url}
🔹 Заголовки: ${JSON.stringify(headers)}
🔹 Тело: ${parsedBody || 'Нет данных'}`);
    });


    // Логируем исходящий ответ через событие 'finish' у response
    res.on('finish', () => {
        const duration = process.hrtime(startTime);
        const latency = (duration[0] * 1000 + duration[1] / 1e6).toFixed(2);
        
        logger.info(`🆔 [${requestId}] 📤 Исходящий ответ: ${res.statusCode} ${res.statusMessage}
🔹 Время обработки: ${latency} мс'}`);
    });
}
