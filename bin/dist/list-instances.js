"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const run_1 = require("./utils/run");
aws_sdk_1.default.config.credentials = new aws_sdk_1.default.SharedIniFileCredentials({
    profile: "parallel-deploy",
});
aws_sdk_1.default.config.region = "eu-central-1";
const ec2 = new aws_sdk_1.default.EC2();
const elb = new aws_sdk_1.default.ELB();
async function main() {
    const instances = await ec2
        .describeInstances({
        Filters: [{ Name: "tag-key", Values: ["Release"] }],
    })
        .promise()
        .then((r) => r.Reservations.flatMap((r) => r.Instances));
    const loadBalancers = await elb
        .describeLoadBalancers({
        LoadBalancerNames: ["parallel-staging", "parallel-production"],
    })
        .promise();
    const instancesToLb = {};
    const instancesToLbState = {};
    for (const lb of loadBalancers.LoadBalancerDescriptions) {
        const descriptions = await elb
            .describeInstanceHealth({ LoadBalancerName: lb.LoadBalancerName })
            .promise();
        for (const state of descriptions.InstanceStates) {
            if (state.State === "InService") {
                instancesToLb[state.InstanceId] = lb.LoadBalancerName;
                if (state.Description === "Instance deregistration currently in progress.") {
                    instancesToLbState[state.InstanceId] = "Deregistering";
                }
                else if (state.Description === "N/A") {
                    instancesToLbState[state.InstanceId] = "InService";
                }
            }
            else if (state.State === "OutOfService") {
                if (state.Description === "Instance registration is still in progress.") {
                    instancesToLb[state.InstanceId] = lb.LoadBalancerName;
                    instancesToLbState[state.InstanceId] = "Registering";
                }
            }
            else {
                instancesToLbState[state.InstanceId] = "Unknown";
            }
        }
    }
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
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const state = (() => {
            var _a, _b;
            switch ((_a = i.State) === null || _a === void 0 ? void 0 : _a.Name) {
                case "running":
                    return chalk_1.default.green("✓ Running");
                case "stopped":
                    return chalk_1.default.red("⨯ Stopped");
                case "terminated":
                    return chalk_1.default.red("⨯ Terminated");
                default:
                    return chalk_1.default.yellow((_b = i.State) === null || _b === void 0 ? void 0 : _b.Name);
            }
        })();
        const health = (() => {
            switch (instancesToLbState[i.InstanceId]) {
                case "InService":
                    return chalk_1.default.green("✓ InService");
                case undefined:
                    return chalk_1.default.red("⨯");
                default:
                    return chalk_1.default.yellow(`… ${instancesToLbState[i.InstanceId]}`);
            }
        })();
        return [
            i.InstanceId,
            i.PrivateIpAddress,
            (_c = (_b = (_a = i.Tags) === null || _a === void 0 ? void 0 : _a.find((t) => t.Key === "Name")) === null || _b === void 0 ? void 0 : _b.Value) !== null && _c !== void 0 ? _c : chalk_1.default.gray `-`,
            (_f = (_e = (_d = i.Tags) === null || _d === void 0 ? void 0 : _d.find((t) => t.Key === "Release")) === null || _e === void 0 ? void 0 : _e.Value) !== null && _f !== void 0 ? _f : chalk_1.default.gray `-`,
            state,
            (_g = instancesToLb[i.InstanceId]) !== null && _g !== void 0 ? _g : chalk_1.default.red `⨯`,
            health,
            (_h = i.LaunchTime) === null || _h === void 0 ? void 0 : _h.toLocaleString("en-GB"),
        ];
    }));
    console.log(table.toString());
}
(0, run_1.run)(main);
