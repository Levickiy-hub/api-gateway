export default class LoadBalancerServers {
    constructor(sharedArray) {
        this.sharedArray = sharedArray;
    }

    selectTargetServer(serversUrls, loadBalancingStrategy, req) {
        if (!serversUrls.length) return null;

        switch (loadBalancingStrategy) {
            case 'round-robin':
                return this.roundRobin(serversUrls);
            case 'least-connections':
                return this.leastConnections(serversUrls);
            case 'ip-hash':
                return this.ipHash(serversUrls, req);
            case 'random':
            default:
                return this.random(serversUrls);
        }
    }

    roundRobin(serversUrls) {
        const index = Atomics.add(this.sharedArray, 0, 1) % serversUrls.length;
        return serversUrls[index];
    }

    leastConnections(serversUrls) {
        let minIndex = 1; // Индексы начинаются с 1 (0 - для round-robin)
        let minConnections = Atomics.load(this.sharedArray, minIndex);

        for (let i = 1; i < serversUrls.length + 1; i++) {
            const connections = Atomics.load(this.sharedArray, i);
            if (connections < minConnections) {
                minConnections = connections;
                minIndex = i;
            }
        }

        Atomics.add(this.sharedArray, minIndex, 1);
        return serversUrls[minIndex - 1];
    }

    ipHash(serversUrls, req) {
        const clientIp = req.ip;
        if (!clientIp) return this.random(serversUrls);
        const hash = [...clientIp].reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return serversUrls[hash % serversUrls.length];
    }

    random(serversUrls) {
        return serversUrls[Math.floor(Math.random() * serversUrls.length)];
    }

    releaseConnection(serverIndex) {
        Atomics.sub(this.sharedArray, serverIndex + 1, 1);
    }
}
