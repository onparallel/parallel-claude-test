import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { User } from "../../db/__types";
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
        "/B/BA/BAA/",
        "/B/BA/BAB/",
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
      expect(data!.petitionFolders).toEqual(["/PRIVATE/PATH/"]);
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
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("Petition", petition.id)],
          dst: "/new-folder/",
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
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("Petition", petition.id)],
          dst: "/",
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

        movePetitions(src: "/spanish/clients/", dst: "/english/clients/")

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
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("PetitionFolder", "/spanish/clients/")],
          dst: "/english/clients/",
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

    it("moves a folder with petitions to another folder inside of itself", async () => {
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

        movePetitions(src: "/spanish/clients/", dst: "/spanish/clients/closed/clients/")

        /
        └─ spanish/
            └─ clients/
                └─ closed/
                    └─ clients/
                        ├─ [petition1]
                        ├─ [petition2]
                        ├─ drafts/
                        │   └─ [petition3]
                        └─ closed/
                            └─ [petition4]
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
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("PetitionFolder", "/spanish/clients/")],
          dst: "/spanish/clients/closed/clients/",
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
        { name: "petition1", path: "/spanish/clients/closed/clients/" },
        { name: "petition2", path: "/spanish/clients/closed/clients/" },
        { name: "petition3", path: "/spanish/clients/closed/clients/drafts/" },
        { name: "petition4", path: "/spanish/clients/closed/clients/closed/" },
      ]);
    });

    it("moves a list of petitions and folders", async () => {
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

        movePetitions(src: ["/spanish/clients/", "kyc-4"], dst: "/closed/kyc/clients/")

        /
        ├─ spanish/
        │   └─ [other-es]
        ├─ english/
        │   └─ [kyc-5]
        └─ closed/
            └─ kyc/
                ├─ clients/
                    ├─ [kyc-1]
                    ├─ [kyc-2]
                    ├─ [kyc-4]
                    └─ lost/
                        └─ [kyc-3]
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
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [
            toGlobalId("PetitionFolder", "/spanish/clients/"),
            toGlobalId("Petition", petitions.find((p) => p.name === "kyc-4")!.id),
          ],
          dst: "/closed/kyc/clients/",
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
        { name: "kyc-1", path: "/closed/kyc/clients/" },
        { name: "kyc-2", path: "/closed/kyc/clients/" },
        { name: "kyc-3", path: "/closed/kyc/clients/lost/" },
        { name: "kyc-4", path: "/closed/kyc/clients/" },
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
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("PetitionFolder", "/shared-folder/")],
          dst: "/mine/shared-folder/",
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
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("PetitionFolder", "/")],
          dst: "/templates/",
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
          path: "/",
          is_template: false,
        },
        {
          path: "/templates/",
          is_template: true,
        },
      ]);
    });

    it("sends error if trying to move a petition with READ access", async () => {
      const [petition] = await mocks.createRandomPetitions(
        user.org_id,
        user.id,
        1,
        undefined,
        () => ({ type: "READ" })
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("Petition", petition.id)],
          dst: "/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to move a folder containing a petition with READ access", async () => {
      await mocks.createRandomPetitions(
        user.org_id,
        user.id,
        2,
        () => ({ path: "/" }),
        (i) => ({ type: i === 0 ? "OWNER" : "READ" })
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("PetitionFolder", "/")],
          dst: "/new-folder/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if dst folder is invalid", async () => {
      const [petition] = await mocks.createRandomPetitions(user.org_id, user.id, 1);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("Petition", petition.id)],
          dst: "invalid path",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if src folder is private", async () => {
      const [otherUser] = await mocks.createRandomUsers(user.org_id, 1);
      await mocks.createRandomPetitions(user.org_id, otherUser.id, 1, () => ({
        path: "/private/",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("PetitionFolder", "/private/")],
          dst: "/public/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if src petition is private", async () => {
      const [otherUser] = await mocks.createRandomUsers(user.org_id, 1);
      const [petition] = await mocks.createRandomPetitions(user.org_id, otherUser.id, 1);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("Petition", petition.id)],
          dst: "invalid path",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if src is not a petition nor folder", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("PetitionField", 1)],
          dst: "/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to move a folder and a petition inside that folder", async () => {
      const [petition] = await mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
        path: "/a/b/c/",
      }));
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($src: [ID!]!, $dst: String!, $type: PetitionBaseType!) {
            movePetitions(src: $src, dst: $dst, type: $type)
          }
        `,
        {
          src: [toGlobalId("Petition", petition.id), toGlobalId("PetitionFolder", "/a/b/")],
          dst: "/",
          type: "PETITION",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
