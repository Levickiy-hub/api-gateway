import { parentPort } from 'worker_threads';
import ProxyService from '../../application/services/ProxyService.js';

parentPort.on('message', async (requestData) => {
    try {
        const response = await ProxyService.proxyRequest(requestData);
        parentPort.postMessage(response);
    } catch (err) {
        console.error(`❌ Worker error: ${err.message}`);
        parentPort.postMessage({
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        });
    }
});
