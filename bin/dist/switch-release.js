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
aws_sdk_1.default.config.credentials = new aws_sdk_1.default.SharedIniFileCredentials({
    profile: "parallel-deploy",
});
aws_sdk_1.default.config.region = "eu-central-1";
const ec2 = new aws_sdk_1.default.EC2();
const elbv2 = new aws_sdk_1.default.ELBv2();
async function main() {
    var _a, _b, _c, _d, _e, _f, _g;
    const { commit: _commit, env } = yargs_1.default
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
    // Shutdown workers in current build
    console.log("Getting current target group.");
    const result1 = await elbv2.describeLoadBalancers({ Names: [env] }).promise();
    const loadBalancerArn = result1.LoadBalancers[0].LoadBalancerArn;
    const result2 = await elbv2
        .describeListeners({
        LoadBalancerArn: loadBalancerArn,
    })
        .promise();
    const oldTargetGroupArn = (_b = (_a = result2.Listeners) === null || _a === void 0 ? void 0 : _a.find((l) => l.Protocol === "HTTPS")) === null || _b === void 0 ? void 0 : _b.DefaultActions[0].TargetGroupArn;
    const result3 = await getTargetGroupInstances(oldTargetGroupArn);
    for (const instance of result3.Reservations.flatMap((r) => r.Instances)) {
        const ipAddress = instance.PrivateIpAddress;
        console.log(chalk_1.default `Stopping workers on ${(_c = instance.Tags) === null || _c === void 0 ? void 0 : _c.find((t) => t.Key === "Name").Value}`);
        child_process_1.execSync(`ssh ${ipAddress} /home/ec2-user/workers.sh stop`);
        console.log(chalk_1.default `Workers stopped on ${(_d = instance.Tags) === null || _d === void 0 ? void 0 : _d.find((t) => t.Key === "Name").Value}`);
    }
    console.log("Getting new target group.");
    const targetGroupName = `${commit}-${env}`;
    const result4 = await elbv2
        .describeTargetGroups({ Names: [targetGroupName] })
        .promise();
    const targetGroupArn = result4.TargetGroups[0].TargetGroupArn;
    const result5 = await elbv2
        .describeListeners({ LoadBalancerArn: loadBalancerArn })
        .promise();
    const listenerArn = (_e = result5.Listeners) === null || _e === void 0 ? void 0 : _e.find((l) => l.Protocol === "HTTPS").ListenerArn;
    console.log(chalk_1.default `Updating LB {blue {bold ${env}}} to point to TG {blue {bold ${targetGroupName}}}`);
    await elbv2
        .modifyListener({
        ListenerArn: listenerArn,
        DefaultActions: [
            {
                Type: "forward",
                TargetGroupArn: targetGroupArn,
            },
        ],
    })
        .promise();
    const result6 = await getTargetGroupInstances(targetGroupArn);
    for (const instance of result6.Reservations.flatMap((r) => r.Instances)) {
        const ipAddress = instance.PrivateIpAddress;
        console.log(chalk_1.default `Starting workers on ${(_f = instance.Tags) === null || _f === void 0 ? void 0 : _f.find((t) => t.Key === "Name").Value}`);
        child_process_1.execSync(`ssh ${ipAddress} /home/ec2-user/workers.sh start`);
        console.log(chalk_1.default `Workers started on ${(_g = instance.Tags) === null || _g === void 0 ? void 0 : _g.find((t) => t.Key === "Name").Value}`);
    }
}
run_1.run(main);
async function getTargetGroupInstances(targetGroupArn) {
    const result1 = await elbv2
        .describeTargetGroups({
        TargetGroupArns: [targetGroupArn],
    })
        .promise();
    const [commit, env] = result1.TargetGroups[0].TargetGroupName.split("-");
    return await ec2
        .describeInstances({
        Filters: [
            { Name: "tag:Release", Values: [commit] },
            { Name: "tag:Environment", Values: [env] },
            { Name: "instance-state-name", Values: ["running"] },
        ],
    })
        .promise();
}
