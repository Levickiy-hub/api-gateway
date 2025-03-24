export default class CorsService {
    static getCorsHeaders(req, routeConfig) {
        if (!routeConfig || !routeConfig.cors) return {}; // Если CORS не настроен, возвращаем пустые заголовки

        const { allowedOrigins, allowedMethods, allowedHeaders, allowCredentials } = routeConfig.cors;
        const origin = req.headers['origin'];

        const corsHeaders = {};

        // Проверяем, разрешен ли запрашивающий домен
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            corsHeaders['Access-Control-Allow-Origin'] = allowedOrigins.includes('*') ? '*' : origin;
        }

        // Разрешенные методы (GET, POST и т. д.)
        if (allowedMethods && allowedMethods.length) {
            corsHeaders['Access-Control-Allow-Methods'] = allowedMethods.join(', ');
        }

        // Разрешенные заголовки
        if (allowedHeaders && allowedHeaders.length) {
            corsHeaders['Access-Control-Allow-Headers'] = allowedHeaders.join(', ');
        }

        // Разрешение отправки кук и токенов (если нужно)
        if (allowCredentials) {
            corsHeaders['Access-Control-Allow-Credentials'] = 'true';
        }

        return corsHeaders;
    }

    static handlePreflight(req) {
        return req.method === 'OPTIONS';
    }
}
