import AppFactory from './infrastructure/factories/AppFactory.js';
import { logger } from './infrastructure/services/LoggerService.js';

(async () => {
    try {
        const app = await AppFactory.create();
        await app.start();
    } catch (error) {
        logger.error('Error starting the API Gateway', {
            message: error.message,
            stack: error.stack
        });
        process.exit(1); // Завершаем процесс, если ошибка критическая
    }
})();
