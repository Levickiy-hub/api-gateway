import { parentPort, workerData } from 'worker_threads';
import RouteRepository from '../../domain/repositories/RouteRepository.js';
import AuthService from '../../application/services/AuthService.js';
import rateLimiter from '../../infrastructure/middleware/RateLimiterMiddleware.js';
import ProxyService from '../../application/services/ProxyService.js';
import LoadBalancerServers from '../../application/services/LoadBalancerServerService.js'
import CorsService from '../../application/services/CorsService.js';
import GeoBalancingService from '../../domain/services/GeoBalancingService.js';

const config = workerData.config;
const routeRepository = new RouteRepository(config);

const loadBalancerArray = new Int32Array(workerData.loadBalancerBuffer );
const loadBalancing = new LoadBalancerServers(loadBalancerArray);

const geoCacheArray = new Int32Array(workerData.geoCacheBuffer)
const geoBalancing = new GeoBalancingService(geoCacheArray);

parentPort.on('message', async (requestDto) => {
    try {
        const targetServers = routeRepository.getTarget(requestDto.url);
        if (!targetServers) {
            return parentPort.postMessage({ statusCode: 404, body: 'Not Found' });
        }
        const geoBalancedServers = await geoBalancing.findServers(requestDto, targetServers);

        const targetUrl = loadBalancing.selectTargetServer(geoBalancedServers.targets, targetServers.loadBalancingStrategy, requestDto).url;

        const rateLimited = await rateLimiter(requestDto, targetServers.rateLimit);
        if (rateLimited) {
            return parentPort.postMessage({ statusCode: 429, body: 'Too Many requests' });
        }

        if (CorsService.handlePreflight(requestDto)) {
            const corsHeaders = CorsService.getCorsHeaders(requestDto, targetServers);
            return parentPort.postMessage({ statusCode: 204, body: 'No Content', headers: corsHeaders })
        }

        const authService = new AuthService(targetServers.security.secretKey);
        if (!authService.isRoutePublic(targetServers)) {  // Проверяем, публичный ли маршрут
            const authResult = authService.validateToken(requestDto.headers['authorization']);
            if (!authResult.isValid) {
                return parentPort.postMessage({ statusCode: 403, body: 'Forbidden' });
            }
        }

        const response = await ProxyService.proxyRequest({ ...requestDto }, targetUrl);
        parentPort.postMessage(response);

    } catch (error) {
        if (error?.message.includes('Target not found')) {
            parentPort.postMessage({ statusCode: 404, body: 'Not Found' });
            return;
        }
        parentPort.postMessage({ statusCode: 500, body: 'Internal Server Error' });
    }
});
