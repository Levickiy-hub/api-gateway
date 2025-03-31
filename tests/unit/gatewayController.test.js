import { strict as assert } from 'assert';
import GatewayController from '../../src/interfaces/controllers/GatewayController.js';
import { EventEmitter } from 'events';

class MockWorkerManager {
    async sendRequestToWorker(request) {
        return { statusCode: 200, headers: {}, body: 'OK' };
    }
}
class MockMonitoringService {
    logRequest() {}
    getMetrics() { return {}; }
}

// Создаем моковый объект req, который поддерживает события
class MockRequest extends EventEmitter {
    constructor(url, method, headers = {}, ip = '::123') {
        super();
        this.url = url;
        this.method = method;
        this.headers = headers;
        this.socket = { remoteAddress: ip };
    }
}

// Создаем моковый объект res
class MockResponse extends EventEmitter {
    constructor() {
        super();
        this.statusCode = null;
        this.headers = {};
        this.body = '';
    }
    writeHead(code, headers) {
        this.statusCode = code;
        this.headers = headers;
    }
    end(data) {
        this.body = data;
        this.emit('finish'); // Эмитируем событие 'finish', чтобы middleware могло на него подписаться
    }
}

(async function testGatewayController() {
    const workerManager = new MockWorkerManager();
    const monitoringService = new MockMonitoringService();
    const controller = new GatewayController(workerManager, monitoringService);

    const req = new MockRequest('/test', 'GET'); // Создаем объект с поддержкой событий
    const res = new MockResponse();

    await controller.handleRequest(req, res);

    assert.equal(res.statusCode, 200, 'Должен вернуть 200 OK');
    assert.equal(res.body, 'OK', 'Ответ должен быть "OK"');

    console.log('✅ GatewayController passed');
})();
