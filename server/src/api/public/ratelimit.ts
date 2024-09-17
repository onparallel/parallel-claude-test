import { createHash } from "crypto";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { ILogger } from "../../services/Logger";
import { IRedis } from "../../services/Redis";
import { TooManyRequestsError } from "../rest/errors";

export function ratelimit(redis: IRedis, logger: ILogger) {
  return rateLimit({
    windowMs: 60_000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: true,
    keyGenerator: (req) => {
      const authorization = req.header("authorization")!;
      const token = authorization.replace("Bearer ", "");
      return createHash("sha256").update(token).digest("base64");
    },
    handler: async (req, res, next) => {
      const authorization = req.header("authorization")!;
      const token = authorization.replace("Bearer ", "");
      const tokenHint = token.slice(0, 7);
      logger.info(`RateLimit reached for API token ${tokenHint}...`, { tokenHint, url: req.url });
      res.header("X-RateLimit-Exceeded", "true");
      new TooManyRequestsError().apply(res);
    },
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.sendRawCommand(args),
    }),
  });
}
