"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_sqs_1 = require("@aws-sdk/client-sqs");
const p_map_1 = __importDefault(require("p-map"));
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const sqs = new client_sqs_1.SQSClient({});
const QUEUE_ARN_PREFIX = "arn:aws:sqs:eu-central-1:749273139513:";
async function main() {
    const { commit: _commit, env } = await yargs_1.default.usage("Usage: $0 --env [env]").option("env", {
        required: true,
        choices: ["staging", "production"],
        description: "The environment for the build",
    }).argv;
    const queueUrls = await sqs.send(new client_sqs_1.ListQueuesCommand()).then((r) => r.QueueUrls);
    await (0, p_map_1.default)(queueUrls.filter((url) => url.endsWith(`-dl-${env}.fifo`) || url.endsWith(`-dl-${env}`)), async (url) => {
        const queueName = url.match(/[^\/]+$/)[0];
        await sqs.send(new client_sqs_1.StartMessageMoveTaskCommand({
            SourceArn: QUEUE_ARN_PREFIX + queueName,
            DestinationArn: QUEUE_ARN_PREFIX + queueName.replace("-dl-", "-"),
        }));
    });
}
(0, run_1.run)(main);
