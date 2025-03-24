import { logger } from "./LoggerService.js";

export default class TimeoutManager {
    constructor(timeoutMs, socket) {
        this.timeoutMs = timeoutMs;
        this.socket = socket;
        this.timer = null;
    }

    start() {
        this.timer = setTimeout(() => {
            logger.warn(`🚨 Possible Slowloris attack from ${this.socket.remoteAddress}`);
            this.socket.destroy();
        }, this.timeoutMs);
    }

    reset() {
        clearTimeout(this.timer);  // Сброс таймера
        this.start();  // Перезапуск таймера
    }

    clear() {
        clearTimeout(this.timer);
    }
}
