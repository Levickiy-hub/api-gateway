import routes from "../../interfaces/routes/routes.js";
import net from "net";
import crypto from "crypto";

class WebSocketProxyService {
    constructor() {
        this.wsConnections = new Map();
    }

    handleUpgrade(req, clientSocket, head) {
        const url = req.url;
        const targetUrl = routes[url];
        console.log(req.headers);
        console.log(head)
        if (!targetUrl) {
            console.log(`❌ No backend service found for ${url}`);
            clientSocket.destroy();
            return;
        }

        console.log(`🔗 Routing WebSocket request ${url} -> ${targetUrl}`);

        const { hostname, port } = new URL(targetUrl);

        const backendSocket = net.createConnection({ host: hostname, port: port }, () => {
            console.log(`✅ Connected to backend WebSocket: ${targetUrl}`);

            this.completeHandshake(req, clientSocket);

            backendSocket.write(head); // 🔄 Отправляем head на backend (важно!)

            // Двусторонний прокси: передаем данные между клиентом и бэкендом
            clientSocket.pipe(backendSocket);
            backendSocket.pipe(clientSocket);
        });

        // Обрабатываем ошибки соединения с бэкендом
        backendSocket.on("error", (err) => {
            console.error(`❌ Backend WebSocket error: ${err.message}`);
            clientSocket.destroy();
        });

        clientSocket.on("error", (err) => {
            console.error(`❌ Client WebSocket error: ${err.message}`);
            backendSocket.destroy();
        });

        backendSocket.on("close", () => clientSocket.destroy());
        clientSocket.on("close", () => backendSocket.destroy());
    }

    completeHandshake(req, socket) {
        const key = req.headers["sec-websocket-key"];
        const acceptKey = this.generateWebSocketAcceptKey(key);

        const responseHeaders = [
            "HTTP/1.1 101 Switching Protocols",
            "Upgrade: websocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Accept: ${acceptKey}`,
            "\r\n",
        ];

        socket.write(responseHeaders.join("\r\n"));
        console.log("✅ WebSocket Handshake complete with client.");
    }

    generateWebSocketAcceptKey(clientKey) {
        const magicGUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
        return crypto.createHash("sha1").update(clientKey + magicGUID).digest("base64");
    }
}

export default WebSocketProxyService;