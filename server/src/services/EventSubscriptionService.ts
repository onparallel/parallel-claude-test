import { sign } from "crypto";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { EventSubscription, EventSubscriptionSignatureKey } from "../db/__types";
import { SubscriptionRepository } from "../db/repositories/SubscriptionRepository";
import { ENCRYPTION_SERVICE, IEncryptionService } from "../services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "./FetchService";
import stringify from "fast-safe-stringify";
import { CONFIG, Config } from "../config";
import { EMAILS, IEmailsService } from "./EmailsService";

export const EVENT_SUBSCRIPTION_SERVICE = Symbol.for("EVENT_SUBSCRIPTION_SERVICE");

export interface IEventSubscriptionService {
  processSubscriptions(subscriptions: EventSubscription[], event: any): Promise<void>;
  buildSubscriptionSignatureHeaders(
    keys: EventSubscriptionSignatureKey[],
    body: string,
  ): Record<string, string>;
}

@injectable()
export class EventSubscriptionService implements IEventSubscriptionService {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(SubscriptionRepository) private subscriptions: SubscriptionRepository,
    @inject(ENCRYPTION_SERVICE) private encryption: IEncryptionService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(EMAILS) private emails: IEmailsService,
  ) {}

  async processSubscriptions(subscriptions: EventSubscription[], event: any) {
    const subscriptionKeys = (
      await this.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId(
        subscriptions.map((s) => s.id),
      )
    ).flat();

    await pMap(
      subscriptions,
      async (subscription) => {
        try {
          const body = JSON.stringify(event);
          const keys = subscriptionKeys.filter((k) => k.event_subscription_id === subscription.id);

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
            ...this.buildSubscriptionSignatureHeaders(keys, body),
          };

          const response = await this.fetch.fetch(subscription.endpoint, {
            method: "POST",
            body,
            headers,
            maxRetries: 3,
            timeout: 15_000,
          });
          if (!response.ok) {
            throw new Error(
              `Error ${response.status}: ${response.statusText} for POST ${subscription.endpoint}`,
            );
          }
          if (subscription.is_failing) {
            await this.subscriptions.updateEventSubscription(
              subscription.id,
              { is_failing: false },
              this.config.instanceName,
            );
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : stringify(e);
          if (!subscription.is_failing) {
            await this.emails.sendDeveloperWebhookFailedEmail(subscription.id, errorMessage, event);
          }
          await this.subscriptions.appendErrorLog(
            subscription.id,
            { error: errorMessage, event },
            this.config.instanceName,
          );
        }
      },
      { concurrency: 10 },
    );
  }

  buildSubscriptionSignatureHeaders(keys: EventSubscriptionSignatureKey[], body: string) {
    const headers: HeadersInit = {};
    for (const key of keys) {
      const i = keys.indexOf(key);
      const privateKey = this.encryption.decrypt(Buffer.from(key.private_key, "base64"));
      headers[`X-Parallel-Signature-${i + 1}`] = sign(null, Buffer.from(body), {
        key: Buffer.from(privateKey, "base64"),
        format: "der",
        type: "pkcs8",
      }).toString("base64");
    }

    return headers;
  }
}
