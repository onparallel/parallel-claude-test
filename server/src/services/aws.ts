import { SendMessageBatchCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { createHash } from "crypto";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { chunk, isDefined } from "remeda";
import { Memoize } from "typescript-memoize";
import { Config, CONFIG } from "../config";
import { PetitionEvent, SystemEvent } from "../db/events";
import { unMaybeArray } from "../util/arrays";
import { awsLogger } from "../util/awsLogger";
import { MaybeArray } from "../util/types";
import { ILogger, LOGGER } from "./logger";

export interface IAws {
  enqueueMessages(
    queue: keyof Config["queueWorkers"],
    messages: { id: string; body: any; groupId: string }[] | { body: any; groupId: string },
    t?: Knex.Transaction
  ): void;
  enqueueEvents(events: MaybeArray<PetitionEvent | SystemEvent>, t?: Knex.Transaction): void;
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

  async enqueueMessages(
    queue: keyof Config["queueWorkers"],
    messages: { id: string; body: any; groupId: string }[] | { body: any; groupId: string },
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

  private async sendSQSMessage(
    queue: keyof Config["queueWorkers"],
    messages: { id: string; body: any; groupId: string }[] | { body: any; groupId: string }
  ) {
    const queueUrl = this.config.queueWorkers[queue].queueUrl;
    if (Array.isArray(messages)) {
      for (const batch of chunk(messages, 10)) {
        await this.sqs.send(
          new SendMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: batch.map(({ id, body, groupId }) => ({
              Id: this.hash(id),
              MessageBody: JSON.stringify(body),
              MessageGroupId: this.hash(groupId),
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
        })
      );
    }
  }

  async enqueueEvents(events: MaybeArray<PetitionEvent | SystemEvent>, t?: Knex.Transaction) {
    const _events = unMaybeArray(events).filter(isDefined);
    if (_events.length > 0) {
      await this.enqueueMessages(
        "event-processor",
        _events.map((event) => ({
          id: `event-processor-${event.id}`,
          groupId: `event-processor-${event.id}`,
          body: event,
        })),
        t
      );
    }
  }
}
