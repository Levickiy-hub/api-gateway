import { createServer } from 'http';
import WorkerManager from '../../infrastructure/workers/WorkerManager.js';
import { loggerMiddleware } from '../../infrastructure/middleware/LoggerMiddleware.js'
import WebSocketController from './WebSocketController.js'
import SlowlorisService from '../../infrastructure/services/SlowlorisService.js'; // Импорт вашего сервиса

export default class ServerManager {
    constructor(port, numCPUs, configService, routeRepository) {
        this.port = port;
        this.workerManager = new WorkerManager(numCPUs, configService);
        this.webSocketController = new WebSocketController();
        this.ConfigService = configService;
        this.routeRepository = routeRepository;
        this.server = this.createHttpServer();
    }

    createHttpServer() {
        return createServer((req, res) => {
            loggerMiddleware(req, res);
            this.workerManager.sendRequestToWorker(req)
                .then(workerResponse => {
                    res.statusCode = workerResponse.statusCode;
                    res.headers = workerResponse.headers;
                    res.end(workerResponse.body);
                })
                .catch(err => {
                    res.statusCode = 500;
                    res.end('Internal Server Error');
                    console.error(err);
                });
        });
    }

    setupWebSocket() {
        this.server.on('upgrade', (req, socket, head) => {
            console.log(`🔗 WebSocket upgrade request: ${req.url}`);
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
            console.log(`🌍 API Gateway listening on port ${this.port}`);
        });
    }
}
