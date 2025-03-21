import { createServer } from 'http';
import WorkerManager from '../../infrastructure/workers/WorkerManager.js';
import { loggerMiddleware } from '../../infrastructure/middleware/LoggerMiddleware.js'
import WebSocketController from './WebSocketController.js'
import SlowlorisService from '../../infrastructure/services/SlowlorisService.js'; // Импорт вашего сервиса
import Config from '../../infrastructure/config/Config.js';

export default class ServerManager {
    constructor(port, numCPUs) {
        this.port = port;
        this.workerManager = new WorkerManager(numCPUs);
        this.webSocketController = new WebSocketController();
        this.server = this.createHttpServer();
        this.config = Config;
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
                .catch(err=>{
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
            const slowlorisService = new SlowlorisService(socket, this.config);
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
