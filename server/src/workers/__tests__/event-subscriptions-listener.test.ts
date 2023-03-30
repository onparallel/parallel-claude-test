import { verify } from "crypto";
import { Knex } from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { WorkerContext } from "../../context";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionEventSubscription, User } from "../../db/__types";
import { EMAILS, IEmailsService } from "../../services/EmailsService";
import { FetchOptions, FETCH_SERVICE, IFetchService } from "../../services/FetchService";
import { IEncryptionService, ENCRYPTION_SERVICE } from "../../services/EncryptionService";
import { toGlobalId } from "../../util/globalId";
import { deleteAllData } from "../../util/knexUtils";
import { eventSubscriptionsListener } from "../event-listeners/event-subscriptions-listener";

describe("Worker - Event Subscriptions Listener", () => {
  let ctx: WorkerContext;
  let knex: Knex;
  let mocks: Mocks;

  let organization: Organization;
  let users: User[];
  let template: Petition;
  let petitionFromTemplate: Petition;
  let petition: Petition;
  let subscriptions: PetitionEventSubscription[];

  let fetchSpy: jest.SpyInstance;
  let emailSpy: jest.SpyInstance;

  let encryptionService: IEncryptionService;

  beforeAll(async () => {
    const container = createTestContainer();
    ctx = container.get<WorkerContext>(WorkerContext);
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1);
    users = await mocks.createRandomUsers(organization.id, 5);
    [template] = await mocks.createRandomTemplates(organization.id, users[0].id, 1);
    [petitionFromTemplate, petition] = await mocks.createRandomPetitions(
      organization.id,
      users[0].id,
      2,
      (i) => ({
        from_template_id: i === 0 ? template.id : null,
      })
    );

    // users[0] -> petition OWNER. subscribed to all events
    // users[1] -> READ. subscribed to any PETITION_CREATED
    // users[2] -> WRITE. subscribed to PETITION_CREATED and PETITION_COMPLETED only on the petitionFromTemplate
    // users[3] -> WRITE. subscribed but not enabled
    // users[4] -> WRITE. not subscribed

    await mocks.sharePetitions([petitionFromTemplate.id, petition.id], users[1].id, "READ");
    await mocks.sharePetitions([petitionFromTemplate.id, petition.id], users[2].id, "WRITE");
    await mocks.sharePetitions([petitionFromTemplate.id, petition.id], users[3].id, "WRITE");
    await mocks.sharePetitions([petitionFromTemplate.id, petition.id], users[4].id, "WRITE");
    subscriptions = await mocks.createEventSubscription([
      {
        user_id: users[0].id,
        event_types: null,
        endpoint: "https://users.0.com/events",
        is_enabled: true,
        name: "users.0.webhook",
      },
      {
        user_id: users[1].id,
        event_types: ["PETITION_CREATED"],
        endpoint: "https://users.1.com/events",
        is_enabled: true,
        name: "users.1.webhook",
      },
      {
        user_id: users[2].id,
        event_types: ["PETITION_CREATED", "PETITION_COMPLETED"],
        endpoint: "https://users.2.com/events",
        is_enabled: true,
        name: "users.2.webhook",
        from_template_id: template.id,
      },
      {
        user_id: users[3].id,
        event_types: null,
        endpoint: "https://users.3.com/events",
        is_enabled: false,
        name: "users.3.webhook",
      },
    ]);

    emailSpy = jest.spyOn(container.get<IEmailsService>(EMAILS), "sendDeveloperWebhookFailedEmail");
    fetchSpy = jest.spyOn(container.get<IFetchService>(FETCH_SERVICE), "fetch");

    encryptionService = container.get<IEncryptionService>(ENCRYPTION_SERVICE);
  });

  afterEach(() => {
    fetchSpy.mockClear();
    emailSpy.mockClear();
    ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId.dataloader.clearAll();
    ctx.subscriptions.loadSubscriptionsByUserId.dataloader.clearAll();
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  it("sends PETITION_CREATED event to subscribed users", async () => {
    const [event] = await mocks.createRandomPetitionEvents(
      users[0].id,
      petitionFromTemplate.id,
      1,
      ["PETITION_CREATED"]
    );
    await eventSubscriptionsListener(
      {
        id: event.id,
        petition_id: event.petition_id,
        type: "PETITION_CREATED",
        data: { user_id: users[0].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
      },
      ctx
    );

    const body = JSON.stringify({
      id: toGlobalId("PetitionEvent", event.id),
      petitionId: toGlobalId("Petition", event.petition_id),
      type: event.type,
      data: {
        userId: toGlobalId("User", users[0].id),
      },
      createdAt: event.created_at,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy).toHaveBeenNthCalledWith<[string, FetchOptions]>(
      1,
      "https://users.0.com/events",
      {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        },
        delay: 5_000,
        maxRetries: 3,
      }
    );
    expect(fetchSpy).toHaveBeenNthCalledWith<[string, FetchOptions]>(
      2,
      "https://users.1.com/events",
      {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        },
        delay: 5_000,
        maxRetries: 3,
      }
    );
    expect(fetchSpy).toHaveBeenNthCalledWith<[string, FetchOptions]>(
      3,
      "https://users.2.com/events",
      {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        },
        delay: 5_000,
        maxRetries: 3,
      }
    );
  });

  it("sends PETITION_COMPLETED event to subscribed users", async () => {
    const [event] = await mocks.createRandomPetitionEvents(users[0].id, petition.id, 1, [
      "PETITION_COMPLETED",
    ]);
    await eventSubscriptionsListener(
      {
        id: event.id,
        petition_id: event.petition_id,
        type: "PETITION_COMPLETED",
        data: { user_id: users[1].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
      },
      ctx
    );

    const body = JSON.stringify({
      id: toGlobalId("PetitionEvent", event.id),
      petitionId: toGlobalId("Petition", event.petition_id),
      type: event.type,
      data: {
        userId: toGlobalId("User", users[1].id),
      },
      createdAt: event.created_at,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenNthCalledWith<[string, FetchOptions]>(
      1,
      "https://users.0.com/events",
      {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        },
        delay: 5_000,
        maxRetries: 3,
      }
    );
  });

  it("adds signature on request headers only for users with configured signature keys", async () => {
    const subscription = subscriptions.find((s) => s.user_id === users[1].id)!;

    const keys = await mocks.createEventSubscriptionSignatureKey(
      subscription.id,
      encryptionService,
      2
    );

    const [event] = await mocks.createRandomPetitionEvents(users[1].id, petition.id, 1, [
      "PETITION_CREATED",
    ]);

    await eventSubscriptionsListener(
      {
        id: event.id,
        petition_id: event.petition_id,
        type: "PETITION_CREATED",
        data: { user_id: users[1].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
      },
      ctx
    );

    const body = JSON.stringify({
      id: toGlobalId("PetitionEvent", event.id),
      petitionId: toGlobalId("Petition", event.petition_id),
      type: event.type,
      data: {
        userId: toGlobalId("User", users[1].id),
      },
      createdAt: event.created_at,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenNthCalledWith<[string, FetchOptions]>(
      1,
      "https://users.0.com/events",
      {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        },
        delay: 5_000,
        maxRetries: 3,
      }
    );

    expect(fetchSpy).toHaveBeenNthCalledWith<[string, FetchOptions]>(
      2,
      "https://users.1.com/events",
      {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
          "X-Parallel-Signature-1": expect.any(String),
          "X-Parallel-Signature-2": expect.any(String),
        },
        delay: 5_000,
        maxRetries: 3,
      }
    );

    const lastCallArgs = fetchSpy.mock.lastCall![1] as FetchOptions;
    ["X-Parallel-Signature-1", "X-Parallel-Signature-2"].forEach((headerKey, index) => {
      expect(
        verify(
          null,
          Buffer.from(body),
          {
            key: Buffer.from(keys[index].public_key, "base64"),
            format: "der",
            type: "spki",
          },
          Buffer.from((lastCallArgs.headers as any)[headerKey], "base64")
        )
      ).toBe(true);
    });
  });

  it("sends email and sets subscription as failing when event can not be delivered", async () => {
    fetchSpy.mockImplementation((url) => {
      if (url === "https://users.0.com/events") {
        return { ok: false, status: 111, statusText: "Mocked error" };
      } else {
        return { ok: true };
      }
    });

    const [event] = await mocks.createRandomPetitionEvents(users[0].id, petition.id, 1, [
      "PETITION_CREATED",
    ]);
    await eventSubscriptionsListener(
      {
        id: event.id,
        petition_id: event.petition_id,
        type: "PETITION_CREATED",
        data: { user_id: users[0].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
      },
      ctx
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(emailSpy).toHaveBeenCalledTimes(1);

    const user0Subscription = subscriptions.find((s) => s.user_id === users[0].id)!;
    expect(emailSpy).toHaveBeenLastCalledWith(
      user0Subscription.id,
      event.petition_id,
      "Error 111: Mocked error for POST https://users.0.com/events",
      {
        id: toGlobalId("PetitionEvent", event.id),
        petitionId: toGlobalId("Petition", event.petition_id),
        type: event.type,
        data: {
          userId: toGlobalId("User", users[0].id),
        },
        createdAt: event.created_at,
      }
    );

    const [failingSubscription] = await mocks.knex
      .from("petition_event_subscription")
      .where("id", user0Subscription.id)
      .select("*");

    expect(failingSubscription.is_failing).toEqual(true);
  });
});
