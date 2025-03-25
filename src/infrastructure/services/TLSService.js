import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from './LoggerService.js';
import os from 'os';

const CERT_DIR = path.join(process.cwd(), 'infrastructure/config/cert/');

class TLSService {
    constructor() {
        this.tlsConfig = null;
        this.initConfig();
        this.watchUpdateConfig();
    }

    async getConfig() {
        if (!this.tlsConfig) {
            await this.initConfig();
        }
        return this.tlsConfig;
    }

    async initConfig() {
        try {
            logger.info('🔐 Ищем актуальные TLS-сертификаты...');

            // 🔍 Находим самые свежие файлы сертификатов
            const certFiles = await this.classifyCertificates();
              // Читаем файлы
              const [key, certContent, ca, dhparam] = await Promise.all([
                fs.readFile(certFiles.privkey),
                fs.readFile(certFiles.cert),
                certFiles.ca ? fs.readFile(certFiles.ca) : null,
                certFiles.dhparam ? fs.readFile(certFiles.dhparam) : null
            ]);

            this.tlsConfig = { key, cert: certContent, ca, dhparam };

            // 🔍 Проверяем сертификат
            this.validateCertificate(certContent.toString());

            logger.info('✅ TLS-сертификаты загружены и проверены.');
        } catch (error) {
            console.log(error)
            logger.error('❌ Ошибка загрузки TLS-сертификатов:', error);
            this.tlsConfig = null;
        }
    }



    async classifyCertificates() {
        const files = await fs.readdir(CERT_DIR);
        const certFiles = { privkey: null, cert: null, ca: null, dhparam: null };

        for (const file of files) {
            if (!file.endsWith('.pem')) continue;

            const filePath = path.join(CERT_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');

            if (content.includes('PRIVATE KEY')) {
                certFiles.privkey = filePath;
            } else if (content.includes('CERTIFICATE') && !certFiles.cert) {
                certFiles.cert = filePath; // Основной сертификат
            } else if (content.includes('CERTIFICATE') && certFiles.cert) {
                certFiles.ca = filePath; // CA-chain (если есть)
            } else if (content.includes('DH PARAMETERS')) {
                certFiles.dhparam = filePath; // Diffie-Hellman параметры
            }
        }

        return certFiles;
    }

    validateCertificate(certContent) {
        try {    
            const cert = new crypto.X509Certificate(certContent);
    
            const validFrom = new Date(cert.validFrom);
            const validTo = new Date(cert.validTo);
            const now = new Date();
    
            if (now > validTo) {
                throw new Error(`Сертификат просрочен! Истёк: ${validTo}`);
            }
            logger.info(`✅ Сертификат действителен до ${validTo}`);
    
            // 📌 Получаем домен динамически
            const expectedDomain = process.env.DOMAIN_NAME || os.hostname();
            const expectedDomains = cert.subjectAltName.split(', ').map(d => d.replace(/^DNS:/, ''));
    
            logger.info(`🔍 Доступные домены в сертификате: ${expectedDomains}`);

            if (!expectedDomains.includes(expectedDomain)) {
                throw new Error(`❌ Сертификат не соответствует текущему хосту! Ожидалось: ${expectedDomains.join(', ')}, получено: ${expectedDomain}`);
            }
            logger.info(`✅ Сертификат соответствует домену: ${expectedDomain}`);
        } catch (error) {
            logger.error('❌ Ошибка проверки TLS-сертификата:', error.message);
        }
    }

    watchUpdateConfig() {
        try {
            fs.watch(CERT_DIR, async (eventType, filename) => {
                if (filename && filename.match(/(privkey|cert|chain)-\d+\.pem/)) {
                    logger.info('🔄 Обнаружено обновление TLS-сертификатов...');
                    await this.initConfig();
                }
            });
        } catch (error) {
            logger.error('❌ Ошибка отслеживания TLS-сертификатов:', error);
        }
    }
}
const tlsService = new TLSService();
export default tlsService;
