export class WsManager {
  private ws: WebSocket | null = null;
  private messageQueue: string[] = [];
  private activeSubscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private shouldReconnect = true;

  constructor(
    private url: string,
    private onMessage: (msg: unknown) => void,
    private reconnectIntervalMs = 1000,
    private maxReconnectAttempts = 5,
  ) {}

  public connect() {
    if (typeof WebSocket === "undefined") {
      throw new Error("WebSocket no está disponible en este entorno.");
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.shouldReconnect = true;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WebSocket conectado con éxito.");
      this.reconnectAttempts = 0;

      // 1. Re-suscribir automáticamente a los streams que ya estaban activos antes de la caída
      if (this.activeSubscriptions.size > 0) {
        console.log(
          "Re-suscribiendo a streams activos:",
          Array.from(this.activeSubscriptions),
        );
        this.subscribeToServer(Array.from(this.activeSubscriptions));
      }

      // 2. Enviar mensajes pendientes en la cola
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (msg) this.ws?.send(msg);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.e === "ping") {
          this.ws?.send(JSON.stringify({ e: "pong" }));
        }
        this.onMessage(msg);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error, event.data);
      }
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };

    this.ws.onclose = () => {
      if (!this.shouldReconnect) {
        return;
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn("Máximo de reintentos de WebSocket alcanzado.");
        return;
      }

      this.reconnectAttempts += 1;
      const delay = this.reconnectIntervalMs * this.reconnectAttempts;
      console.warn(`WebSocket desconectado. Reintentando en ${delay} ms...`);
      setTimeout(() => this.connect(), delay);
    };
  }

  public close() {
    this.shouldReconnect = false;
    this.activeSubscriptions.clear();
    this.ws?.close();
  }

  public subscribe(streams: string[]) {
    // Guardamos los streams localmente para resiliencia ante reconexiones
    streams.forEach((stream) => this.activeSubscriptions.add(stream));
    this.subscribeToServer(streams);
  }

  private subscribeToServer(streams: string[]) {
    const payload = JSON.stringify({
      method: "SUBSCRIBE",
      params: streams,
      id: Date.now(),
    });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      console.warn("Socket no listo, encolando suscripción:", streams);
      this.messageQueue.push(payload);
    }
  }
}
