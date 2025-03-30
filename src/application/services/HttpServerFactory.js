import { createServer } from 'http';
import { createSecureServer } from 'http2';
import tlsService from '../../infrastructure/services/TLSService.js';

export default class HttpServerFactory {
    static async createServer(requestHandler) {
        const tlsConfig = await tlsService.getConfig();

        if (tlsConfig) {
            const http2Config = {
                ...tlsConfig,
                allowHTTP1: true,
                settings: {
                    maxConcurrentStreams: 100,
                    maxSessionMemory: 65536,
                    initialWindowSize: 6291456 
                }
            };
            return createSecureServer(http2Config, requestHandler);
        }

        const server = createServer(requestHandler);
        server.keepAliveTimeout = 60000;
        server.headersTimeout = 65000;

        return server;
    }
}
