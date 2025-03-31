import { strict as assert } from 'assert';
import ServerManager from '../../src/interfaces/controllers/ServerManager.js';
import { setTimeout } from 'timers/promises';

// Моковый класс WorkerManager
class MockWorkerManager {
    async sendRequestToWorker(request) {
        return { statusCode: 200, headers: {}, body: 'OK' };
    }
}

// Моковый класс ConfigService
class MockConfigService {
    getTimeoutsConfig() {
        return { TIMEOUT_MS: 1500, MAX_IDLE_TIME_MS: 10000, MAX_CONNECTION_DURATION_MS: 900000 };
    }
}

// Моковый класс RouteRepository
class MockRouteRepository {
    getRoutes() {
        return new Map([['/test', { target: 'http://localhost:5000' }]]);
    }
}

(async function testServer() {
    const port = 3000;
    const serverManager = new ServerManager(port, new MockWorkerManager(), new MockConfigService(), new MockRouteRepository());

    await serverManager.start();
    console.log('🚀 Сервер запущен для теста');

    // Даем серверу немного времени запуститься
    await setTimeout(500);

    try {
        // Тестируем эндпоинт `/metrics`
        const res = await fetch(`http://localhost:${port}/metrics`);
        const body = await res.text();

        assert.equal(res.status, 200, 'Должен вернуть 200');
        assert.ok(body.includes('{'), 'Должен вернуть JSON');

        console.log('✅ API Gateway интеграционный тест пройден');
    } catch (error) {
        console.error('❌ Ошибка в тесте:', error);
    } finally {
        serverManager.server.close(() => console.log('🛑 Сервер остановлен после теста'));
    }
})();

