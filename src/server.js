import { Worker, isMainThread, parentPort } from 'worker_threads';
import { cpus } from 'os';
import { createServer } from 'http';
import ProxyService from './application/services/ProxyService.js';
import rateLimiter from './infrastructure/middleware/RateLimiterMiddleware.js'
import slowlorisProtection from './infrastructure/middleware/SlowlorisMiddleware.js';
import Config from './config/Config.js';

const numCPUs = cpus().length;
const PORT = Config.PORT || 3000;

if (isMainThread) {
    console.log(`Starting API Gateway on port ${PORT} with ${numCPUs} workers...`);

    const workers = [];

    const server = createServer((req, res) => {
        const requestData = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            remoteAddress: req.socket?.remoteAddress
        };
        const worker = workers[Math.floor(Math.random() * workers.length)];
        worker.postMessage(requestData);

        // Ожидаем ответ от воркера
        worker.once('message', (responseData) => {
            res.writeHead(responseData.statusCode, responseData.headers);
            return res.end(responseData.body);
        });
    });

    server.on('connection', (socket) => {
        slowlorisProtection(socket);
    });

    server.listen(PORT, () => {
        console.log(`🌍 Main server listening on port ${PORT}`);
    });

    for (let i = 0; i < numCPUs; i++) {
        const worker = new Worker(new URL(import.meta.url)).on('exit', (code) => {
            console.error(`Worker exited with code ${code}`);
            if (code !== 0) new Worker(new URL(import.meta.url));
        });
        workers.push(worker);
    }
}
else {
    parentPort.on('message', async (requestData) => {
        try {
            const isAllowed = await rateLimiter(requestData);
            if (!isAllowed) {
                console.warn(`⛔ Rate limit exceeded for ${requestData.headers['x-forwarded-for'] || requestData.remoteAddress || 'unknown IP'}`);
                parentPort.postMessage({
                    statusCode: 429,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Too Many Requests' }),
                });
                return;
            }
            const response = await ProxyService.proxyRequest(requestData);
            parentPort.postMessage(response);
        } catch (err) {
            console.error(`❌ Worker error: ${err.message || err}`);
            console.error(err)
            parentPort.postMessage({
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });
        }
    });
}