import http from 'http';
import { Server } from 'socket.io';

// Создание HTTP сервера
const server = http.createServer();

// Создание WebSocket сервера с использованием socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Разрешаем все домены для кросс-доменных запросов
    }
});

// Обработка подключения клиента
io.on('connection', (socket) => {
    console.log('✅ Client connected');

    // Получение сообщений от клиента
    socket.on('message', (message) => {
        console.log(`📩 Received message from client: ${message}`);
        
        // Отправка ответа обратно клиенту
        const responseMessage = `📝 Echo: ${message}`;
        console.log(`📤 Sending echo response: ${responseMessage}`);
        socket.emit('message', responseMessage);
    });

    // Обработка отключения клиента
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected');
    });

    // Обработка ошибок
    socket.on('error', (err) => {
        console.error('Socket.io error:', err);
    });
});

// Запуск сервера на порту 3000
server.listen(5003, () => {
    console.log('🚀 WebSocket server running on http://localhost:5003');
});
