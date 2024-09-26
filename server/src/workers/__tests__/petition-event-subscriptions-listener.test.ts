import { verify } from "crypto";
import { Knex } from "knex";
import { fromEntries } from "remeda";
import { createTestContainer } from "../../../test/testContainer";
import { WorkerContext } from "../../context";
import { EventSubscription, Organization, Petition, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { EMAILS, IEmailsService } from "../../services/EmailsService";
import { ENCRYPTION_SERVICE, IEncryptionService } from "../../services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "../../services/FetchService";
import { toGlobalId } from "../../util/globalId";
import { deleteAllData } from "../../util/knexUtils";
import { unMaybeFunction } from "../../util/types";
import { petitionEventSubscriptionsListener } from "../event-listeners/petition-event-subscriptions-listener";

function expectRequestInit(index: number, value: any) {
  return expect.toSatisfy((init: Parameters<IFetchService["fetch"]>[1]) => {
    expect(unMaybeFunction(init, index)).toMatchObject(value);
    return true;
  });
}

describe("Worker - Petition Event Subscriptions Listener", () => {
  let ctx: WorkerContext;
  let knex: Knex;
  let mocks: Mocks;

  let organization: Organization;
  let users: User[];
  let template: Petition;
  let petitionFromTemplate: Petition;
  let petition: Petition;
  let subscriptions: EventSubscription[];

  let fetchSpy: jest.SpyInstance<
    ReturnType<IFetchService["fetch"]>,
    Parameters<IFetchService["fetch"]>
  >;
  let emailSpy: jest.SpyInstance;

  let encryptionService: IEncryptionService;

  beforeAll(async () => {
    const container = createTestContainer();
    ctx = container.get<WorkerContext>(WorkerContext);
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1);
    users = await mocks.createRandomUsers(organization.id, 5);

    emailSpy = jest.spyOn(container.get<IEmailsService>(EMAILS), "sendDeveloperWebhookFailedEmail");
    fetchSpy = jest.spyOn(container.get<IFetchService>(FETCH_SERVICE), "fetch");

    encryptionService = container.get<IEncryptionService>(ENCRYPTION_SERVICE);
  });

  beforeEach(async () => {
    [template] = await mocks.createRandomTemplates(organization.id, users[0].id, 1);
    [petitionFromTemplate, petition] = await mocks.createRandomPetitions(
      organization.id,
      users[0].id,
      2,
      (i) => ({
        from_template_id: i === 0 ? template.id : null,
      }),
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
        type: "PETITION",
        user_id: users[0].id,
        event_types: null,
        endpoint: "https://users.0.com/events",
        is_enabled: true,
        name: "users.0.webhook",
      },
      {
        type: "PETITION",
        user_id: users[1].id,
        event_types: ["PETITION_CREATED"],
        endpoint: "https://users.1.com/events",
        is_enabled: true,
        name: "users.1.webhook",
      },
      {
        type: "PETITION",
        user_id: users[2].id,
        event_types: ["PETITION_CREATED", "PETITION_COMPLETED"],
        endpoint: "https://users.2.com/events",
        is_enabled: true,
        name: "users.2.webhook",
        from_template_id: template.id,
      },
      {
        type: "PETITION",
        user_id: users[3].id,
        event_types: null,
        endpoint: "https://users.3.com/events",
        is_enabled: false,
        name: "users.3.webhook",
      },
    ]);
  });

  afterEach(async () => {
    fetchSpy.mockClear();
    emailSpy.mockClear();
    ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId.dataloader.clearAll();
    ctx.subscriptions.loadPetitionEventSubscriptionsByUserId.dataloader.clearAll();
    await mocks.knex.from("event_subscription_signature_key").delete();
    await mocks.knex.from("event_subscription").delete();
    await mocks.knex.from("petition_permission").delete();
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
      ["PETITION_CREATED"],
    );
    await petitionEventSubscriptionsListener.handle(
      {
        id: event.id,
        petition_id: event.petition_id,
        type: "PETITION_CREATED",
        data: { user_id: users[0].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
        processed_by: event.processed_by,
      },
      ctx,
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
    expect(fetchSpy.mock.calls[0]).toMatchObject([
      "https://users.0.com/events",
      expectRequestInit(0, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        },
      }),
      { timeout: 15_000, maxRetries: 3 },
    ]);
    expect(fetchSpy.mock.calls[1]).toMatchObject([
      "https://users.1.com/events",
      expectRequestInit(0, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        },
      }),
      { timeout: 15_000, maxRetries: 3 },
    ]);
    expect(fetchSpy.mock.calls[2]).toMatchObject([
      "https://users.2.com/events",
      expectRequestInit(0, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        },
      }),
      { timeout: 15_000, maxRetries: 3 },
    ]);
  });

  it("sends PETITION_COMPLETED event to subscribed users", async () => {
    const [event] = await mocks.createRandomPetitionEvents(users[0].id, petition.id, 1, [
      "PETITION_COMPLETED",
    ]);
    await petitionEventSubscriptionsListener.handle(
      {
        id: event.id,
        petition_id: event.petition_id,
        type: "PETITION_COMPLETED",
        data: { user_id: users[1].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
        processed_by: event.processed_by,
      },
      ctx,
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
    expect(fetchSpy.mock.calls[0]).toMatchObject([
      "https://users.0.com/events",
      expectRequestInit(0, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        },
      }),
      { timeout: 15_000, maxRetries: 3 },
    ]);
  });

  it("adds signature on request headers only for users with configured signature keys", async () => {
    const subscription = subscriptions.find((s) => s.user_id === users[1].id)!;

    const keys = await mocks.createEventSubscriptionSignatureKey(
      subscription.id,
      encryptionService,
      2,
    );

    const [event] = await mocks.createRandomPetitionEvents(users[1].id, petition.id, 1, [
      "PETITION_CREATED",
    ]);

    await petitionEventSubscriptionsListener.handle(
      {
        id: event.id,
        petition_id: event.petition_id,
        type: "PETITION_CREATED",
        data: { user_id: users[1].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
        processed_by: event.processed_by,
      },
      ctx,
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
    expect(fetchSpy.mock.calls[0]).toMatchObject([
      "https://users.0.com/events",
      expectRequestInit(0, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        },
      }),
      { timeout: 15_000, maxRetries: 3 },
    ]);

    expect(fetchSpy.mock.calls[1]).toMatchObject([
      "https://users.1.com/events",
      expectRequestInit(0, {
        method: "POST",
        body,
        headers: expect.toSatisfy((headers: Record<string, string>) => {
          expect(headers).toMatchObject({
            "Content-Type": "application/json",
            "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
            "X-Parallel-Signature-Timestamp": expect.any(String),
            ...fromEntries(
              [0, 1].map((i) => [
                `X-Parallel-Signature-${i + 1}`,
                expect.toSatisfy((signature: string) =>
                  verify(
                    null,
                    Buffer.from(body),
                    {
                      key: Buffer.from(keys[i].public_key, "base64"),
                      format: "der",
                      type: "spki",
                    },
                    Buffer.from(signature, "base64"),
                  ),
                ),
              ]),
            ),
            ...fromEntries(
              [0, 1].map((i) => [
                `X-Parallel-Signature-V2-${i + 1}`,
                expect.toSatisfy((signature: string) =>
                  verify(
                    null,
                    Buffer.from(
                      "https://users.1.com/events" +
                        headers["X-Parallel-Signature-Timestamp"] +
                        body,
                    ),
                    {
                      key: Buffer.from(keys[i].public_key, "base64"),
                      format: "der",
                      type: "spki",
                    },
                    Buffer.from(signature, "base64"),
                  ),
                ),
              ]),
            ),
          });
          return true;
        }),
      }),
      { timeout: 15_000, maxRetries: 3 },
    ]);
  });

  it("sends email and sets subscription as failing when event can not be delivered", async () => {
    fetchSpy.mockImplementation(async (url) => {
      if (url === "https://users.0.com/events") {
        return new Response(null, { status: 418, statusText: "I'm a teapot" });
      } else {
        return new Response(null, { status: 200, statusText: "OK" });
      }
    });

    const [event] = await mocks.createRandomPetitionEvents(users[0].id, petition.id, 1, [
      "PETITION_CREATED",
    ]);
    await petitionEventSubscriptionsListener.handle(
      {
        id: event.id,
        petition_id: event.petition_id,
        type: "PETITION_CREATED",
        data: { user_id: users[0].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
        processed_by: event.processed_by,
      },
      ctx,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(emailSpy).toHaveBeenCalledTimes(1);

    const user0Subscription = subscriptions.find((s) => s.user_id === users[0].id)!;
    expect(emailSpy).toHaveBeenLastCalledWith(
      user0Subscription.id,
      "Error 418: I'm a teapot for POST https://users.0.com/events",
      {
        id: toGlobalId("PetitionEvent", event.id),
        petitionId: toGlobalId("Petition", event.petition_id),
        type: event.type,
        data: {
          userId: toGlobalId("User", users[0].id),
        },
        createdAt: event.created_at,
      },
    );

    const [failingSubscription] = await mocks.knex
      .from("event_subscription")
      .where("id", user0Subscription.id)
      .select("*");

    expect(failingSubscription.is_failing).toEqual(true);
  });
});
