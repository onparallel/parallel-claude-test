"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_elastic_load_balancing_1 = require("@aws-sdk/client-elastic-load-balancing");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const run_1 = require("./utils/run");
const ec2 = new client_ec2_1.EC2Client({ credentials: (0, credential_providers_1.fromIni)({ profile: "parallel-deploy" }) });
const elb = new client_elastic_load_balancing_1.ElasticLoadBalancingClient({
    credentials: (0, credential_providers_1.fromIni)({ profile: "parallel-deploy" }),
});
async function main() {
    const instances = await ec2
        .send(new client_ec2_1.DescribeInstancesCommand({
        Filters: [{ Name: "tag-key", Values: ["Release"] }],
    }))
        .then((r) => r.Reservations.flatMap((r) => r.Instances));
    const loadBalancers = await elb.send(new client_elastic_load_balancing_1.DescribeLoadBalancersCommand({
        LoadBalancerNames: ["parallel-staging", "parallel-production"],
    }));
    const instancesToLb = {};
    const instancesToLbState = {};
    for (const lb of loadBalancers.LoadBalancerDescriptions) {
        const descriptions = await elb.send(new client_elastic_load_balancing_1.DescribeInstanceHealthCommand({
            LoadBalancerName: lb.LoadBalancerName,
        }));
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
