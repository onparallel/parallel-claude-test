"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withInstance = withInstance;
const client_ec2_1 = require("@aws-sdk/client-ec2");
const chalk_1 = __importDefault(require("chalk"));
const remeda_1 = require("remeda");
const ts_essentials_1 = require("ts-essentials");
const ssh_1 = require("./ssh");
const wait_1 = require("./wait");
async function withInstance(ec2, runInstanceCommandInput, fn, options = {}) {
    const { terminate = true, keyPath } = options;
    const result = await ec2.send(new client_ec2_1.RunInstancesCommand(runInstanceCommandInput));
    const instance = result.Instances[0];
    const instanceId = instance.InstanceId;
    const ipAddress = instance.PrivateIpAddress;
    (0, ts_essentials_1.assert)((0, remeda_1.isNonNullish)(ipAddress));
    const abortController = new AbortController();
    if (terminate) {
        process.on("SIGINT", function () {
            abortController.abort();
        });
        process.on("SIGTERM", function () {
            abortController.abort();
        });
    }
    console.log((0, chalk_1.default) `Launched instance {bold ${instanceId}} {bold ${ipAddress}}`);
    try {
        await (0, wait_1.waitFor)(5000, { signal: abortController.signal });
        await (0, wait_1.waitForResult)(async () => {
            const result = await ec2.send(new client_ec2_1.DescribeInstancesCommand({ InstanceIds: [instanceId] }));
            const instance = result.Reservations?.[0].Instances?.[0];
            return instance?.State?.Name === client_ec2_1.InstanceStateName.running;
        }, {
            message: chalk_1.default.italic `Instance {yellow pending}. Waiting 5 more seconds...`,
            delay: 5000,
            signal: abortController.signal,
        });
        console.log((0, chalk_1.default) `Instance {green ✓ running}`);
        await (0, wait_1.waitForResult)(async () => {
            try {
                await (0, ssh_1.pingSsh)(ipAddress, { keyPath });
                return true;
            }
            catch {
                return false;
            }
        }, {
            message: chalk_1.default.italic `SSH not available. Waiting 5 more seconds...`,
            delay: 5000,
            signal: abortController.signal,
        });
        await fn({ instanceId, ipAddress }, { signal: abortController.signal });
    }
    finally {
        if (terminate) {
            console.log("Shutting down instance");
            await ec2.send(new client_ec2_1.TerminateInstancesCommand({
                InstanceIds: [instanceId],
            }));
        }
    }
}
