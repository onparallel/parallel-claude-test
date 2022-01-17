import "reflect-metadata";
import AWS from "aws-sdk";
import { Consumer } from "sqs-consumer";
import yargs from "yargs";
import { CONFIG, Config } from "../../config";
import { createContainer } from "../../container";
import { WorkerContext } from "../../context";
import { ILogger, LOGGER } from "../../services/logger";
import { loadEnv } from "../../util/loadEnv";
import { stopwatch } from "../../util/stopwatch";

export type QueueWorkerOptions<T> = {
  parser?: (message: string) => T;
};

export function createQueueWorker<P, Q extends keyof Config["queueWorkers"]>(
  name: Q,
  handler: (payload: P, context: WorkerContext, config: Config["queueWorkers"][Q]) => Promise<void>,
  options?: QueueWorkerOptions<P>
) {
  loadEnv(`.${name}.env`);

  const { parser } = {
    parser: (message: string) => JSON.parse(message) as P,
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
        try {
          await handler(
            parser(payload),
            container.get<WorkerContext>(WorkerContext),
            config.queueWorkers[name]
          );
        } catch (error: any) {
          console.log(error);
          process.exit(1);
        }
        if (process.env.NODE_ENV === "production") process.exit(0);
      }
    )
    .command(
      "start",
      "Start listening to the queue",
      () => {},
      () => {
        const logger = container.get<ILogger>(LOGGER);
        const config = container.get<Config>(CONFIG);
        AWS.config.update({
          ...config.aws,
          signatureVersion: "v4",
          logger:
            process.env.NODE_ENV === "production" ? undefined : { log: logger.debug.bind(logger) },
        });
        const consumer = Consumer.create({
          queueUrl: config.queueWorkers[name].endpoint,
          batchSize: 10,
          handleMessage: async (message) => {
            const payload = parser(message.Body!);
            const context = container.get<WorkerContext>(WorkerContext);
            logger.info("Start processing message", { payload });
            const duration = await stopwatch(async () => {
              await handler(payload, context, config.queueWorkers[name]);
            });
            logger.info(`Successfully processed message in ${duration}ms`, {
              payload,
              duration,
            });
          },
          sqs: new AWS.SQS(),
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
    ).argv;
}
