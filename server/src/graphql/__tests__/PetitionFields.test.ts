import { gql } from "@apollo/client";
import faker from "@faker-js/faker";
import { Knex } from "knex";
import { pick } from "remeda";
import { defaultFieldOptions } from "../../db/helpers/fieldOptions";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Contact,
  FileUpload,
  Organization,
  Petition,
  PetitionAccess,
  PetitionField,
  PetitionFieldAttachment,
  PetitionFieldReply,
  PetitionFieldType,
  User,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

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

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    const [otherOrg] = await mocks.createRandomOrganizations(1);
    const [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);
    [privatePetition] = await mocks.createRandomPetitions(otherOrg.id, otherUser.id, 1);
    [privateField] = await mocks.createRandomPetitionFields(privatePetition.id, 1);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("createPetitionField", () => {
    let userPetition: Petition;
    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "DRAFT",
      }));
    });

    it("creates an empty Text field with default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $type: PetitionFieldType!) {
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
                  hasCommentsEnabled
                  isReadOnly
                  replies {
                    id
                  }
                  comments {
                    id
                  }
                }
                fieldCount
              }
              type
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
              hasCommentsEnabled: true,
              options: {
                placeholder: null,
                maxLength: null,
              },
              isReadOnly: false,
              replies: [],
              comments: [],
            },
          ],
          fieldCount: 1,
        },
        type: "TEXT",
      });
    });

    it("creates an empty Heading field with default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $type: PetitionFieldType!) {
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
                  hasCommentsEnabled
                  isReadOnly
                  replies {
                    id
                  }
                  comments {
                    id
                  }
                }
                fieldCount
              }
              type
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
              hasCommentsEnabled: false,
              options: {
                hasPageBreak: false,
              },
              isReadOnly: true,
              replies: [],
              comments: [],
            },
          ],
          fieldCount: 1,
        },
        type: "HEADING",
      });
    });

    it("creates an empty FileUpload field with default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $type: PetitionFieldType!) {
            createPetitionField(petitionId: $petitionId, type: $type) {
              petition {
                fields {
                  title
                  description
                  type
                  isFixed
                  optional
                  multiple
                  hasCommentsEnabled
                  options
                  isReadOnly
                  replies {
                    id
                  }
                  comments {
                    id
                  }
                }
                fieldCount
              }
              type
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
              hasCommentsEnabled: true,
              options: {
                accepts: null,
              },
              isReadOnly: false,
              replies: [],
              comments: [],
            },
          ],
          fieldCount: 1,
        },
        type: "FILE_UPLOAD",
      });
    });

    it("creates fields on custom positions", async () => {
      const createFieldOnPosition = async (type: string, position?: number) => {
        return await testClient.mutate({
          mutation: gql`
            mutation ($petitionId: GID!, $type: PetitionFieldType!, $position: Int) {
              createPetitionField(petitionId: $petitionId, type: $type, position: $position) {
                id
                petition {
                  fields {
                    id
                    type
                  }
                  fieldCount
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
      const { errors, data: f5Data } = await createFieldOnPosition("FILE_UPLOAD", 2);

      expect(errors).toBeUndefined();
      expect(f5Data!.createPetitionField).toEqual({
        petition: {
          fields: [
            { id: f1Data!.createPetitionField.id, type: "HEADING" },
            { id: f2Data!.createPetitionField.id, type: "TEXT" },
            { id: f5Data!.createPetitionField.id, type: "FILE_UPLOAD" },
            { id: f3Data!.createPetitionField.id, type: "TEXT" },
            { id: f4Data!.createPetitionField.id, type: "HEADING" },
          ],
          fieldCount: 5,
        },
        id: f5Data!.createPetitionField.id,
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
          mutation ($petitionId: GID!, $type: PetitionFieldType!) {
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
          mutation ($petitionId: GID!, $type: PetitionFieldType!, $position: Int) {
            createPetitionField(petitionId: $petitionId, type: $type, position: $position) {
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
          mutation ($petitionId: GID!, $type: PetitionFieldType!) {
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
      [userPetition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      fields = await mocks.createRandomPetitionFields(userPetition.id, 5);
    });

    it("clones a field and sets the new one after it", async () => {
      const fieldToClone = fields[3];
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
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

      const fieldTypes: { type: string }[] = fields.map((f) => pick(f, ["type"]));
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
          mutation ($petitionId: GID!, $fieldId: GID!) {
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
          mutation ($petitionId: GID!, $fieldId: GID!) {
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
      [userPetition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "DRAFT",
      }));
      fields = await mocks.createRandomPetitionFields(userPetition.id, 6, (index) => ({
        type: index === 0 ? "HEADING" : "TEXT",
        is_fixed: index === 0,
        validated: index < 4,
      }));

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
          mutation ($petitionId: GID!, $fieldId: GID!) {
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
          mutation ($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: $force) {
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

    it("should not change petition status when deleting fields on a DRAFT petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: $force) {
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
          mutation ($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: $force) {
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
          mutation ($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: $force) {
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
          mutation ($petitionId: GID!, $fieldId: GID!) {
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
          mutation ($petitionId: GID!, $fieldId: GID!) {
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
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: true) {
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

    it("deletes the linked attachments and uploaded files when deleting a field", async () => {
      // TODO try to spy on publicFiles.deleteFile()
      // const awsDeleteFileSpy = jest.spyOn(
      //   testClient.container.get<IAws>(AWS_SERVICE),
      //   "publicFiles"
      // );

      const [newField] = await mocks.createRandomPetitionFields(userPetition.id, 1);

      const [attachment] = await mocks.createPetitionFieldAttachment(newField.id, 1);

      const { errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: true) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", newField.id),
        },
      });

      expect(errors).toBeUndefined();
      const attachments = await mocks
        .knex<PetitionFieldAttachment>("petition_field_attachment")
        .where({ deleted_at: null, petition_field_id: newField.id })
        .select("*");

      const attachedFiles = await mocks
        .knex<FileUpload>("file_upload")
        .where({ deleted_at: null, id: attachment.file_upload_id })
        .select("*");

      expect(attachments).toHaveLength(0);
      expect(attachedFiles).toHaveLength(0);
      // expect(awsDeleteFileSpy).toHaveBeenCalledTimes(1);
    });

    it("don't delete the attached file on S3 if its being used as attachment in other field", async () => {
      // TODO try to spy on publicFiles.deleteFile()
      // const awsDeleteFileSpy = jest.spyOn(
      //   testClient.container.get<IAws>(AWS_SERVICE),
      //   "publicFiles"
      // );
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const newFields = await mocks.createRandomPetitionFields(petition.id, 2);

      const files = await mocks.createRandomFileUpload(2, () => ({ path: "same-path" }));

      // set two attachments with the same file_upload on two different fields
      const [firstAttachment] = await mocks.createPetitionFieldAttachment(newFields[0].id, 1, [
        files[0],
      ]);
      const [secondAttachment] = await mocks.createPetitionFieldAttachment(newFields[1].id, 1, [
        files[1],
      ]);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: true) {
              fields {
                id
                attachments {
                  id
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", newFields[0].id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.deletePetitionField).toEqual({
        fields: [
          {
            id: toGlobalId("PetitionField", newFields[1].id),
            attachments: [{ id: toGlobalId("PetitionFieldAttachment", secondAttachment.id) }],
          },
        ],
      });

      const uploadedFiles = await mocks
        .knex<FileUpload>("file_upload")
        .where({ deleted_at: null, path: "same-path" })
        .select("*");

      expect(uploadedFiles).toHaveLength(1);
      // expect(awsDeleteFileSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe("updateFieldPositions", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    let fieldGIDs: string[];

    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      fields = await mocks.createRandomPetitionFields(userPetition.id, 5, (index) => ({
        type: index === 0 ? "HEADING" : "TEXT",
        is_fixed: index === 0,
      }));

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
                fieldId: fields[1].id,
                modifier: "NONE",
                operator: "CONTAIN",
                value: "$",
              },
            ],
          }),
          fields[4].id,
        ]
      );

      fieldGIDs = fields.map((f) => toGlobalId("PetitionField", f.id));
    });

    it("updates the position of the fields", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
            updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldIds: [fieldGIDs[0], fieldGIDs[2], fieldGIDs[1], fieldGIDs[4], fieldGIDs[3]],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updateFieldPositions).toEqual({
        fields: [
          { id: fieldGIDs[0] },
          { id: fieldGIDs[2] },
          { id: fieldGIDs[1] },
          { id: fieldGIDs[4] },
          { id: fieldGIDs[3] },
        ],
      });
    });

    it("sends error when passing an incomplete fieldIds argument", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
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
          mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
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
          mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
            updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldIds: [fieldGIDs[1], fieldGIDs[2], fieldGIDs[3], fieldGIDs[4], fieldGIDs[0]],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_PETITION_FIELD_IDS");
      expect(data).toBeNull();
    });

    it("sends error when updating a field position leaves a visibility condition refering to a next field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
            updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
              fields {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldIds: [fieldGIDs[0], fieldGIDs[4], fieldGIDs[1], fieldGIDs[2], fieldGIDs[3]],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_FIELD_CONDITIONS_ORDER");
      expect(data).toBeNull();
    });
  });

  describe("updatePetitionField", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    let fieldGIDs: string[];

    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const types: PetitionFieldType[] = ["HEADING", "TEXT", "FILE_UPLOAD"];
      fields = await mocks.createRandomPetitionFields(userPetition.id, 5, (index) => {
        const type = types[index % types.length];
        return {
          type,
          is_fixed: index === 0,
          options: defaultFieldOptions(type).options,
        };
      });

      fieldGIDs = fields.map((f) => toGlobalId("PetitionField", f.id));
    });

    it("updates the petition field with given values", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              title
              description
              hasCommentsEnabled
              options
              optional
              multiple
              visibility
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[4],
          data: {
            description: "this is the new description",
            multiple: true,
            optional: true,
            hasCommentsEnabled: true,
            options: {
              placeholder: "enter text here...",
              maxLength: 100,
            },
            title: "new title",
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
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
        id: fieldGIDs[4],
        title: "new title",
        description: "this is the new description",
        hasCommentsEnabled: true,
        options: {
          placeholder: "enter text here...",
          maxLength: 100,
        },
        optional: true,
        multiple: true,
        visibility: {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              fieldId: fieldGIDs[2],
              modifier: "NUMBER_OF_REPLIES",
              operator: "EQUAL",
              value: 1,
            },
          ],
        },
      });
    });

    it("should allow updating the petition field with a null condition value", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              visibility
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[4],
          data: {
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fieldGIDs[2],
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
        id: fieldGIDs[4],
        visibility: {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              fieldId: fieldGIDs[2],
              modifier: "NUMBER_OF_REPLIES",
              operator: "EQUAL",
              value: null,
            },
          ],
        },
      });
    });

    it("sends error when updating petition field with invalid visibility json", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              visibility
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

    it("sends error when adding visibility conditions refering to a next field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              visibility
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
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to add visibility conditions on a heading with page break", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              visibility
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[0],
          data: {
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fieldGIDs[1],
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
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              title
              description
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
        title: "new title",
        description: "this is the new description",
      });
    });

    it("sets petition status to pending when updating a field from optional to required", async () => {
      // first set petition to closed
      const { data: pre } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            closePetition(petitionId: $petitionId) {
              status
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
        },
      });
      expect(pre!.closePetition).toEqual({
        status: "CLOSED",
      });

      // then update field to required, petition status should change
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              petition {
                ... on Petition {
                  status
                }
              }
              id
              optional
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
        id: fieldGIDs[4],
        optional: false,
      });
    });

    it("sends error when field title is longer than 500 chars", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
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
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
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
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
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
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
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
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
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
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[1],
          data: {
            options: { placeholder: "foo", extra: false },
          },
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a field with invalid type values on options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
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
      [userPetition] = await mocks.createRandomPetitions(organization.id, user.id, 1);

      [fixedHeadingField] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "HEADING",
        is_fixed: true,
      }));

      [field] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "TEXT",
      }));

      [fieldWithReply] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "TEXT",
      }));

      const [contact] = await mocks.createRandomContacts(organization.id, 1);

      const [access] = await mocks.createPetitionAccess(
        userPetition.id,
        user.id,
        [contact.id],
        user.id
      );

      await mocks.createRandomTextReply(fieldWithReply.id, access.id);
    });

    it("changes field type to SHORT_TEXT and sets its default options merging with existents", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(fieldId: $fieldId, petitionId: $petitionId, type: $type) {
              id
              type
              optional
              multiple
              options
              hasCommentsEnabled
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          type: "SHORT_TEXT",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.changePetitionFieldType).toEqual({
        id: toGlobalId("PetitionField", field.id),
        type: "SHORT_TEXT",
        optional: field.optional,
        multiple: field.multiple,
        hasCommentsEnabled: true,
        options: {
          placeholder: field.options.placeholder,
          maxLength: null,
        },
      });
    });

    it("changes field type to HEADING and sets its default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(fieldId: $fieldId, petitionId: $petitionId, type: $type) {
              id
              type
              optional
              multiple
              options
              hasCommentsEnabled
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
        id: toGlobalId("PetitionField", field.id),
        type: "HEADING",
        optional: true,
        multiple: false,
        hasCommentsEnabled: false,
        options: {
          hasPageBreak: false,
        },
      });
    });

    it("changes field type to FILE_UPLOAD and sets its default options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(fieldId: $fieldId, petitionId: $petitionId, type: $type) {
              id
              type
              optional
              multiple
              options
              hasCommentsEnabled
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
        id: toGlobalId("PetitionField", field.id),
        type: "FILE_UPLOAD",
        optional: false,
        multiple: true,
        hasCommentsEnabled: true,
        options: {
          accepts: null,
        },
      });
    });

    it("changes field type and persists its replies", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!, $force: Boolean) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
              force: $force
            ) {
              id
              type
              replies {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fieldWithReply.id),
          type: "SHORT_TEXT",
          force: true,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.changePetitionFieldType).toEqual({
        id: toGlobalId("PetitionField", fieldWithReply.id),
        type: "SHORT_TEXT",
        replies: [{ id: expect.any(String) }],
      });
    });

    it("changes field type and deletes its replies", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!, $force: Boolean) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
              force: $force
            ) {
              id
              type
              replies {
                id
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
        id: toGlobalId("PetitionField", fieldWithReply.id),
        type: "FILE_UPLOAD",
        replies: [],
      });
    });

    it("sends error when trying to change a field on a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!, $force: Boolean) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
              force: $force
            ) {
              id
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
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!, $force: Boolean) {
            changePetitionFieldType(
              fieldId: $fieldId
              petitionId: $petitionId
              type: $type
              force: $force
            ) {
              id
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
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(fieldId: $fieldId, petitionId: $petitionId, type: $type) {
              id
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
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(fieldId: $fieldId, petitionId: $petitionId, type: $type) {
              id
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

  describe("updatePetitionFieldRepliesStatus", () => {
    let petition: Petition;
    let contact: Contact;
    let access: PetitionAccess;
    let fields: PetitionField[];
    let field2Replies: PetitionFieldReply[];

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);

      [contact] = await mocks.createRandomContacts(organization.id, 1);
      [access] = await mocks.createPetitionAccess(petition.id, user.id, [contact.id], user.id);

      fields = await mocks.createRandomPetitionFields(petition.id, 3, () => ({
        type: "TEXT",
        options: {
          placeholder: faker.random.words(3),
        },
        validated: false,
      }));

      field2Replies = await mocks.createRandomTextReply(fields[2].id, access.id, 2, () => ({
        status: "PENDING",
      }));
    });

    it("updates status of a petition field reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
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
          petitionFieldReplyIds: [toGlobalId("PetitionFieldReply", field2Replies[0].id)],
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
          {
            id: toGlobalId("PetitionFieldReply", field2Replies[1].id),
            status: "PENDING",
          },
        ],
      });
    });

    it("sends error when passing invalid petitionId", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
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
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          petitionFieldId: toGlobalId("PetitionField", fields[2].id),
          petitionFieldReplyIds: field2Replies.map((r) => toGlobalId("PetitionFieldReply", r.id)),
          status: "APPROVED",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when passing invalid petitionFieldId", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
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
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", 123123),
          petitionFieldReplyIds: field2Replies.map((r) => toGlobalId("PetitionFieldReply", r.id)),
          status: "APPROVED",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when passing invalid petitionFieldReplyIds", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
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
              id
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
