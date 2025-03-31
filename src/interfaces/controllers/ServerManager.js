import WebSocketController from './WebSocketController.js'
import SlowlorisService from '../../infrastructure/services/SlowlorisService.js';
import { logger } from '../../infrastructure/services/LoggerService.js';
import HttpServerFactory from '../../application/services/HttpServerFactory.js'
import MonitoringService from '../../application/services/MonitoringService.js';
import GatewayController from './GatewayController.js';

export default class ServerManager {
    constructor(port, workerManager, configService, routeRepository) {
        this.port = port;
        this.workerManager = workerManager;
        this.webSocketController = new WebSocketController(routeRepository);
        this.monitoringService = new MonitoringService();
        this.ConfigService = configService;
        this.routeRepository = routeRepository;
        this.gatewayController = new GatewayController(workerManager, this.monitoringService);
        this.server = null;
    }

    async createHttpServer() {
        const requestHandler = async (req, res) => {
            await this.gatewayController.handleRequest(req, res);
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
