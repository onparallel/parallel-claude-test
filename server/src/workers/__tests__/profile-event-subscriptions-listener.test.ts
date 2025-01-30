import { verify } from "crypto";
import { Knex } from "knex";
import { fromEntries } from "remeda";
import { createTestContainer } from "../../../test/testContainer";
import { WorkerContext } from "../../context";
import {
  EventSubscription,
  Organization,
  Profile,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldPermissionType,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { EMAILS, IEmailsService } from "../../services/EmailsService";
import { ENCRYPTION_SERVICE, IEncryptionService } from "../../services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "../../services/FetchService";
import { toGlobalId } from "../../util/globalId";
import { deleteAllData } from "../../util/knexUtils";
import { unMaybeFunction } from "../../util/types";
import { profileEventSubscriptionsListener } from "../event-listeners/profile-event-subscriptions-listener";

function expectRequestInit(index: number, value: any) {
  return expect.toSatisfy((init: Parameters<IFetchService["fetch"]>[1]) => {
    expect(unMaybeFunction(init, index)).toMatchObject(value);
    return true;
  });
}

describe("Worker - Profile Event Subscriptions Listener", () => {
  let ctx: WorkerContext;
  let knex: Knex;
  let mocks: Mocks;

  let organization: Organization;
  let users: User[];
  let subscriptions: EventSubscription[];

  let fetchSpy: jest.SpyInstance<
    ReturnType<IFetchService["fetch"]>,
    Parameters<IFetchService["fetch"]>
  >;
  let emailSpy: jest.SpyInstance;

  let encryptionService: IEncryptionService;

  let profileTypes: ProfileType[];
  let profileTypeFields: ProfileTypeField[];

  let profiles: Profile[];

  beforeAll(async () => {
    const container = createTestContainer();
    ctx = container.get<WorkerContext>(WorkerContext);
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1);
    users = await mocks.createRandomUsers(organization.id, 6);

    emailSpy = jest.spyOn(container.get<IEmailsService>(EMAILS), "sendDeveloperWebhookFailedEmail");
    fetchSpy = jest.spyOn(container.get<IFetchService>(FETCH_SERVICE), "fetch");

    encryptionService = container.get<IEncryptionService>(ENCRYPTION_SERVICE);
  });

  beforeEach(async () => {
    profileTypes = await mocks.createRandomProfileTypes(organization.id, 2);

    profileTypeFields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[0].id,
      2,
      (i) => ({
        permission: ["READ", "HIDDEN"][i] as ProfileTypeFieldPermissionType,
      }),
    );
    profiles = await mocks.createRandomProfiles(organization.id, 0, 2, (i) => ({
      profile_type_id: profileTypes[i].id,
    }));

    await mocks.knex.from("profile_type_field_permission").insert([
      {
        user_id: users[1].id,
        profile_type_field_id: profileTypeFields[1].id,
        permission: "READ",
      },
      {
        user_id: users[2].id,
        profile_type_field_id: profileTypeFields[1].id,
        permission: "WRITE",
      },
    ]);

    await mocks.knex.from("profile_subscription").insert([
      {
        user_id: users[0].id,
        profile_id: profiles[0].id,
      },
      {
        user_id: users[0].id,
        profile_id: profiles[1].id,
      },
      {
        user_id: users[1].id,
        profile_id: profiles[0].id,
      },
      {
        user_id: users[1].id,
        profile_id: profiles[1].id,
      },
      {
        user_id: users[2].id,
        profile_id: profiles[0].id,
      },
      {
        user_id: users[3].id,
        profile_id: profiles[1].id,
      },
      {
        user_id: users[4].id,
        profile_id: profiles[0].id,
      },
      {
        user_id: users[5].id,
        profile_id: profiles[1].id,
      },
    ]);

    /**
     * users[0] is subscribed to all profiles, has HIDDEN on profileTypeField[1]
     * users[1] is subscribed to all profiles, has READ on profileTypeField[1]
     * users[2] is subscribed to profile[0], has WRITE on profileTypeField[1]
     * users[3] is subscribed to profile[1] PROFILE_CREATED event
     * users[4] is subscribed to 1 field on profile[0]
     * users[5] is subscribed to profile[1], and ignores their own events
     */

    subscriptions = await mocks.createEventSubscription([
      {
        type: "PROFILE",
        user_id: users[0].id,
        event_types: null,
        endpoint: "https://users.0.com/events",
        is_enabled: true,
        name: "users.0.webhook",
      },
      {
        type: "PROFILE",
        user_id: users[0].id,
        event_types: ["PROFILE_FIELD_VALUE_UPDATED"],
        endpoint: "https://users.0.com/hidden-field-events",
        is_enabled: true,
        name: "users.0.hidden-field-webhook",
        from_profile_type_id: profileTypes[0].id,
        from_profile_type_field_ids: [profileTypeFields[1].id],
      },
      {
        type: "PROFILE",
        user_id: users[1].id,
        event_types: ["PROFILE_CREATED"],
        endpoint: "https://users.1.com/events",
        is_enabled: true,
        name: "users.1.webhook",
      },
      {
        type: "PROFILE",
        user_id: users[2].id,
        event_types: null,
        from_profile_type_id: profileTypes[0].id,
        is_enabled: true,
        endpoint: "https://users.2.com/events",
        name: "users.2.webhook",
      },
      {
        type: "PROFILE",
        user_id: users[2].id,
        event_types: null,
        from_profile_type_id: profileTypes[1].id,
        is_enabled: true,
        endpoint: "https://users.2.com/events-unsubscribed-profile",
        name: "users.2.webhook-unsubscribed-profile",
      },
      {
        type: "PROFILE",
        user_id: users[3].id,
        event_types: null,
        endpoint: "https://users.3.com/events",
        is_enabled: true,
        name: "users.3.webhook",
      },
      {
        type: "PROFILE",
        user_id: users[3].id,
        event_types: null,
        endpoint: "https://users.3.com/events-disabled",
        is_enabled: false,
        name: "users.3.webhook-disabled",
      },
      {
        type: "PROFILE",
        user_id: users[4].id,
        event_types: ["PROFILE_FIELD_FILE_ADDED"],
        endpoint: "https://users.4.com/events",
        is_enabled: true,
        name: "users.4.webhook",
        from_profile_type_id: profileTypes[0].id,
        from_profile_type_field_ids: [profileTypeFields[0].id],
      },
      {
        type: "PROFILE",
        user_id: users[5].id,
        event_types: null,
        endpoint: "https://users.5.com/events",
        is_enabled: true,
        name: "users.5.webhook",
        ignore_owner_events: true,
      },
    ]);
  });

  afterEach(async () => {
    fetchSpy.mockClear();
    emailSpy.mockClear();
    ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId.dataloader.clearAll();
    ctx.subscriptions.loadProfileEventSubscriptionsByOrgId.dataloader.clearAll();
    await mocks.knex.from("event_subscription_signature_key").delete();
    await mocks.knex.from("event_subscription").delete();
    await mocks.knex.from("profile_subscription").delete();
    await mocks.knex.from("profile_type_field_permission").delete();
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  it("sends PROFILE_CREATED event to subscribed users", async () => {
    const [event] = await mocks.createRandomProfileEvents(
      organization.id,
      users[0].id,
      profiles[0].id,
      1,
      ["PROFILE_CREATED"],
    );
    await profileEventSubscriptionsListener.handle(
      {
        ...event,
        type: "PROFILE_CREATED",
        data: { user_id: users[0].id },
      },
      ctx,
    );

    const body = JSON.stringify({
      id: toGlobalId("ProfileEvent", event.id),
      profileId: toGlobalId("Profile", event.profile_id),
      type: event.type,
      data: {
        userId: toGlobalId("User", users[0].id),
      },
      createdAt: event.created_at,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(4);
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
    expect(fetchSpy.mock.calls[3]).toMatchObject([
      "https://users.3.com/events",
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

  it("sends PROFILE_FIELD_VALUE_UPDATED event on a field with default HIDDEN permission", async () => {
    const [event] = await mocks.createRandomProfileEvents(
      organization.id,
      users[0].id,
      profiles[0].id,
      1,
      ["PROFILE_FIELD_VALUE_UPDATED"],
    );

    await profileEventSubscriptionsListener.handle(
      {
        ...event,
        type: "PROFILE_FIELD_VALUE_UPDATED",
        data: {
          user_id: users[0].id,
          profile_type_field_id: profileTypeFields[1].id,
          current_profile_field_value_id: null,
          previous_profile_field_value_id: null,
          alias: null,
        },
      },
      ctx,
    );

    const body = JSON.stringify({
      id: toGlobalId("ProfileEvent", event.id),
      profileId: toGlobalId("Profile", event.profile_id),
      type: event.type,
      data: {
        userId: toGlobalId("User", users[0].id),
        profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
        alias: null,
      },
      createdAt: event.created_at,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]).toMatchObject([
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

  it("sends PROFILE_ANONYMIZED event", async () => {
    const [event] = await mocks.createRandomProfileEvents(
      organization.id,
      users[0].id,
      profiles[1].id,
      1,
      ["PROFILE_ANONYMIZED"],
    );

    await profileEventSubscriptionsListener.handle(event, ctx);

    const body = JSON.stringify({
      id: toGlobalId("ProfileEvent", event.id),
      profileId: toGlobalId("Profile", event.profile_id),
      type: event.type,
      data: {},
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
      "https://users.2.com/events-unsubscribed-profile",
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
      "https://users.3.com/events",
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
      "https://users.5.com/events",
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

  it("sends PROFILE_FIELD_FILE_ADDED event", async () => {
    const [event] = await mocks.createRandomProfileEvents(
      organization.id,
      users[4].id,
      profiles[0].id,
      1,
      ["PROFILE_FIELD_FILE_ADDED"],
    );

    await profileEventSubscriptionsListener.handle(
      {
        ...event,
        type: "PROFILE_FIELD_FILE_ADDED",
        data: {
          user_id: users[4].id,
          profile_type_field_id: profileTypeFields[1].id,
          profile_field_file_id: 0,
          alias: null,
        },
      },
      ctx,
    );

    const body = JSON.stringify({
      id: toGlobalId("ProfileEvent", event.id),
      profileId: toGlobalId("Profile", event.profile_id),
      type: event.type,
      data: {
        userId: toGlobalId("User", users[4].id),
        profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
        profileFieldFileId: toGlobalId("ProfileFieldFile", 0),
        alias: null,
      },
      createdAt: event.created_at,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]).toMatchObject([
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

  it("adds signature on request headers only for users with configured signature keys", async () => {
    const subscription = subscriptions.find((s) => s.user_id === users[1].id)!;

    const keys = await mocks.createEventSubscriptionSignatureKey(
      subscription.id,
      encryptionService,
      2,
    );

    const [event] = await mocks.createRandomProfileEvents(
      organization.id,
      users[1].id,
      profiles[0].id,
      1,
      ["PROFILE_CREATED"],
    );

    await profileEventSubscriptionsListener.handle(
      {
        id: event.id,
        org_id: organization.id,
        profile_id: event.profile_id,
        type: "PROFILE_CREATED",
        data: { user_id: users[1].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
        processed_by: event.processed_by,
      },
      ctx,
    );

    const body = JSON.stringify({
      id: toGlobalId("ProfileEvent", event.id),
      profileId: toGlobalId("Profile", event.profile_id),
      type: event.type,
      data: {
        userId: toGlobalId("User", users[1].id),
      },
      createdAt: event.created_at,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(4);
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

    expect(fetchSpy.mock.calls[3]).toMatchObject([
      "https://users.3.com/events",
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

  it("sends email and sets subscription as failing when event can not be delivered", async () => {
    fetchSpy.mockImplementation(async (url) => {
      if (url === "https://users.0.com/events") {
        return new Response(null, { status: 418, statusText: "I'm a teapot" });
      } else {
        return new Response(null, { status: 200, statusText: "OK" });
      }
    });

    const [event] = await mocks.createRandomProfileEvents(
      organization.id,
      users[0].id,
      profiles[0].id,
      1,
      ["PROFILE_CREATED"],
    );
    await profileEventSubscriptionsListener.handle(
      {
        id: event.id,
        org_id: organization.id,
        profile_id: event.profile_id,
        type: "PROFILE_CREATED",
        data: { user_id: users[0].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
        processed_by: event.processed_by,
      },
      ctx,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(emailSpy).toHaveBeenCalledTimes(1);

    const user0Subscription = subscriptions.find((s) => s.user_id === users[0].id)!;
    expect(emailSpy).toHaveBeenLastCalledWith(
      user0Subscription.id,
      "Error 418: I'm a teapot for POST https://users.0.com/events",
      {
        id: toGlobalId("ProfileEvent", event.id),
        profileId: toGlobalId("Profile", event.profile_id),
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

  it("updates 'is_failing' flag to false when event is successfully delivered", async () => {
    const [failingSubscription] = await mocks.createEventSubscription({
      type: "PROFILE",
      user_id: users[4].id,
      event_types: ["PROFILE_CREATED"],
      endpoint: "https://users.4.com/events",
      is_enabled: true,
      name: "users.4.webhook",
      is_failing: true,
    });

    const [event] = await mocks.createRandomProfileEvents(
      organization.id,
      users[0].id,
      profiles[0].id,
      1,
      ["PROFILE_CREATED"],
    );
    await profileEventSubscriptionsListener.handle(
      {
        id: event.id,
        org_id: organization.id,
        profile_id: event.profile_id,
        type: "PROFILE_CREATED",
        data: { user_id: users[0].id },
        created_at: event.created_at,
        processed_at: event.processed_at,
        processed_by: event.processed_by,
      },
      ctx,
    );

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

  it("does not send webhook event for user who ignores their own events", async () => {
    const [event] = await mocks.createRandomProfileEvents(
      organization.id,
      users[5].id,
      profiles[1].id,
      1,
      ["PROFILE_CLOSED"],
      () => ({
        data: { user_id: users[5].id },
      }),
    );

    await profileEventSubscriptionsListener.handle(event, ctx);

    const body = JSON.stringify({
      id: toGlobalId("ProfileEvent", event.id),
      profileId: toGlobalId("Profile", event.profile_id),
      type: event.type,
      data: { userId: toGlobalId("User", users[5].id) },
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
      "https://users.3.com/events",
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
});
