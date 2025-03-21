import { Worker } from 'worker_threads';
import LoadBalancer from '../../application/services/LoadBalancerService.js';

export default class WorkerManager {
    constructor(numWorkers) {
        this.workers = [];
        this.initWorkers(numWorkers)
    }

    initWorkers(numWorkers) {
        for (let i = 0; i < numWorkers; i++) {
            this.createWorker();
        }
    }

    createWorker() {
        const worker = new Worker(new URL('./Worker.js', import.meta.url));
        worker.on('exit', (code) => {
            console.error(`⚠️ Worker exited with code ${code}`);
            this.workers = this.workers.filter(w => w !== worker);
            if (code !== 0) this.createWorker(); // Перезапускаем
        });
        this.workers.push(worker);
    }

    sendRequestToWorker(req) {
        const requestData = {
            url: req.url,
            methods: req.methods,
            headers: req.headers,
            body: req.body || null
        }

        return new Promise((resolve, reject) => {
            const worker = LoadBalancer.selectWorker(this.workers);
            worker.postMessage(requestData);
            worker.once('message', resolve);
            worker.on('error', reject);
        });
    }
}