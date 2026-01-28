import gql from "graphql-tag";
import { Knex } from "knex";
import {
  Organization,
  ProfileListView,
  ProfileType,
  ProfileTypeField,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { PROFILES_SETUP_SERVICE, ProfilesSetupService } from "../../services/ProfilesSetupService";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/ProfileListView", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let individual: ProfileType;
  let legalEntity: ProfileType;
  let individualFields: ProfileTypeField[];
  let legalEntityFields: ProfileTypeField[];
  let customView: ProfileListView;
  let allView: ProfileListView;
  let organization: Organization;
  let user: User;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization());

    const profilesSetup = testClient.container.get<ProfilesSetupService>(PROFILES_SETUP_SERVICE);

    await profilesSetup.createIndividualProfileType(
      { org_id: organization.id, name: { en: "Individual" }, name_plural: { en: "Individuals" } },
      `User:${user.id}`,
    );
    await profilesSetup.createLegalEntityProfileType(
      { org_id: organization.id, name: { en: "Company" }, name_plural: { en: "Companies" } },
      `User:${user.id}`,
    );
    await profilesSetup.createContractProfileType(
      { org_id: organization.id, name: { en: "Contract" }, name_plural: { en: "Contracts" } },
      `User:${user.id}`,
    );

    const profileTypes = await mocks.knex
      .from("profile_type")
      .where("org_id", organization.id)
      .select("*");

    individual = profileTypes.find((pt) => pt.standard_type === "INDIVIDUAL")!;
    legalEntity = profileTypes.find((pt) => pt.standard_type === "LEGAL_ENTITY")!;

    individualFields = await knex
      .from("profile_type_field")
      .where("profile_type_id", individual.id)
      .orderBy("position", "asc")
      .select("*");

    legalEntityFields = await knex
      .from("profile_type_field")
      .where("profile_type_id", legalEntity.id)
      .orderBy("position", "asc")
      .select("*");

    [allView] = await mocks.knex
      .from("profile_list_view")
      .where({
        view_type: "ALL",
        profile_type_id: individual.id,
        user_id: user.id,
        deleted_at: null,
      })
      .select("*");

    [customView] = await mocks.knex.from("profile_list_view").insert(
      {
        profile_type_id: individual.id,
        is_default: true,
        user_id: user.id,
        data: {
          search: "Vladimir",
          sort: { field: "createdAt", direction: "ASC" },
          columns: [
            `field_${individualFields[0].id}`,
            `field_${individualFields[1].id}`,
            "createdAt",
          ],
        },
        name: "Vladimir",
        position: 1,
        view_type: "CUSTOM",
      },
      "*",
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  afterEach(async () => {
    await mocks.knex
      .from("profile_list_view")
      .whereNotIn("id", [customView.id, allView.id])
      .delete();
  });

  describe("queries", () => {
    it("queries the user's profile list views", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($profileTypeId: GID!) {
            me {
              id
              profileListViews(profileTypeId: $profileTypeId) {
                id
                name
                isDefault
                data {
                  columns
                  search
                  sort {
                    field
                    direction
                  }
                }
                type
                profileType {
                  id
                }
                user {
                  id
                }
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", individual.id),
        },
      );

      const clientStatus = individualFields.find((f) => f.alias === "p_client_status")!;
      const risk = individualFields.find((f) => f.alias === "p_risk")!;
      const relationship = individualFields.find((f) => f.alias === "p_relationship")!;
      expect(errors).toBeUndefined();
      expect(data).toEqual({
        me: {
          id: toGlobalId("User", user.id),
          profileListViews: [
            {
              id: toGlobalId("ProfileListView", allView.id),
              name: "ALL",
              isDefault: false,
              data: {
                columns: [
                  `field_${toGlobalId("ProfileTypeField", clientStatus.id)}`,
                  `field_${toGlobalId("ProfileTypeField", risk.id)}`,
                  `field_${toGlobalId("ProfileTypeField", relationship.id)}`,
                  "subscribers",
                  "createdAt",
                ],
                search: null,
                sort: null,
              },
              type: "ALL",
              profileType: {
                id: toGlobalId("ProfileType", individual.id),
              },
              user: {
                id: toGlobalId("User", user.id),
              },
            },
            {
              id: toGlobalId("ProfileListView", customView.id),
              name: "Vladimir",
              isDefault: true,
              data: {
                columns: [
                  `field_${toGlobalId("ProfileTypeField", individualFields[0].id)}`,
                  `field_${toGlobalId("ProfileTypeField", individualFields[1].id)}`,
                  "createdAt",
                ],
                search: "Vladimir",
                sort: { field: "createdAt", direction: "ASC" },
              },
              type: "CUSTOM",
              profileType: {
                id: toGlobalId("ProfileType", individual.id),
              },
              user: {
                id: toGlobalId("User", user.id),
              },
            },
          ],
        },
      });
    });
  });

  describe("createProfileListView", () => {
    it("creates a new view with custom filters and sorting", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $name: String!, $data: ProfileListViewDataInput!) {
            createProfileListView(profileTypeId: $profileTypeId, name: $name, data: $data) {
              id
              name
              isDefault
              data {
                search
                status
                columns
                sort {
                  field
                  direction
                }
              }
              user {
                profileListViews(profileTypeId: $profileTypeId) {
                  id
                  isDefault
                }
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", individual.id),
          name: "my first view",
          data: {
            search: "aaa",
            status: ["CLOSED"],
            columns: [
              "subscribers",
              "createdAt",
              `field_${toGlobalId("ProfileTypeField", individualFields[3].id)}`,
            ],
            sort: { field: "createdAt", direction: "ASC" },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileListView).toEqual({
        id: expect.any(String),
        name: "my first view",
        isDefault: false,
        data: {
          search: "aaa",
          status: ["CLOSED"],
          columns: [
            "subscribers",
            "createdAt",
            `field_${toGlobalId("ProfileTypeField", individualFields[3].id)}`,
          ],
          sort: { field: "createdAt", direction: "ASC" },
        },
        user: {
          profileListViews: [
            { id: toGlobalId("ProfileListView", allView.id), isDefault: false },
            { id: toGlobalId("ProfileListView", customView.id), isDefault: true },
            { id: data!.createProfileListView.id, isDefault: false },
          ],
        },
      });
    });

    it("sends error when passing invalid field ids on data.columns", async () => {
      for (const columns of [
        ["field_123"], // invalid globalId
        ["unknown", "createdAt"], // unknown field
        [`field:${toGlobalId("ProfileTypeField", legalEntityFields[0].id)}`], // another profile type
      ]) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $name: String!, $data: ProfileListViewDataInput!) {
              createProfileListView(profileTypeId: $profileTypeId, name: $name, data: $data) {
                id
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            name: "my first view",
            data: {
              columns,
            },
          },
        );

        expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
        expect(data).toBeNull();
      }
    });
  });

  describe("updateProfileListView", () => {
    it("updates a custom profile list view", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileListViewId: GID!
            $profileTypeId: GID!
            $name: String
            $data: ProfileListViewDataInput
          ) {
            updateProfileListView(
              profileListViewId: $profileListViewId
              profileTypeId: $profileTypeId
              name: $name
              data: $data
            ) {
              id
              name
              data {
                columns
                search
                sort {
                  field
                  direction
                }
              }
            }
          }
        `,
        {
          profileListViewId: toGlobalId("ProfileListView", customView.id),
          profileTypeId: toGlobalId("ProfileType", individual.id),
          name: "updated name",
          data: {
            search: "Vladimir Putin",
            columns: null,
            sort: null,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileListView).toEqual({
        id: toGlobalId("ProfileListView", customView.id),
        name: "updated name",
        data: {
          search: "Vladimir Putin",
          columns: null,
          sort: null,
        },
      });
    });

    it("sends error if trying to update the name of an ALL type view", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileListViewId: GID!, $profileTypeId: GID!, $name: String) {
            updateProfileListView(
              profileListViewId: $profileListViewId
              profileTypeId: $profileTypeId
              name: $name
            ) {
              id
            }
          }
        `,
        {
          profileListViewId: toGlobalId("ProfileListView", allView.id),
          profileTypeId: toGlobalId("ProfileType", individual.id),
          name: "updated name",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to update filters of an ALL type view", async () => {
      for (const filterData of [{ search: "Vladimir Putin" }, { status: ["CLOSED"] }]) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileListViewId: GID!
              $profileTypeId: GID!
              $data: ProfileListViewDataInput
            ) {
              updateProfileListView(
                profileListViewId: $profileListViewId
                profileTypeId: $profileTypeId
                data: $data
              ) {
                id
              }
            }
          `,
          {
            profileListViewId: toGlobalId("ProfileListView", allView.id),
            profileTypeId: toGlobalId("ProfileType", individual.id),
            data: filterData,
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      }
    });

    it("updates columns and sorting of an ALL type view", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileListViewId: GID!
            $profileTypeId: GID!
            $data: ProfileListViewDataInput
          ) {
            updateProfileListView(
              profileListViewId: $profileListViewId
              profileTypeId: $profileTypeId
              data: $data
            ) {
              id
              data {
                sort {
                  field
                  direction
                }
                columns
              }
            }
          }
        `,
        {
          profileListViewId: toGlobalId("ProfileListView", allView.id),
          profileTypeId: toGlobalId("ProfileType", individual.id),
          data: {
            columns: [
              "createdAt",
              "subscribers",
              `field_${toGlobalId("ProfileTypeField", individualFields[0].id)}`,
            ],
            sort: {
              field: "createdAt",
              direction: "ASC",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileListView).toEqual({
        id: toGlobalId("ProfileListView", allView.id),
        data: {
          sort: {
            field: "createdAt",
            direction: "ASC",
          },
          columns: [
            "createdAt",
            "subscribers",
            `field_${toGlobalId("ProfileTypeField", individualFields[0].id)}`,
          ],
        },
      });
    });

    it("sends error when passing invalid field ids on data.columns", async () => {
      for (const columns of [
        ["field_123"], // invalid globalId
        ["unknown", "createdAt"], // unknown field
        [`field:${toGlobalId("ProfileTypeField", legalEntityFields[0].id)}`], // another profile type
      ]) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileListViewId: GID!
              $profileTypeId: GID!
              $data: ProfileListViewDataInput
            ) {
              updateProfileListView(
                profileListViewId: $profileListViewId
                profileTypeId: $profileTypeId
                data: $data
              ) {
                id
              }
            }
          `,
          {
            profileListViewId: toGlobalId("ProfileListView", allView.id),
            profileTypeId: toGlobalId("ProfileType", individual.id),
            name: "my first view",
            data: {
              columns,
            },
          },
        );

        expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
        expect(data).toBeNull();
      }
    });

    it("sends error if passing invalid profileTypeId", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileListViewId: GID!
            $profileTypeId: GID!
            $data: ProfileListViewDataInput
          ) {
            updateProfileListView(
              profileListViewId: $profileListViewId
              profileTypeId: $profileTypeId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileListViewId: toGlobalId("ProfileListView", allView.id),
          profileTypeId: toGlobalId("ProfileType", legalEntity.id),
          name: "my first view",
          data: {
            columns: null,
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("markProfileListViewAsDefault", () => {
    it("marks view as default", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileListViewId: GID!, $profileTypeId: GID!) {
            markProfileListViewAsDefault(
              profileListViewId: $profileListViewId
              profileTypeId: $profileTypeId
            ) {
              id
              isDefault
              user {
                profileListViews(profileTypeId: $profileTypeId) {
                  id
                  isDefault
                }
              }
            }
          }
        `,
        {
          profileListViewId: toGlobalId("ProfileListView", allView.id),
          profileTypeId: toGlobalId("ProfileType", individual.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.markProfileListViewAsDefault).toEqual({
        id: toGlobalId("ProfileListView", allView.id),
        isDefault: true,
        user: {
          profileListViews: [
            { id: toGlobalId("ProfileListView", allView.id), isDefault: true },
            { id: toGlobalId("ProfileListView", customView.id), isDefault: false },
          ],
        },
      });
    });

    it("sends error if passing invalid profileTypeId", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileListViewId: GID!, $profileTypeId: GID!) {
            markProfileListViewAsDefault(
              profileListViewId: $profileListViewId
              profileTypeId: $profileTypeId
            ) {
              id
            }
          }
        `,
        {
          profileListViewId: toGlobalId("ProfileListView", allView.id),
          profileTypeId: toGlobalId("ProfileType", legalEntity.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("reorderProfileListViews", () => {
    it("sorts the profile list views", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($ids: [GID!]!, $profileTypeId: GID!) {
            reorderProfileListViews(ids: $ids, profileTypeId: $profileTypeId) {
              profileListViews(profileTypeId: $profileTypeId) {
                id
              }
            }
          }
        `,
        {
          ids: [
            toGlobalId("ProfileListView", customView.id),
            toGlobalId("ProfileListView", allView.id),
          ],
          profileTypeId: toGlobalId("ProfileType", individual.id),
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.reorderProfileListViews).toEqual({
        profileListViews: [
          { id: toGlobalId("ProfileListView", customView.id) },
          { id: toGlobalId("ProfileListView", allView.id) },
        ],
      });
    });

    it("sends error when passing incomplete array", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($ids: [GID!]!, $profileTypeId: GID!) {
            reorderProfileListViews(ids: $ids, profileTypeId: $profileTypeId) {
              profileListViews(profileTypeId: $profileTypeId) {
                id
                isDefault
              }
            }
          }
        `,
        {
          ids: [toGlobalId("ProfileListView", customView.id)],
          profileTypeId: toGlobalId("ProfileType", individual.id),
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deleteProfileListView", () => {
    it("deletes a profile list view", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!, $profileTypeId: GID!) {
            deleteProfileListView(id: $id) {
              profileListViews(profileTypeId: $profileTypeId) {
                id
              }
            }
          }
        `,
        {
          id: toGlobalId("ProfileListView", customView.id),
          profileTypeId: toGlobalId("ProfileType", individual.id),
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.deleteProfileListView).toEqual({
        profileListViews: [{ id: toGlobalId("ProfileListView", allView.id) }],
      });
    });

    it("sends error if trying to delete an ALL type view", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!, $profileTypeId: GID!) {
            deleteProfileListView(id: $id) {
              profileListViews(profileTypeId: $profileTypeId) {
                id
                isDefault
              }
            }
          }
        `,
        {
          id: toGlobalId("ProfileListView", allView.id),
          profileTypeId: toGlobalId("ProfileType", individual.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing invalid profileTypeId", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!, $profileTypeId: GID!) {
            deleteProfileListView(id: $id) {
              profileListViews(profileTypeId: $profileTypeId) {
                id
                isDefault
              }
            }
          }
        `,
        {
          id: toGlobalId("ProfileListView", customView.id),
          profileTypeId: toGlobalId("ProfileType", legalEntity.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
