import {
  DescribeInstancesCommand,
  EC2Client,
  StopInstancesCommand,
  TerminateInstancesCommand,
} from "@aws-sdk/client-ec2";
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingClient,
} from "@aws-sdk/client-elastic-load-balancing";
import { fromIni } from "@aws-sdk/credential-providers";
import chalk from "chalk";
import yargs from "yargs";
import { run } from "./utils/run";

const ec2 = new EC2Client({ credentials: fromIni({ profile: "parallel-deploy" }) });
const elb = new ElasticLoadBalancingClient({
  credentials: fromIni({ profile: "parallel-deploy" }),
});

async function main() {
  const { env, "dry-run": dryRun } = await yargs
    .usage("Usage: $0 --env [env]")
    .option("dry-run", {
      type: "boolean",
      description: "Don't run commands",
    })
    .option("env", {
      required: true,
      choices: ["staging", "production"],
      description: "The environment for the build",
    }).argv;

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
      })
    )
    .then((r) => r.Reservations!.flatMap((r) => r.Instances!));
  for (const instance of instances) {
    const instanceId = instance.InstanceId!;
    if (!liveInstances.includes(instanceId)) {
      const instanceName = instance.Tags!.find((t) => t.Key === "Name")?.Value;
      const instanceState = instance.State!.Name;
      if (instanceState === "running") {
        console.log(chalk`Stopping instance {bold ${instanceId}} {yellow {bold ${instanceName}}}`);
        if (!dryRun) {
          await ec2.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
        }
      } else if (instanceState === "stopped" || instanceState === "stopping") {
        const match = instance.StateTransitionReason?.match(/^User initiated \((.*)\)$/);
        if (match) {
          const transitionDate = new Date(match[1]);
          // terminate instance that were stopped more than 7 days ago, so we can keep the instance data for a while
          if (new Date().valueOf() - transitionDate.valueOf() > 7 * 24 * 60 * 60 * 1000) {
            console.log(
              chalk`Terminating instance {bold ${instanceId}} {red {bold ${instanceName}}}`
            );
            if (!dryRun) {
              await ec2.send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));
            }
          }
        }
      }
    }
  }
}

run(main);
