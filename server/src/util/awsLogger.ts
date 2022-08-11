import { ClientDefaults } from "@aws-sdk/client-cloudwatch-logs";
import { ILogger } from "../services/logger";

export function awsLogger(logger: ILogger): ClientDefaults["logger"] {
  return {
    info(content: any) {
      logger.info(JSON.stringify(content, null, 2));
    },
    debug(...content: any[]) {
      logger.debug(JSON.stringify(content, null, 2));
    },
    error(...content: any[]) {
      logger.error(JSON.stringify(content, null, 2));
    },
    warn(...content: any[]) {
      logger.warn(JSON.stringify(content, null, 2));
    },
  };
}
