import gql from "graphql-tag";
import { Knex } from "knex";
import {
  Organization,
  OrgIntegration,
  Petition,
  PetitionSignatureRequest,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/PetitionSignatureRequest", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let readPetition: Petition;
  let user: User;
  let organization: Organization;
  let signature: PetitionSignatureRequest;

  let orgIntegration: OrgIntegration;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [readPetition] = await mocks.createRandomPetitions(
      organization.id,
      user.id,
      1,
      undefined,
      () => ({
        type: "READ",
      }),
    );

    [orgIntegration] = await mocks.createOrgIntegration({
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
    let petition: Petition;

    beforeAll(async () => {
      await mocks.createOrganizationUsageLimit(organization.id, "PETITION_SEND", 100);
    });

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "COMPLETED",
        signature_config: JSON.stringify({
          isEnabled: true,
          orgIntegrationId: orgIntegration.id,
          signersInfo: [{ firstName: "Mike", lastName: "Ross", email: "mike@onparallel.com" }],
          timezone: "Europe/Madrid",
          title: "sign this parallel",
          review: true,
          reviewAfterApproval: false,
          minSigners: 1,
          signingMode: "PARALLEL",
        }),
      }));

      const [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
      }));

      await mocks.knex
        .from("petition")
        .where("id", petition.id)
        .update({
          approval_flow_config: JSON.stringify([
            { name: "Step 1", type: "ANY", values: [{ id: user.id, type: "User" }] },
            {
              name: "Step 2",
              type: "ANY",
              values: [{ id: user.id, type: "User" }],
              visibility: {
                type: "SHOW",
                operator: "AND",
                conditions: [
                  { modifier: "ANY", fieldId: field.id, operator: "EQUAL", value: "HELLO" },
                ],
              },
            },
          ]),
        });

      await mocks.createRandomTextReply(field.id, undefined, 1, () => ({ user_id: user.id }));
    });

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
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to start a signature but an approval step is required to complete before and flow is not yet started", async () => {
      await mocks.knex
        .from("petition")
        .where("id", petition.id)
        .update({
          signature_config: JSON.stringify({
            isEnabled: true,
            orgIntegrationId: orgIntegration.id,
            signersInfo: [{ firstName: "Mike", lastName: "Ross", email: "mike@onparallel.com" }],
            timezone: "Europe/Madrid",
            title: "sign this parallel",
            review: true,
            reviewAfterApproval: true,
            minSigners: 1,
            signingMode: "PARALLEL",
          }),
        });

      const currentApprovalSteps = await mocks.knex
        .from("petition_approval_request_step")
        .where("petition_id", petition.id)
        .whereNull("deprecated_at")
        .select("*");

      expect(currentApprovalSteps).toHaveLength(0);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            startSignatureRequest(petitionId: $petitionId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        },
      );
      expect(errors).toContainGraphQLError("APPROVAL_REQUEST_STEP_NOT_COMPLETED");
      expect(data).toBeNull();
    });

    it("sends error when trying to start a signature but an approval step is required to complete before", async () => {
      await mocks.knex
        .from("petition")
        .where("id", petition.id)
        .update({
          signature_config: JSON.stringify({
            isEnabled: true,
            orgIntegrationId: orgIntegration.id,
            signersInfo: [{ firstName: "Mike", lastName: "Ross", email: "mike@onparallel.com" }],
            timezone: "Europe/Madrid",
            title: "sign this parallel",
            review: true,
            reviewAfterApproval: true,
            minSigners: 1,
            signingMode: "PARALLEL",
          }),
        });

      await mocks.knex.from("petition_approval_request_step").insert([
        {
          petition_id: petition.id,
          approval_type: "ANY",
          status: "PENDING",
          step_name: "Step 1",
          step_number: 0,
        },
        {
          petition_id: petition.id,
          approval_type: "ANY",
          status: "NOT_APPLICABLE",
          step_name: "Step 2",
          step_number: 1,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            startSignatureRequest(petitionId: $petitionId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        },
      );

      await mocks.knex.from("petition_approval_request_step").delete();

      expect(errors).toContainGraphQLError("APPROVAL_REQUEST_STEP_NOT_COMPLETED");
      expect(data).toBeNull;
    });

    it("starts the signature if reviewAfterApproval and approval steps are completed", async () => {
      await mocks.knex
        .from("petition")
        .where("id", petition.id)
        .update({
          signature_config: JSON.stringify({
            isEnabled: true,
            orgIntegrationId: orgIntegration.id,
            signersInfo: [{ firstName: "Mike", lastName: "Ross", email: "mike@onparallel.com" }],
            timezone: "Europe/Madrid",
            title: "sign this parallel",
            review: true,
            reviewAfterApproval: true,
            minSigners: 1,
            signingMode: "PARALLEL",
          }),
        });
      await mocks.knex.from("petition_approval_request_step").insert([
        {
          petition_id: petition.id,
          approval_type: "ANY",
          status: "APPROVED",
          step_name: "Step 1",
          step_number: 0,
        },
        {
          petition_id: petition.id,
          approval_type: "ANY",
          status: "NOT_APPLICABLE",
          step_name: "Step 2",
          step_number: 1,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            startSignatureRequest(petitionId: $petitionId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        },
      );

      await mocks.knex.from("petition_approval_request_step").delete();

      expect(errors).toBeUndefined();
      expect(data?.startSignatureRequest).not.toBeNull();
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
        },
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
        },
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
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
