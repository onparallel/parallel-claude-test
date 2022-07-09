import AWS from "aws-sdk";
import chalk from "chalk";
import { execSync } from "child_process";
import yargs from "yargs";
import { run } from "./utils/run";
import { waitFor } from "./utils/wait";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

const ec2 = new AWS.EC2();
const elb = new AWS.ELB();
const cloudfront = new AWS.CloudFront();

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
    .describeInstances({
      Filters: [
        { Name: "tag:Release", Values: [commit] },
        { Name: "tag:Environment", Values: [env] },
        { Name: "instance-state-name", Values: ["running"] },
      ],
    })
    .promise()
    .then((r) =>
      r.Reservations!.flatMap((r) => r.Instances!).map((i) => ({ InstanceId: i.InstanceId }))
    );

  if (newInstances.length === 0) {
    throw new Error(`No running instances for environment ${env} and release ${commit}.`);
  }

  const oldInstances = await elb
    .describeLoadBalancers({ LoadBalancerNames: [`parallel-${env}`] })
    .promise()
    .then((r) => r.LoadBalancerDescriptions![0].Instances!);

  const oldInstancesFull = oldInstances.length
    ? await ec2
        .describeInstances({
          InstanceIds: oldInstances.map((i) => i.InstanceId!),
        })
        .promise()
        .then((r) => r.Reservations!.flatMap((r) => r.Instances!))
    : [];

  await Promise.all(
    oldInstancesFull.map(async (instance) => {
      const ipAddress = instance.PrivateIpAddress!;
      const instanceName = instance.Tags?.find((t) => t.Key === "Name")!.Value;
      console.log(chalk`Stopping workers on ${instance.InstanceId!} ${instanceName}`);
      execSync(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} /home/ec2-user/workers.sh stop`);
      console.log(chalk`Workers stopped on ${instance.InstanceId!} ${instanceName}`);
    })
  );

  console.log("Registering new instances on LB");
  await elb
    .registerInstancesWithLoadBalancer({
      LoadBalancerName: `parallel-${env}`,
      Instances: newInstances,
    })
    .promise();

  console.log("Create invalidation for static files");
  const distributionId = await cloudfront
    .listDistributions()
    .promise()
    .then(
      (result) =>
        result.DistributionList!.Items!.find((d) =>
          d.Origins.Items.some((o) => o.Id === `S3-parallel-static-${env}`)
        )!.Id
    );
  // find distribution for
  await cloudfront
    .createInvalidation({
      DistributionId: distributionId,
      InvalidationBatch: { CallerReference: buildId, Paths: { Quantity: 1, Items: ["/static/*"] } },
    })
    .promise();

  await waitFor(
    async () => {
      return await elb
        .describeInstanceHealth({ LoadBalancerName: `parallel-${env}`, Instances: newInstances })
        .promise()
        .then((r) => r.InstanceStates!.every((i) => i.State === "InService"));
    },
    `Waiting for new targets to become healthy`,
    3000
  );

  if (oldInstances.length) {
    console.log("Deregistering new instances on LB");
    await elb
      .deregisterInstancesFromLoadBalancer({
        LoadBalancerName: `parallel-${env}`,
        Instances: oldInstances,
      })
      .promise();
    await waitFor(
      async () => {
        return await elb
          .describeInstanceHealth({ LoadBalancerName: `parallel-${env}`, Instances: oldInstances })
          .promise()
          .then((r) => r.InstanceStates!.every((i) => i.State === "OutOfService"));
      },
      `Waiting for new targets to become out of service`,
      3000
    );
  }

  const newInstancesFull = await ec2
    .describeInstances({
      InstanceIds: newInstances.map((i) => i.InstanceId!),
    })
    .promise()
    .then((r) => r.Reservations!.flatMap((r) => r.Instances!));

  await Promise.all(
    newInstancesFull.map(async (instance) => {
      const ipAddress = instance.PrivateIpAddress!;
      const instanceName = instance.Tags?.find((t) => t.Key === "Name")!.Value;
      console.log(chalk`Starting workers on ${instance.InstanceId!} ${instanceName}`);
      execSync(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} /home/ec2-user/workers.sh start`);
      console.log(chalk`Workers started on ${instance.InstanceId!} ${instanceName}`);
    })
  );
}

run(main);
