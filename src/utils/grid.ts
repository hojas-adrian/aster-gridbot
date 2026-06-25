import {
  ASTER_DECIMALS,
  calcAsterPerOrder,
  calcGridLevels,
  calculateMaxGridSteps,
  delay,
  estimateGridProfitRange,
  MIN_USDT_PER_ORDER,
  roundDown,
  splitBuySellLevels,
  usdtToQuantity,
} from "./gridHelpers.ts";
import {
  cancelOrder,
  fee,
  getAsterBalance,
  getAsterPrice,
  getUsdtBalance,
  placeBuyOrder,
  placeMarketSellOrder,
  placeSellOrder,
} from "../integrations/aster.ts";
import { sendMessage } from "../integrations/grammy.ts";
import {
  getSingleOrder,
  replaceSingleOrder,
} from "../integrations/supabase.ts";

export interface GridResult {
  levels: number[];
  stepSize: number;
}

/**
 * Estima el rango de ganancias utilizando el número de pasos recomendado según balance y fees.
 */
export const estimateProfitRange = async (lower: number, upper: number) => {
  const balanceAster = await getAsterBalance();
  const maxStepsResult = calculateMaxGridSteps(lower, upper, balanceAster, fee);
  const recommendedSteps = maxStepsResult.recommended;

  const gridProfitData = estimateGridProfitRange(
    lower,
    upper,
    recommendedSteps,
    fee,
  );

  return {
    ...gridProfitData,
    stepsUsed: recommendedSteps,
    limits: maxStepsResult,
  };
};

/**
 * LÓGICA CORE: Valida, financia e inicia la ejecución del GridBot de forma simétrica
 */
export const startGrid = async (
  lower: number,
  upper: number,
  steps: number,
  feeDiscountUsd = 1, // Descuento variable en dólares (ej: 1.0)
) => {
  await sendMessage(`🚀 Iniciando proceso de creación de grilla simétrica...`);

  // 1. Obtener contexto del mercado y balances reales
  const currentPrice = +(await getAsterPrice());
  const initialAsterBalance = await getAsterBalance();

  // 2. Aplicar descuento: Restar el equivalente en ASTER del descuento en USD
  const asterDiscount = feeDiscountUsd / currentPrice;
  const netAsterBalance = initialAsterBalance - asterDiscount;

  if (netAsterBalance <= 0) {
    throw new Error(
      `El balance neto de ASTER es insuficiente tras aplicar el descuento de ${feeDiscountUsd} USD.`,
    );
  }

  // 3. Calcular niveles y separar superiores (Venta) e inferiores (Compra)
  const levels = calcGridLevels(lower, upper, steps);
  console.log(levels);

  const { buyLevels, sellLevels } = splitBuySellLevels(levels, currentPrice);

  const totalBuyLevels = buyLevels.length;
  const totalSellLevels = sellLevels.length;
  const totalLevels = totalBuyLevels + totalSellLevels;

  if (totalLevels === 0) {
    throw new Error("No se han generado niveles válidos para la grilla.");
  }

  // 4. Forzar Simetría: Calcular la cantidad EXACTA de ASTER por nivel para toda la grilla
  const asterPerOrder = calcAsterPerOrder(netAsterBalance, totalLevels);

  // El ASTER a vender a mercado es estrictamente el asignado a la cantidad de niveles de abajo
  const asterToSell = roundDown(asterPerOrder * totalBuyLevels, ASTER_DECIMALS);

  await sendMessage(
    `📊 *Planificación de Grilla Simétrica:*\n` +
      `• Cantidad fija por nivel: \`${asterPerOrder}\` ASTER\n` +
      `• Órdenes de compra: \`${totalBuyLevels}\` | Órdenes de venta: \`${totalSellLevels}\`\n` +
      `• Financiamiento: Vendiendo \`${asterToSell}\` ASTER a mercado para fondear compras.`,
  );

  // 5. Ejecutar el Swap a mercado de la porción inferior
  let usdtObtained = 0;
  if (asterToSell > 0) {
    usdtObtained = await placeMarketSellOrder(asterToSell);
    await sendMessage(
      `✅ Swap completado con éxito. Fondos obtenidos: \`${usdtObtained}\` USDT.`,
    );

    // 6. Función de espera para que se asienten los balances en el exchange/nodo
    await sendMessage(`⏳ Esperando 3 segundos a que el swap se asiente...`);
    await delay(3000);
  }

  // Verificar balance de USDT post-swap por seguridad operativa
  const currentUsdtBalance = await getUsdtBalance();

  // 7. Colocar órdenes límites de forma transaccional (con Rollback preventivo)
  const placedOrdersIds: number[] = [];

  try {
    // 7a. Colocar órdenes límite de Venta (Zona Superior)
    if (totalSellLevels > 0 && asterPerOrder > 0) {
      for (const price of sellLevels) {
        const orderResponse = await placeSellOrder(
          asterPerOrder,
          price,
          generateId(),
        );
        if (orderResponse && orderResponse.orderId) {
          placedOrdersIds.push(orderResponse.orderId);
        }
      }
    }

    // 7b. Colocar órdenes límite de Compra (Zona Inferior)
    if (totalBuyLevels > 0 && asterPerOrder > 0) {
      for (const price of buyLevels) {
        // Validar que tengamos suficiente USDT estimado para este nivel antes de enviar
        const estimatedUsdtRequiredForLevel = asterPerOrder * price;
        if (currentUsdtBalance < estimatedUsdtRequiredForLevel) {
          console.warn(
            `⚠️ Posible falta de liquidez en USDT para el nivel ${price}`,
          );
        }

        // Enviamos exactamente la misma cantidad de ASTER (asterPerOrder)
        const orderResponse = await placeBuyOrder(
          asterPerOrder,
          price,
          generateId(),
        );
        if (orderResponse && orderResponse.orderId) {
          placedOrdersIds.push(orderResponse.orderId);
        }
      }
    }

    await sendMessage(
      `🎉 ¡Grilla inicializada exitosamente de forma simétrica en el libro!`,
    );

    return {
      success: true,
      ordersCount: placedOrdersIds.length,
      usdtSpentInFinancing: usdtObtained,
    };
  } catch (error) {
    // 8. MECANISMO DE RESILIENCIA (Rollback en cascada ante fallos)
    await sendMessage(
      `🚨 Error detectado al colocar las órdenes límite: ${
        (error as Error).message
      }\n` +
        `Iniciando proceso de rollback de emergencia para limpiar órdenes huérfanas...`,
    );

    for (const id of placedOrdersIds) {
      try {
        await cancelOrder(id);
      } catch (_cancelErr) {
        await sendMessage(
          `⚠️ Alerta: No se pudo cancelar de forma automática la orden ID: ${id}. Requiere supervisión manual.`,
        );
      }
    }

    throw new Error(
      `La grilla no pudo ser inicializada correctamente. Rollback ejecutado.`,
    );
  }
};

function generateId(length = 5): string {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";

  // Usamos crypto.getRandomValues para obtener índices seguros
  const valoresAleatorios = new Uint32Array(length);
  crypto.getRandomValues(valoresAleatorios);

  for (let i = 0; i < length; i++) {
    // Usamos el módulo para obtener un índice válido dentro del rango del string
    id += caracteres[valoresAleatorios[i] % caracteres.length];
  }

  return `grid_${id}`;
}

export const updateGrid = async (
  price: number,
  side: string,
) => {
  // 1. Traer la que esta en supabase
  const existingOrder = await getSingleOrder();

  // 2. Si hay algo, ejecutamos la lógica condicional
  if (existingOrder) {
    const currentPrice = +await getAsterPrice();
    const existingOrderPrice = existingOrder.price;

    console.log(
      `[Grid] Evaluando: Orden Existente (${existingOrderPrice}) vs Precio Actual (${currentPrice})`,
    );

    // SI EL PRECIO DE LA ORDEN EXISTENTE ESTÁ POR DEBAJO DEL PRECIO ACTUAL
    if (existingOrderPrice < currentPrice) {
      const usdtBalance = await getUsdtBalance();
      const usdtToUse = usdtBalance; // Tu regla de restarle un dólar al balance

      // Validamos que el monto a usar cumpla con el mínimo del exchange (5 USDT)
      if (usdtToUse >= MIN_USDT_PER_ORDER) {
        // Usamos tu helper para calcular la cantidad exacta truncada hacia abajo
        const quantityToBuy = usdtToQuantity(usdtToUse, existingOrder.price);

        console.log(
          `[Grid] Comprando ${quantityToBuy} ASTER con ${usdtToUse} USDT.`,
        );
        await placeBuyOrder(quantityToBuy, existingOrder.price, generateId());
      } else {
        console.log(
          `[Grid] El monto resultante (${usdtToUse} USDT) es menor al mínimo requerido de ${MIN_USDT_PER_ORDER} USDT.`,
        );
      }
    } // SI EL PRECIO DE LA ORDEN EXISTENTE ESTÁ POR ENCIMA DEL PRECIO ACTUAL
    else if (existingOrderPrice > currentPrice) {
      const asterBalance = await getAsterBalance();

      // Calculamos cuánto ASTER equivale a 1 USD usando el precio actual
      const oneDollarInAster = 1 / currentPrice;
      // Truncamos hacia abajo el balance final a usar usando tu roundDown con los decimales del token
      const asterToUse = roundDown(
        asterBalance - oneDollarInAster,
        ASTER_DECIMALS,
      );

      // Verificamos que el valor de la orden en USDT cumpla con el mínimo de 5 USDT
      const estimatedUsdtValue = asterToUse * currentPrice;

      if (asterToUse > 0 && estimatedUsdtValue >= MIN_USDT_PER_ORDER) {
        console.log(
          `[Grid] Vendiendo ${asterToUse} ASTER (Valor aprox: ${estimatedUsdtValue} USDT).`,
        );
        await placeSellOrder(asterToUse, existingOrder.price, generateId());
      } else {
        console.log(
          `[Grid] No se coloca orden de venta. Cantidad insuficiente o valor inferior a ${MIN_USDT_PER_ORDER} USDT.`,
        );
      }
    } else {
      console.log("[Grid] El precio se mantiene igual.");
    }
  }

  await replaceSingleOrder({
    price: price,
    side: side,
  });
};

export default {
  estimateProfitRange,
  startGrid,
  updateGrid,
};
