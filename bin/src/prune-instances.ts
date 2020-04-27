import AWS from "aws-sdk";
import chalk from "chalk";
import { execSync } from "child_process";
import yargs from "yargs";
import { run } from "./utils/run";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();

async function main() {
  const { commit: _commit, env, "dry-run": dryRun } = yargs
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

  const [result1, result2] = await Promise.all([
    ec2
      .describeInstances({
        Filters: [
          { Name: "tag-key", Values: ["Release"] },
          { Name: "tag:Environment", Values: [env] },
        ],
      })
      .promise(),
    elbv2
      .describeLoadBalancers({
        Names: [env],
      })
      .promise(),
  ]);
  const result3 = await elbv2
    .describeListeners({
      LoadBalancerArn: result2.LoadBalancers![0].LoadBalancerArn,
    })
    .promise();
  const tgArn = result3.Listeners?.find((l) => l.Protocol === "HTTPS")!
    .DefaultActions![0].TargetGroupArn as string;
  const result4 = await elbv2
    .describeTargetHealth({
      TargetGroupArn: tgArn,
    })
    .promise();
  const used = result4.TargetHealthDescriptions!.map((thd) => thd.Target!.Id);
  for (const instance of result1.Reservations!.flatMap((r) => r.Instances!)) {
    const id = instance.InstanceId!;
    if (!used.includes(id)) {
      const name = instance.Tags!.find((t) => t.Key === "Name")?.Value;
      const state = instance.State!.Name;
      if (state === "running") {
        console.log(
          chalk`Stopping instance {bold ${id}} {blue {bold ${name}}}`
        );
        if (!dryRun) {
          await ec2.stopInstances({ InstanceIds: [id] }).promise();
        }
      } else if (state === "stopped" || state === "stopping") {
        console.log(
          chalk`Terminating instance {bold ${id}} {red {bold ${name}}}`
        );
        if (!dryRun) {
          await ec2.terminateInstances({ InstanceIds: [id] }).promise();
        }
      }
    }
  }
  const result5 = await elbv2.describeTargetGroups().promise();
  for (const tg of result5.TargetGroups!) {
    if (
      tg.TargetGroupName!.endsWith(`-${env}`) &&
      tg.TargetGroupArn !== tgArn
    ) {
      console.log(
        chalk`Deleting target group {red {bold ${tg.TargetGroupName!}}}`
      );
      if (!dryRun) {
        await elbv2
          .deleteTargetGroup({ TargetGroupArn: tg.TargetGroupArn! })
          .promise();
      }
    }
  }
}

run(main);
