import { initServer, TestClient } from "./server";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, User, Petition } from "../../db/__types";
import { userCognitoId } from "./mocks";
import { toGlobalId } from "../../util/globalId";
import gql from "graphql-tag";

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
  let testClient: TestClient;

  let organization: Organization;
  let sessionUser: User;
  let petitions: Petition[];
  let sameOrgUser: User;

  let otherOrg: Organization;
  let otherUser: User;
  let otherPetition: Petition;

  let publicTemplate: Petition;
  jest;

  beforeAll(async (done) => {
    testClient = initServer();
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

    // user from the same organization as logged
    [sameOrgUser] = await mocks.createRandomUsers(organization.id, 1);

    // user from other organization
    [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);

    // logged user petitions
    petitions = await mocks.createRandomPetitions(
      organization.id,
      sessionUser.id,
      10,
      petitionsBuilder(organization.id)
    );

    // petitions[0] and petitions[1] are shared to another user
    await testClient.knex.raw(/* sql */ `
      INSERT INTO petition_user(petition_id, user_id, permission_type)
      VALUES 
        (${petitions[0].id}, ${sameOrgUser.id}, 'WRITE'),
        (${petitions[1].id}, ${sameOrgUser.id}, 'WRITE')
    `);

    // a public template from secondary organization
    [publicTemplate] = await mocks.createRandomPetitions(
      otherOrg.id,
      otherUser.id,
      1,
      () => ({
        locale: "en",
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
      const { errors, data } = await testClient.query({
        query: gql`
          query($limit: Int, $type: PetitionBaseType) {
            petitions(limit: $limit, type: $type) {
              totalCount
            }
          }
        `,
        variables: { type: "PETITION" },
      });

      expect(errors).toBeUndefined();
      expect(data!.petitions.totalCount).toBe(6);
    });

    it("fetches a limited amount of petitions", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query($limit: Int, $type: PetitionBaseType) {
            petitions(limit: $limit, type: $type) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        variables: { limit: 2, type: "PETITION" },
      });
      expect(errors).toBeUndefined();
      expect(data!.petitions.totalCount).toBe(6);
      expect(data!.petitions.items).toHaveLength(2);
    });

    it("fetches only templates", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query($limit: Int, $type: PetitionBaseType) {
            petitions(limit: $limit, type: $type) {
              totalCount
            }
          }
        `,
        variables: { type: "TEMPLATE" },
      });
      expect(errors).toBeUndefined();
      expect(data!.petitions.totalCount).toBe(4);
    });

    it("fetches a single petition from logged user", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query($petitionId: GID!) {
            petition(id: $petitionId) {
              name
              owner {
                id
              }
              __typename
            }
          }
        `,
        variables: { petitionId: toGlobalId("Petition", petitions[0].id) },
      });

      expect(errors).toBeUndefined();
      expect(data!.petition.owner.id).toBe(toGlobalId("User", sessionUser.id));
      expect(data!.petition.__typename).toBe("Petition");
    });

    it("fetches a public template from another organization", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query($petitionId: GID!) {
            petition(id: $petitionId) {
              owner {
                id
                organization {
                  id
                }
              }
              __typename
            }
          }
        `,
        variables: { petitionId: toGlobalId("Petition", publicTemplate.id) },
      });

      expect(errors).toBeUndefined();
      expect(data!.petition.owner.organization.id).toBe(
        toGlobalId("Organization", otherOrg.id)
      );
      expect(data!.petition.owner.id).toBe(toGlobalId("User", otherUser.id));
      expect(data!.petition.__typename).toBe("PetitionTemplate");
    });

    it("fetches all public templates", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query {
            publicTemplates {
              totalCount
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.publicTemplates.totalCount).toBe(3);
    });

    it("fetches all public templates with name matching search query", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query($search: String) {
            publicTemplates(search: $search) {
              totalCount
            }
          }
        `,
        variables: { search: "Know your Client" },
      });
      expect(errors).toBeUndefined();
      expect(data!.publicTemplates.totalCount).toBe(1);
    });

    it("fetches all public templates with descrpition matching search query", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query($search: String) {
            publicTemplates(search: $search) {
              totalCount
            }
          }
        `,
        variables: { search: "description for kyc" },
      });

      expect(errors).toBeUndefined();
      expect(data!.publicTemplates.totalCount).toBe(1);
    });

    it("sends error when trying to fetch a private petition from other user", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query($petitionId: GID!) {
            petition(id: $petitionId) {
              id
            }
          }
        `,
        variables: { petitionId: toGlobalId("Petition", otherPetition.id) },
      });

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
      expect(data!.petition).toBeNull();
    });

    it("sends error when trying to access private information through a public template", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query {
            publicTemplates(limit: 100) {
              items {
                owner {
                  organization {
                    identifier
                    users {
                      totalCount
                    }
                  }
                }
              }
            }
          }
        `,
      });
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createPetition", () => {
    it("creates a petition from scratch with given name", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($name: String, $locale: PetitionLocale!) {
            createPetition(name: $name, locale: $locale) {
              name
              locale
              owner {
                id
              }
              fields {
                isFixed
                type
              }
              __typename
            }
          }
        `,
        variables: {
          name: "New blank petition",
          locale: "en",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: "New blank petition",
        locale: "en",
        owner: { id: toGlobalId("User", sessionUser.id) },
        fields: [
          {
            type: "HEADING",
            isFixed: true,
          },
        ],
        __typename: "Petition",
      });
    });

    it("creates a template from scratch with given name", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $name: String
            $locale: PetitionLocale!
            $type: PetitionBaseType
          ) {
            createPetition(name: $name, locale: $locale, type: $type) {
              name
              locale
              owner {
                id
              }
              fields {
                isFixed
                type
              }
              __typename
            }
          }
        `,
        variables: {
          name: "nueva plantilla",
          type: "TEMPLATE",
          locale: "es",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: "nueva plantilla",
        locale: "es",
        owner: { id: toGlobalId("User", sessionUser.id) },
        fields: [
          {
            type: "HEADING",
            isFixed: true,
          },
        ],
        __typename: "PetitionTemplate",
      });
    });

    it("creates a petition using another created by same user as reference", async () => {
      const base = petitions[3];
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $locale: PetitionLocale!
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(
              locale: $locale
              petitionId: $petitionId
              type: $type
            ) {
              name
              owner {
                id
              }
              __typename
            }
          }
        `,
        variables: {
          locale: "en",
          petitionId: toGlobalId("Petition", base.id),
          type: "PETITION",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: base.name,
        owner: { id: toGlobalId("User", sessionUser.id) },
        __typename: "Petition",
      });
    });

    it("creates a template based on a public template from other organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $locale: PetitionLocale!
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(
              locale: $locale
              petitionId: $petitionId
              type: $type
            ) {
              name
              locale
              owner {
                id
              }
              ... on PetitionTemplate {
                isPublic
              }
              __typename
            }
          }
        `,
        variables: {
          locale: "en",
          petitionId: toGlobalId("Petition", publicTemplate.id),
          type: "TEMPLATE",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: publicTemplate.name,
        locale: "en",
        owner: { id: toGlobalId("User", sessionUser.id) },
        isPublic: false,
        __typename: "PetitionTemplate",
      });
    });

    it("creates a petition based on a public template", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $name: String
            $locale: PetitionLocale!
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(
              name: $name
              locale: $locale
              petitionId: $petitionId
              type: $type
            ) {
              name
              locale
              owner {
                id
              }
              ... on Petition {
                status
              }
              __typename
            }
          }
        `,
        variables: {
          locale: "en",
          petitionId: toGlobalId("Petition", publicTemplate.id),
          type: "PETITION",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: publicTemplate.name,
        locale: publicTemplate.locale,
        owner: { id: toGlobalId("User", sessionUser.id) },
        status: "DRAFT",
        __typename: "Petition",
      });
    });

    it("ignores name and locale parameters when creating a petition from a valid petitionId", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $locale: PetitionLocale!
            $name: String
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(
              locale: $locale
              name: $name
              petitionId: $petitionId
              type: $type
            ) {
              name
              locale
            }
          }
        `,
        variables: {
          name: "name should not be changed",
          locale: "es",
          petitionId: toGlobalId("Petition", publicTemplate.id),
          type: "TEMPLATE",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: publicTemplate.name,
        locale: "en",
      });
    });

    it("sends error when trying to create a petition based on a private petition from other organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $locale: PetitionLocale!
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(
              locale: $locale
              petitionId: $petitionId
              type: $type
            ) {
              id
            }
          }
        `,
        variables: {
          locale: "en",
          petitionId: toGlobalId("Petition", otherPetition.id),
          type: "PETITION",
        },
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
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              name
              locale
              owner {
                id
              }
              ... on Petition {
                status
              }
              __typename
            }
          }
        `,
        variables: { petitionIds: [petitionGID] },
      });

      expect(errors).toBeUndefined();
      expect(data!.clonePetitions).toEqual([
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
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: {
          petitionIds: petitions.map((p) => toGlobalId("Petition", p.id)),
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.clonePetitions).toHaveLength(petitions.length);
    });

    it("clones a public template and saves it as private", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              name
              ... on PetitionTemplate {
                isPublic
              }
              __typename
            }
          }
        `,
        variables: { petitionIds: [toGlobalId("Petition", publicTemplate.id)] },
      });
      expect(errors).toBeUndefined();
      expect(data!.clonePetitions[0]).toEqual({
        name: publicTemplate.name?.concat(
          publicTemplate.locale === "en" ? " (copy)" : " (copia)"
        ),
        isPublic: false,
        __typename: "PetitionTemplate",
      });
    });

    it("inserts a new petition when cloning", async () => {
      const { data } = await testClient.query({
        query: gql`
          query($type: PetitionBaseType) {
            petitions(type: $type) {
              totalCount
            }
          }
        `,
        variables: { type: "PETITION" },
      });
      const availablePetitions = data!.petitions.totalCount;

      await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: { petitionIds: [toGlobalId("Petition", petitions[0].id)] },
      });

      const { data: newData } = await testClient.query({
        query: gql`
          query($type: PetitionBaseType) {
            petitions(type: $type) {
              totalCount
            }
          }
        `,
        variables: { type: "PETITION" },
      });

      const newAvailablePetitions = newData!.petitions.totalCount;

      expect(availablePetitions + 1).toBe(newAvailablePetitions);
    });

    it("sends error when passing an empty array of ids", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: { petitionIds: [] },
      });

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when an petition on the list is not accessible for session user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: { petitionIds: [toGlobalId("Petition", otherPetition.id)] },
      });

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitions", () => {
    it("deletes a user petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: { ids: [toGlobalId("Petition", petitions[2].id)] },
      });

      expect(errors).toBeUndefined();
      expect(data!.deletePetitions).toBe("SUCCESS");
    });

    it("deletes an owned shared petition when passing the force flag", async () => {
      const shared = petitions[0];
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: { ids: [toGlobalId("Petition", shared.id)], force: true },
      });
      expect(errors).toBeUndefined();
      expect(data!.deletePetitions).toBe("SUCCESS");
    });

    it("sends error when trying to delete a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: {
          ids: [toGlobalId("Petition", otherPetition.id)],
          force: true,
        },
      });
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing an empty array of ids", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: { ids: [] },
      });
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to delete an owned shared petition without force flag", async () => {
      const shared = petitions[1];
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: { ids: [toGlobalId("Petition", shared.id)] },
      });
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("DELETE_SHARED_PETITION_ERROR");
      expect(data).toBeNull();
    });
  });
});
