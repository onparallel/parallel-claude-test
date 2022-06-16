import { gql } from "apollo-server-core";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionSignatureRequest, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/PetitionSignatureRequest", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let petition: Petition;
  let readPetition: Petition;
  let user: User;
  let signature: PetitionSignatureRequest;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    let organization: Organization;
    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [petition, readPetition] = await mocks.createRandomPetitions(
      organization.id,
      user.id,
      2,
      undefined,
      (i) => ({
        type: i === 0 ? "OWNER" : "READ",
      })
    );

    await mocks.createOrgIntegration({
      org_id: organization.id,
      provider: "TEST",
      type: "SIGNATURE",
      is_enabled: true,
    });

    [signature] = await mocks.createRandomPetitionSignatureRequest(readPetition.id);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("startSignatureRequest", () => {
    it("sends error when trying to start a signature with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            startSignatureRequest(petitionId: $petitionId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("cancelSignatureRequest", () => {
    it("sends error when trying to cancel a signature with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionSignatureRequestId: GID!) {
            cancelSignatureRequest(petitionSignatureRequestId: $petitionSignatureRequestId) {
              id
            }
          }
        `,
        {
          petitionSignatureRequestId: toGlobalId("PetitionSignatureRequest", signature.id),
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("updateSignatureRequestMetadata", () => {
    it("sends error when trying to update a signature metadata with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionSignatureRequestId: GID!, $metadata: JSONObject!) {
            updateSignatureRequestMetadata(
              petitionSignatureRequestId: $petitionSignatureRequestId
              metadata: $metadata
            ) {
              id
            }
          }
        `,
        {
          petitionSignatureRequestId: toGlobalId("PetitionSignatureRequest", signature.id),
          metadata: { a: "b" },
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("sendSignatureRequestReminders", () => {
    it("sends error when trying to send a signature reminder with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionSignatureRequestId: GID!) {
            sendSignatureRequestReminders(petitionSignatureRequestId: $petitionSignatureRequestId)
          }
        `,
        {
          petitionSignatureRequestId: toGlobalId("PetitionSignatureRequest", signature.id),
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
