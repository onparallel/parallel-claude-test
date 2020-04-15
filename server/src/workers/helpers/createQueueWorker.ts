import "reflect-metadata";
require("dotenv").config();

import { Consumer } from "sqs-consumer";
import { createContainer } from "../../container";
import { CONFIG, Config } from "../../config";
import { WorkerContext } from "../../context";
import { Aws } from "../../services/aws";
import { LOGGER, Logger } from "../../services/logger";

export function createQueueWorker<T>(
  name: keyof Config["queueWorkers"],
  handler: (payload: T, context: WorkerContext) => Promise<void>
) {
  const container = createContainer();
  const config = container.get<Config>(CONFIG);
  const logger = container.get<Logger>(LOGGER);
  const aws = container.get<Aws>(Aws);
  const consumer = Consumer.create({
    queueUrl: config.queueWorkers[name].endpoint,
    batchSize: 10,
    handleMessage: async (message) => {
      const payload = JSON.parse(message.Body!);
      const context = container.get<WorkerContext>(WorkerContext);
      const time = process.hrtime();
      logger.info("Start processing message", {
        queue: name,
        payload: message.Body,
      });
      await handler(payload, context);
      const [seconds, nanoseconds] = process.hrtime(time);
      const millis = seconds * 1000 + Math.round(nanoseconds / 1e6);
      logger.info(`Successfully processed message in ${millis}ms`, {
        queue: name,
        payload: message.Body,
      });
    },
    sqs: aws.sqs,
  });
  consumer.on("error", (error) => {
    logger.error(error, { queue: name });
  });
  consumer.on("processing_error", (error, message) => {
    logger.error(error, { queue: name, payload: message.Body });
  });
  process.on("SIGINT", function () {
    logger.info(`Shutting down queue worker`, { queue: name });
    consumer.on("stopped", () => {
      logger.info(`Queue worker stopped`, { queue: name });
      process.exit(0);
    });
    consumer.stop();
  });
  return {
    start() {
      consumer.start();
      logger.info(`Queue worker running`, { queue: name });
    },
    stop: consumer.stop.bind(consumer),
  };
}
