import { SendMessageBatchCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { createHash } from "crypto";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { chunk, isDefined } from "remeda";
import { Memoize } from "typescript-memoize";
import { Config, CONFIG } from "../config";
import { TableTypes } from "../db/helpers/BaseRepository";
import { unMaybeArray } from "../util/arrays";
import { awsLogger } from "../util/awsLogger";
import { MaybeArray } from "../util/types";
import { QueueWorkerPayload } from "../workers/helpers/createQueueWorker";
import { ILogger, LOGGER } from "./logger";

export interface IAws {
  enqueueMessages<Q extends keyof Config["queueWorkers"]>(
    queue: Q,
    messages:
      | { id: string; body: QueueWorkerPayload<Q>; groupId: string; delaySeconds?: number }[]
      | { body: QueueWorkerPayload<Q>; groupId: string; delaySeconds?: number },
    t?: Knex.Transaction
  ): Promise<void>;
  enqueueEvents<TName extends "petition_event" | "system_event">(
    events: MaybeArray<TableTypes[TName]>,
    tableName: TName,
    delaySeconds?: number,
    t?: Knex.Transaction
  ): Promise<void>;
}

export const AWS_SERVICE = Symbol.for("AWS_SERVICE");

@injectable()
export class Aws implements IAws {
  @Memoize() private get sqs() {
    return new SQSClient({
      ...this.config.aws,
      endpoint: process.env.NODE_ENV === "development" ? "http://localhost:9324" : undefined,
      logger: awsLogger(this.logger),
    });
  }

  constructor(@inject(CONFIG) private config: Config, @inject(LOGGER) private logger: ILogger) {}

  private hash(value: string) {
    return createHash("md5").update(value).digest("hex");
  }

  async enqueueMessages<Q extends keyof Config["queueWorkers"]>(
    queue: Q,
    messages:
      | { id: string; body: QueueWorkerPayload<Q>; groupId?: string; delaySeconds?: number }[]
      | { body: QueueWorkerPayload<Q>; groupId?: string; delaySeconds?: number },
    t?: Knex.Transaction
  ) {
    if (isDefined(t)) {
      if (!t.isCompleted()) {
        t.executionPromise
          .then(() => this.sendSQSMessage(queue, messages))
          .catch((error) => {
            this.logger.error(error);
          });
      } else {
        this.sendSQSMessage(queue, messages).catch((error) => {
          this.logger.error(error);
        });
      }
    } else {
      await this.sendSQSMessage(queue, messages);
    }
  }

  private async sendSQSMessage<Q extends keyof Config["queueWorkers"]>(
    queue: Q,
    messages:
      | { id: string; body: QueueWorkerPayload<Q>; groupId?: string; delaySeconds?: number }[]
      | { body: QueueWorkerPayload<Q>; groupId?: string; delaySeconds?: number }
  ) {
    const queueUrl = this.config.queueWorkers[queue].queueUrl;
    if (Array.isArray(messages)) {
      for (const batch of chunk(messages, 10)) {
        await this.sqs.send(
          new SendMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: batch.map(({ id, body, groupId, delaySeconds }) => ({
              Id: this.hash(id),
              MessageBody: JSON.stringify(body),
              MessageGroupId: groupId ? this.hash(groupId) : undefined,
              DelaySeconds: delaySeconds,
            })),
          })
        );
      }
    } else {
      await this.sqs.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(messages.body),
          MessageGroupId: messages.groupId,
          DelaySeconds: messages.delaySeconds,
        })
      );
    }
  }

  async enqueueEvents<TName extends "petition_event" | "system_event">(
    events: MaybeArray<TableTypes[TName]>,
    tableName: TName,
    delaySeconds?: number,
    t?: Knex.Transaction
  ) {
    const _events = unMaybeArray(events).filter(isDefined);
    if (_events.length > 0) {
      if (delaySeconds && delaySeconds > 0) {
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
                groupId: `${tableName}-${event.id}`,
              },
              delaySeconds,
            };
          }),
          t
        );
      } else {
        await this.enqueueMessages(
          "event-processor",
          _events.map((event) => ({
            id: `event-processor-${event.id}`,
            groupId: `event-processor-${event.id}`,
            body: {
              id: event.id,
              type: event.type,
              created_at: event.created_at,
              table_name: tableName,
            },
          })),
          t
        );
      }
    }
  }
}
