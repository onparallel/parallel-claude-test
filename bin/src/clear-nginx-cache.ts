import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";
import {
  DescribeInstanceHealthCommand,
  ElasticLoadBalancingClient,
} from "@aws-sdk/client-elastic-load-balancing";
import pMap from "p-map";
import { run } from "./utils/run";
import { executeRemoteCommand } from "./utils/ssh";

const ec2 = new EC2Client({});
const elb = new ElasticLoadBalancingClient({});

async function main() {
  const instances = await ec2
    .send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "tag-key", Values: ["Release"] }],
      }),
    )
    .then((r) => r.Reservations!.flatMap((r) => r.Instances!));

  const descriptions = await elb.send(
    new DescribeInstanceHealthCommand({
      LoadBalancerName: "parallel-production",
    }),
  );
  await pMap(
    descriptions.InstanceStates!.filter((s) => s.State === "InService"),
    async (state) => {
      const instance = instances.find((i) => i.InstanceId === state.InstanceId)!;
      await executeRemoteCommand(instance.PrivateIpAddress!, "sudo rm -r /var/cache/nginx/*");
    },
  );
}

run(main);
