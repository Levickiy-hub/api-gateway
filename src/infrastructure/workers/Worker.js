import { parentPort } from 'worker_threads';
import ConfigService from '../services/ConfigService.js';
import RouteRepository from '../../domain/repositories/RouteRepository.js';
// import AuthService from '../../application/services/AuthService.js';
import rateLimiter from '../../infrastructure/middleware/RateLimiterMiddleware.js';
// import CorsService from '../../application/services/CorsService.js';
import ProxyService from '../../application/services/ProxyService.js';

// Загружаем конфиг и маршруты при старте воркера (чтобы не загружать их на каждый запрос)
const configService = new ConfigService('./infrastructure/config/services.json');
const routeRepository = new RouteRepository(configService.getConfig());

parentPort.on('message', async (req) => {
    try {
        // 1. Найти целевой бэкенд
        const targetUrl = routeRepository.getTarget(req.url);
        if(!targetUrl){
            return parentPort.postMessage({ statusCode: 404, body: 'Not Found' });
        }

        // 2. Проверить лимиты частоты запросов
        const rateLimited = await rateLimiter(req);
        if (rateLimited) {
            return parentPort.postMessage({ statusCode: 429, body: 'Too Many Requests' });
        }
       
        // 3. Проверить CORS
        // const corsHeaders = CorsService.getCorsHeaders(req);

        // 4. Проверить права доступа
        // const isAuthenticated = AuthService.validateToken(req.headers['authorization']);
        // if (!isAuthenticated) {
        //     return parentPort.postMessage({ statusCode: 403, body: 'Forbidden' });
        // }


        // 5. Проксировать запрос
        const response = await ProxyService.proxyRequest({ ...req }, targetUrl);

        // 6. Вернуть результат
        parentPort.postMessage(response);

    } catch (error) {
        if(error?.message.includes('Target not found')){
            parentPort.postMessage({ statusCode: 404, body: 'Not Found' });
            return;
        }
        parentPort.postMessage({ statusCode: 500, body: 'Internal Server Error' });
    }
});
