import { Logger } from "/utils/logger.ts";
import { exec } from "/utils/cli.ts";
import { HELP_TEXT } from "/utils/helpers.ts";
import { Command, QueueItem } from "./types.ts";
import {
  PdfPrinter,
  ImgPrinter,
  OfficePrinter,
  Printer,
  TextPrinter,
} from "./printer/printer.ts";

export class PrintManager {
  constructor(private userId: number, private logger: Logger) {}
  get Id() {
    return this.userId;
  }
  private queue: QueueItem[] = [];
  private currentPrinter: Printer | null = null;

  addDocument(doc: string, mime: string): void {
    // clear queue on new document
    this.queue = [{ type: "document", params: { doc, mime } }];
    this.currentPrinter = null;
  }

  addText(text: string): void {
    if (text in Command) {
      this.queue = [{ type: "command", params: text as Command }];
    } else this.queue.push({ type: "text", params: text });
  }

  async execute(): Promise<string> {
    if (this.queue.length === 0 || this.queue[0].type === "text") {
      return "Command or file not found";
    }
    if (this.queue[0].type === "command") {
      switch (this.queue[0].params) {
        case Command["/start"]:
          this.queue = [];
          return HELP_TEXT;
        case Command["/stop"]:
          this.queue = [];
          await this.stopPrinting();
          return "Printing stoped";
        case Command["/text"]:
          this.currentPrinter = null;
          if (this.queue.length === 1) {
            return "Write text for printing";
          } else if (this.queue[1].type === "text") {
            return this.print(new TextPrinter(this.queue[1].params));
          } else {
            this.queue = [];
            return "Unknown argumemnts";
          }
      }
    }
    if (this.queue[0].type === "document") {
      return this.checkDocument(
        this.queue[0].params.doc,
        this.queue[0].params.mime,
        this.queue.length > 1 && this.queue[1].type === "text"
          ? this.queue[1].params
          : undefined
      );
    }
    return "Unknown arguments";
  }

  private async stopPrinting() {
    try {
      await exec(["cancel"]);
    } catch (err) {
      this.logger.error("Cancel printing error", err);
    }
  }

  private async checkDocument(
    file: string,
    mime: string,
    params?: string
  ): Promise<string> {
    if (this.currentPrinter) {
      if (!params) {
        this.currentPrinter = null;
        return "Parameters error. Try again.";
      }
      return await this.print(this.currentPrinter, params);
    }

    try {
      if (mime.startsWith("image")) {
        return this.print(new ImgPrinter(file));
      } else if (
        ["excel", "msword", "office", "rtf", "opendocument"].find((format) =>
          mime.includes(format)
        )
      ) {
        return this.print(
          new OfficePrinter(file),
          this.queue.length > 1 && this.queue[1].type === "text"
            ? this.queue[1].params
            : undefined
        );
      } else if (mime.includes("pdf")) {
        return this.print(
          new PdfPrinter(file),
          this.queue.length > 1 && this.queue[1].type === "text"
            ? this.queue[1].params
            : undefined
        );
      } else {
        this.queue = [];
        this.currentPrinter = null;
        return "Print error. Unknown file format";
      }
    } catch (err) {
      this.logger.error("Printing document error", err);
      return `Print error ${err.message}`;
    }
  }

  private async print(printer: Printer, pages?: string): Promise<string> {
    if (!pages) {
      // if pages in document more then 5 it needs to confirmate
      const pgCount = await printer.getPages();
      if (pgCount > 1) {
        this.currentPrinter = printer;
        return `Document contains ${pgCount} pages. If you want to print all of them send "all" message, else send pages range`;
      }
    }

    this.currentPrinter = null;
    this.queue = [];
    if (await printer.print(pages && pages !== "all" ? pages : undefined)) {
      return "Printing completed";
    } else {
      return "Print error";
    }
  }
}
