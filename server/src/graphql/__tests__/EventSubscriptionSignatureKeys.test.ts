import assert from "assert";
import gql from "graphql-tag";
import { Knex } from "knex";
import { EventSubscriptionSignatureKey, PetitionEventSubscription, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { ENCRYPTION_SERVICE, IEncryptionService } from "../../services/EncryptionService";
import { toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("GraphQL/EventSubscriptionSignatureKeys", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let user: User;

  let subscription: PetitionEventSubscription;
  let signatureKeys: EventSubscriptionSignatureKey[];

  let encryptionService: IEncryptionService;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);

    encryptionService = testClient.container.get<IEncryptionService>(ENCRYPTION_SERVICE);
    mocks = new Mocks(knex);

    ({ user } = await mocks.createSessionUserAndOrganization());

    [subscription] = await mocks.createEventSubscription({
      name: "my subscription",
      user_id: user.id,
      endpoint: "https://my.website.com/webhook",
      is_enabled: true,
    });

    signatureKeys = await mocks.createEventSubscriptionSignatureKey(
      subscription.id,
      encryptionService,
      2,
    );

    await mocks.createFeatureFlags([{ name: "DEVELOPER_ACCESS", default_value: true }]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("subscriptionSignatureKeys", () => {
    it("fetches user's signature keys", async () => {
      const { errors, data } = await testClient.execute(gql`
        query {
          subscriptions {
            id
            signatureKeys {
              id
              publicKey
            }
          }
        }
      `);

      expect(errors).toBeUndefined();
      expect(data?.subscriptions).toMatchObject([
        {
          id: toGlobalId("PetitionEventSubscription", subscription.id),
          signatureKeys: [
            {
              id: toGlobalId("EventSubscriptionSignatureKey", signatureKeys[0].id),
              publicKey: signatureKeys[0].public_key,
            },
            {
              id: toGlobalId("EventSubscriptionSignatureKey", signatureKeys[1].id),
              publicKey: signatureKeys[1].public_key,
            },
          ],
        },
      ]);
    });

    it("makes sure user keys are valid and decryptable", async () => {
      const keys = await mocks.knex
        .from("event_subscription_signature_key")
        .where({ deleted_at: null, event_subscription_id: subscription.id })
        .select("*");

      expect(keys).toHaveLength(2);

      expect(() => {
        for (const key of keys) {
          const privateKey = encryptionService.decrypt(Buffer.from(key.private_key, "base64"));

          const privateKeyBuffer = Buffer.from(privateKey, "base64");
          assert(privateKeyBuffer instanceof Buffer);

          const publicKeyBuffer = Buffer.from(key.public_key, "base64");
          assert(publicKeyBuffer instanceof Buffer);
        }
      }).not.toThrowError();
    });
  });

  describe("createEventSubscriptionSignatureKey", () => {
    it("creates and returns a new signature key for the user's subscription", async () => {
      const { data: mutationData, errors: mutationErrors } = await testClient.execute(
        gql`
          mutation ($id: GID!) {
            createEventSubscriptionSignatureKey(subscriptionId: $id) {
              id
            }
          }
        `,
        {
          id: toGlobalId("PetitionEventSubscription", subscription.id),
        },
      );
      expect(mutationErrors).toBeUndefined();
      expect(mutationData?.createEventSubscriptionSignatureKey).toBeDefined();

      const keys = await mocks.knex
        .from("event_subscription_signature_key")
        .where("event_subscription_id", subscription.id)
        .whereNull("deleted_at")
        .select("*");
      expect(keys).toHaveLength(3);
    });
  });

  describe("deleteEventSubscriptionSignatureKeys", () => {
    let keyId: number;
    beforeAll(async () => {
      const keys = await mocks.knex
        .from("event_subscription_signature_key")
        .whereNull("deleted_at")
        .where("event_subscription_id", subscription.id)
        .select("*");

      keyId = keys[Math.floor(Math.random() * keys.length)].id;
    });

    it("deletes an user's subscription key", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($ids: [GID!]!) {
            deleteEventSubscriptionSignatureKeys(ids: $ids)
          }
        `,
        {
          ids: [toGlobalId("EventSubscriptionSignatureKey", keyId)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteEventSubscriptionSignatureKeys).toEqual("SUCCESS");
    });
  });
});
