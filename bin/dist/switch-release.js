"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_cloudfront_1 = require("@aws-sdk/client-cloudfront");
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_elastic_load_balancing_1 = require("@aws-sdk/client-elastic-load-balancing");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const wait_1 = require("./utils/wait");
const ec2 = new client_ec2_1.EC2Client({ credentials: (0, credential_providers_1.fromIni)({ profile: "parallel-deploy" }) });
const elb = new client_elastic_load_balancing_1.ElasticLoadBalancingClient({
    credentials: (0, credential_providers_1.fromIni)({ profile: "parallel-deploy" }),
});
const cloudfront = new client_cloudfront_1.CloudFrontClient({ credentials: (0, credential_providers_1.fromIni)({ profile: "parallel-deploy" }) });
const OPS_DIR = "/home/ec2-user/main/ops/prod";
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
        .send(new client_ec2_1.DescribeInstancesCommand({
        Filters: [
            { Name: "tag:Release", Values: [commit] },
            { Name: "tag:Environment", Values: [env] },
            { Name: "instance-state-name", Values: ["running"] },
        ],
    }))
        .then((r) => r.Reservations.flatMap((r) => r.Instances).map((i) => ({ InstanceId: i.InstanceId })));
    if (newInstances.length === 0) {
        throw new Error(`No running instances for environment ${env} and release ${commit}.`);
    }
    const oldInstances = await elb
        .send(new client_elastic_load_balancing_1.DescribeLoadBalancersCommand({ LoadBalancerNames: [`parallel-${env}`] }))
        .then((r) => r.LoadBalancerDescriptions[0].Instances);
    const oldInstancesFull = oldInstances.length
        ? await ec2
            .send(new client_ec2_1.DescribeInstancesCommand({
            InstanceIds: oldInstances.map((i) => i.InstanceId),
        }))
            .then((r) => r.Reservations.flatMap((r) => r.Instances))
        : [];
    await Promise.all(oldInstancesFull.map(async (instance) => {
        var _a;
        const ipAddress = instance.PrivateIpAddress;
        const instanceName = (_a = instance.Tags) === null || _a === void 0 ? void 0 : _a.find((t) => t.Key === "Name").Value;
        console.log(chalk_1.default.yellow `Stopping workers on ${instance.InstanceId} ${instanceName}`);
        (0, child_process_1.execSync)(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} ${OPS_DIR}/workers.sh stop`);
        console.log(chalk_1.default.green.bold `Workers stopped on ${instance.InstanceId} ${instanceName}`);
    }));
    console.log(chalk_1.default.yellow `Registering new instances on LB`);
    await elb.send(new client_elastic_load_balancing_1.RegisterInstancesWithLoadBalancerCommand({
        LoadBalancerName: `parallel-${env}`,
        Instances: newInstances,
    }));
    console.log(chalk_1.default.yellow `Creating invalidation for static files`);
    const distributionId = await cloudfront
        .send(new client_cloudfront_1.ListDistributionsCommand({}))
        .then((result) => result.DistributionList.Items.find((d) => d.Origins.Items.some((o) => o.Id === `S3-parallel-static-${env}`)).Id);
    // find distribution for
    await (0, wait_1.waitFor)(async (iteration) => {
        if (iteration >= 10) {
            throw new Error("Cloudfront is not responding.");
        }
        try {
            await cloudfront.send(new client_cloudfront_1.CreateInvalidationCommand({
                DistributionId: distributionId,
                InvalidationBatch: {
                    CallerReference: buildId,
                    Paths: { Quantity: 1, Items: ["/static/*"] },
                },
            }));
            return true;
        }
        catch (error) {
            if (error instanceof client_cloudfront_1.CloudFrontServiceException) {
                return false;
            }
            throw error;
        }
    }, 30000);
    console.log(chalk_1.default.green.bold `Invalidation created`);
    await (0, wait_1.waitFor)(async () => {
        return await elb
            .send(new client_elastic_load_balancing_1.DescribeInstanceHealthCommand({
            LoadBalancerName: `parallel-${env}`,
            Instances: newInstances,
        }))
            .then((r) => r.InstanceStates.every((i) => i.State === "InService"));
    }, chalk_1.default.yellow.italic `...Waiting for new instances to become healthy`, 3000);
    console.log(chalk_1.default.green.bold `New instances are healthy`);
    if (oldInstances.length) {
        console.log(chalk_1.default.yellow `Deregistering old instances on LB`);
        await elb.send(new client_elastic_load_balancing_1.DeregisterInstancesFromLoadBalancerCommand({
            LoadBalancerName: `parallel-${env}`,
            Instances: oldInstances,
        }));
        await (0, wait_1.waitFor)(async () => {
            return await elb
                .send(new client_elastic_load_balancing_1.DescribeInstanceHealthCommand({
                LoadBalancerName: `parallel-${env}`,
                Instances: oldInstances,
            }))
                .then((r) => r.InstanceStates.every((i) => i.State === "OutOfService"));
        }, chalk_1.default.yellow.italic `...Waiting for old instances to become out of service`, 3000);
        console.log(chalk_1.default.green.bold `Old instances deregistered`);
    }
    const newInstancesFull = await ec2
        .send(new client_ec2_1.DescribeInstancesCommand({
        InstanceIds: newInstances.map((i) => i.InstanceId),
    }))
        .then((r) => r.Reservations.flatMap((r) => r.Instances));
    await Promise.all(newInstancesFull.map(async (instance) => {
        var _a;
        const ipAddress = instance.PrivateIpAddress;
        const instanceName = (_a = instance.Tags) === null || _a === void 0 ? void 0 : _a.find((t) => t.Key === "Name").Value;
        console.log(chalk_1.default.yellow `Starting workers on ${instance.InstanceId} ${instanceName}`);
        (0, child_process_1.execSync)(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} ${OPS_DIR}/workers.sh start`);
        console.log(chalk_1.default.green.bold `Workers started on ${instance.InstanceId} ${instanceName}`);
    }));
}
(0, run_1.run)(main);
