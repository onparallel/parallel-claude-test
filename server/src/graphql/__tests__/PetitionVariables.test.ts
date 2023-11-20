import { Knex } from "knex";
import { Organization, Petition, User } from "../../db/__types";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { TestClient, initServer } from "./server";
import { KNEX } from "../../db/knex";
import { gql } from "graphql-request";
import { toGlobalId } from "../../util/globalId";

describe("Petition Variables", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let user: User;
  let organization: Organization;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());
  });

  afterAll(async () => {
    await testClient.stop();
  });

  let petition: Petition;
  beforeEach(async () => {
    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
      variables: [
        { name: "price", default_value: 0 },
        { name: "score", default_value: 100 },
      ],
    }));
  });

  describe("createPetitionVariable", () => {
    it("name cannot be longer than 30 characters", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $data: CreatePetitionVariableInput!) {
            createPetitionVariable(petitionId: $petitionId, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          data: {
            name: "a".repeat(31),
            defaultValue: 10,
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("creates a new variable if name key is not present on array", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $data: CreatePetitionVariableInput!) {
            createPetitionVariable(petitionId: $petitionId, data: $data) {
              id
              variables {
                name
                defaultValue
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          data: {
            name: "credit",
            defaultValue: 10,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionVariable).toEqual({
        id: toGlobalId("Petition", petition.id),
        variables: [
          { name: "price", defaultValue: 0 },
          { name: "score", defaultValue: 100 },
          { name: "credit", defaultValue: 10 },
        ],
      });
    });

    it("sends error if key is already present on variables", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $data: CreatePetitionVariableInput!) {
            createPetitionVariable(petitionId: $petitionId, data: $data) {
              id
              variables {
                name
                defaultValue
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          data: {
            name: "price",
            defaultValue: 12345,
          },
        },
      );

      expect(errors).toContainGraphQLError("PETITION_VARIABLE_ALREADY_EXISTS_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if a field alias has the same name as the variable", async () => {
      await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "NUMBER",
        alias: "number",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $data: CreatePetitionVariableInput!) {
            createPetitionVariable(petitionId: $petitionId, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          data: {
            name: "number",
            defaultValue: 12345,
          },
        },
      );

      expect(errors).toContainGraphQLError("ALIAS_ALREADY_EXISTS");
      expect(data).toBeNull();
    });

    it("sends error if variable name does not match alias regexp", async () => {
      for (const name of ["", "300", "my_var!", "key:value", "key/value"]) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $data: CreatePetitionVariableInput!) {
              createPetitionVariable(petitionId: $petitionId, data: $data) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            data: {
              name,
              defaultValue: 12345,
            },
          },
        );

        expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
        expect(data).toBeNull();
      }
    });
  });

  describe("updatePetitionVariable", () => {
    it("updates a variable", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
              variables {
                name
                defaultValue
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "price",
          data: {
            defaultValue: 30,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionVariable).toEqual({
        id: toGlobalId("Petition", petition.id),
        variables: [
          { name: "price", defaultValue: 30 },
          { name: "score", defaultValue: 100 },
        ],
      });
    });

    it("does nothing if key is not present", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
              variables {
                name
                defaultValue
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "unknown",
          data: {
            defaultValue: 30,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionVariable).toEqual({
        id: toGlobalId("Petition", petition.id),
        variables: [
          { name: "price", defaultValue: 0 },
          { name: "score", defaultValue: 100 },
        ],
      });
    });
  });

  describe("deletePetitionVariable", () => {
    it("deletes a variable", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!) {
            deletePetitionVariable(petitionId: $petitionId, name: $name) {
              id
              variables {
                name
                defaultValue
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "price",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionVariable).toEqual({
        id: toGlobalId("Petition", petition.id),
        variables: [{ name: "score", defaultValue: 100 }],
      });
    });

    it("does nothing if key is not present", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!) {
            deletePetitionVariable(petitionId: $petitionId, name: $name) {
              id
              variables {
                name
                defaultValue
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "unknown",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionVariable).toEqual({
        id: toGlobalId("Petition", petition.id),
        variables: [
          { name: "price", defaultValue: 0 },
          { name: "score", defaultValue: 100 },
        ],
      });
    });

    it("sends error if variable is being used on field visibility condition", async () => {
      await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        visibility: JSON.stringify({
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              operator: "EQUAL",
              value: 10,
              variableName: "price",
            },
          ],
        }),
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!) {
            deletePetitionVariable(petitionId: $petitionId, name: $name) {
              id
              variables {
                name
                defaultValue
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "price",
        },
      );

      expect(errors).toContainGraphQLError("VARIABLE_IS_REFERENCED_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if variable is being used on field math condition", async () => {
      await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        math: JSON.stringify([
          {
            operator: "AND",
            conditions: [
              {
                operator: "EQUAL",
                value: 10,
                variableName: "price",
              },
            ],
            operations: [
              {
                variable: "score",
                operand: {
                  type: "NUMBER",
                  value: 10,
                },
                operator: "ADDITION",
              },
            ],
          },
        ]),
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!) {
            deletePetitionVariable(petitionId: $petitionId, name: $name) {
              id
              variables {
                name
                defaultValue
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "price",
        },
      );

      expect(errors).toContainGraphQLError("VARIABLE_IS_REFERENCED_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if variable is being used on field math operation variable", async () => {
      const [textField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
      }));
      await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        math: JSON.stringify([
          {
            operator: "AND",
            conditions: [
              {
                operator: "EQUAL",
                value: 10,
                modifier: "NUMBER_OF_REPLIES",
                fieldId: textField.id,
              },
            ],
            operations: [
              {
                variable: "price",
                operand: {
                  type: "NUMBER",
                  value: 10,
                },
                operator: "ADDITION",
              },
            ],
          },
        ]),
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!) {
            deletePetitionVariable(petitionId: $petitionId, name: $name) {
              id
              variables {
                name
                defaultValue
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "price",
        },
      );

      expect(errors).toContainGraphQLError("VARIABLE_IS_REFERENCED_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if variable is being used on field math operation operand", async () => {
      const [textField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
      }));
      await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        math: JSON.stringify([
          {
            operator: "AND",
            conditions: [
              {
                operator: "EQUAL",
                value: 10,
                modifier: "NUMBER_OF_REPLIES",
                fieldId: textField.id,
              },
            ],
            operations: [
              {
                variable: "score",
                operand: {
                  type: "VARIABLE",
                  name: "price",
                },
                operator: "ADDITION",
              },
            ],
          },
        ]),
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!) {
            deletePetitionVariable(petitionId: $petitionId, name: $name) {
              id
              variables {
                name
                defaultValue
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "price",
        },
      );

      expect(errors).toContainGraphQLError("VARIABLE_IS_REFERENCED_ERROR");
      expect(data).toBeNull();
    });
  });
});
