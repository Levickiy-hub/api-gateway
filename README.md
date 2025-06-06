Резюме требований для проекта: многопоточный API Gateway на чистом Node.js
1️⃣ Базовый функционал (основа API Gateway)
Принимает HTTP-запросы и маршрутизирует их на бэкенд-сервисы.
Поддержка WebSocket-прокси.
Встроенный Rate Limiting для защиты от DDoS.
Встроенный SlowlorisProtection для защиты от медленных атак.
JWT-аутентификация и валидация токенов.
Логирование всех запросов (метод, путь, время, IP).
2️⃣ Высокая производительность и масштабируемость
Использование Worker Threads для многопоточной обработки.
Load Balancing между потоками (распределение нагрузки).
Поддержка Keep-Alive для уменьшения нагрузки на сеть.
Возможность работы в кластерном режиме (горизонтальное масштабирование).
3️⃣ Гибкость и динамическая маршрутизация
Конфигурация маршрутов (без перезапуска сервера).
Поддержка HTTP/2 для ускорения работы с клиентами.
Автоматическая маршрутизация по заголовкам (например, User-Agent).
Встроенная переадресация на ближайший сервер (geo-balancing).
4️⃣ Безопасность
Поддержка TLS (HTTPS) с автоматическим обновлением сертификатов.
Защита от Slowloris-атак и HTTP-флуда.
Ограничение запросов по IP-адресам / API-ключам.
Изоляция сервисов: защита бэкендов от прямых обращений.
5️⃣ Observability (мониторинг и отладка)
Поддержка Prometheus-метрик (запросы в секунду, ошибки, загрузка CPU).
Логирование в ELK / Loki + Grafana.
Трассировка запросов через Jaeger / OpenTelemetry.
Автоматические алерты при высоком времени отклика.
6️⃣ Деплой и интеграция
Запуск в Docker + Kubernetes (Helm charts, auto-scaling).
Поддержка Canary Deployment и Blue-Green Deployment.
CI/CD через GitHub Actions / GitLab CI.
Автоматическое обновление конфигурации через Webhook / gRPC.

архитектура проекта
api-gateway/
│── src/
│   │── application/                  # (Application Layer - сервисы и бизнес-логика)
│   │   │── services/                  # Бизнес-логика прокси-сервиса
|   |   |   │── CorsService.js          # обработка cors запросов
│   │   │   │── ProxyService.js         # Основной сервис проксирования (Фасад)
|   |   |   │── LoadBalancerServerService.js # Балансировка между конечными серверами (Стратегия)
│   │   │   │── LoadBalancerService.js  # Балансировка нагрузки между потоками (Стратегия)
│   │   │   │── AuthService.js          # Аутентификация (Фабричный метод)
│   │   │   │── MonitoringService.js    # Мониторинг и логирование (Наблюдатель)
|   |   |   │── WebSocketProxyService.js # Будет перенаправлять WebSocket-соединения
|   |   |   |── HttpServerFactory .js    # Фабрика отвечаеющая за создание сервера для обработки запросов.
│   │── domain/                         # (Domain Layer - бизнес-логика)
│   │   │── services/                    # сервисы домена (Объекты предметной области)
│   │   │   │── GeoBalancingService.js   # Встроенная переадресация на ближайший сервер (geo-balancing)
│   │   │── dtos/                       # Data Transfer Objects (DTO)
│   │   │   │── RequestDto.js           # DTO для запросов
│   │   │── repositories/                # Репозитории (паттерн Repository)
│   │   │   │── RouteRepository.js       # Доступ к маршрутам
│   │── infrastructure/                  # (Infrastructure Layer - взаимодействие с внешним миром)
│   │   │── services/                     # Логика работы с внешними сервисами
│   │   │   │── IpService.js              # Логика работы с IP (Одиночка)
│   │   │   │── TLSService.js             # Настройка и обновление сертификатов
|   |   |   │── LoggerService.js          #Логика логирования
│   │   │   │── UUIDService.js            # Логика генерации UUID
│   │   │   │── ConfigService.js          # Логика получени конфига (singleton)
|   |   │── factories/                      # Фабрики — это отдельная категория инфраструктурных компонентов
|   |   |   │── AppFactory.js               # Управляет созданием и конфигурацией компонентов системы
│   │   │── workers/                     # Потоки (Worker Threads)
│   │   │   │── WorkerManager.js          # Менеджер потоков (для распределения работы по воркерам)
|   |   |   |── Worker.js                   # Логика обработки запроса в потоке (Команда)
│   │   │── middleware/                   # Middleware для валидации и логирования (Decorator)
│   │   │   │── LoggerMiddleware.js       # Логирование запросов
│   │   │   │── RateLimiterMiddleware.js  # Ограничение запросов (Token Bucket)
│   │   │── config/                       # Конфигурация проекта (Конфигуратор)
|   |   |   │── cert/                      # Сертификаты tls
|   |   |   |   │── 
|   |   |   |   │──  
|   |   |   |   │──  
│   │   │   │── ConfigValidator.js         # Валидатор конфигурации (внутри инфраструктуры)
│   │   │   │── services.json                 # Загрузка конфигурации (env, json)
│   │   │── repositories/                # Репозитории (паттерн Repository)
│   │   │   │── ConfigRepository.js      # Репозиторий конфигурации (работа с файлами конфигурации)
|   |   |   │── RateLimiterRepository.js   # Репозиторий для хранения и работы с количеством запросов
│   │── interfaces/                        # (Interface Layer - контроллеры и API)
│   │   │── controllers/                   # Контроллеры API Gateway
│   │   │   │── GatewayController.js       # Контроллер запросов (Фабричный метод)
|   |   |   │── WebSocketController.js     # WebSocket-контроллер
|   |   |   │── ServerManager.js           # Логика запуска сервера и воркеров (Фасад)
│   │── server.js                           # Точка входа в приложение (Entry Point)
│── tests/                                  # Тесты (юнит и интеграционные)
│   │── integration/                        # Интеграционные тесты
│   │── unit/                               # Юнит-тесты
│── k8s
│   ├── deployment.yaml                     # Деплоймент в K8s
│   ├── service.yaml                        # Сервис в K8s
│   ├── hpa.yaml                            # Авто-масштабирование
│── helm
│   ├── api-gateway                         
│       ├── Chart.yaml                      # Helm-чарт API Gateway
│       ├── values.yaml                     # Параметры развертывания
│── Dockerfile                              # Docker-контейнер
│── docker-compose.yml                      # Запуск нескольких сервисов
│── README.md                               # Документация
