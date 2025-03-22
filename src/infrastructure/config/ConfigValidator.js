export class ConfigValidator {
    static validateGlobalConfig(globalConfig) {
        if (!globalConfig) throw new Error('Global configuration is missing.');

        if (globalConfig.rateLimit) {
            const { maxRequests, windowMs } = globalConfig.rateLimit;
            if (typeof maxRequests !== 'number' || maxRequests <= 0) {
                throw new Error('Invalid maxRequests in global rate limit.');
            }
            if (typeof windowMs !== 'number' || windowMs <= 0) {
                throw new Error('Invalid windowMs in global rate limit.');
            }
        }

        const { TIMEOUT_MS, MAX_IDLE_TIME_MS, MAX_CONNECTION_DURATION_MS } = globalConfig;
        if (typeof TIMEOUT_MS !== 'number' || TIMEOUT_MS <= 0) {
            throw new Error('Invalid TIMEOUT_MS value.');
        }
        if (typeof MAX_IDLE_TIME_MS !== 'number' || MAX_IDLE_TIME_MS <= 0) {
            throw new Error('Invalid MAX_IDLE_TIME_MS value.');
        }
        if (typeof MAX_CONNECTION_DURATION_MS !== 'number' || MAX_CONNECTION_DURATION_MS <= 0) {
            throw new Error('Invalid MAX_CONNECTION_DURATION_MS value.');
        }
    }

    static validateServiceConfig(serviceConfig) {
        if (!serviceConfig || typeof serviceConfig !== 'object') {
            throw new Error('Service configuration is missing or invalid.');
        }

        if (!serviceConfig.url || typeof serviceConfig.url !== 'string') {
            throw new Error('Service URL is missing or invalid.');
        }
        if (!serviceConfig.protocol || !['http', 'https'].includes(serviceConfig.protocol)) {
            throw new Error('Invalid protocol in service configuration.');
        }

        if (serviceConfig.rateLimit) {
            const { maxRequests, windowMs } = serviceConfig.rateLimit;
            if (typeof maxRequests !== 'number' || maxRequests <= 0) {
                throw new Error(`Invalid maxRequests for service ${serviceConfig.url}`);
            }
            if (typeof windowMs !== 'number' || windowMs <= 0) {
                throw new Error(`Invalid windowMs for service ${serviceConfig.url}`);
            }
        }
    }

    static validateConfig(config) {
        if (!config.global) {
            throw new Error('Global configuration is missing.');
        }

        console.log(config)
        this.validateGlobalConfig(config.global);

        if (!config.services || typeof config.services !== 'object') {
            throw new Error('Services configuration is missing or invalid.');
        }

        Object.keys(config.services).forEach((serviceName) => {
            const serviceConfig = config.services[serviceName];
            this.validateServiceConfig(serviceConfig);
        });

        return true; // Конфигурация прошла валидацию
    }

    // Метод для загрузки конфигурации из JSON файла
    //   static loadConfig(filePath) {
    //     try {
    //       const configFile = fs.readFileSync(filePath, 'utf-8');
    //       const config = JSON.parse(configFile);
    //       // Валидируем конфигурацию перед возвращением
    //       this.validateConfig(config);
    //       return config;
    //     } catch (error) {
    //       throw new Error(`Error loading configuration file: ${error.message}`);
    //     }
    //   }
}

