import { createServer } from 'http';
import WorkerManager from '../../infrastructure/workers/WorkerManager.js';
import { loggerMiddleware } from '../../infrastructure/middleware/LoggerMiddleware.js'
import WebSocketController from './WebSocketController.js'
import SlowlorisService from '../../infrastructure/services/SlowlorisService.js';
import { logger } from '../../infrastructure/services/LoggerService.js';
import  tlsService  from '../../infrastructure/services/TLSService.js';

export default class ServerManager {
    constructor(port, numCPUs, configService, routeRepository) {
        this.port = port;
        this.workerManager = new WorkerManager(numCPUs, configService);
        this.webSocketController = new WebSocketController(routeRepository);
        this.ConfigService = configService;
        this.routeRepository = routeRepository;
        this.server = this.createHttpServer();
        this.cert = tlsService.getConfig();
    }

    createHttpServer() {
        return createServer(async (req, res) => {
            try {
                loggerMiddleware(req, res);
                const workerResponse = await this.workerManager.sendRequestToWorker(req);
                res.statusCode = workerResponse.statusCode;
                res.headers = workerResponse.headers;
                res.end(workerResponse.body);
            }
            catch (error) {
                res.statusCode = 500;
                res.end('Internal Server Error');
                logger.error(error);
            }
        });
    }

    setupWebSocket() {
        this.server.on('upgrade', (req, socket, head) => {
            logger.info(`🔗 WebSocket upgrade request: ${req.url}`);
            this.webSocketController.handleUpgrade(req, socket, head);
        });
    }

    setupSlowlorisProtection() {
        this.server.on('connection', (socket) => {
            const slowlorisService = new SlowlorisService(socket, this.ConfigService.getTimeoutsConfig());
            slowlorisService.start();
        });
    }

    start() {
        this.setupWebSocket();
        this.setupSlowlorisProtection();
        this.server.listen(this.port, () => {
            logger.info(`🌍 API Gateway listening on port ${this.port}`);
        });
    }
}
