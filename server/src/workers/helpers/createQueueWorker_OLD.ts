import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { SQSClient } from "@aws-sdk/client-sqs";
import { fork } from "child_process";
import { noop } from "remeda";
import { Consumer } from "sqs-consumer";
import yargs from "yargs";
import { CONFIG, Config } from "../../config";
import { createContainer } from "../../container";
import { WorkerContext } from "../../context";
import { ILogger, LOGGER } from "../../services/Logger";
import { awsLogger } from "../../util/awsLogger";
import { loadEnv } from "../../util/loadEnv";
import { stopwatch } from "../../util/stopwatch";
import { MaybePromise } from "../../util/types";
import { DelayQueuePayload } from "../delay-queue";
import { EmailEventsWorkerPayload } from "../email-events";
import { EmailSenderWorkerPayload } from "../email-sender";
import { WebhooksWorkerPayload } from "../queues/WebhooksWorkerQueue";
import { SignatureWorkerPayload } from "../signature-worker";
import { TaskWorkerPayload } from "../task-worker";
import { EventProcessorPayload } from "./EventProcessor";

export type QueueWorkerPayload_OLD<Q extends keyof Config["queueWorkers"]> = {
  "email-events": EmailEventsWorkerPayload;
  "email-sender": EmailSenderWorkerPayload;
  "event-processor": EventProcessorPayload;
  "signature-worker": SignatureWorkerPayload;
  "task-worker": TaskWorkerPayload;
  "delay-queue": DelayQueuePayload;
  "webhooks-worker": WebhooksWorkerPayload;
}[Q];

export interface QueueWorkerOptions_OLD<Q extends keyof Config["queueWorkers"]> {
  forkHandlers?: boolean;
  /**
   * Time in ms after which the process is killed with SIGTERM
   */
  forkTimeout?:
    | number
    | ((
        payload: QueueWorkerPayload_OLD<Q>,
        context: WorkerContext,
        config: Config["queueWorkers"][Q],
      ) => MaybePromise<number>);
  onForkError?: (
    signal: NodeJS.Signals,
    message: QueueWorkerPayload_OLD<Q>,
    context: WorkerContext,
    config: Config["queueWorkers"][Q],
  ) => MaybePromise<void>;
  parser?: (message: string) => QueueWorkerPayload_OLD<Q>;
  batchSize?: number;
}

export async function createQueueWorker_OLD<Q extends keyof Config["queueWorkers"]>(
  name: Q,
  handler: (
    payload: QueueWorkerPayload_OLD<Q>,
    context: WorkerContext,
    config: Config["queueWorkers"][Q],
  ) => Promise<void>,
  options?: QueueWorkerOptions_OLD<Q>,
) {
  await loadEnv(`.${name}.env`);

  const script = process.argv[1];

  const { parser, forkHandlers, forkTimeout, onForkError, batchSize } = {
    parser: (message: string) => JSON.parse(message) as QueueWorkerPayload_OLD<Q>,
    forkHandlers: false,
    forkTimeout: 120_000,
    onForkError: noop,
    batchSize: 3,
    ...options,
  };
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
        const container = createContainer();
        const config = container.get<Config>(CONFIG);
        const context = container.get<WorkerContext>(WorkerContext);
        const queueConfig = config.queueWorkers[name];
        try {
          await handler(parser(payload), context, queueConfig);
        } catch (e) {
          if (e instanceof Error) {
            context.logger.error(e.message, { stack: e.stack });
          } else {
            context.logger.error(e);
          }
          process.exit(1);
        }
        process.exit(0);
      },
    )
    .command(
      "start",
      "Start listening to the queue",
      () => {},
      async () => {
        const container = createContainer();
        const logger = container.get<ILogger>(LOGGER);
        const config = container.get<Config>(CONFIG);

        const queueConfig = config.queueWorkers[name];
        const consumer = Consumer.create({
          queueUrl: queueConfig.queueUrl,
          visibilityTimeout: queueConfig.visibilityTimeout,
          heartbeatInterval: queueConfig.heartbeatInterval,
          batchSize,
          handleMessage: async (message) => {
            logger.info(`Queue ${name}: Start processing message`, { payload: message.Body });
            try {
              const duration = await stopwatch(async () => {
                if (forkHandlers) {
                  try {
                    const timeout =
                      typeof forkTimeout === "number"
                        ? forkTimeout
                        : await forkTimeout(
                            parser(message.Body!),
                            container.get<WorkerContext>(WorkerContext),
                            queueConfig,
                          );
                    return await new Promise<void>((resolve, reject) => {
                      fork(
                        script,
                        [
                          "run",
                          message.Body!,
                          ...(script.endsWith(".ts") ? ["-r", "ts-node/register"] : []),
                        ],
                        { stdio: "inherit", timeout, env: process.env },
                      ).on("close", (code, signal) => {
                        if (code === 0) {
                          resolve();
                        } else {
                          reject(signal);
                        }
                      });
                    });
                  } catch (e) {
                    if (typeof e === "string") {
                      await onForkError?.(
                        e as NodeJS.Signals,
                        parser(message.Body!),
                        container.get<WorkerContext>(WorkerContext),
                        queueConfig,
                      );
                    }
                    throw e;
                  }
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
              logger.info(`Queue ${name}: Successfully processed message in ${duration}ms`, {
                payload: message.Body,
                duration,
              });
            } catch {
              logger.info(`Queue ${name}: Error processing message`, {
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
        consumer.on("started", () => {
          logger.info(`Queue ${name}: Queue worker started`);
        });
        consumer.on("error", (error) => {
          logger.error(error.stack);
        });
        consumer.on("processing_error", (error, message) => {
          logger.error(error.stack ?? "", { payload: message.Body });
        });
        process.on("SIGINT", function () {
          logger.info(`Queue ${name}: Received SIGINT. Shutting down queue worker`);
          shutdown();
        });
        process.on("SIGTERM", function () {
          logger.info(`Queue ${name}: Received SIGTERM. Shutting down queue worker`);
          shutdown();
        });
        function shutdown() {
          consumer.on("stopped", () => {
            logger.info(`Queue ${name}: Queue worker stopped`);
            process.exit(0);
          });
          consumer.stop();
        }
        consumer.start();
      },
    )
    .demandCommand()
    .recommendCommands().argv;
}
