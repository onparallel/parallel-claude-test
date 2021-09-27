"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const run_1 = require("./utils/run");
const remeda_1 = require("remeda");
const cli_table3_1 = __importDefault(require("cli-table3"));
const chalk_1 = __importDefault(require("chalk"));
aws_sdk_1.default.config.credentials = new aws_sdk_1.default.SharedIniFileCredentials({
    profile: "parallel-deploy",
});
aws_sdk_1.default.config.region = "eu-central-1";
const ec2 = new aws_sdk_1.default.EC2();
const elbv2 = new aws_sdk_1.default.ELBv2();
async function main() {
    const [r1, r2] = await Promise.all([
        ec2
            .describeInstances({
            Filters: [{ Name: "tag-key", Values: ["Release"] }],
        })
            .promise(),
        elbv2
            .describeLoadBalancers({
            Names: ["staging", "production"],
        })
            .promise(),
    ]);
    const lbs = await Promise.all(r2.LoadBalancers.map(async (lb) => {
        var _a;
        const listeners = await elbv2
            .describeListeners({
            LoadBalancerArn: lb.LoadBalancerArn,
        })
            .promise();
        const tgArn = (_a = listeners.Listeners) === null || _a === void 0 ? void 0 : _a.find((l) => l.Protocol === "HTTPS").DefaultActions[0].TargetGroupArn;
        const tgHealth = await elbv2
            .describeTargetHealth({
            TargetGroupArn: tgArn,
        })
            .promise();
        return [lb.LoadBalancerName, tgHealth.TargetHealthDescriptions[0]];
    }));
    const instanceToLb = (0, remeda_1.indexBy)(lbs, ([_, h]) => { var _a; return (_a = h.Target) === null || _a === void 0 ? void 0 : _a.Id; });
    const instances = (r1.Reservations || [])
        .flatMap((r) => { var _a; return (_a = r.Instances) !== null && _a !== void 0 ? _a : []; })
        .filter((i) => { var _a; return (_a = i.Tags) === null || _a === void 0 ? void 0 : _a.some((t) => t.Key === "Release"); });
    const table = new cli_table3_1.default({
        head: [
            "Instance ID",
            "Instance IP",
            "Instance Name",
            "Release",
            "State",
            "Load Balancer",
            "Health",
            "Launch Time",
        ].map((h) => chalk_1.default.blue.bold(h)),
        style: {
            head: [],
        },
    });
    table.push(...instances.map((i) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const state = (() => {
            var _a, _b;
            switch ((_a = i.State) === null || _a === void 0 ? void 0 : _a.Name) {
                case "running":
                    return chalk_1.default.green("✓ running");
                case "stopped":
                    return chalk_1.default.red("⨯ stopped");
                case "terminated":
                    return chalk_1.default.red("⨯ terminated");
                default:
                    return chalk_1.default.yellow((_b = i.State) === null || _b === void 0 ? void 0 : _b.Name);
            }
        })();
        const health = (() => {
            var _a, _b;
            switch ((_b = (_a = instanceToLb[i.InstanceId]) === null || _a === void 0 ? void 0 : _a[1].TargetHealth) === null || _b === void 0 ? void 0 : _b.State) {
                case undefined:
                    return chalk_1.default.yellow("?");
                case "healthy":
                    return chalk_1.default.green("✓");
                default:
                    return chalk_1.default.red("⨯");
            }
        })();
        return [
            i.InstanceId,
            i.PrivateIpAddress,
            (_c = (_b = (_a = i.Tags) === null || _a === void 0 ? void 0 : _a.find((t) => t.Key === "Name")) === null || _b === void 0 ? void 0 : _b.Value) !== null && _c !== void 0 ? _c : chalk_1.default.gray `-`,
            (_f = (_e = (_d = i.Tags) === null || _d === void 0 ? void 0 : _d.find((t) => t.Key === "Release")) === null || _e === void 0 ? void 0 : _e.Value) !== null && _f !== void 0 ? _f : chalk_1.default.gray `-`,
            state,
            (_h = (_g = instanceToLb[i.InstanceId]) === null || _g === void 0 ? void 0 : _g[0]) !== null && _h !== void 0 ? _h : chalk_1.default.red `⨯`,
            health,
            (_j = i.LaunchTime) === null || _j === void 0 ? void 0 : _j.toLocaleString("en-GB"),
        ];
    }));
    console.log(table.toString());
}
(0, run_1.run)(main);
