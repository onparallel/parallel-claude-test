import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import stringify from "fast-safe-stringify";

export const logger = winston.createLogger({
  transports: [
    new WinstonCloudWatch({
      level: "info",
      awsAccessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      awsSecretKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
      awsRegion: process.env.NEXT_PUBLIC_AWS_REGION,
      retentionInDays: 30,
      messageFormatter: ({ level, message, ...rest }) => {
        return stringify({ level, message, ...rest });
      },
      logGroupName: process.env.NEXT_PUBLIC_LOG_GROUP,
      logStreamName: "client",
    }),
  ],
});
