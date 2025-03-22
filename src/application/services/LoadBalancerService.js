export default class LoadBalancer {
    static selectWorker(workers) {
        return workers[Math.floor(Math.random() * workers.length)];
    }
}