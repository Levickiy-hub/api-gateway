import { logger } from '../../infrastructure/services/LoggerService.js';

export default class GeoBalancingService {
    async getClientLocation(req) {
        const ip = req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.remoteAddress || 'unknown';

        console.log(ip)
        return "by"
    }
    
    async findServers(req, servers){
        const clientLocation = await this.getClientLocation(req);

        if(!clientLocation){
            return servers
        }
        const targetsServers = servers.targets.filter(server=>server.location === clientLocation);
        if(!targetsServers){
            return servers
        }

        return targetsServers;
    }
}
