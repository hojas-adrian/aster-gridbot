import { webhookCallback } from "./src/utils/deps.ts";
import { bot } from "./src/bot.ts";

const handleUpdate = webhookCallback(bot, "std/http");

await bot.init();

Deno.serve(async (req) => {
  const path = new URL(req.url).pathname.slice(1);

  if (req.method === "POST" && path === bot.token) {
    try {
      return await handleUpdate(req);
    } catch (err) {
      console.error(err);
    }
  }

  return Response.redirect(`https://telegram.me/${bot.botInfo.username}`);
});
