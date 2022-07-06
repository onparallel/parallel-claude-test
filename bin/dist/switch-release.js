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
const wait_1 = require("./utils/wait");
aws_sdk_1.default.config.credentials = new aws_sdk_1.default.SharedIniFileCredentials({
    profile: "parallel-deploy",
});
aws_sdk_1.default.config.region = "eu-central-1";
const ec2 = new aws_sdk_1.default.EC2();
const elbv2 = new aws_sdk_1.default.ELBv2();
const cloudfront = new aws_sdk_1.default.CloudFront();
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
    const commit = _commit.slice(0, 7);
    const buildId = `parallel-${env}-${commit}`;
    const newInstances = await ec2
        .describeInstances({
        Filters: [
            { Name: "tag:Release", Values: [commit] },
            { Name: "tag:Environment", Values: [env] },
            { Name: "instance-state-name", Values: ["running"] },
        ],
    })
        .promise()
        .then((r) => { var _a, _b; return (_b = (_a = r.Reservations) === null || _a === void 0 ? void 0 : _a.flatMap((r) => { var _a; return (_a = r.Instances) !== null && _a !== void 0 ? _a : []; })) !== null && _b !== void 0 ? _b : []; });
    if (newInstances.length === 0) {
        throw new Error(`No running instances for environment ${env} and release ${commit}.`);
    }
    const targetGroups = await elbv2
        .describeTargetGroups({ Names: [`parallel-${env}-80`, `parallel-${env}-443`] })
        .promise()
        .then((r) => r.TargetGroups);
    const oldInstances = await getTargetGroupInstances(targetGroups[0].TargetGroupArn);
    await Promise.all([80, 443].map(async (port) => {
        const targetGroup = targetGroups.find((tg) => tg.Port === port);
        const instancesIds = newInstances.map((i) => i.InstanceId);
        console.log(`Registering instances ${instancesIds} on TG parallel-${env}-${port}`);
        await elbv2
            .registerTargets({
            TargetGroupArn: targetGroup.TargetGroupArn,
            Targets: instancesIds.map((id) => ({ Id: id })),
        })
            .promise();
    }));
    await (0, wait_1.waitFor)(async () => {
        const [ok1, ok2] = await Promise.all(targetGroups.map(async (tg) => {
            return elbv2
                .describeTargetHealth({ TargetGroupArn: tg.TargetGroupArn })
                .promise()
                .then((r) => newInstances.every((i) => {
                var _a, _b;
                return ((_b = (_a = r.TargetHealthDescriptions.find((d) => { var _a; return ((_a = d.Target) === null || _a === void 0 ? void 0 : _a.Id) === i.InstanceId; })) === null || _a === void 0 ? void 0 : _a.TargetHealth) === null || _b === void 0 ? void 0 : _b.State) === "healthy";
            }));
        }));
        return ok1 && ok2;
    }, `Waiting for new targets to become healthy on TGs`, 5000);
    console.log("Create invalidation for static files");
    const result = await cloudfront.listDistributions().promise();
    // find distribution for
    const distributionId = result.DistributionList.Items.find((d) => d.Origins.Items.some((o) => o.Id === `S3-parallel-static-${env}`)).Id;
    await cloudfront
        .createInvalidation({
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: buildId,
            Paths: {
                Quantity: 1,
                Items: ["/static/*"],
            },
        },
    })
        .promise();
    await Promise.all(oldInstances.map(async (instance) => {
        var _a;
        const ipAddress = instance.PrivateIpAddress;
        const instanceName = (_a = instance.Tags) === null || _a === void 0 ? void 0 : _a.find((t) => t.Key === "Name").Value;
        console.log((0, chalk_1.default) `Stopping workers on ${instance.InstanceId} ${instanceName}`);
        (0, child_process_1.execSync)(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} /home/ec2-user/workers.sh stop`);
        console.log((0, chalk_1.default) `Workers stopped on ${instance.InstanceId} ${instanceName}`);
    }));
    await Promise.all(newInstances.map(async (instance) => {
        var _a;
        const ipAddress = instance.PrivateIpAddress;
        const instanceName = (_a = instance.Tags) === null || _a === void 0 ? void 0 : _a.find((t) => t.Key === "Name").Value;
        console.log((0, chalk_1.default) `Starting workers on ${instance.InstanceId} ${instanceName}`);
        // execSync(`ssh \
        // -o "UserKnownHostsFile=/dev/null" \
        // -o StrictHostKeyChecking=no \
        // ${ipAddress} /home/ec2-user/workers.sh start`);
        console.log((0, chalk_1.default) `Workers started on ${instance.InstanceId} ${instanceName}`);
    }));
    await Promise.all([80, 443].map(async (port) => {
        const targetGroup = targetGroups.find((tg) => tg.Port === port);
        const instancesIds = oldInstances.map((i) => i.InstanceId);
        console.log(`Deregistering instances ${instancesIds} on TG parallel-${env}-${port}`);
        await elbv2
            .deregisterTargets({
            TargetGroupArn: targetGroup.TargetGroupArn,
            Targets: instancesIds.map((id) => ({ Id: id })),
        })
            .promise();
    }));
    await (0, wait_1.waitFor)(async () => {
        const [ok1, ok2] = await Promise.all(targetGroups.map(async (tg) => {
            return elbv2
                .describeTargetHealth({ TargetGroupArn: tg.TargetGroupArn })
                .promise()
                .then((r) => oldInstances.every((i) => !r.TargetHealthDescriptions.find((d) => { var _a; return ((_a = d.Target) === null || _a === void 0 ? void 0 : _a.Id) === i.InstanceId; })));
        }));
        return ok1 && ok2;
    }, `Waiting for new targets to become healthy on TGs`, 5000);
}
(0, run_1.run)(main);
async function getTargetGroupInstances(targetGroupArn) {
    const instanceIds = await elbv2
        .describeTargetHealth({ TargetGroupArn: targetGroupArn })
        .promise()
        .then((r) => r.TargetHealthDescriptions.map((d) => d.Target.Id));
    return await ec2
        .describeInstances({
        InstanceIds: instanceIds,
        Filters: [{ Name: "instance-state-name", Values: ["running"] }],
    })
        .promise()
        .then((r) => { var _a, _b; return (_b = (_a = r.Reservations) === null || _a === void 0 ? void 0 : _a.flatMap((r) => { var _a; return (_a = r.Instances) !== null && _a !== void 0 ? _a : []; })) !== null && _b !== void 0 ? _b : []; });
}
