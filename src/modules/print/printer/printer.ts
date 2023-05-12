import { exec } from "../../../utils/cli.ts";
import { fileExtension } from "file_extension";

export interface Printer {
  getPages: () => Promise<number>;
  print: (pages?: string) => Promise<boolean>;
}

export class PdfPrinter implements Printer {
  constructor(private fileName: string) {}

  async getPages(): Promise<number> {
    try {
      const commandLine = await exec([
        "exiftool",
        "-T",
        "-filename",
        "-PageCount",
        "-s3",
        "-ext",
        "pdf",
        this.fileName,
      ]);
      return +(commandLine.split(/\s/)?.pop() || 0);
    } catch (err) {
      console.error("Get PDF pages error", err);
    }
    return 0;
  }

  async print(pages?: string | undefined): Promise<boolean> {
    try {
      await exec([
        "lp",
        ...(pages ? ["-P", pages] : []),
        "-o",
        "media=A4",
        "-o",
        "fit-to-page",
        this.fileName,
      ]);
      return true;
    } catch (err) {
      console.error("Pring PDF error", err);
    }
    return false;
  }
}

export class ImgPrinter implements Printer {
  constructor(private fileName: string) {}

  async getPages(): Promise<number> {
    return 1;
  }

  async print(_pages?: string | undefined): Promise<boolean> {
    try {
      await exec(["lp", "-o", "media=A4", "-o", "fit-to-page", this.fileName]);
      return true;
    } catch (err) {
      console.error("Pring Image error", err);
    }
    return false;
  }
}

export class TextPrinter implements Printer {
  private fileName?: string;
  constructor(private text: string) {}
  async getPages(): Promise<number> {
    return 1;
  }
  async print(pages?: string | undefined): Promise<boolean> {
    try {
      await exec([
        "lp",
        ...(pages ? ["-P", pages] : []),
        "-o",
        "media=A4",
        "-o",
        "fit-to-page",
        await this.getFile(),
      ]);
      return true;
    } catch (err) {
      console.error("Pring Text error", err);
    }
    return false;
  }

  private async getFile(): Promise<string> {
    if (!this.fileName) {
      this.fileName = await Deno.makeTempFile();
      await Deno.writeTextFile(this.fileName, this.text);
    }
    return this.fileName;
  }
}

export class OfficePrinter implements Printer {
  private pdfPrinter?: PdfPrinter;
  constructor(private fileName: string) {}
  async getPages(): Promise<number> {
    return (await this.getPdfPrinter()).getPages();
  }
  async print(pages?: string | undefined): Promise<boolean> {
    return (await this.getPdfPrinter()).print(pages);
  }

  private async getPdfPrinter(): Promise<PdfPrinter> {
    if (!this.pdfPrinter) {
      // const pdfDir = await Deno.makeTempDir();
      await exec([
        "libreoffice",
        "--headless",
        "--convert-to",
        "pdf",
        this.fileName,
        "--outdir",
        "/tmp"
      ]);

      const pdfFile = `${this.fileName.substring(
        0,
        this.fileName.length - fileExtension(this.fileName).length
      )}pdf`;
      this.pdfPrinter = new PdfPrinter(pdfFile);
    }
    return this.pdfPrinter;
  }
}
