import { gql } from "graphql-request";
import { Knex } from "knex";
import { Organization, Petition, PetitionField, User } from "../../../../db/__types";
import { KNEX } from "../../../../db/knex";
import { Mocks } from "../../../../db/repositories/__tests__/mocks";
import { initServer, TestClient } from "../../../../graphql/__tests__/server";

import { toGlobalId } from "../../../../util/globalId";
import { deleteAllData } from "../../../../util/knexUtils";
import {
  PETITION_APPROVAL_PROCESS_LISTENER,
  PetitionApprovalProcessListener,
} from "../../../queues/event-listeners/PetitionApprovalProcessListener";

describe("Worker - Petition Approval Process Listener", () => {
  let knex: Knex;
  let mocks: Mocks;

  let organization: Organization;
  let sessionUser: User;

  let approvalsListener: PetitionApprovalProcessListener;

  let testClient: TestClient;

  let petition: Petition;
  let field: PetitionField;

  beforeAll(async () => {
    testClient = await initServer();

    knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([
      {
        name: "PETITION_APPROVAL_FLOW",
        default_value: true,
      },
    ]);
  });

  beforeEach(async () => {
    approvalsListener = testClient.container.get<PetitionApprovalProcessListener>(
      PETITION_APPROVAL_PROCESS_LISTENER,
    );

    [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1, () => ({
      status: "COMPLETED",
    }));

    [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
      type: "TEXT",
      optional: true,
    }));

    await mocks.knex
      .from("petition")
      .where("id", petition.id)
      .update({
        approval_flow_config: JSON.stringify([
          {
            manual_start: true,
            name: "Step 1",
            type: "ALL",
            values: [{ id: sessionUser.id, type: "User" }],
          },
          {
            manual_start: true,
            name: "Step 2",
            type: "ANY",
            values: [{ id: sessionUser.id, type: "User" }],
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
  });

  afterEach(async () => {
    await mocks.knex.from("feature_flag_override").delete();
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  it("calculates and creates approval steps if the petition has set an approval_flow_config", async () => {
    await approvalsListener.handle({
      id: 1,
      created_at: new Date(),
      petition_id: petition.id,
      type: "PETITION_COMPLETED",
      data: {
        user_id: sessionUser.id,
      },
      processed_at: null,
      processed_by: null,
    });

    const { errors, data } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            ... on Petition {
              currentApprovalRequestSteps {
                id
                status
                approvalType
                approvers {
                  user {
                    id
                  }
                  approvedAt
                  canceledAt
                  rejectedAt
                  skippedAt
                  sentAt
                }
              }
            }
          }
        }
      `,
      {
        id: toGlobalId("Petition", petition.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),
      currentApprovalRequestSteps: [
        {
          id: expect.any(String),
          status: "NOT_STARTED",
          approvalType: "ALL",
          approvers: [
            {
              user: { id: toGlobalId("User", sessionUser.id) },
              approvedAt: null,
              canceledAt: null,
              rejectedAt: null,
              skippedAt: null,
              sentAt: null,
            },
          ],
        },
        {
          id: expect.any(String),
          status: "NOT_APPLICABLE",
          approvalType: "ANY",
          approvers: [
            {
              user: { id: toGlobalId("User", sessionUser.id) },
              approvedAt: null,
              canceledAt: null,
              rejectedAt: null,
              skippedAt: null,
              sentAt: null,
            },
          ],
        },
      ],
    });
  });

  it("starts first step automatically if the petition has a manual_start flag set to false", async () => {
    await mocks.knex
      .from("petition")
      .where("id", petition.id)
      .update({
        approval_flow_config: JSON.stringify([
          {
            manual_start: false,
            name: "Step 1",
            type: "ALL",
            values: [{ id: sessionUser.id, type: "User" }],
          },
          {
            manual_start: true,
            name: "Step 2",
            type: "ANY",
            values: [{ id: sessionUser.id, type: "User" }],
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

    await approvalsListener.handle({
      id: 1,
      created_at: new Date(),
      petition_id: petition.id,
      type: "PETITION_COMPLETED",
      data: {
        user_id: sessionUser.id,
      },
      processed_at: null,
      processed_by: null,
    });

    const { errors, data } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            ... on Petition {
              events(offset: 0, limit: 100) {
                totalCount
                items {
                  type
                  data
                }
              }
            }
            ... on Petition {
              currentApprovalRequestSteps {
                id
                status
                approvalType
                approvers {
                  user {
                    id
                  }
                  approvedAt
                  canceledAt
                  rejectedAt
                  skippedAt
                  sentAt
                }
              }
            }
          }
        }
      `,
      {
        id: toGlobalId("Petition", petition.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),
      currentApprovalRequestSteps: [
        {
          id: expect.any(String),
          status: "PENDING",
          approvalType: "ALL",
          approvers: [
            {
              user: { id: toGlobalId("User", sessionUser.id) },
              approvedAt: null,
              canceledAt: null,
              rejectedAt: null,
              skippedAt: null,
              sentAt: expect.any(Date),
            },
          ],
        },
        {
          id: expect.any(String),
          status: "NOT_APPLICABLE",
          approvalType: "ANY",
          approvers: [
            {
              user: { id: toGlobalId("User", sessionUser.id) },
              approvedAt: null,
              canceledAt: null,
              rejectedAt: null,
              skippedAt: null,
              sentAt: null,
            },
          ],
        },
      ],
      events: {
        totalCount: 1,
        items: [
          {
            type: "PETITION_APPROVAL_REQUEST_STEP_STARTED",
            data: {
              approvalRequestStepId: expect.any(String),
              userId: null,
            },
          },
        ],
      },
    });
  });

  it("does nothing if the organization does not have the feature flag enabled", async () => {
    await mocks.createFeatureFlagOverride("PETITION_APPROVAL_FLOW", {
      org_id: organization.id,
      value: false,
    });

    await approvalsListener.handle({
      id: 1,
      created_at: new Date(),
      petition_id: petition.id,
      type: "PETITION_COMPLETED",
      data: {
        user_id: sessionUser.id,
      },
      processed_at: null,
      processed_by: null,
    });

    const { errors, data } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            ... on Petition {
              currentApprovalRequestSteps {
                id
                status
                approvalType
                approvers {
                  user {
                    id
                  }
                  approvedAt
                  canceledAt
                  rejectedAt
                  skippedAt
                  sentAt
                }
              }
            }
          }
        }
      `,
      {
        id: toGlobalId("Petition", petition.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),
      currentApprovalRequestSteps: [],
    });
  });
});
