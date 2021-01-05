import "reflect-metadata";
import { Consumer } from "sqs-consumer";
import { CONFIG, Config } from "../../config";
import { createContainer } from "../../container";
import { WorkerContext } from "../../context";
import { AWS_SERVICE, IAws } from "../../services/aws";
import { LOGGER, Logger } from "../../services/logger";
import { loadEnv } from "../../util/loadEnv";
import { stopwatch } from "../../util/stopwatch";
import yargs from "yargs";

export type QueueWorkerOptions<T> = {
  parser?: (message: string) => T;
};

export function createQueueWorker<P, Q extends keyof Config["queueWorkers"]>(
  name: Q,
  handler: (
    payload: P,
    context: WorkerContext,
    config: Config["queueWorkers"][Q]
  ) => Promise<void>,
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
      (yargs) => {
        yargs.positional("payload", {
          describe: "The payload of the message.",
          type: "string",
          demandOption: true,
        });
      },
      async ({ payload }: { payload: string }) => {
        try {
          await handler(
            parser(payload),
            container.get<WorkerContext>(WorkerContext),
            config.queueWorkers[name]
          );
        } catch (error) {
          console.log(error);
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
        const logger = container.get<Logger>(LOGGER);
        const aws = container.get<IAws>(AWS_SERVICE);
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
          sqs: aws.sqs as any,
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
