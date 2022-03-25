import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";
import stringify from "fast-safe-stringify";
import { interfaces } from "inversify";
import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import { Config, CONFIG } from "../config";

export const LOGGER = Symbol.for("LOGGER");

export interface LogMethod {
  (...messages: any[]): void;
}

export interface ILogger {
  readonly log: LogMethod;
  readonly info: LogMethod;
  readonly warn: LogMethod;
  readonly error: LogMethod;
  readonly debug: LogMethod;
}

export function createLogger({ container }: interfaces.Context): ILogger {
  const config = container.get<Config>(CONFIG);
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        format:
          process.env.NODE_ENV === "production"
            ? winston.format.simple()
            : winston.format.combine(
                winston.format.colorize({ level: true }),
                winston.format.simple()
              ),
      }),
      new WinstonCloudWatch({
        name: "cloudwatch",
        cloudWatchLogs: new CloudWatchLogs({ ...config.aws }),
        level: "info",
        retentionInDays: 30,
        messageFormatter: ({ level, message, ...rest }) => {
          return stringify({ level, message, ...rest });
        },
        logGroupName: config.logs.groupName,
        logStreamName: config.logs.streamName,
      }),
    ],
  });
  return logger;
}
