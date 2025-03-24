import { URL } from 'url';
import { logger } from '../../infrastructure/services/LoggerService.js';

export default class RouteRepository {
    constructor(config) {
        this.config = config;
        this.routes = new Map();
        this.initializeRoutes();
    }

    initializeRoutes() {
        if (!this.config?.services || !Array.isArray(this.config.services)) {
            throw new Error("Invalid services configuration.");
        }

        this.config.services.forEach(service => {
            service.endpoints.forEach(endpoint => {
                const path = endpoint.path;

                if (this.routes.has(path)) {
                    logger.warn(`Duplicate path detected: ${path}. Overwriting existing route.`);
                }

                this.routes.set(path, {
                    targets: endpoint.targets,
                    loadBalancingStrategy: endpoint.loadBalancingStrategy || "round-robin",
                    rateLimit: endpoint.rateLimit || this.config.global.rateLimit,
                    cors: endpoint.cors || this.config.global.cors,
                    security: endpoint.security || { secured: false, requireJwt: false, public: true },
                });
            });
        });
    }

    getRoutes() {
        return this.routes;
    }

    getTarget(url) {
        try {
            const pathname = new URL(url, 'http://localhost').pathname;

            if (this.routes.has(pathname)) {
                return this.routes.get(pathname);
            }

            return null;
        } catch (error) {
            logger.error("❌ Error processing URL:", error.message);
            return null;
        }
    }
}
