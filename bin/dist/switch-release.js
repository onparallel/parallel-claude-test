"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const wait_1 = require("./utils/wait");
aws_sdk_1.default.config.credentials = new aws_sdk_1.default.SharedIniFileCredentials({
    profile: "parallel-deploy",
});
aws_sdk_1.default.config.region = "eu-central-1";
const ec2 = new aws_sdk_1.default.EC2();
const elb = new aws_sdk_1.default.ELB();
const cloudfront = new aws_sdk_1.default.CloudFront();
async function main() {
    const { commit: _commit, env } = await yargs_1.default
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
        .then((r) => r.Reservations.flatMap((r) => r.Instances).map((i) => ({ InstanceId: i.InstanceId })));
    if (newInstances.length === 0) {
        throw new Error(`No running instances for environment ${env} and release ${commit}.`);
    }
    const oldInstances = await elb
        .describeLoadBalancers({ LoadBalancerNames: [`parallel-${env}`] })
        .promise()
        .then((r) => r.LoadBalancerDescriptions[0].Instances);
    const oldInstancesFull = oldInstances.length
        ? await ec2
            .describeInstances({
            InstanceIds: oldInstances.map((i) => i.InstanceId),
        })
            .promise()
            .then((r) => r.Reservations.flatMap((r) => r.Instances))
        : [];
    await Promise.all(oldInstancesFull.map(async (instance) => {
        var _a;
        const ipAddress = instance.PrivateIpAddress;
        const instanceName = (_a = instance.Tags) === null || _a === void 0 ? void 0 : _a.find((t) => t.Key === "Name").Value;
        console.log((0, chalk_1.default) `Stopping workers on ${instance.InstanceId} ${instanceName}`);
        (0, child_process_1.execSync)(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} /home/ec2-user/workers.sh stop`);
        console.log((0, chalk_1.default) `Workers stopped on ${instance.InstanceId} ${instanceName}`);
    }));
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
        .then((result) => result.DistributionList.Items.find((d) => d.Origins.Items.some((o) => o.Id === `S3-parallel-static-${env}`)).Id);
    // find distribution for
    await cloudfront
        .createInvalidation({
        DistributionId: distributionId,
        InvalidationBatch: { CallerReference: buildId, Paths: { Quantity: 1, Items: ["/static/*"] } },
    })
        .promise();
    await (0, wait_1.waitFor)(async () => {
        return await elb
            .describeInstanceHealth({ LoadBalancerName: `parallel-${env}`, Instances: newInstances })
            .promise()
            .then((r) => r.InstanceStates.every((i) => i.State === "InService"));
    }, `Waiting for new targets to become healthy`, 3000);
    if (oldInstances.length) {
        await elb
            .deregisterInstancesFromLoadBalancer({
            LoadBalancerName: `parallel-${env}`,
            Instances: oldInstances,
        })
            .promise();
        await (0, wait_1.waitFor)(async () => {
            return await elb
                .describeInstanceHealth({ LoadBalancerName: `parallel-${env}`, Instances: oldInstances })
                .promise()
                .then((r) => r.InstanceStates.every((i) => i.State === "OutOfService"));
        }, `Waiting for new targets to become out of service`, 3000);
    }
    const newInstancesFull = await ec2
        .describeInstances({
        InstanceIds: newInstances.map((i) => i.InstanceId),
    })
        .promise()
        .then((r) => r.Reservations.flatMap((r) => r.Instances));
    await Promise.all(newInstancesFull.map(async (instance) => {
        var _a;
        const ipAddress = instance.PrivateIpAddress;
        const instanceName = (_a = instance.Tags) === null || _a === void 0 ? void 0 : _a.find((t) => t.Key === "Name").Value;
        console.log((0, chalk_1.default) `Starting workers on ${instance.InstanceId} ${instanceName}`);
        (0, child_process_1.execSync)(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} /home/ec2-user/workers.sh start`);
        console.log((0, chalk_1.default) `Workers started on ${instance.InstanceId} ${instanceName}`);
    }));
}
(0, run_1.run)(main);
