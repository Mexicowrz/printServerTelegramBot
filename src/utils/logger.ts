import * as log from "https://deno.land/std/log/mod.ts";

export type Logger = {
  debug: typeof log.debug;
  warning: typeof log.warning;
  error: typeof log.error;
  info: typeof log.info;
  critical: typeof log.critical;
};

export const logger: Logger = {
  debug: log.debug,
  warning: log.warning,
  error: log.error,
  info: log.info,
  critical: log.critical,
};
