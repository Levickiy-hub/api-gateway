import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = 3005;

// Целевой сервер для проксирования
const targetUrl = 'http://localhost:5001';

// Логируем задержку для каждого запроса
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`Request to ${req.originalUrl} took ${duration} ms`);
    });
    
    next();
});

// Прокси для всех запросов
app.use('/', createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: {
        '^/proxy': '', // Опционально, чтобы изменять путь запроса
    },
    onProxyReq: (proxyReq, req, res) => {
        // Добавление заголовков, если необходимо
        proxyReq.setHeader('X-Forwarded-For', req.connection.remoteAddress);
    },
}));

app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
});
