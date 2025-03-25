import  WebSocketProxyService from '../../application/services/WebSocketProxyService.js';

class WebSocketController {
    constructor(routesRepository) {
        this.wsProxy = new WebSocketProxyService(routesRepository);
    }
    
    handleUpgrade(req, socket, head) {
        this.wsProxy.handleUpgrade(req, socket, head);
    }
}

export default WebSocketController;
