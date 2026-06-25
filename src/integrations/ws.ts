import { AsterSdk } from "../asterSDK/AsterSdk.ts";
import { OrderUpdatePayload } from "../asterSDK/models/spot/WsModels.ts";
import { apiWalletAddress, asterPrivateKey } from "../utils/const.ts";
import { updateGrid } from "../utils/grid.ts";

// Definimos la función que procesará los mensajes devueltos por el SDK
function procesarMensajesWs(wsMessage: unknown) {
  const message = wsMessage as { e?: string; X?: string };
  if (message.e === "executionReport" && message.X === "FILLED") {
    const orderUpdate = wsMessage as OrderUpdatePayload;

    if (orderUpdate.c.startsWith("grid_")) {
      updateGrid(+orderUpdate.ap, orderUpdate.S);
    }
  }
}

const sdk = new AsterSdk({
  walletAddress: apiWalletAddress,
  privateKey: asterPrivateKey,
  onSpotMessage: procesarMensajesWs, // Callback por defecto
});

export async function escucharOrdenesFilled() {
  try {
    console.log("Solicitando listenKey...");
    const response = await sdk.spot.account.getListenKey();
    const listenKey = response.listenKey;

    console.log("Conectando y suscribiendo automáticamente...");

    // Conectamos y suscribimos en una sola línea interactuando sólo con sdk.ws
    sdk.ws.connect([listenKey]);

    console.log("✅ Escucha activa para órdenes FILLED a través de sdk.ws");
  } catch (error) {
    console.error("❌ Error iniciando escucha:", error);
  }
}

export function cerrarWebSocket() {
  // Cerramos desde el SDK
  sdk.ws.close();
}
