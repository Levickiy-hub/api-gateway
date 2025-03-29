import { Worker, } from 'worker_threads';
import LoadBalancer from '../../application/services/LoadBalancerService.js';
import { logger } from '../services/LoggerService.js';

export default class WorkerManager {
    constructor(numWorkers, configService) {
        this.configService = configService;
        this.workers = [];

        // Создаем общую память для баланса нагрузки
        const bufferSize = 1024; // Можно увеличить при необходимости
        this.loadBalancerBuffer = new SharedArrayBuffer(bufferSize);
        this.geoCacheBuffer = new SharedArrayBuffer(bufferSize); // Кеш IP

        this.initWorkers(numWorkers);
    }

    initWorkers(numWorkers) {
        for (let i = 0; i < numWorkers; i++) {
            this.createWorker();
        }
    }

    createWorker() {
        const worker = new Worker(new URL('./Worker.js', import.meta.url), {
            workerData: {
                config: this.configService.getConfig(),
                loadBalancerBuffer: this.loadBalancerBuffer,
                geoCacheBuffer: this.geoCacheBuffer
            }
        });

        worker.on('exit', (code) => {
            logger.error(`⚠️ Worker exited with code ${code}`);
            this.workers = this.workers.filter(w => w !== worker);
            if (code !== 0) this.createWorker(); // Перезапускаем воркер
        });

        worker.on('error', (err) => {
            logger.error(`❌ Worker error: ${err.message}`);
            this.workers = this.workers.filter(w => w !== worker);
            this.createWorker();
        });

        worker.pendingTasks = 0; // Добавляем счетчик запросов
        this.workers.push(worker);
    }

    async sendRequestToWorker(req) {
        if (this.workers.length === 0) {
            return Promise.reject(new Error('⚠️ No available workers!'));
        }

        return new Promise((resolve, reject) => {
            const worker = LoadBalancer.selectWorker(this.workers);
            if (!worker) return reject(new Error('⚠️ No available worker found!'));

            worker.postMessage(req);
            worker.once('message', (response) => {
                LoadBalancer.workerFinished(worker);
                resolve(response);
            });

            worker.on('error', (err) => {
                LoadBalancer.workerFinished(worker);
                reject(err);
            });
        });
    }
}
