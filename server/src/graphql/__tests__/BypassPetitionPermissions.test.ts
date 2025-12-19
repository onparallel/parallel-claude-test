import { gql } from "graphql-request";
import { Knex } from "knex";
import { Organization, Petition, User, UserGroup } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("Bypass Petition Permissions", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let organization: Organization;
  let user: User;
  let otherUsers: User[];

  let bypassGroup: UserGroup;

  let petitions: Petition[];

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user: user } = await mocks.createSessionUserAndOrganization());

    otherUsers = await mocks.createRandomUsers(organization.id, 2);
    [bypassGroup] = await mocks.createUserGroups(1, organization.id, [
      { effect: "GRANT", name: "PETITIONS:BYPASS_PERMISSIONS" },
    ]);
    await mocks.insertUserGroupMembers(bypassGroup.id, [user.id]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  beforeEach(async () => {
    petitions = [
      ...(await mocks.createRandomPetitions(organization.id, user.id, 3)),
      ...(await mocks.createRandomPetitions(organization.id, otherUsers[0].id, 2)),
      ...(await mocks.createRandomPetitions(organization.id, otherUsers[1].id, 1)),
    ];

    await mocks.sharePetitions([petitions[0].id], otherUsers[0].id, "READ");
    await mocks.sharePetitions([petitions[3].id], otherUsers[1].id, "WRITE");
  });

  afterEach(async () => {
    await mocks.knex.from("petition").update({ deleted_at: new Date() });
  });

  it("bypass user should not be present on the petition permissions list but have an effective OWNER permission", async () => {
    const { errors, data } = await testClient.execute(
      gql`
        query ($petitionId: GID!) {
          petition(id: $petitionId) {
            effectivePermissions {
              user {
                id
              }
              permissionType
              isSubscribed
            }
            myEffectivePermission {
              isSubscribed
              permissionType
              user {
                id
              }
            }
          }
        }
      `,
      { petitionId: toGlobalId("Petition", petitions[3].id) },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      effectivePermissions: expect.toIncludeSameMembers([
        {
          user: {
            id: toGlobalId("User", otherUsers[0].id),
          },
          permissionType: "OWNER",
          isSubscribed: true,
        },
        {
          user: {
            id: toGlobalId("User", otherUsers[1].id),
          },
          permissionType: "WRITE",
          isSubscribed: true,
        },
      ]),
      myEffectivePermission: {
        isSubscribed: false,
        permissionType: "OWNER",
        user: {
          id: toGlobalId("User", user.id),
        },
      },
    });
  });

  it("user on a group with BYPASS permissions should have OWNER access to all petitions in their organization", async () => {
    const { errors, data } = await testClient.execute(gql`
      query {
        petitions(limit: 100, offset: 0, filters: { type: PETITION }) {
          totalCount
          items {
            ... on Petition {
              id
              effectivePermissions {
                user {
                  id
                }
                permissionType
              }
              myEffectivePermission {
                permissionType
                user {
                  id
                }
              }
            }
          }
        }
      }
    `);

    expect(errors).toBeUndefined();
    expect(data?.petitions).toEqual({
      totalCount: 6,
      items: [
        {
          id: toGlobalId("Petition", petitions[0].id),
          effectivePermissions: expect.toIncludeSameMembers([
            {
              user: {
                id: toGlobalId("User", user.id),
              },
              permissionType: "OWNER",
            },
            {
              user: {
                id: toGlobalId("User", otherUsers[0].id),
              },
              permissionType: "READ",
            },
          ]),
          myEffectivePermission: {
            permissionType: "OWNER",
            user: {
              id: toGlobalId("User", user.id),
            },
          },
        },
        {
          id: toGlobalId("Petition", petitions[1].id),
          effectivePermissions: expect.toIncludeSameMembers([
            {
              user: {
                id: toGlobalId("User", user.id),
              },
              permissionType: "OWNER",
            },
          ]),
          myEffectivePermission: {
            permissionType: "OWNER",
            user: {
              id: toGlobalId("User", user.id),
            },
          },
        },
        {
          id: toGlobalId("Petition", petitions[2].id),
          effectivePermissions: expect.toIncludeSameMembers([
            {
              user: {
                id: toGlobalId("User", user.id),
              },
              permissionType: "OWNER",
            },
          ]),
          myEffectivePermission: {
            permissionType: "OWNER",
            user: {
              id: toGlobalId("User", user.id),
            },
          },
        },
        {
          id: toGlobalId("Petition", petitions[3].id),
          effectivePermissions: expect.toIncludeSameMembers([
            {
              user: {
                id: toGlobalId("User", otherUsers[0].id),
              },
              permissionType: "OWNER",
            },
            {
              user: {
                id: toGlobalId("User", otherUsers[1].id),
              },
              permissionType: "WRITE",
            },
          ]),
          myEffectivePermission: {
            permissionType: "OWNER",
            user: {
              id: toGlobalId("User", user.id),
            },
          },
        },
        {
          id: toGlobalId("Petition", petitions[4].id),
          effectivePermissions: expect.toIncludeSameMembers([
            {
              user: {
                id: toGlobalId("User", otherUsers[0].id),
              },
              permissionType: "OWNER",
            },
          ]),
          myEffectivePermission: {
            permissionType: "OWNER",
            user: {
              id: toGlobalId("User", user.id),
            },
          },
        },
        {
          id: toGlobalId("Petition", petitions[5].id),
          effectivePermissions: expect.toIncludeSameMembers([
            {
              user: {
                id: toGlobalId("User", otherUsers[1].id),
              },
              permissionType: "OWNER",
            },
          ]),
          myEffectivePermission: {
            permissionType: "OWNER",
            user: {
              id: toGlobalId("User", user.id),
            },
          },
        },
      ],
    });
  });

  it("'sharedWith' petitions filter should not include bypass users", async () => {
    const { errors, data } = await testClient.execute(
      gql`
        query ($sharedWith: PetitionSharedWithFilter) {
          petitions(limit: 100, offset: 0, filters: { type: PETITION, sharedWith: $sharedWith }) {
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
        sharedWith: {
          operator: "AND",
          filters: [
            {
              operator: "SHARED_WITH",
              value: toGlobalId("User", user.id),
            },
          ],
        },
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petitions).toEqual({
      totalCount: 3,
      items: [
        { id: toGlobalId("Petition", petitions[0].id) },
        { id: toGlobalId("Petition", petitions[1].id) },
        { id: toGlobalId("Petition", petitions[2].id) },
      ],
    });
  });

  it("bypass user should be able to perform an OWNER-only action on a petition not shared with them", async () => {
    const { errors, data } = await testClient.execute(
      gql`
        mutation ($petitionId: GID!, $userId: GID!) {
          transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
            id
            permissions {
              permissionType
              ... on PetitionUserPermission {
                user {
                  id
                }
              }
            }
          }
        }
      `,
      {
        petitionId: toGlobalId("Petition", petitions[3].id),
        userId: toGlobalId("User", user.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data.transferPetitionOwnership).toEqual([
      {
        id: toGlobalId("Petition", petitions[3].id),
        permissions: [
          {
            permissionType: "OWNER",
            user: {
              id: toGlobalId("User", user.id),
            },
          },
          {
            permissionType: "WRITE",
            user: {
              id: toGlobalId("User", otherUsers[0].id),
            },
          },
          {
            permissionType: "WRITE",
            user: {
              id: toGlobalId("User", otherUsers[1].id),
            },
          },
        ],
      },
    ]);
  });

  it("bypass user should be able to delete a petition not shared with them", async () => {
    const { errors, data } = await testClient.execute(
      gql`
        mutation ($petitionId: GID!) {
          deletePetitions(ids: [$petitionId])
        }
      `,
      {
        petitionId: toGlobalId("Petition", petitions[3].id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.deletePetitions).toEqual("SUCCESS");

    const dbPetition = await mocks.knex
      .from("petition")
      .where("id", petitions[3].id)
      .select("id", "deletion_scheduled_at", "deleted_at");

    expect(dbPetition).toEqual([
      { id: petitions[3].id, deletion_scheduled_at: expect.any(Date), deleted_at: null },
    ]);
  });

  it("bypass user should be able to restore a petition not shared with them", async () => {
    await mocks.knex
      .from("petition")
      .where("id", petitions[3].id)
      .update({ deletion_scheduled_at: new Date() });

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($petitionId: GID!) {
          recoverPetitionsFromDeletion(ids: [$petitionId])
        }
      `,
      {
        petitionId: toGlobalId("Petition", petitions[3].id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.recoverPetitionsFromDeletion).toEqual("SUCCESS");

    const dbPetition = await mocks.knex
      .from("petition")
      .where("id", petitions[3].id)
      .select("id", "deletion_scheduled_at", "deleted_at");

    expect(dbPetition).toEqual([
      { id: petitions[3].id, deletion_scheduled_at: null, deleted_at: null },
    ]);
  });

  it("bypass user should be able to delete a folder with petitions not shared with them", async () => {
    await mocks.knex
      .from("petition")
      .whereIn(
        "id",
        [0, 1, 2, 3].map((i) => petitions[i].id),
      )
      .update({ path: "/common/" });

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($folders: FoldersInput) {
          deletePetitions(folders: $folders, force: true)
        }
      `,
      {
        folders: {
          type: "PETITION",
          folderIds: [toGlobalId("PetitionFolder", "/common/")],
        },
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.deletePetitions).toEqual("SUCCESS");

    const dbPetitions = await mocks.knex
      .from("petition")
      .whereIn(
        "id",
        [0, 1, 2, 3].map((i) => petitions[i].id),
      )
      .orderBy("id", "asc")
      .select("id", "deletion_scheduled_at", "deleted_at");

    expect(dbPetitions).toEqual([
      { id: petitions[0].id, deletion_scheduled_at: expect.any(Date), deleted_at: null },
      { id: petitions[1].id, deletion_scheduled_at: expect.any(Date), deleted_at: null },
      { id: petitions[2].id, deletion_scheduled_at: expect.any(Date), deleted_at: null },
      { id: petitions[3].id, deletion_scheduled_at: expect.any(Date), deleted_at: null },
    ]);
  });

  it("bypass user should be able to list the full folder structure of the organization", async () => {
    const paths = ["/", "/A/", "/A/AA/", "/B/", "/B/BA/BAA/", "/B/BA/BAB/"];
    for (const path of paths) {
      const index = paths.indexOf(path);
      await mocks.knex.from("petition").where("id", petitions[index].id).update({ path });
    }
    const { errors, data } = await testClient.execute(gql`
      query {
        petitionFolders(type: PETITION)
      }
    `);

    expect(errors).toBeUndefined();
    expect(data?.petitionFolders).toEqual([
      "/A/",
      "/A/AA/",
      "/B/",
      "/B/BA/",
      "/B/BA/BAA/",
      "/B/BA/BAB/",
    ]);
  });

  it("bypass user should be able to move folders of petitions not shared with them, or shared with only READ access", async () => {
    const [readPetition] = await mocks.createRandomPetitions(organization.id, otherUsers[0].id, 1);
    await mocks.sharePetitions([readPetition.id], user.id, "READ");
    await mocks.knex
      .from("petition")
      .whereIn("id", [...petitions.map((p) => p.id), readPetition.id])
      .update({ path: "/common/" });

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($folderIds: [ID!]!) {
          movePetitions(
            folderIds: $folderIds
            source: "/"
            destination: "/new-folder/"
            type: PETITION
          )
        }
      `,
      {
        folderIds: [toGlobalId("PetitionFolder", "/common/")],
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.movePetitions).toEqual("SUCCESS");

    const dbPetitions = await mocks.knex
      .from("petition")
      .whereIn("id", [...petitions.map((p) => p.id), readPetition.id])
      .orderBy("id", "asc")
      .select("id", "path");

    expect(dbPetitions).toEqual([
      { id: petitions[0].id, path: "/new-folder/common/" },
      { id: petitions[1].id, path: "/new-folder/common/" },
      { id: petitions[2].id, path: "/new-folder/common/" },
      { id: petitions[3].id, path: "/new-folder/common/" },
      { id: petitions[4].id, path: "/new-folder/common/" },
      { id: petitions[5].id, path: "/new-folder/common/" },
      { id: readPetition.id, path: "/new-folder/common/" },
    ]);
  });

  it("bypass user should be able to rename folders of petitions not shared with them, or shared with only READ access", async () => {
    const [readPetition] = await mocks.createRandomPetitions(organization.id, otherUsers[0].id, 1);
    await mocks.sharePetitions([readPetition.id], user.id, "READ");

    await mocks.knex
      .from("petition")
      .whereIn("id", [...petitions.map((p) => p.id), readPetition.id])
      .update({ path: "/common/" });

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($folderId: ID!, $name: String!) {
          renameFolder(folderId: $folderId, name: $name, type: PETITION)
        }
      `,
      {
        folderId: toGlobalId("PetitionFolder", "/common/"),
        name: "new-folder",
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.renameFolder).toEqual("SUCCESS");

    const dbPetitions = await mocks.knex
      .from("petition")
      .whereIn("id", [...petitions.map((p) => p.id), readPetition.id])
      .orderBy("id", "asc")
      .select("id", "path");

    expect(dbPetitions).toEqual([
      { id: petitions[0].id, path: "/new-folder/" },
      { id: petitions[1].id, path: "/new-folder/" },
      { id: petitions[2].id, path: "/new-folder/" },
      { id: petitions[3].id, path: "/new-folder/" },
      { id: petitions[4].id, path: "/new-folder/" },
      { id: petitions[5].id, path: "/new-folder/" },
      { id: readPetition.id, path: "/new-folder/" },
    ]);
  });
});
