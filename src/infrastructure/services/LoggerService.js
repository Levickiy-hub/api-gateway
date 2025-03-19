import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.appendFile);

//Уровни логов
const levels = {
    info: { color: '\x1b[32m', label: 'INFO' },   // Зеленый
    warn: { color: '\x1b[33m', label: 'WARN' },   // Желтый
    error: { color: '\x1b[31m', label: 'ERROR' }  // Красный
};

const logFilePath = path.join(process.cwd(), 'logs', 'app.log');

// Убедимся, что папка logs существует
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

class LoggerService {
    async log(level, message) {
        const { color, label } = levels[level] || levels.info;
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${label}: ${message}\n`;

        console.log(color, logMessage, '\x1b[0m');

        try {
            await writeFileAsync(logFilePath, logMessage);
        } catch (err) {
            console.error('Ошибка записи в лог-файл:', err);
        }
    }

    info(msg) { return this.log('info', msg); }
    warn(msg) { return this.log('warn', msg); }
    error(msg) { return this.log('error', msg); }
}

// Используем Одиночку (Singleton)
export const logger = new LoggerService();