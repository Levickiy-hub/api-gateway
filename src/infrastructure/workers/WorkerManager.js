import {Worker} from 'worker_threads';

export default class WorkerManager {
    constructor(numWorkers){
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
            if (code !== 0) this.createWorker(); // Перезапускаем
        });
        this.workers.push(worker);
    }

    sendRequestToWorker(requestData) {
        return new Promise((resolve) => {
            const worker = this.workers[Math.floor(Math.random() * this.workers.length)];
            worker.postMessage(requestData);
            worker.once('message', resolve);
        });
    }
}