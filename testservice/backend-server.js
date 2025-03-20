import { WebSocketServer } from 'ws';

const PORT = 5003;

// Создаем WebSocket сервер
const wss = new WebSocketServer({ port: PORT }, () => {
    console.log(`🚀 WebSocket server is running on ws://localhost:${PORT}`);
});

// Обработчик подключения клиента
wss.on('connection', (ws, req) => {
    console.log(`✅ Client connected: ${req.socket.remoteAddress}`);

    // Логируем информацию о запросе на подключение
    console.log(`🔗 Connection request received: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);

    // Обработка сообщений от клиента
    ws.on('message', (message) => {
        console.log(`📩 Received message from client: ${message}`);

        // Преобразуем данные и отправляем обратно клиенту
        const responseMessage = `📝 Echo: ${message}`;
        console.log(`📤 Sending echo response: ${responseMessage}`);
        ws.send(responseMessage);
    });

    // Обработчик отключения клиента
    ws.on('close', () => {
        console.log('❌ Client disconnected');
    });

    // Обработчик ошибок
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});
