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
        data: {
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
          path: "/",
          search: null,
          searchIn: "EVERYWHERE",
          fromTemplateId: null,
          sort: { field: "sentAt", direction: "ASC" },
        },
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
                tags
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
              id: toGlobalId("PetitionListView", defaultView.id),
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
                tags: null,
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
          mutation ($name: String!, $data: PetitionListViewDataInput) {
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
                tags
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
            tags: [],
            path: "/2022/",
            sharedWith: null,
            fromTemplateId: null,
            sort: { field: "sentAt", direction: "ASC" },
          },
        }
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
          tags: [],
          sort: { field: "sentAt", direction: "ASC" },
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
                tags
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
          petitionListViewId: toGlobalId("PetitionListView", defaultView.id),
          name: "updated name",
          data: {
            fromTemplateId: null,
            path: "/",
            search: null,
            searchIn: "EVERYWHERE",
            sharedWith: null,
            signature: null,
            status: null,
            tags: [toGlobalId("Tag", tag.id)],
            sort: null,
          },
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionListView).toEqual({
        id: toGlobalId("PetitionListView", defaultView.id),
        name: "updated name",
        data: {
          status: null,
          signature: null,
          tags: [toGlobalId("Tag", tag.id)],
          sharedWith: null,
          sort: null,
        },
      });
    });
  });

  describe("markPetitionListViewAsDefault", () => {
    let secondViewGID: string;
    beforeEach(async () => {
      const { data } = await testClient.execute(
        gql`
          mutation ($name: String!, $data: PetitionListViewDataInput) {
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
            tags: null,
            status: ["CLOSED"],
            path: "/2022/",
            sort: null,
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
          mutation ($name: String!, $data: PetitionListViewDataInput) {
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
