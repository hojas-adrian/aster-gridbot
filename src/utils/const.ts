import { StringConstant } from "./types.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
const CHAT_ID = Deno.env.get("CHAT_ID");
const API_WALLET_ADDRESS = Deno.env.get("API_WALLET_ADDRESS");
const ASTER_PRIVATE_KEY = Deno.env.get("ASTER_PRIVATE_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_PUBLIC_KEY = Deno.env.get("SUPABASE_PUBLIC_KEY");

if (
  !BOT_TOKEN || !CHAT_ID || !API_WALLET_ADDRESS || !ASTER_PRIVATE_KEY ||
  !SUPABASE_URL || !SUPABASE_PUBLIC_KEY
) {
  throw new Error(
    "Faltan las credenciales en el archivo .env o en las variables de entorno",
  );
}

export const botToken = BOT_TOKEN;
export const chatId = CHAT_ID;
export const apiWalletAddress = API_WALLET_ADDRESS;
export const asterPrivateKey = ASTER_PRIVATE_KEY;
export const supabaseUrl = SUPABASE_URL;
export const supabasePublicKey = SUPABASE_PUBLIC_KEY;

/**
 * Strings
 */
export const ERROR_MESSAGES: StringConstant = {
  UPDATE_ERROR: "Error while handling update",
  REQUEST_ERROR: "Error in request",
  TELEGRAM_ERROR: "Could not contact Telegram",
  UNKNOWN_ERROR: "Unknown error",
};
