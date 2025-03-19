export default class IdleChecker {
    constructor(maxIdleTimeMs, socket) {
        this.maxIdleTimeMs = maxIdleTimeMs;
        this.socket = socket;
        this.lastActivityTime = Date.now();
        this.interval = null;
    }

    start() {
        this.interval = setInterval(() => {
            if (Date.now() - this.lastActivityTime > this.maxIdleTimeMs) {
                console.warn(`🚨 Possible Slowloris attack due to slow data from ${this.socket.remoteAddress}`);
                this.socket.destroy();
            }
        }, 1000);
    }

    reset() {
        this.lastActivityTime = Date.now();
    }

    clear() {
        clearInterval(this.interval);
    }
}