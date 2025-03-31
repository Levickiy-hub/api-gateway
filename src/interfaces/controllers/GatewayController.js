import RequestDTO from '../../domain/dtos/RequestDto.js';
import { logger } from '../../infrastructure/services/LoggerService.js';
import { loggerMiddleware } from '../../infrastructure/middleware/LoggerMiddleware.js'

export default class GatewayController {
    constructor(workerManager, monitoringService) {
        this.workerManager = workerManager;
        this.monitoringService = monitoringService;
    }

    async handleRequest(req, res) {
        const start = Date.now();
        const requestDTO = new RequestDTO(req);

        try {
            if (this._isMetricsRequest(requestDTO)) {
                return this._sendMetric(res);
            }

            loggerMiddleware(req, res);
            const workerResponse = await this.workerManager.sendRequestToWorker(requestDTO);
            this._sendResponse(res, workerResponse);
        } catch (error) {
            this._handleError(res, error);
        } finally {
            const duration = Date.now() - start;
            this.monitoringService.logRequest(req, res, duration);
        }
    };

    _isMetricsRequest(requestDTO) {
        return requestDTO.url === '/metrics' && requestDTO.method === 'GET';
    }

    _sendMetric(res) {
        const metrics = JSON.stringify(this.monitoringService.getMetrics(), null, 2);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(metrics);
    }

    _sendResponse(res, workerResponse) {
        res.statusCode = workerResponse.statusCode;
        res.headers = workerResponse.headers;
        res.end(workerResponse.body);
    }

    _handleError(res, error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
        logger.error(`Request failed: ${error.stack}`);
    }
}