import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.appendFile);

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFiles = {
    access: path.join(logDir, 'access.log'), // HTTP-запросы и ответы
    error: path.join(logDir, 'errors.log'),  // Ошибки
    info: path.join(logDir, 'app.log'),      // Остальная информация
    warn: path.join(logDir, 'app.log'),     // Остальная информация
};

class LoggerService {
    async log(type, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = JSON.stringify({ timestamp, type, message, ...(Object.keys(meta).length ? { meta } : {}) }) + '\n';

        // Вывод в консоль
        if (Object.keys(meta).length) {
            console.log(`[${type.toUpperCase()}]`, message, meta);
        } else {
            console.log(`[${type.toUpperCase()}]`, message);
        }

        // Запись в файл
        try {
            await writeFileAsync(logFiles[type] || logFiles.info, logEntry);
        } catch (err) {
            console.error('Ошибка записи в лог-файл:', err);
        }
    }

    access(msg, meta = {}) { return this.log('access', msg, meta); }
    info(msg, meta = {}) { return this.log('info', msg, meta); }
    warn(msg, meta = {}) { return this.log('warn', msg, meta); }
    error(msg, meta = {}) { return this.log('error', msg, meta); }
}

export const logger = new LoggerService();
