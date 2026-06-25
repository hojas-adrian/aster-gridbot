import { WsManager } from "../transport/WsManager.ts";

export class FutureWsService {
    private manager: WsManager | null = null;

    constructor(private url: string, onMessage?: (data: unknown) => void) {
        if (onMessage) {
            this.manager = new WsManager(url, onMessage);
            this.manager.connect();
        }
    }

    private ensureManager(): WsManager {
        if (!this.manager) {
            throw new Error(
                "Future WebSocket no está inicializado. Proporcione un callback onMessage al crear el servicio.",
            );
        }
        return this.manager;
    }

    subscribeTicker(symbol: string) {
        this.ensureManager().subscribe([`${symbol.toLowerCase()}@ticker`]);
    }

    subscribeDepth(symbol: string, levels: 5 | 10 | 20 = 5) {
        this.ensureManager().subscribe([
            `${symbol.toLowerCase()}@depth${levels}`,
        ]);
    }

    subscribeKlines(symbol: string, interval: string) {
        this.ensureManager().subscribe([
            `${symbol.toLowerCase()}@kline_${interval}`,
        ]);
    }

    async close(): Promise<void> {
        this.ensureManager().close();
    }
}
