"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_cloudfront_1 = require("@aws-sdk/client-cloudfront");
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_elastic_load_balancing_1 = require("@aws-sdk/client-elastic-load-balancing");
const chalk_1 = __importDefault(require("chalk"));
const p_map_1 = __importDefault(require("p-map"));
const remeda_1 = require("remeda");
const ts_essentials_1 = require("ts-essentials");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const ssh_1 = require("./utils/ssh");
const wait_1 = require("./utils/wait");
const ec2 = new client_ec2_1.EC2Client({});
const elb = new client_elastic_load_balancing_1.ElasticLoadBalancingClient({});
const cloudfront = new client_cloudfront_1.CloudFrontClient({});
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
    // redundant make sure the user is deploying on the intended environment
    (0, ts_essentials_1.assert)(env === process.env.ENV, "env mismatch");
    const commit = _commit.slice(0, 7);
    const buildId = `parallel-${env}-${commit}`;
    const oldInstances = await elb
        .send(new client_elastic_load_balancing_1.DescribeLoadBalancersCommand({ LoadBalancerNames: [`parallel-${env}`] }))
        .then((r) => r.LoadBalancerDescriptions[0].Instances);
    const newInstances = await ec2
        .send(new client_ec2_1.DescribeInstancesCommand({
        Filters: [
            { Name: "tag:Release", Values: [commit] },
            { Name: "tag:Environment", Values: [env] },
            { Name: "tag:App", Values: ["server"] },
            { Name: "instance-state-name", Values: [client_ec2_1.InstanceStateName.running] },
        ],
    }))
        .then((r) => r
        .Reservations.flatMap((r) => r.Instances)
        .filter((newInstance) => !oldInstances.some((oldInstance) => oldInstance.InstanceId === newInstance.InstanceId)));
    if (newInstances.length === 0) {
        throw new Error(`No running instances for environment ${env} and release ${commit}.`);
    }
    const addresses = await ec2
        .send(new client_ec2_1.DescribeAddressesCommand({
        Filters: [
            { Name: "tag:Environment", Values: [env] },
            { Name: "tag:App", Values: ["server"] },
        ],
    }))
        .then((r) => r.Addresses);
    const availableAddresses = addresses.filter((a) => !oldInstances.some((i) => a.InstanceId === i.InstanceId));
    if (availableAddresses.length < newInstances.length) {
        throw new Error("Not enough available elastic IPs");
    }
    await (0, p_map_1.default)((0, remeda_1.zip)(newInstances, availableAddresses), async ([instance, address]) => {
        const addressName = address.Tags.find((t) => t.Key === "Name").Value;
        console.log(`Associating address ${addressName} with instance ${instance.InstanceId}`);
        await ec2.send(new client_ec2_1.AssociateAddressCommand({
            InstanceId: instance.InstanceId,
            AllocationId: address.AllocationId,
        }));
    });
    await (0, p_map_1.default)(newInstances, async (instance) => {
        const ipAddress = instance.PrivateIpAddress;
        const instanceName = instance.Tags?.find((t) => t.Key === "Name").Value;
        await (0, ssh_1.executeRemoteCommand)(ipAddress, `${OPS_DIR}/server.sh start`);
        console.log(chalk_1.default.green `Server started in ${instance.InstanceId} ${instanceName}`);
    });
    const oldInstancesFull = oldInstances.length
        ? await ec2
            .send(new client_ec2_1.DescribeInstancesCommand({ InstanceIds: oldInstances.map((i) => i.InstanceId) }))
            .then((r) => r.Reservations.flatMap((r) => r.Instances))
        : [];
    await (0, p_map_1.default)(oldInstancesFull, async (instance) => {
        if (instance.State?.Name === client_ec2_1.InstanceStateName.running) {
            const ipAddress = instance.PrivateIpAddress;
            const instanceName = instance.Tags?.find((t) => t.Key === "Name").Value;
            console.log(chalk_1.default.yellow `Stopping workers on ${instance.InstanceId} ${instanceName}`);
            await (0, ssh_1.executeRemoteCommand)(ipAddress, `${OPS_DIR}/workers.sh stop`);
            console.log(chalk_1.default.green.bold `Workers stopped on ${instance.InstanceId} ${instanceName}`);
        }
    });
    console.log(chalk_1.default.yellow `Registering new instances on LB`);
    await elb.send(new client_elastic_load_balancing_1.RegisterInstancesWithLoadBalancerCommand({
        LoadBalancerName: `parallel-${env}`,
        Instances: newInstances,
    }));
    console.log(chalk_1.default.yellow `Creating invalidation for static files`);
    const distributionId = await cloudfront
        .send(new client_cloudfront_1.ListDistributionsCommand({}))
        .then((result) => result.DistributionList.Items.find((d) => d.Origins.Items.some((o) => o.Id === `S3-parallel-static-${env}`)).Id);
    await (0, wait_1.waitForResult)(async (iteration) => {
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
    }, { delay: 5000 });
    console.log(chalk_1.default.green.bold `Invalidation created`);
    await (0, wait_1.waitForResult)(async () => {
        return await elb
            .send(new client_elastic_load_balancing_1.DescribeInstanceHealthCommand({
            LoadBalancerName: `parallel-${env}`,
            Instances: newInstances,
        }))
            .then((r) => r.InstanceStates.every((i) => i.State === "InService"));
    }, {
        message: chalk_1.default.yellow.italic `...Waiting for new instances to become healthy`,
        delay: 3000,
    });
    console.log(chalk_1.default.green.bold `New instances are healthy`);
    if (oldInstances.length) {
        console.log(chalk_1.default.yellow `Deregistering old instances on LB`);
        await elb.send(new client_elastic_load_balancing_1.DeregisterInstancesFromLoadBalancerCommand({
            LoadBalancerName: `parallel-${env}`,
            Instances: oldInstances,
        }));
        await (0, wait_1.waitForResult)(async () => {
            return await elb
                .send(new client_elastic_load_balancing_1.DescribeInstanceHealthCommand({
                LoadBalancerName: `parallel-${env}`,
                Instances: oldInstances,
            }))
                .then((r) => r.InstanceStates.every((i) => i.State === "OutOfService"));
        }, {
            message: chalk_1.default.yellow.italic `...Waiting for old instances to become out of service`,
            delay: 3000,
        });
        console.log(chalk_1.default.green.bold `Old instances deregistered`);
    }
    await (0, p_map_1.default)(newInstances, async (instance) => {
        const ipAddress = instance.PrivateIpAddress;
        const instanceName = instance.Tags?.find((t) => t.Key === "Name").Value;
        console.log(chalk_1.default.yellow `Starting workers on ${instance.InstanceId} ${instanceName}`);
        await (0, ssh_1.executeRemoteCommand)(ipAddress, `${OPS_DIR}/workers.sh start`);
        console.log(chalk_1.default.green.bold `Workers started on ${instance.InstanceId} ${instanceName}`);
    });
    await (0, p_map_1.default)(oldInstancesFull, async (instance) => {
        if (instance.State?.Name === client_ec2_1.InstanceStateName.running) {
            const ipAddress = instance.PrivateIpAddress;
            const instanceName = instance.Tags?.find((t) => t.Key === "Name").Value;
            await (0, ssh_1.executeRemoteCommand)(ipAddress, `${OPS_DIR}/server.sh stop`);
            console.log(chalk_1.default.green `Server stopped in ${instance.InstanceId} ${instanceName}`);
        }
    });
}
(0, run_1.run)(main);
