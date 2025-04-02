import os from 'os';
import v8 from 'v8';
import { performance, PerformanceObserver } from 'perf_hooks';
import { logger } from '../../infrastructure/services/LoggerService.js';

export default class MonitoringService {
    constructor() {
        this.requestsTotal = 0;
        this.responseTimeData = [];
        this.httpStatusCodes = {};
        this.activeWebSocketConnections = 0;
        this.eventLoopDelay = 0;
        this.startEventLoopMonitoring();
    }

    logRequest(req, res, duration) {
        this.requestsTotal++;
        this.responseTimeData.push(duration);
        if (!this.httpStatusCodes[res.statusCode]) {
            this.httpStatusCodes[res.statusCode] = 0;
        }
        this.httpStatusCodes[res.statusCode]++;

        // logger.info(`[${req.method}] ${req.url} - ${res.statusCode} (${duration}ms)`);
    }

    incrementWebSocketConnections() {
        this.activeWebSocketConnections++;
        logger.info(`New WebSocket connection. Active connections: ${this.activeWebSocketConnections}`);
    }

    decrementWebSocketConnections() {
        this.activeWebSocketConnections = Math.max(0, this.activeWebSocketConnections - 1);
        logger.info(`WebSocket disconnected. Active connections: ${this.activeWebSocketConnections}`);
    }

    startEventLoopMonitoring() {
        const obs = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0];
            this.eventLoopDelay = entry.duration;
        });
        obs.observe({ entryTypes: ['measure'], buffered: true });
    
        setInterval(() => {
            performance.mark('start');
            performance.mark('end');
            performance.measure('eventLoopDelay', 'start', 'end');
        }, 1000);
    }

    getNodeMetrics() {
        return {
            eventLoopDelay: this.eventLoopDelay.toFixed(2) + ' ms',
            heapStatistics: v8.getHeapStatistics(), // Подробная информация о куче
            activeHandles: process._getActiveHandles().length, // Количество активных дескрипторов
            activeRequests: process._getActiveRequests().length, // Количество активных запросов
            uptime: process.uptime(), // Время работы Node.js
        };
    }

    getSystemMetrics() {
        return {
            uptime: process.uptime(),
            memoryUsage: {
                rss: process.memoryUsage().rss,
                heapTotal: process.memoryUsage().heapTotal,
                heapUsed: process.memoryUsage().heapUsed,
                external: process.memoryUsage().external,
            },
            cpuLoad: os.loadavg(),
            freeMemory: os.freemem(),
            totalMemory: os.totalmem(),
            numCPUs: os.cpus().length,
        };
    }

    getMetrics( includeNodeMetrics = true, includeSystemMetrics = true ) {
        const metrics = {
            requestsTotal: this.requestsTotal,
            avgResponseTime: this.responseTimeData.length
                ? this.responseTimeData.reduce((a, b) => a + b, 0) / this.responseTimeData.length
                : 0,
            httpStatusCodes: this.httpStatusCodes,
            activeWebSocketConnections: this.activeWebSocketConnections,
        };

        if (includeSystemMetrics) {
            metrics.system = this.getSystemMetrics();
        }

        if (includeNodeMetrics) {
            metrics.node = this.getNodeMetrics();
        }

        return metrics;
    }
}
