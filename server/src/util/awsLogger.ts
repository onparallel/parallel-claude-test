import { Logger } from "@aws-sdk/types";
import fastSafeStringify from "fast-safe-stringify";
import { ILogger } from "../services/logger";

export function awsLogger(logger: ILogger) {
  return Object.fromEntries(
    ["info", "debug", "error", "warn"].map((level) => [
      level,
      (payload: any) => {
        logger.debug(
          fastSafeStringify(
            {
              level,
              payload,
            },
            (_, value) => {
              if (["string", "number", "bigint", "boolean", "undefined"].includes(typeof value)) {
                return value;
              } else if (Array.isArray(value)) {
                return value;
              } else if (
                Buffer.isBuffer(value) ||
                ("type" in value &&
                  value["type"] === "Buffer" &&
                  "data" in value &&
                  Array.isArray(value["data"]))
              ) {
                return `[[Buffer]]`;
              } else if (value.constructor.name === "Object") {
                return value;
              } else {
                return `[[${value.constructor.name}]]`;
              }
            },
            2
          )
        );
      },
    ])
  ) as unknown as Logger;
}
