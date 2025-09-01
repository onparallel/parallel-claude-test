import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { entries, groupBy } from "remeda";
import { Config } from "../../config";
import { IQueuesService, QUEUES_SERVICE } from "../../services/QueuesService";
import { BatchQueueWorker, QueueWorkerPayload } from "../helpers/createQueueWorker";

type OtherQueues = Exclude<keyof Config["queueWorkers"], "delay-queue">;

export type DelayQueuePayload = {
  [Q in OtherQueues]: {
    queue: Q;
    body: QueueWorkerPayload<Q>;
    groupId: string;
  };
}[OtherQueues];

@injectable()
export class DelayQueue extends BatchQueueWorker<DelayQueuePayload> {
  constructor(@inject(QUEUES_SERVICE) private queues: IQueuesService) {
    super();
  }

  override async handleBatch(payload: DelayQueuePayload[]) {
    const byQueue = groupBy(payload, (p) => p.queue);
    await pMap(entries(byQueue), async ([queue, payloads]) => {
      return await this.queues.enqueueMessages(
        queue as OtherQueues,
        payloads.map((p) => ({
          id: randomUUID(),
          body: p.body,
          groupId: p.groupId,
        })),
      );
    });
  }
}
