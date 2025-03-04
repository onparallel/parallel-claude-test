import {
  CloudWatchClient,
  DeleteAlarmsCommand,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CreateTagsCommand,
  DescribeInstancesCommand,
  EC2Client,
  StopInstancesCommand,
  TerminateInstancesCommand,
} from "@aws-sdk/client-ec2";
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingClient,
} from "@aws-sdk/client-elastic-load-balancing";
import chalk from "chalk";
import { assert } from "ts-essentials";
import yargs from "yargs";
import { run } from "./utils/run";

type Environment = "staging" | "production";

const ec2 = new EC2Client({});
const elb = new ElasticLoadBalancingClient({});
const cw = new CloudWatchClient({});

async function main() {
  const { env, "dry-run": dryRun } = await yargs
    .usage("Usage: $0 --env [env]")
    .option("dry-run", {
      type: "boolean",
      description: "Don't run commands",
    })
    .option("env", {
      required: true,
      choices: ["staging", "production"] satisfies Environment[],
      description: "The environment for the build",
    }).argv;

  // redundant make sure the user is deploying on the intended environment
  assert(env === process.env.ENV, "env mismatch");

  const liveInstances = await elb
    .send(new DescribeLoadBalancersCommand({ LoadBalancerNames: [`parallel-${env}`] }))
    .then((r) => r.LoadBalancerDescriptions![0].Instances!.map((i) => i.InstanceId!));
  const instances = await ec2
    .send(
      new DescribeInstancesCommand({
        Filters: [
          { Name: "tag-key", Values: ["Release"] },
          { Name: "tag:Environment", Values: [env] },
        ],
      }),
    )
    .then((r) => r.Reservations!.flatMap((r) => r.Instances!));
  for (const instance of instances) {
    const instanceId = instance.InstanceId!;
    if (!liveInstances.includes(instanceId)) {
      const instanceName = instance.Tags!.find((t) => t.Key === "Name")?.Value;
      const instanceState = instance.State!.Name!;
      if (instanceState === "running") {
        console.log(chalk`Stopping instance {bold ${instanceId}} {yellow {bold ${instanceName}}}`);
        if (!dryRun) {
          await ec2.send(
            new CreateTagsCommand({
              Resources: [instanceId],
              Tags: [{ Key: "Bin", Value: "true" }],
            }),
          );
          await ec2.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
        }
      } else if (instanceState === "stopped" || instanceState === "stopping") {
        const match = instance.StateTransitionReason?.match(/^User initiated \((.*)\)$/);
        if (match) {
          const transitionDate = new Date(match[1]);
          // terminate instance that were stopped more than 7 days ago, so we can keep the instance data for a while
          if (new Date().valueOf() - transitionDate.valueOf() > 7 * 24 * 60 * 60 * 1000) {
            console.log(
              chalk`Terminating instance {bold ${instanceId}} {red {bold ${instanceName}}}`,
            );
            if (!dryRun) {
              await ec2.send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));
            }
            const alarms = await cw
              .send(
                new DescribeAlarmsCommand({
                  AlarmNames: [`${instanceName}-cpu-1m`, `${instanceName}-cpu-5m`],
                }),
              )
              .then((r) => r.MetricAlarms!);
            if (alarms.length) {
              console.log(`Deleting intance alarms ${alarms.map((a) => a.AlarmName!).join(", ")}`);
              if (!dryRun) {
                await cw.send(
                  new DeleteAlarmsCommand({ AlarmNames: alarms.map((a) => a.AlarmName!) }),
                );
              }
            }
          }
        }
      }
    }
  }
}

run(main);
