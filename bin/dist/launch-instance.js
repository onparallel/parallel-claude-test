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
const INSTANCE_TYPES = {
    production: "t2.medium",
    staging: "t2.small",
};
const KEY_NAME = "ops";
const IMAGE_ID = "ami-061494ced9842c382";
const SECURITY_GROUP_IDS = ["sg-0486098a6131eb458"];
const IAM_ROLE = "parallel-server";
const VPC_ID = "vpc-5356ab39";
const SUBNET_ID = "subnet-d3cc68b9";
const REGION = "eu-central-1";
const AVAILABILITY_ZONE = `${REGION}a`;
const ENHANCED_MONITORING = true;
const OPS_DIR = "/home/ec2-user/parallel/ops/prod";
const ec2 = new aws_sdk_1.default.EC2();
const elbv2 = new aws_sdk_1.default.ELBv2();
async function main() {
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
    const result = await ec2
        .runInstances({
        ImageId: IMAGE_ID,
        KeyName: KEY_NAME,
        SecurityGroupIds: SECURITY_GROUP_IDS,
        IamInstanceProfile: {
            Name: IAM_ROLE,
        },
        InstanceType: INSTANCE_TYPES[env],
        Placement: {
            AvailabilityZone: AVAILABILITY_ZONE,
            Tenancy: "default",
        },
        SubnetId: SUBNET_ID,
        MaxCount: 1,
        MinCount: 1,
        Monitoring: {
            Enabled: ENHANCED_MONITORING,
        },
        TagSpecifications: [
            {
                ResourceType: "instance",
                Tags: [
                    {
                        Key: "Name",
                        Value: `server-${env}-${commit}`,
                    },
                    {
                        Key: "Release",
                        Value: commit,
                    },
                    {
                        Key: "Environment",
                        Value: env,
                    },
                ],
            },
        ],
    })
        .promise();
    const instanceId = result.Instances[0].InstanceId;
    const ipAddress = result.Instances[0].PrivateIpAddress;
    console.log(chalk_1.default `Launched instance {bold ${instanceId}} on {bold ${ipAddress}}`);
    await wait_1.wait(5000);
    await wait_1.waitFor(async () => {
        var _a, _b, _c;
        const result = await ec2
            .describeInstances({ InstanceIds: [instanceId] })
            .promise();
        return ((_c = (_b = (_a = result.Reservations) === null || _a === void 0 ? void 0 : _a[0].Instances) === null || _b === void 0 ? void 0 : _b[0].State) === null || _c === void 0 ? void 0 : _c.Name) === "running";
    }, chalk_1.default `Instance {yellow pending}. Waiting 10 more seconds...`, 10000);
    console.log(chalk_1.default `Instance {green ✓ running}`);
    const targetGroupName = `${commit}-${env}`;
    let targetGroupArn;
    try {
        const result = await elbv2
            .describeTargetGroups({ Names: [targetGroupName] })
            .promise();
        targetGroupArn = result.TargetGroups[0].TargetGroupArn;
    }
    catch (error) {
        if (error.code === "TargetGroupNotFound") {
            const result = await elbv2
                .createTargetGroup({
                Name: targetGroupName,
                Protocol: "HTTP",
                Port: 80,
                VpcId: VPC_ID,
                HealthCheckPath: "/status",
            })
                .promise();
            targetGroupArn = result.TargetGroups[0].TargetGroupArn;
        }
        else {
            throw error;
        }
    }
    await elbv2
        .registerTargets({
        TargetGroupArn: targetGroupArn,
        Targets: [{ Id: instanceId }],
    })
        .promise();
    await wait_1.waitFor(async () => {
        try {
            child_process_1.execSync(`ssh -o ConnectTimeout=1 -o StrictHostKeyChecking=no ec2-user@${ipAddress} true >/dev/null 2>&1`);
            return true;
        }
        catch {
            return false;
        }
    }, chalk_1.default `SSH not available. Waiting 5 more seconds...`, 5000);
    console.log("Uploading install script to the new instance.");
    child_process_1.execSync(`scp -o StrictHostKeyChecking=no \
      ${OPS_DIR}/{install.sh,workers.sh} ${ipAddress}:/home/ec2-user/`);
    child_process_1.execSync(`ssh ${ipAddress} /home/ec2-user/install.sh ${commit} ${env}`);
}
run_1.run(main);
