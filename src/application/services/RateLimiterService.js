export default class RateLimiterService {
    constructor(rateLimiterRepository, rateLimit, windowMs){
        this.rateLimiterRepository = rateLimiterRepository;
        this.rateLimit = rateLimit;
        this.windowMs = windowMs;
    }

    async isRequestAllowed(ip){
        const now = Date.now();
        let userData = await this.rateLimiterRepository.get(ip);

        if(!userData){
            userData = { count: 1, startTime: now };
        }
        else if (now - userData.startTime > this.windowMs) {
            userData.count = 1;
            userData.startTime = now;
        }
        else{
            userData.count++;
        }

        await this.rateLimiterRepository.set(ip,userData,this.windowMs);
        return userData.count >= this.rateLimit;
    }
}