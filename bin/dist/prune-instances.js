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
const elbv2 = new aws_sdk_1.default.ELBv2();
async function main() {
    var _a, _b;
    const { env, "dry-run": dryRun } = yargs_1.default
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
    const [result1, result2] = await Promise.all([
        ec2
            .describeInstances({
            Filters: [
                { Name: "tag-key", Values: ["Release"] },
                { Name: "tag:Environment", Values: [env] },
            ],
        })
            .promise(),
        elbv2
            .describeLoadBalancers({
            Names: [env],
        })
            .promise(),
    ]);
    const result3 = await elbv2
        .describeListeners({
        LoadBalancerArn: result2.LoadBalancers[0].LoadBalancerArn,
    })
        .promise();
    const tgArn = ((_a = result3.Listeners) === null || _a === void 0 ? void 0 : _a.find((l) => l.Protocol === "HTTPS"))
        .DefaultActions[0].TargetGroupArn;
    const result4 = await elbv2
        .describeTargetHealth({
        TargetGroupArn: tgArn,
    })
        .promise();
    const used = result4.TargetHealthDescriptions.map((thd) => thd.Target.Id);
    for (const instance of result1.Reservations.flatMap((r) => r.Instances)) {
        const id = instance.InstanceId;
        if (!used.includes(id)) {
            const name = (_b = instance.Tags.find((t) => t.Key === "Name")) === null || _b === void 0 ? void 0 : _b.Value;
            const state = instance.State.Name;
            if (state === "running") {
                console.log(chalk_1.default `Stopping instance {bold ${id}} {yellow {bold ${name}}}`);
                if (!dryRun) {
                    await ec2.stopInstances({ InstanceIds: [id] }).promise();
                }
            }
            else if (state === "stopped" || state === "stopping") {
                console.log(chalk_1.default `Terminating instance {bold ${id}} {red {bold ${name}}}`);
                if (!dryRun) {
                    await ec2.terminateInstances({ InstanceIds: [id] }).promise();
                }
            }
        }
    }
    const result5 = await elbv2.describeTargetGroups().promise();
    for (const tg of result5.TargetGroups) {
        if (tg.TargetGroupName.endsWith(`-${env}`) &&
            tg.TargetGroupArn !== tgArn) {
            console.log(chalk_1.default `Deleting target group {red {bold ${tg.TargetGroupName}}}`);
            if (!dryRun) {
                await elbv2
                    .deleteTargetGroup({ TargetGroupArn: tg.TargetGroupArn })
                    .promise();
            }
        }
    }
}
run_1.run(main);
