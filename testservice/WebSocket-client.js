import { WebSocket } from 'ws';

const ws = new WebSocket('ws://localhost:3000/ws-test');

ws.onopen = () => {
    console.log('Connected to WebSocket server');
    ws.send('Hello, server!');
};

ws.onmessage = (event) => {
    console.log('Received message from server:', event.data);
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket connection closed');
};
