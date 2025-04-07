import fastify from 'fastify';
import fastifyHttpProxy from '@fastify/http-proxy';

// Настройка прокси
const app = fastify();

app.register(fastifyHttpProxy, {
  upstream: 'http://localhost:5001', // целевой сервер
  prefix: '/service1', // путь, который будет проксироваться
  http2: false, // отключаем http2, если не нужно
});

// Маршрут для проверки, если нужно
app.get('/', async (request, reply) => {
  return { message: 'Fastify Proxy работает!' };
});

// Запуск сервера с правильным параметром
app.listen({ port: 3006, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening on ${address}`);
});

// start();
