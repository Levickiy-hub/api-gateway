import { Worker, isMainThread, parentPort } from 'worker_threads';
import { cpus } from 'os';
import { createServer } from 'http';
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
        };

        const worker = workers[Math.floor(Math.random() * workers.length)];
        worker.postMessage(requestData);

        // Ожидаем ответ от воркера
        worker.once('message', (responseData) => {
            res.writeHead(responseData.statusCode, responseData.headers);
            console.log(123)
             return res.end(responseData.body);
        });
    });

    server.listen(PORT, () => {
        console.log(`🌍 Main server listening on port ${PORT}`);
    });

    for (let i = 0; i < numCPUs; i++) {
        const worker = new Worker(new URL(import.meta.url)).on('exit', (code) => {
            console.error(`Worker exited with code ${code}`);
            if (code !== 0) new Worker(new URL(import.meta.url));
        });
        workers.push(worker)
    }
}
else {
    parentPort.on('message', async (requestData) => {
        try {
            console.log(requestData);
            const response = {
                body: '123',
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' }
            }
            parentPort.postMessage(response);
        } catch (err) {
            console.error(`❌ Worker error: ${err.message}`);
            parentPort.postMessage({
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });

        }
    });
}