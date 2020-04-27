import "reflect-metadata";
import { Consumer } from "sqs-consumer";
import { CONFIG, Config } from "../../config";
import { createContainer } from "../../container";
import { WorkerContext } from "../../context";
import { Aws } from "../../services/aws";
import { LOGGER, Logger } from "../../services/logger";
import { loadEnv } from "../../util/loadEnv";
import { stopwatch } from "../../util/stopwatch";

export type QueueWorkerOptions<T> = {
  parser?: (message: string) => T;
};

export function createQueueWorker<T>(
  name: keyof Config["queueWorkers"],
  handler: (payload: T, context: WorkerContext) => Promise<void>,
  options?: QueueWorkerOptions<T>
) {
  loadEnv(`.${name}.env`);
  const { parser } = {
    parser: (message: string) => JSON.parse(message) as T,
    ...options,
  };
  const container = createContainer();
  const config = container.get<Config>(CONFIG);
  const logger = container.get<Logger>(LOGGER);
  const aws = container.get<Aws>(Aws);
  const consumer = Consumer.create({
    queueUrl: config.queueWorkers[name].endpoint,
    batchSize: 10,
    handleMessage: async (message) => {
      const payload = parser(message.Body!);
      const context = container.get<WorkerContext>(WorkerContext);
      logger.info("Start processing message", { payload });
      const duration = await stopwatch(async () => {
        await handler(payload, context);
      });
      logger.info(`Successfully processed message in ${duration}ms`, {
        payload,
        duration,
      });
    },
    sqs: aws.sqs,
  });
  consumer.on("error", (error) => {
    logger.error(error.stack);
  });
  consumer.on("processing_error", (error, message) => {
    logger.error(error.stack, { payload: message.Body });
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
  return {
    start() {
      consumer.start();
      logger.info(`Queue worker running`);
    },
    stop: consumer.stop.bind(consumer),
  };
}
