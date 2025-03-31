import ServerManager from '../../interfaces/controllers/ServerManager.js';
import ConfigService from '../services/ConfigService.js';
import RouteRepository from '../../domain/repositories/RouteRepository.js';
import WorkerManager from '../workers/WorkerManager.js';
import { logger } from '../services/LoggerService.js';

export default class AppFactory {
    static async create() {
        try {
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
            return new ServerManager(PORT, workerManager, configService, routeRepository);
        } catch (error) {
            throw new Error('Failed to create app components: ' + error.message);
        }
    }
}
