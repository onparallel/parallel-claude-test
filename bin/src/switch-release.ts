import {
  CloudFrontClient,
  CloudFrontServiceException,
  CreateInvalidationCommand,
  ListDistributionsCommand,
} from "@aws-sdk/client-cloudfront";
import {
  AssociateAddressCommand,
  DescribeAddressesCommand,
  DescribeInstancesCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  DeregisterInstancesFromLoadBalancerCommand,
  DescribeInstanceHealthCommand,
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingClient,
  RegisterInstancesWithLoadBalancerCommand,
} from "@aws-sdk/client-elastic-load-balancing";
import chalk from "chalk";
import { execSync } from "child_process";
import pMap from "p-map";
import { zip } from "remeda";
import yargs from "yargs";
import { run } from "./utils/run";
import { waitFor } from "./utils/wait";

const ec2 = new EC2Client({});
const elb = new ElasticLoadBalancingClient({});
const cloudfront = new CloudFrontClient({});
const OPS_DIR = "/home/ec2-user/main/ops/prod";

async function main() {
  const { commit: _commit, env } = await yargs
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
  const buildId = `parallel-${env}-${commit}`;

  const oldInstances = await elb
    .send(new DescribeLoadBalancersCommand({ LoadBalancerNames: [`parallel-${env}`] }))
    .then((r) => r.LoadBalancerDescriptions![0].Instances!);

  const newInstances = await ec2
    .send(
      new DescribeInstancesCommand({
        Filters: [
          { Name: "tag:Release", Values: [commit] },
          { Name: "tag:Environment", Values: [env] },
          { Name: "instance-state-name", Values: ["running"] },
        ],
      })
    )
    .then((r) => r.Reservations!.flatMap((r) => r.Instances!));

  if (newInstances.length === 0) {
    throw new Error(`No running instances for environment ${env} and release ${commit}.`);
  }

  if (env === "production") {
    const addresses = await ec2
      .send(new DescribeAddressesCommand({ Filters: [{ Name: "tag:Environment", Values: [env] }] }))
      .then((r) => r.Addresses!);

    const availableAddresses = addresses.filter(
      (a) => !oldInstances.some((i) => a.InstanceId === i.InstanceId)
    );

    if (availableAddresses.length < newInstances.length) {
      throw new Error("Not enough available elastic IPs");
    }

    for (const [instance, address] of zip(newInstances, availableAddresses)) {
      const addressName = address.Tags!.find((t) => t.Key === "Name")!.Value!;
      console.log(`Associating address ${addressName} with instance ${instance.InstanceId}`);
      await ec2.send(
        new AssociateAddressCommand({
          InstanceId: instance.InstanceId,
          AllocationId: address.AllocationId,
        })
      );
    }
  }

  for (const instance of newInstances) {
    const ipAddress = instance.PrivateIpAddress!;
    executeRemoteCommand(ipAddress, `${OPS_DIR}/server.sh start`);
    console.log(`Server started in ${instance.InstanceId}`);
  }

  const oldInstancesFull = oldInstances.length
    ? await ec2
        .send(new DescribeInstancesCommand({ InstanceIds: oldInstances.map((i) => i.InstanceId!) }))
        .then((r) => r.Reservations!.flatMap((r) => r.Instances!))
    : [];

  await pMap(oldInstancesFull, async (instance) => {
    const ipAddress = instance.PrivateIpAddress!;
    const instanceName = instance.Tags?.find((t) => t.Key === "Name")!.Value;
    console.log(chalk.yellow`Stopping workers on ${instance.InstanceId!} ${instanceName}`);
    executeRemoteCommand(ipAddress, `${OPS_DIR}/workers.sh stop`);
    console.log(chalk.green.bold`Workers stopped on ${instance.InstanceId!} ${instanceName}`);
  });

  console.log(chalk.yellow`Registering new instances on LB`);
  await elb.send(
    new RegisterInstancesWithLoadBalancerCommand({
      LoadBalancerName: `parallel-${env}`,
      Instances: newInstances,
    })
  );

  console.log(chalk.yellow`Creating invalidation for static files`);
  const distributionId = await cloudfront
    .send(new ListDistributionsCommand({}))
    .then(
      (result) =>
        result.DistributionList!.Items!.find((d) =>
          d.Origins!.Items!.some((o) => o.Id === `S3-parallel-static-${env}`)
        )!.Id
    );
  // find distribution for
  await waitFor(async (iteration) => {
    if (iteration >= 10) {
      throw new Error("Cloudfront is not responding.");
    }
    try {
      await cloudfront.send(
        new CreateInvalidationCommand({
          DistributionId: distributionId,
          InvalidationBatch: {
            CallerReference: buildId,
            Paths: { Quantity: 1, Items: ["/static/*"] },
          },
        })
      );
      return true;
    } catch (error) {
      if (error instanceof CloudFrontServiceException) {
        return false;
      }
      throw error;
    }
  }, 30_000);

  console.log(chalk.green.bold`Invalidation created`);

  await waitFor(
    async () => {
      return await elb
        .send(
          new DescribeInstanceHealthCommand({
            LoadBalancerName: `parallel-${env}`,
            Instances: newInstances,
          })
        )
        .then((r) => r.InstanceStates!.every((i) => i.State === "InService"));
    },
    chalk.yellow.italic`...Waiting for new instances to become healthy`,
    3000
  );
  console.log(chalk.green.bold`New instances are healthy`);

  if (oldInstances.length) {
    console.log(chalk.yellow`Deregistering old instances on LB`);
    await elb.send(
      new DeregisterInstancesFromLoadBalancerCommand({
        LoadBalancerName: `parallel-${env}`,
        Instances: oldInstances,
      })
    );

    await waitFor(
      async () => {
        return await elb
          .send(
            new DescribeInstanceHealthCommand({
              LoadBalancerName: `parallel-${env}`,
              Instances: oldInstances,
            })
          )
          .then((r) => r.InstanceStates!.every((i) => i.State === "OutOfService"));
      },
      chalk.yellow.italic`...Waiting for old instances to become out of service`,
      3000
    );
    console.log(chalk.green.bold`Old instances deregistered`);
  }

  await pMap(newInstances, async (instance) => {
    const ipAddress = instance.PrivateIpAddress!;
    const instanceName = instance.Tags?.find((t) => t.Key === "Name")!.Value;
    console.log(chalk.yellow`Starting workers on ${instance.InstanceId!} ${instanceName}`);
    executeRemoteCommand(ipAddress, `${OPS_DIR}/workers.sh start`);
    console.log(chalk.green.bold`Workers started on ${instance.InstanceId!} ${instanceName}`);
  });

  // Uncomment after next release
  // await pMap(oldInstancesFull, async (instance) => {
  //   const ipAddress = instance.PrivateIpAddress!;
  //   executeRemoteCommand(ipAddress, `${OPS_DIR}/server.sh stop`);
  // });
}

run(main);

function executeRemoteCommand(ipAddress: string, command: string) {
  execSync(`ssh \
  -o "UserKnownHostsFile=/dev/null" \
  -o StrictHostKeyChecking=no \
  ${ipAddress} ${command}`);
}
