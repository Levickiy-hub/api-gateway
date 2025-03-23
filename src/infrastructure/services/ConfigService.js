import ConfigRepository from '../repositories/ConfigRepository.js'

export default class ConfigService {
    constructor(configPath) {
        if (!ConfigService.instance) {
            const configRepository = new ConfigRepository(configPath);
            this.config = configRepository.getConfig();
            ConfigService.instance = this;
        }
        return ConfigService.instance;
    }

    getConfig() {
        return this.config;
    }

    getGlobalConfig(){
        return this.config.global
    }

    getTimeoutsConfig(){
        return this.getGlobalConfig().timeouts;
    }
}