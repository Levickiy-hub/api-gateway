import ServerManager from './interfaces/controllers/ServerManager.js';
import Config from './infrastructure/config/Config.js';
import { cpus } from 'os';
import ConfigRepository from './infrastructure/repositories/ConfigRepository.js';
import RouteRepository from './domain/repositories/RouteRepository.js';

const PORT = Config.PORT || 3000;
const numCPUs = cpus().length;

console.log(`🚀 Starting API Gateway on port ${PORT} with ${numCPUs} workers...`);
const config = new ConfigRepository('./infrastructure/config/services.json');
const routeRepository = new RouteRepository(config.getConfig());
const serverManager = new ServerManager(config, routeRepository.getRoutes());
serverManager.start();
