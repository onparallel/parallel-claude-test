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
  const { commit: _commit, env } = yargs
    .usage("Usage: $0 --commit [commit] --env [env]")
    .option("commit", {
      required: true,
      type: "string",
      description: "The commit sha",
    })
    .option("env", {
      required: true,
      choices: ["staging", "production"],
      description: "The environment for the build",
    }).argv;

  const commit = _commit.slice(0, 7);

  // Shutdown workers in current build
  console.log("Getting current target group.");
  const result1 = await elbv2.describeLoadBalancers({ Names: [env] }).promise();
  const loadBalancerArn = result1.LoadBalancers![0].LoadBalancerArn!;
  const result2 = await elbv2
    .describeListeners({
      LoadBalancerArn: loadBalancerArn,
    })
    .promise();
  const oldTargetGroupArn = result2.Listeners!.find(
    (l) => l.Protocol === "HTTPS"
  )!.DefaultActions![0].TargetGroupArn!;

  const result3 = await getTargetGroupInstances(oldTargetGroupArn);
  for (const instance of result3.Reservations!.flatMap((r) => r.Instances!)) {
    const ipAddress = instance.PrivateIpAddress!;
    console.log(
      chalk`Stopping workers on ${
        instance.Tags?.find((t) => t.Key === "Name")!.Value
      }`
    );
    execSync(`ssh ${ipAddress} /home/ec2-user/workers.sh stop`);
    console.log(
      chalk`Workers stopped on ${
        instance.Tags?.find((t) => t.Key === "Name")!.Value
      }`
    );
  }

  console.log("Getting new target group.");
  const targetGroupName = `${commit}-${env}`;
  const result4 = await elbv2
    .describeTargetGroups({ Names: [targetGroupName] })
    .promise();
  const targetGroupArn = result4.TargetGroups![0].TargetGroupArn!;
  const result5 = await elbv2
    .describeListeners({ LoadBalancerArn: loadBalancerArn })
    .promise();
  const listenerArn = result5.Listeners!.find((l) => l.Protocol === "HTTPS")!
    .ListenerArn!;
  console.log(
    chalk`Updating LB {blue {bold ${env}}} to point to TG {blue {bold ${targetGroupName}}}`
  );
  await elbv2
    .modifyListener({
      ListenerArn: listenerArn,
      DefaultActions: [
        {
          Type: "forward",
          TargetGroupArn: targetGroupArn,
        },
      ],
    })
    .promise();

  const result6 = await getTargetGroupInstances(targetGroupArn);
  for (const instance of result6.Reservations!.flatMap((r) => r.Instances!)) {
    const ipAddress = instance.PrivateIpAddress!;
    console.log(
      chalk`Starting workers on ${
        instance.Tags?.find((t) => t.Key === "Name")!.Value
      }`
    );
    execSync(`ssh ${ipAddress} /home/ec2-user/workers.sh start`);
    console.log(
      chalk`Workers started on ${
        instance.Tags?.find((t) => t.Key === "Name")!.Value
      }`
    );
  }
}

run(main);

async function getTargetGroupInstances(targetGroupArn: string) {
  const result1 = await elbv2
    .describeTargetGroups({
      TargetGroupArns: [targetGroupArn],
    })
    .promise();
  const [commit, env] = result1.TargetGroups![0].TargetGroupName!.split("-");
  return await ec2
    .describeInstances({
      Filters: [
        { Name: "tag:Release", Values: [commit] },
        { Name: "tag:Environment", Values: [env] },
        { Name: "instance-state-name", Values: ["running"] },
      ],
    })
    .promise();
}
