import { gql } from "graphql-request";
import { Knex } from "knex";
import {
  Organization,
  Petition,
  PetitionApprovalRequestStep,
  PetitionStatus,
  User,
  UserGroup,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { EMAILS, IEmailsService } from "../../services/EmailsService";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/Petition Approval Request", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let organization: Organization;
  let user: User;
  let otherUsers: User[];

  let adminsGroup: UserGroup;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [adminsGroup] = await mocks.createUserGroups(1, organization.id);
    otherUsers = await mocks.createRandomUsers(organization.id, 3);
    await mocks.insertUserGroupMembers(adminsGroup.id, [...otherUsers.map((u) => u.id), user.id]);

    await mocks.createFeatureFlags([{ name: "PETITION_APPROVAL_FLOW", default_value: true }]);
  });

  afterEach(async () => {
    await mocks.knex.from("petition_approval_request_step_approver").delete();
    await mocks.knex.from("petition_approval_request_step").delete();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("petitions", () => {
    let petitions: Petition[];

    beforeEach(async () => {
      petitions = await mocks.createRandomPetitions(organization.id, user.id, 3, (i) => ({
        path: "/approvals/",
        status: ["DRAFT", "DRAFT", "COMPLETED"][i] as PetitionStatus,
        approval_flow_config:
          i === 1
            ? JSON.stringify([
                { name: "Step 1", type: "ANY", values: [{ type: "User", id: user.id }] },
              ])
            : i === 2
              ? JSON.stringify([
                  { name: "Step 1", type: "ANY", values: [{ type: "User", id: otherUsers[0].id }] },
                ])
              : null,
      }));

      const [approvedStep] = await mocks.knex.from("petition_approval_request_step").insert(
        {
          approval_type: "ANY",
          petition_id: petitions[2].id,
          step_name: "Step 1",
          step_number: 1,
          status: "APPROVED",
        },
        "*",
      );
      await mocks.knex.from("petition_approval_request_step_approver").insert([
        {
          petition_approval_request_step_id: approvedStep.id,
          user_id: otherUsers[0].id,
          approved_at: new Date(),
        },
        {
          petition_approval_request_step_id: approvedStep.id,
          user_id: user.id,
        },
      ]);

      const [step1, pendingStep] = await mocks.knex.from("petition_approval_request_step").insert(
        [
          {
            approval_type: "ANY",
            petition_id: petitions[1].id,
            step_name: "Step 1",
            step_number: 1,
            status: "APPROVED",
          },
          {
            approval_type: "ANY",
            petition_id: petitions[1].id,
            step_name: "Step 2",
            step_number: 2,
            status: "PENDING",
          },
        ],
        "*",
      );
      await mocks.knex.from("petition_approval_request_step_approver").insert([
        {
          petition_approval_request_step_id: step1.id,
          user_id: user.id,
          approved_at: new Date(),
        },
        {
          petition_approval_request_step_id: pendingStep.id,
          user_id: user.id,
        },
      ]);
    });

    it("fetches petitions by multiple approval status", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(offset: 0, limit: 100, filters: $filters) {
              totalCount
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          filters: {
            approvals: {
              operator: "OR",
              filters: [
                { operator: "STATUS", value: "WITHOUT_APPROVAL" },
                { operator: "STATUS", value: "APPROVED" },
              ],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data.petitions).toEqual({
        totalCount: 2,
        items: [
          { id: toGlobalId("Petition", petitions[0].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
        ],
      });
    });

    it("filters by status and approver", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(offset: 0, limit: 100, filters: $filters) {
              totalCount
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          filters: {
            approvals: {
              operator: "AND",
              filters: [
                { operator: "STATUS", value: "APPROVED" },
                // should never return items, as ASSIGNED_TO filter only applies where status="PENDING"
                { operator: "ASSIGNED_TO", value: toGlobalId("User", user.id) },
              ],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data.petitions).toEqual({
        totalCount: 0,
        items: [],
      });
    });

    it("filters by petitions with pending approval steps and assigned to user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(offset: 0, limit: 100, filters: $filters) {
              totalCount
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          filters: {
            approvals: {
              operator: "AND",
              filters: [{ operator: "ASSIGNED_TO", value: toGlobalId("User", user.id) }],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data.petitions).toEqual({
        totalCount: 1,
        items: [{ id: toGlobalId("Petition", petitions[1].id) }],
      });
    });
  });

  describe("cancelPetitionApprovalRequestFlow", () => {
    let steps: PetitionApprovalRequestStep[];
    let petition: Petition;
    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "COMPLETED",
        approval_flow_config: JSON.stringify([
          {
            name: "Step 1",
            type: "ANY",
            values: [{ id: user.id, type: "User" }],
          },
          {
            name: "Step 2",
            type: "ANY",
            values: [],
          },
          {
            name: "Step 3",
            type: "ANY",
            values: [
              { id: user.id, type: "User" },
              { id: otherUsers[0].id, type: "User" },
            ],
          },
          {
            name: "Step 4",
            type: "ANY",
            values: [],
          },
        ]),
      }));

      steps = await mocks.knex.from("petition_approval_request_step").insert(
        [
          {
            step_name: "Step 1",
            approval_type: "ANY",
            status: "APPROVED",
            step_number: 0,
            petition_id: petition.id,
          },
          {
            step_name: "Step 2",
            approval_type: "ANY",
            status: "NOT_APPLICABLE",
            step_number: 1,
            petition_id: petition.id,
          },
          {
            step_name: "Step 3",
            approval_type: "ANY",
            status: "NOT_STARTED",
            step_number: 2,
            petition_id: petition.id,
          },
          {
            step_name: "Step 4",
            approval_type: "ANY",
            status: "NOT_STARTED",
            step_number: 3,
            petition_id: petition.id,
          },
        ],
        "*",
      );

      await mocks.knex.from("petition_approval_request_step_approver").insert([
        {
          user_id: user.id,
          petition_approval_request_step_id: steps[0].id,
          approved_at: new Date(),
        },
        { user_id: user.id, petition_approval_request_step_id: steps[2].id },
        { user_id: otherUsers[0].id, petition_approval_request_step_id: steps[2].id },
      ]);
    });

    it("cancels whole flow, deprecating steps and sending emails to approvers", async () => {
      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionApprovalRequestStepCanceledEmail",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            cancelPetitionApprovalRequestFlow(petitionId: $petitionId) {
              id
              status
              petition {
                events(offset: 0, limit: 100) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
                oldApprovalRequestSteps {
                  id
                  stepName
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        { petitionId: toGlobalId("Petition", petition.id) },
      );

      expect(errors).toBeUndefined();
      expect(data?.cancelPetitionApprovalRequestFlow).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
        status: "CANCELED",
        petition: {
          events: {
            totalCount: 1,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_CANCELED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: expect.any(String),
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: expect.any(String),
              status: "NOT_APPLICABLE",
              approvers: [],
            },
            {
              id: expect.any(String),
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: expect.any(String),
              status: "NOT_STARTED",
              approvers: [],
            },
          ],
          oldApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              stepName: "Step 1",
              status: "CANCELED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: expect.any(Date),
                  canceledAt: expect.any(Date),
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });

      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("sends error if there are not pending steps to cancel", async () => {
      await mocks.knex
        .from("petition_approval_request_step")
        .where("petition_id", petition.id)
        .update({ status: "NOT_APPLICABLE" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            cancelPetitionApprovalRequestFlow(petitionId: $petitionId) {
              id
            }
          }
        `,
        { petitionId: toGlobalId("Petition", petition.id) },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("adds user who canceled as approver if they are not part of the flow", async () => {
      await mocks.knex
        .from("petition_approval_request_step_approver")
        .where("petition_approval_request_step_id", steps[0].id)
        .where("user_id", user.id)
        .delete();

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            cancelPetitionApprovalRequestFlow(petitionId: $petitionId) {
              id
              status
              petition {
                events(offset: 0, limit: 100) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
                oldApprovalRequestSteps {
                  id
                  stepName
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        { petitionId: toGlobalId("Petition", petition.id) },
      );

      expect(errors).toBeUndefined();
      expect(data?.cancelPetitionApprovalRequestFlow).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
        status: "CANCELED",
        petition: {
          events: {
            totalCount: 1,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_CANCELED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: expect.any(String),
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: expect.any(String),
              status: "NOT_APPLICABLE",
              approvers: [],
            },
            {
              id: expect.any(String),
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: expect.any(String),
              status: "NOT_STARTED",
              approvers: [],
            },
          ],
          oldApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              stepName: "Step 1",
              status: "CANCELED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: expect.any(Date),
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });
    });

    it("cancels whole flow even if all steps are approved", async () => {
      await mocks.knex
        .from("petition_approval_request_step")
        .where("petition_id", petition.id)
        .whereNull("deprecated_at")
        .update({ status: "APPROVED" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            cancelPetitionApprovalRequestFlow(petitionId: $petitionId) {
              id
              status
              petition {
                events(offset: 0, limit: 100) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                oldApprovalRequestSteps {
                  id
                  status
                  stepName
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        { petitionId: toGlobalId("Petition", petition.id) },
      );

      expect(errors).toBeUndefined();
      expect(data?.cancelPetitionApprovalRequestFlow).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
        status: "CANCELED",
        petition: {
          events: {
            totalCount: 1,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_CANCELED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
                  userId: toGlobalId("User", user.id),
                },
              },
            ],
          },
          oldApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
              status: "CANCELED",
              stepName: "Step 4",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: expect.any(Date),
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });
    });

    it("moves canceled step to oldApprovalRequestSteps and recreates new approval flow with starting statuses", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            cancelPetitionApprovalRequestFlow(petitionId: $petitionId) {
              id
              status
              petition {
                events(offset: 0, limit: 100) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
                oldApprovalRequestSteps {
                  id
                  status
                  stepName
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        { petitionId: toGlobalId("Petition", petition.id) },
      );

      expect(errors).toBeUndefined();
      expect(data?.cancelPetitionApprovalRequestFlow).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
        status: "CANCELED",
        petition: {
          events: {
            totalCount: 1,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_CANCELED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: expect.any(String),
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: expect.any(String),
              status: "NOT_APPLICABLE",
              approvers: [],
            },
            {
              id: expect.any(String),
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: expect.any(String),
              status: "NOT_STARTED",
              approvers: [],
            },
          ],
          oldApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              status: "CANCELED",
              stepName: "Step 1",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: expect.any(Date),
                  canceledAt: expect.any(Date),
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe("startPetitionApprovalRequestStep", () => {
    let steps: PetitionApprovalRequestStep[];
    let petition: Petition;
    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "COMPLETED",
      }));

      steps = await mocks.knex.from("petition_approval_request_step").insert(
        [
          {
            step_name: "Step 1",
            approval_type: "ANY",
            status: "APPROVED",
            step_number: 0,
            petition_id: petition.id,
          },
          {
            step_name: "Step 2",
            approval_type: "ANY",
            status: "NOT_APPLICABLE",
            step_number: 1,
            petition_id: petition.id,
          },
          {
            step_name: "Step 3",
            approval_type: "ANY",
            status: "NOT_STARTED",
            step_number: 2,
            petition_id: petition.id,
          },
          {
            step_name: "Step 4",
            approval_type: "ANY",
            status: "NOT_STARTED",
            step_number: 3,
            petition_id: petition.id,
          },
        ],
        "*",
      );

      await mocks.knex.from("petition_approval_request_step_approver").insert([
        {
          user_id: user.id,
          petition_approval_request_step_id: steps[0].id,
          approved_at: new Date(),
        },
        { user_id: user.id, petition_approval_request_step_id: steps[2].id },
        { user_id: otherUsers[0].id, petition_approval_request_step_id: steps[2].id },
      ]);
    });

    it("sends error if approval step is not next in line", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String) {
            startPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
          message: "Hi! Please approve this petition",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if there is a signature configured to start before the step", async () => {
      await mocks.knex
        .from("petition_approval_request_step")
        .where("petition_id", petition.id)
        .update({ status: "NOT_STARTED" });

      await mocks.knex
        .from("petition")
        .where("id", petition.id)
        .update({
          signature_config: JSON.stringify({
            isEnabled: true,
            orgIntegrationId: 0,
            signersInfo: [],
            timezone: "Europe/Madrid",
            title: null,
            review: true,
            minSigners: 1,
            signingMode: "PARALLEL",
          }),
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String) {
            startPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          message: "Hi! Please approve this petition",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to start a NOT_APPLICABLE step", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String) {
            startPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
          message: "Hi! Please approve this petition",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("starts the provided step, marking it as PENDING and sending emails to the approvers", async () => {
      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionApprovalRequestStepPendingEmail",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String) {
            startPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
              status
              petition {
                generalComments {
                  id
                  isApproval
                  content
                }
                events(offset: 0, limit: 100) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  stepName
                  status
                  approvers {
                    user {
                      id
                    }
                    sentAt
                    approvedAt
                    canceledAt
                    rejectedAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[2].id),
          message: "Hi! Please approve this petition",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.startPetitionApprovalRequestStep).toEqual({
        id: expect.any(String),
        status: "PENDING",
        petition: {
          generalComments: [
            {
              id: expect.any(String),
              isApproval: true,
              content: [
                {
                  type: "paragraph",
                  children: [
                    {
                      text: "Hi! Please approve this petition",
                    },
                  ],
                },
              ],
            },
          ],
          events: {
            totalCount: 3,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_STARTED",
                data: {
                  userId: toGlobalId("User", user.id),
                  approvalRequestStepId: data.startPetitionApprovalRequestStep.id,
                },
              },
              {
                type: "USER_PERMISSION_ADDED",
                data: {
                  permissionType: "READ",
                  permissionUserId: toGlobalId("User", otherUsers[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "COMMENT_PUBLISHED",
                data: {
                  petitionFieldCommentId:
                    data.startPetitionApprovalRequestStep.petition.generalComments[0].id,
                  petitionFieldId: null,
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              stepName: "Step 1",
              status: "APPROVED",
              approvers: [
                {
                  user: {
                    id: toGlobalId("User", user.id),
                  },
                  sentAt: null,
                  approvedAt: expect.any(Date),
                  canceledAt: null,
                  rejectedAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
              stepName: "Step 2",
              status: "NOT_APPLICABLE",
              approvers: [],
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[2].id),
              stepName: "Step 3",
              status: "PENDING",
              approvers: [
                {
                  user: {
                    id: toGlobalId("User", user.id),
                  },
                  sentAt: expect.any(Date),
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  skippedAt: null,
                },
                {
                  user: {
                    id: toGlobalId("User", otherUsers[0].id),
                  },
                  sentAt: expect.any(Date),
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
              stepName: "Step 4",
              status: "NOT_STARTED",
              approvers: [],
            },
          ],
        },
      });

      expect(emailSpy).toHaveBeenCalledTimes(1);
      expect(emailSpy).toHaveBeenCalledWith(
        steps[2].id,
        fromGlobalId(data.startPetitionApprovalRequestStep.petition.generalComments[0].id).id,
        user.id,
      );
    });
  });

  describe("skipPetitionApprovalRequestStep", () => {
    let steps: PetitionApprovalRequestStep[];
    let petition: Petition;
    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "COMPLETED",
      }));

      steps = await mocks.knex.from("petition_approval_request_step").insert(
        [
          {
            step_name: "Step 1",
            approval_type: "ANY",
            status: "APPROVED",
            step_number: 0,
            petition_id: petition.id,
          },
          {
            step_name: "Step 2",
            approval_type: "ANY",
            status: "NOT_APPLICABLE",
            step_number: 1,
            petition_id: petition.id,
          },
          {
            step_name: "Step 3",
            approval_type: "ANY",
            status: "PENDING",
            step_number: 2,
            petition_id: petition.id,
          },
          {
            step_name: "Step 4",
            approval_type: "ANY",
            status: "NOT_STARTED",
            step_number: 3,
            petition_id: petition.id,
          },
        ],
        "*",
      );

      await mocks.knex.from("petition_approval_request_step_approver").insert([
        {
          user_id: user.id,
          petition_approval_request_step_id: steps[0].id,
          approved_at: new Date(),
        },
        {
          user_id: user.id,
          petition_approval_request_step_id: steps[2].id,
          sent_at: new Date(),
        },
        {
          user_id: otherUsers[1].id,
          petition_approval_request_step_id: steps[3].id,
        },
      ]);
    });

    it("marks the provided step as SKIPPED", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            skipPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
              status
              petition {
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  stepName
                  status
                  approvers {
                    user {
                      id
                    }
                    sentAt
                    approvedAt
                    canceledAt
                    rejectedAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[2].id),
          message: "I will skip this approval step because of reasons...",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.skipPetitionApprovalRequestStep).toEqual({
        id: expect.any(String),
        status: "SKIPPED",
        petition: {
          events: {
            totalCount: 2,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_SKIPPED",
                data: {
                  approvalRequestStepId: data.skipPetitionApprovalRequestStep.id,
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "COMMENT_PUBLISHED",
                data: {
                  petitionFieldCommentId: expect.any(String),
                  petitionFieldId: null,
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: expect.any(String),
              stepName: "Step 1",
              status: "APPROVED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  sentAt: null,
                  approvedAt: expect.any(Date),
                  canceledAt: null,
                  rejectedAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: expect.any(String),
              stepName: "Step 2",
              status: "NOT_APPLICABLE",
              approvers: [],
            },
            {
              id: expect.any(String),
              stepName: "Step 3",
              status: "SKIPPED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  sentAt: expect.any(Date),
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  skippedAt: expect.any(Date),
                },
              ],
            },
            {
              id: expect.any(String),
              stepName: "Step 4",
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  sentAt: null,
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });
    });

    it("finishes the whole approval request flow if skipping the last step", async () => {
      await mocks.knex
        .from("petition_approval_request_step")
        .whereIn("id", [steps[0].id, steps[1].id, steps[2].id])
        .update("status", "APPROVED");

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            skipPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
              status
              petition {
                currentApprovalRequestSteps {
                  id
                  status
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
          message: "I will skip this approval step because of reasons...",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.skipPetitionApprovalRequestStep).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
        status: "SKIPPED",
        petition: {
          currentApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              status: "APPROVED",
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
              status: "APPROVED",
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[2].id),
              status: "APPROVED",
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
              status: "SKIPPED",
            },
          ],
        },
      });
    });

    it("inserts context user as approver who skipped it they are not in approvers list", async () => {
      await mocks.knex
        .from("petition_approval_request_step_approver")
        .where("petition_approval_request_step_id", steps[2].id)
        .update({ user_id: otherUsers[1].id });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            skipPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
              status
              petition {
                currentApprovalRequestSteps {
                  id
                  stepName
                  status
                  approvers {
                    user {
                      id
                    }
                    sentAt
                    approvedAt
                    canceledAt
                    rejectedAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[2].id),
          message: "I will skip this approval step because of reasons...",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.skipPetitionApprovalRequestStep).toEqual({
        id: expect.any(String),
        status: "SKIPPED",
        petition: {
          currentApprovalRequestSteps: [
            {
              id: expect.any(String),
              stepName: "Step 1",
              status: "APPROVED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  sentAt: null,
                  approvedAt: expect.any(Date),
                  canceledAt: null,
                  rejectedAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: expect.any(String),
              stepName: "Step 2",
              status: "NOT_APPLICABLE",
              approvers: [],
            },
            {
              id: expect.any(String),
              stepName: "Step 3",
              status: "SKIPPED",
              approvers: [
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  sentAt: expect.any(Date),
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", user.id) },
                  sentAt: null,
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  skippedAt: expect.any(Date),
                },
              ],
            },
            {
              id: expect.any(String),
              stepName: "Step 4",
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  sentAt: null,
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe("cancelPetitionApprovalRequestStep", () => {
    let steps: PetitionApprovalRequestStep[];
    let petition: Petition;
    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "COMPLETED",
      }));

      steps = await mocks.knex.from("petition_approval_request_step").insert(
        [
          {
            step_name: "Step 1",
            approval_type: "ANY",
            status: "APPROVED",
            step_number: 0,
            petition_id: petition.id,
          },
          {
            step_name: "Step 2",
            approval_type: "ANY",
            status: "NOT_APPLICABLE",
            step_number: 1,
            petition_id: petition.id,
          },
          {
            step_name: "Step 3",
            approval_type: "ANY",
            status: "PENDING",
            step_number: 2,
            petition_id: petition.id,
          },
          {
            step_name: "Step 4",
            approval_type: "ANY",
            status: "NOT_STARTED",
            step_number: 3,
            petition_id: petition.id,
          },
        ],
        "*",
      );

      await mocks.knex.from("petition_approval_request_step_approver").insert([
        {
          user_id: user.id,
          petition_approval_request_step_id: steps[0].id,
          approved_at: new Date(),
        },
        {
          user_id: otherUsers[0].id,
          petition_approval_request_step_id: steps[2].id,
          sent_at: new Date(),
        },
        {
          user_id: otherUsers[1].id,
          petition_approval_request_step_id: steps[3].id,
        },
      ]);
    });

    it("cancels the provided step, marking it as NOT_STARTED", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!) {
            cancelPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
            ) {
              id
              status
              approvers {
                user {
                  id
                }
                approvedAt
                canceledAt
                rejectedAt
                sentAt
                skippedAt
              }
              petition {
                currentApprovalRequestSteps {
                  id
                  stepName
                  status
                }
                oldApprovalRequestSteps {
                  id
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[2].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.cancelPetitionApprovalRequestStep).toEqual({
        id: expect.any(String),
        status: "NOT_STARTED",
        approvers: [
          {
            user: { id: toGlobalId("User", otherUsers[0].id) },
            approvedAt: null,
            canceledAt: null,
            rejectedAt: null,
            sentAt: null,
            skippedAt: null,
          },
        ],
        petition: {
          currentApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              stepName: "Step 1",
              status: "APPROVED",
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
              stepName: "Step 2",
              status: "NOT_APPLICABLE",
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[2].id),
              stepName: "Step 3",
              status: "NOT_STARTED",
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
              stepName: "Step 4",
              status: "NOT_STARTED",
            },
          ],
          oldApprovalRequestSteps: [],
          events: {
            totalCount: 1,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_CANCELED",
                data: {
                  approvalRequestStepId: data.cancelPetitionApprovalRequestStep.id,
                  userId: toGlobalId("User", user.id),
                },
              },
            ],
          },
        },
      });
    });

    it("sends error if the provided step is not in PENDING status", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!) {
            cancelPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
            ) {
              id
              status
              approvers {
                user {
                  id
                }
                approvedAt
                canceledAt
                rejectedAt
                sentAt
                skippedAt
              }
              petition {
                currentApprovalRequestSteps {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("sendPetitionApprovalRequestStepReminder", () => {
    let steps: PetitionApprovalRequestStep[];
    let petition: Petition;
    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "COMPLETED",
      }));

      steps = await mocks.knex.from("petition_approval_request_step").insert(
        [
          {
            step_name: "Step 1",
            approval_type: "ANY",
            status: "APPROVED",
            step_number: 0,
            petition_id: petition.id,
          },
          {
            step_name: "Step 2",
            approval_type: "ANY",
            status: "NOT_APPLICABLE",
            step_number: 1,
            petition_id: petition.id,
          },
          {
            step_name: "Step 3",
            approval_type: "ANY",
            status: "PENDING",
            step_number: 2,
            petition_id: petition.id,
          },
          {
            step_name: "Step 4",
            approval_type: "ANY",
            status: "NOT_STARTED",
            step_number: 3,
            petition_id: petition.id,
          },
        ],
        "*",
      );

      await mocks.knex.from("petition_approval_request_step_approver").insert([
        {
          user_id: user.id,
          petition_approval_request_step_id: steps[0].id,
          approved_at: new Date(),
        },
        {
          user_id: otherUsers[0].id,
          petition_approval_request_step_id: steps[2].id,
          sent_at: new Date(),
        },
        {
          user_id: otherUsers[1].id,
          petition_approval_request_step_id: steps[3].id,
        },
      ]);
    });
    it("sends a reminder email to the approvers of the provided step and creates the petition event", async () => {
      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionApprovalRequestStepReminderEmail",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!) {
            sendPetitionApprovalRequestStepReminder(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
            ) {
              id
              status
              petition {
                events(offset: 0, limit: 100) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[2].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.sendPetitionApprovalRequestStepReminder).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[2].id),
        status: "PENDING",
        petition: {
          events: {
            totalCount: 1,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_REMINDER",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[2].id),
                  userId: toGlobalId("User", user.id),
                },
              },
            ],
          },
        },
      });

      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("sends error if the provided step is not in PENDING status", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!) {
            sendPetitionApprovalRequestStepReminder(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
            ) {
              id
              status
              petition {
                events(offset: 0, limit: 100) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[3].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("approvePetitionApprovalRequestStep", () => {
    let steps: PetitionApprovalRequestStep[];
    let petition: Petition;
    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "COMPLETED",
      }));

      steps = await mocks.knex.from("petition_approval_request_step").insert(
        [
          {
            step_name: "Step 1",
            approval_type: "ANY",
            status: "PENDING",
            step_number: 0,
            petition_id: petition.id,
          },
          {
            step_name: "Step 2",
            approval_type: "ANY",
            status: "NOT_STARTED",
            step_number: 1,
            petition_id: petition.id,
          },
        ],
        "*",
      );

      await mocks.knex.from("petition_approval_request_step_approver").insert([
        {
          user_id: user.id,
          petition_approval_request_step_id: steps[0].id,
        },
        {
          user_id: otherUsers[0].id,
          petition_approval_request_step_id: steps[0].id,
        },
        {
          user_id: otherUsers[1].id,
          petition_approval_request_step_id: steps[0].id,
        },
        {
          user_id: user.id,
          petition_approval_request_step_id: steps[1].id,
        },
        {
          user_id: otherUsers[2].id,
          petition_approval_request_step_id: steps[1].id,
        },
      ]);
    });

    it("approves the provided step if type=ANY, marking it as APPROVED", async () => {
      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionApprovalRequestStepApprovedEmail",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            approvePetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
              status
              petition {
                generalComments {
                  id
                  isApproval
                  approvalMetadata
                  content
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  stepName
                  approvalType
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          message: "I approve this step",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.approvePetitionApprovalRequestStep).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
        status: "APPROVED",
        petition: {
          generalComments: [
            {
              id: expect.any(String),
              isApproval: true,
              approvalMetadata: {
                stepName: "Step 1",
                status: "APPROVED",
              },
              content: [
                {
                  type: "paragraph",
                  children: [{ text: "I approve this step" }],
                },
              ],
            },
          ],
          events: {
            totalCount: 3,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_FINISHED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_APPROVED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "COMMENT_PUBLISHED",
                data: {
                  petitionFieldCommentId:
                    data.approvePetitionApprovalRequestStep.petition.generalComments[0].id,
                  petitionFieldId: null,
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              stepName: "Step 1",
              approvalType: "ANY",
              status: "APPROVED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: expect.any(Date),
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
              stepName: "Step 2",
              approvalType: "ANY",
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[2].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });

      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("does not approves the step if type=ALL and not everyone approved", async () => {
      await mocks.knex
        .from("petition_approval_request_step")
        .where("id", steps[0].id)
        .update("approval_type", "ALL");

      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionApprovalRequestStepApprovedEmail",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            approvePetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
              status
              petition {
                generalComments {
                  id
                  isApproval
                  approvalMetadata
                  content
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  stepName
                  approvalType
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          message: "I approve this step",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.approvePetitionApprovalRequestStep).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
        status: "PENDING",
        petition: {
          generalComments: [
            {
              id: expect.any(String),
              isApproval: true,
              approvalMetadata: {
                stepName: "Step 1",
                status: "APPROVED",
              },
              content: [
                {
                  type: "paragraph",
                  children: [{ text: "I approve this step" }],
                },
              ],
            },
          ],
          events: {
            totalCount: 2,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_APPROVED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "COMMENT_PUBLISHED",
                data: {
                  petitionFieldCommentId:
                    data.approvePetitionApprovalRequestStep.petition.generalComments[0].id,
                  petitionFieldId: null,
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              stepName: "Step 1",
              approvalType: "ALL",
              status: "PENDING",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: expect.any(Date),
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
              stepName: "Step 2",
              approvalType: "ANY",
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[2].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });

      expect(emailSpy).toHaveBeenCalledTimes(0);
    });

    it("approves the step if type=ALL and everyone approved", async () => {
      await mocks.knex
        .from("petition_approval_request_step")
        .where("id", steps[0].id)
        .update("approval_type", "ALL");

      await mocks.knex
        .from("petition_approval_request_step_approver")
        .where("petition_approval_request_step_id", steps[0].id)
        .whereNot("user_id", user.id)
        .update({ approved_at: new Date() });

      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionApprovalRequestStepApprovedEmail",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            approvePetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
              status
              petition {
                generalComments {
                  id
                  isApproval
                  approvalMetadata
                  content
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  stepName
                  approvalType
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          message: "I approve this step",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.approvePetitionApprovalRequestStep).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
        status: "APPROVED",
        petition: {
          generalComments: [
            {
              id: expect.any(String),
              isApproval: true,
              approvalMetadata: {
                stepName: "Step 1",
                status: "APPROVED",
              },
              content: [
                {
                  type: "paragraph",
                  children: [{ text: "I approve this step" }],
                },
              ],
            },
          ],
          events: {
            totalCount: 3,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_FINISHED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_APPROVED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "COMMENT_PUBLISHED",
                data: {
                  petitionFieldCommentId:
                    data.approvePetitionApprovalRequestStep.petition.generalComments[0].id,
                  petitionFieldId: null,
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              stepName: "Step 1",
              approvalType: "ALL",
              status: "APPROVED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: expect.any(Date),
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: expect.any(Date),
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  approvedAt: expect.any(Date),
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
              stepName: "Step 2",
              approvalType: "ANY",
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[2].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });

      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("finishes the whole process if approving the last step", async () => {
      await mocks.knex
        .from("petition_approval_request_step")
        .where("id", steps[0].id)
        .update("status", "APPROVED");
      await mocks.knex
        .from("petition_approval_request_step")
        .where("id", steps[1].id)
        .update("status", "PENDING");

      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionApprovalRequestStepApprovedEmail",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            approvePetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
              status
              petition {
                generalComments {
                  id
                  isApproval
                  approvalMetadata
                  content
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  stepName
                  approvalType
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
          message: "I approve this step",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.approvePetitionApprovalRequestStep).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
        status: "APPROVED",
        petition: {
          generalComments: [
            {
              id: expect.any(String),
              isApproval: true,
              approvalMetadata: {
                stepName: "Step 2",
                status: "APPROVED",
              },
              content: [
                {
                  type: "paragraph",
                  children: [{ text: "I approve this step" }],
                },
              ],
            },
          ],
          events: {
            totalCount: 3,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_FINISHED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_APPROVED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "COMMENT_PUBLISHED",
                data: {
                  petitionFieldCommentId:
                    data.approvePetitionApprovalRequestStep.petition.generalComments[0].id,
                  petitionFieldId: null,
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              stepName: "Step 1",
              approvalType: "ANY",
              status: "APPROVED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
              stepName: "Step 2",
              approvalType: "ANY",
              status: "APPROVED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: expect.any(Date),
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[2].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });

      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("sends error if the provided step is not in PENDING status", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            approvePetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
          message: "I approve this step",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user is not a defined approver", async () => {
      await mocks.knex
        .from("petition_approval_request_step_approver")
        .where("petition_approval_request_step_id", steps[0].id)
        .where("user_id", user.id)
        .delete();

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            approvePetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          message: "I approve this step",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if same user tries to approve after previously approving", async () => {
      await mocks.knex
        .from("petition_approval_request_step_approver")
        .where("petition_approval_request_step_id", steps[0].id)
        .where("user_id", user.id)
        .update({
          approved_at: new Date(),
          rejected_at: null,
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            approvePetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          message: "I approve this step",
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if same user tries to approve after previously rejecting", async () => {
      await mocks.knex
        .from("petition_approval_request_step_approver")
        .where("petition_approval_request_step_id", steps[0].id)
        .where("user_id", user.id)
        .update({
          approved_at: null,
          rejected_at: new Date(),
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $approvalRequestStepId: GID!, $message: String!) {
            approvePetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          message: "I approve this step",
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("rejectPetitionApprovalRequestStep", () => {
    let steps: PetitionApprovalRequestStep[];
    let petition: Petition;
    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "COMPLETED",
        approval_flow_config: JSON.stringify([
          {
            name: "Step 1",
            type: "ANY",
            values: [
              { type: "User", id: user.id },
              { type: "UserGroup", id: adminsGroup.id },
            ],
          },
          {
            name: "Step 2",
            type: "ANY",
            values: [
              { type: "User", id: user.id },
              { type: "User", id: otherUsers[2].id },
            ],
          },
        ]),
      }));

      steps = await mocks.knex.from("petition_approval_request_step").insert(
        [
          {
            step_name: "Step 1",
            approval_type: "ANY",
            status: "PENDING",
            step_number: 0,
            petition_id: petition.id,
          },
          {
            step_name: "Step 2",
            approval_type: "ANY",
            status: "NOT_STARTED",
            step_number: 1,
            petition_id: petition.id,
          },
        ],
        "*",
      );

      await mocks.knex.from("petition_approval_request_step_approver").insert([
        {
          user_id: user.id,
          petition_approval_request_step_id: steps[0].id,
        },
        {
          user_id: otherUsers[0].id,
          petition_approval_request_step_id: steps[0].id,
        },
        {
          user_id: otherUsers[1].id,
          petition_approval_request_step_id: steps[0].id,
        },
        {
          user_id: user.id,
          petition_approval_request_step_id: steps[1].id,
        },
        {
          user_id: otherUsers[2].id,
          petition_approval_request_step_id: steps[1].id,
        },
      ]);
    });

    it("temporally rejects the provided step if type=ALL, marking it as REJECTED and finishing the whole approval request and configuring a new one", async () => {
      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionApprovalRequestStepRejectedEmail",
      );

      await mocks.knex
        .from("petition_approval_request_step")
        .where("id", steps[0].id)
        .update("approval_type", "ALL");

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $approvalRequestStepId: GID!
            $rejectionType: PetitionApprovalRequestStepRejectionType!
            $message: String!
          ) {
            rejectPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              rejectionType: $rejectionType
              message: $message
            ) {
              id
              status
              approvers {
                user {
                  id
                }
                rejectedAt
              }
              petition {
                generalComments {
                  id
                  isApproval
                  approvalMetadata
                  content
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  stepName
                  approvalType
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
                oldApprovalRequestSteps {
                  id
                  status
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          rejectionType: "TEMPORARY",
          message: "Please fix this",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.rejectPetitionApprovalRequestStep).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
        status: "REJECTED",
        approvers: [
          {
            user: { id: toGlobalId("User", user.id) },
            rejectedAt: expect.any(Date),
          },
          {
            user: { id: toGlobalId("User", otherUsers[0].id) },
            rejectedAt: null,
          },
          {
            user: { id: toGlobalId("User", otherUsers[1].id) },
            rejectedAt: null,
          },
        ],
        petition: {
          generalComments: [
            {
              id: expect.any(String),
              isApproval: true,
              approvalMetadata: {
                stepName: "Step 1",
                status: "REJECTED",
                rejectionType: "TEMPORARY",
              },
              content: [
                {
                  type: "paragraph",
                  children: [{ text: "Please fix this" }],
                },
              ],
            },
          ],
          events: {
            totalCount: 3,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_FINISHED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_REJECTED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "COMMENT_PUBLISHED",
                data: {
                  petitionFieldCommentId:
                    data.rejectPetitionApprovalRequestStep.petition.generalComments[0].id,
                  petitionFieldId: null,
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: expect.any(String),
              stepName: "Step 1",
              approvalType: "ALL",
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[2].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: expect.any(String),
              stepName: "Step 2",
              approvalType: "ANY",
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[2].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
          oldApprovalRequestSteps: [
            { id: toGlobalId("PetitionApprovalRequestStep", steps[0].id), status: "REJECTED" },
          ],
        },
      });

      const deprecatedSteps = await mocks.knex
        .from("petition_approval_request_step")
        .where("petition_id", petition.id)
        .whereNotNull("deprecated_at")
        .select("*");

      expect(deprecatedSteps).toHaveLength(2);

      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("temporally rejects the provided step if type=ANY, marking it as REJECTED and finishing the whole process and configuring a new one", async () => {
      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionApprovalRequestStepRejectedEmail",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $approvalRequestStepId: GID!
            $rejectionType: PetitionApprovalRequestStepRejectionType!
            $message: String!
          ) {
            rejectPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              rejectionType: $rejectionType
              message: $message
            ) {
              id
              status
              petition {
                generalComments {
                  id
                  isApproval
                  approvalMetadata
                  content
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  stepName
                  approvalType
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
                oldApprovalRequestSteps {
                  id
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          rejectionType: "TEMPORARY",
          message: "Please fix this",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.rejectPetitionApprovalRequestStep).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
        status: "REJECTED",
        petition: {
          generalComments: [
            {
              id: expect.any(String),
              isApproval: true,
              approvalMetadata: {
                stepName: "Step 1",
                status: "REJECTED",
                rejectionType: "TEMPORARY",
              },
              content: [
                {
                  type: "paragraph",
                  children: [{ text: "Please fix this" }],
                },
              ],
            },
          ],
          events: {
            totalCount: 3,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_FINISHED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_REJECTED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "COMMENT_PUBLISHED",
                data: {
                  petitionFieldCommentId:
                    data.rejectPetitionApprovalRequestStep.petition.generalComments[0].id,
                  petitionFieldId: null,
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: expect.any(String),
              stepName: "Step 1",
              approvalType: "ANY",
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[2].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: expect.any(String),
              stepName: "Step 2",
              approvalType: "ANY",
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[2].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
          oldApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              status: "REJECTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: expect.any(Date),
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });

      const deprecatedSteps = await mocks.knex
        .from("petition_approval_request_step")
        .where("petition_id", petition.id)
        .whereNotNull("deprecated_at")
        .select("*");

      expect(deprecatedSteps).toHaveLength(2);

      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("permanently rejects the provided step, marking it as REJECTED and not allowing to start a new one", async () => {
      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionApprovalRequestStepRejectedEmail",
      );

      await mocks.knex
        .from("petition_approval_request_step_approver")
        .where("petition_approval_request_step_id", steps[0].id)
        .whereNot("user_id", user.id)
        .update({ rejected_at: new Date() });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $approvalRequestStepId: GID!
            $rejectionType: PetitionApprovalRequestStepRejectionType!
            $message: String!
          ) {
            rejectPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              rejectionType: $rejectionType
              message: $message
            ) {
              id
              status
              petition {
                generalComments {
                  id
                  isApproval
                  approvalMetadata
                  content
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                currentApprovalRequestSteps {
                  id
                  stepName
                  approvalType
                  status
                  approvers {
                    user {
                      id
                    }
                    approvedAt
                    canceledAt
                    rejectedAt
                    sentAt
                    skippedAt
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          rejectionType: "DEFINITIVE",
          message: "Please fix this",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.rejectPetitionApprovalRequestStep).toEqual({
        id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
        status: "REJECTED",
        petition: {
          generalComments: [
            {
              id: expect.any(String),
              isApproval: true,
              approvalMetadata: {
                stepName: "Step 1",
                status: "REJECTED",
                rejectionType: "DEFINITIVE",
              },
              content: [
                {
                  type: "paragraph",
                  children: [{ text: "Please fix this" }],
                },
              ],
            },
          ],
          events: {
            totalCount: 3,
            items: [
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_FINISHED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "PETITION_APPROVAL_REQUEST_STEP_REJECTED",
                data: {
                  approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "COMMENT_PUBLISHED",
                data: {
                  petitionFieldCommentId:
                    data.rejectPetitionApprovalRequestStep.petition.generalComments[0].id,
                  petitionFieldId: null,
                },
              },
            ],
          },
          currentApprovalRequestSteps: [
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
              stepName: "Step 1",
              approvalType: "ANY",
              status: "REJECTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: expect.any(Date),
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[0].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: expect.any(Date),
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[1].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: expect.any(Date),
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
            {
              id: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
              stepName: "Step 2",
              approvalType: "ANY",
              status: "NOT_STARTED",
              approvers: [
                {
                  user: { id: toGlobalId("User", user.id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
                {
                  user: { id: toGlobalId("User", otherUsers[2].id) },
                  approvedAt: null,
                  canceledAt: null,
                  rejectedAt: null,
                  sentAt: null,
                  skippedAt: null,
                },
              ],
            },
          ],
        },
      });

      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("sends error if the provided step is not in PENDING status", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $approvalRequestStepId: GID!
            $rejectionType: PetitionApprovalRequestStepRejectionType!
            $message: String!
          ) {
            rejectPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              rejectionType: $rejectionType
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[1].id),
          rejectionType: "DEFINITIVE",
          message: "Please fix this",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user is not a defined approver", async () => {
      await mocks.knex
        .from("petition_approval_request_step_approver")
        .where("petition_approval_request_step_id", steps[0].id)
        .where("user_id", user.id)
        .delete();

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $approvalRequestStepId: GID!
            $rejectionType: PetitionApprovalRequestStepRejectionType!
            $message: String!
          ) {
            rejectPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              rejectionType: $rejectionType
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          rejectionType: "DEFINITIVE",
          message: "Please fix this",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if same user tries to reject after previously approving", async () => {
      await mocks.knex
        .from("petition_approval_request_step_approver")
        .where("petition_approval_request_step_id", steps[0].id)
        .where("user_id", user.id)
        .update({ approved_at: new Date(), rejected_at: null });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $approvalRequestStepId: GID!
            $rejectionType: PetitionApprovalRequestStepRejectionType!
            $message: String!
          ) {
            rejectPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              rejectionType: $rejectionType
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          rejectionType: "TEMPORARY",
          message: "Please fix this",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if same user tries to reject after previously rejecting", async () => {
      await mocks.knex
        .from("petition_approval_request_step_approver")
        .where("petition_approval_request_step_id", steps[0].id)
        .where("user_id", user.id)
        .update({ rejected_at: new Date(), approved_at: null });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $approvalRequestStepId: GID!
            $rejectionType: PetitionApprovalRequestStepRejectionType!
            $message: String!
          ) {
            rejectPetitionApprovalRequestStep(
              petitionId: $petitionId
              approvalRequestStepId: $approvalRequestStepId
              rejectionType: $rejectionType
              message: $message
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          approvalRequestStepId: toGlobalId("PetitionApprovalRequestStep", steps[0].id),
          rejectionType: "TEMPORARY",
          message: "Please fix this",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
