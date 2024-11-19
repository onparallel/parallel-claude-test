import gql from "graphql-tag";
import { Knex } from "knex";
import { omit } from "remeda";
import { Organization, PetitionListView, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/PetitionListView", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let customView: PetitionListView;
  let allView: PetitionListView;
  let organization: Organization;
  let user: User;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization());

    [allView, customView] = await mocks.knex.from("petition_list_view").insert(
      [
        {
          is_default: false,
          user_id: user.id,
          data: {
            path: "/",
            sort: null,
            tags: null,
            search: null,
            status: null,
            searchIn: "EVERYWHERE",
            signature: null,
            sharedWith: null,
            fromTemplateId: null,
          },
          name: "ALL",
          position: 0,
          view_type: "ALL",
        },
        {
          is_default: true,
          user_id: user.id,
          data: {
            status: ["CLOSED"],
            signature: ["COMPLETED"],
            sharedWith: {
              filters: [
                {
                  operator: "SHARED_WITH",
                  value: toGlobalId("User", user.id),
                },
              ],
              operator: "AND",
            },
            path: "/",
            search: null,
            searchIn: "EVERYWHERE",
            fromTemplateId: null,
            sort: { field: "sentAt", direction: "ASC" },
          },
          name: "my default view",
          position: 1,
        },
      ],
      "*",
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  afterEach(async () => {
    await mocks.knex
      .from("petition_list_view")
      .whereNotIn("id", [customView.id, allView.id])
      .delete();
  });

  describe("queries", () => {
    it("queries the user's petition list views", async () => {
      const { errors, data } = await testClient.execute(gql`
        query {
          me {
            id
            petitionListViews {
              id
              isDefault
              data {
                status
                signature
                fromTemplateId
                path
                search
                searchIn
                sharedWith {
                  filters {
                    operator
                    value
                  }
                  operator
                }
                tagsFilters {
                  __typename
                }
                sort {
                  field
                  direction
                }
              }
            }
          }
        }
      `);

      expect(errors).toBeUndefined();
      expect(data).toEqual({
        me: {
          id: toGlobalId("User", user.id),
          petitionListViews: [
            {
              id: toGlobalId("PetitionListView", allView.id),
              isDefault: false,
              data: {
                status: null,
                signature: null,
                fromTemplateId: null,
                path: "/",
                search: null,
                searchIn: "EVERYWHERE",
                sharedWith: null,
                tagsFilters: null,
                sort: null,
              },
            },
            {
              id: toGlobalId("PetitionListView", customView.id),
              isDefault: true,
              data: {
                status: ["CLOSED"],
                signature: ["COMPLETED"],
                fromTemplateId: null,
                path: "/",
                search: null,
                searchIn: "EVERYWHERE",
                sharedWith: {
                  filters: [{ operator: "SHARED_WITH", value: toGlobalId("User", user.id) }],
                  operator: "AND",
                },
                tagsFilters: null,
                sort: { field: "sentAt", direction: "ASC" },
              },
            },
          ],
        },
      });
    });
  });

  describe("createPetitionListView", () => {
    it("creates a new view with custom filters and sorting", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($name: String!, $data: PetitionListViewDataInput!) {
            createPetitionListView(name: $name, data: $data) {
              id
              name
              isDefault
              data {
                fromTemplateId
                path
                search
                searchIn
                sharedWith {
                  filters {
                    operator
                    value
                  }
                  operator
                }
                signature
                status
                tagsFilters {
                  filters {
                    operator
                    value
                  }
                  operator
                }
                sort {
                  field
                  direction
                }
              }
              user {
                petitionListViews {
                  id
                  isDefault
                }
              }
            }
          }
        `,
        {
          name: "my first view",
          data: {
            search: "aaa",
            searchIn: "CURRENT_FOLDER",
            signature: ["NO_SIGNATURE", "PENDING_START"],
            status: ["COMPLETED", "DRAFT"],
            tagsFilters: {
              filters: [
                {
                  value: [],
                  operator: "IS_EMPTY",
                },
              ],
              operator: "AND",
            },
            path: "/2022/",
            sharedWith: null,
            fromTemplateId: null,
            sort: { field: "sentAt", direction: "ASC" },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(omit(data?.createPetitionListView, ["id"])).toEqual({
        name: "my first view",
        isDefault: false,
        data: {
          fromTemplateId: null,
          path: "/2022/",
          search: "aaa",
          searchIn: "CURRENT_FOLDER",
          sharedWith: null,
          signature: ["NO_SIGNATURE", "PENDING_START"],
          status: ["COMPLETED", "DRAFT"],
          tagsFilters: {
            filters: [
              {
                value: [],
                operator: "IS_EMPTY",
              },
            ],
            operator: "AND",
          },
          sort: { field: "sentAt", direction: "ASC" },
        },
        user: {
          petitionListViews: [
            { id: toGlobalId("PetitionListView", allView.id), isDefault: false },
            { id: toGlobalId("PetitionListView", customView.id), isDefault: true },
            { id: data!.createPetitionListView.id, isDefault: false },
          ],
        },
      });
    });
  });

  describe("updatePetitionListView", () => {
    it("updates a custom petition list view", async () => {
      const [tag] = await mocks.createRandomTags(organization.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionListViewId: GID!, $name: String, $data: PetitionListViewDataInput) {
            updatePetitionListView(
              petitionListViewId: $petitionListViewId
              name: $name
              data: $data
            ) {
              id
              name
              data {
                signature
                status
                tagsFilters {
                  filters {
                    operator
                    value
                  }
                  operator
                }
                sharedWith {
                  filters {
                    operator
                    value
                  }
                  operator
                }
                sort {
                  field
                  direction
                }
              }
            }
          }
        `,
        {
          petitionListViewId: toGlobalId("PetitionListView", customView.id),
          name: "updated name",
          data: {
            fromTemplateId: null,
            path: "/",
            search: null,
            searchIn: "EVERYWHERE",
            sharedWith: null,
            signature: null,
            status: null,
            tagsFilters: {
              filters: [
                {
                  value: [toGlobalId("Tag", tag.id)],
                  operator: "CONTAINS",
                },
              ],
              operator: "AND",
            },
            sort: null,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionListView).toEqual({
        id: toGlobalId("PetitionListView", customView.id),
        name: "updated name",
        data: {
          status: null,
          signature: null,
          tagsFilters: {
            filters: [
              {
                value: [toGlobalId("Tag", tag.id)],
                operator: "CONTAINS",
              },
            ],
            operator: "AND",
          },
          sharedWith: null,
          sort: null,
        },
      });
    });

    it("sends error if trying to update the name of an ALL type view", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionListViewId: GID!, $name: String) {
            updatePetitionListView(petitionListViewId: $petitionListViewId, name: $name) {
              id
            }
          }
        `,
        {
          petitionListViewId: toGlobalId("PetitionListView", allView.id),
          name: "updated name",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to update filters of an ALL type view", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionListViewId: GID!, $data: PetitionListViewDataInput) {
            updatePetitionListView(petitionListViewId: $petitionListViewId, data: $data) {
              id
            }
          }
        `,
        {
          petitionListViewId: toGlobalId("PetitionListView", allView.id),
          data: {
            fromTemplateId: null,
            path: "/",
            search: null,
            searchIn: "EVERYWHERE",
            sharedWith: null,
            signature: null,
            status: null,
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("updates columns and sorting of an ALL type view", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionListViewId: GID!, $data: PetitionListViewDataInput) {
            updatePetitionListView(petitionListViewId: $petitionListViewId, data: $data) {
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
          petitionListViewId: toGlobalId("PetitionListView", allView.id),
          data: {
            columns: ["name", "recipients", "reminders", "sentAt"],
            sort: {
              field: "lastActivityAt",
              direction: "ASC",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionListView).toEqual({
        id: toGlobalId("PetitionListView", allView.id),
        data: {
          sort: {
            field: "lastActivityAt",
            direction: "ASC",
          },
          columns: ["name", "recipients", "reminders", "sentAt"],
        },
      });
    });
  });

  describe("markPetitionListViewAsDefault", () => {
    let secondViewGID: string;
    beforeEach(async () => {
      const { data } = await testClient.execute(
        gql`
          mutation ($name: String!, $data: PetitionListViewDataInput!) {
            createPetitionListView(name: $name, data: $data) {
              id
            }
          }
        `,
        {
          name: "closed petitions from 2022 folder",
          data: {
            fromTemplateId: null,
            search: null,
            searchIn: "EVERYWHERE",
            sharedWith: null,
            signature: null,
            tagsFilters: null,
            status: ["CLOSED"],
            path: "/2022/",
            sort: null,
          },
        },
      );
      secondViewGID = data!.createPetitionListView.id;
    });

    it("marks view as default", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionListViewId: GID) {
            markPetitionListViewAsDefault(petitionListViewId: $petitionListViewId) {
              id
              petitionListViews {
                id
                isDefault
              }
            }
          }
        `,
        {
          petitionListViewId: secondViewGID,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.markPetitionListViewAsDefault).toEqual({
        id: toGlobalId("User", user.id),
        petitionListViews: [
          { id: toGlobalId("PetitionListView", allView.id), isDefault: false },
          { id: toGlobalId("PetitionListView", customView.id), isDefault: false },
          { id: secondViewGID, isDefault: true },
        ],
      });
    });

    it("passing null id sets every view as non default", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionListViewId: GID) {
            markPetitionListViewAsDefault(petitionListViewId: $petitionListViewId) {
              id
              petitionListViews {
                id
                isDefault
              }
            }
          }
        `,
        { petitionListViewId: null },
      );

      expect(errors).toBeUndefined();
      expect(data?.markPetitionListViewAsDefault).toEqual({
        id: toGlobalId("User", user.id),
        petitionListViews: [
          { id: toGlobalId("PetitionListView", allView.id), isDefault: false },
          { id: toGlobalId("PetitionListView", customView.id), isDefault: false },
          { id: secondViewGID, isDefault: false },
        ],
      });
    });
  });

  describe("reorderPetitionListViews", () => {
    let secondViewGID: string;
    beforeEach(async () => {
      const { data } = await testClient.execute(
        gql`
          mutation ($name: String!, $data: PetitionListViewDataInput!) {
            createPetitionListView(name: $name, data: $data) {
              id
            }
          }
        `,
        {
          name: "closed petitions from 2022 folder",
          data: {
            status: ["CLOSED"],
            path: "/2022/",
            sort: null,
          },
        },
      );
      secondViewGID = data!.createPetitionListView.id;
    });

    it("sorts the petition list views", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($ids: [GID!]!) {
            reorderPetitionListViews(ids: $ids) {
              petitionListViews {
                id
              }
            }
          }
        `,
        {
          ids: [
            toGlobalId("PetitionListView", allView.id),
            secondViewGID,
            toGlobalId("PetitionListView", customView.id),
          ],
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.reorderPetitionListViews).toEqual({
        petitionListViews: [
          { id: toGlobalId("PetitionListView", allView.id) },
          { id: secondViewGID },
          { id: toGlobalId("PetitionListView", customView.id) },
        ],
      });
    });

    it("sends error when passing incomplete array", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($ids: [GID!]!) {
            reorderPetitionListViews(ids: $ids) {
              petitionListViews {
                id
              }
            }
          }
        `,
        {
          ids: [secondViewGID],
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitionListView", () => {
    it("deletes a petition list view", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!) {
            deletePetitionListView(id: $id) {
              petitionListViews {
                id
              }
            }
          }
        `,
        {
          id: toGlobalId("PetitionListView", customView.id),
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.deletePetitionListView).toEqual({
        petitionListViews: [
          {
            id: toGlobalId("PetitionListView", allView.id),
          },
        ],
      });
    });

    it("sends error if trying to delete an ALL type view", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!) {
            deletePetitionListView(id: $id) {
              petitionListViews {
                id
              }
            }
          }
        `,
        {
          id: toGlobalId("PetitionListView", allView.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
