import { AsterSdk } from "../asterSDK/AsterSdk.ts";
import { apiWalletAddress, asterPrivateKey } from "../utils/const.ts";
import { PriceTicker } from "../asterSDK/models/spot/MarketModels.ts";
import { AccountInfo } from "../asterSDK/models/spot/AccountModels.ts";
import { sendMessage } from "./grammy.ts";
// Importamos tus nuevos métodos de BigInt
import {
  inferDecimals,
  toApiString,
  tokenToStable,
} from "../asterSDK/helpers/numberHelpers.ts"; // Ajusta la ruta según corresponda

const sdk = new AsterSdk({
  walletAddress: apiWalletAddress,
  privateKey: asterPrivateKey,
});

// Configuración de precisión oficial del exchange para el par ASTER/USDT
export const ASTER_DECIMALS = 2;
export const USDT_DECIMALS = 2; // O los decimales que exija la API para el precio/USDT
export const fee = 0.005 / 100; // 0.005%

const getAssetBalance = async (asset: string): Promise<number> => {
  const info = await sdk.spot.account.getAccountInfo() as AccountInfo;
  const assetBalance = info.balances.find((balance) => balance.asset === asset);
  return assetBalance ? parseFloat(assetBalance.free) : 0;
};

export const getAsterBalance = async (): Promise<number> => {
  return await getAssetBalance("ASTER");
};

export const getUsdtBalance = async (): Promise<number> => {
  return await getAssetBalance("USDT");
};

export const getAsterPrice = async (): Promise<string> => {
  const price = await sdk.spot.market.getLatestPrice(
    "ASTERUSDT",
  ) as PriceTicker;
  return price.price; // Lo dejamos como string para mantener la precisión del helper
};

export const cancelOrder = async (id: number): Promise<void> => {
  await sdk.spot.account.cancelOrder("ASTERUSDT", id);
};

/**
 * Coloca una orden LÍMITE (Compra o Venta) usando los helpers de BigInt
 */
export const placeLimitOrder = async (
  side: "BUY" | "SELL",
  quantity: number | string,
  price: number | string,
  id: string,
) => {
  // Aplicamos formateo estricto con truncado hacia abajo usando tus helpers
  const formattedPrice = toApiString(price, USDT_DECIMALS);
  const formattedQuantity = toApiString(quantity, ASTER_DECIMALS);

  await sendMessage(
    `[Aster] Colocando orden LIMIT de ${side} | Cantidad: ${formattedQuantity} | Precio: ${formattedPrice}`,
  );

  return await sdk.spot.account.createOrder({
    symbol: "ASTERUSDT",
    side,
    type: "LIMIT",
    price: parseFloat(formattedPrice), // Convertimos al tipo numérico que pide el SDK pero ya formateado seguro
    quantity: parseFloat(formattedQuantity),
    timeInForce: "GTC",
    newClientOrderId: id, // Usamos tu ID personalizado para rastrear la orden
  });
};

export const placeBuyOrder = async (
  quantity: number | string,
  price: number | string,
  id: string,
) => await placeLimitOrder("BUY", quantity, price, id);

export const placeSellOrder = async (
  quantity: number | string,
  price: number | string,
  id: string,
) => await placeLimitOrder("SELL", quantity, price, id);

/**
 * Coloca una orden MARKET de VENTA (Financiamiento)
 * Vende ASTER y retorna una estimación matemáticamente exacta en string de los USDT recibidos netos.
 */
export const placeMarketSellOrder = async (
  quantity: number | string,
): Promise<number> => {
  const formattedQuantity = toApiString(quantity, ASTER_DECIMALS);
  if (parseFloat(formattedQuantity) <= 0) return 0;

  const currentPrice = await getAsterPrice();
  const priceDecimals = inferDecimals(currentPrice);

  await sendMessage(
    `[Aster] Ejecutando MARKET SELL de ${formattedQuantity} ASTER para financiamiento.`,
  );

  await sdk.spot.account.createOrder({
    symbol: "ASTERUSDT",
    side: "SELL",
    type: "MARKET",
    quantity: parseFloat(formattedQuantity),
  });

  // Usamos tu función tokenToStable para saber exactamente cuánto USDT bruto recibimos
  const usdtBrutoStr = tokenToStable(
    formattedQuantity,
    ASTER_DECIMALS,
    currentPrice,
    priceDecimals,
    USDT_DECIMALS,
  );

  // Restamos la fee usando la misma lógica conservadora de truncado
  const feeFactor = 1 - fee;
  const usdtNetoStr = tokenToStable(
    usdtBrutoStr,
    USDT_DECIMALS,
    feeFactor,
    5, // decimales aproximados para el factor 0.99995
    USDT_DECIMALS,
  );

  return parseFloat(usdtNetoStr);
};

/**
 * Coloca una orden MARKET de COMPRA usando fondos en USDT (quoteOrderQty)
 */
export const placeMarketBuyOrder = async (usdtAmount: number | string) => {
  const formattedUsdt = toApiString(usdtAmount, USDT_DECIMALS);
  if (parseFloat(formattedUsdt) <= 0) return null;

  await sendMessage(
    `[Aster] Ejecutando MARKET BUY por un valor de ${formattedUsdt} USDT.`,
  );

  return await sdk.spot.account.createOrder({
    symbol: "ASTERUSDT",
    side: "BUY",
    type: "MARKET",
    quoteOrderQty: parseFloat(formattedUsdt),
  });
};

export async function abrirWebSocket(): Promise<AsterSdk> {
  console.log("🔌 Abriendo conexión WebSocket...");

  const ws = new AsterSdk({
    walletAddress: apiWalletAddress,
    privateKey: asterPrivateKey,
    authMode: "EIP712",
    spotWsUrl: "wss://sstream.asterdex.com/ws",
    onSpotMessage: (message: unknown) => {
      // Callback que se ejecuta cuando llega un mensaje del WebSocket
      console.log("📨 Mensaje recibido:", JSON.stringify(message, null, 2));
    },
  });

  // Esperar un momento para que la conexión se establezca
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("✅ WebSocket abierto correctamente");
  return ws;
}

/**
 * Función 2.5: Escuchar órdenes completadas (filled) vía WebSocket
 * Se suscribe al user data stream para recibir eventos de órdenes ejecutadas
 */
export async function escucharOrdenesFilled(
  duracionSegundos: number = 60,
): Promise<void> {
  if (!sdk) {
    throw new Error(
      "El SDK no está inicializado. Llama a abrirWebSocket() primero.",
    );
  }

  console.log(
    `📊 Escuchando órdenes completadas por ${duracionSegundos} segundos...`,
  );

  try {
    // 1. Obtener listen key para el user data stream
    const { listenKey } = await sdk.spot.account.getListenKey();
    console.log(`🔑 Listen key obtenida: ${listenKey}`);

    // 2. Crear un nuevo WebSocket específico para user data
    const userDataWs = new WebSocket(
      `wss://sstream.asterdex.com/ws/${listenKey}`,
    );

    userDataWs.onopen = () => {
      console.log("✅ Conectado al user data stream");
    };

    userDataWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Filtrar solo eventos de orden completada (FILLED)
        if (data.e === "executionReport" && data.X === "FILLED") {
          console.log("🎉 ORDEN COMPLETADA:", {
            symbol: data.s,
            side: data.S,
            orderType: data.o,
            quantity: data.q,
            price: data.p,
            orderId: data.i,
            tradeId: data.t,
            commission: data.n,
            commissionAsset: data.N,
          });
        } else if (data.e === "executionReport") {
          console.log("📋 Evento de orden:", {
            eventType: data.e,
            orderStatus: data.X,
            symbol: data.s,
            side: data.S,
          });
        }
      } catch (error) {
        console.error("Error parsing user data message:", error);
      }
    };

    userDataWs.onerror = (err) => {
      console.error("❌ Error en user data WebSocket:", err);
    };

    userDataWs.onclose = () => {
      console.log("🔌 User data WebSocket cerrado");
    };

    // 3. Mantener la conexión abierta por el tiempo especificado
    await new Promise((resolve) =>
      setTimeout(resolve, duracionSegundos * 1000)
    );

    // 4. Cerrar el WebSocket de user data
    userDataWs.close();

    console.log(`⏱️ Tiempo de escucha de órdenes finalizado`);
  } catch (error) {
    console.error("❌ Error al escuchar órdenes filled:", error);
    throw error;
  }
}
