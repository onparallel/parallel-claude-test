import { interfaces } from "inversify";
import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import { Config, CONFIG } from "../config";
import stringify from "fast-safe-stringify";

export const LOGGER = Symbol.for("LOGGER");

export function createLogger({ container }: interfaces.Context) {
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
        level: "info",
        awsAccessKeyId: config.aws.accessKeyId,
        awsSecretKey: config.aws.secretAccessKey,
        awsRegion: config.aws.region,
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

export type { Logger } from "winston";
