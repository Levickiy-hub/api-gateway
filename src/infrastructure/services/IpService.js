import crypto from 'crypto';

// Функция для конвертации IPv4 в числовое значение
export function ipToNumber(ip) {
    const parts = ip.split('.').map(Number);
    return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

// Функция для создания 32-битного хеша IPv6 (чтобы влезало в Int32Array)
export function ip6ToHash(ip) {
    const hash = crypto.createHash('md5').update(ip).digest();
    return hash.readInt32BE(0); // Берём первые 4 байта хеша
}

// Функция для получения индекса в `SharedArrayBuffer`
export function getBufferIndex(ip) {
    if (ip === 'unknown') {
        return -1;
    }

    if (ip.includes(':')) {
        return ip6ToHash(ip); // Используем 32-битный хеш IPv6
    } else {
        return ipToNumber(ip); // IPv4 остается числом
    }
}
