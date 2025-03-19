export default class RateLimiterRepository {
    constructor() {
        this.requestCounts = new Map();
    }

    async get(ip) {
        return this.requestCounts.get(ip) || null;
    }

    async set(ip, data, windowMs) {
        this.requestCounts.set(ip, data);
        setTimeout(() => this.requestCounts.delete(ip), windowMs); // Очищаем данные через windowMs
    }
}