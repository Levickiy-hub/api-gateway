import UUIDService from "../../infrastructure/services/UUIDService.js";

export default class RequestDTO {
    constructor(req) {
        this.id = UUIDService.generateUUID();
        this.url = req.url;
        this.method = req.method;
        this.headers = req.headers;
        this.body = req.body || null;
        this.ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    }
}
