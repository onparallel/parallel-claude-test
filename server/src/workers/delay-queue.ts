import { Config } from "../config";
import { createQueueWorker_OLD, QueueWorkerPayload_OLD } from "./helpers/createQueueWorker_OLD";

type OtherQueues = Exclude<keyof Config["queueWorkers"], "delay-queue">;

export type DelayQueuePayload = {
  [Q in OtherQueues]: {
    queue: Q;
    body: QueueWorkerPayload_OLD<Q>;
    groupId: string;
  };
}[OtherQueues];

createQueueWorker_OLD("delay-queue", async ({ queue, body, groupId }, ctx) => {
  await ctx.queues.enqueueMessages(queue, {
    body,
    groupId,
  });
});
