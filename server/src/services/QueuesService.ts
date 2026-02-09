import { SendMessageBatchCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { createHash } from "crypto";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { RateLimiterQueue } from "rate-limiter-flexible";
import { isNonNullish } from "remeda";
import { Memoize } from "typescript-memoize";
import { CONFIG, Config } from "../config";
import { TableTypes } from "../db/helpers/BaseRepository";
import { awsLogger } from "../util/awsLogger";
import { pMapChunk } from "../util/promises/pMapChunk";
import { waitFor } from "../util/promises/waitFor";
import { retry } from "../util/retry";
import { random } from "../util/token";
import { MaybeArray, unMaybeArray } from "../util/types";
import { QueueWorkerPayload } from "../workers/helpers/createQueueWorker";
import { ILogger, LOGGER } from "./Logger";
import { IRateLimitService, RATE_LIMIT_SERVICE } from "./RateLimitService";

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

const QUEUE_SEND_MESSAGE_RATE_LIMIT = 250; // Rate limit is actually 300 per second, use 250 to be safe

@injectable()
export class QueuesService implements IQueuesService {
  rateLimiter: RateLimiterQueue;
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
    @inject(RATE_LIMIT_SERVICE) private rateLimit: IRateLimitService,
  ) {
    this.rateLimiter = this.rateLimit.getRateLimiter({
      points: QUEUE_SEND_MESSAGE_RATE_LIMIT,
    });
  }

  private hash(value: string) {
    return createHash("md5").update(value).digest("hex");
  }

  public async waitForPendingMessages(maxWaitTime?: number) {
    if (this.pending.length === 0) {
      return;
    }
    const controller = new AbortController();
    try {
      await Promise.race([
        Promise.all(this.pending),
        ...(isNonNullish(maxWaitTime) ? [waitFor(maxWaitTime)] : []),
        retry(
          async () => {
            this.logger.info(`Waiting for pending SQS messages ${this.pending.length}...`);
          },
          { signal: controller.signal, delay: 3000, maxRetries: 100 },
        ),
      ]);
    } finally {
      controller.abort();
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
          await this.rateLimiter.removeTokens(1, queue);
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
      await this.rateLimiter.removeTokens(1, queue);
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
