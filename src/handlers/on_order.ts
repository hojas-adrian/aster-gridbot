import { Context } from "../utils/deps.ts";
import { parseData, placeOrder } from "../utils/fun.ts";

export default async (ctx: Context) => {
  const message = ctx.message!; // Siempre hay mensaje en este contexto

  try {
    const data = parseData(message.text || "");
    ctx.reply(
      `Procesando tu orden:\n${data.symbol} - ${data.side} - ${data.price} - ${data.size}`,
    ); // Respuesta inmediata
    const orderResult = await placeOrder(data);
    await ctx.reply(
      `Recibí tu orden:\n${data.symbol} - ${data.side} - ${data.price} - ${data.size}\nResultado: ${orderResult ? "Orden ejecutada" : "Orden no válida"}\n${orderResult}`,
    );
  } catch (_e) {
    await ctx.reply(
      "Error al procesar tu orden. Asegúrate de que el formato sea correcto. _error: " +
        _e,
    );
    return;
  }
};
