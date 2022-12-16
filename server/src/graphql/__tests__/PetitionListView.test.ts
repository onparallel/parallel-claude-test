import { gql } from "graphql-request";
import { Knex } from "knex";
import { omit } from "remeda";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, PetitionListView, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/PetitionListView", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let defaultView: PetitionListView;
  let organization: Organization;
  let user: User;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization());

    [defaultView] = await mocks.knex.from("petition_list_view").insert(
      {
        is_default: true,
        user_id: user.id,
        filters: {
          status: ["CLOSED"],
          signature: ["COMPLETED"],
          sharedWith: {
            filters: [
              {
                operator: "SHARED_WITH",
                value: user.id,
              },
            ],
            operator: "AND",
          },
        },
        sort_by: "createdAt_ASC",
        name: "my default view",
        position: 0,
      },
      "*"
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  afterEach(async () => {
    await mocks.knex.from("petition_list_view").whereNot("id", defaultView.id).delete();
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
              filters {
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
                tags
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
              id: toGlobalId("PetitionListView", defaultView.id),
              isDefault: true,
              filters: {
                status: ["CLOSED"],
                signature: ["COMPLETED"],
                fromTemplateId: null,
                path: null,
                search: null,
                searchIn: null,
                sharedWith: {
                  filters: [{ operator: "SHARED_WITH", value: toGlobalId("User", user.id) }],
                  operator: "AND",
                },
                tags: null,
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
          mutation (
            $name: String!
            $filters: PetitionListViewFiltersInput
            $sortBy: QueryPetitions_OrderBy
          ) {
            createPetitionListView(name: $name, filters: $filters, sortBy: $sortBy) {
              id
              name
              isDefault
              sortBy
              filters {
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
                tags
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
          sortBy: "sentAt_ASC",
          filters: {
            search: "aaa",
            searchIn: "CURRENT_FOLDER",
            signature: ["NO_SIGNATURE", "PENDING_START"],
            status: ["COMPLETED", "DRAFT"],
            tags: [],
            path: "/2022/",
          },
        }
      );

      expect(errors).toBeUndefined();
      expect(omit(data?.createPetitionListView, ["id"])).toEqual({
        name: "my first view",
        isDefault: false,
        sortBy: "sentAt_ASC",
        filters: {
          fromTemplateId: null,
          path: "/2022/",
          search: "aaa",
          searchIn: "CURRENT_FOLDER",
          sharedWith: null,
          signature: ["NO_SIGNATURE", "PENDING_START"],
          status: ["COMPLETED", "DRAFT"],
          tags: [],
        },
        user: {
          petitionListViews: [
            { id: toGlobalId("PetitionListView", defaultView.id), isDefault: true },
            { id: data!.createPetitionListView.id, isDefault: false },
          ],
        },
      });
    });
  });

  describe("updatePetitionListView", () => {
    it("updates a petition list view", async () => {
      const [tag] = await mocks.createRandomTags(organization.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionListViewId: GID!, $data: UpdatePetitionListViewInput!) {
            updatePetitionListView(petitionListViewId: $petitionListViewId, data: $data) {
              id
              name
              sortBy
              filters {
                signature
                status
                tags
                sharedWith {
                  filters {
                    operator
                    value
                  }
                  operator
                }
              }
            }
          }
        `,
        {
          petitionListViewId: toGlobalId("PetitionListView", defaultView.id),
          data: {
            name: "updated name",
            sortBy: null,
            filters: {
              status: null,
              tags: [toGlobalId("Tag", tag.id)],
            },
          },
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionListView).toEqual({
        id: toGlobalId("PetitionListView", defaultView.id),
        name: "updated name",
        sortBy: null,
        filters: {
          status: null,
          signature: ["COMPLETED"],
          tags: [toGlobalId("Tag", tag.id)],
          sharedWith: {
            filters: [{ operator: "SHARED_WITH", value: toGlobalId("User", user.id) }],
            operator: "AND",
          },
        },
      });
    });
  });

  describe("markPetitionListViewAsDefault", () => {
    let secondViewGID: string;
    beforeEach(async () => {
      const { data } = await testClient.execute(
        gql`
          mutation (
            $name: String!
            $filters: PetitionListViewFiltersInput
            $sortBy: QueryPetitions_OrderBy
          ) {
            createPetitionListView(name: $name, filters: $filters, sortBy: $sortBy) {
              id
            }
          }
        `,
        {
          name: "closed petitions from 2022 folder",
          sortBy: null,
          filters: {
            status: ["CLOSED"],
            path: "/2022/",
          },
        }
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
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.markPetitionListViewAsDefault).toEqual({
        id: toGlobalId("User", user.id),
        petitionListViews: [
          { id: toGlobalId("PetitionListView", defaultView.id), isDefault: false },
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
        { petitionListViewId: null }
      );

      expect(errors).toBeUndefined();
      expect(data?.markPetitionListViewAsDefault).toEqual({
        id: toGlobalId("User", user.id),
        petitionListViews: [
          { id: toGlobalId("PetitionListView", defaultView.id), isDefault: false },
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
          mutation (
            $name: String!
            $filters: PetitionListViewFiltersInput
            $sortBy: QueryPetitions_OrderBy
          ) {
            createPetitionListView(name: $name, filters: $filters, sortBy: $sortBy) {
              id
            }
          }
        `,
        {
          name: "closed petitions from 2022 folder",
          sortBy: null,
          filters: {
            status: ["CLOSED"],
            path: "/2022/",
          },
        }
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
          ids: [secondViewGID, toGlobalId("PetitionListView", defaultView.id)],
        }
      );
      expect(errors).toBeUndefined();
      expect(data?.reorderPetitionListViews).toEqual({
        petitionListViews: [
          { id: secondViewGID },
          { id: toGlobalId("PetitionListView", defaultView.id) },
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
        }
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
          id: toGlobalId("PetitionListView", defaultView.id),
        }
      );
      expect(errors).toBeUndefined();
      expect(data?.deletePetitionListView).toEqual({
        petitionListViews: [],
      });
    });
  });
});
