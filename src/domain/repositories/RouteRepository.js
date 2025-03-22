import routes from "../../interfaces/routes/routes.js";

class RouteRepository {
    constructor() {
        this.routes = {...routes}
    }

    getTarget(url) {
        const route = this.routes[url] || null;
        if (!route) {
            console.error(`Target not found for URL: ${url}`)
            throw new Error(`Target not found`);
        }
        return route;
    }

    addRoute(path, targetUrl) {
        this.routes[path] = targetUrl;
    }

    removeRoute(path) {
        delete this.routes[path];
    }
}

export default new RouteRepository();