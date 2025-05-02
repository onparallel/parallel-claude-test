import { inject, injectable } from "inversify";
import { CONFIG, Config } from "../../config";
import { SubscriptionRepository } from "../../db/repositories/SubscriptionRepository";
import { EMAILS, IEmailsService } from "../../services/EmailsService";
import { FETCH_SERVICE, IFetchService } from "../../services/FetchService";
import { IQueuesService, QUEUES_SERVICE } from "../../services/QueuesService";
import { toGlobalId } from "../../util/globalId";
import { withError } from "../../util/promises/withError";
import { QueueWorker } from "../helpers/createQueueWorker";

export type WebhooksWorkerPayload = {
  subscriptionId: number;
  endpoint: string;
  body: any;
  headers: any;
  retryCount?: number;
};

@injectable()
export class WebhooksWorker extends QueueWorker<WebhooksWorkerPayload> {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(QUEUES_SERVICE) private queues: IQueuesService,
    @inject(EMAILS) private emails: IEmailsService,
    @inject(SubscriptionRepository) private subscriptions: SubscriptionRepository,
  ) {
    super();
  }

  override async handler(payload: WebhooksWorkerPayload) {
    const subscription = await this.subscriptions.loadEventSubscription(payload.subscriptionId);
    if (!subscription || !subscription.is_enabled) {
      return;
    }

    const [error, response] = await withError(
      this.fetch.fetch(
        payload.endpoint,
        {
          method: "POST",
          body: JSON.stringify(payload.body),
          headers: payload.headers,
        },
        { timeout: 15_000 },
      ),
    );

    if (!error && response.ok) {
      if (subscription.is_failing) {
        await this.subscriptions.updateEventSubscription(
          payload.subscriptionId,
          { is_failing: false },
          this.config.instanceName,
        );
      }

      return;
    }

    const retryCount = payload.retryCount ?? 0;
    // failed on 5th retry: send email and set as failing
    if (retryCount >= 5) {
      const errorMessage = error
        ? error.message
        : `Error ${response.status}: ${response.statusText} for POST ${payload.endpoint}`;
      if (!subscription.is_failing) {
        await this.emails.sendDeveloperWebhookFailedEmail(
          payload.subscriptionId,
          errorMessage,
          payload.body,
        );
      }
      await this.subscriptions.appendErrorLog(
        payload.subscriptionId,
        { error: errorMessage, event: payload.body },
        this.config.instanceName,
      );

      return;
    }

    // fetch failed: reenqueue with delay and increment retryCount
    await this.queues.enqueueMessages("webhooks-worker", [
      {
        id: `webhook-${toGlobalId("EventSubscription", payload.subscriptionId)}`,
        body: {
          ...payload,
          retryCount: retryCount + 1,
        },
        // exponential backoff: 10, 20, 40, 80, 160
        delaySeconds: 10 * 2 ** retryCount,
      },
    ]);
  }
}
