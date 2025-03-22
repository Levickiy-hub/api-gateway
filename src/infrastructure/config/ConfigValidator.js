export class ConfigValidator {
    static validateGlobalConfig(globalConfig) {
        if (!globalConfig) throw new Error('Global configuration is missing.');

        // Проверка numWorkers
        if (typeof globalConfig.numWorkers !== 'number' || globalConfig.numWorkers < 1) {
            throw new Error('Invalid numWorkers: must be a number greater than 0.');
        }

        // Проверка rateLimit
        if (!globalConfig.rateLimit) {
            throw new Error('Missing rateLimit configuration.');
        }

        const { maxRequests, windowMs } = globalConfig.rateLimit;
        if (typeof maxRequests !== 'number' || maxRequests < 1) {
            throw new Error('Invalid rateLimit.maxRequests: must be a number greater than 0.');
        }
        if (typeof windowMs !== 'number' || windowMs <= 0) {
            throw new Error('Invalid rateLimit.windowMs: must be a positive number.');
        }

        // Проверка timeouts
        if (!globalConfig.timeouts) {
            throw new Error('Missing timeouts configuration.');
        }

        const { initial, idle, maxDuration } = globalConfig.timeouts;
        if (typeof initial !== 'number' || initial <= 0) {
            throw new Error('Invalid timeouts.initial: must be a positive number.');
        }
        if (typeof idle !== 'number' || idle <= 0) {
            throw new Error('Invalid timeouts.idle: must be a positive number.');
        }
        if (typeof maxDuration !== 'number' || maxDuration <= 0) {
            throw new Error('Invalid timeouts.maxDuration: must be a positive number.');
        }

        // Проверка CORS
        if (!globalConfig.cors) {
            throw new Error('Missing CORS configuration.');
        }

        const { allowedOrigins, allowedMethods, allowedHeaders, exposedHeaders, allowCredentials, maxAge } = globalConfig.cors;

        if (!Array.isArray(allowedOrigins)) {
            throw new Error('Invalid cors.allowedOrigins: must be an array.');
        }
        if (!Array.isArray(allowedMethods)) {
            throw new Error('Invalid cors.allowedMethods: must be an array.');
        }
        if (!Array.isArray(allowedHeaders)) {
            throw new Error('Invalid cors.allowedHeaders: must be an array.');
        }
        if (!Array.isArray(exposedHeaders)) {
            throw new Error('Invalid cors.exposedHeaders: must be an array.');
        }
        if (typeof allowCredentials !== 'boolean') {
            throw new Error('Invalid cors.allowCredentials: must be a boolean.');
        }
        if (typeof maxAge !== 'number' || maxAge < 0) {
            throw new Error('Invalid cors.maxAge: must be a non-negative number.');
        }

        console.log('Global configuration is valid.');
        return true;
    }

    static validateServices(services, globalConfig) {
        if (!services || !Array.isArray(services)) {
            throw new Error('Invalid services: must be an array.');
        }

        services.forEach((service, serviceIndex) => {
            if (typeof service.name !== 'string' || !service.name.trim()) {
                throw new Error(`Service at index ${serviceIndex} has an invalid name.`);
            }

            if (!service.endpoints || !Array.isArray(service.endpoints)) {
                throw new Error(`Service "${service.name}" has an invalid endpoints array.`);
            }

            service.endpoints.forEach((endpoint, endpointIndex) => {
                if (typeof endpoint.path !== 'string' || !endpoint.path.startsWith('/')) {
                    throw new Error(`Service "${service.name}" endpoint at index ${endpointIndex} has an invalid path.`);
                }

                if (!endpoint.targets || !Array.isArray(endpoint.targets) || endpoint.targets.length === 0) {
                    throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" has invalid targets.`);
                }

                endpoint.targets.forEach((target, targetIndex) => {
                    if (typeof target.url !== 'string' || !target.url.startsWith('http')) {
                        throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" target at index ${targetIndex} has an invalid URL.`);
                    }

                    if (typeof target.protocol !== 'string' || !['http', 'https'].includes(target.protocol)) {
                        throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" target at index ${targetIndex} has an invalid protocol.`);
                    }
                });

                if (endpoint.loadBalancingStrategy && !['round-robin', 'random', 'least-connections'].includes(endpoint.loadBalancingStrategy)) {
                    throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" has an invalid loadBalancingStrategy.`);
                }

                // Проверка rateLimit
                if (!endpoint.rateLimit) {
                    console.warn(`Service "${service.name}" endpoint "${endpoint.path}" is missing rateLimit. Using global rateLimit:`, globalConfig.rateLimit);
                    endpoint.rateLimit = globalConfig.rateLimit;
                }

                if (typeof endpoint.rateLimit.maxRequests !== 'number' || endpoint.rateLimit.maxRequests < 1) {
                    throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" has an invalid rateLimit.maxRequests.`);
                }

                if (typeof endpoint.rateLimit.windowMs !== 'number' || endpoint.rateLimit.windowMs <= 0) {
                    throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" has an invalid rateLimit.windowMs.`);
                }

                // Проверка CORS
                if (!endpoint.cors) {
                    console.warn(`Service "${service.name}" endpoint "${endpoint.path}" is missing CORS configuration. Using global CORS:`, globalConfig.cors);
                    endpoint.cors = globalConfig.cors;
                }

                const { allowedOrigins, allowedMethods, allowedHeaders, allowCredentials } = endpoint.cors;

                if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
                    throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" has invalid cors.allowedOrigins.`);
                }

                if (!Array.isArray(allowedMethods) || allowedMethods.length === 0) {
                    throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" has invalid cors.allowedMethods.`);
                }

                if (!Array.isArray(allowedHeaders)) {
                    throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" has invalid cors.allowedHeaders.`);
                }

                if (typeof allowCredentials !== 'boolean') {
                    throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" has invalid cors.allowCredentials.`);
                }

                // Проверка security
                if (!endpoint.security) {
                    console.warn(`Service "${service.name}" endpoint "${endpoint.path}" is missing security configuration. Using default values.`);
                    endpoint.security = { secured: false, requireJwt: false, public: true };
                }

                const { secured, requireJwt, public: isPublic } = endpoint.security;

                if (typeof secured !== 'boolean' || typeof requireJwt !== 'boolean' || typeof isPublic !== 'boolean') {
                    throw new Error(`Service "${service.name}" endpoint "${endpoint.path}" has invalid security settings.`);
                }
            });
        });

        console.log('Services configuration is valid.');
        return true;
    }

    static validateConfig(config) {
        try {
            this.validateGlobalConfig(config.global);
            this.validateServices(config.services, config.global);
            return true; // Конфигурация прошла валидацию
        } catch (error) {
            console.error(error);
            throw new Error('Failed validate config.');
        }
    }
}
