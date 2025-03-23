import http from 'http';
import https from 'https';

export default class ProxyService {
    static async proxyRequest(requestData,targetUrl) {
        console.log(targetUrl)
        return new Promise((resolve, reject) => {
            const target = new URL(targetUrl);
            const protocol = target.protocol === 'https' ? https : http;
            const options = {
                hostname: target.hostname,
                port: target.port,
                path: target.pathname,
                method: requestData.method,
                headers: requestData.headers,
            };
            const proxyReq = protocol.request(options, (proxyRes) => {
                let body = '';
                proxyRes.on('data', (chunk) => body += chunk);
                proxyRes.on('end', () => {
                    resolve({ statusCode: proxyRes.statusCode, headers: proxyRes.headers, body })
                })
            });
            proxyReq.on('error', reject)
            proxyReq.end();
        })
    }
}