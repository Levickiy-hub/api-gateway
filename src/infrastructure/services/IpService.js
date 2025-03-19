// Функция для конвертации IPv4 в числовое значение
export function ipToNumber(ip) {
    const parts = ip.split('.').map(Number);
    return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

// Функция для конвертации IPv6 в числовое значение
export function ip6ToNumber(ip) {
    const parts = ip.split(':');

    const parsedParts = parts.map(part => {
        if (part) {
            // Если сегмент непустой, пытаемся преобразовать его в шестнадцатеричное число
            const parsed = parseInt(part, 16);
            if (isNaN(parsed)) {
                throw new Error(`Invalid IPv6 segment: ${part}`);
            }
            return parsed;
        } else {
            // Пустой сегмент, что означает "0" в записи IPv6
            return 0;
        }
    });

    let num = BigInt(0);
    parsedParts.forEach(part => {
        num = (num << BigInt(16)) | BigInt(part);
    });

    return num;
}

export function getBufferIndex(ip) {
    if(ip === 'unknown'){
        return -1;
    }

    if (ip.includes(':')) {
        const ipNumber = ip6ToNumber(ip); // Преобразуем IPv6 в число
        return Number(ipNumber);
    } else {
        const ipNumber = ipToNumber(ip); // Преобразуем IPv4 в число
        return ipNumber; 
    }
}
