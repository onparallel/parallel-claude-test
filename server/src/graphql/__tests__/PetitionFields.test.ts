import gql from "graphql-tag";
import { type } from "os";
import { pick } from "remeda";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionField, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { userCognitoId } from "./mocks";
import { initServer, TestClient } from "./server";

describe("GraphQL/Petition Fields", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let user: User;
  let organization: Organization;
  let privatePetition: Petition;
  let privateField: PetitionField;

  beforeAll(async (done) => {
    testClient = await initServer();
    mocks = new Mocks(testClient.knex);
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

    done();
  });

  afterAll((done) => {
    testClient.stop();
    done();
  });

  describe("createPetitionField", () => {
    let userPetition: Petition;
    beforeEach(async (done) => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1
      );
      done();
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
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("ARG_VALIDATION_ERROR");
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
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("clonePetitionField", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    beforeEach(async (done) => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1
      );
      fields = await mocks.createRandomPetitionFields(userPetition.id, 5);
      done();
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitionField", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    beforeEach(async (done) => {
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

      const [contact] = await mocks.createRandomContacts(
        organization.id,
        user.id,
        1
      );

      const [contactAccess] = await mocks.createPetitionAccess(
        userPetition.id,
        user.id,
        [contact.id]
      );

      await mocks.createRandomTextReply(fields[1].id, contactAccess.id);

      done();
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
        ],
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FIELD_HAS_REPLIES");
      expect(data).toBeNull();
    });
  });

  describe("updateFieldPositions", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    let fieldGIDs: string[];

    beforeEach(async (done) => {
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
      done();
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("INVALID_PETITION_FIELD_IDS");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("INVALID_PETITION_FIELD_IDS");
      expect(data).toBeNull();
    });
  });

  describe("updatePetitionField", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    let fieldGIDs: string[];

    beforeEach(async (done) => {
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
        })
      );

      fieldGIDs = fields.map((f) => toGlobalId("PetitionField", f.id));
      done();
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
        },
      });
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

    it("sends error when field title is too long", async () => {
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
            title:
              "Cupiditate omnis doloremque ut excepturi dolor accusantium qui qui cum. Blanditiis sit nemo ut voluptatem laudantium est voluptas et dolor. Voluptatem explicabo voluptas aut aspernatur molestias et. Iste aut iure modi optio omnis similique voluptates id. Omnis natus ab",
          },
        },
      });
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("ARG_VALIDATION_ERROR");
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
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
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
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
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
      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("ARG_VALIDATION_ERROR");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("ARG_VALIDATION_ERROR");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("ARG_VALIDATION_ERROR");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("changePetitionFieldType", () => {
    let userPetition: Petition;
    let field: PetitionField;
    let fixedHeadingField: PetitionField;
    let fieldWithReply: PetitionField;

    beforeEach(async (done) => {
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

      const [contact] = await mocks.createRandomContacts(
        organization.id,
        user.id,
        1
      );

      const [access] = await mocks.createPetitionAccess(
        userPetition.id,
        user.id,
        [contact.id]
      );

      await mocks.createRandomTextReply(fieldWithReply.id, access.id);

      done();
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FORBIDDEN");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("FIELD_HAS_REPLIES");
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

      expect(errors).toBeDefined();
      expect(errors![0].extensions!.code).toBe("UPDATE_FIXED_FIELD");
      expect(data).toBeNull();
    });
  });
});
