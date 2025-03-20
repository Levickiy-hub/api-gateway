import { io } from 'socket.io-client';

// Создание подключения к WebSocket серверу
const socket = io('http://localhost:3000/ws-test');

// Подключение успешно установлено
socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    socket.emit('message', 'Hello, server!'); // Отправка сообщения серверу
});

// Получение сообщений от сервера
socket.on('message', (message) => {
    console.log('Received message from server:', message);
});

// Обработка отключения
socket.on('disconnect', () => {
    console.log('WebSocket connection closed');
});

// Обработка ошибок
socket.on('error', (err) => {
    console.error('Socket.io error:', err);
});
