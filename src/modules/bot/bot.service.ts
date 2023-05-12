import { copy } from "std/streams/copy.ts";
import { PrintService } from "/modules/print/print.service.ts";
import { Logger } from "/utils/logger.ts";
import { Bot } from "grammy";
import { readerFromStreamReader } from "std/streams/reader_from_stream_reader.ts";
import { fileExtension } from "file_extension";
// import { PrintManager } from "./printManager.ts";

export class BotService {
  private userIds: number[] = [];
  private bot: Bot;
  constructor(
    private token: string,
    private printService: PrintService,
    private logger: Logger
  ) {
    this.bot = new Bot(token);
    this.initHandlers();
  }
  setAvailableUsers(ids: number[]) {
    this.userIds = [...ids];
  }
  async start() {
    await this.bot.start();
  }

  async stop() {
    await this.bot.stop();
  }

  private initHandlers() {
    // Error handler
    this.bot.use(async (ctx) => {
      try {
        const userId = ctx.message?.from?.id;
        if (userId && this.userIds.includes(ctx.message?.from?.id)) {
          const message = ctx.message!;
          if (message.document?.file_id) {
            const file = await ctx.getFile();
            const fileName = await this.downloadFile(file.file_path!);
            this.logger.debug(message);
            await this.printService
              .getManager(userId)
              .addDocument(fileName, message.document.mime_type!);
          }
          if (message.caption || message.text) {
            await this.printService
              .getManager(userId)
              .addText(message.caption || message.text || "");
          }
          ctx.reply(await this.printService.getManager(userId).execute());
        } else {
          ctx.reply("Forbidden");
          this.logger.debug("Unknown user", ctx.message);
        }
        //await next(ctx);
      } catch (err) {
        this.logger.error("Bot error", err);
        try {
          ctx.reply(err.message);
        } catch {}
      }
    });
  }

  private async downloadFile(filePath: string): Promise<string> {
    const response = await fetch(
      `https://api.telegram.org/file/bot${this.token}/${filePath}`
    );
    const reader = response.body?.getReader();
    if (reader) {
      const stream = readerFromStreamReader(reader);
      const tempDirPath = await Deno.makeTempFile({
        suffix: `.${fileExtension(filePath)}`,
      });
      const file = await Deno.open(tempDirPath, {
        create: true,
        write: true,
      });
      await copy(stream, file);
      file.close();
      return tempDirPath;
    }
    throw new Error("Download file error");
  }
}
