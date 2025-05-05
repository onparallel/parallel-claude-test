import { sign } from "crypto";
import { inject, injectable } from "inversify";
import { EventSubscription, EventSubscriptionSignatureKey } from "../db/__types";
import { ENCRYPTION_SERVICE, IEncryptionService } from "../services/EncryptionService";
import { toGlobalId } from "../util/globalId";
import { IQueuesService, QUEUES_SERVICE } from "./QueuesService";

export const EVENT_SUBSCRIPTION_SERVICE = Symbol.for("EVENT_SUBSCRIPTION_SERVICE");

export interface IEventSubscriptionService {
  processSubscriptions(subscriptions: EventSubscription[], event: any): Promise<void>;
  buildSubscriptionSignatureHeaders(
    keys: EventSubscriptionSignatureKey[],
    url: string,
    body: string,
  ): Record<string, string>;
}

@injectable()
export class EventSubscriptionService implements IEventSubscriptionService {
  constructor(
    @inject(QUEUES_SERVICE) private queues: IQueuesService,
    @inject(ENCRYPTION_SERVICE) private encryption: IEncryptionService,
  ) {}

  async processSubscriptions(subscriptions: EventSubscription[], event: any) {
    await this.queues.enqueueMessages(
      "webhooks-worker",
      subscriptions.map((subscription) => ({
        id: `webhook-${toGlobalId("EventSubscription", subscription.id)}`,
        body: {
          subscriptionId: subscription.id,
          body: event,
        },
      })),
    );
  }

  buildSubscriptionSignatureHeaders(
    keys: EventSubscriptionSignatureKey[],
    url: string,
    body: string,
  ) {
    const timestamp = Date.now();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
      "X-Parallel-Signature-Timestamp": `${timestamp}`,
    };

    for (const key of keys) {
      const i = keys.indexOf(key);
      const privateKey = this.encryption.decrypt(Buffer.from(key.private_key, "base64"));
      headers[`X-Parallel-Signature-${i + 1}`] = sign(null, new Uint8Array(Buffer.from(body)), {
        key: Buffer.from(privateKey, "base64"),
        format: "der",
        type: "pkcs8",
      }).toString("base64");
      headers[`X-Parallel-Signature-V2-${i + 1}`] = sign(
        null,
        new Uint8Array(Buffer.from(url + timestamp + body)),
        {
          key: Buffer.from(privateKey, "base64"),
          format: "der",
          type: "pkcs8",
        },
      ).toString("base64");
    }

    return headers;
  }
}
