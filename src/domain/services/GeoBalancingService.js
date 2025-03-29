import { logger } from '../../infrastructure/services/LoggerService.js';
import https from 'https';
import { getBufferIndex } from '../../infrastructure/services/IpService.js';

const RETRY_TIMEOUT_MS = 10 * 60 * 10000; // 100 минут в миллисекундах

export default class GeoBalancingService {
    constructor(sharedArray) {
        this.sharedArray = sharedArray; // Общий массив
        this.lastFailedRequests = new Map(); // Локальный кэш времени ошибок
    }

    async getClientLocation(req) {
        const ip = req.ip;
        if (!ip) return null;

        const index = getBufferIndex(ip);
        if (index < 0) return null; 

        const cachedCountry = Atomics.load(this.sharedArray, index);
        if (cachedCountry !== 0) {
            return String.fromCharCode(
                (cachedCountry >> 16) & 0xff,
                cachedCountry & 0xff
            );
        }

        const lastFailedTime = this.lastFailedRequests.get(ip);
        const now = Date.now();

        if (lastFailedTime && now - lastFailedTime < RETRY_TIMEOUT_MS) {
            return null;
        }

        const url = `https://ip-api.com/json/${ip}?fields=countryCode`;

        return new Promise((resolve) => {
            https.get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json && json.countryCode) {
                            const code = (json.countryCode.charCodeAt(0) << 16) | json.countryCode.charCodeAt(1);
                            Atomics.store(this.sharedArray, index, code);
                            resolve(json.countryCode);
                        } else {
                            logger.warn(`Не удалось определить страну для IP: ${ip}`);
                            Atomics.store(this.sharedArray, index, 0); // Кешируем как "неизвестно"
                            this.lastFailedRequests.set(ip, now);
                            resolve(null);
                        }
                    } catch (error) {
                        logger.error(`Ошибка при парсинге данных: ${error}`);
                        this.lastFailedRequests.set(ip, now);
                        resolve(null);
                    }
                });

                response.on('error', (error) => {
                    logger.error(`Ошибка при запросе: ${error}`);
                    this.lastFailedRequests.set(ip, now);
                    resolve(null);
                });
            });
        });
    }

    async findServers(req, servers) {
        const clientLocation = await this.getClientLocation(req);
        if (!clientLocation) return servers;

        const targetServers = servers.targets.filter(server => server.location === clientLocation);
        return targetServers.length ? targetServers : servers;
    }
}
