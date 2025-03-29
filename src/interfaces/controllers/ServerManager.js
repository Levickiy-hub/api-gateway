import { loggerMiddleware } from '../../infrastructure/middleware/LoggerMiddleware.js'
import WebSocketController from './WebSocketController.js'
import SlowlorisService from '../../infrastructure/services/SlowlorisService.js';
import { logger } from '../../infrastructure/services/LoggerService.js';
import HttpServerFactory from '../../application/services/HttpServerFactory.js'
import MonitoringService from '../../application/services/MonitoringService.js';
import RequestDTO from '../../domain/dtos/RequestDto.js';

export default class ServerManager {
    constructor(port, workerManager, configService, routeRepository) {
        this.port = port;
        this.workerManager = workerManager;
        this.webSocketController = new WebSocketController(routeRepository);
        this.monitoringService = new MonitoringService();
        this.ConfigService = configService;
        this.routeRepository = routeRepository;
        this.server = null;
    }

    async createHttpServer() {
        const requestHandler = async (req, res) => {
            const start = Date.now();

            const requestDTO = new RequestDTO(req);

            if (requestDTO.url === '/metrics' && requestDTO.method === 'GET') {
                const metrics = JSON.stringify(this.monitoringService.getMetrics(), null, 2);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(metrics);
                return;
            }
            
            try {
                loggerMiddleware(req, res);
                const workerResponse = await this.workerManager.sendRequestToWorker(requestDTO);
                res.statusCode = workerResponse.statusCode;
                res.headers = workerResponse.headers;
                res.end(workerResponse.body);
            } catch (error) {
                res.statusCode = 500;
                res.end('Internal Server Error');
                logger.error(error);
            } finally {
                const duration = Date.now() - start;
                this.monitoringService.logRequest(req, res, duration);
            }
        };
        this.server = await HttpServerFactory.createServer(requestHandler);
    }

    setupWebSocket() {
        this.server.on('upgrade', (req, socket, head) => {
            logger.info(`🔗 WebSocket upgrade request: ${req.url}`);
            this.monitoringService.incrementWebSocketConnections();
            this.webSocketController.handleUpgrade(req, socket, head);
        });
    }

    setupSlowlorisProtection() {
        this.server.on('connection', (socket) => {
            const slowlorisService = new SlowlorisService(socket, this.ConfigService.getTimeoutsConfig());
            slowlorisService.start();
        });
    }

    async start() {
        await this.createHttpServer();
        this.setupWebSocket();
        this.setupSlowlorisProtection();
        this.server.listen(this.port, () => {
            logger.info(`🌍 API Gateway listening on port ${this.port}`);
        });
    }
}
