import { createServer } from 'http';
import { createSecureServer } from 'http2';
import tlsService from '../../infrastructure/services/TLSService.js';

export default class HttpServerFactory {
    static async createServer(requestHandler) {
        const tlsConfig = await tlsService.getConfig();

        if (tlsConfig) {
            const http2Config ={
                ...tlsConfig,
                allowHTTP1: true,
            };
            return createSecureServer(http2Config, requestHandler);
        }
        return createServer(requestHandler);
    }
}
