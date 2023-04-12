import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { SQSClient } from "@aws-sdk/client-sqs";
import { Consumer } from "@rxfork/sqs-consumer";
import { fork } from "child_process";
import yargs from "yargs";
import { CONFIG, Config } from "../../config";
import { createContainer } from "../../container";
import { WorkerContext } from "../../context";
import { ILogger, LOGGER } from "../../services/Logger";
import { awsLogger } from "../../util/awsLogger";
import { loadEnv } from "../../util/loadEnv";
import { stopwatch } from "../../util/stopwatch";
import { DelayQueuePayload } from "../delay-queue";
import { EmailEventsWorkerPayload } from "../email-events";
import { EmailSenderWorkerPayload } from "../email-sender";
import { EventProcessorPayload } from "../event-processor";
import { SignatureWorkerPayload } from "../signature-worker";
import { TaskWorkerPayload } from "../task-worker";

export type QueueWorkerPayload<Q extends keyof Config["queueWorkers"]> = {
  "email-events": EmailEventsWorkerPayload;
  "email-sender": EmailSenderWorkerPayload;
  "event-processor": EventProcessorPayload;
  "signature-worker": SignatureWorkerPayload;
  "task-worker": TaskWorkerPayload;
  "delay-queue": DelayQueuePayload;
}[Q];

export type QueueWorkerOptions<T> = {
  forkHandlers?: boolean;
  parser?: (message: string) => T;
};

export function createQueueWorker<Q extends keyof Config["queueWorkers"]>(
  name: Q,
  handler: (
    payload: QueueWorkerPayload<Q>,
    context: WorkerContext,
    config: Config["queueWorkers"][Q]
  ) => Promise<void>,
  options?: QueueWorkerOptions<QueueWorkerPayload<Q>>
) {
  loadEnv(`.${name}.env`);

  const script = process.argv[1];

  const { parser, forkHandlers } = {
    parser: (message: string) => JSON.parse(message) as QueueWorkerPayload<Q>,
    forkHandlers: false,
    ...options,
  };
  const container = createContainer();
  const config = container.get<Config>(CONFIG);
  yargs
    .command(
      "run [payload]",
      "Run once with payload",
      (yargs: yargs.Argv) =>
        yargs.positional("payload", {
          describe: "The payload of the message.",
          type: "string",
          demandOption: true,
        }),
      async ({ payload }: { payload: string }) => {
        const context = container.get<WorkerContext>(WorkerContext);
        try {
          await handler(parser(payload), context, config.queueWorkers[name]);
        } catch (e) {
          if (e instanceof Error) {
            context.logger.error(e.message, { stack: e.stack });
          } else {
            context.logger.error(e);
          }
          process.exit(1);
        }
        process.exit(0);
      }
    )
    .command(
      "start",
      "Start listening to the queue",
      () => {},
      () => {
        const logger = container.get<ILogger>(LOGGER);
        const config = container.get<Config>(CONFIG);

        const consumer = Consumer.create({
          queueUrl: config.queueWorkers[name].queueUrl,
          visibilityTimeout: config.queueWorkers[name].visibilityTimeout,
          heartbeatInterval: config.queueWorkers[name].heartbeatInterval,
          batchSize: 3,
          handleMessage: async (message) => {
            logger.info("Start processing message", { payload: message.Body });
            try {
              const duration = await stopwatch(async () => {
                if (forkHandlers) {
                  return await new Promise<void>((resolve, reject) => {
                    fork(
                      script,
                      [
                        "run",
                        message.Body!,
                        ...(script.endsWith(".ts") ? ["-r", "ts-node/register"] : []),
                      ],
                      { stdio: "inherit", timeout: 90_000, env: process.env }
                    ).on("close", (code) => {
                      if (code === 0) {
                        resolve();
                      } else {
                        reject();
                      }
                    });
                  });
                } else {
                  try {
                    const context = container.get<WorkerContext>(WorkerContext);
                    await handler(parser(message.Body!), context, config.queueWorkers[name]);
                  } catch (e) {
                    if (e instanceof Error) {
                      logger.error(e.message, { stack: e.stack });
                    } else {
                      logger.error(e);
                    }
                    throw e;
                  }
                }
              });
              logger.info(`Successfully processed message in ${duration}ms`, {
                payload: message.Body,
                duration,
              });
            } catch {
              logger.info(`Error processing message`, {
                payload: message.Body,
              });
            }
          },
          sqs: new SQSClient({
            ...config.aws,
            endpoint: process.env.NODE_ENV === "development" ? "http://localhost:9324" : undefined,
            logger: awsLogger(logger),
          }),
        });
        consumer.on("error", (error) => {
          logger.error(error.stack);
        });
        consumer.on("processing_error", (error, message) => {
          logger.error(error.stack ?? "", { payload: message.Body });
        });
        process.on("SIGINT", function () {
          logger.info(`Received SIGINT. Shutting down queue worker`);
          shutdown();
        });
        process.on("SIGTERM", function () {
          logger.info(`Received SIGTERM. Shutting down queue worker`);
          shutdown();
        });
        function shutdown() {
          consumer.on("stopped", () => {
            logger.info(`Queue worker stopped`);
            process.exit(0);
          });
          consumer.stop();
        }
        consumer.start();
      }
    )
    .demandCommand()
    .recommendCommands().argv;
}
