import fs from "fs";
import { ConfigValidator } from "../config/ConfigValidator.js";
import { EventEmitter } from 'events';
import { logger } from "../services/LoggerService.js";

export default class ConfigRepository extends EventEmitter {
    constructor(configPath) {
        super();
        this.configPath = configPath;
        this.config = this.initConfig(configPath);
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
        try{
            const config = this.loadConfig(configPath);
            ConfigValidator.validateConfig(config);
            return config;
        }
        catch(error){
            if(!this.config){
                throw new Error('Error init config.');
            }
            return null;
        }
    }

    getConfig(){
        return this.config;
    }

    getGlobalConfig() {
        return this.config ? this.config.global : null;
    }

    getServiceConfig(serviceName) {
        return this.config && this.config.services ? this.config.services[serviceName] : null;
    }

    getServiceEndpointConfig(serviceName, endpoint) {
        const service = this.getServiceConfig(serviceName);
        if (service && service.endpoints) {
            return service.endpoints[endpoint] || null;
        }
        return null;
    }

    updateConfig() {
        this.loadConfig();
    }

    hasConfig() {
        return this.config !== null;
    }
}