import { Knex } from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { EMAILS, IEmailsService } from "../../services/EmailsService";
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

  beforeAll(async () => {
    const container = await createTestContainer();
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user } = await mocks.createSessionUserAndOrganization());

    emailSpy = jest.spyOn(container.get<IEmailsService>(EMAILS), "sendDeveloperWebhookFailedEmail");
    fetchSpy = jest.spyOn(container.get<IFetchService>(FETCH_SERVICE), "fetch");
    queueSpy = jest.spyOn(container.get<IQueuesService>(QUEUES_SERVICE), "enqueueMessages");

    webhooksWorker = container.get<WebhooksWorker>(WebhooksWorker);
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
      endpoint: subscription.endpoint,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
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
          endpoint: subscription.endpoint,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
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
      endpoint: subscription.endpoint,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
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
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
      },
      endpoint: failingSubscription.endpoint,
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
});
