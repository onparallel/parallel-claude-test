import gql from "graphql-tag";
import { Knex } from "knex";
import { Organization, Petition, PetitionPermissionType, User, UserGroup } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("Petition Filters", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let user: User;
  let organization: Organization;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("sharedWith", () => {
    let users: User[];
    let userGroup: UserGroup;
    let petitions: Petition[];

    beforeAll(async () => {
      users = await mocks.createRandomUsers(organization.id, 3);
      [userGroup] = await mocks.createUserGroups(1, organization.id);
      await mocks.insertUserGroupMembers(userGroup.id, [user.id, users[0].id]);

      petitions = await mocks.createRandomPetitions(organization.id, user.id, 4);

      const [otherPetition] = await mocks.createRandomPetitions(organization.id, users[1].id, 1);

      petitions.push(otherPetition);

      /**
       * Petitions:
       * [0] Owner: Me, shared with: -
       * [1] Owner: Me, shared with: userGroup
       * [2] Owner: Me, shared with: users[0]
       * [3] Owner: Me, shared with: users[2], userGroup
       * [4] Owner: users[1], shared with: Me, users[2]
       */
      await mocks.sharePetitionWithGroups(petitions[1].id, [userGroup.id]); // [1]
      await mocks.sharePetitions([petitions[2].id], users[0].id, "READ"); // [2]
      await mocks.sharePetitionWithGroups(petitions[3].id, [userGroup.id]); // [3]
      await mocks.sharePetitions([petitions[3].id], users[2].id, "READ"); // [3]
      await mocks.sharePetitions([otherPetition.id], user.id, "READ"); // [4]
      await mocks.sharePetitions([otherPetition.id], users[2].id, "READ"); // [4]
    });

    afterAll(async () => {
      await mocks.knex.from("petition").update({ deleted_at: new Date() });
    });

    it("petitions owned by me", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "IS_OWNER",
                  value: toGlobalId("User", user.id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[0].id) },
          { id: toGlobalId("Petition", petitions[1].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
          { id: toGlobalId("Petition", petitions[3].id) },
        ],
      });
    });

    it("petitions owned by another user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "IS_OWNER",
                  value: toGlobalId("User", users[0].id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [],
      });
    });

    it("petitions shared with a user through a group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "SHARED_WITH",
                  value: toGlobalId("User", users[0].id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[1].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
          { id: toGlobalId("Petition", petitions[3].id) },
        ],
      });
    });

    it("petitions shared with other user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "SHARED_WITH",
                  value: toGlobalId("User", users[2].id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[3].id) },
          { id: toGlobalId("Petition", petitions[4].id) },
        ],
      });
    });

    it("petitions shared with a user group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "SHARED_WITH",
                  value: toGlobalId("UserGroup", userGroup.id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[1].id) },
          { id: toGlobalId("Petition", petitions[3].id) },
        ],
      });
    });

    it("petitions shared with me and other user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "SHARED_WITH",
                  value: toGlobalId("User", user.id),
                },
                {
                  operator: "SHARED_WITH",
                  value: toGlobalId("User", users[2].id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[3].id) },
          { id: toGlobalId("Petition", petitions[4].id) },
        ],
      });
    });

    it("petitions owned by other user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "IS_OWNER",
                  value: toGlobalId("User", users[1].id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [{ id: toGlobalId("Petition", petitions[4].id) }],
      });
    });

    it("petitions not shared with a user group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "NOT_SHARED_WITH",
                  value: toGlobalId("UserGroup", userGroup.id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[0].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
          { id: toGlobalId("Petition", petitions[4].id) },
        ],
      });
    });

    it("petitions owned by one user or shared to other user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "OR",
              filters: [
                {
                  operator: "IS_OWNER",
                  value: toGlobalId("User", users[1].id),
                },
                {
                  operator: "SHARED_WITH",
                  value: toGlobalId("User", users[2].id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[3].id) },
          { id: toGlobalId("Petition", petitions[4].id) },
        ],
      });
    });

    it("petitions not shared with a user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "NOT_SHARED_WITH",
                  value: toGlobalId("User", users[2].id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[0].id) },
          { id: toGlobalId("Petition", petitions[1].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
        ],
      });
    });

    it("petitions not shared with a user group and owned by me", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "IS_OWNER",
                  value: toGlobalId("User", user.id),
                },
                {
                  operator: "NOT_SHARED_WITH",
                  value: toGlobalId("UserGroup", userGroup.id),
                },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[0].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
        ],
      });
    });

    it("sends error when passing a globalId value different than User or UserGroup", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
            sharedWith: {
              operator: "AND",
              filters: [
                {
                  operator: "IS_OWNER",
                  value: toGlobalId("Petition", 1),
                },
              ],
            },
          },
        },
      );
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "filters.sharedWith",
        message: "All IDs must refer to either users or user groups",
      });
      expect(data).toBeNull();
    });
  });

  describe("signature", () => {
    let petitions: Petition[];

    beforeAll(async () => {
      petitions = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        8,
        (i) =>
          [
            {
              signature_config: null,
              latest_signature_status: null, // NO_SIGNATURE
            },
            {
              signature_config: { isEnabled: false },
              latest_signature_status: null, // NO_SIGNATURE
            },
            {
              status: "DRAFT" as const,
              signature_config: { isEnabled: true },
              latest_signature_status: null, // NOT_STARTED
            },
            {
              status: "COMPLETED" as const,
              signature_config: { isEnabled: true },
              latest_signature_status: "COMPLETED", // PENDING_START
            },
            {
              status: "COMPLETED" as const,
              signature_config: { isEnabled: true },
              latest_signature_status: "PROCESSED", // PROCESSING
            },
            {
              status: "COMPLETED" as const,
              signature_config: { isEnabled: false },
              latest_signature_status: "COMPLETED", // COMPLETED
            },
            {
              status: "COMPLETED" as const,
              latest_signature_status: "CANCELLED", // CANCELLED
            },
            {
              status: "COMPLETED" as const,
              signature_config: { isEnabled: false },
              latest_signature_status: "CANCELLED_BY_USER", // CANCELLED
            },
          ][i],
      );
    });

    afterAll(async () => {
      await mocks.knex.from("petition").update({ deleted_at: new Date() });
    });

    it("NO_SIGNATURE", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          filters: { signature: ["NO_SIGNATURE"] },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[0].id) },
          { id: toGlobalId("Petition", petitions[1].id) },
        ],
      });
    });

    it("NOT_STARTED", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          filters: { signature: ["NOT_STARTED"] },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [{ id: toGlobalId("Petition", petitions[2].id) }],
      });
    });

    it("PENDING_START", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          filters: { signature: ["PENDING_START"] },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [{ id: toGlobalId("Petition", petitions[3].id) }],
      });
    });

    it("PROCESSING", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          filters: { signature: ["PROCESSING"] },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [{ id: toGlobalId("Petition", petitions[4].id) }],
      });
    });

    it("COMPLETED", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          filters: { signature: ["COMPLETED"] },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [{ id: toGlobalId("Petition", petitions[5].id) }],
      });
    });

    it("CANCELLED", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          filters: { signature: ["CANCELLED"] },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[6].id) },
          { id: toGlobalId("Petition", petitions[7].id) },
        ],
      });
    });

    it("multiple signature filters", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          filters: { signature: ["NO_SIGNATURE", "NOT_STARTED", "CANCELLED"] },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[0].id) },
          { id: toGlobalId("Petition", petitions[1].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
          { id: toGlobalId("Petition", petitions[6].id) },
          { id: toGlobalId("Petition", petitions[7].id) },
        ],
      });
    });
  });

  describe("approvals", () => {
    let petitions: Petition[];

    beforeAll(async () => {
      petitions = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        7,
        (i) =>
          [
            {
              approval_flow_config: null, // WITHOUT_APPROVAL
            },
            {
              approval_flow_config: JSON.stringify([
                { name: "step 1", type: "ANY", values: [], manual_start: true },
              ]), // NOT_STARTED
            },
            {
              approval_flow_config: JSON.stringify([
                { name: "step 1", type: "ANY", values: [], manual_start: true },
              ]), // NOT_STARTED
            },
            {
              approval_flow_config: JSON.stringify([
                { name: "step 1", type: "ANY", values: [], manual_start: true },
              ]), // PENDING
            },
            {
              approval_flow_config: JSON.stringify([
                { name: "step 1", type: "ANY", values: [], manual_start: true },
              ]), // APPROVED
            },
            {
              approval_flow_config: JSON.stringify([
                { name: "step 1", type: "ANY", values: [], manual_start: true },
              ]), // APPROVED
            },
            {
              approval_flow_config: JSON.stringify([
                { name: "step 1", type: "ANY", values: [], manual_start: true },
              ]), // REJECTED
            },
          ][i],
      );

      await mocks.knex.from("petition_approval_request_step").insert([
        {
          petition_id: petitions[2].id, // NOT_STARTED
          approval_type: "ANY",
          status: "NOT_STARTED",
          step_name: "step 1",
          step_number: 1,
        },
        {
          petition_id: petitions[3].id, // PENDING
          approval_type: "ANY",
          status: "PENDING",
          step_name: "step 1",
          step_number: 1,
        },
        {
          petition_id: petitions[3].id, // PENDING
          approval_type: "ANY",
          status: "NOT_STARTED",
          step_name: "step 2",
          step_number: 2,
        },
        {
          petition_id: petitions[4].id, // APPROVED
          approval_type: "ANY",
          status: "APPROVED",
          step_name: "step 1",
          step_number: 1,
        },
        {
          petition_id: petitions[5].id, // SKIPPED
          approval_type: "ANY",
          status: "SKIPPED",
          step_name: "step 1",
          step_number: 1,
        },
        {
          petition_id: petitions[5].id, // SKIPPED
          approval_type: "ANY",
          status: "SKIPPED",
          step_name: "step 2",
          step_number: 2,
        },
        {
          petition_id: petitions[6].id, // REJECTED
          approval_type: "ANY",
          status: "APPROVED",
          step_name: "step 1",
          step_number: 1,
        },
        {
          petition_id: petitions[6].id, // REJECTED
          approval_type: "ANY",
          status: "REJECTED",
          step_name: "step 2",
          step_number: 2,
        },
      ]);
    });

    afterAll(async () => {
      await mocks.knex.from("petition").update({ deleted_at: new Date() });
    });

    it("WITHOUT_APPROVAL", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
              filters: [{ operator: "STATUS", value: "WITHOUT_APPROVAL" }],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [{ id: toGlobalId("Petition", petitions[0].id) }],
      });
    });

    it("NOT_STARTED", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
              filters: [{ operator: "STATUS", value: "NOT_STARTED" }],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[1].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
        ],
      });
    });

    it("PENDING", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
              filters: [{ operator: "STATUS", value: "PENDING" }],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [{ id: toGlobalId("Petition", petitions[3].id) }],
      });
    });

    it("APPROVED", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
              filters: [{ operator: "STATUS", value: "APPROVED" }],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[4].id) },
          { id: toGlobalId("Petition", petitions[5].id) },
        ],
      });
    });

    it("REJECTED", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
              filters: [{ operator: "STATUS", value: "REJECTED" }],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [{ id: toGlobalId("Petition", petitions[6].id) }],
      });
    });

    it("multiple approval statuses", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filters: PetitionFilter) {
            petitions(limit: 10, filters: $filters) {
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
                { operator: "STATUS", value: "NOT_STARTED" },
                { operator: "STATUS", value: "PENDING" },
                { operator: "STATUS", value: "REJECTED" },
              ],
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[1].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
          { id: toGlobalId("Petition", petitions[3].id) },
          { id: toGlobalId("Petition", petitions[6].id) },
        ],
      });
    });
  });

  describe("minEffectivePermission", () => {
    let petitions: Petition[];

    beforeAll(async () => {
      petitions = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        5,
        undefined,
        (i) => ({
          type: ["OWNER", "OWNER", "WRITE", "WRITE", "READ"][i] as PetitionPermissionType,
        }),
      );
    });

    afterAll(async () => {
      await mocks.knex.from("petition").update({ deleted_at: new Date() });
    });

    it("READ", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($minEffectivePermission: PetitionPermissionType) {
            petitions(limit: 10, minEffectivePermission: $minEffectivePermission) {
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          minEffectivePermission: "READ",
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[0].id) },
          { id: toGlobalId("Petition", petitions[1].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
          { id: toGlobalId("Petition", petitions[3].id) },
          { id: toGlobalId("Petition", petitions[4].id) },
        ],
      });
    });

    it("WRITE", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($minEffectivePermission: PetitionPermissionType) {
            petitions(limit: 10, minEffectivePermission: $minEffectivePermission) {
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          minEffectivePermission: "WRITE",
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[0].id) },
          { id: toGlobalId("Petition", petitions[1].id) },
          { id: toGlobalId("Petition", petitions[2].id) },
          { id: toGlobalId("Petition", petitions[3].id) },
        ],
      });
    });

    it("OWNER", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($minEffectivePermission: PetitionPermissionType) {
            petitions(limit: 10, minEffectivePermission: $minEffectivePermission) {
              items {
                ... on PetitionBase {
                  id
                }
              }
            }
          }
        `,
        {
          minEffectivePermission: "OWNER",
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        items: [
          { id: toGlobalId("Petition", petitions[0].id) },
          { id: toGlobalId("Petition", petitions[1].id) },
        ],
      });
    });
  });
});
