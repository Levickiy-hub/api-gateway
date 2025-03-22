import fs from "fs";
import { ConfigValidator } from "../config/ConfigValidator.js";
import { EventEmitter } from 'events';


export default class ConfigRepository extends EventEmitter {
    constructor(configPath) {
        super();
        this.configPath = configPath;
        this.config = null;
        this.initConfig(configPath);
    }

    loadConfig(filePath) {
        try {
            const configFile = fs.readFileSync(filePath, 'utf-8');
            const config = JSON.parse(configFile);
            return config;
        } catch (error) {
            throw new Error(`Error loading configuration file: ${error.message}`);
        }
    }

    initConfig(configPath) {
        const config = this.loadConfig(configPath);
        if (!ConfigValidator.validateConfig(config)) {
            console.error('Error validation')
        };
        
        this.config = config;
    }

    getConfig(){
        return this.config;
    }
    // Возвращаем глобальную конфигурацию
    getGlobalConfig() {
        return this.config ? this.config.global : null;
    }

    // Возвращаем конфигурацию конкретного сервиса
    getServiceConfig(serviceName) {
        return this.config && this.config.services ? this.config.services[serviceName] : null;
    }

    // Возвращаем конфигурацию для конкретного эндпоинта
    getServiceEndpointConfig(serviceName, endpoint) {
        const service = this.getServiceConfig(serviceName);
        if (service && service.endpoints) {
            return service.endpoints[endpoint] || null;
        }
        return null;
    }

    // Метод для обновления конфигурации из файла
    updateConfig() {
        this.loadConfig(); // Пере-загружаем конфигурацию
    }

    // Метод для проверки наличия конфигурации
    hasConfig() {
        return this.config !== null;
    }
}