import { verify } from "crypto";
import { Knex } from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { EMAILS, IEmailsService } from "../../services/EmailsService";
import { ENCRYPTION_SERVICE, IEncryptionService } from "../../services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "../../services/FetchService";
import { IQueuesService, QUEUES_SERVICE } from "../../services/QueuesService";
import { toGlobalId } from "../../util/globalId";
import { deleteAllData } from "../../util/knexUtils";
import { WebhooksWorker } from "../queues/WebhooksWorkerQueue";

describe("Webhooks Worker", () => {
  let knex: Knex;
  let mocks: Mocks;

  let user: User;

  let fetchSpy: jest.SpyInstance<
    ReturnType<IFetchService["fetch"]>,
    Parameters<IFetchService["fetch"]>
  >;
  let emailSpy: jest.SpyInstance;
  let queueSpy: jest.SpyInstance<
    ReturnType<IQueuesService["enqueueMessages"]>,
    Parameters<IQueuesService["enqueueMessages"]>
  >;

  let webhooksWorker: WebhooksWorker;

  let encryptionService: IEncryptionService;

  beforeAll(async () => {
    const container = await createTestContainer();
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user } = await mocks.createSessionUserAndOrganization());

    emailSpy = jest.spyOn(container.get<IEmailsService>(EMAILS), "sendDeveloperWebhookFailedEmail");
    fetchSpy = jest.spyOn(container.get<IFetchService>(FETCH_SERVICE), "fetch");
    queueSpy = jest.spyOn(container.get<IQueuesService>(QUEUES_SERVICE), "enqueueMessages");

    webhooksWorker = container.get<WebhooksWorker>(WebhooksWorker);
    encryptionService = container.get<IEncryptionService>(ENCRYPTION_SERVICE);
  });

  afterEach(async () => {
    fetchSpy.mockClear();
    emailSpy.mockClear();
    queueSpy.mockClear();
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  it("reenqueues event when it can not be delivered", async () => {
    fetchSpy.mockImplementation(async (url) => {
      if (url === "https://users.0.com/events") {
        return new Response(null, { status: 418, statusText: "I'm a teapot" });
      } else {
        return new Response(null, { status: 200, statusText: "OK" });
      }
    });

    const [subscription] = await mocks.createEventSubscription({
      endpoint: "https://users.0.com/events",
      event_types: ["PETITION_CREATED"],
      type: "PETITION",
      user_id: user.id,
      is_enabled: true,
      name: "users.0.webhook",
    });

    await webhooksWorker.handler({
      subscriptionId: subscription.id,
      body: {
        id: toGlobalId("PetitionEvent", 1),
        type: "PETITION_CREATED",
        data: {
          userId: toGlobalId("User", user.id),
        },
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(emailSpy).toHaveBeenCalledTimes(0);
    expect(queueSpy).toHaveBeenCalledTimes(1);
    expect(queueSpy).toHaveBeenLastCalledWith("webhooks-worker", [
      {
        id: `webhook-${toGlobalId("EventSubscription", subscription.id)}`,
        body: {
          subscriptionId: subscription.id,
          body: {
            id: toGlobalId("PetitionEvent", 1),
            type: "PETITION_CREATED",
            data: {
              userId: toGlobalId("User", user.id),
            },
          },
          retryCount: 1,
        },
        delaySeconds: 10,
      },
    ]);
  });

  it("sends email and sets subscription as failing when event can not be delivered on the 5th try", async () => {
    fetchSpy.mockImplementation(async (url) => {
      if (url === "https://users.0.com/events") {
        return new Response(null, { status: 418, statusText: "I'm a teapot" });
      } else {
        return new Response(null, { status: 200, statusText: "OK" });
      }
    });

    const [subscription] = await mocks.createEventSubscription({
      endpoint: "https://users.0.com/events",
      event_types: ["PETITION_CREATED"],
      type: "PETITION",
      user_id: user.id,
      is_enabled: true,
      name: "users.0.webhook",
    });

    await webhooksWorker.handler({
      subscriptionId: subscription.id,
      body: {
        id: toGlobalId("PetitionEvent", 1),
        type: "PETITION_CREATED",
        data: {
          userId: toGlobalId("User", user.id),
        },
      },
      retryCount: 5,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(emailSpy).toHaveBeenCalledTimes(1);

    expect(emailSpy).toHaveBeenLastCalledWith(
      subscription.id,
      "Error 418: I'm a teapot for POST https://users.0.com/events",
      {
        id: toGlobalId("PetitionEvent", 1),
        type: "PETITION_CREATED",
        data: {
          userId: toGlobalId("User", user.id),
        },
      },
    );

    const [failingSubscription] = await mocks.knex
      .from("event_subscription")
      .where("id", subscription.id)
      .select("*");

    expect(failingSubscription.is_failing).toEqual(true);
  });

  it("updates 'is_failing' flag to false when event is successfully delivered", async () => {
    const [failingSubscription] = await mocks.createEventSubscription({
      type: "PROFILE",
      user_id: user.id,
      event_types: ["PROFILE_CREATED"],
      endpoint: "https://users.4.com/events",
      is_enabled: true,
      name: "users.4.webhook",
      is_failing: true,
    });

    await webhooksWorker.handler({
      subscriptionId: failingSubscription.id,
      body: {
        id: toGlobalId("ProfileEvent", 1),
        type: "PROFILE_CREATED",
        data: {
          userId: toGlobalId("User", user.id),
        },
      },
    });

    expect(fetchSpy.mock.calls.at(-1)).toMatchObject([
      "https://users.4.com/events",
      expect.anything(),
      expect.anything(),
    ]);

    const [updatedSubscription] = await mocks.knex
      .from("event_subscription")
      .where("id", failingSubscription.id)
      .select("*");

    expect(updatedSubscription.is_failing).toEqual(false);
  });

  it("adds signature on request headers only for subscriptions with configured signature keys", async () => {
    const subscriptions = await mocks.createEventSubscription([
      {
        type: "PETITION",
        user_id: user.id,
        event_types: ["PETITION_CREATED"],
        endpoint: "https://users.0.com/events",
        is_enabled: true,
      },
      {
        type: "PETITION",
        user_id: user.id,
        event_types: ["PETITION_CREATED"],
        endpoint: "https://users.1.com/events",
        is_enabled: true,
      },
    ]);

    const [key] = await mocks.createEventSubscriptionSignatureKey(
      subscriptions[1].id,
      encryptionService,
      1,
    );

    const body = {
      id: toGlobalId("PetitionEvent", 1),
      type: "PETITION_CREATED",
      data: {
        userId: toGlobalId("User", user.id),
      },
    };

    await webhooksWorker.handler({
      subscriptionId: subscriptions[0].id,
      body,
    });

    await webhooksWorker.handler({
      subscriptionId: subscriptions[1].id,
      body,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "https://users.0.com/events",
      expect.objectContaining({
        body: JSON.stringify(body),
        method: "POST",
        headers: expect.toSatisfy((headers: Record<string, string>) => {
          expect(headers).toEqual({
            "Content-Type": "application/json",
            "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
            "X-Parallel-Signature-Timestamp": expect.any(String),
          });

          return true;
        }),
      }),
      { timeout: 15_000 },
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://users.1.com/events",
      expect.objectContaining({
        body: JSON.stringify(body),
        method: "POST",
        headers: expect.toSatisfy((headers: Record<string, string>) => {
          expect(headers).toEqual({
            "Content-Type": "application/json",
            "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
            "X-Parallel-Signature-Timestamp": expect.any(String),
            "X-Parallel-Signature-1": expect.toSatisfy((signature: string) =>
              verify(
                null,
                new Uint8Array(Buffer.from(JSON.stringify(body))),
                {
                  key: Buffer.from(key.public_key, "base64"),
                  format: "der",
                  type: "spki",
                },
                new Uint8Array(Buffer.from(signature, "base64")),
              ),
            ),
            "X-Parallel-Signature-V2-1": expect.toSatisfy((signature: string) =>
              verify(
                null,
                new Uint8Array(
                  Buffer.from(
                    "https://users.1.com/events" +
                      headers["X-Parallel-Signature-Timestamp"] +
                      JSON.stringify(body),
                  ),
                ),
                {
                  key: Buffer.from(key.public_key, "base64"),
                  format: "der",
                  type: "spki",
                },
                new Uint8Array(Buffer.from(signature, "base64")),
              ),
            ),
          });

          return true;
        }),
      }),
      { timeout: 15_000 },
    );
  });
});
