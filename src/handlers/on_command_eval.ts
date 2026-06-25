import { sendMessage } from "../integrations/grammy.ts";
import { Context } from "../utils/deps.ts";
import { estimateProfitRange } from "../utils/grid.ts";

export default async (_ctx: Context) => {
  const lower = 0.57963;
  const upper = 0.81401;

  const profitReport = await estimateProfitRange(lower, upper);

  let message = `🤖 *REPORTE AUTO-AJUSTADO DE GRIDBOT*\n`;
  message += `===============================\n\n`;
  message += `📈 *Configuración Sugerida:*\n`;
  message += `• Rango: \`${lower}\` a \`${upper}\` ASTER/USDT\n`;
  message += `• Pasos recomendados: *${profitReport.stepsUsed}*\n`;
  message +=
    `• Tamaño de nivel (Spread): \`${profitReport.levelStep}\` USDT\n\n`;

  message += `💰 *Rendimiento Neto de los Bloques:*\n`;
  message += `• Mínimo: \`${profitReport.minNetProfitPct}%\`\n`;
  message += `• Máximo: \`${profitReport.maxNetProfitPct}%\`\n\n`;

  // MAPEO DE PRECIOS EXACTOS DE LOS NIVELES
  message += `🗺️ *Precios exactos de la Grilla:* \n`;
  profitReport.levels.forEach((price, idx) => {
    message += `  📍 Nivel ${idx}: \`${price}\` USDT\n`;
  });

  await sendMessage(message);
};
