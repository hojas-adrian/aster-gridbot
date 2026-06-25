import { Context } from "../utils/deps.ts";

export default async (ctx: Context) => {
  return await ctx.reply(
    "¡Hola! Soy tu bot de trading. Envíame una orden en el siguiente formato:\n\n" +
      "/order <symbol> <side> <quantity> <price>",
  );
};
