import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Petition, PetitionPermission, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("Petition Folders", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let user: User;
  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);
    ({ user } = await mocks.createSessionUserAndOrganization());
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("petitions", () => {
    it("searches a folder", async () => {
      const [petition] = await mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
        path: "/my-shared-folder/",
      }));
      const [group] = await mocks.createUserGroups(1, user.org_id);
      await mocks.insertUserGroupMembers(group.id, [user.id]);
      await mocks.sharePetitionWithGroups(petition.id, [group.id], "READ");

      const { errors, data } = await testClient.execute(
        gql`
          query ($search: String, $filters: PetitionFilter) {
            petitions(search: $search, offset: 0, limit: 100, filters: $filters) {
              totalCount
              items {
                __typename
                ... on PetitionBase {
                  petitionId: id
                }
                ... on PetitionFolder {
                  id
                  minimumPermissionType

                  petitionCount
                }
              }
            }
          }
        `,
        { search: "my-shared-folder", filters: { path: "/" } }
      );

      expect(errors).toBeUndefined();
      expect(data!.petitions).toEqual({
        totalCount: 1,
        items: [
          {
            __typename: "PetitionFolder",
            id: toGlobalId<string>("PetitionFolder", "/my-shared-folder/"),
            minimumPermissionType: "OWNER",
            petitionCount: 1,
          },
        ],
      });
    });
  });

  describe("petitionFolders", () => {
    beforeEach(async () => {
      await mocks.knex.from("petition").update({ deleted_at: new Date() });
      const paths = [
        "/",
        "/A/",
        "/A/AA/",
        "/B/",
        "/B/BA/BAA/",
        "/B/BA/BAB/",
        "/B/BB/BBA/",
        "/C/",
        "/D/",
      ];
      await mocks.createRandomPetitions(user.org_id, user.id, 30, (i) => ({
        path: paths[i % paths.length],
      }));
    });

    it("queries a list of the user's petition folders", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($type: PetitionBaseType!) {
            petitionFolders(type: $type)
          }
        `,
        { type: "PETITION" }
      );

      expect(errors).toBeUndefined();
      expect(data!.petitionFolders).toEqual([
        "/A/",
        "/A/AA/",
        "/B/",
        "/B/BA/",
        "/B/BA/BAA/",
        "/B/BA/BAB/",
        "/B/BB/",
        "/B/BB/BBA/",
        "/C/",
        "/D/",
      ]);
    });

    it("queries a list of the user's template folders", async () => {
      await mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
        is_template: true,
        path: "/templates-folder/",
      }));
      const { errors, data } = await testClient.execute(
        gql`
          query ($type: PetitionBaseType!) {
            petitionFolders(type: $type)
          }
        `,
        { type: "TEMPLATE" }
      );

      expect(errors).toBeUndefined();
      expect(data!.petitionFolders).toEqual(["/templates-folder/"]);
    });

    it("ignores paths on petitions of other organization users", async () => {
      const [otherUser] = await mocks.createRandomUsers(user.org_id, 1);
      await mocks.createRandomPetitions(otherUser.org_id, otherUser.id, 1, () => ({
        path: "/PRIVATE/PATH/",
      }));
      const { apiKey } = await mocks.createUserAuthToken("api-token", otherUser.id);

      const { errors, data } = await testClient.withApiKey(apiKey).execute(
        gql`
          query ($type: PetitionBaseType!) {
            petitionFolders(type: $type)
          }
        `,
        { type: "PETITION" }
      );

      expect(errors).toBeUndefined();
      expect(data!.petitionFolders).toEqual(["/PRIVATE/", "/PRIVATE/PATH/"]);
    });

    it("splits paths on all levels", async () => {
      await mocks.knex.from("petition").update("deleted_at", new Date());
      await mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
        path: "/A/B/C/D/",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          query ($type: PetitionBaseType!) {
            petitionFolders(type: $type)
          }
        `,
        { type: "PETITION" }
      );

      expect(errors).toBeUndefined();
      expect(data!.petitionFolders).toEqual(["/A/", "/A/B/", "/A/B/C/", "/A/B/C/D/"]);
    });
  });

  describe("movePetitions", () => {
    afterEach(async () => {
      await mocks.knex.from("petition").update({ deleted_at: new Date() });
    });

    it("moves a petition to a folder", async () => {
      const [petition] = await mocks.createRandomPetitions(user.org_id, user.id, 1);
      expect(petition.path).toEqual("/");

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          ids: [toGlobalId("Petition", petition.id)],
          source: "/",
          destination: "/new-folder/",
          type: "PETITION",
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.movePetitions).toEqual("SUCCESS");

      const [petitionAfter] = await mocks.knex
        .from("petition")
        .where("id", petition.id)
        .select("*");

      expect(petitionAfter.path).toEqual("/new-folder/");
    });

    it("moves a petition to the root", async () => {
      const [petition] = await mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
        path: "/A/B/C/",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          ids: [toGlobalId("Petition", petition.id)],
          source: "/A/B/C/",
          destination: "/",
          type: "PETITION",
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.movePetitions).toEqual("SUCCESS");

      const [petitionAfter] = await mocks.knex
        .from("petition")
        .where("id", petition.id)
        .select("*");

      expect(petitionAfter.path).toEqual("/");
    });

    it("moves a folder with petitions to another folder", async () => {
      /*
        /
        ├─ spanish/
        │   └─ clients/
        │       ├─ [petition1]
        │       ├─ [petition2]
        │       └─ closed/
        │           └─ [petition5]
        └─ english/
            └─ clients/
                ├─ [petition3]
                └─ [petition4]

        movePetitions(
          folderIds: ["/spanish/clients/"],
          source:"/spanish/",
          destination: "/english/"
        )

        /
        └─ english/
            └─ clients/
                ├─ [petition1]
                ├─ [petition2]
                ├─ [petition3]
                ├─ [petition4]
                └─ closed/
                    └─ [petition5]
         */

      const petitions = await Promise.all([
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/spanish/clients/",
          name: `petition${i + 1}`,
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
          path: "/spanish/clients/closed/",
          name: "petition5",
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/english/clients/",
          name: `petition${i + 3}`,
        })),
      ]).then((p) => p.flat());

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          folderIds: [toGlobalId("PetitionFolder", "/spanish/clients/")],
          source: "/spanish/",
          destination: "/english/",
          type: "PETITION",
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.movePetitions).toEqual("SUCCESS");

      const after = await mocks.knex
        .from("petition")
        .whereIn(
          "id",
          petitions.map((p) => p.id)
        )
        .select("name", "path")
        .orderBy("name", "asc");

      expect(after).toEqual([
        { name: "petition1", path: "/english/clients/" },
        { name: "petition2", path: "/english/clients/" },
        { name: "petition3", path: "/english/clients/" },
        { name: "petition4", path: "/english/clients/" },
        { name: "petition5", path: "/english/clients/closed/" },
      ]);
    });

    it("fails when moving a folder with petitions to another folder inside of itself", async () => {
      /*
        /
        └─ spanish/
            └─ clients/
                ├─ [petition1]
                ├─ [petition2]
                ├─ drafts/
                │   └─ [petition3]
                └─ closed/
                    └─ [petition4]

        movePetitions(
          targets: ["/spanish/clients/"],
          source: "/spanish/",
          destination: "/spanish/clients/closed/"
        )
       */

      const petitions = await Promise.all([
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/spanish/clients/",
          name: `petition${i + 1}`,
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
          path: "/spanish/clients/drafts/",
          name: "petition3",
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
          path: "/spanish/clients/closed/",
          name: `petition4`,
        })),
      ]).then((p) => p.flat());

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          folderIds: [toGlobalId("PetitionFolder", "/spanish/clients/")],
          source: "/spanish/",
          destination: "/spanish/clients/closed/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
    });

    it("fails when target not in source", async () => {
      /*
        /
        ├─ spanish/
        │   ├─ [other-es]
        │   └─ clients/
        │       ├─ [kyc-1]
        │       ├─ [kyc-2]
        │       └─ lost/
        │           └─ [kyc-3]
        └─ english/
            ├─ [kyc-4]
            └─ [kyc-5]

        movePetitions(
          targets: ["/spanish/clients/", "kyc-4"],
          source: "/spanish/", 
          destination: "/closed/kyc/"
        )

      */

      const petitions = await Promise.all([
        mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
          path: "/spanish/",
          name: `other-es`,
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/spanish/clients/",
          name: `kyc-${i + 1}`,
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
          path: "/spanish/clients/lost/",
          name: `kyc-3`,
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/english/",
          name: `kyc-${i + 4}`,
        })),
      ]).then((p) => p.flat());

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          ids: [
            // kyc-4 is NOT in /spanish/
            toGlobalId("Petition", petitions.find((p) => p.name === "kyc-4")!.id),
          ],
          folderIds: [toGlobalId("PetitionFolder", "/spanish/clients/")],
          source: "/spanish/",
          destination: "/closed/kyc/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("moves a list of petitions and folders", async () => {
      /*
        /
        ├─ spanish/
        │   ├─ [kyc-1]
        │   ├─ [other-es]
        │   └─ clients/
        │       ├─ [kyc-2]
        │       ├─ [kyc-3]
        │       └─ lost/
        │           └─ [kyc-4]
        └─ english/
            └─ [kyc-5]

        movePetitions(
          targets: ["/spanish/clients/", "kyc-1"],
          source: "/spanish/",
          destination: "/closed/kyc/"
        )

        /
        ├─ spanish/
        │   └─ [other-es]
        ├─ english/
        │   └─ [kyc-5]
        └─ closed/
            └─ kyc/
                ├─ [kyc-1]
                └─ clients/
                    ├─ [kyc-2]
                    ├─ [kyc-3]
                    └─ lost/
                        └─ [kyc-4]
      */

      const petitions = await Promise.all([
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/spanish/",
          name: i === 0 ? `other-es` : "kyc-1",
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/spanish/clients/",
          name: `kyc-${i + 2}`,
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
          path: "/spanish/clients/lost/",
          name: `kyc-4`,
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
          path: "/english/",
          name: `kyc-5`,
        })),
      ]).then((p) => p.flat());

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          ids: [toGlobalId("Petition", petitions.find((p) => p.name === "kyc-1")!.id)],
          folderIds: [toGlobalId("PetitionFolder", "/spanish/clients/")],
          source: "/spanish/",
          destination: "/closed/kyc/",
          type: "PETITION",
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.movePetitions).toEqual("SUCCESS");

      const after = await mocks.knex
        .from("petition")
        .whereIn(
          "id",
          petitions.map((p) => p.id)
        )
        .select("name", "path")
        .orderBy("name", "asc");

      expect(after).toEqual([
        { name: "kyc-1", path: "/closed/kyc/" },
        { name: "kyc-2", path: "/closed/kyc/clients/" },
        { name: "kyc-3", path: "/closed/kyc/clients/" },
        { name: "kyc-4", path: "/closed/kyc/clients/lost/" },
        { name: "kyc-5", path: "/english/" },
        { name: "other-es", path: "/spanish/" },
      ]);
    });

    it("should move only my own petitions on the folder", async () => {
      const [myPetition] = await mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
        name: "a. mine",
        path: "/shared-folder/",
      }));

      const [otherUser] = await mocks.createRandomUsers(user.org_id, 1);
      const [otherPetition] = await mocks.createRandomPetitions(
        user.org_id,
        otherUser.id,
        1,
        () => ({
          name: "b. other",
          path: "/shared-folder/",
        })
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          folderIds: [toGlobalId("PetitionFolder", "/shared-folder/")],
          source: "/",
          destination: "/mine/",
          type: "PETITION",
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.movePetitions).toEqual("SUCCESS");

      const petitions = await mocks.knex
        .from("petition")
        .whereIn("id", [myPetition.id, otherPetition.id])
        .orderBy("name", "asc")
        .select("name", "path");

      expect(petitions).toEqual([
        {
          name: "a. mine",
          path: "/mine/shared-folder/",
        },
        {
          name: "b. other",
          path: "/shared-folder/",
        },
      ]);
    });

    it("should move only templates when sharing folder names with my petitions", async () => {
      const petitions = await mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
        is_template: i === 0,
        path: "/common/",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          folderIds: [toGlobalId("PetitionFolder", "/common/")],
          source: "/",
          destination: "/templates/",
          type: "TEMPLATE",
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.movePetitions).toEqual("SUCCESS");

      const after = await mocks.knex
        .from("petition")
        .whereIn(
          "id",
          petitions.map((p) => p.id)
        )
        .orderBy("path", "asc")
        .select("path", "is_template");

      expect(after).toEqual([
        {
          path: "/common/",
          is_template: false,
        },
        {
          path: "/templates/common/",
          is_template: true,
        },
      ]);
    });

    it("fails when targeting root folder", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          folderIds: [toGlobalId("PetitionFolder", "/")],
          source: "/",
          destination: "/petitions/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails when moving a petition with READ access", async () => {
      const [petition] = await mocks.createRandomPetitions(
        user.org_id,
        user.id,
        1,
        undefined,
        () => ({ type: "READ" })
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          ids: [toGlobalId("Petition", petition.id)],
          source: "/",
          destination: "/a/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails when moving a folder containing a petition with READ access", async () => {
      await mocks.createRandomPetitions(
        user.org_id,
        user.id,
        2,
        () => ({ path: "/shared-with-me/" }),
        (i) => ({ type: i === 0 ? "OWNER" : "READ" })
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          folderIds: [toGlobalId("PetitionFolder", "/shared-with-me/")],
          source: "/",
          destination: "/new-folder/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if destination is an invalid path", async () => {
      const [petition] = await mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
        path: "/ABC/",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          ids: [toGlobalId("Petition", petition.id)],
          source: "/ABC/",
          destination: "invalid path",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("does nothing if folder doesn't contain any petition of mine", async () => {
      const [otherUser] = await mocks.createRandomUsers(user.org_id, 1);
      const [petition] = await mocks.createRandomPetitions(user.org_id, otherUser.id, 1, () => ({
        path: "/private/",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          folderIds: [toGlobalId("PetitionFolder", "/private/")],
          source: "/",
          destination: "/public/",
          type: "PETITION",
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.movePetitions).toEqual("SUCCESS");

      const [petitionAfter] = await mocks.knex
        .from("petition")
        .where("id", petition.id)
        .select("id", "path");

      expect(petitionAfter).toEqual({
        id: petition.id,
        path: "/private/",
      });
    });

    it("fails if user doesn't have access to the petitions", async () => {
      const [otherUser] = await mocks.createRandomUsers(user.org_id, 1);
      const [petition] = await mocks.createRandomPetitions(user.org_id, otherUser.id, 1);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          ids: [toGlobalId("Petition", petition.id)],
          source: "/",
          destination: "/A/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if folderIds is invalid", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          folderIds: [toGlobalId("Invalid", "/xx/")],
          source: "/",
          destination: "/A/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails when moving a petition not in source", async () => {
      const [petition] = await mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
        path: "/a/b/c/",
      }));
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $ids: [GID!]
            $folderIds: [ID!]
            $source: String!
            $destination: String!
            $type: PetitionBaseType!
          ) {
            movePetitions(
              ids: $ids
              folderIds: $folderIds
              source: $source
              destination: $destination
              type: $type
            )
          }
        `,
        {
          ids: [toGlobalId("Petition", petition.id)],
          source: "/a/b/",
          destination: "/A/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("renameFolder", () => {
    afterEach(async () => {
      await mocks.knex.from("petition").update({ deleted_at: new Date() });
    });

    it("renames a folder", async () => {
      /*
        /
        ├─ spanish/
        │   └─ clients/
        │       ├─ [petition1]
        │       ├─ [petition2]
        │       └─ closed/
        │           └─ [petition5]
        └─ english/
            └─ clients/
                ├─ [petition3]
                └─ [petition4]

        renameFolder(
          folderId: ["/spanish/clients/"],
          name: "customers",
        )

        /
        ├─ spanish/
        │   └─ customers/
        │       ├─ [petition1]
        │       ├─ [petition2]
        │       └─ closed/
        │           └─ [petition5]
        └─ english/
            └─ clients/
                ├─ [petition3]
                └─ [petition4]
         */

      const petitions = await Promise.all([
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/spanish/clients/",
          name: `petition${i + 1}`,
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
          path: "/spanish/clients/closed/",
          name: "petition5",
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/english/clients/",
          name: `petition${i + 3}`,
        })),
      ]).then((p) => p.flat());

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($folderId: ID!, $name: String!, $type: PetitionBaseType!) {
            renameFolder(folderId: $folderId, name: $name, type: $type)
          }
        `,
        {
          folderId: toGlobalId("PetitionFolder", "/spanish/clients/"),
          name: "customers",
          type: "PETITION",
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.renameFolder).toEqual("SUCCESS");

      const after = await mocks.knex
        .from("petition")
        .whereIn(
          "id",
          petitions.map((p) => p.id)
        )
        .select("name", "path")
        .orderBy("name", "asc");

      expect(after).toEqual([
        { name: "petition1", path: "/spanish/customers/" },
        { name: "petition2", path: "/spanish/customers/" },
        { name: "petition3", path: "/english/clients/" },
        { name: "petition4", path: "/english/clients/" },
        { name: "petition5", path: "/spanish/customers/closed/" },
      ]);
    });

    it("fails when name is not valid", async () => {
      /*
        /
        ├─ spanish/
        │   └─ clients/
        │       ├─ [petition1]
        │       ├─ [petition2]
        │       └─ closed/
        │           └─ [petition5]
        └─ english/
            └─ clients/
                ├─ [petition3]
                └─ [petition4]

        renameFolder(
          folderId: ["/spanish/clients/"],
          name: "hola/que/tal",
        )
         */

      const petitions = await Promise.all([
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/spanish/clients/",
          name: `petition${i + 1}`,
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
          path: "/spanish/clients/closed/",
          name: "petition5",
        })),
        mocks.createRandomPetitions(user.org_id, user.id, 2, (i) => ({
          path: "/english/clients/",
          name: `petition${i + 3}`,
        })),
      ]).then((p) => p.flat());

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($folderId: ID!, $name: String!, $type: PetitionBaseType!) {
            renameFolder(folderId: $folderId, name: $name, type: $type)
          }
        `,
        {
          folderId: toGlobalId("PetitionFolder", "/spanish/clients/"),
          name: "hola/que/tal",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitions", () => {
    let orgUser: User;
    let otherOrgUser: User;
    let petitions: Petition[];
    let orgUserPetitions: Petition[];
    let otherOrgUserPetitions: Petition[];

    beforeAll(async () => {
      [orgUser] = await mocks.createRandomUsers(user.org_id, 1);
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      [otherOrgUser] = await mocks.createRandomUsers(otherOrg.id, 1);
    });

    beforeEach(async () => {
      await mocks.knex.from("petition").update("deleted_at", new Date());

      petitions = await mocks.createRandomPetitions(user.org_id, user.id, 5, (i) => ({
        path: ["/", "/common/", "/A/B/C/", "/A/B/C/D/E/", "/templates/"][i],
        is_template: i === 4,
      }));
      orgUserPetitions = await mocks.createRandomPetitions(orgUser.org_id, orgUser.id, 1, () => ({
        path: "/common/",
      }));
      otherOrgUserPetitions = await mocks.createRandomPetitions(
        otherOrgUser.org_id,
        otherOrgUser.id,
        1,
        () => ({ path: "/common/" })
      );
    });

    it("deletes a folder with my petitions", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($folders: FoldersInput) {
            deletePetitions(folders: $folders)
          }
        `,
        {
          folders: {
            folderIds: [
              toGlobalId("PetitionFolder", "/common/"),
              toGlobalId("PetitionFolder", "/A/B/"),
            ],
            type: "PETITION",
          },
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.deletePetitions).toEqual("SUCCESS");

      // my petitions and permissions should be deleted
      const myPermissionsAfter = (await mocks.knex
        .from("petition_permission")
        .whereIn(
          "petition_id",
          petitions.map((p) => p.id)
        )
        .orderBy("petition_id", "asc")
        .select("petition_id", "user_id", "type", "deleted_at")) as Pick<
        PetitionPermission,
        "petition_id" | "user_id" | "type" | "deleted_at"
      >[];

      expect(myPermissionsAfter).toEqual([
        {
          petition_id: petitions.find((p) => p.path === "/")!.id,
          user_id: user.id,
          type: "OWNER",
          deleted_at: null,
        },
        {
          petition_id: petitions.find((p) => p.path === "/common/")!.id,
          user_id: user.id,
          type: "OWNER",
          deleted_at: expect.any(Date),
        },
        {
          petition_id: petitions.find((p) => p.path === "/A/B/C/")!.id,
          user_id: user.id,
          type: "OWNER",
          deleted_at: expect.any(Date),
        },
        {
          petition_id: petitions.find((p) => p.path === "/A/B/C/D/E/")!.id,
          user_id: user.id,
          type: "OWNER",
          deleted_at: expect.any(Date),
        },
        {
          petition_id: petitions.find((p) => p.path === "/templates/")!.id,
          user_id: user.id,
          type: "OWNER",
          deleted_at: null,
        },
      ]);

      const myPetitionsAfter = (await mocks.knex
        .from("petition")
        .whereIn(
          "id",
          petitions.map((p) => p.id)
        )
        .orderBy("path", "asc")
        .select("path", "deleted_at")) as Pick<Petition, "id" | "path" | "deleted_at">[];

      expect(myPetitionsAfter).toEqual([
        { path: "/", deleted_at: null },
        { path: "/A/B/C/", deleted_at: expect.any(Date) },
        { path: "/A/B/C/D/E/", deleted_at: expect.any(Date) },
        { path: "/common/", deleted_at: expect.any(Date) },
        { path: "/templates/", deleted_at: null },
      ]);

      // 'orgUser' and 'otherOrgUser' petitions and permissions on those folders should be intact
      const orgUserPermissionsAfter = (await mocks.knex
        .from("petition_permission")
        .whereIn(
          "petition_id",
          orgUserPetitions.map((p) => p.id)
        )
        .orderBy("petition_id", "asc")
        .select("petition_id", "user_id", "type", "deleted_at")) as Pick<
        PetitionPermission,
        "petition_id" | "user_id" | "type" | "deleted_at"
      >[];

      expect(orgUserPermissionsAfter).toEqual([
        {
          petition_id: orgUserPetitions[0].id,
          user_id: orgUser.id,
          type: "OWNER",
          deleted_at: null,
        },
      ]);

      const orgUserPetitionsAfter = (await mocks.knex
        .from("petition")
        .whereIn(
          "id",
          orgUserPetitions.map((p) => p.id)
        )
        .orderBy("path", "asc")
        .select("path", "deleted_at")) as Pick<Petition, "id" | "path" | "deleted_at">[];

      expect(orgUserPetitionsAfter).toEqual([{ path: "/common/", deleted_at: null }]);

      const otherOrgUserPermissionsAfter = (await mocks.knex
        .from("petition_permission")
        .whereIn(
          "petition_id",
          otherOrgUserPetitions.map((p) => p.id)
        )
        .orderBy("petition_id", "asc")
        .select("petition_id", "user_id", "type", "deleted_at")) as Pick<
        PetitionPermission,
        "petition_id" | "user_id" | "type" | "deleted_at"
      >[];

      expect(otherOrgUserPermissionsAfter).toEqual([
        {
          petition_id: otherOrgUserPetitions[0].id,
          user_id: otherOrgUser.id,
          type: "OWNER",
          deleted_at: null,
        },
      ]);

      const otherOrgUserPetitionsAfter = (await mocks.knex
        .from("petition")
        .whereIn(
          "id",
          otherOrgUserPetitions.map((p) => p.id)
        )
        .orderBy("path", "asc")
        .select("path", "deleted_at")) as Pick<Petition, "id" | "path" | "deleted_at">[];

      expect(otherOrgUserPetitionsAfter).toEqual([{ path: "/common/", deleted_at: null }]);
    });

    it("don't delete templates folders if passing type PETITION", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($folders: FoldersInput) {
            deletePetitions(folders: $folders)
          }
        `,
        {
          folders: {
            folderIds: [toGlobalId("PetitionFolder", "/templates/")],
            type: "PETITION",
          },
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.deletePetitions).toEqual("SUCCESS");

      const [templateAfter] = await mocks.knex
        .from("petition")
        .where("id", petitions.find((p) => p.path === "/templates/")!.id)
        .select("deleted_at");
      expect(templateAfter.deleted_at).toBeNull();
    });
  });
});
