import { Bot, limit } from "./utils/deps.ts";
import { botToken } from "./utils/const.ts";
import onErrorHandler from "./handlers/on_error_handler.ts";
import onCommandStart from "./handlers/on_command_start.ts";
import onCommandTrade from "./handlers/on_command_trade.ts";
import onCommandEval from "./handlers/on_command_eval.ts";
import onCommandClose from "./handlers/on_command_close.ts";

export const bot = new Bot(botToken);
bot.use(limit());

bot.command("start", onCommandStart);
//bot.command("grid", onCommandTrade);
bot.command("eval", onCommandEval);
bot.command("close", onCommandClose);
//bot.on("message", placeOrder);

bot.catch(onErrorHandler);
