import { gql } from "graphql-request";
import { Knex } from "knex";
import { Organization, Petition, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toGlobalId } from "../../util/globalId";
import { FIELD_REFERENCE_REGEX } from "../petition/mutations";
import { TestClient, initServer } from "./server";

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
        { type: "NUMBER", name: "price", default_value: 0 },
        { type: "NUMBER", name: "score", default_value: 100 },
        {
          type: "ENUM",
          name: "risk",
          default_value: "low",
          value_labels: [
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ],
        },
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
            type: "NUMBER",
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
                type
                ... on PetitionVariableNumber {
                  numberDefaultValue: defaultValue
                  numberValueLabels: valueLabels {
                    value
                    label
                  }
                }
                ... on PetitionVariableEnum {
                  enumDefaultValue: defaultValue
                  enumValueLabels: valueLabels {
                    value
                    label
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          data: {
            type: "NUMBER",
            name: "credit",
            defaultValue: 10,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionVariable).toEqual({
        id: toGlobalId("Petition", petition.id),
        variables: [
          { type: "NUMBER", name: "price", numberDefaultValue: 0, numberValueLabels: [] },
          { type: "NUMBER", name: "score", numberDefaultValue: 100, numberValueLabels: [] },
          {
            type: "ENUM",
            name: "risk",
            enumDefaultValue: "low",
            enumValueLabels: [
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ],
          },
          {
            type: "NUMBER",
            name: "credit",
            numberDefaultValue: 10,
            numberValueLabels: [],
          },
        ],
      });
    });

    it("sends error if key is already present on variables", async () => {
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
            type: "NUMBER",
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
            type: "ENUM",
            name: "number",
            defaultValue: "12345",
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
              type: "NUMBER",
              name,
              defaultValue: 12345,
            },
          },
        );

        expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
          message: `Value does not match ${FIELD_REFERENCE_REGEX}.`,
        });
        expect(data).toBeNull();
      }
    });

    it("creates an ENUM variable", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $data: CreatePetitionVariableInput!) {
            createPetitionVariable(petitionId: $petitionId, data: $data) {
              id
              variables {
                name
                type
                ... on PetitionVariableNumber {
                  numberDefaultValue: defaultValue
                  numberValueLabels: valueLabels {
                    value
                    label
                  }
                }
                ... on PetitionVariableEnum {
                  enumDefaultValue: defaultValue
                  enumValueLabels: valueLabels {
                    value
                    label
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          data: {
            type: "ENUM",
            name: "color",
            defaultValue: "red",
            valueLabels: [
              { value: "red", label: "Red" },
              { value: "green", label: "Green" },
              { value: "blue", label: "Blue" },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionVariable).toEqual({
        id: toGlobalId("Petition", petition.id),
        variables: [
          { type: "NUMBER", name: "price", numberDefaultValue: 0, numberValueLabels: [] },
          { type: "NUMBER", name: "score", numberDefaultValue: 100, numberValueLabels: [] },
          {
            type: "ENUM",
            name: "risk",
            enumDefaultValue: "low",
            enumValueLabels: [
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ],
          },
          {
            type: "ENUM",
            name: "color",
            enumDefaultValue: "red",
            enumValueLabels: [
              { value: "red", label: "Red" },
              { value: "green", label: "Green" },
              { value: "blue", label: "Blue" },
            ],
          },
        ],
      });
    });

    it("sends error if ENUM variable has duplicate value labels", async () => {
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
            type: "ENUM",
            name: "color",
            defaultValue: "red",
            valueLabels: [
              { value: "red", label: "Red" },
              { value: "red", label: "Red" },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: "valueLabels must have unique values",
      });
      expect(data).toBeNull();
    });

    it("sends error if ENUM variable has a default value that is not in the value labels", async () => {
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
            type: "ENUM",
            name: "color",
            defaultValue: "yellow",
            valueLabels: [
              { value: "red", label: "Red" },
              { value: "green", label: "Green" },
              { value: "blue", label: "Blue" },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: "defaultValue must be one of the valueLabels values",
      });
      expect(data).toBeNull();
    });

    it("sends error if one of the value labels do not match the regex", async () => {
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
            type: "ENUM",
            name: "color",
            defaultValue: "green",
            valueLabels: [
              { value: "red", label: "Red" },
              { value: "green color", label: "Green" },
              { value: "blue", label: "Blue" },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: `valueLabels[1].value must match the regex ${FIELD_REFERENCE_REGEX.source}`,
      });
      expect(data).toBeNull();
    });
  });

  describe("updatePetitionVariable", () => {
    it("updates a NUMBER variable", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
              variables {
                type
                name
                ... on PetitionVariableNumber {
                  numberDefaultValue: defaultValue
                  numberValueLabels: valueLabels {
                    value
                    label
                  }
                }
                ... on PetitionVariableEnum {
                  enumDefaultValue: defaultValue
                  enumValueLabels: valueLabels {
                    value
                    label
                  }
                }
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
          { type: "NUMBER", name: "price", numberDefaultValue: 30, numberValueLabels: [] },
          { type: "NUMBER", name: "score", numberDefaultValue: 100, numberValueLabels: [] },
          {
            type: "ENUM",
            name: "risk",
            enumDefaultValue: "low",
            enumValueLabels: [
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ],
          },
        ],
      });
    });

    it("updates a ENUM variable", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
              variables {
                type
                name
                ... on PetitionVariableNumber {
                  numberDefaultValue: defaultValue
                  numberValueLabels: valueLabels {
                    value
                    label
                  }
                }
                ... on PetitionVariableEnum {
                  enumDefaultValue: defaultValue
                  enumValueLabels: valueLabels {
                    value
                    label
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "risk",
          data: {
            defaultValue: "high",
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionVariable).toEqual({
        id: toGlobalId("Petition", petition.id),
        variables: [
          { type: "NUMBER", name: "price", numberDefaultValue: 0, numberValueLabels: [] },
          { type: "NUMBER", name: "score", numberDefaultValue: 100, numberValueLabels: [] },
          {
            type: "ENUM",
            name: "risk",
            enumDefaultValue: "high",
            enumValueLabels: [
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ],
          },
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
                type
                name
                ... on PetitionVariableNumber {
                  numberDefaultValue: defaultValue
                  numberValueLabels: valueLabels {
                    value
                    label
                  }
                }
                ... on PetitionVariableEnum {
                  enumDefaultValue: defaultValue
                  enumValueLabels: valueLabels {
                    value
                    label
                  }
                }
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
          { type: "NUMBER", name: "price", numberDefaultValue: 0, numberValueLabels: [] },
          { type: "NUMBER", name: "score", numberDefaultValue: 100, numberValueLabels: [] },
          {
            type: "ENUM",
            name: "risk",
            enumDefaultValue: "low",
            enumValueLabels: [
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ],
          },
        ],
      });
    });

    it("sends error when updating a NUMBER variable with ENUM data", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "price",
          data: {
            defaultValue: "hello",
            valueLabels: [
              { value: "hello", label: "Hello" },
              { value: "world", label: "World" },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: "defaultValue must be a number",
      });
      expect(data).toBeNull();
    });

    it("sends error when updating a ENUM variable with NUMBER data", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "risk",
          data: {
            defaultValue: 10,
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: "defaultValue must be a string",
      });
      expect(data).toBeNull();
    });

    it("sends error when removing every value label in ENUM variable", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "risk",
          data: {
            valueLabels: [],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: "valueLabels must be an array with at least one element",
      });
      expect(data).toBeNull();
    });

    it("sends error when updating ENUM valueLabels and defaultValue is not in the new value labels", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "risk",
          data: {
            valueLabels: [
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: "defaultValue must be one of the valueLabels values",
      });
      expect(data).toBeNull();
    });

    it("allows to update ENUM valueLabels if those contain the current defaultValue", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
              variables {
                type
                name
                ... on PetitionVariableNumber {
                  numberDefaultValue: defaultValue
                  numberValueLabels: valueLabels {
                    value
                    label
                  }
                }
                ... on PetitionVariableEnum {
                  enumDefaultValue: defaultValue
                  enumValueLabels: valueLabels {
                    value
                    label
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "risk",
          data: {
            valueLabels: [
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionVariable).toEqual({
        id: toGlobalId("Petition", petition.id),
        variables: [
          { type: "NUMBER", name: "price", numberDefaultValue: 0, numberValueLabels: [] },
          { type: "NUMBER", name: "score", numberDefaultValue: 100, numberValueLabels: [] },
          {
            type: "ENUM",
            name: "risk",
            enumDefaultValue: "low",
            enumValueLabels: [
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ],
          },
        ],
      });
    });

    it("sends error when updating ENUM defaultValue to a value that is not in the value labels", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "risk",
          data: {
            defaultValue: "yellow",
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: "defaultValue must be one of the valueLabels values",
      });
      expect(data).toBeNull();
    });

    it("allows to update ENUM defaultValue to a value that is in the value labels update data", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!, $data: UpdatePetitionVariableInput!) {
            updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
              id
              variables {
                type
                name
                ... on PetitionVariableNumber {
                  numberDefaultValue: defaultValue
                  numberValueLabels: valueLabels {
                    value
                    label
                  }
                }
                ... on PetitionVariableEnum {
                  enumDefaultValue: defaultValue
                  enumValueLabels: valueLabels {
                    value
                    label
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          name: "risk",
          data: {
            defaultValue: "yellow",
            valueLabels: [
              { value: "red", label: "Red" },
              { value: "green", label: "Green" },
              { value: "blue", label: "Blue" },
              { value: "yellow", label: "Yellow" },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionVariable).toEqual({
        id: toGlobalId("Petition", petition.id),
        variables: [
          { type: "NUMBER", name: "price", numberDefaultValue: 0, numberValueLabels: [] },
          { type: "NUMBER", name: "score", numberDefaultValue: 100, numberValueLabels: [] },
          {
            type: "ENUM",
            name: "risk",
            enumDefaultValue: "yellow",
            enumValueLabels: [
              { value: "red", label: "Red" },
              { value: "green", label: "Green" },
              { value: "blue", label: "Blue" },
              { value: "yellow", label: "Yellow" },
            ],
          },
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
                type
                name
                ... on PetitionVariableNumber {
                  numberDefaultValue: defaultValue
                  numberValueLabels: valueLabels {
                    value
                    label
                  }
                }
                ... on PetitionVariableEnum {
                  enumDefaultValue: defaultValue
                  enumValueLabels: valueLabels {
                    value
                    label
                  }
                }
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
        variables: [
          { type: "NUMBER", name: "score", numberDefaultValue: 100, numberValueLabels: [] },
          {
            type: "ENUM",
            name: "risk",
            enumDefaultValue: "low",
            enumValueLabels: [
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ],
          },
        ],
      });
    });

    it("does nothing if key is not present", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $name: String!) {
            deletePetitionVariable(petitionId: $petitionId, name: $name) {
              id
              variables {
                type
                name
                ... on PetitionVariableNumber {
                  numberDefaultValue: defaultValue
                  numberValueLabels: valueLabels {
                    value
                    label
                  }
                }
                ... on PetitionVariableEnum {
                  enumDefaultValue: defaultValue
                  enumValueLabels: valueLabels {
                    value
                    label
                  }
                }
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
          { type: "NUMBER", name: "price", numberDefaultValue: 0, numberValueLabels: [] },
          { type: "NUMBER", name: "score", numberDefaultValue: 100, numberValueLabels: [] },
          {
            type: "ENUM",
            name: "risk",
            enumDefaultValue: "low",
            enumValueLabels: [
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ],
          },
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
