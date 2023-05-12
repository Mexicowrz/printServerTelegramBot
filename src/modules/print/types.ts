export enum Command {
  "/start" = "/start",
  "/stop" = "/stop",
  "/text" = "/text",
}

export type QueueItem =
  | {
      type: "document";
      params: { doc: string; mime: string };
    }
  | { type: "text"; params: string }
  | { type: "command"; params: Command };
