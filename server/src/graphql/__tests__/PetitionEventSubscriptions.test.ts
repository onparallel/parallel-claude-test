import gql from "graphql-tag";
import Knex from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  Petition,
  PetitionEventSubscription,
  User,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { userCognitoId } from "../../../test/mocks";
import { initServer, TestClient } from "./server";
import faker from "faker";

describe("GraphQL/Petition Event Subscriptions", () => {
  let testClient: TestClient;
  let organization: Organization;
  let user: User;
  let user2: User;
  let mocks: Mocks;

  let userPetition: Petition;
  let sharedToMe: Petition;
  let privatePetition: Petition;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1, () => ({
      identifier: "parallel",
      status: "DEV",
    }));

    [user] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: userCognitoId,
      first_name: "Harvey",
      last_name: "Specter",
      org_id: organization.id,
    }));

    [user2] = await mocks.createRandomUsers(organization.id, 1);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  beforeEach(async () => {
    [userPetition] = await mocks.createRandomPetitions(
      organization.id,
      user.id,
      1
    );

    [sharedToMe] = await mocks.createRandomPetitions(
      organization.id,
      user2.id,
      1
    );

    [privatePetition] = await mocks.createRandomPetitions(
      organization.id,
      user2.id,
      1
    );

    await mocks.sharePetitions(
      [sharedToMe.id],
      user.id,
      faker.random.arrayElement(["READ", "WRITE"])
    );
  });

  describe("createPetitionSubscription", () => {
    it("creates a subscription on an owned petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation createPetitionSubscription(
            $petitionId: GID!
            $endpoint: String!
          ) {
            createPetitionSubscription(
              petitionId: $petitionId
              endpoint: $endpoint
            ) {
              endpoint
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          endpoint: "https://my.endpoint.com",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetitionSubscription).toEqual({
        endpoint: "https://my.endpoint.com",
        petition: {
          id: toGlobalId("Petition", userPetition.id),
        },
      });
    });

    it("sends error when trying to create a subscription on a petition shared to me with READ/WRITE", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation createPetitionSubscription(
            $petitionId: GID!
            $endpoint: String!
          ) {
            createPetitionSubscription(
              petitionId: $petitionId
              endpoint: $endpoint
            ) {
              endpoint
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", sharedToMe.id),
          endpoint: "https://my.endpoint.com",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to create a subscription on an private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation createPetitionSubscription(
            $petitionId: GID!
            $endpoint: String!
          ) {
            createPetitionSubscription(
              petitionId: $petitionId
              endpoint: $endpoint
            ) {
              endpoint
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          endpoint: "https://my.endpoint.com",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitionSubscription", () => {
    let subscriptions: PetitionEventSubscription[];

    beforeEach(async () => {
      subscriptions = await mocks.createSubscriptions(
        [userPetition.id, sharedToMe.id, privatePetition.id],
        "https://my.endpoint.com"
      );
    });

    it("deletes a subscription", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation deletePetitionSubscription($subscriptionId: GID!) {
            deletePetitionSubscription(subscriptionId: $subscriptionId)
          }
        `,
        variables: {
          subscriptionId: toGlobalId("Subscription", subscriptions[0].id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.deletePetitionSubscription).toEqual("SUCCESS");
    });

    it("sends error when trying to delete a subscription shared to me with READ/WRITE", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation deletePetitionSubscription($subscriptionId: GID!) {
            deletePetitionSubscription(subscriptionId: $subscriptionId)
          }
        `,
        variables: {
          subscriptionId: toGlobalId("Subscription", subscriptions[1].id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to delete a private subscription", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation deletePetitionSubscription($subscriptionId: GID!) {
            deletePetitionSubscription(subscriptionId: $subscriptionId)
          }
        `,
        variables: {
          subscriptionId: toGlobalId("Subscription", subscriptions[2].id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("Query/petitionSubscriptions", () => {
    let s1: PetitionEventSubscription;
    let s2: PetitionEventSubscription;
    let s3: PetitionEventSubscription;
    beforeEach(async () => {
      [s1] = await mocks.createSubscriptions(
        [userPetition.id],
        "https://first.com"
      );
      [s2] = await mocks.createSubscriptions(
        [userPetition.id],
        "https://second.com"
      );
      [s3] = await mocks.createSubscriptions(
        [userPetition.id],
        "https://third.com"
      );
    });

    afterEach(async () => {
      await mocks.clearSubscriptions();
    });

    it("returns a list of the petition subscriptions ordered by creation date", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query petitionSubscriptions($petitionId: GID!) {
            petition(id: $petitionId) {
              ... on Petition {
                subscriptions {
                  id
                  endpoint
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.petition.subscriptions).toEqual([
        {
          id: toGlobalId("Subscription", s3.id),
          endpoint: "https://third.com",
        },
        {
          id: toGlobalId("Subscription", s2.id),
          endpoint: "https://second.com",
        },
        {
          id: toGlobalId("Subscription", s1.id),
          endpoint: "https://first.com",
        },
      ]);
    });

    it("sends error when trying to query subscriptions on a private petition", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query petitionSubscriptions($petitionId: GID!) {
            petition(id: $petitionId) {
              ... on Petition {
                subscriptions {
                  id
                  endpoint
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data!.petition).toBeNull();
    });
  });
});
