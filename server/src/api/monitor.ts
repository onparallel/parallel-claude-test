import { GetQueueAttributesCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Container } from "inversify";
import { isNonNullish } from "remeda";
import { CONFIG, Config } from "../config";
import { RateLimitGuard } from "../workers/helpers/RateLimitGuard";
import { RestApi } from "./rest/core";
import { enumParam, numberParam } from "./rest/params";
import { PlainTextResponse, Text } from "./rest/responses";

export function monitor(container: Container) {
  const config = container.get<Config>(CONFIG);
  const sqs = new SQSClient({
    ...config.aws,
    endpoint: process.env.NODE_ENV === "development" ? "http://localhost:9324" : undefined,
  });
  const api = new RestApi();
  const guard = new RateLimitGuard(1 / 5); // allow 1 call every 5 s
  api
    .path("/queue/:queueName/length", {
      params: {
        queueName: enumParam({
          description: "The name of the queue.",
          values: Object.keys(config.queueWorkers) as (keyof typeof config.queueWorkers)[],
        }),
      },
    })
    .get(
      {
        query: { limit: numberParam({ minimum: 0, required: false }) },
        responses: {
          200: PlainTextResponse({
            description: `The number of messages waiting in the queue. If limit is present then "OK", if the number is below the limit.`,
          }),
          418: PlainTextResponse({
            description: `When limit is present, "NOT OK" if the number of messages in queue is higher than it.`,
          }),
        },
      },
      async ({ params: { queueName }, query: { limit }, signal }) => {
        const { queueUrl } = config.queueWorkers[queueName as keyof typeof config.queueWorkers];
        await guard.waitUntilAllowed(queueName);
        signal.throwIfAborted();
        const response = await sqs.send(
          new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ["ApproximateNumberOfMessages"],
          }),
        );
        const length = parseInt(response.Attributes!.ApproximateNumberOfMessages!);
        if (isNonNullish(limit)) {
          if (length > limit) {
            return Text("NOT OK", { status: 418 });
          } else {
            return Text("OK");
          }
        } else {
          return Text(`${length}`);
        }
      },
    );
  return api.handler();
}
