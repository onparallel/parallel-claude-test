import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";
import stringify from "fast-safe-stringify";
import { ResolutionContext } from "inversify";
import { fromEntries } from "remeda";
import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import { CONFIG, Config } from "../config";

export const LOGGER = Symbol.for("LOGGER");

type LogMethod = (...messages: any[]) => void;

export interface ILogger {
  readonly log: LogMethod;
  readonly info: LogMethod;
  readonly warn: LogMethod;
  readonly error: LogMethod;
  readonly debug: LogMethod;
}

export function createLogger(context: ResolutionContext): ILogger {
  const config = context.get<Config>(CONFIG);
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        level:
          process.env.NODE_ENV === "production" ? "info" : process.env.DEBUG ? "debug" : "info",
        format:
          process.env.NODE_ENV === "production"
            ? winston.format.simple()
            : winston.format.combine(
                winston.format.colorize({ level: true }),
                winston.format.simple(),
              ),
      }),
      ...(process.env.NODE_ENV === "production"
        ? [
            new WinstonCloudWatch({
              name: "cloudwatch",
              cloudWatchLogs: new CloudWatchLogs({ ...config.aws }),
              level: "info",
              messageFormatter: ({ level, message, ...rest }) => {
                return stringify({ level, message, ...rest });
              },
              logGroupName: config.logs.groupName,
              logStreamName: config.logs.streamName,
            }),
          ]
        : []),
    ],
  });
  return logger;
}

export const LOGGER_FACTORY = Symbol.for("LOGGER_FACTORY");

export type LoggerFactory = ReturnType<typeof getLoggerFactory>;

export function getLoggerFactory(context: ResolutionContext) {
  return function loggerFactory(namespace: string) {
    const logger = context.get<ILogger>(LOGGER);
    const log =
      (method: keyof ILogger) =>
      (message: any, ...messages: any[]) => {
        if (typeof message === "string") {
          logger[method](`[${namespace}] ${message}`, ...messages);
        } else {
          logger[method](`[${namespace}]`, message, ...messages);
        }
      };
    return fromEntries(
      (["log", "info", "warn", "error", "debug"] as const).map((method) => [method, log(method)]),
    ) as unknown as ILogger;
  };
}
