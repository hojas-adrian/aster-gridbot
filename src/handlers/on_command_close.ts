import { cerrarWebSocket } from "../integrations/ws.ts";
import { Context } from "../utils/deps.ts";

export default async (_ctx: Context) => {
  await cerrarWebSocket();
};
