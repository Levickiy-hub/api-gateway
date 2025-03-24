import { parentPort, workerData } from 'worker_threads';
import RouteRepository from '../../domain/repositories/RouteRepository.js';
import AuthService from '../../application/services/AuthService.js';
import rateLimiter from '../../infrastructure/middleware/RateLimiterMiddleware.js';
import ProxyService from '../../application/services/ProxyService.js';
import LoadBalancerServers from '../../application/services/LoadBalancerServerService.js'
import CorsService from '../../application/services/CorsService.js';

const config = workerData.config;
const routeRepository = new RouteRepository(config);

const sharedArray = new Int32Array(workerData.sharedBuffer);
const loadBalancing = new LoadBalancerServers(sharedArray);

parentPort.on('message', async (req) => {
    try {
        // 1. Найти целевой бэкенд
        const targetServers = routeRepository.getTarget(req.url);
        if (!targetServers) {
            return parentPort.postMessage({ statusCode: 404, body: 'Not Found' });
        }

        const targetUrl = loadBalancing.selectTargetServer(targetServers.targets, targetServers.loadBalancingStrategy,req).url;
        // 2. Проверить лимиты частоты запросов
        const rateLimited = await rateLimiter(req, targetServers.rateLimit);
        if (rateLimited) {
            return parentPort.postMessage({ statusCode: 429, body: 'Too Many Requests' });
        }

        // 3. Проверить CORS
        if (CorsService.handlePreflight(req)) {
            const corsHeaders = CorsService.getCorsHeaders(req, targetServers);
            return parentPort.postMessage({ statusCode: 204, body: 'No Content', headers: corsHeaders })
        }

        // 4. Проверить права доступа
        const authService = new AuthService(targetServers.security.secretKey);
        if (!authService.isRoutePublic(targetServers)) {  // Проверяем, публичный ли маршрут
            const authResult = authService.validateToken(req.headers['authorization']);
            if (!authResult.isValid) {
                return parentPort.postMessage({ statusCode: 403, body: 'Forbidden' });
            }
        }


        // 5. Проксировать запрос
        const response = await ProxyService.proxyRequest({ ...req }, targetUrl);

        // 6. Вернуть результат
        parentPort.postMessage(response);

    } catch (error) {
        if (error?.message.includes('Target not found')) {
            parentPort.postMessage({ statusCode: 404, body: 'Not Found' });
            return;
        }
        parentPort.postMessage({ statusCode: 500, body: 'Internal Server Error' });
    }
});
