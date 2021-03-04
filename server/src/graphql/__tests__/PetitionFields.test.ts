import gql from "graphql-tag";
import faker from "faker";
import { pick } from "remeda";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Contact,
  Organization,
  Petition,
  PetitionAccess,
  PetitionField,
  PetitionFieldReply,
  User,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { userCognitoId } from "../../../test/mocks";
import { initServer, TestClient } from "./server";
import Knex from "knex";
import { KNEX } from "../../db/knex";

describe("GraphQL/Petition Fields", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let user: User;
  let organization: Organization;
  let privatePetition: Petition;
  let privateField: PetitionField;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1, () => ({
      identifier: "parallel",
      status: "DEV",
    }));

    [user] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: userCognitoId,
      first_name: "Harvey",
      last_name: "Specter",
    }));

    const [otherOrg] = await mocks.createRandomOrganizations(1);
    const [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);
    [privatePetition] = await mocks.createRandomPetitions(
      otherOrg.id,
      otherUser.id,
      1
    );
    [privateField] = await mocks.createRandomPetitionFields(
      privatePetition.id,
      1
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("createPetitionField", () => {
    let userPetition: Petition;
    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({
          status: "DRAFT",
        })
      );
    });

    it("creates an empty Text field with default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $type: PetitionFieldType!) {
            createPetitionField(petitionId: $petitionId, type: $type) {
              petition {
                fields {
                  title
                  description
                  type
                  isFixed
                  optional
                  multiple
                  options
                  isReadOnly
                  validated
                  replies {
                    id
                  }
                  comments {
                    id
                  }
                }
                fieldCount
              }
              field {
                type
              }
              __typename
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          type: "TEXT",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetitionField).toEqual({
        petition: {
          fields: [
            {
              title: null,
              description: null,
              type: "TEXT",
              isFixed: false,
              optional: false,
              multiple: false,
              options: {
                multiline: true,
                placeholder: null,
              },
              isReadOnly: false,
              validated: false,
              replies: [],
              comments: [],
            },
          ],
          fieldCount: 1,
        },
        field: {
          type: "TEXT",
        },
        __typename: "PetitionAndField",
      });
    });

    it("creates an empty Heading field with default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $type: PetitionFieldType!) {
            createPetitionField(petitionId: $petitionId, type: $type) {
              petition {
                fields {
                  title
                  description
                  type
                  isFixed
                  optional
                  multiple
                  options
                  isReadOnly
                  validated
                  replies {
                    id
                  }
                  comments {
                    id
                  }
                }
                fieldCount
              }
              field {
                type
              }
              __typename
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          type: "HEADING",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetitionField).toEqual({
        petition: {
          fields: [
            {
              title: null,
              description: null,
              type: "HEADING",
              isFixed: false,
              optional: true,
              multiple: false,
              options: {
                hasPageBreak: false,
              },
              isReadOnly: true,
              validated: false,
              replies: [],
              comments: [],
            },
          ],
          fieldCount: 1,
        },
        field: {
          type: "HEADING",
        },
        __typename: "PetitionAndField",
      });
    });

    it("creates an empty FileUpload field with default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $type: PetitionFieldType!) {
            createPetitionField(petitionId: $petitionId, type: $type) {
              petition {
                fields {
                  title
                  description
                  type
                  isFixed
                  optional
                  multiple
                  options
                  isReadOnly
                  validated
                  replies {
                    id
                  }
                  comments {
                    id
                  }
                }
                fieldCount
              }
              field {
                type
              }
              __typename
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          type: "FILE_UPLOAD",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetitionField).toEqual({
        petition: {
          fields: [
            {
              title: null,
              description: null,
              type: "FILE_UPLOAD",
              isFixed: false,
              optional: false,
              multiple: true,
              options: {
                accepts: null,
              },
              isReadOnly: false,
              validated: false,
              replies: [],
              comments: [],
            },
          ],
          fieldCount: 1,
        },
        field: {
          type: "FILE_UPLOAD",
        },
        __typename: "PetitionAndField",
      });
    });

    it("creates fields on custom positions", async () => {
      const createFieldOnPosition = async (type: string, position?: number) => {
        return await testClient.mutate({
          mutation: gql`
            mutation(
              $petitionId: GID!
              $type: PetitionFieldType!
              $position: Int
            ) {
              createPetitionField(
                petitionId: $petitionId
                type: $type
                position: $position
              ) {
                petition {
                  fields {
                    id
                    type
                  }
                  fieldCount
                }
                field {
                  id
                }
              }
            }
          `,
          variables: {
            petitionId: toGlobalId("Petition", userPetition.id),
            type,
            position,
          },
        });
      };

      const { data: f1Data } = await createFieldOnPosition("HEADING", 0);
      const { data: f2Data } = await createFieldOnPosition("TEXT", 1);
      const { data: f3Data } = await createFieldOnPosition("TEXT", 2);
      const { data: f4Data } = await createFieldOnPosition("HEADING", 300);
      const { errors, data: f5Data } = await createFieldOnPosition(
        "FILE_UPLOAD",
        2
      );

      expect(errors).toBeUndefined();
      expect(f5Data!.createPetitionField).toEqual({
        petition: {
          fields: [
            { id: f1Data!.createPetitionField.field.id, type: "HEADING" },
            { id: f2Data!.createPetitionField.field.id, type: "TEXT" },
            { id: f5Data!.createPetitionField.field.id, type: "FILE_UPLOAD" },
            { id: f3Data!.createPetitionField.field.id, type: "TEXT" },
            { id: f4Data!.createPetitionField.field.id, type: "HEADING" },
          ],
          fieldCount: 5,
        },
        field: {
          id: f5Data!.createPetitionField.field.id,
        },
      });
    });

    it("sets petition status to pending when creating a field", async () => {
      const [closedPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({
          status: "CLOSED",
        })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $type: PetitionFieldType!) {
            createPetitionField(petitionId: $petitionId, type: $type) {
              petition {
                ... on Petition {
                  status
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", closedPetition.id),
          type: "TEXT",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetitionField).toEqual({
        petition: {
          status: "PENDING",
        },
      });
    });

    it("sends error when position argument is less than zero", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $type: PetitionFieldType!
            $position: Int
          ) {
            createPetitionField(
              petitionId: $petitionId
              type: $type
              position: $position
            ) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          type: "TEXT",
          position: -1,
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to create a field on a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $type: PetitionFieldType!) {
            createPetitionField(petitionId: $petitionId, type: $type) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          type: "TEXT",
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("clonePetitionField", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1
      );
      fields = await mocks.createRandomPetitionFields(userPetition.id, 5);
    });

    it("clones a field and sets the new one after it", async () => {
      const fieldToClone = fields[3];
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              petition {
                fields {
                  type
                }
                fieldCount
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fieldToClone.id),
        },
      });

      const fieldTypes: { type: string }[] = fields.map((f) =>
        pick(f, ["type"])
      );
      expect(errors).toBeUndefined();
      expect(data!.clonePetitionField).toEqual({
        petition: {
          fields: [
            fieldTypes[0],
            fieldTypes[1],
            fieldTypes[2],
            fieldTypes[3],
            fieldTypes[3],
            fieldTypes[4],
          ],
          fieldCount: 6,
        },
      });
    });

    it("sends error when field doesn't belong to petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", 1234),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to clone a field on a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          fieldId: toGlobalId("PetitionField", privateField.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitionField", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({
          status: "DRAFT",
        })
      );
      fields = await mocks.createRandomPetitionFields(
        userPetition.id,
        6,
        (index) => ({
          type: index === 0 ? "HEADING" : "TEXT",
          is_fixed: index === 0,
          validated: index < 4,
        })
      );

      await mocks.knex.raw(
        /* sql */ `
        UPDATE petition_field SET visibility = ? WHERE id = ?
      `,
        [
          JSON.stringify({
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: fields[5].id,
                modifier: "NONE",
                operator: "CONTAIN",
                value: "$",
              },
            ],
          }),
          fields[1].id,
        ]
      );

      const [contact] = await mocks.createRandomContacts(organization.id, 1);

      const [contactAccess] = await mocks.createPetitionAccess(
        userPetition.id,
        user.id,
        [contact.id],
        user.id
      );

      await mocks.createRandomTextReply(fields[1].id, contactAccess.id);
    });

    it("deletes a field and updates the position of the remaining fields", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[2].id),
        },
      });

      const gIds = fields.map((f) => toGlobalId("PetitionField", f.id));
      expect(errors).toBeUndefined();
      expect(data!.deletePetitionField).toEqual({
        fields: [
          { id: gIds[0] },
          { id: gIds[1] },
          { id: gIds[3] },
          { id: gIds[4] },
          { id: gIds[5] },
        ],
      });
    });

    it("deletes a field with replies using force flag", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
            deletePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              force: $force
            ) {
              fields {
                id
                replies {
                  id
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[1].id),
          force: true,
        },
      });
      const gIds = fields.map((f) => toGlobalId("PetitionField", f.id));

      expect(errors).toBeUndefined();
      expect(data!.deletePetitionField).toEqual({
        fields: [
          { id: gIds[0], replies: [] },
          { id: gIds[2], replies: [] },
          { id: gIds[3], replies: [] },
          { id: gIds[4], replies: [] },
          { id: gIds[5], replies: [] },
        ],
      });
    });

    it("sets petition status to closed when deleting a field, other fields are validated and petition status is pending", async () => {
      const [pendingPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({
          status: "PENDING",
        })
      );
      const pendingPetitionFields = await mocks.createRandomPetitionFields(
        pendingPetition.id,
        5,
        (index) => ({
          type: index === 0 ? "HEADING" : "TEXT",
          is_fixed: index === 0,
          validated: index < 4,
        })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
            deletePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              force: $force
            ) {
              ... on Petition {
                status
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", pendingPetition.id),
          fieldId: toGlobalId("PetitionField", pendingPetitionFields[4].id),
          force: true,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.deletePetitionField).toEqual({
        status: "CLOSED",
      });
    });

    it("should not change petition status when deleting fields on a DRAFT petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
            deletePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              force: $force
            ) {
              ... on Petition {
                status
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[4].id),
          force: true,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.deletePetitionField).toEqual({
        status: "DRAFT",
      });
    });

    it("sends error when trying to delete a fixed field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
            deletePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              force: $force
            ) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[0].id), // fields[0] is a fixed HEADING
          force: true,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to delete a field on a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
            deletePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              force: $force
            ) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          fieldId: toGlobalId("PetitionField", privateField.id),
          force: true,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to delete a field that doesn't belong to petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", privateField.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to delete a field containing replies without using force flag", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[1].id),
        },
      });

      expect(errors).toContainGraphQLError("FIELD_HAS_REPLIES_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to delete a field that is being referenced in the visibility conditions of another field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              force: true
            ) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[5].id),
        },
      });

      expect(errors).toContainGraphQLError("FIELD_IS_REFERENCED_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateFieldPositions", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    let fieldGIDs: string[];

    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1
      );
      fields = await mocks.createRandomPetitionFields(
        userPetition.id,
        5,
        (index) => ({
          type: index === 0 ? "HEADING" : "TEXT",
          is_fixed: index === 0,
        })
      );

      fieldGIDs = fields.map((f) => toGlobalId("PetitionField", f.id));
    });

    it("updates the position of the fields", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!) {
            updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldIds: [
            fieldGIDs[0],
            fieldGIDs[2],
            fieldGIDs[4],
            fieldGIDs[1],
            fieldGIDs[3],
          ],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updateFieldPositions).toEqual({
        fields: [
          { id: fieldGIDs[0] },
          { id: fieldGIDs[2] },
          { id: fieldGIDs[4] },
          { id: fieldGIDs[1] },
          { id: fieldGIDs[3] },
        ],
      });
    });

    it("sends error when passing an incomplete fieldIds argument", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!) {
            updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldIds: [fieldGIDs[0], fieldGIDs[2], fieldGIDs[4]],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_PETITION_FIELD_IDS");
      expect(data).toBeNull();
    });

    it("sends error when trying to update the field positions of a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!) {
            updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          fieldIds: [],
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to update the position of a fixed field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!) {
            updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldIds: [
            fieldGIDs[4],
            fieldGIDs[1],
            fieldGIDs[2],
            fieldGIDs[3],
            fieldGIDs[0],
          ],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_PETITION_FIELD_IDS");
      expect(data).toBeNull();
    });
  });

  describe("updatePetitionField", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    let fieldGIDs: string[];

    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1
      );
      const types = ["HEADING", "TEXT", "FILE_UPLOAD"];
      fields = await mocks.createRandomPetitionFields(
        userPetition.id,
        5,
        (index) => ({
          type: types[index % types.length] as
            | "HEADING"
            | "TEXT"
            | "FILE_UPLOAD",
          is_fixed: index === 0,
          validated: true,
        })
      );

      fieldGIDs = fields.map((f) => toGlobalId("PetitionField", f.id));
    });

    it("updates the petition field with given values", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                id
                title
                description
                options
                optional
                multiple
                visibility
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[1],
          data: {
            description: "this is the new description",
            multiple: true,
            optional: true,
            options: { placeholder: "enter text here...", multiline: false },
            title: "new title",
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  id: "1",
                  fieldId: fieldGIDs[2],
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "EQUAL",
                  value: 1,
                },
              ],
            },
          },
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.updatePetitionField).toEqual({
        field: {
          id: fieldGIDs[1],
          title: "new title",
          description: "this is the new description",
          options: { placeholder: "enter text here...", multiline: false },
          optional: true,
          multiple: true,
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                id: "1",
                fieldId: fieldGIDs[2],
                modifier: "NUMBER_OF_REPLIES",
                operator: "EQUAL",
                value: 1,
              },
            ],
          },
        },
      });
    });

    it("should allow updating the petition field with an incomplete visibility condition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                id
                visibility
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[1],
          data: {
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  id: "1",
                  fieldId: null,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "EQUAL",
                  value: null,
                },
              ],
            },
          },
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.updatePetitionField).toEqual({
        field: {
          id: fieldGIDs[1],
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                id: "1",
                fieldId: null,
                modifier: "NUMBER_OF_REPLIES",
                operator: "EQUAL",
                value: null,
              },
            ],
          },
        },
      });
    });

    it("sends error when updating petition field with invalid visibility json", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                id
                visibility
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[1],
          data: {
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  id: "1",
                  fieldId: "123",
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "EQUAL",
                  value: null,
                },
              ],
            },
          },
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("trims title and description of field before writing to database", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                title
                description
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[1],
          data: {
            description: `this is the new description      
            
            `,
            title: "    new title        ",
          },
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.updatePetitionField).toEqual({
        field: {
          title: "new title",
          description: "this is the new description",
        },
      });
    });

    it("invalidates the field when updating it", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                options
                validated
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[1],
          data: {
            options: {
              placeholder: "new placeholder",
              multiline: true,
            },
          },
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.updatePetitionField).toEqual({
        field: {
          options: {
            placeholder: "new placeholder",
            multiline: true,
          },
          validated: false,
        },
      });
    });

    it("sets petition status to pending when updating a field from optional to required", async () => {
      // first validate all fields and set petition to closed
      const { data: pre } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!, $value: Boolean!) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
            ) {
              petition {
                ... on Petition {
                  status
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldIds: fields.map((f) => toGlobalId("PetitionField", f.id)),
          value: true,
        },
      });
      expect(pre!.validatePetitionFields).toEqual({
        petition: {
          status: "CLOSED",
        },
      });

      // then update field to required, petition status should change
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              petition {
                ... on Petition {
                  status
                }
              }
              field {
                id
                optional
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[4],
          data: {
            optional: false,
          },
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.updatePetitionField).toEqual({
        petition: {
          status: "PENDING",
        },
        field: {
          id: fieldGIDs[4],
          optional: false,
        },
      });
    });

    it("sends error when field title is longer than 500 chars", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[1],
          data: { title: "x".repeat(501) },
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a field on a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          fieldId: toGlobalId("PetitionField", privateField.id),
          data: {
            title: "new title",
          },
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a field that doesn't belong to petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", privateField.id),
          data: {
            title: "new title",
          },
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a field with empty data object", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[2],
          data: {},
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a field with unknown key on options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[0],
          data: {
            options: { unknown_key: "foo", hasPageBreak: false },
          },
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a field with an additional unknown key on options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[1],
          data: {
            options: { placeholder: "foo", multiline: false, extra: false },
          },
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a field with invalid type values on options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $data: UpdatePetitionFieldInput!
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[2],
          data: {
            options: { accepts: false },
          },
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("changePetitionFieldType", () => {
    let userPetition: Petition;
    let field: PetitionField;
    let fixedHeadingField: PetitionField;
    let fieldWithReply: PetitionField;

    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1
      );

      [fixedHeadingField] = await mocks.createRandomPetitionFields(
        userPetition.id,
        1,
        () => ({
          type: "HEADING",
          is_fixed: true,
          position: 0,
        })
      );

      [field] = await mocks.createRandomPetitionFields(
        userPetition.id,
        1,
        () => ({
          type: "TEXT",
          position: 1,
        })
      );

      [fieldWithReply] = await mocks.createRandomPetitionFields(
        userPetition.id,
        1,
        () => ({
          type: "TEXT",
          position: 2,
          validated: true,
        })
      );

      const [contact] = await mocks.createRandomContacts(organization.id, 1);

      const [access] = await mocks.createPetitionAccess(
        userPetition.id,
        user.id,
        [contact.id],
        user.id
      );

      await mocks.createRandomTextReply(fieldWithReply.id, access.id);
    });

    it("changes field type to TEXT and sets its default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $type: PetitionFieldType!
          ) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
            ) {
              field {
                id
                type
                optional
                multiple
                options
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          type: "TEXT",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.changePetitionFieldType).toEqual({
        field: {
          id: toGlobalId("PetitionField", field.id),
          type: "TEXT",
          optional: false,
          multiple: false,
          options: {
            multiline: true,
            placeholder: null,
          },
        },
      });
    });

    it("changes field type to HEADING and sets its default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $type: PetitionFieldType!
          ) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
            ) {
              field {
                id
                type
                optional
                multiple
                options
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          type: "HEADING",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.changePetitionFieldType).toEqual({
        field: {
          id: toGlobalId("PetitionField", field.id),
          type: "HEADING",
          optional: true,
          multiple: false,
          options: {
            hasPageBreak: false,
          },
        },
      });
    });

    it("changes field type to FILE_UPLOAD and sets its default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $type: PetitionFieldType!
          ) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
            ) {
              field {
                id
                type
                optional
                multiple
                options
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          type: "FILE_UPLOAD",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.changePetitionFieldType).toEqual({
        field: {
          id: toGlobalId("PetitionField", field.id),
          type: "FILE_UPLOAD",
          optional: false,
          multiple: true,
          options: {
            accepts: null,
          },
        },
      });
    });

    it("changes field type and deletes its replies", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $type: PetitionFieldType!
            $force: Boolean
          ) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
              force: $force
            ) {
              field {
                id
                type
                replies {
                  id
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fieldWithReply.id),
          type: "FILE_UPLOAD",
          force: true,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.changePetitionFieldType).toEqual({
        field: {
          id: toGlobalId("PetitionField", fieldWithReply.id),
          type: "FILE_UPLOAD",
          replies: [],
        },
      });
    });

    it("changes field type and sets it as not validated", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $type: PetitionFieldType!
            $force: Boolean
          ) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
              force: $force
            ) {
              field {
                id
                type
                validated
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fieldWithReply.id),
          type: "FILE_UPLOAD",
          force: true,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.changePetitionFieldType).toEqual({
        field: {
          id: toGlobalId("PetitionField", fieldWithReply.id),
          type: "FILE_UPLOAD",
          validated: false,
        },
      });
    });

    it("sends error when trying to change a field on a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $type: PetitionFieldType!
            $force: Boolean
          ) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
              force: $force
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          fieldId: toGlobalId("PetitionField", privateField.id),
          type: "FILE_UPLOAD",
          force: true,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to change a field that doesn't belong to petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $type: PetitionFieldType!
            $force: Boolean
          ) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
              force: $force
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", privateField.id),
          type: "FILE_UPLOAD",
          force: true,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to change a field containing replies without using force flag", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $type: PetitionFieldType!
          ) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fieldWithReply.id),
          type: "FILE_UPLOAD",
        },
      });

      expect(errors).toContainGraphQLError("FIELD_HAS_REPLIES_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to change the type of a fixed field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldId: GID!
            $type: PetitionFieldType!
          ) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
            ) {
              field {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fixedHeadingField.id),
          type: "FILE_UPLOAD",
        },
      });

      expect(errors).toContainGraphQLError("UPDATE_FIXED_FIELD_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("validatePetitionFields", () => {
    let contact: Contact;
    let access: PetitionAccess;
    let petition: Petition;
    let fields: PetitionField[];
    let field2Reply: PetitionFieldReply;

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1
      );

      [contact] = await mocks.createRandomContacts(organization.id, 1);
      [access] = await mocks.createPetitionAccess(
        petition.id,
        user.id,
        [contact.id],
        user.id
      );

      fields = await mocks.createRandomPetitionFields(petition.id, 3, () => ({
        type: "TEXT",
        options: {
          multiline: faker.random.boolean(),
          placeholder: faker.random.words(3),
        },
        validated: false,
      }));

      [field2Reply] = await mocks.createRandomTextReply(
        fields[2].id,
        access.id,
        1,
        () => ({ status: "PENDING" })
      );
    });

    it("validates a field without a reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!, $value: Boolean!) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
            ) {
              fields {
                validated
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [toGlobalId("PetitionField", fields[0].id)],
          value: true,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.validatePetitionFields).toEqual({
        fields: [{ validated: true }],
      });
    });

    it("approves pending replies when validating field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!, $value: Boolean!) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
            ) {
              fields {
                id
                validated
                replies {
                  id
                  status
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [toGlobalId("PetitionField", fields[2].id)],
          value: true,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.validatePetitionFields).toEqual({
        fields: [
          {
            id: toGlobalId("PetitionField", fields[2].id),
            validated: true,
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", field2Reply.id),
                status: "APPROVED",
              },
            ],
          },
        ],
      });
    });

    it("does not update reply status when invalidating a field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!, $value: Boolean!) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
            ) {
              fields {
                id
                validated
                replies {
                  id
                  status
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [toGlobalId("PetitionField", fields[2].id)],
          value: false,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.validatePetitionFields).toEqual({
        fields: [
          {
            id: toGlobalId("PetitionField", fields[2].id),
            validated: false,
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", field2Reply.id),
                status: "PENDING",
              },
            ],
          },
        ],
      });
    });

    it("validates every pending field reply when passing validateRepliesWith", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldIds: [GID!]!
            $value: Boolean!
            $validateRepliesWith: PetitionFieldReplyStatus
          ) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
              validateRepliesWith: $validateRepliesWith
            ) {
              fields {
                id
                validated
                replies {
                  id
                  status
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [toGlobalId("PetitionField", fields[2].id)],
          value: true,
          validateRepliesWith: "REJECTED",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.validatePetitionFields).toEqual({
        fields: [
          {
            id: toGlobalId("PetitionField", fields[2].id),
            validated: true,
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", field2Reply.id),
                status: "REJECTED",
              },
            ],
          },
        ],
      });
    });

    it("sets petition status to closed when all fields are validated", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!, $value: Boolean!) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
            ) {
              petition {
                ... on Petition {
                  status
                }
              }
              fields {
                validated
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: fields.map((f) => toGlobalId("PetitionField", f.id)),
          value: true,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.validatePetitionFields).toEqual({
        petition: { status: "CLOSED" },
        fields: fields.map((f) => ({ validated: true })),
      });
    });

    it("creates petition closed event when reviewing all fields and replies", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $fieldIds: [GID!]!
            $value: Boolean!
            $validateRepliesWith: PetitionFieldReplyStatus
          ) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
              validateRepliesWith: $validateRepliesWith
            ) {
              petition {
                ... on Petition {
                  status
                  events(limit: 100) {
                    items {
                      __typename
                    }
                  }
                }
              }
              fields {
                validated
                replies {
                  status
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: fields.map((f) => toGlobalId("PetitionField", f.id)),
          value: true,
          validateRepliesWith: "APPROVED",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.validatePetitionFields).toEqual({
        petition: {
          status: "CLOSED",
          events: { items: [{ __typename: "PetitionClosedEvent" }] },
        },
        fields: [
          { validated: true, replies: [] },
          { validated: true, replies: [] },
          {
            validated: true,
            replies: [{ status: "APPROVED" }],
          },
        ],
      });
    });

    it("petition status go back to pending when petition is closed and a field is invalidated", async () => {
      // first validate all fields and set petition to closed
      await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!, $value: Boolean!) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
            ) {
              petition {
                ... on Petition {
                  status
                }
              }
              fields {
                validated
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: fields.map((f) => toGlobalId("PetitionField", f.id)),
          value: true,
        },
      });

      // then, invalid any field and petition should move to PENDING
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!, $value: Boolean!) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
            ) {
              petition {
                ... on Petition {
                  status
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [toGlobalId("PetitionField", fields[1].id)],
          value: false,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.validatePetitionFields).toEqual({
        petition: { status: "PENDING" },
      });
    });

    it("sends error when passing an invalid petitionId", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!, $value: Boolean!) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
            ) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          fieldIds: [toGlobalId("PetitionField", fields[1].id)],
          value: true,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when passing invalid fieldIds", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionId: GID!, $fieldIds: [GID!]!, $value: Boolean!) {
            validatePetitionFields(
              petitionId: $petitionId
              fieldIds: $fieldIds
              value: $value
            ) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [toGlobalId("PetitionField", 1)],
          value: true,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("updatePetitionFieldRepliesStatus", () => {
    let petition: Petition;
    let contact: Contact;
    let access: PetitionAccess;
    let fields: PetitionField[];
    let field2Replies: PetitionFieldReply[];

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1
      );

      [contact] = await mocks.createRandomContacts(organization.id, 1);
      [access] = await mocks.createPetitionAccess(
        petition.id,
        user.id,
        [contact.id],
        user.id
      );

      fields = await mocks.createRandomPetitionFields(petition.id, 3, () => ({
        type: "TEXT",
        options: {
          multiline: faker.random.boolean(),
          placeholder: faker.random.words(3),
        },
        validated: false,
      }));

      field2Replies = await mocks.createRandomTextReply(
        fields[2].id,
        access.id,
        2,
        () => ({ status: "PENDING" })
      );
    });

    it("updates status of a petition field reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $petitionFieldId: GID!
            $petitionFieldReplyIds: [GID!]!
            $status: PetitionFieldReplyStatus!
          ) {
            updatePetitionFieldRepliesStatus(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              petitionFieldReplyIds: $petitionFieldReplyIds
              status: $status
            ) {
              replies {
                id
                status
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fields[2].id),
          petitionFieldReplyIds: [
            toGlobalId("PetitionFieldReply", field2Replies[0].id),
          ],
          status: "APPROVED",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updatePetitionFieldRepliesStatus).toEqual({
        replies: [
          {
            id: toGlobalId("PetitionFieldReply", field2Replies[0].id),
            status: "APPROVED",
          },
        ],
      });
    });

    it("validates field when all replies are approved", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $petitionFieldId: GID!
            $petitionFieldReplyIds: [GID!]!
            $status: PetitionFieldReplyStatus!
          ) {
            updatePetitionFieldRepliesStatus(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              petitionFieldReplyIds: $petitionFieldReplyIds
              status: $status
            ) {
              field {
                id
                validated
              }
              replies {
                id
                status
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fields[2].id),
          petitionFieldReplyIds: field2Replies.map((r) =>
            toGlobalId("PetitionFieldReply", r.id)
          ),
          status: "APPROVED",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updatePetitionFieldRepliesStatus).toEqual({
        field: {
          id: toGlobalId("PetitionField", fields[2].id),
          validated: true,
        },
        replies: field2Replies.map((r) => ({
          id: toGlobalId("PetitionFieldReply", r.id),
          status: "APPROVED",
        })),
      });
    });

    it("sends error when passing invalid petitionId", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $petitionFieldId: GID!
            $petitionFieldReplyIds: [GID!]!
            $status: PetitionFieldReplyStatus!
          ) {
            updatePetitionFieldRepliesStatus(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              petitionFieldReplyIds: $petitionFieldReplyIds
              status: $status
            ) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          petitionFieldId: toGlobalId("PetitionField", fields[2].id),
          petitionFieldReplyIds: field2Replies.map((r) =>
            toGlobalId("PetitionFieldReply", r.id)
          ),
          status: "APPROVED",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when passing invalid petitionFieldId", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $petitionFieldId: GID!
            $petitionFieldReplyIds: [GID!]!
            $status: PetitionFieldReplyStatus!
          ) {
            updatePetitionFieldRepliesStatus(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              petitionFieldReplyIds: $petitionFieldReplyIds
              status: $status
            ) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", 123123),
          petitionFieldReplyIds: field2Replies.map((r) =>
            toGlobalId("PetitionFieldReply", r.id)
          ),
          status: "APPROVED",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when passing invalid petitionFieldReplyIds", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionId: GID!
            $petitionFieldId: GID!
            $petitionFieldReplyIds: [GID!]!
            $status: PetitionFieldReplyStatus!
          ) {
            updatePetitionFieldRepliesStatus(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              petitionFieldReplyIds: $petitionFieldReplyIds
              status: $status
            ) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          petitionFieldId: toGlobalId("PetitionField", fields[2].id),
          petitionFieldReplyIds: field2Replies.map((r) =>
            toGlobalId("PetitionFieldReply", r.id + 1000)
          ),
          status: "APPROVED",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
