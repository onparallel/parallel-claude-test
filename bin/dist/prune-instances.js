"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const chalk_1 = __importDefault(require("chalk"));
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
aws_sdk_1.default.config.credentials = new aws_sdk_1.default.SharedIniFileCredentials({
    profile: "parallel-deploy",
});
aws_sdk_1.default.config.region = "eu-central-1";
const ec2 = new aws_sdk_1.default.EC2();
const elb = new aws_sdk_1.default.ELB();
async function main() {
    var _a;
    const { env, "dry-run": dryRun } = await yargs_1.default
        .usage("Usage: $0 --env [env]")
        .option("dry-run", {
        type: "boolean",
        description: "Don't run commands",
    })
        .option("env", {
        required: true,
        choices: ["staging", "production"],
        description: "The environment for the build",
    }).argv;
    const liveInstances = await elb
        .describeLoadBalancers({ LoadBalancerNames: [`parallel-${env}`] })
        .promise()
        .then((r) => r.LoadBalancerDescriptions[0].Instances.map((i) => i.InstanceId));
    const instances = await ec2
        .describeInstances({
        Filters: [
            { Name: "tag-key", Values: ["Release"] },
            { Name: "tag:Environment", Values: [env] },
        ],
    })
        .promise()
        .then((r) => r.Reservations.flatMap((r) => r.Instances));
    for (const instance of instances) {
        const instanceId = instance.InstanceId;
        if (!liveInstances.includes(instanceId)) {
            const instanceName = (_a = instance.Tags.find((t) => t.Key === "Name")) === null || _a === void 0 ? void 0 : _a.Value;
            const instanceState = instance.State.Name;
            if (instanceState === "running") {
                console.log((0, chalk_1.default) `Stopping instance {bold ${instanceId}} {yellow {bold ${instanceName}}}`);
                if (!dryRun) {
                    await ec2.stopInstances({ InstanceIds: [instanceId] }).promise();
                }
            }
            else if (instanceState === "stopped" || instanceState === "stopping") {
                console.log((0, chalk_1.default) `Terminating instance {bold ${instanceId}} {red {bold ${instanceName}}}`);
                if (!dryRun) {
                    await ec2.terminateInstances({ InstanceIds: [instanceId] }).promise();
                }
            }
        }
    }
}
(0, run_1.run)(main);
