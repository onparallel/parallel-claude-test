import { verify } from "crypto";
import { Knex } from "knex";
import { fromEntries } from "remeda";
import { createTestContainer } from "../../../test/testContainer";
import { WorkerContext } from "../../context";
import { EventSubscription, Organization, Petition, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { ENCRYPTION_SERVICE, IEncryptionService } from "../../services/EncryptionService";
import { IQueuesService, QUEUES_SERVICE } from "../../services/QueuesService";
import { toGlobalId } from "../../util/globalId";
import { deleteAllData } from "../../util/knexUtils";
import { petitionEventSubscriptionsListener } from "../event-listeners/petition-event-subscriptions-listener";

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

  let queueSpy: jest.SpyInstance<
    ReturnType<IQueuesService["enqueueMessages"]>,
    Parameters<IQueuesService["enqueueMessages"]>
  >;

  let encryptionService: IEncryptionService;

  beforeAll(async () => {
    const container = await createTestContainer();
    ctx = container.get<WorkerContext>(WorkerContext);
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1);
    users = await mocks.createRandomUsers(organization.id, 6);

    queueSpy = jest.spyOn(container.get<IQueuesService>(QUEUES_SERVICE), "enqueueMessages");

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
    // users[5] -> subscribed to PETITION_CREATED but ignores their own events

    await mocks.sharePetitions([petitionFromTemplate.id, petition.id], users[1].id, "READ");
    await mocks.sharePetitions([petitionFromTemplate.id, petition.id], users[2].id, "WRITE");
    await mocks.sharePetitions([petitionFromTemplate.id, petition.id], users[3].id, "WRITE");
    await mocks.sharePetitions([petitionFromTemplate.id, petition.id], users[4].id, "WRITE");
    await mocks.sharePetitions([petitionFromTemplate.id, petition.id], users[5].id, "WRITE");
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
      {
        type: "PETITION",
        user_id: users[5].id,
        event_types: ["PETITION_CREATED"],
        endpoint: "https://users.5.com/events",
        is_enabled: true,
        name: "users.5.webhook",
        ignore_owner_events: true,
      },
    ]);
  });

  afterEach(async () => {
    queueSpy.mockClear();
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

    expect(queueSpy).toHaveBeenCalledTimes(1);
    expect(queueSpy.mock.calls[0]).toEqual([
      "webhooks-worker",
      [0, 1, 2, 4].map((index) => ({
        id: `webhook-${toGlobalId("EventSubscription", subscriptions[index].id)}`,
        body: {
          subscriptionId: subscriptions[index].id,
          endpoint: subscriptions[index].endpoint,
          body: {
            id: toGlobalId("PetitionEvent", event.id),
            petitionId: toGlobalId("Petition", event.petition_id),
            type: "PETITION_CREATED",
            data: {
              userId: toGlobalId("User", users[0].id),
            },
            createdAt: event.created_at,
          },
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
            "X-Parallel-Signature-Timestamp": expect.any(String),
          },
        },
      })),
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

    expect(queueSpy).toHaveBeenCalledTimes(1);
    expect(queueSpy.mock.calls[0]).toEqual([
      "webhooks-worker",
      [
        {
          id: `webhook-${toGlobalId("EventSubscription", subscriptions[0].id)}`,
          body: {
            subscriptionId: subscriptions[0].id,
            endpoint: "https://users.0.com/events",
            body: {
              id: toGlobalId("PetitionEvent", event.id),
              petitionId: toGlobalId("Petition", event.petition_id),
              type: "PETITION_COMPLETED",
              data: {
                userId: toGlobalId("User", users[1].id),
              },
              createdAt: event.created_at,
            },
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
              "X-Parallel-Signature-Timestamp": expect.any(String),
            },
          },
        },
      ],
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

    expect(queueSpy).toHaveBeenCalledTimes(1);
    expect(queueSpy.mock.calls[0]).toEqual([
      "webhooks-worker",
      [
        {
          id: `webhook-${toGlobalId("EventSubscription", subscriptions[0].id)}`,
          body: {
            subscriptionId: subscriptions[0].id,
            endpoint: "https://users.0.com/events",
            body: {
              id: toGlobalId("PetitionEvent", event.id),
              petitionId: toGlobalId("Petition", event.petition_id),
              type: "PETITION_CREATED",
              data: {
                userId: toGlobalId("User", users[1].id),
              },
              createdAt: event.created_at,
            },
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
              "X-Parallel-Signature-Timestamp": expect.any(String),
            },
          },
        },
        {
          id: `webhook-${toGlobalId("EventSubscription", subscriptions[1].id)}`,
          body: {
            subscriptionId: subscriptions[1].id,
            endpoint: "https://users.1.com/events",
            body: {
              id: toGlobalId("PetitionEvent", event.id),
              petitionId: toGlobalId("Petition", event.petition_id),
              type: "PETITION_CREATED",
              data: {
                userId: toGlobalId("User", users[1].id),
              },
              createdAt: event.created_at,
            },
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
                        new Uint8Array(Buffer.from(body)),
                        {
                          key: Buffer.from(keys[i].public_key, "base64"),
                          format: "der",
                          type: "spki",
                        },
                        new Uint8Array(Buffer.from(signature, "base64")),
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
                        new Uint8Array(
                          Buffer.from(
                            "https://users.1.com/events" +
                              headers["X-Parallel-Signature-Timestamp"] +
                              body,
                          ),
                        ),
                        {
                          key: Buffer.from(keys[i].public_key, "base64"),
                          format: "der",
                          type: "spki",
                        },
                        new Uint8Array(Buffer.from(signature, "base64")),
                      ),
                    ),
                  ]),
                ),
              });
              return true;
            }),
          },
        },
        {
          id: `webhook-${toGlobalId("EventSubscription", subscriptions[4].id)}`,
          body: {
            subscriptionId: subscriptions[4].id,
            endpoint: "https://users.5.com/events",
            body: {
              id: toGlobalId("PetitionEvent", event.id),
              petitionId: toGlobalId("Petition", event.petition_id),
              type: "PETITION_CREATED",
              data: {
                userId: toGlobalId("User", users[1].id),
              },
              createdAt: event.created_at,
            },
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
              "X-Parallel-Signature-Timestamp": expect.any(String),
            },
          },
        },
      ],
    ]);
  });

  it("does not send webhook event for user who ignores their own events", async () => {
    const [event] = await mocks.createRandomPetitionEvents(
      users[5].id,
      petitionFromTemplate.id,
      1,
      ["PETITION_CREATED"],
    );
    await petitionEventSubscriptionsListener.handle(
      {
        id: event.id,
        petition_id: event.petition_id,
        type: "PETITION_CREATED",
        data: { user_id: users[5].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
        processed_by: event.processed_by,
      },
      ctx,
    );

    expect(queueSpy).toHaveBeenCalledTimes(1);
    expect(queueSpy.mock.calls[0]).toEqual([
      "webhooks-worker",
      [
        {
          id: `webhook-${toGlobalId("EventSubscription", subscriptions[0].id)}`,
          body: {
            subscriptionId: subscriptions[0].id,
            endpoint: "https://users.0.com/events",
            body: {
              id: toGlobalId("PetitionEvent", event.id),
              petitionId: toGlobalId("Petition", event.petition_id),
              type: "PETITION_CREATED",
              data: {
                userId: toGlobalId("User", users[5].id),
              },
              createdAt: event.created_at,
            },
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
              "X-Parallel-Signature-Timestamp": expect.any(String),
            },
          },
        },
        {
          id: `webhook-${toGlobalId("EventSubscription", subscriptions[1].id)}`,
          body: {
            subscriptionId: subscriptions[1].id,
            endpoint: "https://users.1.com/events",
            body: {
              id: toGlobalId("PetitionEvent", event.id),
              petitionId: toGlobalId("Petition", event.petition_id),
              type: "PETITION_CREATED",
              data: {
                userId: toGlobalId("User", users[5].id),
              },
              createdAt: event.created_at,
            },
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
              "X-Parallel-Signature-Timestamp": expect.any(String),
            },
          },
        },
        {
          id: `webhook-${toGlobalId("EventSubscription", subscriptions[2].id)}`,
          body: {
            subscriptionId: subscriptions[2].id,
            endpoint: "https://users.2.com/events",
            body: {
              id: toGlobalId("PetitionEvent", event.id),
              petitionId: toGlobalId("Petition", event.petition_id),
              type: "PETITION_CREATED",
              data: {
                userId: toGlobalId("User", users[5].id),
              },
              createdAt: event.created_at,
            },
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
              "X-Parallel-Signature-Timestamp": expect.any(String),
            },
          },
        },
      ],
    ]);
  });
});
