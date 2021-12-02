import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, User, UserGroup } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("Petition Filters", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let sessionUser: User;
  let users: User[];
  let userGroup: UserGroup;

  let petitions: Petition[];

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    let organization: Organization;

    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization());

    users = await mocks.createRandomUsers(organization.id, 3);
    [userGroup] = await mocks.createUserGroups(1, organization.id);
    await mocks.insertUserGroupMembers(userGroup.id, [sessionUser.id, users[0].id]);

    petitions = await mocks.createRandomPetitions(organization.id, sessionUser.id, 4);

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
    await mocks.sharePetitions([otherPetition.id], sessionUser.id, "READ"); // [4]
    await mocks.sharePetitions([otherPetition.id], users[2].id, "READ"); // [4]
  });

  afterAll(async () => {
    await testClient.stop();
  });

  it("petitions owned by me", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
        filters: {
          sharedWith: {
            operator: "AND",
            filters: [
              {
                operator: "IS_OWNER",
                value: toGlobalId("User", sessionUser.id),
              },
            ],
          },
        },
      },
    });
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
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
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
    });
    expect(errors).toBeUndefined();
    expect(data?.petitions).toEqual({
      items: [],
    });
  });

  it("petitions shared with a user through a group", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
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
    });
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
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
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
    });
    expect(errors).toBeUndefined();
    expect(data?.petitions).toEqual({
      items: [
        { id: toGlobalId("Petition", petitions[3].id) },
        { id: toGlobalId("Petition", petitions[4].id) },
      ],
    });
  });

  it("petitions shared with a user group", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
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
    });
    expect(errors).toBeUndefined();
    expect(data?.petitions).toEqual({
      items: [
        { id: toGlobalId("Petition", petitions[1].id) },
        { id: toGlobalId("Petition", petitions[3].id) },
      ],
    });
  });

  it("petitions shared with me and other user", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
        filters: {
          sharedWith: {
            operator: "AND",
            filters: [
              {
                operator: "SHARED_WITH",
                value: toGlobalId("User", sessionUser.id),
              },
              {
                operator: "SHARED_WITH",
                value: toGlobalId("User", users[2].id),
              },
            ],
          },
        },
      },
    });
    expect(errors).toBeUndefined();
    expect(data?.petitions).toEqual({
      items: [
        { id: toGlobalId("Petition", petitions[3].id) },
        { id: toGlobalId("Petition", petitions[4].id) },
      ],
    });
  });

  it("petitions owned by other user", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
        filters: {
          sharedWith: {
            operator: "AND",
            filters: [
              {
                operator: "IS_OWNER",
                value: toGlobalId("UserGroup", users[1].id),
              },
            ],
          },
        },
      },
    });
    expect(errors).toBeUndefined();
    expect(data?.petitions).toEqual({
      items: [{ id: toGlobalId("Petition", petitions[4].id) }],
    });
  });

  it("petitions not shared with a user group", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
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
    });
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
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
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
    });
    expect(errors).toBeUndefined();
    expect(data?.petitions).toEqual({
      items: [
        { id: toGlobalId("Petition", petitions[3].id) },
        { id: toGlobalId("Petition", petitions[4].id) },
      ],
    });
  });

  it("petitions not shared with a user", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
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
    });
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
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
        filters: {
          sharedWith: {
            operator: "AND",
            filters: [
              {
                operator: "IS_OWNER",
                value: toGlobalId("User", sessionUser.id),
              },
              {
                operator: "NOT_SHARED_WITH",
                value: toGlobalId("UserGroup", userGroup.id),
              },
            ],
          },
        },
      },
    });
    expect(errors).toBeUndefined();
    expect(data?.petitions).toEqual({
      items: [
        { id: toGlobalId("Petition", petitions[0].id) },
        { id: toGlobalId("Petition", petitions[2].id) },
      ],
    });
  });

  it("sends error when passing a globalId value different than User or UserGroup", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($filters: PetitionFilter) {
          petitions(limit: 10, filters: $filters) {
            items {
              id
            }
          }
        }
      `,
      variables: {
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
    });
    expect(errors).toContainGraphQLError("INVALID_FILTER");
    expect(data).toBeNull();
  });
});
