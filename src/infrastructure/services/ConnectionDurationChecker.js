import { logger } from "./LoggerService.js";

export default class ConnectionDurationChecker {
    constructor(maxDurationMs, socket) {
        this.maxDurationMs = maxDurationMs;
        this.socket = socket;
    }

    start() {
        this.timeout = setTimeout(() => {
            logger.info(this.maxDurationMs)
            logger.warn(`🚨 Connection duration exceeded: ${this.socket.remoteAddress}`);
            this.socket.destroy();
        }, this.maxDurationMs);
    }

    clear() {
        clearTimeout(this.timeout);
    }
}