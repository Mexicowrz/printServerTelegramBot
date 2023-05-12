import "dotenv";
import { PrintService } from "./modules/print/print.service.ts";
import { BotService } from "/modules/bot/bot.service.ts";
import { logger } from "/utils/logger.ts";

export async function startBot() {
  const bot = new BotService(
    Deno.env.get("BOT_TOKEN")!,
    new PrintService(logger),
    logger
  );
  bot.setAvailableUsers(
    Deno.env
      .get("ALLOW_USERS")!
      .split(",")
      .map((idStr) => +idStr)
  );
  await bot.start();
}
