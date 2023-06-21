"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_elastic_load_balancing_1 = require("@aws-sdk/client-elastic-load-balancing");
const p_map_1 = __importDefault(require("p-map"));
const run_1 = require("./utils/run");
const ssh_1 = require("./utils/ssh");
const ec2 = new client_ec2_1.EC2Client({});
const elb = new client_elastic_load_balancing_1.ElasticLoadBalancingClient({});
async function main() {
    const instances = await ec2
        .send(new client_ec2_1.DescribeInstancesCommand({
        Filters: [{ Name: "tag-key", Values: ["Release"] }],
    }))
        .then((r) => r.Reservations.flatMap((r) => r.Instances));
    const descriptions = await elb.send(new client_elastic_load_balancing_1.DescribeInstanceHealthCommand({
        LoadBalancerName: "parallel-production",
    }));
    await (0, p_map_1.default)(descriptions.InstanceStates.filter((s) => s.State === "InService"), async (state) => {
        const instance = instances.find((i) => i.InstanceId === state.InstanceId);
        await (0, ssh_1.executeRemoteCommand)(instance.PrivateIpAddress, "sudo rm -r /var/cache/nginx/*");
    });
}
(0, run_1.run)(main);
