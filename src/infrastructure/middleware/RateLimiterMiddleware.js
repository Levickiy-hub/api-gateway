import RateLimiterRepository from "../repositories/RateLimiterRepository.js";
import RateLimiterService from "../../application/services/RateLimiterService.js";
import { getBufferIndex } from "../services/IpService.js";

export default async function rateLimiter(requestData, config) {
    const rateLimiterRepository = new RateLimiterRepository();
    const rateLimiterService = new RateLimiterService(rateLimiterRepository, config.maxRequests, config.windowMs);
    const ip = requestData.ip;

    const index = getBufferIndex(ip);
    if (index === -1) return false;
    return await rateLimiterService.isRequestAllowed(index);
}