import AWS from "aws-sdk";
import chalk from "chalk";
import yargs from "yargs";
import { run } from "./utils/run";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();

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

  const loadBalancerArn = await elbv2
    .describeLoadBalancers({ Names: [`parallel-${env}`] })
    .promise()
    .then((r) => r.LoadBalancers![0].LoadBalancerArn!);
  const targetGroupsArns = await elbv2
    .describeListeners({ LoadBalancerArn: loadBalancerArn })
    .promise()
    .then((r) => r.Listeners!.map((l) => l.DefaultActions![0].TargetGroupArn!));
  const liveInstancesIds = await elbv2
    .describeTargetHealth({ TargetGroupArn: targetGroupsArns[0] })
    .promise()
    .then((r) => r.TargetHealthDescriptions!.map((thd) => thd.Target!.Id));
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
    if (!liveInstancesIds.includes(instanceId)) {
      const instanceName = instance.Tags!.find((t) => t.Key === "Name")?.Value;
      const instanceState = instance.State!.Name;
      if (instanceState === "running") {
        console.log(chalk`Stopping instance {bold ${instanceId}} {yellow {bold ${instanceName}}}`);
        if (!dryRun) {
          await ec2.stopInstances({ InstanceIds: [instanceId] }).promise();
        }
      } else if (instanceState === "stopped" || instanceState === "stopping") {
        console.log(chalk`Terminating instance {bold ${instanceId}} {red {bold ${instanceName}}}`);
        if (!dryRun) {
          await ec2.terminateInstances({ InstanceIds: [instanceId] }).promise();
        }
      }
    }
  }
}

run(main);
