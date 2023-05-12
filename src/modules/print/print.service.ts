import { Logger } from "/utils/logger.ts";
import { PrintManager } from "./print.manager.ts";

const MANAGER_EXPIRATION = 1000 * 60 * 10; // 10 minutes

export class PrintService {
  private userManagers: Map<
    number,
    { lastActivity: number; manager: PrintManager }
  > = new Map();
  private timerId: number | null = null;
  constructor(private logger: Logger) {}

  getManager(userId: number) {
    if (!this.userManagers.has(userId)) {
      this.userManagers.set(userId, {
        lastActivity: +new Date(),
        manager: new PrintManager(userId, this.logger),
      });
    } else {
      this.userManagers.get(userId)!.lastActivity = +new Date();
    }
    this.checkExpirationTimer();
    return this.userManagers.get(userId)!.manager;
  }

  private checkExpirationTimer() {
    if (this.userManagers.size && !this.timerId) {
      this.timerId = setTimeout(() => this.checkExpiredManager(), 1000 * 60); // check expiration every minute
    }
  }

  private checkExpiredManager() {
    this.timerId = null;
    const removedKeys: number[] = [];
    const now = +new Date();
    this.userManagers.forEach(({ lastActivity }, key) => {
      if (lastActivity + MANAGER_EXPIRATION > now) {
        removedKeys.push(key);
      }
    });
    removedKeys.forEach((key) => this.userManagers.delete(key));
    this.checkExpirationTimer();
  }
}
