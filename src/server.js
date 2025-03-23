import ServerManager from './interfaces/controllers/ServerManager.js';
import ConfigService from './infrastructure/services/ConfigService.js';
import RouteRepository from './domain/repositories/RouteRepository.js';

// Шаг 1: Загружаем конфиг
const configService = new ConfigService('./infrastructure/config/services.json');

// Шаг 2: Создаем репозиторий маршрутов
const routeRepository = new RouteRepository(configService.getConfig());

// Получаем глобальные настройки
const PORT = configService.getGlobalConfig().port || 3000;
const numCPUs = configService.getGlobalConfig().numWorkers;

console.log(`🚀 Starting API Gateway on port ${PORT} with ${numCPUs} workers...`);

// Шаг 3: Запускаем сервер
const serverManager = new ServerManager(PORT, numCPUs, configService, routeRepository);
serverManager.start();
