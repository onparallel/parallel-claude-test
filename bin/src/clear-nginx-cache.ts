import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";
import {
  DescribeInstanceHealthCommand,
  ElasticLoadBalancingClient,
} from "@aws-sdk/client-elastic-load-balancing";
import { execSync } from "child_process";
import { run } from "./utils/run";

const ec2 = new EC2Client({});
const elb = new ElasticLoadBalancingClient({});

async function main() {
  const instances = await ec2
    .send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "tag-key", Values: ["Release"] }],
      })
    )
    .then((r) => r.Reservations!.flatMap((r) => r.Instances!));

  const descriptions = await elb.send(
    new DescribeInstanceHealthCommand({
      LoadBalancerName: "parallel-production",
    })
  );
  for (const state of descriptions.InstanceStates!) {
    if (state.State === "InService") {
      const instance = instances.find((i) => i.InstanceId === state.InstanceId);
      execSync(
        `ssh \
        -o "UserKnownHostsFile=/dev/null" \
        -o StrictHostKeyChecking=no \
        ${instance?.PrivateIpAddress} sudo rm -r /var/cache/nginx/*`,
        { encoding: "utf-8", stdio: "inherit" }
      );
    }
  }
}

run(main);
