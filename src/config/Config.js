const Config = {
    PORT: process.env.PORT || 3000,
    RATE_LIMIT: 100, // Максимальное количество запросов в минуту
    TIMEOUT_MS: 1500,  // Время ожидания первого пакета данных
    MAX_IDLE_TIME_MS: 10000, // Максимальное время без данных после первого пакета
    MAX_CONNECTION_DURATION_MS : 900000 // Максимальная длительность соединения (15 минут)
};

export default Config;