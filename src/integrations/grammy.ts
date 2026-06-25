import { Api } from "../utils/deps.ts";
import { botToken, chatId } from "../utils/const.ts";

const api = new Api(botToken);

export const sendMessage = async (text: string) => {
  await api.sendMessage(chatId, text);
};
