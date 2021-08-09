import AWS from "aws-sdk";
import { run } from "./utils/run";
import { indexBy } from "remeda";
import Table from "cli-table3";
import chalk from "chalk";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();

async function main() {
  const [r1, r2] = await Promise.all([
    ec2
      .describeInstances({
        Filters: [{ Name: "tag-key", Values: ["Release"] }],
      })
      .promise(),
    elbv2
      .describeLoadBalancers({
        Names: ["staging", "production"],
      })
      .promise(),
  ]);
  const lbs = await Promise.all(
    r2.LoadBalancers!.map(async (lb) => {
      const listeners = await elbv2
        .describeListeners({
          LoadBalancerArn: lb.LoadBalancerArn,
        })
        .promise();
      const tgArn = listeners.Listeners?.find((l) => l.Protocol === "HTTPS")!.DefaultActions![0]
        .TargetGroupArn as string;
      const tgHealth = await elbv2
        .describeTargetHealth({
          TargetGroupArn: tgArn,
        })
        .promise();
      return [lb.LoadBalancerName!, tgHealth.TargetHealthDescriptions![0]] as const;
    })
  );
  const instanceToLb = indexBy(lbs, ([_, h]) => h.Target?.Id);
  const instances = (r1.Reservations || [])
    .flatMap((r) => r.Instances ?? [])
    .filter((i) => i.Tags?.some((t) => t.Key === "Release"));

  const table = new Table({
    head: [
      "Instance ID",
      "Instance IP",
      "Instance Name",
      "Release",
      "State",
      "Load Balancer",
      "Health",
      "Launch Time",
    ].map((h) => chalk.blue.bold(h)),
    style: {
      head: [],
    },
  });
  table.push(
    ...instances.map((i) => {
      const state = (() => {
        switch (i.State?.Name) {
          case "running":
            return chalk.green("✓ running");
          case "stopped":
            return chalk.red("⨯ stopped");
          case "terminated":
            return chalk.red("⨯ terminated");
          default:
            return chalk.yellow(i.State?.Name);
        }
      })();
      const health = (() => {
        switch (instanceToLb[i.InstanceId!]?.[1].TargetHealth?.State) {
          case undefined:
            return chalk.yellow("?");
          case "healthy":
            return chalk.green("✓");
          default:
            return chalk.red("⨯");
        }
      })();
      return [
        i.InstanceId!,
        i.PrivateIpAddress!,
        i.Tags?.find((t) => t.Key === "Name")?.Value ?? chalk.gray`-`,
        i.Tags?.find((t) => t.Key === "Release")?.Value ?? chalk.gray`-`,
        state,
        instanceToLb[i.InstanceId!]?.[0] ?? chalk.red`⨯`,
        health,
        i.LaunchTime?.toLocaleString("en-GB"),
      ];
    })
  );
  console.log(table.toString());
}

run(main);
