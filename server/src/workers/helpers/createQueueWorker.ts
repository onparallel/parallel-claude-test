import "reflect-metadata";
require("dotenv").config();

import { Consumer } from "sqs-consumer";
import { createContainer } from "../../container";
import { CONFIG, Config } from "../../config";
import { WorkerContext } from "../../context";
import { Aws } from "../../services/aws";

function prefix(name: string) {
  return `Queue worker ${name}:`;
}

export function createQueueWorker<T>(
  name: keyof Config["queueWorkers"],
  handler: (payload: T, context: WorkerContext) => Promise<void>
) {
  const container = createContainer();
  const config = container.get<Config>(CONFIG);
  const aws = container.get<Aws>(Aws);
  const consumer = Consumer.create({
    queueUrl: config.queueWorkers[name].endpoint,
    batchSize: 10,
    handleMessage: async (message) => {
      const payload = JSON.parse(message.Body!);
      await handler(payload, container.get<WorkerContext>(WorkerContext));
      console.log(
        `${prefix(name)} Successfully executed message with payload ${
          message.Body
        }`
      );
    },
    sqs: aws.sqs,
  });
  consumer.on("error", (error) => {
    console.error(error);
  });
  consumer.on("processing_error", (error, message) => {
    console.log(
      `${prefix(name)} Error during execution with payload ${message.Body}`
    );
    console.error(error);
  });
  process.on("SIGINT", function () {
    console.log(`${prefix(name)} Shutting down`);
    consumer.on("stopped", () => {
      console.log(`${prefix(name)} Worker stopped`);
      process.exit(0);
    });
    consumer.stop();
  });
  return {
    start() {
      consumer.start();
      console.log(`${prefix(name)} Running`);
    },
    stop: consumer.stop.bind(consumer),
  };
}
