import { GetQueueAttributesCommand, SendMessageBatchCommand, SQSClient } from "@aws-sdk/client-sqs";
import { isNonNullish } from "remeda";
import { Consumer } from "sqs-consumer";
import { Config, CONFIG } from "../config";
import { createContainer } from "../container";
import { ILogger, LOGGER } from "../services/Logger";
import { awsLogger } from "../util/awsLogger";
import { loadEnv } from "../util/loadEnv";
import { retry, StopRetryError } from "../util/retry";
import { random } from "../util/token";

const MAX_MESSAGES_IN_QUEUE_BEFORE_REDRIVE = 300;
const NAME = "low-priority-event-queue";

async function main() {
  await loadEnv();
  const container = createContainer();
  const logger = container.get<ILogger>(LOGGER);
  const config = container.get<Config>(CONFIG);
  const queueConfig = config.queueWorkers[NAME];
  const sqs = new SQSClient({
    ...config.aws,
    endpoint: process.env.NODE_ENV === "development" ? "http://localhost:9324" : undefined,
    logger: awsLogger(logger),
  });

  const abortController = new AbortController();

  const consumer = Consumer.create({
    queueUrl: queueConfig.queueUrl,
    visibilityTimeout: queueConfig.visibilityTimeout,
    heartbeatInterval: queueConfig.heartbeatInterval,
    batchSize: 10,
    sqs,
    handleMessageBatch: async (messages) => {
      await retry(
        async (i) => {
          logger.debug(`Getting queue attributes for "event-processor" (attempt ${i})`);
          const response = await sqs.send(
            new GetQueueAttributesCommand({
              QueueUrl: config.queueWorkers["event-processor"].queueUrl,
              AttributeNames: ["ApproximateNumberOfMessages"],
            }),
          );
          if (isNonNullish(response.Attributes?.ApproximateNumberOfMessages)) {
            const numberOfMessages = parseInt(response.Attributes.ApproximateNumberOfMessages);
            logger.debug(`Number of messages in "event-processor": ${numberOfMessages}`);
            if (numberOfMessages < MAX_MESSAGES_IN_QUEUE_BEFORE_REDRIVE) {
              logger.info(
                `${numberOfMessages} messages in "event-processor", redriving ${messages.length} messages.`,
              );
              const groupId = `event-processor-${random(10)}`;
              await sqs.send(
                new SendMessageBatchCommand({
                  QueueUrl: config.queueWorkers["event-processor"].queueUrl,
                  Entries: messages.map((message) => ({
                    Id: message.MessageId!,
                    MessageGroupId: groupId,
                    MessageBody: message.Body!,
                  })),
                }),
              );
              logger.debug(`Sent ${messages.length} messages to "event-processor"`);
              return;
            } else {
              logger.debug(`Queue is full, waiting for "event-processor" to drain`);
              throw new Error("Queue is full");
            }
          } else {
            throw new StopRetryError("Queue attributes not found");
          }
        },
        { maxRetries: 100, delay: 3000, signal: abortController.signal },
      );
      return messages;
    },
  });
  consumer.on("started", () => {
    logger.info(`Queue ${NAME}: Queue worker started`);
  });
  consumer.on("error", (error) => {
    if (!error.message.endsWith("Queue is full")) {
      logger.error(error.stack);
    }
  });
  consumer.on("processing_error", (error, message) => {
    logger.error(error.stack ?? "", { payload: message.Body });
  });
  process.on("SIGINT", function () {
    logger.info(`Queue ${NAME}: Received SIGINT. Shutting down queue worker`);
    shutdown();
  });
  process.on("SIGTERM", function () {
    logger.info(`Queue ${NAME}: Received SIGTERM. Shutting down queue worker`);
    shutdown();
  });
  function shutdown() {
    abortController.abort();
    consumer.on("stopped", () => {
      logger.info(`Queue ${NAME}: Queue worker stopped`);
      process.exit(0);
    });
    consumer.stop();
  }
  consumer.start();
}

main().then();
