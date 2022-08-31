import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";
import {
  DescribeInstanceHealthCommand,
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingClient,
} from "@aws-sdk/client-elastic-load-balancing";
import { fromIni } from "@aws-sdk/credential-providers";
import chalk from "chalk";
import Table from "cli-table3";
import { run } from "./utils/run";

const ec2 = new EC2Client({ credentials: fromIni({ profile: "parallel-deploy" }) });
const elb = new ElasticLoadBalancingClient({
  credentials: fromIni({ profile: "parallel-deploy" }),
});

async function main() {
  const instances = await ec2
    .send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "tag-key", Values: ["Release"] }],
      })
    )
    .then((r) => r.Reservations!.flatMap((r) => r.Instances!));

  const loadBalancers = await elb.send(
    new DescribeLoadBalancersCommand({
      LoadBalancerNames: ["parallel-staging", "parallel-production"],
    })
  );

  const instancesToLb: Record<string, string> = {};
  const instancesToLbState: Record<string, string> = {};
  for (const lb of loadBalancers.LoadBalancerDescriptions!) {
    const descriptions = await elb.send(
      new DescribeInstanceHealthCommand({
        LoadBalancerName: lb.LoadBalancerName!,
      })
    );
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
