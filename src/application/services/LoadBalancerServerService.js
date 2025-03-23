export default class LoadBalancerServers {
    constructor() {
        this.roundRobinIndexes = new Map();
        this.connectionCounts = new Map(); // Для least-connections
    }

    selectTargetServer(serversUrls, loadBalancingStrategy, url, clientIp) {
        if (!serversUrls.length) return null;

        switch (loadBalancingStrategy) {
            case 'round-robin':
                return this.roundRobin(serversUrls, url);
            case 'least-connections':
                return this.leastConnections(serversUrls);
            case 'ip-hash':
                return this.ipHash(serversUrls, clientIp);
            case 'random':
            default:
                return this.random(serversUrls);
        }
    }

    roundRobin(serversUrls, route) {
        if (!this.roundRobinIndexes.has(route)) {
            this.roundRobinIndexes.set(route, 0); // Инициализация индекса для маршрута
        }

        const currentIndex = this.roundRobinIndexes.get(route);
        const server = serversUrls[currentIndex];

        console.log(`🔄 Round-Robin выбрал сервер ${server} для маршрута ${route}`);

        // Обновляем индекс, сбрасывая его на 0, если достигли конца массива
        this.roundRobinIndexes.set(route, (currentIndex + 1) % serversUrls.length);

        return server;
    }

    leastConnections(serversUrls) {
        let minServer = serversUrls[0];
        let minConnections = this.connectionCounts.get(minServer) || 0;

        for (const server of serversUrls) {
            const connections = this.connectionCounts.get(server) || 0;
            if (connections < minConnections) {
                minConnections = connections;
                minServer = server;
            }
        }

        this.connectionCounts.set(minServer, (this.connectionCounts.get(minServer) || 0) + 1);
        return minServer;
    }

    ipHash(serversUrls, clientIp) {
        if (!clientIp) return this.random(serversUrls);
        const hash = [...clientIp].reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return serversUrls[hash % serversUrls.length];
    }

    random(serversUrls) {
        return serversUrls[Math.floor(Math.random() * serversUrls.length)];
    }

    releaseConnection(server) {
        if (this.connectionCounts.has(server)) {
            this.connectionCounts.set(server, Math.max(0, this.connectionCounts.get(server) - 1));
        }
    }
}