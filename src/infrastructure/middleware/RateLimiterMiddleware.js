import Config from "../../config/Config.js";
import RateLimiterRepository from "../repositories/RateLimiterRepository.js";
import RateLimiterService from "../../application/services/RateLimiterService.js";
import {getBufferIndex} from "../services/IpService.js";

const rateLimiterRepository = new RateLimiterRepository();
const rateLimiterService = new RateLimiterService(rateLimiterRepository, Config.RATE_LIMIT || 100, 60 * 1000);


export default async function rateLimiter(requestData) {
    const ip = requestData.headers['x-forwarded-for'] ||
        requestData.headers['x-real-ip'] ||
        requestData.remoteAddress || 'unknown';

    const index = getBufferIndex(ip);
    if (index === -1) return true;
    return await rateLimiterService.shouldAllowRequest(index);
}