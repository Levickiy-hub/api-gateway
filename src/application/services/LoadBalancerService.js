export default class LoadBalancer {
    constructor() {
        this.roundRobinIndex = 0;
        this.workersMap = new Map();
    }

    /**
     * Выбирает воркер в зависимости от стратегии балансировки нагрузки.
     * @param {Array} workers - список воркеров.
     * @param {string} strategy - стратегия балансировки ('round-robin', 'least-connections', 'random').
     * @returns {Worker} - выбранный воркер.
     */
    selectWorker(workers, strategy) {
        if (!workers || !Array.isArray(workers) || workers.length === 0) return null;
        if (workers.length === 1) return workers[0];

        switch (strategy) {
            case 'round-robin':
                return this.roundRobin(workers);
            case 'least-connections':
                return this.leastConnections(workers);
            case 'random':
            default:
                return this.random(workers);
        }
    }

    /**
    * Вызывается, когда воркер завершает обработку запроса.
    * Уменьшает количество активных соединений для воркера.
    * @param {Worker} worker
    */
    workerFinished(worker) {
        if (this.workersMap.has(worker.threadId)) {
            const currentConnections = this.workersMap.get(worker.threadId);
            this.workersMap.set(worker.threadId, Math.max(0, currentConnections - 1));
        }
    }

    /**
     * Выбирает воркер с наименьшим количеством активных соединений.
     * @param {Array} workers
     * @returns {Worker}
     */
    leastConnections(workers) {
        let selectedWorker = null;
        let minConnections = Infinity;

        workers.forEach(worker => {
            const activeConnections = this.workersMap.get(worker.threadId) || 0;

            if (activeConnections < minConnections) {
                minConnections = activeConnections;
                selectedWorker = worker;
            }
        });

        this.incrementWorkerConnections(selectedWorker);
        return selectedWorker;
    }

    /**
     * Выбирает воркер по круговому алгоритму (Round Robin).
     * @param {Array} workers
     * @returns {Worker}
     */
    roundRobin(workers) {
        const worker = workers[this.roundRobinIndex];
        this.roundRobinIndex = (this.roundRobinIndex + 1) % workers.length;
        return worker;
    }

    /**
     * Выбирает случайного воркера.
     * @param {Array} workers
     * @returns {Worker}
     */
    random(workers) {
        return workers[Math.floor(Math.random() * workers.length)];
    }

    /**
     * Увеличивает количество активных соединений для воркера.
     * @param {Worker} worker
     */
    incrementWorkerConnections(worker) {
        if (worker) {
            const currentConnections = this.workersMap.get(worker.threadId) || 0;
            this.workersMap.set(worker.threadId, currentConnections + 1);
        }
    }
}