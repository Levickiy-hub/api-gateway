import ServerManager from './interfaces/controllers/ServerManager.js';
import Config from './infrastructure/config/Config.js';
import { cpus } from 'os';
import ConfigRepository from './infrastructure/repositories/ConfigRepository.js';

const PORT = Config.PORT || 3000;
const numCPUs = cpus().length;

console.log(`🚀 Starting API Gateway on port ${PORT} with ${numCPUs} workers...`);
const config = new ConfigRepository('./infrastructure/config/services.json');
const serverManager = new ServerManager(PORT, numCPUs);
serverManager.start();
