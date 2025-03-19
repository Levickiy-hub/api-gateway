import crypto from 'crypto';

export default class UUIDService {
    static generateUUID() {
        const buffer = new Uint8Array(16);
        crypto.randomFillSync(buffer);

        // Устанавливаем версию UUID (4) в 6-й байт
        buffer[6] = (buffer[6] & 0x0f) | 0x40;

        // Устанавливаем вариант UUID (для v4 это 2 старших бита на 8-м байте)
        buffer[8] = (buffer[8] & 0x3f) | 0x80;

        const hexArray = Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0'));

        // Форматируем UUID как xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        return `${hexArray[0]}${hexArray[1]}${hexArray[2]}${hexArray[3]}-${hexArray[4]}${hexArray[5]}-${hexArray[6]}${hexArray[7]}-${hexArray[8]}${hexArray[9]}-${hexArray[10]}${hexArray[11]}${hexArray[12]}${hexArray[13]}${hexArray[14]}${hexArray[15]}`;
    }
}