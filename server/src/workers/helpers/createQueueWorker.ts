import { SQSClient } from "@aws-sdk/client-sqs";
import { fork } from "child_process";
import DataLoader from "dataloader";
import { ContainerModule, injectable } from "inversify";
import pMap from "p-map";
import { Consumer } from "sqs-consumer";
import yargs from "yargs";
import { CONFIG, Config } from "../../config";
import { createContainer } from "../../container";
import { WorkerContext } from "../../context";
import { ILogger, LOGGER } from "../../services/Logger";
import { IQueuesService, QUEUES_SERVICE } from "../../services/QueuesService";
import { awsLogger } from "../../util/awsLogger";
import { loadEnv } from "../../util/loadEnv";
import { stopwatch } from "../../util/stopwatch";
import { MaybePromise } from "../../util/types";
import { DelayQueuePayload } from "../queues/DelayQueue";
import { EmailEventsWorkerPayload } from "../queues/EmailEventsQueue";
import { EmailSenderWorkerPayload } from "../queues/EmailSenderQueue";
import { EventProcessorPayload } from "../queues/EventProcessorQueue";
import { WebhooksWorkerPayload } from "../queues/WebhooksWorkerQueue";
import { SignatureWorkerPayload } from "../signature-worker";
import { TaskWorkerPayload } from "../task-worker";

export type QueueWorkerPayload<Q extends keyof Config["queueWorkers"]> = {
  "email-events": EmailEventsWorkerPayload;
  "email-sender": EmailSenderWorkerPayload;
  "event-processor": EventProcessorPayload;
  "signature-worker": SignatureWorkerPayload;
  "task-worker": TaskWorkerPayload;
  "delay-queue": DelayQueuePayload;
  "webhooks-worker": WebhooksWorkerPayload;
}[Q];

export interface QueueWorkerOptions<Q extends keyof Config["queueWorkers"]> {
  additionalModules?: ContainerModule[];
  forkHandlers?: boolean;
  /**
   * Time in ms after which the process is killed with SIGTERM
   */
  forkTimeout?:
    | number
    | ((payload: QueueWorkerPayload<Q>, config: Config["queueWorkers"][Q]) => MaybePromise<number>);
  onForkError?: (
    signal: NodeJS.Signals,
    message: QueueWorkerPayload<Q>,
    context: WorkerContext,
    config: Config["queueWorkers"][Q],
  ) => MaybePromise<void>;
  parser?: (message: string) => QueueWorkerPayload<Q>;
  pollingBatchSize?: number;
  processBatchConcurrently?: boolean;
  processBatchWithConcurrency?: number;
}

@injectable()
export abstract class QueueWorker<T> {
  abstract handler(payload: T): Promise<void>;
}

@injectable()
export abstract class BatchQueueWorker<T> extends QueueWorker<T> {
  private _dataloader = new DataLoader<T, null>(
    async (keys) => {
      await this.handleBatch(keys as T[]);
      return keys.map(() => null);
    },
    { cache: false },
  );

  abstract handleBatch(payload: T[]): Promise<void>;

  override async handler(payload: T) {
    await this._dataloader.load(payload);
  }
}

export async function createQueueWorker<Q extends keyof Config["queueWorkers"]>(
  name: Q,
  workerImplementation: new (...args: any[]) => QueueWorker<QueueWorkerPayload<Q>>,
  options?: QueueWorkerOptions<Q>,
) {
  await loadEnv(`.${name}.env`);

  const script = process.argv[1];
  if (options?.processBatchConcurrently && options.forkHandlers) {
    throw new Error("processBatchConcurrently and forkHandlers cannot be true at the same time");
  }

  const {
    additionalModules,
    parser,
    forkHandlers,
    forkTimeout,
    onForkError,
    pollingBatchSize,
    processBatchConcurrently,
    processBatchWithConcurrency,
  } = {
    additionalModules: [],
    parser: (message: string) => JSON.parse(message) as QueueWorkerPayload<Q>,
    forkHandlers: false,
    forkTimeout: 120_000,
    onForkError: () => {},
    pollingBatchSize: 3,
    processBatchConcurrently: false,
    processBatchWithConcurrency: 1,
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
        const logger = container.get<ILogger>(LOGGER);
        additionalModules.forEach((module) => container.load(module));
        container.bind(workerImplementation).toSelf();
        const worker = container.get<QueueWorker<QueueWorkerPayload<Q>>>(workerImplementation);
        try {
          await worker.handler(parser(payload));
          const queuesService = container.get<IQueuesService>(QUEUES_SERVICE);
          await queuesService.waitForPendingMessages(30_000);
        } catch (e) {
          if (e instanceof Error) {
            logger.error(e.message, { stack: e.stack });
          } else {
            logger.error(e);
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
        additionalModules.forEach((module) => container.load(module));
        container.bind(workerImplementation).toSelf();
        const logger = container.get<ILogger>(LOGGER);
        const config = container.get<Config>(CONFIG);
        const queueConfig = config.queueWorkers[name];
        const consumer = Consumer.create({
          queueUrl: queueConfig.queueUrl,
          visibilityTimeout: queueConfig.visibilityTimeout,
          heartbeatInterval: queueConfig.heartbeatInterval,
          batchSize: pollingBatchSize,
          ...(processBatchConcurrently
            ? {
                handleMessageBatch: async (messages) => {
                  const worker =
                    container.get<QueueWorker<QueueWorkerPayload<Q>>>(workerImplementation);
                  await pMap(
                    messages,
                    async (message) => {
                      try {
                        logger.info(`Queue ${name}: Start processing message`, {
                          payload: message.Body,
                        });
                        const duration = await stopwatch(async () => {
                          try {
                            await worker.handler(parser(message.Body!));
                          } catch (e) {
                            if (e instanceof Error) {
                              logger.error(e.message, { stack: e.stack });
                            } else {
                              logger.error(e);
                            }
                            throw e;
                          }
                        });
                        logger.info(
                          `Queue ${name}: Successfully processed message in ${duration}ms`,
                          {
                            payload: message.Body,
                            duration,
                          },
                        );
                      } catch {
                        logger.info(`Queue ${name}: Error processing message`, {
                          payload: message.Body,
                        });
                      }
                    },
                    { concurrency: processBatchWithConcurrency },
                  );
                  const queuesService = container.get<IQueuesService>(QUEUES_SERVICE);
                  await queuesService.waitForPendingMessages(30_000);
                },
              }
            : {
                handleMessage: async (message) => {
                  try {
                    logger.info(`Queue ${name}: Start processing message`, {
                      payload: message.Body,
                    });
                    const duration = await stopwatch(async () => {
                      if (forkHandlers) {
                        try {
                          const timeout =
                            typeof forkTimeout === "number"
                              ? forkTimeout
                              : await forkTimeout(parser(message.Body!), queueConfig);
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
                          const worker =
                            container.get<QueueWorker<QueueWorkerPayload<Q>>>(workerImplementation);
                          await worker.handler(parser(message.Body!));
                        } catch (e) {
                          if (e instanceof Error) {
                            logger.error(e.message, { stack: e.stack });
                          } else {
                            logger.error(e);
                          }
                          throw e;
                        }
                        const queuesService = container.get<IQueuesService>(QUEUES_SERVICE);
                        await queuesService.waitForPendingMessages(30_000);
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
              }),
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
