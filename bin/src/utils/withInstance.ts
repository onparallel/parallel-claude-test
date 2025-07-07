import {
  DescribeInstancesCommand,
  EC2Client,
  InstanceStateName,
  RunInstancesCommand,
  RunInstancesCommandInput,
  TerminateInstancesCommand,
} from "@aws-sdk/client-ec2";
import chalk from "chalk";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { pingSsh } from "./ssh";
import { waitFor, waitForResult } from "./wait";

export async function withInstance(
  ec2: EC2Client,
  runInstanceCommandInput: RunInstancesCommandInput,
  fn: (
    result: { instanceId: string; ipAddress: string },
    { signal }: { signal: AbortSignal },
  ) => Promise<void>,
  options: {
    terminate?: boolean;
    keyPath?: string;
  } = {},
) {
  const { terminate = true, keyPath } = options;
  const result = await ec2.send(new RunInstancesCommand(runInstanceCommandInput));
  const instance = result.Instances![0];
  const instanceId = instance.InstanceId!;
  const ipAddress = instance.PrivateIpAddress!;
  assert(isNonNullish(ipAddress));
  const abortController = new AbortController();
  if (terminate) {
    process.on("SIGINT", function () {
      abortController.abort();
    });
    process.on("SIGTERM", function () {
      abortController.abort();
    });
  }
  console.log(chalk`Launched instance {bold ${instanceId}} {bold ${ipAddress}}`);
  try {
    await waitFor(5_000, { signal: abortController.signal });
    await waitForResult(
      async () => {
        const result = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
        const instance = result.Reservations?.[0].Instances?.[0];
        return instance?.State?.Name === InstanceStateName.running;
      },
      {
        message: chalk.italic`Instance {yellow pending}. Waiting 5 more seconds...`,
        delay: 5_000,
        signal: abortController.signal,
      },
    );
    console.log(chalk`Instance {green ✓ running}`);
    await waitForResult(
      async () => {
        try {
          await pingSsh(ipAddress, { keyPath });
          return true;
        } catch {
          return false;
        }
      },
      {
        message: chalk.italic`SSH not available. Waiting 5 more seconds...`,
        delay: 5_000,
        signal: abortController.signal,
      },
    );
    await fn({ instanceId, ipAddress }, { signal: abortController.signal });
  } finally {
    if (terminate) {
      console.log("Shutting down instance");
      await ec2.send(
        new TerminateInstancesCommand({
          InstanceIds: [instanceId],
        }),
      );
    }
  }
}
