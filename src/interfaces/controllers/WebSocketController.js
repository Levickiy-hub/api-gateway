import  WebSocketProxyService from '../../application/services/WebSocketProxyService.js';

class WebSocketController {
    constructor() {
        this.wsProxy = new WebSocketProxyService();
    }
    
    handleUpgrade(req, socket, head) {
        this.wsProxy.handleUpgrade(req, socket, head);
    }
}

export default WebSocketController;
