import { initServer } from "./server";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, User, Petition } from "../../db/__types";
import { userCognitoId } from "./mocks";
import { toGlobalId } from "../../util/globalId";
import { QueryRunner, TestClient } from "./QueryRunner";

const petitionsBuilder = (orgId: number) => (
  index: number
): Partial<Petition> => ({
  is_template: index > 5,
  status: index > 5 ? null : "DRAFT",
  template_public: index > 7,
  org_id: orgId,
  created_at: new Date(),
  created_by: "User:1",
  locale: "en",
  name: index > 5 ? `Template ${index}` : `Petition ${index}`,
  template_description: index > 5 ? `Template description ${index}` : null,
});

describe("GraphQL/Petitions", () => {
  let queryRunner: QueryRunner;
  let testClient: TestClient;

  let organization: Organization;
  let sessionUser: User;
  let petitions: Petition[];

  let otherOrg: Organization;
  let otherUser: User;
  let otherPetition: Petition;
  let publicTemplate: Petition;

  beforeAll(async (done) => {
    testClient = initServer();
    queryRunner = new QueryRunner(testClient);
    const mocks = new Mocks(testClient.knex);

    // main organization
    [organization] = await mocks.createRandomOrganizations(1, () => ({
      identifier: "parallel",
      status: "DEV",
    }));

    // secondary org
    [otherOrg] = await mocks.createRandomOrganizations(1);

    // logged user
    [sessionUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: userCognitoId,
      first_name: "Harvey",
      last_name: "Specter",
      org_id: organization.id,
    }));

    [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);

    // logged user petitions
    petitions = await mocks.createRandomPetitions(
      organization.id,
      sessionUser.id,
      10,
      petitionsBuilder(organization.id)
    );

    // a public template from secondary organization
    [publicTemplate] = await mocks.createRandomPetitions(
      otherOrg.id,
      otherUser.id,
      1,
      () => ({
        template_public: true,
        is_template: true,
        status: null,
        name: "KYC (Know Your Client)",
        template_description: "Template description for KYC",
      })
    );

    // a petition from secondary user
    [otherPetition] = await mocks.createRandomPetitions(
      otherOrg.id,
      otherUser.id,
      1
    );

    done();
  });

  afterAll(async (done) => {
    await testClient.stop();
    done();
  });

  describe("Queries", () => {
    it("fetches all user petitions", async () => {
      const { errors, data } = await queryRunner.petitions({
        type: "PETITION",
      });

      expect(errors).toBeUndefined();
      expect(data!.petitions.totalCount).toBe(6);
    });

    it("fetches a limited amount of petitions", async () => {
      const { errors, data } = await queryRunner.petitions({
        limit: 2,
        type: "PETITION",
      });
      expect(errors).toBeUndefined();
      expect(data!.petitions.totalCount).toBe(6);
      expect(data!.petitions.items).toHaveLength(2);
    });

    it("fetches only templates", async () => {
      const { errors, data } = await queryRunner.petitions({
        type: "TEMPLATE",
      });
      expect(errors).toBeUndefined();
      expect(data!.petitions.totalCount).toBe(4);
    });

    it("fetches a single petition from logged user", async () => {
      const { errors, data } = await queryRunner.petition({
        petitionId: toGlobalId("Petition", petitions[0].id),
      });

      expect(errors).toBeUndefined();
      expect(data!.petition.owner.id).toBe(toGlobalId("User", sessionUser.id));
      expect(data!.petition.__typename).toBe("Petition");
    });

    it("fetches a public template from another organization", async () => {
      const { errors, data } = await queryRunner.petition({
        petitionId: toGlobalId("Petition", publicTemplate.id),
      });

      expect(errors).toBeUndefined();
      expect(data!.petition.owner.organization.id).toBe(
        toGlobalId("Organization", otherOrg.id)
      );
      expect(data!.petition.owner.id).toBe(toGlobalId("User", otherUser.id));
      expect(data!.petition.__typename).toBe("PetitionTemplate");
    });

    it("fetches all public templates", async () => {
      const { errors, data } = await queryRunner.publicTemplates({});

      expect(errors).toBeUndefined();
      expect(data!.publicTemplates.totalCount).toBe(3);
    });

    it("fetches all public templates with name matching search query", async () => {
      const { errors, data } = await queryRunner.publicTemplates({
        search: "Know Your Client",
      });

      expect(errors).toBeUndefined();
      expect(data!.publicTemplates.totalCount).toBe(1);
    });

    it("fetches all public templates with descrpition matching search query", async () => {
      const { errors, data } = await queryRunner.publicTemplates({
        search: "description for kyc",
      });

      expect(errors).toBeUndefined();
      expect(data!.publicTemplates.totalCount).toBe(1);
    });

    it("sends error when trying to fetch a private petition from other user", async () => {
      const { errors, data } = await queryRunner.petition({
        petitionId: toGlobalId("Petition", otherPetition.id),
      });

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
      expect(data!.petition).toBeNull();
    });

    it("sends error when trying to access private information through a public template", async () => {
      const {
        errors,
        data,
      } = await queryRunner.publicTemplatesWithPrivateData();
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createPetition", () => {
    it("creates a petition from scratch with given name", async () => {
      const { errors, data } = await queryRunner.createPetition({
        name: "New blank petition",
        locale: "en",
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toMatchObject({
        name: "New blank petition",
        owner: { id: toGlobalId("User", sessionUser.id) },
        fields: [
          {
            type: "HEADING",
            isFixed: true,
          },
        ],
        locale: "en",
        __typename: "Petition",
      });
    });

    it("creates a template from scratch with given name", async () => {
      const { errors, data } = await queryRunner.createPetition({
        name: "nueva plantilla",
        locale: "es",
        type: "TEMPLATE",
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toMatchObject({
        name: "nueva plantilla",
        owner: { id: toGlobalId("User", sessionUser.id) },
        fields: [
          {
            type: "HEADING",
            isFixed: true,
          },
        ],
        locale: "es",
        __typename: "PetitionTemplate",
      });
    });

    it("creates a petition using another created by same user as reference", async () => {
      const base = petitions[3];
      const { errors, data } = await queryRunner.createPetition({
        petitionId: toGlobalId("Petition", base.id),
        type: "PETITION",
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toMatchObject({
        name: base.name,
        owner: { id: toGlobalId("User", sessionUser.id) },
      });
    });

    it("creates a template based on a public template from other organization", async () => {
      const { errors, data } = await queryRunner.createPetition({
        petitionId: toGlobalId("Petition", publicTemplate.id),
        type: "TEMPLATE",
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toMatchObject({
        name: publicTemplate.name,
        owner: { id: toGlobalId("User", sessionUser.id) },
        isPublic: false,
      });
    });

    it("creates a petition based on a public template", async () => {
      const { errors, data } = await queryRunner.createPetition({
        petitionId: toGlobalId("Petition", publicTemplate.id),
        type: "PETITION",
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toMatchObject({
        name: publicTemplate.name,
        status: "DRAFT",
        owner: { id: toGlobalId("User", sessionUser.id) },
        locale: publicTemplate.locale,
        __typename: "Petition",
      });
    });

    it("sends error when trying to create a petition based on a private petition from other organization", async () => {
      const { errors, data } = await queryRunner.createPetition({
        petitionId: toGlobalId("Petition", otherPetition.id),
        type: "PETITION",
      });

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("clonePetition", () => {
    it("clones a single petition from a valid id", async () => {
      const petition = petitions[3];
      const petitionGID = toGlobalId("Petition", petition.id);
      const { errors, data } = await queryRunner.clonePetitions({
        petitionIds: [petitionGID],
      });

      expect(errors).toBeUndefined();
      expect(Array.isArray(data!.clonePetitions)).toBe(true);
      expect(data!.clonePetitions[0].id).not.toBe(petitionGID);
      expect(data!.clonePetitions).toMatchObject([
        {
          name: petition.name!.concat(" (copy)"),
          locale: petition.locale,
          owner: { id: toGlobalId("User", sessionUser.id) },
          status: "DRAFT",
          __typename: "Petition",
        },
      ]);
    });
    it("clones a valid list of petitions", async () => {
      const { errors, data } = await queryRunner.clonePetitions({
        petitionIds: petitions.map((p) => toGlobalId("Petition", p.id)),
      });
      expect(errors).toBeUndefined();
      expect(data!.clonePetitions).toHaveLength(petitions.length);
    });

    it("clones a public template and saves it as private", async () => {
      const { errors, data } = await queryRunner.clonePetitions({
        petitionIds: [toGlobalId("Petition", publicTemplate.id)],
      });
      expect(errors).toBeUndefined();
      expect(data!.clonePetitions[0]).toMatchObject({
        isPublic: false,
        name: publicTemplate.name?.concat(
          publicTemplate.locale === "en" ? " (copy)" : " (copia)"
        ),
        __typename: "PetitionTemplate",
      });
    });
    it("inserts a new petition when cloning", async () => {
      const { data } = await queryRunner.petitions({
        type: "PETITION",
      });
      const availablePetitions = data!.petitions.totalCount;

      await queryRunner.clonePetitions({
        petitionIds: [toGlobalId("Petition", petitions[0].id)],
      });

      const { data: newData } = await queryRunner.petitions({
        type: "PETITION",
      });
      const newAvailablePetitions = newData!.petitions.totalCount;

      expect(availablePetitions + 1).toBe(newAvailablePetitions);
    });
    it("sends error when passing an empty array of ids", async () => {
      const { errors, data } = await queryRunner.clonePetitions({
        petitionIds: [],
      });

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when an petition on the list is not accessible for session user", async () => {
      const { errors, data } = await queryRunner.clonePetitions({
        petitionIds: [toGlobalId("Petition", otherPetition.id)],
      });

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
