import { sendMessage } from "../integrations/grammy.ts";
import { escucharOrdenesFilled } from "../integrations/ws.ts";
import { Context } from "../utils/deps.ts";
import { startGrid } from "../utils/grid.ts";

export default async (ctx: Context) => {
  const commandArgs = (ctx.match as string).split(" ");

  console.log(commandArgs);

  const lowerPrice = +commandArgs[0] || 0.57963;
  const upperPrice = +commandArgs[1] || 0.81401;
  const gridSteps = +commandArgs[2] - 1 || 3;

  await sendMessage("=== Ejemplo: generateGrid ===");

  await startGrid(lowerPrice, upperPrice, gridSteps, 1);
  await escucharOrdenesFilled();
};
