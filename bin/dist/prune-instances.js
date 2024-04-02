"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_elastic_load_balancing_1 = require("@aws-sdk/client-elastic-load-balancing");
const chalk_1 = __importDefault(require("chalk"));
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
const ec2 = new client_ec2_1.EC2Client({});
const elb = new client_elastic_load_balancing_1.ElasticLoadBalancingClient({});
const cw = new client_cloudwatch_1.CloudWatchClient({});
async function main() {
    var _a, _b;
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
        .send(new client_elastic_load_balancing_1.DescribeLoadBalancersCommand({ LoadBalancerNames: [`parallel-${env}`] }))
        .then((r) => r.LoadBalancerDescriptions[0].Instances.map((i) => i.InstanceId));
    const instances = await ec2
        .send(new client_ec2_1.DescribeInstancesCommand({
        Filters: [
            { Name: "tag-key", Values: ["Release"] },
            { Name: "tag:Environment", Values: [env] },
        ],
    }))
        .then((r) => r.Reservations.flatMap((r) => r.Instances));
    for (const instance of instances) {
        const instanceId = instance.InstanceId;
        if (!liveInstances.includes(instanceId)) {
            const instanceName = (_a = instance.Tags.find((t) => t.Key === "Name")) === null || _a === void 0 ? void 0 : _a.Value;
            const instanceState = instance.State.Name;
            if (env === "staging" && ["running", "stopped", "stopping"].includes(instanceState)) {
                console.log((0, chalk_1.default) `Terminating instance {bold ${instanceId}} {red {bold ${instanceName}}}`);
                if (!dryRun) {
                    const name = instance.Tags.find((t) => t.Key === "Name").Value;
                    const alarms = await cw
                        .send(new client_cloudwatch_1.DescribeAlarmsCommand({ AlarmNames: [`${name}-cpu-1m`, `${name}-cpu-5m`] }))
                        .then((r) => r.MetricAlarms);
                    if (alarms.length) {
                        console.log(`Deleting intance alarms ${alarms.map((a) => a.AlarmName).join(", ")}`);
                        await cw.send(new client_cloudwatch_1.DeleteAlarmsCommand({ AlarmNames: alarms.map((a) => a.AlarmName) }));
                    }
                    await ec2.send(new client_ec2_1.TerminateInstancesCommand({ InstanceIds: [instanceId] }));
                }
            }
            else if (instanceState === "running") {
                console.log((0, chalk_1.default) `Stopping instance {bold ${instanceId}} {yellow {bold ${instanceName}}}`);
                if (!dryRun) {
                    await ec2.send(new client_ec2_1.StopInstancesCommand({ InstanceIds: [instanceId] }));
                }
            }
            else if (instanceState === "stopped" || instanceState === "stopping") {
                const match = (_b = instance.StateTransitionReason) === null || _b === void 0 ? void 0 : _b.match(/^User initiated \((.*)\)$/);
                if (match) {
                    const transitionDate = new Date(match[1]);
                    // terminate instance that were stopped more than 7 days ago, so we can keep the instance data for a while
                    if (new Date().valueOf() - transitionDate.valueOf() > 7 * 24 * 60 * 60 * 1000) {
                        console.log((0, chalk_1.default) `Terminating instance {bold ${instanceId}} {red {bold ${instanceName}}}`);
                        if (!dryRun) {
                            await ec2.send(new client_ec2_1.TerminateInstancesCommand({ InstanceIds: [instanceId] }));
                        }
                    }
                }
            }
        }
    }
}
(0, run_1.run)(main);
