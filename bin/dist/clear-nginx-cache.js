"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_elastic_load_balancing_1 = require("@aws-sdk/client-elastic-load-balancing");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const child_process_1 = require("child_process");
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
    const descriptions = await elb.send(new client_elastic_load_balancing_1.DescribeInstanceHealthCommand({
        LoadBalancerName: "parallel-production",
    }));
    for (const state of descriptions.InstanceStates) {
        if (state.State === "InService") {
            const instance = instances.find((i) => i.InstanceId === state.InstanceId);
            (0, child_process_1.execSync)(`ssh \
        -o "UserKnownHostsFile=/dev/null" \
        -o StrictHostKeyChecking=no \
        ${instance === null || instance === void 0 ? void 0 : instance.PrivateIpAddress} sudo rm -r /var/cache/nginx/*`, { encoding: "utf-8", stdio: "inherit" });
        }
    }
}
(0, run_1.run)(main);
