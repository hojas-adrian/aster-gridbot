import { WsManager } from "../transport/WsManager.ts";

export class SpotWsService {
  private manager: WsManager | null = null;
  private url: string;
  private fallbackOnMessage?: (data: unknown) => void;
  private keepAliveInterval: any = null;
  private currentListenKey: string | null = null;

  constructor(
    url: string,
    private spotAccountService: any,
    onMessage?: (data: unknown) => void,
  ) {
    this.url = url;
    this.fallbackOnMessage = onMessage;
  }

  public connect(
    streams: string[] = [],
    onMessageCustom?: (data: unknown) => void,
  ) {
    const activeCallback = onMessageCustom || this.fallbackOnMessage;

    if (!activeCallback) {
      throw new Error(
        "Debe proporcionar un callback para manejar los mensajes (onMessage).",
      );
    }

    if (!this.manager) {
      this.manager = new WsManager(this.url, activeCallback);
    }

    this.manager.connect();

    if (streams.length > 0) {
      this.manager.subscribe(streams);

      // Detectamos si el stream enviado es una listenKey de usuario (no contiene '@')
      const posibleListenKey = streams.find((s) => !s.includes("@"));
      if (posibleListenKey) {
        this.currentListenKey = posibleListenKey;
        this.startKeepAliveTimer();
      }
    }
  }

  private startKeepAliveTimer() {
    this.stopKeepAliveTimer();

    console.log("⏱️ Sistema de Auto-Refresh activado para la listenKey.");
    const TREINTA_MINUTOS = 30 * 60 * 1000;

    this.keepAliveInterval = setInterval(async () => {
      try {
        console.log("🔄 Renovando listenKey en el servidor (Keep-Alive)...");
        const response = await this.spotAccountService.getListenKey();

        if (
          response.listenKey && response.listenKey !== this.currentListenKey
        ) {
          console.warn(
            "⚠️ La listenKey cambió inesperadamente. Re-suscribiendo...",
          );
          this.currentListenKey = response.listenKey;

          // Solución al error de TypeScript: Aseguramos el tipo asignándolo a una constante local
          const keyToSubscribe: string = response.listenKey;
          this.manager?.subscribe([keyToSubscribe]);
        } else {
          console.log("✅ ListenKey extendida con éxito por 60 minutos más.");
        }
      } catch (error) {
        console.error("❌ Error al intentar renovar la listenKey:", error);
      }
    }, TREINTA_MINUTOS);
  }

  private stopKeepAliveTimer() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  public subscribe(streams: string[]) {
    if (!this.manager) {
      throw new Error("WebSocket no inicializado. Llama a connect() primero.");
    }
    this.manager.subscribe(streams);
  }

  public subscribeTicker(symbol: string) {
    this.subscribe([`${symbol.toLowerCase()}@ticker`]);
  }

  public subscribeDepth(symbol: string, levels: 5 | 10 | 20 = 5) {
    this.subscribe([`${symbol.toLowerCase()}@depth${levels}`]);
  }

  public subscribeKlines(symbol: string, interval: string) {
    this.subscribe([`${symbol.toLowerCase()}@kline_${interval}`]);
  }

  public close() {
    this.stopKeepAliveTimer();
    if (this.manager) {
      this.manager.close();
    }
  }
}
