import AWS from "aws-sdk";
import chalk from "chalk";
import yargs from "yargs";
import { run } from "./utils/run";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

const ec2 = new AWS.EC2();
const elb = new AWS.ELB();

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
    .describeLoadBalancers({ LoadBalancerNames: [`parallel-${env}`] })
    .promise()
    .then((r) => r.LoadBalancerDescriptions![0].Instances!.map((i) => i.InstanceId!));
  const instances = await ec2
    .describeInstances({
      Filters: [
        { Name: "tag-key", Values: ["Release"] },
        { Name: "tag:Environment", Values: [env] },
      ],
    })
    .promise()
    .then((r) => r.Reservations!.flatMap((r) => r.Instances!));
  for (const instance of instances) {
    const instanceId = instance.InstanceId!;
    if (!liveInstances.includes(instanceId)) {
      const instanceName = instance.Tags!.find((t) => t.Key === "Name")?.Value;
      const instanceState = instance.State!.Name;
      if (instanceState === "running") {
        console.log(chalk`Stopping instance {bold ${instanceId}} {yellow {bold ${instanceName}}}`);
        if (!dryRun) {
          await ec2.stopInstances({ InstanceIds: [instanceId] }).promise();
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
              await ec2.terminateInstances({ InstanceIds: [instanceId] }).promise();
            }
          }
        }
      }
    }
  }
}

run(main);
