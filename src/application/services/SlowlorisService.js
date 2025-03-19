import TimeoutManager from '../../infrastructure/services/TimeoutManager.js';
import IdleChecker from '../../infrastructure/services/IdleChecker.js';
import ConnectionDurationChecker from '../../infrastructure/services/ConnectionDurationChecker.js';

export default class SlowlorisService {
    constructor(socket, config) {
        this.socket = socket;
        this.config = config;
        this.timeoutManager = new TimeoutManager(config.TIMEOUT_MS, socket);
        this.idleChecker = new IdleChecker(config.MAX_IDLE_TIME_MS, socket);
        this.connectionDurationChecker = new ConnectionDurationChecker(config.MAX_CONNECTION_DURATION_MS, socket);
    }

    start() {
        this.timeoutManager.start();
        this.idleChecker.start();
        this.connectionDurationChecker.start();

        this.socket.on('data', () => {
            this.idleChecker.reset();
            this.timeoutManager.clear();
        });

        this.socket.on('close', () => {
            this.timeoutManager.clear();
            this.idleChecker.clear();
            this.connectionDurationChecker.clear();
        });

        this.socket.on('end', () => {
            this.timeoutManager.clear();
            this.idleChecker.clear();
            this.connectionDurationChecker.clear();
        });
    }
}