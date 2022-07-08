import AWS from "aws-sdk";
import chalk from "chalk";
import Table from "cli-table3";
import { run } from "./utils/run";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

const ec2 = new AWS.EC2();
const elb = new AWS.ELB();

async function main() {
  const instances = await ec2
    .describeInstances({
      Filters: [{ Name: "tag-key", Values: ["Release"] }],
    })
    .promise()
    .then((r) => r.Reservations!.flatMap((r) => r.Instances!));

  const loadBalancers = await elb
    .describeLoadBalancers({
      LoadBalancerNames: ["parallel-staging", "parallel-production"],
    })
    .promise();

  const instancesToLb: Record<string, string> = {};
  const instancesToLbState: Record<string, string> = {};
  for (const lb of loadBalancers.LoadBalancerDescriptions!) {
    const descriptions = await elb
      .describeInstanceHealth({ LoadBalancerName: lb.LoadBalancerName! })
      .promise();
    for (const state of descriptions.InstanceStates!) {
      if (state.State === "InService") {
        instancesToLb[state.InstanceId!] = lb.LoadBalancerName!;
        if (state.Description === "Instance deregistration currently in progress.") {
          instancesToLbState[state.InstanceId!] = "Deregistering";
        } else if (state.Description === "N/A") {
          instancesToLbState[state.InstanceId!] = "InService";
        }
      } else if (state.State === "OutOfService") {
        if (state.Description === "Instance registration is still in progress.") {
          instancesToLb[state.InstanceId!] = lb.LoadBalancerName!;
          instancesToLbState[state.InstanceId!] = "Registering";
        }
      } else {
        instancesToLbState[state.InstanceId!] = "Unknown";
      }
    }
  }

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
            return chalk.green("✓ Running");
          case "stopped":
            return chalk.red("⨯ Stopped");
          case "terminated":
            return chalk.red("⨯ Terminated");
          default:
            return chalk.yellow(i.State?.Name);
        }
      })();
      const health = (() => {
        switch (instancesToLbState[i.InstanceId!]) {
          case "InService":
            return chalk.green("✓ InService");
          case undefined:
            return chalk.red("⨯");
          default:
            return chalk.yellow(`… ${instancesToLbState[i.InstanceId!]}`);
        }
      })();
      return [
        i.InstanceId!,
        i.PrivateIpAddress!,
        i.Tags?.find((t) => t.Key === "Name")?.Value ?? chalk.gray`-`,
        i.Tags?.find((t) => t.Key === "Release")?.Value ?? chalk.gray`-`,
        state,
        instancesToLb[i.InstanceId!] ?? chalk.red`⨯`,
        health,
        i.LaunchTime?.toLocaleString("en-GB"),
      ];
    })
  );
  console.log(table.toString());
}

run(main);
