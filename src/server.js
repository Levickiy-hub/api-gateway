import { createServer } from 'http';
import { cpus } from 'os';
import Config from './config/Config.js';
import WorkerManager from './infrastructure/workers/WorkerManager.js';
import GatewayController from './interfaces/controllers/GatewayController.js';
import slowlorisProtection from './infrastructure/middleware/SlowlorisMiddleware.js';
import { loggerMiddleware } from './infrastructure/middleware/LoggerMiddleware.js';

const PORT = Config.PORT || 3000;
const numCPUs = cpus().length;

console.log(`🚀 Starting API Gateway on port ${PORT} with ${numCPUs} workers...`);

const workerManager = new WorkerManager(numCPUs);

const server = createServer((req, res) => {
    loggerMiddleware(req, res);

    GatewayController.handleRequest(req, res, workerManager);
});

server.on('connection', (socket) => {
    slowlorisProtection(socket);
});

server.listen(PORT, () => {
    console.log(`🌍 API Gateway listening on port ${PORT}`);
});
