import { interfaces } from "inversify";
import winston from "winston";

export const LOGGER = Symbol.for("LOGGER");

export function createLogger({ container }: interfaces.Context) {
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: "debug",
        format: winston.format.combine(
          winston.format.colorize({ level: true }),
          winston.format.simple()
        ),
      }),
    ],
  });
  return logger;
}

export type { Logger } from "winston";
