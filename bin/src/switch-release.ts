import {
  CloudFrontClient,
  CreateInvalidationCommand,
  ListDistributionsCommand,
} from "@aws-sdk/client-cloudfront";
import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";
import {
  DeregisterInstancesFromLoadBalancerCommand,
  DescribeInstanceHealthCommand,
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingClient,
  RegisterInstancesWithLoadBalancerCommand,
} from "@aws-sdk/client-elastic-load-balancing";
import { fromIni } from "@aws-sdk/credential-providers";
import chalk from "chalk";
import { execSync } from "child_process";
import yargs from "yargs";
import { run } from "./utils/run";
import { waitFor } from "./utils/wait";

const ec2 = new EC2Client({ credentials: fromIni({ profile: "parallel-deploy" }) });
const elb = new ElasticLoadBalancingClient({
  credentials: fromIni({ profile: "parallel-deploy" }),
});
const cloudfront = new CloudFrontClient({ credentials: fromIni({ profile: "parallel-deploy" }) });
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
    .then((r) =>
      r.Reservations!.flatMap((r) => r.Instances!).map((i) => ({ InstanceId: i.InstanceId }))
    );

  if (newInstances.length === 0) {
    throw new Error(`No running instances for environment ${env} and release ${commit}.`);
  }

  const oldInstances = await elb
    .send(new DescribeLoadBalancersCommand({ LoadBalancerNames: [`parallel-${env}`] }))
    .then((r) => r.LoadBalancerDescriptions![0].Instances!);

  const oldInstancesFull = oldInstances.length
    ? await ec2
        .send(
          new DescribeInstancesCommand({
            InstanceIds: oldInstances.map((i) => i.InstanceId!),
          })
        )
        .then((r) => r.Reservations!.flatMap((r) => r.Instances!))
    : [];

  await Promise.all(
    oldInstancesFull.map(async (instance) => {
      const ipAddress = instance.PrivateIpAddress!;
      const instanceName = instance.Tags?.find((t) => t.Key === "Name")!.Value;
      console.log(chalk.yellow`Stopping workers on ${instance.InstanceId!} ${instanceName}`);
      execSync(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} ${OPS_DIR}/workers.sh stop`);
      console.log(chalk.green.bold`Workers stopped on ${instance.InstanceId!} ${instanceName}`);
    })
  );

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
  await cloudfront.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: { CallerReference: buildId, Paths: { Quantity: 1, Items: ["/static/*"] } },
    })
  );

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

  const newInstancesFull = await ec2
    .send(
      new DescribeInstancesCommand({
        InstanceIds: newInstances.map((i) => i.InstanceId!),
      })
    )
    .then((r) => r.Reservations!.flatMap((r) => r.Instances!));

  await Promise.all(
    newInstancesFull.map(async (instance) => {
      const ipAddress = instance.PrivateIpAddress!;
      const instanceName = instance.Tags?.find((t) => t.Key === "Name")!.Value;
      console.log(chalk.yellow`Starting workers on ${instance.InstanceId!} ${instanceName}`);
      execSync(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} ${OPS_DIR}/workers.sh start`);
      console.log(chalk.green.bold`Workers started on ${instance.InstanceId!} ${instanceName}`);
    })
  );
}

run(main);
