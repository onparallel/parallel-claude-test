import { ListQueuesCommand, SQSClient, StartMessageMoveTaskCommand } from "@aws-sdk/client-sqs";
import pMap from "p-map";
import yargs from "yargs";
import { run } from "./utils/run";

type Environment = "staging" | "production";

const sqs = new SQSClient({});
const QUEUE_ARN_PREFIX = "arn:aws:sqs:eu-central-1:749273139513:";

async function main() {
  const { commit: _commit, env } = await yargs.usage("Usage: $0 --env [env]").option("env", {
    required: true,
    choices: ["staging", "production"] satisfies Environment[],
    description: "The environment for the build",
  }).argv;

  const queueUrls = await sqs.send(new ListQueuesCommand()).then((r) => r.QueueUrls!);
  await pMap(
    queueUrls.filter((url) => url.endsWith(`-dl-${env}.fifo`) || url.endsWith(`-dl-${env}`)),
    async (url) => {
      const queueName = url.match(/[^\/]+$/)![0];
      await sqs.send(
        new StartMessageMoveTaskCommand({
          SourceArn: QUEUE_ARN_PREFIX + queueName,
          DestinationArn: QUEUE_ARN_PREFIX + queueName.replace("-dl-", "-"),
        }),
      );
    },
  );
}

run(main);
