import Config from "../../config/Config.js";
import SlowlorisService from "../../application/services/SlowlorisService.js";

export default async function slowlorisMiddleware(socket) {
    const config = {
        TIMEOUT_MS: Config.TIMEOUT_MS || 15000,
        MAX_IDLE_TIME_MS: Config.MAX_IDLE_TIME_MS || 10000,
        MAX_CONNECTION_DURATION_MS: Config.MAX_CONNECTION_DURATION_MS || 900000
    }

    return new SlowlorisService(socket, config).start();
}
