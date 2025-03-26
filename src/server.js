import ServerManager from './interfaces/controllers/ServerManager.js';
import ConfigService from './infrastructure/services/ConfigService.js';
import RouteRepository from './domain/repositories/RouteRepository.js';
import { logger } from './infrastructure/services/LoggerService.js';
import WorkerManager from './infrastructure/workers/WorkerManager.js'

const configService = new ConfigService('./infrastructure/config/services.json');
const routeRepository = new RouteRepository(configService.getConfig());

const globalConfig = configService.getGlobalConfig();
const numCPUs = globalConfig.numWorkers || 4;
const PORT = globalConfig.port || 3000;

if (!globalConfig.numWorkers) {
    logger.warn('Number of workers not specified, defaulting to 4.');
}
if (!globalConfig.port) {
    logger.warn('Port not specified, defaulting to 3000.');
}

const workerManager = new WorkerManager(numCPUs, configService);

(async () => {
    try {
        logger.info(`🚀 Starting API Gateway on port ${PORT} with ${numCPUs} workers...`);

        const serverManager = new ServerManager(PORT, workerManager, configService, routeRepository);
        await serverManager.start();
    } catch (error) {
        logger.error('Error starting the API Gateway', {
            message: error.message,
            stack: error.stack
        });
        process.exit(1); // Завершаем процесс с кодом ошибки
    }
})();
