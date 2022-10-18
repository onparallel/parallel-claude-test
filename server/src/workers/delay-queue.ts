import { Config } from "../config";
import { createQueueWorker, QueueWorkerPayload } from "./helpers/createQueueWorker";

type OtherQueues = Exclude<keyof Config["queueWorkers"], "delay-queue">;

export type DelayQueuePayload = {
  [Q in OtherQueues]: {
    queue: Q;
    body: QueueWorkerPayload<Q>;
    groupId: string;
  };
}[OtherQueues];

createQueueWorker("delay-queue", async ({ queue, body, groupId }, ctx) => {
  await ctx.queues.enqueueMessages(queue, {
    body,
    groupId,
  });
});
