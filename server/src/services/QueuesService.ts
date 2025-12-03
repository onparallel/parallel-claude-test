import { SendMessageBatchCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { createHash } from "crypto";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { isNonNullish } from "remeda";
import { Memoize } from "typescript-memoize";
import { CONFIG, Config } from "../config";
import { TableTypes } from "../db/helpers/BaseRepository";
import { awsLogger } from "../util/awsLogger";
import { pMapChunk } from "../util/promises/pMapChunk";
import { waitFor } from "../util/promises/waitFor";
import { random } from "../util/token";
import { MaybeArray, unMaybeArray } from "../util/types";
import { QueueWorkerPayload } from "../workers/helpers/createQueueWorker";
import { ILogger, LOGGER } from "./Logger";

export interface IQueuesService {
  waitForPendingMessages(maxWaitTime?: number): Promise<void>;
  enqueueMessages<Q extends keyof Config["queueWorkers"]>(
    queue: Q,
    messages:
      | {
          id: string;
          body: QueueWorkerPayload<Q>;
          groupId?: string;
          deduplicationId?: string;
          delaySeconds?: number;
        }[]
      | {
          body: QueueWorkerPayload<Q>;
          groupId?: string;
          deduplicationId?: string;
          delaySeconds?: number;
        },
    t?: Knex.Transaction,
  ): Promise<void>;
  enqueueEvents<TName extends "petition_event" | "system_event" | "profile_event">(
    events: MaybeArray<Pick<TableTypes[TName], "id" | "type" | "created_at">>,
    tableName: TName,
    t?: Knex.Transaction,
  ): Promise<void>;
  enqueueEventsWithLowPriority<TName extends "petition_event" | "system_event" | "profile_event">(
    events: MaybeArray<Pick<TableTypes[TName], "id" | "type" | "created_at">>,
    tableName: TName,
    t?: Knex.Transaction,
  ): Promise<void>;
  enqueueEventsWithDelay<TName extends "petition_event" | "system_event" | "profile_event">(
    events: MaybeArray<Pick<TableTypes[TName], "id" | "type" | "created_at">>,
    tableName: TName,
    delaySeconds: number,
    t?: Knex.Transaction,
  ): Promise<void>;
}

export const QUEUES_SERVICE = Symbol.for("QUEUES_SERVICE");

@injectable()
export class QueuesService implements IQueuesService {
  @Memoize() private get sqs() {
    return new SQSClient({
      ...this.config.aws,
      endpoint: process.env.NODE_ENV === "development" ? "http://localhost:9324" : undefined,
      logger: awsLogger(this.logger),
    });
  }

  private pending: Promise<void>[] = [];

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: ILogger,
  ) {}

  private hash(value: string) {
    return createHash("md5").update(value).digest("hex");
  }

  public async waitForPendingMessages(maxWaitTime?: number) {
    if (isNonNullish(maxWaitTime)) {
      await Promise.race([Promise.all(this.pending), waitFor(maxWaitTime)]);
    } else {
      await Promise.all(this.pending);
    }
  }

  async enqueueMessages<Q extends keyof Config["queueWorkers"]>(
    queue: Q,
    messages:
      | { id: string; body: QueueWorkerPayload<Q>; groupId?: string; delaySeconds?: number }[]
      | { body: QueueWorkerPayload<Q>; groupId?: string; delaySeconds?: number },
    t?: Knex.Transaction,
  ) {
    if (Array.isArray(messages) && messages.length === 0) {
      return;
    }
    if (isNonNullish(t) && t.isCompleted()) {
      const promise = t.executionPromise
        .then(() => this.sendSQSMessage(queue, messages))
        .catch((error) => {
          this.logger.error(error);
        })
        .finally(() => {
          this.pending.splice(this.pending.indexOf(promise), 1);
        });
      this.pending.push(promise);
    } else {
      await this.sendSQSMessage(queue, messages);
    }
  }

  private async sendSQSMessage<Q extends keyof Config["queueWorkers"]>(
    queue: Q,
    messages:
      | {
          id: string;
          body: QueueWorkerPayload<Q>;
          groupId?: string;
          deduplicationId?: string;
          delaySeconds?: number;
        }[]
      | {
          body: QueueWorkerPayload<Q>;
          groupId?: string;
          deduplicationId?: string;
          delaySeconds?: number;
        },
  ) {
    const queueUrl = this.config.queueWorkers[queue].queueUrl;
    if (Array.isArray(messages)) {
      await pMapChunk(
        messages,
        async (batch) => {
          await this.sqs.send(
            new SendMessageBatchCommand({
              QueueUrl: queueUrl,
              Entries: batch.map(({ id, body, groupId, deduplicationId, delaySeconds }) => ({
                Id: this.hash(id),
                MessageBody: JSON.stringify(body),
                MessageGroupId: groupId ? this.hash(groupId) : undefined,
                MessageDeduplicationId: deduplicationId,
                DelaySeconds: delaySeconds,
              })),
            }),
          );
        },
        { chunkSize: 10, concurrency: 100 },
      );
    } else {
      await this.sqs.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(messages.body),
          MessageGroupId: messages.groupId,
          MessageDeduplicationId: messages.deduplicationId,
          DelaySeconds: messages.delaySeconds,
        }),
      );
    }
  }

  async enqueueEvents<TName extends "petition_event" | "system_event" | "profile_event">(
    events: MaybeArray<Pick<TableTypes[TName], "id" | "type" | "created_at">>,
    tableName: TName,
    t?: Knex.Transaction,
  ) {
    const groupId = `event-processor-${random(10)}`;
    const _events = unMaybeArray(events).filter(isNonNullish);
    await this.enqueueMessages(
      "event-processor",
      _events.map((event) => ({
        id: `event-processor-${event.id}`,
        groupId,
        body: {
          id: event.id,
          type: event.type,
          created_at: event.created_at,
          table_name: tableName,
        },
      })),
      t,
    );
  }

  async enqueueEventsWithDelay<TName extends "petition_event" | "system_event" | "profile_event">(
    events: MaybeArray<Pick<TableTypes[TName], "id" | "type" | "created_at">>,
    tableName: TName,
    delaySeconds: number,
    t?: Knex.Transaction,
  ) {
    const groupId = `event-processor-${random(10)}`;
    const _events = unMaybeArray(events).filter(isNonNullish);
    await this.enqueueMessages(
      "delay-queue",
      _events.map((event) => {
        return {
          id: `${tableName}-${event.id}`,
          body: {
            queue: "event-processor" as const,
            body: {
              id: event.id,
              type: event.type,
              created_at: event.created_at,
              table_name: tableName,
            },
            groupId,
          },
          delaySeconds,
        };
      }),
      t,
    );
  }

  async enqueueEventsWithLowPriority<
    TName extends "petition_event" | "system_event" | "profile_event",
  >(
    events: MaybeArray<Pick<TableTypes[TName], "id" | "type" | "created_at">>,
    tableName: TName,
    t?: Knex.Transaction,
  ) {
    const groupId = `event-processor-${random(10)}`;
    const _events = unMaybeArray(events).filter(isNonNullish);
    await this.enqueueMessages(
      "low-priority-event-queue",
      _events.map((event) => ({
        id: `event-processor-${event.id}`,
        groupId,
        body: {
          id: event.id,
          type: event.type,
          created_at: event.created_at,
          table_name: tableName,
        },
      })),
      t,
    );
  }
}
