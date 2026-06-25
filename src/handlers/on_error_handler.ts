import { BotError, GrammyError, HttpError } from "../utils/deps.ts";
import { ERROR_MESSAGES } from "../utils/const.ts";

export default (err: BotError) => {
  const ctx = err.ctx;
  console.error(`${ERROR_MESSAGES.UPDATE_ERROR} ${ctx.update.update_id}:`);
  const e = err.error;

  switch (true) {
    case e instanceof GrammyError:
      console.error(ERROR_MESSAGES.REQUEST_ERROR, e.description);
      break;
    case e instanceof HttpError:
      console.error(ERROR_MESSAGES.TELEGRAM_ERROR, e);
      break;
    default:
      console.error(ERROR_MESSAGES.UNKNOWN_ERROR, e);
      break;
  }
};
