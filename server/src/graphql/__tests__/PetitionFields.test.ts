import { faker } from "@faker-js/faker";
import gql from "graphql-tag";
import { Knex } from "knex";
import { indexBy, pick } from "remeda";
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
  ProfileRelationshipType,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldTypeValues,
  User,
  UserGroup,
} from "../../db/__types";
import { defaultFieldProperties } from "../../db/helpers/fieldOptions";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { PROFILES_SETUP_SERVICE, ProfilesSetupService } from "../../services/ProfilesSetupService";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("GraphQL/Petition Fields", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let user: User;
  let organization: Organization;
  let privatePetition: Petition;
  let privateField: PetitionField;

  let readPetition: Petition;
  let readPetitionField: PetitionField;

  let userGroup: UserGroup;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    const [otherOrg] = await mocks.createRandomOrganizations(1);
    const [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);
    [privatePetition] = await mocks.createRandomPetitions(otherOrg.id, otherUser.id, 1);
    [privateField] = await mocks.createRandomPetitionFields(privatePetition.id, 1);
    [readPetition] = await mocks.createRandomPetitions(
      organization.id,
      user.id,
      1,
      undefined,
      () => ({ type: "READ" }),
    );
    [readPetitionField] = await mocks.createRandomPetitionFields(readPetition.id, 1, () => ({
      type: "TEXT",
    }));

    await mocks.createFeatureFlags([{ name: "DOW_JONES_KYC", default_value: true }]);

    [userGroup] = await mocks.createUserGroups(1, organization.id, [
      { name: "PROFILES:CREATE_PROFILES", effect: "GRANT" },
    ]);
    await mocks.insertUserGroupMembers(userGroup.id, [user.id]);
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

    it("sends error when trying to create a field with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $type: PetitionFieldType!) {
            createPetitionField(petitionId: $petitionId, type: $type) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          type: "TEXT",
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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
                  requireApproval
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
              requireApproval: true,
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
                  requireApproval
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
              requireApproval: false,
              options: {
                hasPageBreak: false,
                showNumbering: false,
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
                  requireApproval
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
              requireApproval: true,
              options: {
                accepts: null,
                attachToPdf: false,
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
        }),
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

    it("creates a field as child of a FIELD_GROUP field", async () => {
      const [fieldGroup] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));
      const children = await mocks.createRandomPetitionFields(userPetition.id, 2, (i) => ({
        type: ["TEXT", "SHORT_TEXT"][i] as PetitionFieldType,
        parent_petition_field_id: fieldGroup.id,
        position: i,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $parentFieldId: GID
            $position: Int
            $type: PetitionFieldType!
          ) {
            createPetitionField(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              position: $position
              type: $type
            ) {
              type
              position
              petition {
                fieldCount
                fields {
                  id
                  type
                  position
                  children {
                    id
                    type
                    position
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
          position: 1,
          type: "PHONE",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionField).toEqual({
        type: "PHONE",
        position: 1,
        petition: {
          fieldCount: 1,
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroup.id),
              type: "FIELD_GROUP",
              position: 0,
              children: [
                {
                  id: toGlobalId("PetitionField", children[0].id),
                  type: "TEXT",
                  position: 0,
                },
                {
                  id: expect.any(String),
                  type: "PHONE",
                  position: 1,
                },
                {
                  id: toGlobalId("PetitionField", children[1].id),
                  type: "SHORT_TEXT",
                  position: 2,
                },
              ],
            },
          ],
        },
      });
    });

    it("creates a required FIELD_GROUP field and its reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $type: PetitionFieldType!) {
            createPetitionField(petitionId: $petitionId, type: $type) {
              id
              replies {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          type: "FIELD_GROUP",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionField).toEqual({
        id: expect.any(String),
        replies: [{ id: expect.any(String) }],
      });
    });

    it("creates the field as internal if parent is internal", async () => {
      const [parent] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "FIELD_GROUP",
        is_internal: true,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $type: PetitionFieldType!) {
            createPetitionField(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              type: $type
            ) {
              type
              isInternal
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          parentFieldId: toGlobalId("PetitionField", parent.id),
          type: "TEXT",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionField).toEqual({
        type: "TEXT",
        isInternal: true,
      });
    });

    it("creates a HEADING with enabled automatic numbering if petition is configured", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        automatic_numbering_config: { numbering_type: "NUMBERS" },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $type: PetitionFieldType!) {
            createPetitionField(petitionId: $petitionId, type: $type) {
              type
              options
              petition {
                automaticNumberingConfig {
                  numberingType
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          type: "HEADING",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionField).toEqual({
        type: "HEADING",
        options: { hasPageBreak: false, showNumbering: true },
        petition: {
          automaticNumberingConfig: {
            numberingType: "NUMBERS",
          },
        },
      });
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

    it("sends error when trying to clone a field with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          fieldId: toGlobalId("PetitionField", readPetitionField.id),
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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

    it("clones FIELD_GROUP field and all its children", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));

      const children = await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
        parent_petition_field_id: fieldGroup.id,
        position: i,
      }));

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              fieldCount
              fields {
                id
                type
                position
                children {
                  id
                  position
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.petition).toEqual({
        fieldCount: 1,
        fields: [
          {
            id: toGlobalId("PetitionField", fieldGroup.id),
            type: "FIELD_GROUP",
            position: 0,
            children: [
              {
                id: toGlobalId("PetitionField", children[0].id),
                position: 0,
              },
              {
                id: toGlobalId("PetitionField", children[1].id),
                position: 1,
              },
              {
                id: toGlobalId("PetitionField", children[2].id),
                position: 2,
              },
            ],
          },
        ],
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
              type
              children {
                id
              }
              petition {
                fieldCount
                fields {
                  id
                  type
                  children {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fieldGroup.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.clonePetitionField).toEqual({
        id: expect.any(String),
        type: "FIELD_GROUP",
        children: [
          {
            id: expect.any(String),
          },
          {
            id: expect.any(String),
          },
          {
            id: expect.any(String),
          },
        ],
        petition: {
          fieldCount: 2,
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroup.id),
              type: "FIELD_GROUP",
              children: [
                {
                  id: toGlobalId("PetitionField", children[0].id),
                },
                {
                  id: toGlobalId("PetitionField", children[1].id),
                },
                {
                  id: toGlobalId("PetitionField", children[2].id),
                },
              ],
            },
            {
              id: expect.any(String),
              type: "FIELD_GROUP",
              children: [
                {
                  id: expect.any(String),
                },
                {
                  id: expect.any(String),
                },
                {
                  id: expect.any(String),
                },
              ],
            },
          ],
        },
      });
    });

    it("clones child field inside of parent", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));

      const children = await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
        parent_petition_field_id: fieldGroup.id,
        position: i,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              type
              position
              petition {
                fieldCount
                fields {
                  id
                  type
                  children {
                    id
                    position
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", children[1].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.clonePetitionField).toEqual({
        type: children[1].type,
        position: 2,
        petition: {
          fieldCount: 1,
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroup.id),
              type: "FIELD_GROUP",
              children: [
                {
                  id: toGlobalId("PetitionField", children[0].id),
                  position: 0,
                },
                {
                  id: toGlobalId("PetitionField", children[1].id),
                  position: 1,
                },
                {
                  id: expect.any(String),
                  position: 2,
                },
                {
                  id: toGlobalId("PetitionField", children[2].id),
                  position: 3,
                },
              ],
            },
          ],
        },
      });
    });

    it("creates empty FIELD_GROUP reply when cloning a required FIELD_GROUP field", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        optional: false,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
              position
              replies {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fieldGroup.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.clonePetitionField).toEqual({
        id: expect.any(String),
        position: 1,
        replies: [{ id: expect.any(String) }],
      });
    });

    it("does not create empty reply when cloning an optional FIELD_GROUP field", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        optional: true,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
              position
              replies {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fieldGroup.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.clonePetitionField).toEqual({
        id: expect.any(String),
        position: 1,
        replies: [],
      });
    });

    it("updates self-references on math conditions when cloning the field", async () => {
      const [field] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "TEXT",
      }));
      await mocks.knex.raw(
        /* sql */ `
        update petition_field set math = ? where id = ?
      `,
        [
          JSON.stringify([
            {
              operator: "AND",
              conditions: [
                {
                  fieldId: field.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "EQUAL",
                  value: 1,
                },
              ],
              operations: [
                {
                  operator: "ASSIGNATION",
                  operand: { type: "NUMBER", value: 10 },
                  variable: "score",
                },
              ],
            },
          ]),
          field.id,
        ],
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
              math
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", field.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.clonePetitionField).toEqual({
        id: expect.any(String),
        math: [
          {
            operator: "AND",
            conditions: [
              {
                fieldId: data.clonePetitionField.id,
                modifier: "NUMBER_OF_REPLIES",
                operator: "EQUAL",
                value: 1,
              },
            ],
            operations: [
              {
                operator: "ASSIGNATION",
                operand: { type: "NUMBER", value: 10 },
                variable: "score",
              },
            ],
          },
        ],
      });
    });

    it("updates self-references on math conditions inside children when cloning a FIELD_GROUP field", async () => {
      const [fieldGroup] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));
      const [child] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "TEXT",
        position: 0,
        parent_petition_field_id: fieldGroup.id,
      }));

      await mocks.knex.raw(
        /* sql */ `
        update petition_field set math = ? where id = ?
      `,
        [
          JSON.stringify([
            {
              operator: "AND",
              conditions: [
                {
                  fieldId: child.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "EQUAL",
                  value: 1,
                },
              ],
              operations: [
                {
                  operator: "ASSIGNATION",
                  operand: { type: "NUMBER", value: 10 },
                  variable: "score",
                },
              ],
            },
          ]),
          child.id,
        ],
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
              children {
                id
                math
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fieldGroup.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.clonePetitionField).toEqual({
        id: expect.any(String),
        children: [
          {
            id: expect.any(String),
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: data.clonePetitionField.children[0].id,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "EQUAL",
                    value: 1,
                  },
                ],
                operations: [
                  {
                    operator: "ASSIGNATION",
                    operand: { type: "NUMBER", value: 10 },
                    variable: "score",
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("updates the ids of the autoSearch fields when cloning a FIELD_GROUP with BACKGROUND_CHECK child and autoSearchConfig", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));
      const [name, date, backgroundCheck] = await mocks.createRandomPetitionFields(
        petition.id,
        3,
        (i) => ({
          type: ["SHORT_TEXT", "DATE", "BACKGROUND_CHECK"][i] as PetitionFieldType,
          parent_petition_field_id: fieldGroup.id,
        }),
      );

      await mocks.knex
        .from("petition_field")
        .where("id", backgroundCheck.id)
        .update({
          options: JSON.stringify({
            autoSearchConfig: { name: [name.id], date: date.id, type: null },
          }),
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              type
              children {
                id
                type
                options
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fieldGroup.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.clonePetitionField).toEqual({
        type: "FIELD_GROUP",
        children: [
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            options: expect.any(Object),
          },
          {
            id: expect.any(String),
            type: "DATE",
            options: expect.any(Object),
          },
          {
            id: expect.any(String),
            type: "BACKGROUND_CHECK",
            options: {
              autoSearchConfig: {
                type: null,
                name: [data.clonePetitionField.children[0].id],
                date: data.clonePetitionField.children[1].id,
              },
            },
          },
        ],
      });
    });

    it("fails if trying to clone field that is linked to a profile type field", async () => {
      const [profileType] = await mocks.knex
        .from("profile_type")
        .insert({ org_id: organization.id, name: { en: "Profile Type" } }, "*");

      const [profileTypeField] = await mocks.knex.from("profile_type_field").insert(
        {
          type: "SHORT_TEXT",
          name: { en: "Name" },
          profile_type_id: profileType.id,
          position: 0,
        },
        "*",
      );

      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        profile_type_id: profileType.id,
      }));

      const [childField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "SHORT_TEXT",
        parent_petition_field_id: fieldGroup.id,
        profile_type_field_id: profileTypeField.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", childField.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitionField", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    let fieldGroup1Children: PetitionField[];
    let fieldGroup2Children: PetitionField[];

    async function setVisibility(fieldId: number, referencedFieldId: number) {
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
                fieldId: referencedFieldId,
                modifier: "NONE",
                operator: "CONTAIN",
                value: "$",
              },
            ],
          }),
          fieldId,
        ],
      );
    }

    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "DRAFT",
      }));
      fields = await mocks.createRandomPetitionFields(userPetition.id, 7, (i) => ({
        type: ["HEADING", "TEXT", "SHORT_TEXT", "FIELD_GROUP", "PHONE", "NUMBER", "FIELD_GROUP"][
          i
        ] as PetitionFieldType,
        is_fixed: i === 0,
      }));

      fieldGroup1Children = await mocks.createRandomPetitionFields(userPetition.id, 4, (i) => ({
        parent_petition_field_id: fields[3].id,
        position: i,
        type: "TEXT",
      }));

      fieldGroup2Children = await mocks.createRandomPetitionFields(userPetition.id, 1, (i) => ({
        parent_petition_field_id: fields[6].id,
        position: i,
        type: "TEXT",
      }));

      await setVisibility(fields[1].id, fields[5].id);

      const [contact] = await mocks.createRandomContacts(organization.id, 1);

      const [contactAccess] = await mocks.createPetitionAccess(
        userPetition.id,
        user.id,
        [contact.id],
        user.id,
      );

      await mocks.createRandomTextReply(fields[1].id, contactAccess.id);
    });

    it("sends error when trying to delete a field with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          fieldId: toGlobalId("PetitionField", readPetitionField.id),
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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
          { id: gIds[6] },
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
          { id: gIds[6], replies: [] },
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

    it("sends error when trying to delete a field that is being referenced in the math conditions of another field", async () => {
      await mocks.knex.raw(
        /* sql */ `
          update petition_field set math = ? where id = ?
        `,
        [
          JSON.stringify([
            {
              operator: "AND",
              conditions: [
                {
                  operator: "EQUAL",
                  value: 10,
                  fieldId: fields[2].id,
                  modifier: "NUMBER_OF_REPLIES",
                },
              ],
              operations: [
                {
                  variable: "var",
                  operand: { type: "NUMBER", value: 0 },
                  operator: "ASSIGNATION",
                },
              ],
            },
          ]),
          fields[4].id,
        ],
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: true) {
              fields {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[2].id),
        },
      );

      expect(errors).toContainGraphQLError("FIELD_IS_REFERENCED_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to delete a field that is being referenced in the math operations of another field", async () => {
      await mocks.knex.raw(
        /* sql */ `
            update petition_field set math = ? where id = ?
          `,
        [
          JSON.stringify([
            {
              operator: "AND",
              conditions: [
                {
                  operator: "EQUAL",
                  value: 10,
                  variableName: "variable",
                },
              ],
              operations: [
                {
                  variable: "var",
                  operand: { type: "FIELD", fieldId: fields[2].id },
                  operator: "ASSIGNATION",
                },
              ],
            },
          ]),
          fields[4].id,
        ],
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: true) {
              fields {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[2].id),
        },
      );

      expect(errors).toContainGraphQLError("FIELD_IS_REFERENCED_ERROR");
      expect(data).toBeNull();
    });

    it("allows to delete field if its referencing itself in its math conditions", async () => {
      await mocks.knex.raw(
        /* sql */ `
          update petition_field set math = ? where id = ?
        `,
        [
          JSON.stringify([
            {
              operator: "AND",
              conditions: [
                {
                  operator: "EQUAL",
                  value: 10,
                  fieldId: fields[2].id,
                  modifier: "NUMBER_OF_REPLIES",
                },
              ],
              operations: [
                {
                  variable: "var",
                  operand: { type: "NUMBER", value: 0 },
                  operator: "ASSIGNATION",
                },
              ],
            },
          ]),
          fields[2].id,
        ],
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: true) {
              fields {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[2].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionField).toEqual({
        fields: [
          { id: toGlobalId("PetitionField", fields[0].id) },
          { id: toGlobalId("PetitionField", fields[1].id) },
          { id: toGlobalId("PetitionField", fields[3].id) },
          { id: toGlobalId("PetitionField", fields[4].id) },
          { id: toGlobalId("PetitionField", fields[5].id) },
          { id: toGlobalId("PetitionField", fields[6].id) },
        ],
      });
    });

    it("allows to delete field if its referencing itself in its math operations", async () => {
      await mocks.knex.raw(
        /* sql */ `
            update petition_field set math = ? where id = ?
          `,
        [
          JSON.stringify([
            {
              operator: "AND",
              conditions: [
                {
                  operator: "EQUAL",
                  value: 10,
                  variableName: "variable",
                },
              ],
              operations: [
                {
                  variable: "var",
                  operand: { type: "FIELD", fieldId: fields[2].id },
                  operator: "ASSIGNATION",
                },
              ],
            },
          ]),
          fields[2].id,
        ],
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: true) {
              fields {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[2].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionField).toEqual({
        fields: [
          { id: toGlobalId("PetitionField", fields[0].id) },
          { id: toGlobalId("PetitionField", fields[1].id) },
          { id: toGlobalId("PetitionField", fields[3].id) },
          { id: toGlobalId("PetitionField", fields[4].id) },
          { id: toGlobalId("PetitionField", fields[5].id) },
          { id: toGlobalId("PetitionField", fields[6].id) },
        ],
      });
    });

    it("deletes the linked attachments and uploaded files when deleting a field", async () => {
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
    });

    it("don't delete the attached file on S3 if its being used as attachment in other field", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const newFields = await mocks.createRandomPetitionFields(petition.id, 2);

      const files = await mocks.createRandomFileUpload(2, () => ({ path: "same-path" }));

      // set two attachments with the same file_upload on two different fields
      await mocks.createPetitionFieldAttachment(newFields[0].id, 1, [files[0]]);
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
    });

    it("should delete all the children of a FIELD_GROUP field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              fieldCount
              fields {
                id
                type
                position
                children {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[3].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionField).toEqual({
        fieldCount: 6,
        fields: [
          {
            id: toGlobalId("PetitionField", fields[0].id),
            type: "HEADING",
            position: 0,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[1].id),
            type: "TEXT",
            position: 1,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[2].id),
            type: "SHORT_TEXT",
            position: 2,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[4].id),
            type: "PHONE",
            position: 3,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[5].id),
            type: "NUMBER",
            position: 4,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[6].id),
            type: "FIELD_GROUP",
            position: 5,
            children: [
              {
                id: toGlobalId("PetitionField", fieldGroup2Children[0].id),
              },
            ],
          },
        ],
      });

      const dbChildren = await mocks.knex
        .from("petition_field")
        .whereIn(
          "id",
          fieldGroup1Children.map((f) => f.id),
        )
        .select("deleted_at");

      expect(dbChildren).toEqual([
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
      ]);
    });

    it("should send error when any child is being referenced", async () => {
      await setVisibility(fields[5].id, fieldGroup1Children[0].id);
      await setVisibility(fields[6].id, fieldGroup1Children[1].id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[3].id),
        },
      );

      expect(errors).toContainGraphQLError("FIELD_IS_REFERENCED_ERROR");
      expect(errors?.[0].extensions?.referencingFieldIds).toHaveLength(2);
      expect(errors?.[0].extensions?.referencingFieldIds).toIncludeSameMembers([
        toGlobalId("PetitionField", fields[5].id),
        toGlobalId("PetitionField", fields[6].id),
      ]);
      expect(data).toBeNull();
    });

    it("should send error when any child is being referenced by a child of another field", async () => {
      await setVisibility(fieldGroup2Children[0].id, fieldGroup1Children[0].id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[3].id),
        },
      );

      expect(errors).toContainGraphQLError("FIELD_IS_REFERENCED_ERROR", {
        referencingFieldIds: [toGlobalId("PetitionField", fieldGroup2Children[0].id)],
      });
      expect(data).toBeNull();
    });

    it("should delete successfully if the field is being referenced by any of its children", async () => {
      await setVisibility(fieldGroup1Children[1].id, fields[3].id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              fieldCount
              fields {
                id
                type
                position
                children {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[3].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionField).toEqual({
        fieldCount: 6,
        fields: [
          {
            id: toGlobalId("PetitionField", fields[0].id),
            type: "HEADING",
            position: 0,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[1].id),
            type: "TEXT",
            position: 1,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[2].id),
            type: "SHORT_TEXT",
            position: 2,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[4].id),
            type: "PHONE",
            position: 3,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[5].id),
            type: "NUMBER",
            position: 4,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[6].id),
            type: "FIELD_GROUP",
            position: 5,
            children: [
              {
                id: toGlobalId("PetitionField", fieldGroup2Children[0].id),
              },
            ],
          },
        ],
      });
    });

    it("should send error when any children has replies and force flag is not passed", async () => {
      const [parentReply] = await mocks.createFieldGroupReply(fields[3].id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createRandomTextReply(fieldGroup1Children[0].id, undefined, 1, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: parentReply.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[3].id),
        },
      );

      expect(errors).toContainGraphQLError("FIELD_HAS_REPLIES_ERROR");
      expect(data).toBeNull();
    });

    it("should delete parent field and all its children, replies and field attachments", async () => {
      const children0Replies = await mocks.createRandomTextReply(
        fieldGroup1Children[0].id,
        undefined,
        2,
        () => ({ user_id: user.id }),
      );
      const children1Replies = await mocks.createRandomTextReply(
        fieldGroup1Children[1].id,
        undefined,
        2,
        () => ({ user_id: user.id }),
      );

      const attachments = await mocks.createPetitionFieldAttachment(fieldGroup1Children[0].id, 2);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: $force) {
              fieldCount
              fields {
                id
                type
                position
                children {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[3].id),
          force: true,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionField).toEqual({
        fieldCount: 6,
        fields: [
          {
            id: toGlobalId("PetitionField", fields[0].id),
            type: "HEADING",
            position: 0,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[1].id),
            type: "TEXT",
            position: 1,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[2].id),
            type: "SHORT_TEXT",
            position: 2,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[4].id),
            type: "PHONE",
            position: 3,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[5].id),
            type: "NUMBER",
            position: 4,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[6].id),
            type: "FIELD_GROUP",
            position: 5,
            children: [
              {
                id: toGlobalId("PetitionField", fieldGroup2Children[0].id),
              },
            ],
          },
        ],
      });

      const dbReplies = await mocks.knex
        .from("petition_field_reply")
        .whereIn("id", [...children0Replies.map((r) => r.id), ...children1Replies.map((r) => r.id)])
        .select("deleted_at");

      expect(dbReplies).toEqual([
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
      ]);

      const dbAttachments = await mocks.knex
        .from("petition_field_attachment")
        .whereIn(
          "id",
          attachments.map((a) => a.id),
        )
        .select("deleted_at");

      expect(dbAttachments).toEqual([
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
      ]);
    });

    it("updates the position of the remaining children when deleting a FIELD_GROUP child", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              fieldCount
              fields {
                id
                type
                children {
                  id

                  position
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fieldGroup1Children[2].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionField).toEqual({
        fieldCount: 7,
        fields: [
          {
            id: toGlobalId("PetitionField", fields[0].id),
            type: "HEADING",
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[1].id),
            type: "TEXT",
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[2].id),
            type: "SHORT_TEXT",
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[3].id),
            type: "FIELD_GROUP",
            children: [
              {
                id: toGlobalId("PetitionField", fieldGroup1Children[0].id),
                position: 0,
              },
              {
                id: toGlobalId("PetitionField", fieldGroup1Children[1].id),
                position: 1,
              },
              {
                id: toGlobalId("PetitionField", fieldGroup1Children[3].id),
                position: 2,
              },
            ],
          },
          {
            id: toGlobalId("PetitionField", fields[4].id),
            type: "PHONE",
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[5].id),
            type: "NUMBER",
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[6].id),
            type: "FIELD_GROUP",
            children: [
              {
                id: toGlobalId("PetitionField", fieldGroup2Children[0].id),
                position: 0,
              },
            ],
          },
        ],
      });
    });

    it("sends error if deleting a child field results in first new child having visibility conditions", async () => {
      // set visibility to 2nd child
      await mocks.knex.raw(
        /* sql */ `
        update petition_field set visibility = ? where id = ?
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
          fieldGroup1Children[1].id,
        ],
      );

      // delete 1st child gives error
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fieldGroup1Children[0].id),
        },
      );

      expect(errors).toContainGraphQLError("FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if deleting a child field results in first new child being internal", async () => {
      await mocks.knex.from("petition_field").where("id", fieldGroup1Children[1].id).update({
        is_internal: true,
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fieldGroup1Children[0].id),
        },
      );

      expect(errors).toContainGraphQLError("FIRST_CHILD_IS_INTERNAL_ERROR");
      expect(data).toBeNull();
    });

    it("allows to delete FIELD_GROUP field without force if it has only empty replies", async () => {
      await mocks.createFieldGroupReply(fields[3].id, undefined, 2, () => ({
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              fieldCount
              fields {
                id
                type
                position
                children {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[3].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionField).toEqual({
        fieldCount: 6,
        fields: [
          {
            id: toGlobalId("PetitionField", fields[0].id),
            type: "HEADING",
            position: 0,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[1].id),
            type: "TEXT",
            position: 1,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[2].id),
            type: "SHORT_TEXT",
            position: 2,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[4].id),
            type: "PHONE",
            position: 3,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[5].id),
            type: "NUMBER",
            position: 4,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[6].id),
            type: "FIELD_GROUP",
            position: 5,
            children: [
              {
                id: toGlobalId("PetitionField", fieldGroup2Children[0].id),
              },
            ],
          },
        ],
      });
    });

    it("removes relationships when deleting a field", async () => {
      const [relationshipType] = await mocks.knex.from("profile_relationship_type").insert(
        [
          {
            org_id: organization.id,
            alias: "sideA__sideB",
            left_right_name: { en: "Side A" },
            right_left_name: { en: "Side B" },
            is_reciprocal: false,
          },
        ],
        "*",
      );

      await mocks.knex.from("petition_field_group_relationship").insert([
        {
          petition_id: userPetition.id,
          left_side_petition_field_id: fields[3].id,
          right_side_petition_field_id: fields[6].id,
          profile_relationship_type_id: relationshipType.id,
          direction: "LEFT_RIGHT",
        },
        {
          petition_id: userPetition.id,
          left_side_petition_field_id: fields[4].id,
          right_side_petition_field_id: fields[3].id,
          profile_relationship_type_id: relationshipType.id,
          direction: "LEFT_RIGHT",
        },
        {
          petition_id: userPetition.id,
          left_side_petition_field_id: fields[6].id,
          right_side_petition_field_id: fields[4].id,
          profile_relationship_type_id: relationshipType.id,
          direction: "LEFT_RIGHT",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              fieldRelationships {
                leftSidePetitionField {
                  id
                }
                rightSidePetitionField {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[3].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionField).toEqual({
        fieldRelationships: [
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", fields[6].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", fields[4].id),
            },
          },
        ],
      });
    });
  });

  describe("updateFieldPositions", () => {
    let petition: Petition;
    let fields: PetitionField[];
    let fieldGIDs: string[];

    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      fields = await mocks.createRandomPetitionFields(petition.id, 5, (index) => ({
        type: index === 0 ? "HEADING" : "TEXT",
        is_fixed: index === 0,
        optional: true,
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
        ],
      );

      fieldGIDs = fields.map((f) => toGlobalId("PetitionField", f.id));
    });

    it("sends error when trying to reorder fields with READ access", async () => {
      const readFields = await mocks.createRandomPetitionFields(readPetition.id, 4, () => ({
        type: "TEXT",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
            updateFieldPositions(petitionId: $petitionId, fieldIds: $fieldIds) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          fieldIds: [
            toGlobalId("PetitionField", readFields[2].id),
            toGlobalId("PetitionField", readFields[0].id),
            toGlobalId("PetitionField", readFields[1].id),
            toGlobalId("PetitionField", readFields[3].id),
          ],
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("updates the position of the fields", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
            updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
              fields {
                id
                optional
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [fieldGIDs[0], fieldGIDs[2], fieldGIDs[1], fieldGIDs[4], fieldGIDs[3]],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updateFieldPositions).toEqual({
        fields: [
          { id: fieldGIDs[0], optional: true },
          { id: fieldGIDs[2], optional: true },
          { id: fieldGIDs[1], optional: true },
          { id: fieldGIDs[4], optional: true },
          { id: fieldGIDs[3], optional: true },
        ],
      });
    });

    it("updates positions multiple times at once", async () => {
      await mocks.knex.raw(
        /* sql */ `
        UPDATE petition_field SET visibility = null WHERE petition_id = ?
      `,
        [petition.id],
      );

      const results = await Promise.all(
        [
          [fieldGIDs[0], fieldGIDs[2], fieldGIDs[1], fieldGIDs[4], fieldGIDs[3]],
          [fieldGIDs[0], fieldGIDs[2], fieldGIDs[4], fieldGIDs[1], fieldGIDs[3]],
          [fieldGIDs[0], fieldGIDs[3], fieldGIDs[1], fieldGIDs[2], fieldGIDs[4]],
          [fieldGIDs[0], fieldGIDs[4], fieldGIDs[3], fieldGIDs[2], fieldGIDs[1]],
          [fieldGIDs[0], fieldGIDs[1], fieldGIDs[2], fieldGIDs[3], fieldGIDs[4]],
          [fieldGIDs[0], fieldGIDs[3], fieldGIDs[2], fieldGIDs[4], fieldGIDs[1]],
        ].map((fieldIds) =>
          testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
                updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
                  fields {
                    id
                  }
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fieldIds,
            },
          ),
        ),
      );

      expect(results).toMatchObject([
        { errors: undefined },
        { errors: undefined },
        { errors: undefined },
        { errors: undefined },
        { errors: undefined },
        { errors: undefined },
      ]);
    });

    it("updates positions multiple times at once, ignoring errors", async () => {
      const results = await Promise.all(
        [
          [fieldGIDs[0], fieldGIDs[2], fieldGIDs[1], fieldGIDs[4], fieldGIDs[3]], // OK
          [fieldGIDs[1], fieldGIDs[2], fieldGIDs[4], fieldGIDs[0], fieldGIDs[3]], // trying to move fixed HEADING, throws error
          [fieldGIDs[0], fieldGIDs[4], fieldGIDs[1], fieldGIDs[2], fieldGIDs[3]], // moving visibility condition, throws error
          [fieldGIDs[0], fieldGIDs[1], fieldGIDs[2], fieldGIDs[3], fieldGIDs[4]], // OK
          [fieldGIDs[0], fieldGIDs[1], fieldGIDs[2], fieldGIDs[3]], // not enough IDS, throws error
          [fieldGIDs[0], fieldGIDs[3], fieldGIDs[2], fieldGIDs[1], fieldGIDs[4]], // OK
        ].map((fieldIds) =>
          testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
                updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
                  fields {
                    id
                  }
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fieldIds,
            },
          ),
        ),
      );

      expect(results[0].errors).toBeUndefined();
      expect(results[1].errors).toContainGraphQLError("INVALID_PETITION_FIELD_IDS");
      expect(results[2].errors).toContainGraphQLError("INVALID_FIELD_CONDITIONS_ORDER");
      expect(results[3].errors).toBeUndefined();
      expect(results[4].errors).toContainGraphQLError("INVALID_PETITION_FIELD_IDS");
      expect(results[5].errors).toBeUndefined();
    });

    it("returns fields ordered by successful mutation", async () => {
      const results = await Promise.all(
        [
          [fieldGIDs[1], fieldGIDs[2], fieldGIDs[4], fieldGIDs[0], fieldGIDs[3]], // trying to move fixed HEADING, throws error
          [fieldGIDs[1], fieldGIDs[2], fieldGIDs[4], fieldGIDs[0], fieldGIDs[3]], // trying to move fixed HEADING, throws error
          [fieldGIDs[0], fieldGIDs[3], fieldGIDs[2], fieldGIDs[1], fieldGIDs[4]], // OK, this should be new order
          [fieldGIDs[0], fieldGIDs[4], fieldGIDs[1], fieldGIDs[2], fieldGIDs[3]], // moving visibility condition, throws error
          [fieldGIDs[0], fieldGIDs[1], fieldGIDs[2], fieldGIDs[3]], // not enough IDS, throws error
        ].map((fieldIds) =>
          testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
                updateFieldPositions(fieldIds: $fieldIds, petitionId: $petitionId) {
                  fields {
                    id
                  }
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fieldIds,
            },
          ),
        ),
      );

      expect(results[0].errors).toContainGraphQLError("INVALID_PETITION_FIELD_IDS");
      expect(results[1].errors).toContainGraphQLError("INVALID_PETITION_FIELD_IDS");
      expect(results[3].errors).toContainGraphQLError("INVALID_FIELD_CONDITIONS_ORDER");
      expect(results[4].errors).toContainGraphQLError("INVALID_PETITION_FIELD_IDS");

      expect(results[2].errors).toBeUndefined();
      expect(results[2].data.updateFieldPositions).toEqual({
        fields: [fieldGIDs[0], fieldGIDs[3], fieldGIDs[2], fieldGIDs[1], fieldGIDs[4]].map(
          (id) => ({ id }),
        ),
      });

      const { errors, data } = await testClient.execute(
        gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              fields {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        },
      );

      // double check that the petition fields were correctly updated
      expect(errors).toBeUndefined();
      expect(data.petition).toEqual({
        fields: [fieldGIDs[0], fieldGIDs[3], fieldGIDs[2], fieldGIDs[1], fieldGIDs[4]].map(
          (id) => ({ id }),
        ),
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
          petitionId: toGlobalId("Petition", petition.id),
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
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [fieldGIDs[1], fieldGIDs[2], fieldGIDs[3], fieldGIDs[4], fieldGIDs[0]],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_PETITION_FIELD_IDS");
      expect(data).toBeNull();
    });

    it("sends error when updating a field position leaves a visibility condition referring to a next field", async () => {
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
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [fieldGIDs[0], fieldGIDs[4], fieldGIDs[1], fieldGIDs[2], fieldGIDs[3]],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_FIELD_CONDITIONS_ORDER");
      expect(data).toBeNull();
    });

    it("sends error when updating positions of field_group children leaves a child with visibility conditions on first position", async () => {
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));
      const children = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        type: "TEXT",
        parent_petition_field_id: fieldGroup.id,
        position: i,
      }));
      await mocks.knex.raw(
        /* sql */ `
        update petition_field
        set visibility = ?
        where id = ?
      `,
        [
          JSON.stringify({
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: fields[3].id,
                modifier: "NONE",
                operator: "CONTAIN",
                value: "$",
              },
            ],
          }),
          children[1].id,
        ],
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID, $fieldIds: [GID!]!) {
            updateFieldPositions(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              fieldIds: $fieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
          fieldIds: [
            toGlobalId("PetitionField", children[1].id),
            toGlobalId("PetitionField", children[0].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when moving a field referencing a FIELD_GROUP child before the childs parent", async () => {
      const [fieldGroupField, textField] = await mocks.createRandomPetitionFields(
        petition.id,
        2,
        (i) => ({
          type: ["FIELD_GROUP", "TEXT"][i] as PetitionFieldType,
        }),
      );
      const [child] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        position: 0,
        parent_petition_field_id: fieldGroupField.id,
        type: "SHORT_TEXT",
      }));
      await mocks.knex.raw(
        /* sql */ `
        update petition_field set visibility = ? where id = ?
      `,
        [
          JSON.stringify({
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: child.id,
                modifier: "NONE",
                operator: "CONTAIN",
                value: "$",
              },
            ],
          }),
          textField.id,
        ],
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID, $fieldIds: [GID!]!) {
            updateFieldPositions(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              fieldIds: $fieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [
            ...fieldGIDs,
            toGlobalId("PetitionField", textField.id),
            toGlobalId("PetitionField", fieldGroupField.id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_FIELD_CONDITIONS_ORDER");
      expect(data).toBeNull();
    });

    it("sends error when moving a field that is being referenced by a field group child after its parent", async () => {
      const [textField, fieldGroupField] = await mocks.createRandomPetitionFields(
        petition.id,
        2,
        (i) => ({
          type: ["TEXT", "FIELD_GROUP"][i] as PetitionFieldType,
        }),
      );
      await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        position: 0,
        parent_petition_field_id: fieldGroupField.id,
        type: "SHORT_TEXT",
        visibility: JSON.stringify({
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              fieldId: textField.id,
              modifier: "NONE",
              operator: "CONTAIN",
              value: "$",
            },
          ],
        }),
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID, $fieldIds: [GID!]!) {
            updateFieldPositions(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              fieldIds: $fieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldIds: [
            ...fieldGIDs,
            toGlobalId("PetitionField", fieldGroupField.id),
            toGlobalId("PetitionField", textField.id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_FIELD_CONDITIONS_ORDER");
      expect(data).toBeNull();
    });
  });

  describe("updatePetitionField", () => {
    let userPetition: Petition;
    let fields: PetitionField[];
    let fieldGIDs: string[];

    let children: PetitionField[];
    let fieldGroupReplies: PetitionFieldReply[];
    let group0Replies: PetitionFieldReply[];
    let group1Replies: PetitionFieldReply[];

    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        variables: [{ name: "score", default_value: 0 }],
      }));

      fields = await mocks.createRandomPetitionFields(userPetition.id, 7, (index) => {
        const type = ["HEADING", "TEXT", "FILE_UPLOAD", "HEADING", "TEXT", "FIELD_GROUP", "NUMBER"][
          index
        ] as PetitionFieldType;
        return {
          type,
          is_fixed: index === 0,
          options: defaultFieldProperties(type).options,
        };
      });

      fieldGIDs = fields.map((f) => toGlobalId("PetitionField", f.id));

      children = await mocks.createRandomPetitionFields(userPetition.id, 2, (i) => ({
        type: "TEXT",
        parent_petition_field_id: fields[5].id,
        position: i,
        require_approval: true,
      }));

      fieldGroupReplies = await mocks.createFieldGroupReply(fields[5].id, undefined, 3, () => ({
        user_id: user.id,
      }));

      group0Replies = await mocks.createRandomTextReply(children[0].id, undefined, 2, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: fieldGroupReplies[0].id,
        status: "APPROVED",
      }));

      group1Replies = await mocks.createRandomTextReply(children[0].id, undefined, 2, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: fieldGroupReplies[1].id,
        status: "REJECTED",
      }));
    });

    it("can't update require_approval option on a FIELD_GROUP field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[5].id),
          data: {
            requireApproval: true,
          },
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("updates reply status of field on every group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              type
              requireApproval
              parent {
                id
                type
                replies {
                  children {
                    field {
                      id
                      requireApproval
                    }
                    replies {
                      id
                      status
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", children[0].id),
          data: {
            requireApproval: false,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionField).toEqual({
        id: toGlobalId("PetitionField", children[0].id),
        type: "TEXT",
        requireApproval: false,
        parent: {
          id: toGlobalId("PetitionField", fields[5].id),
          type: "FIELD_GROUP",
          replies: [
            {
              children: [
                {
                  field: {
                    id: toGlobalId("PetitionField", children[0].id),
                    requireApproval: false,
                  },
                  replies: [
                    {
                      id: toGlobalId("PetitionFieldReply", group0Replies[0].id),
                      status: "PENDING",
                    },
                    {
                      id: toGlobalId("PetitionFieldReply", group0Replies[1].id),
                      status: "PENDING",
                    },
                  ],
                },
                {
                  field: {
                    id: toGlobalId("PetitionField", children[1].id),
                    requireApproval: true,
                  },
                  replies: [],
                },
              ],
            },
            {
              children: [
                {
                  field: {
                    id: toGlobalId("PetitionField", children[0].id),
                    requireApproval: false,
                  },
                  replies: [
                    {
                      id: toGlobalId("PetitionFieldReply", group1Replies[0].id),
                      status: "PENDING",
                    },
                    {
                      id: toGlobalId("PetitionFieldReply", group1Replies[1].id),
                      status: "PENDING",
                    },
                  ],
                },
                {
                  field: {
                    id: toGlobalId("PetitionField", children[1].id),
                    requireApproval: true,
                  },
                  replies: [],
                },
              ],
            },
            {
              children: [
                {
                  field: {
                    id: toGlobalId("PetitionField", children[0].id),
                    requireApproval: false,
                  },
                  replies: [],
                },
                {
                  field: {
                    id: toGlobalId("PetitionField", children[1].id),
                    requireApproval: true,
                  },
                  replies: [],
                },
              ],
            },
          ],
        },
      });
    });

    it("should send error when trying to update with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          fieldId: toGlobalId("PetitionField", readPetitionField.id),
          data: {
            optional: false,
          },
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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

    it("updates field with visibility and math logic", async () => {
      await mocks.knex
        .from("petition")
        .where("id", userPetition.id)
        .update({
          variables: JSON.stringify([
            { name: "var_1", default_value: 0 },
            { name: "var_2", default_value: 0 },
            { name: "var_3", default_value: 0 },
          ]),
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              visibility
              math
              petition {
                variables {
                  name
                  defaultValue
                }
              }
            }
          }
        `,
        {
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
                  value: 1,
                },
                {
                  operator: "LESS_THAN",
                  value: 100,
                  variableName: "var_1",
                },
              ],
            },
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: fieldGIDs[2],
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 1,
                  },
                  {
                    operator: "EQUAL",
                    value: 100,
                    variableName: "var_3",
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "NUMBER",
                      value: 100,
                    },
                    variable: "var_2",
                  },
                  {
                    operator: "MULTIPLICATION",
                    operand: {
                      type: "FIELD",
                      fieldId: fieldGIDs[6],
                    },
                    variable: "var_3",
                  },
                  {
                    operator: "DIVISION",
                    operand: {
                      type: "VARIABLE",
                      name: "var_1",
                    },
                    variable: "var_3",
                  },
                ],
              },
            ],
          },
        },
      );
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
              value: 1,
            },
            {
              operator: "LESS_THAN",
              value: 100,
              variableName: "var_1",
            },
          ],
        },
        math: [
          {
            operator: "AND",
            conditions: [
              {
                fieldId: fieldGIDs[2],
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 1,
              },
              {
                operator: "EQUAL",
                value: 100,
                variableName: "var_3",
              },
            ],
            operations: [
              {
                operator: "ADDITION",
                operand: {
                  type: "NUMBER",
                  value: 100,
                },
                variable: "var_2",
              },
              {
                operator: "MULTIPLICATION",
                operand: {
                  type: "FIELD",
                  fieldId: fieldGIDs[6],
                },
                variable: "var_3",
              },
              {
                operator: "DIVISION",
                operand: {
                  type: "VARIABLE",
                  name: "var_1",
                },
                variable: "var_3",
              },
            ],
          },
        ],
        petition: {
          variables: [
            {
              name: "var_1",
              defaultValue: 0,
            },
            {
              name: "var_2",
              defaultValue: 0,
            },
            {
              name: "var_3",
              defaultValue: 0,
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

    it("sends error when trying to set the require approval option on a heading field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[0], // HEADING
          data: {
            requireApproval: true,
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("changes the require approval option to false when setting field to internal", async () => {
      expect(fields[1].require_approval).toBe(true);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              isInternal
              requireApproval
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: fieldGIDs[1], // TEXT
          data: {
            isInternal: true,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionField).toEqual({
        id: fieldGIDs[1],
        isInternal: true,
        requireApproval: false,
      });
    });

    it("updates field reply status to PENDING if its APPROVED/REJECTED and field require_approval is set to false", async () => {
      const [field] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "TEXT",
        require_approval: true,
      }));

      const [reply] = await mocks.createRandomTextReply(field.id, undefined, 1, () => ({
        user_id: user.id,
        content: { value: "abc" },
        status: "APPROVED",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              requireApproval
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          data: {
            requireApproval: false,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionField).toEqual({
        id: toGlobalId("PetitionField", field.id),
        requireApproval: false,
      });

      const [updatedReply] = await mocks.knex
        .from("petition_field_reply")
        .where("id", reply.id)
        .select("*");

      expect(updatedReply).toMatchObject({
        status: "PENDING",
      });
    });

    it("deletes empty FIELD_GROUP replies when making a FIELD_GROUP field optional", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              type
              replies {
                id
                children {
                  replies {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[5].id),
          data: {
            optional: true,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionField).toEqual({
        type: "FIELD_GROUP",
        replies: [
          {
            id: toGlobalId("PetitionFieldReply", fieldGroupReplies[0].id),
            children: [
              {
                replies: [
                  { id: toGlobalId("PetitionFieldReply", group0Replies[0].id) },
                  { id: toGlobalId("PetitionFieldReply", group0Replies[1].id) },
                ],
              },
              { replies: [] },
            ],
          },
          {
            id: toGlobalId("PetitionFieldReply", fieldGroupReplies[1].id),
            children: [
              {
                replies: [
                  { id: toGlobalId("PetitionFieldReply", group1Replies[0].id) },
                  { id: toGlobalId("PetitionFieldReply", group1Replies[1].id) },
                ],
              },
              {
                replies: [],
              },
            ],
          },
        ],
      });
    });

    it("inserts an empty FIELD_GROUP reply when making a FIELD_GROUP field required and field has no replies", async () => {
      const [field] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "FIELD_GROUP",
        optional: true,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              type
              replies {
                id
                children {
                  replies {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          data: {
            optional: false,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionField).toEqual({
        type: "FIELD_GROUP",
        replies: [
          {
            id: expect.any(String),
            children: [],
          },
        ],
      });
    });

    it("does not insert an empty FIELD_GROUP reply when making a FIELD_GROUP field required but field has replies", async () => {
      const [field] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "FIELD_GROUP",
        optional: true,
      }));
      const [reply] = await mocks.createFieldGroupReply(field.id, undefined, 1, () => ({
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              type
              replies {
                id
                children {
                  replies {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          data: {
            optional: false,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionField).toEqual({
        type: "FIELD_GROUP",
        replies: [
          {
            id: toGlobalId("PetitionFieldReply", reply.id),
            children: [],
          },
        ],
      });
    });

    it("updates field and its children when making a FIELD_GROUP internal", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              type
              isInternal
              children {
                id
                isInternal
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[5].id),
          data: { isInternal: true },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionField).toEqual({
        id: toGlobalId("PetitionField", fields[5].id),
        type: "FIELD_GROUP",
        isInternal: true,
        children: [
          {
            id: toGlobalId("PetitionField", children[0].id),
            isInternal: true,
          },
          {
            id: toGlobalId("PetitionField", children[1].id),
            isInternal: true,
          },
        ],
      });
    });

    it("sends error when trying to update an internal FIELD_GROUP child as external", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", fields[5].id)
        .orWhere("parent_petition_field_id", fields[5].id)
        .update({ is_internal: true });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              type
              isInternal
              children {
                id
                isInternal
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", children[0].id),
          data: { isInternal: false },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to update an external FIELD_GROUP first child as internal", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", fields[5].id)
        .orWhere("parent_petition_field_id", fields[5].id)
        .update({ is_internal: false });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              type
              isInternal
              children {
                id
                isInternal
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", children[0].id),
          data: { isInternal: true },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sets first child as external when updating FIELD_GROUP to external", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", fields[5].id)
        .orWhere("parent_petition_field_id", fields[5].id)
        .update({ is_internal: true });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              type
              isInternal
              children {
                id
                isInternal
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[5].id),
          data: { isInternal: false },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionField).toEqual({
        id: toGlobalId("PetitionField", fields[5].id),
        type: "FIELD_GROUP",
        isInternal: false,
        children: [
          {
            id: toGlobalId("PetitionField", children[0].id),
            isInternal: false,
          },
          {
            id: toGlobalId("PetitionField", children[1].id),
            isInternal: true,
          },
        ],
      });
    });

    it("sends error when setting a field alias same as a petition variable", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fields[1].id),
          data: { alias: "score" },
        },
      );

      expect(errors).toContainGraphQLError("ALIAS_ALREADY_EXISTS");
      expect(data).toBeNull();
    });

    it("sends error when trying to update BACKGROUND_CHECK isInternal or showInPdf property", async () => {
      const [backgroundCheck] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "BACKGROUND_CHECK",
        is_internal: true,
      }));

      for (const inputData of [
        { isInternal: true },
        { isInternal: false },
        { showInPdf: true },
        { showInPdf: false },
      ]) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
              updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", userPetition.id),
            fieldId: toGlobalId("PetitionField", backgroundCheck.id),
            data: inputData,
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      }
    });
  });

  describe("changePetitionFieldType", () => {
    let userPetition: Petition;
    let field: PetitionField;
    let fixedHeadingField: PetitionField;
    let fieldWithReply: PetitionField;
    let fieldGroupField: PetitionField;

    let childrenFields: PetitionField[];

    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [userPetition] = await mocks.createRandomPetitions(organization.id, user.id, 1);

      [fixedHeadingField, field, fieldWithReply, fieldGroupField] =
        await mocks.createRandomPetitionFields(userPetition.id, 4, (i) => ({
          type: ["HEADING", "TEXT", "TEXT", "FIELD_GROUP"][i] as PetitionFieldType,
          is_fixed: i === 0,
        }));

      childrenFields = await mocks.createRandomPetitionFields(userPetition.id, 3, (i) => ({
        type: ["SHORT_TEXT", "PHONE", "DATE"][i] as PetitionFieldType,
        parent_petition_field_id: fieldGroupField.id,
        position: i,
      }));

      const [contact] = await mocks.createRandomContacts(organization.id, 1);

      const [access] = await mocks.createPetitionAccess(
        userPetition.id,
        user.id,
        [contact.id],
        user.id,
      );

      await mocks.createRandomTextReply(fieldWithReply.id, access.id);
    });

    it("sends error when trying to change a field type with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(petitionId: $petitionId, fieldId: $fieldId, type: $type) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          fieldId: toGlobalId("PetitionField", readPetitionField.id),
          type: "HEADING",
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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
          format: null,
          maxLength: null,
          placeholder: field.options.placeholder,
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
          showNumbering: false,
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
          attachToPdf: false,
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

    it("sends error when trying to change type of FIELD_GROUP field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(fieldId: $fieldId, petitionId: $petitionId, type: $type) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", fieldGroupField.id),
          type: "TEXT",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when changing a child field type to FIELD_GROUP", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(petitionId: $petitionId, fieldId: $fieldId, type: $type) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", childrenFields[0].id),
          type: "FIELD_GROUP",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when changing type of first child of external field group to DOW_JONES_KYC", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(petitionId: $petitionId, fieldId: $fieldId, type: $type) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", childrenFields[0].id),
          type: "DOW_JONES_KYC",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("allows to change type of first child to DOW_JONES_KYC if field group is internal", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", fieldGroupField.id)
        .update({ is_internal: true });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(petitionId: $petitionId, fieldId: $fieldId, type: $type) {
              id
              type
              isInternal
              position
              parent {
                id
                isInternal
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", childrenFields[0].id),
          type: "DOW_JONES_KYC",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.changePetitionFieldType).toEqual({
        id: toGlobalId("PetitionField", childrenFields[0].id),
        type: "DOW_JONES_KYC",
        isInternal: true,
        position: 0,
        parent: {
          id: toGlobalId("PetitionField", fieldGroupField.id),
          isInternal: true,
        },
      });
    });

    it("sends error when changing type of a field linked to a profile type field", async () => {
      const [profileType] = await mocks.knex
        .from("profile_type")
        .insert({ org_id: organization.id, name: { en: "Profile Type" } }, "*");
      const [profileTypeField] = await mocks.knex.from("profile_type_field").insert(
        {
          type: "SHORT_TEXT",
          name: { en: "Name" },
          profile_type_id: profileType.id,
          position: 0,
        },
        "*",
      );
      await mocks.knex.from("petition_field").where({ id: childrenFields[0].id }).update({
        profile_type_field_id: profileTypeField.id,
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(petitionId: $petitionId, fieldId: $fieldId, type: $type) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", childrenFields[0].id),
          type: "DATE",
        },
      );

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
    let field4Reply: PetitionFieldReply;

    let fieldGroupField: PetitionField;
    let fieldGroupReply: PetitionFieldReply;

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);

      [contact] = await mocks.createRandomContacts(organization.id, 1);
      [access] = await mocks.createPetitionAccess(petition.id, user.id, [contact.id], user.id);

      fields = await mocks.createRandomPetitionFields(petition.id, 4, (index) => ({
        type: "TEXT",
        options: {
          placeholder: faker.word.words(3),
        },
        require_approval: index === 3 ? false : true,
      }));

      [fieldGroupField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));

      [fieldGroupReply] = await mocks.createFieldGroupReply(fieldGroupField.id, access.id, 1);

      field2Replies = await mocks.createRandomTextReply(fields[2].id, access.id, 2, () => ({
        status: "PENDING",
      }));

      [field4Reply] = await mocks.createRandomTextReply(fields[3].id, access.id, 1, () => ({
        status: "PENDING",
      }));
    });

    it("should send error when trying to update reply status with READ access", async () => {
      const [readPetitionReply] = await mocks.createRandomTextReply(
        readPetitionField.id,
        undefined,
        1,
        () => ({ user_id: user.id }),
      );

      const { errors, data } = await testClient.execute(
        gql`
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
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldId: toGlobalId("PetitionField", readPetitionField.id),
          petitionFieldReplyIds: [toGlobalId("PetitionFieldReply", readPetitionReply.id)],
          status: "REJECTED",
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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
            toGlobalId("PetitionFieldReply", r.id + 1000),
          ),
          status: "APPROVED",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sets petition to PENDING if rejecting a reply", async () => {
      const [completedPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({ status: "COMPLETED" }),
      );
      const [field] = await mocks.createRandomPetitionFields(completedPetition.id, 1, () => ({
        type: "TEXT",
      }));

      const [reply] = await mocks.createRandomTextReply(field.id, undefined, 1, () => ({
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
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
              petition {
                id
                ... on Petition {
                  status
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", completedPetition.id),
          petitionFieldId: toGlobalId("PetitionField", field.id),
          petitionFieldReplyIds: [toGlobalId("PetitionFieldReply", reply.id)],
          status: "REJECTED",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionFieldRepliesStatus).toEqual({
        id: toGlobalId("PetitionField", field.id),
        petition: {
          id: toGlobalId("Petition", completedPetition.id),
          status: "PENDING",
        },
      });
    });

    it("sends error if trying to update status of a reply on a field with require_approval set to false", async () => {
      const { errors, data } = await testClient.execute(
        gql`
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
              petition {
                id
                ... on Petition {
                  status
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fields[3].id),
          petitionFieldReplyIds: [toGlobalId("PetitionFieldReply", field4Reply.id)],
          status: "REJECTED",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to update status of a FIELD_GROUP reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
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
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroupField.id),
          petitionFieldReplyIds: [toGlobalId("PetitionFieldReply", fieldGroupReply.id)],
          status: "APPROVED",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if petition is CLOSED", async () => {
      await mocks.knex.from("petition").where("id", petition.id).update("status", "CLOSED");

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

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("approveOrRejectPetitionFieldReplies", () => {
    it("should send error when trying to update reply status with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $status: PetitionFieldReplyStatus!) {
            approveOrRejectPetitionFieldReplies(petitionId: $petitionId, status: $status) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          status: "REJECTED",
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("changes status of replies of fields with require_approval set to true", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const fields = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        type: "TEXT",
        require_approval: i === 0,
      }));
      const field0Replies = await mocks.createRandomTextReply(fields[0].id, undefined, 2, () => ({
        user_id: user.id,
        content: { value: "aaaa" },
        status: "PENDING",
      }));
      const field1Replies = await mocks.createRandomTextReply(fields[1].id, undefined, 1, () => ({
        user_id: user.id,
        content: { value: "bbbb" },
        status: "PENDING",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $status: PetitionFieldReplyStatus!) {
            approveOrRejectPetitionFieldReplies(petitionId: $petitionId, status: $status) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          status: "APPROVED",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.approveOrRejectPetitionFieldReplies).toEqual({
        id: toGlobalId("Petition", petition.id),
      });

      const field0UpdatedReplies = await mocks.knex
        .from("petition_field_reply")
        .whereIn(
          "id",
          field0Replies.map((r) => r.id),
        )
        .select("*");

      const field1UpdatedReplies = await mocks.knex
        .from("petition_field_reply")
        .whereIn(
          "id",
          field1Replies.map((r) => r.id),
        )
        .select("*");

      expect(field0UpdatedReplies.map(pick(["id", "status"]))).toIncludeSameMembers([
        { id: field0Replies[0].id, status: "APPROVED" },
        { id: field0Replies[1].id, status: "APPROVED" },
      ]);

      expect(field1UpdatedReplies).toMatchObject([{ id: field1Replies[0].id, status: "PENDING" }]);
    });

    it("updates status of child fields, but no their parent", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, (i) => ({
        type: "FIELD_GROUP",
      }));
      const children = await mocks.createRandomPetitionFields(petition.id, 1, (i) => ({
        type: "TEXT",
        parent_petition_field_id: fieldGroup.id,
        position: i,
      }));

      const groupReplies = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 2, () => ({
        user_id: user.id,
        status: "PENDING",
      }));

      const group0Replies = await mocks.createRandomTextReply(children[0].id, undefined, 2, () => ({
        user_id: user.id,
        status: "PENDING",
        parent_petition_field_reply_id: groupReplies[0].id,
      }));

      const group1Replies = await mocks.createRandomTextReply(children[0].id, undefined, 2, () => ({
        user_id: user.id,
        status: "PENDING",
        parent_petition_field_reply_id: groupReplies[1].id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $status: PetitionFieldReplyStatus!) {
            approveOrRejectPetitionFieldReplies(petitionId: $petitionId, status: $status) {
              id
              fields {
                id
                type
                replies {
                  id
                  status
                  children {
                    field {
                      id
                    }
                    replies {
                      id
                      status
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          status: "APPROVED",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.approveOrRejectPetitionFieldReplies).toEqual({
        id: toGlobalId("Petition", petition.id),
        fields: [
          {
            id: toGlobalId("PetitionField", fieldGroup.id),
            type: "FIELD_GROUP",
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", groupReplies[0].id),
                status: "PENDING",
                children: [
                  {
                    field: {
                      id: toGlobalId("PetitionField", children[0].id),
                    },
                    replies: expect.toIncludeSameMembers([
                      {
                        id: toGlobalId("PetitionFieldReply", group0Replies[0].id),
                        status: "APPROVED",
                      },
                      {
                        id: toGlobalId("PetitionFieldReply", group0Replies[1].id),
                        status: "APPROVED",
                      },
                    ]),
                  },
                ],
              },
              {
                id: toGlobalId("PetitionFieldReply", groupReplies[1].id),
                status: "PENDING",
                children: [
                  {
                    field: {
                      id: toGlobalId("PetitionField", children[0].id),
                    },
                    replies: expect.toIncludeSameMembers([
                      {
                        id: toGlobalId("PetitionFieldReply", group1Replies[0].id),
                        status: "APPROVED",
                      },
                      {
                        id: toGlobalId("PetitionFieldReply", group1Replies[1].id),
                        status: "APPROVED",
                      },
                    ]),
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("sends error if petition is CLOSED", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "CLOSED",
      }));
      await mocks.createRandomPetitionFields(petition.id, 2);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $status: PetitionFieldReplyStatus!) {
            approveOrRejectPetitionFieldReplies(petitionId: $petitionId, status: $status) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          status: "REJECTED",
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("linkPetitionFieldChildren", () => {
    let petition: Petition;
    let fields: PetitionField[];

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      fields = await mocks.createRandomPetitionFields(petition.id, 6, (i) => ({
        type: ["TEXT", "FIELD_GROUP", "PHONE", "NUMBER", "HEADING", "FIELD_GROUP"][
          i
        ] as PetitionFieldType,
        updated_by: null,
      }));
    });

    it("links fields to a FIELD_GROUP parent", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            linkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              type
              position
              children {
                type
                position
              }
              petition {
                fields {
                  type
                  position
                  children {
                    type
                    position
                  }
                }
                fieldCount
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [
            toGlobalId("PetitionField", fields[2].id),
            toGlobalId("PetitionField", fields[3].id),
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.linkPetitionFieldChildren).toEqual({
        type: "FIELD_GROUP",
        position: 1,
        children: [
          {
            type: "PHONE",
            position: 0,
          },
          {
            type: "NUMBER",
            position: 1,
          },
        ],
        petition: {
          fields: [
            {
              type: "TEXT",
              position: 0,
              children: null,
            },
            {
              type: "FIELD_GROUP",
              position: 1,
              children: [
                {
                  type: "PHONE",
                  position: 0,
                },
                {
                  type: "NUMBER",
                  position: 1,
                },
              ],
            },
            {
              type: "HEADING",
              position: 2,
              children: null,
            },
            {
              type: "FIELD_GROUP",
              position: 3,
              children: [],
            },
          ],
          fieldCount: 4,
        },
      });
    });

    it("sends error if parent is not type FIELD_GROUP", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            linkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[2].id),
          childrenFieldIds: [toGlobalId("PetitionField", fields[3].id)],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_FIELD_TYPE_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if children are HEADING or FIELD_GROUP", async () => {
      for (const childrenId of [fields[4].id, fields[1].id]) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
              linkPetitionFieldChildren(
                petitionId: $petitionId
                parentFieldId: $parentFieldId
                childrenFieldIds: $childrenFieldIds
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            parentFieldId: toGlobalId("PetitionField", fields[1].id),
            childrenFieldIds: [toGlobalId("PetitionField", childrenId)],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      }
    });

    it("sends error if passing empty array of children", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            linkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [],
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if linking a field with replies and force=false", async () => {
      await mocks.createRandomNumberReply(fields[3].id, undefined, 2, () => ({ user_id: user.id }));
      await mocks.createRandomCommentsFromUser(user.id, fields[3].id, petition.id, 3);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            linkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [toGlobalId("PetitionField", fields[3].id)],
        },
      );

      expect(errors).toContainGraphQLError("FIELD_HAS_REPLIES_ERROR");
      expect(data).toBeNull();
    });

    it("deletes replies and comments on the field when it's linked to a FIELD_GROUP", async () => {
      await mocks.createRandomNumberReply(fields[3].id, undefined, 2, () => ({ user_id: user.id }));
      await mocks.createRandomCommentsFromUser(user.id, fields[3].id, petition.id, 3);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $parentFieldId: GID!
            $childrenFieldIds: [GID!]!
            $force: Boolean
          ) {
            linkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
              force: $force
            ) {
              id
              children {
                id
                replies {
                  id
                }
                comments {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [toGlobalId("PetitionField", fields[3].id)],
          force: true,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.linkPetitionFieldChildren).toEqual({
        id: toGlobalId("PetitionField", fields[1].id),
        children: [
          {
            id: toGlobalId("PetitionField", fields[3].id),
            replies: [],
            comments: [],
          },
        ],
      });
    });

    it("sends error if trying to link first child with visibility conditions", async () => {
      await mocks.knex.raw(/* sql */ `update petition_field set visibility = ? where id = ?`, [
        JSON.stringify({
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              fieldId: fields[0].id,
              modifier: "ANY",
              operator: "EQUAL",
              value: "JON SNOW",
            },
          ],
        }),
        fields[2].id,
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            linkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [toGlobalId("PetitionField", fields[2].id)],
        },
      );

      expect(errors).toContainGraphQLError("FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to link first internal child on an external FIELD_GROUP", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", fields[2].id)
        .update({ is_internal: true });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            linkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [toGlobalId("PetitionField", fields[2].id)],
        },
      );
      expect(errors).toContainGraphQLError("FIRST_CHILD_IS_INTERNAL_ERROR");
      expect(data).toBeNull();
    });

    it("sets child as internal if linking it to an internal FIELD_GROUP", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", fields[1].id)
        .update({ is_internal: true });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            linkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
              children {
                id
                isInternal
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [
            toGlobalId("PetitionField", fields[2].id),
            toGlobalId("PetitionField", fields[3].id),
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.linkPetitionFieldChildren).toEqual({
        id: toGlobalId("PetitionField", fields[1].id),
        children: [
          {
            id: toGlobalId("PetitionField", fields[2].id),
            isInternal: true,
          },
          {
            id: toGlobalId("PetitionField", fields[3].id),
            isInternal: true,
          },
        ],
      });
    });

    it("awaits for pending transactions on concurrent requests", async () => {
      const fieldsToLink = await mocks.createRandomPetitionFields(petition.id, 8, () => ({
        type: "TEXT",
      }));

      const results = await Promise.all(
        fieldsToLink.map((field) =>
          testClient.execute(
            gql`
              mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
                linkPetitionFieldChildren(
                  petitionId: $petitionId
                  parentFieldId: $parentFieldId
                  childrenFieldIds: $childrenFieldIds
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              parentFieldId: toGlobalId("PetitionField", fields[1].id),
              childrenFieldIds: [toGlobalId("PetitionField", field.id)],
            },
          ),
        ),
      );

      for (const result of results) {
        expect(result.errors).toBeUndefined();
      }

      const { errors, data } = await testClient.execute(
        gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              fields {
                id
                type
                position
                children {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.petition).toEqual({
        fields: [
          {
            id: toGlobalId("PetitionField", fields[0].id),
            type: "TEXT",
            position: 0,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[1].id),
            type: "FIELD_GROUP",
            position: 1,
            children: expect.toIncludeSameMembers(
              fieldsToLink.map((f) => ({ id: toGlobalId("PetitionField", f.id) })),
            ),
          },
          {
            id: toGlobalId("PetitionField", fields[2].id),
            type: "PHONE",
            position: 2,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[3].id),
            type: "NUMBER",
            position: 3,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[4].id),
            type: "HEADING",
            position: 4,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[5].id),
            type: "FIELD_GROUP",
            position: 5,
            children: [],
          },
        ],
      });
    });

    it("only updates fields that changed positions", async () => {
      const { errors } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            linkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [
            toGlobalId("PetitionField", fields[2].id),
            toGlobalId("PetitionField", fields[3].id),
          ],
        },
      );

      expect(errors).toBeUndefined();

      const allFields = await mocks.knex
        .from("petition_field")
        .whereIn(
          "id",
          fields.map((f) => f.id),
        )
        .select("*");

      expect(allFields.map((f) => pick(f, ["id", "updated_by"]))).toIncludeSameMembers([
        { id: fields[0].id, updated_by: null },
        { id: fields[1].id, updated_by: null },
        { id: fields[2].id, updated_by: expect.any(String) }, // linked to parent
        { id: fields[3].id, updated_by: expect.any(String) }, // linked to parent
        { id: fields[4].id, updated_by: expect.any(String) }, // moved position
        { id: fields[5].id, updated_by: expect.any(String) }, // moved position
      ]);
    });
  });

  describe("unlinkPetitionFieldChildren", () => {
    let petition: Petition;
    let fields: PetitionField[];
    let children: PetitionField[];

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      fields = await mocks.createRandomPetitionFields(petition.id, 4, (i) => ({
        type: ["TEXT", "FIELD_GROUP", "HEADING", "FIELD_GROUP"][i] as PetitionFieldType,
      }));

      children = await mocks.createRandomPetitionFields(petition.id, 6, (i) => ({
        position: i,
        parent_petition_field_id: fields[1].id,
        type: ["PHONE", "NUMBER", "TEXT", "TEXT", "TEXT", "TEXT"][i] as PetitionFieldType,
      }));
    });

    it("unlinks children from field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            unlinkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              petition {
                fields {
                  id
                  type
                  position
                  children {
                    id
                    type
                    position
                    children {
                      __typename
                    }
                  }
                }
                fieldCount
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [toGlobalId("PetitionField", children[0].id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.unlinkPetitionFieldChildren).toEqual({
        petition: {
          fields: [
            {
              id: toGlobalId("PetitionField", fields[0].id),
              type: "TEXT",
              position: 0,
              children: null,
            },
            {
              id: toGlobalId("PetitionField", fields[1].id),
              type: "FIELD_GROUP",
              position: 1,
              children: [
                {
                  id: toGlobalId("PetitionField", children[1].id),
                  type: "NUMBER",
                  position: 0,
                  children: null,
                },
                {
                  id: toGlobalId("PetitionField", children[2].id),
                  type: "TEXT",
                  position: 1,
                  children: null,
                },
                {
                  id: toGlobalId("PetitionField", children[3].id),
                  type: "TEXT",
                  position: 2,
                  children: null,
                },
                {
                  id: toGlobalId("PetitionField", children[4].id),
                  type: "TEXT",
                  position: 3,
                  children: null,
                },
                {
                  id: toGlobalId("PetitionField", children[5].id),
                  type: "TEXT",
                  position: 4,
                  children: null,
                },
              ],
            },
            {
              id: toGlobalId("PetitionField", children[0].id),
              type: "PHONE",
              position: 2,
              children: null,
            },
            {
              id: toGlobalId("PetitionField", fields[2].id),
              type: "HEADING",
              position: 3,
              children: null,
            },
            {
              id: toGlobalId("PetitionField", fields[3].id),
              type: "FIELD_GROUP",
              position: 4,
              children: [],
            },
          ],
          fieldCount: 5,
        },
      });
    });

    it("sends error if target is not children", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            unlinkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [toGlobalId("PetitionField", fields[0].id)],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if parent is not of type FIELD_GROUP", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            unlinkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[0].id),
          childrenFieldIds: [toGlobalId("PetitionField", children[0].id)],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_FIELD_TYPE_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if passing empty array of children", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            unlinkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [],
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if trying to unlink a field with replies and force=false", async () => {
      const parentReplies = await mocks.createFieldGroupReply(fields[1].id, undefined, 2, () => ({
        user_id: user.id,
      }));
      await mocks.createRandomNumberReply(children[1].id, undefined, 2, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: parentReplies[0].id,
      }));
      await mocks.createRandomNumberReply(children[1].id, undefined, 2, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: parentReplies[1].id,
      }));
      await mocks.createRandomCommentsFromUser(user.id, children[1].id, petition.id, 3);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            unlinkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
              petition {
                fields {
                  id
                  type
                  children {
                    id
                  }
                  replies {
                    id
                  }
                  comments {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [
            toGlobalId("PetitionField", children[0].id),
            toGlobalId("PetitionField", children[1].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FIELD_HAS_REPLIES_ERROR");
      expect(data).toBeNull();
    });

    it("deletes replies and comments on the field when it's unlinked from a FIELD_GROUP", async () => {
      const parentReplies = await mocks.createFieldGroupReply(fields[1].id, undefined, 2, () => ({
        user_id: user.id,
      }));
      await mocks.createRandomNumberReply(children[1].id, undefined, 2, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: parentReplies[0].id,
      }));
      await mocks.createRandomNumberReply(children[1].id, undefined, 2, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: parentReplies[1].id,
      }));
      await mocks.createRandomCommentsFromUser(user.id, children[1].id, petition.id, 3);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $parentFieldId: GID!
            $childrenFieldIds: [GID!]!
            $force: Boolean
          ) {
            unlinkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
              force: $force
            ) {
              id
              petition {
                fields {
                  id
                  type
                  children {
                    id
                  }
                  replies {
                    id
                  }
                  comments {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [
            toGlobalId("PetitionField", children[0].id),
            toGlobalId("PetitionField", children[1].id),
          ],
          force: true,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.unlinkPetitionFieldChildren).toEqual({
        id: toGlobalId("PetitionField", fields[1].id),
        petition: {
          fields: [
            {
              id: toGlobalId("PetitionField", fields[0].id),
              type: "TEXT",
              children: null,
              replies: [],
              comments: [],
            },
            {
              id: toGlobalId("PetitionField", fields[1].id),
              type: "FIELD_GROUP",
              children: [
                { id: toGlobalId("PetitionField", children[2].id) },
                { id: toGlobalId("PetitionField", children[3].id) },
                { id: toGlobalId("PetitionField", children[4].id) },
                { id: toGlobalId("PetitionField", children[5].id) },
              ],
              replies: parentReplies.map((r) => ({ id: toGlobalId("PetitionFieldReply", r.id) })),
              comments: [],
            },
            {
              id: toGlobalId("PetitionField", children[0].id),
              type: "PHONE",
              children: null,
              replies: [],
              comments: [],
            },
            {
              id: toGlobalId("PetitionField", children[1].id),
              type: "NUMBER",
              children: null,
              replies: [],
              comments: [],
            },
            {
              id: toGlobalId("PetitionField", fields[2].id),
              type: "HEADING",
              children: null,
              replies: [],
              comments: [],
            },
            {
              id: toGlobalId("PetitionField", fields[3].id),
              type: "FIELD_GROUP",
              children: [],
              replies: [],
              comments: [],
            },
          ],
        },
      });
    });

    it("sends error when unlinking a child field results on first child having visibility conditions", async () => {
      await mocks.knex.raw(
        /* sql */ `
        update petition_field set visibility = ? where id = ?
      `,
        [
          JSON.stringify({
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: fields[0].id,
                modifier: "ANY",
                operator: "EQUAL",
                value: "JON SNOW",
              },
            ],
          }),
          children[1].id,
        ],
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            unlinkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [toGlobalId("PetitionField", children[0].id)],
        },
      );

      expect(errors).toContainGraphQLError("FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when unlinking a child field results on first child being internal on an external FIELD_GROUP", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", children[1].id)
        .update({ is_internal: true });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            unlinkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [toGlobalId("PetitionField", children[0].id)],
        },
      );

      expect(errors).toContainGraphQLError("FIRST_CHILD_IS_INTERNAL_ERROR");
      expect(data).toBeNull();
    });

    it("awaits for pending transactions on concurrent requests", async () => {
      const results = await Promise.all(
        children.map((field) =>
          testClient.execute(
            gql`
              mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
                unlinkPetitionFieldChildren(
                  petitionId: $petitionId
                  parentFieldId: $parentFieldId
                  childrenFieldIds: $childrenFieldIds
                ) {
                  children {
                    id
                  }
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              parentFieldId: toGlobalId("PetitionField", fields[1].id),
              childrenFieldIds: [toGlobalId("PetitionField", field.id)],
            },
          ),
        ),
      );

      for (const result of results) {
        expect(result.errors).toBeUndefined();
      }

      const { errors, data } = await testClient.execute(
        gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              fields {
                id
                children {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.petition).toEqual({
        fields: expect.toIncludeSameMembers([
          { id: toGlobalId("PetitionField", fields[0].id), children: null },
          { id: toGlobalId("PetitionField", fields[1].id), children: [] },
          { id: toGlobalId("PetitionField", children[0].id), children: null },
          { id: toGlobalId("PetitionField", children[1].id), children: null },
          { id: toGlobalId("PetitionField", children[2].id), children: null },
          { id: toGlobalId("PetitionField", children[3].id), children: null },
          { id: toGlobalId("PetitionField", children[4].id), children: null },
          { id: toGlobalId("PetitionField", children[5].id), children: null },
          { id: toGlobalId("PetitionField", fields[2].id), children: null },
          { id: toGlobalId("PetitionField", fields[3].id), children: [] },
        ]),
      });
    });

    it("only updates fields that changed positions", async () => {
      const { errors } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            unlinkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [
            toGlobalId("PetitionField", children[1].id),
            toGlobalId("PetitionField", children[3].id),
            toGlobalId("PetitionField", children[4].id),
          ],
        },
      );

      expect(errors).toBeUndefined();

      const allFields = await mocks.knex
        .from("petition_field")
        .whereIn("id", [...fields.map((f) => f.id), ...children.map((f) => f.id)])
        .select("*");

      expect(allFields.map((f) => pick(f, ["id", "updated_by"]))).toIncludeSameMembers([
        { id: fields[0].id, updated_by: null },
        { id: fields[1].id, updated_by: null },
        { id: children[0].id, updated_by: null },
        { id: children[1].id, updated_by: expect.any(String) }, // unlinked
        { id: children[2].id, updated_by: expect.any(String) }, // moved position
        { id: children[3].id, updated_by: expect.any(String) }, // unlinked
        { id: children[4].id, updated_by: expect.any(String) }, // unlinked
        { id: children[5].id, updated_by: expect.any(String) }, // moved position
        { id: fields[2].id, updated_by: expect.any(String) }, // moved position
        { id: fields[3].id, updated_by: expect.any(String) }, // moved position
      ]);
    });

    it("sends error if trying to unlink a child that is linked with a profile type field", async () => {
      const [profileType] = await mocks.knex
        .from("profile_type")
        .insert({ org_id: organization.id, name: { en: "Profile Type" } }, "*");
      const [profileTypeField] = await mocks.knex.from("profile_type_field").insert(
        {
          type: "PHONE",
          name: { en: "Phone" },
          profile_type_id: profileType.id,
          position: 0,
        },
        "*",
      );
      await mocks.knex.from("petition_field").where({ id: children[0].id }).update({
        profile_type_field_id: profileTypeField.id,
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $childrenFieldIds: [GID!]!) {
            unlinkPetitionFieldChildren(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              childrenFieldIds: $childrenFieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[1].id),
          childrenFieldIds: [toGlobalId("PetitionField", children[0].id)],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("updateFieldPositions / children", () => {
    let petition: Petition;
    let fields: PetitionField[];
    let children: PetitionField[];
    beforeEach(async () => {
      // reset the petition before each test to be able to reuse it
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      fields = await mocks.createRandomPetitionFields(petition.id, 6, (index) => ({
        type: (
          [
            "HEADING",
            "TEXT",
            "FIELD_GROUP",
            "PHONE",
            "FIELD_GROUP",
            "SHORT_TEXT",
          ] as PetitionFieldType[]
        )[index],
        optional: true,
      }));

      children = await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
        position: i,
        parent_petition_field_id: fields[2].id,
        type: "SHORT_TEXT",
      }));
    });

    it("ensures correct field setup", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              fields {
                id
                type
                position
                optional
                children {
                  id
                  type
                  position
                  optional
                }
              }
              fieldCount
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.petition).toEqual({
        fields: [
          {
            id: toGlobalId("PetitionField", fields[0].id),
            type: "HEADING",
            position: 0,
            optional: true,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[1].id),
            type: "TEXT",
            position: 1,
            optional: true,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[2].id),
            type: "FIELD_GROUP",
            position: 2,
            optional: true,
            children: [
              {
                id: toGlobalId("PetitionField", children[0].id),
                type: "SHORT_TEXT",
                position: 0,
                optional: false,
              },
              {
                id: toGlobalId("PetitionField", children[1].id),
                type: "SHORT_TEXT",
                position: 1,
                optional: false,
              },
              {
                id: toGlobalId("PetitionField", children[2].id),
                type: "SHORT_TEXT",
                position: 2,
                optional: false,
              },
            ],
          },
          {
            id: toGlobalId("PetitionField", fields[3].id),
            type: "PHONE",
            position: 3,
            optional: true,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[4].id),
            type: "FIELD_GROUP",
            position: 4,
            optional: true,
            children: [],
          },
          {
            id: toGlobalId("PetitionField", fields[5].id),
            type: "SHORT_TEXT",
            position: 5,
            optional: true,
            children: null,
          },
        ],
        fieldCount: 6,
      });
    });

    it("updates the positions of children fields", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID, $fieldIds: [GID!]!) {
            updateFieldPositions(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              fieldIds: $fieldIds
            ) {
              fields {
                id
                type
                position
                optional
                children {
                  id
                  type
                  position
                  optional
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[2].id),
          fieldIds: [
            toGlobalId("PetitionField", children[1].id),
            toGlobalId("PetitionField", children[2].id),
            toGlobalId("PetitionField", children[0].id),
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateFieldPositions).toEqual({
        fields: [
          {
            id: toGlobalId("PetitionField", fields[0].id),
            type: "HEADING",
            position: 0,
            optional: true,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[1].id),
            type: "TEXT",
            position: 1,
            optional: true,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[2].id),
            type: "FIELD_GROUP",
            position: 2,
            optional: true,
            children: [
              {
                id: toGlobalId("PetitionField", children[1].id),
                type: "SHORT_TEXT",
                position: 0,
                optional: false,
              },
              {
                id: toGlobalId("PetitionField", children[2].id),
                type: "SHORT_TEXT",
                position: 1,
                optional: false,
              },
              {
                id: toGlobalId("PetitionField", children[0].id),
                type: "SHORT_TEXT",
                position: 2,
                optional: false,
              },
            ],
          },
          {
            id: toGlobalId("PetitionField", fields[3].id),
            type: "PHONE",
            position: 3,
            optional: true,
            children: null,
          },
          {
            id: toGlobalId("PetitionField", fields[4].id),
            type: "FIELD_GROUP",
            position: 4,
            optional: true,
            children: [],
          },
          {
            id: toGlobalId("PetitionField", fields[5].id),
            type: "SHORT_TEXT",
            position: 5,
            optional: true,
            children: null,
          },
        ],
      });
    });

    it("sends error if passing incomplete list of children fields", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID, $fieldIds: [GID!]!) {
            updateFieldPositions(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              fieldIds: $fieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[2].id),
          fieldIds: [
            toGlobalId("PetitionField", children[0].id),
            toGlobalId("PetitionField", children[2].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PETITION_FIELD_IDS");
      expect(data).toBeNull();
    });

    it("sends error if passing non children fields when reordering", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID, $fieldIds: [GID!]!) {
            updateFieldPositions(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              fieldIds: $fieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[2].id),
          fieldIds: [
            toGlobalId("PetitionField", fields[3].id),
            toGlobalId("PetitionField", fields[1].id),
            toGlobalId("PetitionField", fields[0].id),
            toGlobalId("PetitionField", fields[4].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when updating positions of field_group children leaves a child with visibility conditions on first position", async () => {
      await mocks.knex.raw(
        /* sql */ `
        update petition_field
        set visibility = ?
        where id = ?
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
          children[1].id,
        ],
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID, $fieldIds: [GID!]!) {
            updateFieldPositions(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              fieldIds: $fieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[2].id),
          fieldIds: [
            toGlobalId("PetitionField", children[1].id),
            toGlobalId("PetitionField", children[0].id),
            toGlobalId("PetitionField", children[2].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when updating positions of external field_group children leaves an internal child on first position", async () => {
      await mocks.knex
        .from("petition_field")
        .whereIn("id", [fields[2].id, children[0].id])
        .update({ is_internal: false });

      await mocks.knex
        .from("petition_field")
        .where("id", children[1].id)
        .update({ is_internal: true });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID, $fieldIds: [GID!]!) {
            updateFieldPositions(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              fieldIds: $fieldIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fields[2].id),
          fieldIds: [
            toGlobalId("PetitionField", children[1].id),
            toGlobalId("PetitionField", children[0].id),
            toGlobalId("PetitionField", children[2].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FIRST_CHILD_IS_INTERNAL_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("Petition Fields / Profiles", () => {
    let individual: ProfileType;
    let legalEntity: ProfileType;
    let contract: ProfileType;

    let petition: Petition;
    let fieldGroup: PetitionField;

    let relationshipTypes: ProfileRelationshipType[];

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        recipient_locale: "en",
      }));
      [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));
    });

    beforeAll(async () => {
      await mocks.createFeatureFlags([{ name: "PROFILES", default_value: true }]);
      const profilesSetup = testClient.container.get<ProfilesSetupService>(PROFILES_SETUP_SERVICE);
      await profilesSetup.createDefaultProfileTypes(organization.id, `User:${user.id}`);
      await profilesSetup.createDefaultProfileRelationshipTypes(organization.id, `User:${user.id}`);

      [individual] = await mocks.knex
        .from("profile_type")
        .where({
          standard_type: "INDIVIDUAL",
          org_id: organization.id,
          deleted_at: null,
        })
        .select("*");

      [legalEntity] = await mocks.knex
        .from("profile_type")
        .where({
          standard_type: "LEGAL_ENTITY",
          org_id: organization.id,
          deleted_at: null,
        })
        .select("*");

      [contract] = await mocks.knex
        .from("profile_type")
        .where({
          standard_type: "CONTRACT",
          org_id: organization.id,
          deleted_at: null,
        })
        .select("*");

      relationshipTypes = await mocks.knex
        .from("profile_relationship_type")
        .where({ org_id: organization.id, deleted_at: null })
        .select("*");
    });

    describe("linkFieldGroupToProfileType", () => {
      it("links a FIELD_GROUP field to an individual profile type", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $petitionFieldId: GID!, $profileTypeId: GID) {
              linkFieldGroupToProfileType(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                profileTypeId: $profileTypeId
              ) {
                id
                isLinkedToProfileType
                profileType {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
            profileTypeId: toGlobalId("ProfileType", individual.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.linkFieldGroupToProfileType).toEqual({
          id: toGlobalId("PetitionField", fieldGroup.id),
          isLinkedToProfileType: true,
          profileType: {
            id: toGlobalId("ProfileType", individual.id),
          },
        });
      });

      it("fails if trying to remove profile_type_id but field has children linked as profile properties", async () => {
        const profileTypeFields = await mocks.knex
          .from("profile_type_field")
          .where("profile_type_id", individual.id)
          .select("*");

        await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "SHORT_TEXT",
          parent_petition_field_id: fieldGroup.id,
          profile_type_field_id: profileTypeFields.find((p) => p.alias === "p_first_name")!.id,
        }));

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $petitionFieldId: GID!, $profileTypeId: GID) {
              linkFieldGroupToProfileType(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                profileTypeId: $profileTypeId
              ) {
                id
                isLinkedToProfileType
                profileType {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
            profileTypeId: null,
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("fails if trying to update profile_type_id but field has relationships with other fields", async () => {
        await mocks.knex.from("petition_field").where("id", fieldGroup.id).update({
          profile_type_id: individual.id,
        });

        const [secondGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "FIELD_GROUP",
          profile_type_id: individual.id,
        }));

        await mocks.knex.from("petition_field_group_relationship").insert({
          petition_id: petition.id,
          left_side_petition_field_id: fieldGroup.id,
          right_side_petition_field_id: secondGroup.id,
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_parent__child",
          )!.id,
          direction: "LEFT_RIGHT",
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $petitionFieldId: GID!, $profileTypeId: GID) {
              linkFieldGroupToProfileType(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                profileTypeId: $profileTypeId
              ) {
                id
                isLinkedToProfileType
                profileType {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
            profileTypeId: null,
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });
    });

    describe("createProfileLinkedPetitionField", () => {
      it("links a field child with a profile type field", async () => {
        await mocks.knex
          .from("petition_field")
          .where("id", fieldGroup.id)
          .update({ profile_type_id: legalEntity.id });

        const profileTypeFields = await mocks.knex
          .from("profile_type_field")
          .where("profile_type_id", legalEntity.id)
          .select("*");

        const entityName = profileTypeFields.find((f) => f.alias === "p_entity_name")!;
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
              createProfileLinkedPetitionField(
                petitionId: $petitionId
                parentFieldId: $parentFieldId
                profileTypeFieldId: $profileTypeFieldId
              ) {
                id
                parent {
                  id
                  isLinkedToProfileType
                }
                isLinkedToProfileTypeField
                profileTypeField {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", entityName.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfileLinkedPetitionField).toEqual({
          id: expect.any(String),
          parent: {
            id: toGlobalId("PetitionField", fieldGroup.id),
            isLinkedToProfileType: true,
          },
          isLinkedToProfileTypeField: true,
          profileTypeField: {
            id: toGlobalId("ProfileTypeField", entityName.id),
          },
        });
      });

      it("fails if parent field is not linked to a profile type", async () => {
        const profileTypeFields = await mocks.knex
          .from("profile_type_field")
          .where("profile_type_id", legalEntity.id)
          .select("*");

        const entityName = profileTypeFields.find((f) => f.alias === "p_entity_name")!;

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
              createProfileLinkedPetitionField(
                petitionId: $petitionId
                parentFieldId: $parentFieldId
                profileTypeFieldId: $profileTypeFieldId
              ) {
                id
                parent {
                  id
                  isLinkedToProfileType
                }
                isLinkedToProfileTypeField
                profileTypeField {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", entityName.id),
          },
        );
        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("fails if profile type field does not belong to profile type of the parent field", async () => {
        await mocks.knex
          .from("petition_field")
          .where("id", fieldGroup.id)
          .update({ profile_type_id: contract.id });

        const profileTypeFields = await mocks.knex
          .from("profile_type_field")
          .where("profile_type_id", legalEntity.id)
          .select("*");

        const entityName = profileTypeFields.find((f) => f.alias === "p_entity_name")!;
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
              createProfileLinkedPetitionField(
                petitionId: $petitionId
                parentFieldId: $parentFieldId
                profileTypeFieldId: $profileTypeFieldId
              ) {
                id
                parent {
                  id
                  isLinkedToProfileType
                }
                isLinkedToProfileTypeField
                profileTypeField {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", entityName.id),
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("fails if the profile type field is already linked as child of the field", async () => {
        await mocks.knex
          .from("petition_field")
          .where("id", fieldGroup.id)
          .update({ profile_type_id: legalEntity.id });

        const profileTypeFields = await mocks.knex
          .from("profile_type_field")
          .where("profile_type_id", legalEntity.id)
          .select("*");

        const entityName = profileTypeFields.find((f) => f.alias === "p_entity_name")!;

        for (const expectedError of [false, true]) {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
                createProfileLinkedPetitionField(
                  petitionId: $petitionId
                  parentFieldId: $parentFieldId
                  profileTypeFieldId: $profileTypeFieldId
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
              profileTypeFieldId: toGlobalId("ProfileTypeField", entityName.id),
            },
          );

          if (expectedError) {
            expect(errors).toContainGraphQLError("FORBIDDEN");
            expect(data).toBeNull();
          } else {
            expect(errors).toBeUndefined();
            expect(data?.createProfileLinkedPetitionField).toEqual({
              id: expect.any(String),
            });
          }
        }
      });

      it("maps property options to profile field options", async () => {
        await mocks.knex
          .from("petition_field")
          .where("id", fieldGroup.id)
          .update({ profile_type_id: individual.id });

        const individualFields = await mocks.knex
          .from("profile_type_field")
          .where("profile_type_id", individual.id)
          .select("*");

        for (const property of [
          {
            alias: "p_first_name",
            type: "SHORT_TEXT",
            multiple: false,
            isInternal: false,
            options: {
              placeholder: null,
              maxLength: null,
              format: null,
            },
          },
          {
            alias: "p_email",
            type: "SHORT_TEXT",
            multiple: false,
            isInternal: false,
            options: {
              placeholder: null,
              maxLength: null,
              format: "EMAIL",
            },
          },
          {
            alias: "p_phone_number",
            type: "PHONE",
            multiple: false,
            isInternal: false,
            options: {
              placeholder: null,
            },
          },
          {
            alias: "p_birth_date",
            type: "DATE",
            multiple: false,
            isInternal: false,
            options: {},
          },
          {
            alias: "p_gender",
            type: "SELECT",
            multiple: false,
            isInternal: false,
            options: {
              placeholder: null,
              values: ["M", "F"],
              labels: ["Male", "Female"],
              standardList: null,
            },
          },
          {
            alias: "p_country_of_residence",
            type: "SELECT",
            multiple: false,
            isInternal: false,
            options: {
              placeholder: null,
              values: expect.toBeArrayOfSize(250),
              labels: expect.toBeArrayOfSize(250),
              standardList: "COUNTRIES",
            },
          },
          {
            alias: "p_proof_of_address_document",
            type: "FILE_UPLOAD",
            multiple: true,
            isInternal: false,
            options: {
              accepts: null,
              attachToPdf: false,
            },
          },
          {
            alias: "p_source_of_funds",
            type: "TEXT",
            multiple: false,
            isInternal: false,
            options: {
              maxLength: null,
              placeholder: null,
            },
          },
          {
            alias: "p_background_check",
            type: "BACKGROUND_CHECK",
            multiple: false,
            isInternal: true,
            options: {
              integrationId: null,
              autoSearchConfig: null,
            },
          },
        ]) {
          const profileField = individualFields.find((f) => f.alias === property.alias)!;

          expect(profileField).toBeDefined();

          const { errors, data } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
                createProfileLinkedPetitionField(
                  petitionId: $petitionId
                  parentFieldId: $parentFieldId
                  profileTypeFieldId: $profileTypeFieldId
                ) {
                  type
                  multiple
                  isInternal
                  options
                  alias
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileField.id),
            },
          );

          expect(errors).toBeUndefined();
          expect(data?.createProfileLinkedPetitionField).toEqual({
            ...property,
            alias: null,
          });
        }
      });
    });

    describe("archiveFieldGroupReplyIntoProfile", () => {
      let petition: Petition;

      let textField: PetitionField;
      let individualField: PetitionField;
      let legalEntityField: PetitionField;
      let contractField: PetitionField;
      let contractChildFields: PetitionField[];

      let individualChildFields: PetitionField[];
      let legalEntityChildFields: PetitionField[];

      let individualReply: PetitionFieldReply;
      let legalEntityReply: PetitionFieldReply;
      let contractReply: PetitionFieldReply;

      let individualProfileTypeFields: Record<string, ProfileTypeField>;
      let legalEntityProfileTypeFields: Record<string, ProfileTypeField>;
      let contractProfileTypeFields: Record<string, ProfileTypeField>;

      let fileUploads: FileUpload[];

      /**
       * - create a FIELD_GROUP on the petition for every standard profile type
       * - add field children linked to profile type fields. 1 child per profile property
       * - create replies for every field
       */
      beforeAll(async () => {
        [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
        // create fields and link to profile type
        [textField, individualField, legalEntityField, contractField] =
          await mocks.createRandomPetitionFields(petition.id, 4, (i) => ({
            type: ["TEXT", "FIELD_GROUP", "FIELD_GROUP", "FIELD_GROUP"][i] as PetitionFieldType,
            profile_type_id: [null, individual.id, legalEntity.id, contract.id][i],
          }));

        const profileTypeFields = await mocks.knex
          .from("profile_type_field")
          .whereIn("profile_type_id", [individual.id, legalEntity.id, contract.id])
          .whereNull("deleted_at")
          .orderBy("position", "asc")
          .select("*");

        // create children linked to profileTypeField for every field_group
        individualProfileTypeFields = indexBy(
          profileTypeFields.filter((f) => f.profile_type_id === individual.id),
          (f) => f.alias!,
        );
        expect(Object.keys(individualProfileTypeFields)).toHaveLength(23);
        for (const individualProfileTypeField of Object.values(individualProfileTypeFields)) {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
                createProfileLinkedPetitionField(
                  petitionId: $petitionId
                  parentFieldId: $parentFieldId
                  profileTypeFieldId: $profileTypeFieldId
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              parentFieldId: toGlobalId("PetitionField", individualField.id),
              profileTypeFieldId: toGlobalId("ProfileTypeField", individualProfileTypeField.id),
            },
          );

          expect(errors).toBeUndefined();

          await mocks.knex
            .from("petition_field")
            .where("id", fromGlobalId(data!.createProfileLinkedPetitionField.id).id)
            .update({
              alias: `i_${individualProfileTypeField.alias}`,
            });
        }

        legalEntityProfileTypeFields = indexBy(
          profileTypeFields.filter((f) => f.profile_type_id === legalEntity.id),
          (f) => f.alias!,
        );
        expect(Object.keys(legalEntityProfileTypeFields)).toHaveLength(23);
        for (const legalEntityProfileTypeField of Object.values(legalEntityProfileTypeFields)) {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
                createProfileLinkedPetitionField(
                  petitionId: $petitionId
                  parentFieldId: $parentFieldId
                  profileTypeFieldId: $profileTypeFieldId
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              parentFieldId: toGlobalId("PetitionField", legalEntityField.id),
              profileTypeFieldId: toGlobalId("ProfileTypeField", legalEntityProfileTypeField.id),
            },
          );

          expect(errors).toBeUndefined();

          await mocks.knex
            .from("petition_field")
            .where("id", fromGlobalId(data!.createProfileLinkedPetitionField.id).id)
            .update({
              alias: `le_${legalEntityProfileTypeField.alias}`,
            });
        }

        contractProfileTypeFields = indexBy(
          profileTypeFields.filter((f) => f.profile_type_id === contract.id),
          (f) => f.alias!,
        );
        expect(Object.keys(contractProfileTypeFields)).toHaveLength(22);
        for (const contractProfileTypeField of Object.values(contractProfileTypeFields)) {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
                createProfileLinkedPetitionField(
                  petitionId: $petitionId
                  parentFieldId: $parentFieldId
                  profileTypeFieldId: $profileTypeFieldId
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              parentFieldId: toGlobalId("PetitionField", contractField.id),
              profileTypeFieldId: toGlobalId("ProfileTypeField", contractProfileTypeField.id),
            },
          );

          expect(errors).toBeUndefined();

          await mocks.knex
            .from("petition_field")
            .where("id", fromGlobalId(data!.createProfileLinkedPetitionField.id).id)
            .update({
              alias: `c_${contractProfileTypeField.alias}`,
            });
        }

        // create replies for INDIVIDUAL field
        [individualReply] = await mocks.createFieldGroupReply(
          individualField.id,
          undefined,
          1,
          () => ({ user_id: user.id }),
        );
        individualChildFields = await mocks.knex
          .from("petition_field")
          .where({
            petition_id: petition.id,
            parent_petition_field_id: individualField.id,
            deleted_at: null,
          })
          .select("*");

        let fileCount = 0;
        fileUploads = await mocks.createRandomFileUpload(
          profileTypeFields.filter((f) => f.type === "FILE").length,
        );

        // insert replies for every field on INDIVIDUAL group
        await mocks.knex.from("petition_field_reply").insert([
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_first_name")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Mike" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_last_name")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Wazowski" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_email")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "mwazowski@monsterinc.com" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_phone_number")!
              .id,
            parent_petition_field_reply_id: individualReply.id,
            type: "PHONE",
            user_id: user.id,
            content: { value: "+123456789" },
          },
          {
            petition_field_id: individualChildFields.find(
              (f) => f.alias === "i_p_mobile_phone_number",
            )!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "PHONE",
            user_id: user.id,
            content: { value: "+987654321" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_birth_date")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "1990-02-02" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_gender")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "M" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_address")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "1234 Elm Street" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_city")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Monstropolis" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_zip")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "12345" },
          },
          {
            petition_field_id: individualChildFields.find(
              (f) => f.alias === "i_p_country_of_residence",
            )!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "US" },
          },
          {
            petition_field_id: individualChildFields.find(
              (f) => f.alias === "i_p_proof_of_address_document",
            )!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_citizenship")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "US" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_tax_id")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "123456789" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_id_document")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: individualChildFields.find(
              (f) => f.alias === "i_p_passport_document",
            )!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_passport_number")!
              .id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "A2345678X" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_is_pep")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "N" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_risk")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "LOW" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_risk_assessment")!
              .id,
            parent_petition_field_reply_id: individualReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_source_of_funds")!
              .id,
            parent_petition_field_reply_id: individualReply.id,
            type: "TEXT",
            user_id: user.id,
            content: { value: "Salary" },
          },
          {
            petition_field_id: individualChildFields.find(
              (f) => f.alias === "i_p_background_check",
            )!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "BACKGROUND_CHECK",
            user_id: user.id,
            content: {
              query: { name: "Mike Wazowski", date: null, type: "Person" },
              search: {
                totalCount: 1,
                items: [{ id: "1", type: "Person", name: "Mike Wazowski", properties: {} }],
                createdAt: new Date(),
              },
              entity: { id: "1", type: "Person", name: "Mike Wazowski", properties: {} },
            },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_occupation")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Scarer" },
          },
        ]);

        [legalEntityReply] = await mocks.createFieldGroupReply(
          legalEntityField.id,
          undefined,
          1,
          () => ({ user_id: user.id }),
        );
        legalEntityChildFields = await mocks.knex
          .from("petition_field")
          .where({
            petition_id: petition.id,
            parent_petition_field_id: legalEntityField.id,
            deleted_at: null,
          })
          .select("*");

        // insert replies for every field on LEGAL_ENTITY group
        await mocks.knex.from("petition_field_reply").insert([
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_entity_name")!
              .id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Monsters Inc." },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_trade_name")!
              .id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Monsters Inc." },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_entity_type")!
              .id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "INCORPORATED" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_registration_number",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "123456" },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_tax_id")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "ABCDEF" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_registered_address",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "1234 Monster Street" },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_city")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Monstropolis" },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_zip")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "12345" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_country_of_incorporation",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "US" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_date_of_incorporation",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "1890-12-24" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_main_business_activity",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Scaring" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_ownership_structure",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_ubo_statement")!
              .id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_financial_statements",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_risk")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "MEDIUM" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_risk_assessment",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_poa_types")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "GENERAL_POA" },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_poa_scope")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "All" },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_poa_document")!
              .id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_poa_effective_date",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "2020-01-01" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_poa_expiration_date",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "2031-01-01" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_poa_revocation_conditions",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "None" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_poa_registered",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "Y" },
          },
        ]);

        [contractReply] = await mocks.createFieldGroupReply(contractField.id, undefined, 1, () => ({
          user_id: user.id,
        }));
        contractChildFields = await mocks.knex
          .from("petition_field")
          .where({
            petition_id: petition.id,
            parent_petition_field_id: contractField.id,
            deleted_at: null,
          })
          .select("*");

        // insert replies for every field on CONTRACT group
        await mocks.knex.from("petition_field_reply").insert([
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_counterparty")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Sulley" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_contract_type")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "EMPLOYMENT_CONTRACT" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_effective_date")!
              .id,
            parent_petition_field_reply_id: contractReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "2020-01-01" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_expiration_date")!
              .id,
            parent_petition_field_reply_id: contractReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "2022-01-01" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_jurisdiction")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "US" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_contract_value")!
              .id,
            parent_petition_field_reply_id: contractReply.id,
            type: "NUMBER",
            user_id: user.id,
            content: { value: 1000000 },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_contract_currency")!
              .id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "USD" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_payment_terms")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Net 30" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_renewal_terms")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "None" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_original_document")!
              .id,
            parent_petition_field_reply_id: contractReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_amendments")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_termination_clauses",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "None" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_confidentiality_agreement",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "Y" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_performance_metrics",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Metrics are good" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_dispute_resolution_mechanism",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Arbitration" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_compliance_obligations",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "None" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_security_provisions",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "None" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_notes")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "TEXT",
            user_id: user.id,
            content: { value: "No notes" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_billing_contact_full_name",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "James P. Sullivan" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_billing_contact_email",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "jpsullivan@monsterinc.com" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_legal_contact_full_name",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Randall Boggs" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_legal_contact_email",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "rboggs@monsterinc.com" },
          },
        ]);

        await mocks.knex.from("petition").where("id", petition.id).update({
          status: "CLOSED",
          closed_at: new Date(),
        });
      });

      beforeEach(async () => {
        await mocks.knex.from("petition_event").delete();
        await mocks.knex.from("petition_field_group_relationship").delete();
        await mocks.knex.from("profile_relationship").delete();
      });

      it("archives INDIVIDUAL FIELD_GROUP reply into an empty profile", async () => {
        const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                field {
                  petition {
                    ... on Petition {
                      events(limit: 10, offset: 0) {
                        totalCount
                        items {
                          type
                          data
                        }
                      }
                    }
                  }
                }
                associatedProfile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                  properties {
                    field {
                      type
                      alias
                    }
                    files {
                      id
                    }
                    value {
                      id
                      content
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();

        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", individualReply.id),
          field: {
            petition: {
              events: {
                totalCount: 1,
                items: [
                  {
                    type: "PROFILE_ASSOCIATED",
                    data: {
                      userId: toGlobalId("User", user.id),
                      profileId: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                    },
                  },
                ],
              },
            },
          },
          associatedProfile: {
            id: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
            events: {
              totalCount: 25,
              items: [
                {
                  type: "PROFILE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    petitionId: toGlobalId("Petition", petition.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                ...[
                  "p_risk_assessment",
                  "p_passport_document",
                  "p_id_document",
                  "p_proof_of_address_document",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_FILE_ADDED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileFieldFileId: expect.any(String),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      individualProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                ...[
                  "p_occupation",
                  "p_background_check",
                  "p_source_of_funds",
                  "p_risk",
                  "p_is_pep",
                  "p_passport_number",
                  "p_tax_id",
                  "p_citizenship",
                  "p_country_of_residence",
                  "p_zip",
                  "p_city",
                  "p_address",
                  "p_gender",
                  "p_birth_date",
                  "p_mobile_phone_number",
                  "p_phone_number",
                  "p_email",
                  "p_last_name",
                  "p_first_name",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      individualProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
              ],
            },
            properties: [
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_first_name",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Mike" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_last_name",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Wazowski" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_email",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "mwazowski@monsterinc.com" },
                },
              },
              {
                field: {
                  type: "PHONE",
                  alias: "p_phone_number",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "+123456789", pretty: "+1 23456789" },
                },
              },
              {
                field: {
                  type: "PHONE",
                  alias: "p_mobile_phone_number",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "+987654321", pretty: "+98 7654321" },
                },
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_birth_date",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "1990-02-02" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_gender",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "M" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_address",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "1234 Elm Street" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_city",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Monstropolis" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_zip",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "12345" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_country_of_residence",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "US" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_proof_of_address_document",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_citizenship",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "US" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_tax_id",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "123456789" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_id_document",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_passport_document",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_passport_number",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "A2345678X" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_is_pep",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "N" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_risk",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "LOW" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_risk_assessment",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "TEXT",
                  alias: "p_source_of_funds",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Salary" },
                },
              },
              {
                field: {
                  type: "BACKGROUND_CHECK",
                  alias: "p_background_check",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: {
                    query: {
                      name: "Mike Wazowski",
                      date: null,
                      type: "Person",
                    },
                    search: {
                      totalCount: 1,
                      createdAt: expect.any(String),
                    },
                    entity: {
                      id: "1",
                      type: "Person",
                      name: "Mike Wazowski",
                      properties: {},
                    },
                  },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_occupation",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Scarer" },
                },
              },
            ],
          },
        });
      });

      it("archives LEGAL_ENTITY FIELD_GROUP reply into an empty profile", async () => {
        const [profile] = await mocks.createRandomProfiles(organization.id, legalEntity.id, 1);
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                field {
                  petition {
                    ... on Petition {
                      events(limit: 10, offset: 0) {
                        totalCount
                        items {
                          type
                          data
                        }
                      }
                    }
                  }
                }
                associatedProfile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                  properties {
                    field {
                      type
                      alias
                    }
                    files {
                      id
                    }
                    value {
                      id
                      content
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();

        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          field: {
            petition: {
              events: {
                totalCount: 1,
                items: [
                  {
                    type: "PROFILE_ASSOCIATED",
                    data: {
                      userId: toGlobalId("User", user.id),
                      profileId: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                    },
                  },
                ],
              },
            },
          },
          associatedProfile: {
            id: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
            events: {
              totalCount: 25,
              items: [
                {
                  type: "PROFILE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    petitionId: toGlobalId("Petition", petition.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                ...[
                  "p_poa_document",
                  "p_risk_assessment",
                  "p_financial_statements",
                  "p_ubo_statement",
                  "p_ownership_structure",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_FILE_ADDED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileFieldFileId: expect.any(String),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      legalEntityProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                ...[
                  "p_poa_registered",
                  "p_poa_revocation_conditions",
                  "p_poa_expiration_date",
                  "p_poa_effective_date",
                  "p_poa_scope",
                  "p_poa_types",
                  "p_risk",
                  "p_main_business_activity",
                  "p_date_of_incorporation",
                  "p_country_of_incorporation",
                  "p_zip",
                  "p_city",
                  "p_registered_address",
                  "p_tax_id",
                  "p_registration_number",
                  "p_entity_type",
                  "p_trade_name",
                  "p_entity_name",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      legalEntityProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
              ],
            },
            properties: [
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_entity_name",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Monsters Inc." },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_trade_name",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Monsters Inc." },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_entity_type",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "INCORPORATED" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_registration_number",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "123456" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_tax_id",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "ABCDEF" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_registered_address",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "1234 Monster Street" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_city",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Monstropolis" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_zip",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "12345" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_country_of_incorporation",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "US" },
                },
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_date_of_incorporation",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "1890-12-24" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_main_business_activity",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Scaring" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_ownership_structure",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_ubo_statement",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_financial_statements",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_risk",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "MEDIUM" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_risk_assessment",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_poa_types",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "GENERAL_POA" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_poa_scope",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "All" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_poa_document",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_poa_effective_date",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "2020-01-01" },
                },
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_poa_expiration_date",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "2031-01-01" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_poa_revocation_conditions",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "None" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_poa_registered",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Y" },
                },
              },
            ],
          },
        });
      });

      it("archives CONTRACT FIELD_GROUP reply into an empty profile", async () => {
        const [profile] = await mocks.createRandomProfiles(organization.id, contract.id, 1);
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                field {
                  petition {
                    ... on Petition {
                      events(limit: 10, offset: 0) {
                        totalCount
                        items {
                          type
                          data
                        }
                      }
                    }
                  }
                }
                associatedProfile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                  properties {
                    field {
                      type
                      alias
                    }
                    files {
                      id
                    }
                    value {
                      id
                      content
                      expiryDate
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", contractField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", contractReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [], // should not ask for expiration on p:expiry_date field as it is already defined and has option useReplyAsExpiryDate
          },
        );

        expect(errors).toBeUndefined();

        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", contractReply.id),
          field: {
            petition: {
              events: {
                totalCount: 1,
                items: [
                  {
                    type: "PROFILE_ASSOCIATED",
                    data: {
                      userId: toGlobalId("User", user.id),
                      profileId: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                    },
                  },
                ],
              },
            },
          },
          associatedProfile: {
            id: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
            events: {
              totalCount: 25,
              items: [
                {
                  type: "PROFILE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    petitionId: toGlobalId("Petition", petition.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                ...["p_amendments", "p_original_document"].map((alias) => ({
                  type: "PROFILE_FIELD_FILE_ADDED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileFieldFileId: expect.any(String),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      contractProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                ...[
                  "p_legal_contact_email",
                  "p_legal_contact_full_name",
                  "p_billing_contact_email",
                  "p_billing_contact_full_name",
                  "p_notes",
                  "p_security_provisions",
                  "p_compliance_obligations",
                  "p_dispute_resolution_mechanism",
                  "p_performance_metrics",
                  "p_confidentiality_agreement",
                  "p_termination_clauses",
                  "p_renewal_terms",
                  "p_payment_terms",
                  "p_contract_currency",
                  "p_contract_value",
                  "p_jurisdiction",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      contractProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                {
                  type: "PROFILE_FIELD_EXPIRY_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      contractProfileTypeFields["p_expiration_date"].id,
                    ),
                    alias: "p_expiration_date",
                    expiryDate: "2022-01-01",
                  },
                },
                ...[
                  "p_expiration_date",
                  "p_effective_date",
                  "p_contract_type",
                  "p_counterparty",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      contractProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
              ],
            },
            properties: [
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_counterparty",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Sulley" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_contract_type",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "EMPLOYMENT_CONTRACT" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_effective_date",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "2020-01-01" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_expiration_date",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "2022-01-01" },
                  expiryDate: "2022-01-01",
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_jurisdiction",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "US" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "NUMBER",
                  alias: "p_contract_value",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: 1000000 },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_contract_currency",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "USD" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_payment_terms",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Net 30" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_renewal_terms",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "None" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_original_document",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_amendments",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_termination_clauses",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "None" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_confidentiality_agreement",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Y" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_performance_metrics",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Metrics are good" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_dispute_resolution_mechanism",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Arbitration" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_compliance_obligations",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "None" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_security_provisions",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "None" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "TEXT",
                  alias: "p_notes",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "No notes" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_billing_contact_full_name",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "James P. Sullivan" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_billing_contact_email",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "jpsullivan@monsterinc.com" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_legal_contact_full_name",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Randall Boggs" },
                  expiryDate: null,
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_legal_contact_email",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "rboggs@monsterinc.com" },
                  expiryDate: null,
                },
              },
            ],
          },
        });
      });

      it("sends error when expiration info is required and not provided", async () => {
        const [profile] = await mocks.createRandomProfiles(organization.id, contract.id, 1);

        await mocks.knex
          .from("profile_type_field")
          .where("id", contractProfileTypeFields["p_expiration_date"].id)
          .update({
            options: JSON.stringify({
              ...contractProfileTypeFields["p_expiration_date"].options,
              useReplyAsExpiryDate: false,
            }),
          });

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", contractField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", contractReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toContainGraphQLError("CONFLICT_RESOLUTION_REQUIRED_ERROR", {
          conflictResolutions: [],
          expirations: [
            toGlobalId("ProfileTypeField", contractProfileTypeFields["p_expiration_date"].id),
          ],
        });
        expect(data).toBeNull();

        await mocks.knex
          .from("profile_type_field")
          .where("id", contractProfileTypeFields["p_expiration_date"].id)
          .update({
            options: JSON.stringify({
              ...contractProfileTypeFields["p_expiration_date"].options,
              useReplyAsExpiryDate: true,
            }),
          });
      });

      it("sends error when a conflict exists with a current value in the profile and conflictResolution is not provided", async () => {
        const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [UpdateProfileFieldValueInput!]) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", contract.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields["p_counterparty"].id,
                ),
                content: {
                  value: "Mike Wazowski",
                },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields["p_contract_type"].id,
                ),
                content: { value: "SERVICE_AGREEMENT" },
              },
            ],
          },
        );

        expect(createProfileErrors).toBeUndefined();
        expect(createProfileData?.createProfile).toEqual({
          id: expect.any(String),
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", contractField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", contractReply.id),
            profileId: createProfileData!.createProfile.id,
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toContainGraphQLError("CONFLICT_RESOLUTION_REQUIRED_ERROR", {
          conflictResolutions: [
            toGlobalId("ProfileTypeField", contractProfileTypeFields["p_counterparty"].id),
            toGlobalId("ProfileTypeField", contractProfileTypeFields["p_contract_type"].id),
          ],
          expirations: [],
        });
        expect(data).toBeNull();
      });

      it("skips value if it already exists on the profile and its the same content", async () => {
        const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [UpdateProfileFieldValueInput!]) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", contract.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields["p_counterparty"].id,
                ),
                content: {
                  value: "Sulley",
                },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields["p_contract_type"].id,
                ),
                content: { value: "EMPLOYMENT_CONTRACT" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields["p_effective_date"].id,
                ),
                content: { value: "2020-01-01" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields["p_expiration_date"].id,
                ),
                content: { value: "2022-01-01" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields["p_jurisdiction"].id,
                ),
                content: { value: "US" },
              },
            ],
          },
        );

        expect(createProfileErrors).toBeUndefined();
        expect(createProfileData?.createProfile).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 8,
            items: [
              {
                type: "PROFILE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    contractProfileTypeFields["p_jurisdiction"].id,
                  ),
                  alias: "p_jurisdiction",
                },
              },
              {
                type: "PROFILE_FIELD_EXPIRY_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    contractProfileTypeFields["p_expiration_date"].id,
                  ),
                  alias: "p_expiration_date",
                  expiryDate: "2022-01-01",
                },
              },
              ...["p_expiration_date", "p_effective_date", "p_contract_type", "p_counterparty"].map(
                (alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      contractProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                }),
              ),
              {
                type: "PROFILE_CREATED",
                data: {
                  userId: toGlobalId("User", user.id),
                },
              },
            ],
          },
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", contractField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", contractReply.id),
            profileId: createProfileData!.createProfile.id,
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", contractReply.id),
          associatedProfile: {
            id: createProfileData!.createProfile.id,
            events: {
              totalCount: 26,
              items: [
                {
                  type: "PROFILE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    petitionId: toGlobalId("Petition", petition.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                ...["p_amendments", "p_original_document"].map((alias) => ({
                  type: "PROFILE_FIELD_FILE_ADDED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileFieldFileId: expect.any(String),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      contractProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                ...[
                  "p_legal_contact_email",
                  "p_legal_contact_full_name",
                  "p_billing_contact_email",
                  "p_billing_contact_full_name",
                  "p_notes",
                  "p_security_provisions",
                  "p_compliance_obligations",
                  "p_dispute_resolution_mechanism",
                  "p_performance_metrics",
                  "p_confidentiality_agreement",
                  "p_termination_clauses",
                  "p_renewal_terms",
                  "p_payment_terms",
                  "p_contract_currency",
                  "p_contract_value",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      contractProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                // EVENTS FROM BEFORE
                {
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      contractProfileTypeFields["p_jurisdiction"].id,
                    ),
                    alias: "p_jurisdiction",
                  },
                },
                {
                  type: "PROFILE_FIELD_EXPIRY_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      contractProfileTypeFields["p_expiration_date"].id,
                    ),
                    alias: "p_expiration_date",
                    expiryDate: "2022-01-01",
                  },
                },
                ...[
                  "p_expiration_date",
                  "p_effective_date",
                  "p_contract_type",
                  "p_counterparty",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      contractProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                {
                  type: "PROFILE_CREATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
              ],
            },
          },
        });
      });

      it("skips file if it already exists on the profile and it has the same path", async () => {
        const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!) {
              createProfile(profileTypeId: $profileTypeId) {
                id
              }
            }
          `,
          { profileTypeId: toGlobalId("ProfileType", individual.id) },
        );

        expect(createProfileErrors).toBeUndefined();
        expect(createProfileData?.createProfile).toEqual({
          id: expect.any(String),
        });

        const clonedFiles = await mocks.createRandomFileUpload(4, (i) => ({
          path: fileUploads[i].path,
        }));

        // add files to profile
        const profileFieldFiles = await mocks.knex.from("profile_field_file").insert(
          [
            "p_proof_of_address_document",
            "p_id_document",
            "p_passport_document",
            "p_risk_assessment",
          ].map((alias, i) => ({
            created_by_user_id: user.id,
            file_upload_id: clonedFiles[i].id,
            profile_id: fromGlobalId(createProfileData!.createProfile.id).id,
            type: "FILE",
            profile_type_field_id: individualProfileTypeFields[alias].id,
          })),
          "*",
        );

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                  properties {
                    field {
                      alias
                      type
                    }
                    value {
                      content
                    }
                    files {
                      id
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: createProfileData!.createProfile.id,
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", individualReply.id),
          associatedProfile: {
            id: createProfileData!.createProfile.id,
            events: {
              totalCount: 22,
              items: [
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    petitionId: toGlobalId("Petition", petition.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PROFILE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
                ...[
                  "p_occupation",
                  "p_background_check",
                  "p_source_of_funds",
                  "p_risk",
                  "p_is_pep",
                  "p_passport_number",
                  "p_tax_id",
                  "p_citizenship",
                  "p_country_of_residence",
                  "p_zip",
                  "p_city",
                  "p_address",
                  "p_gender",
                  "p_birth_date",
                  "p_mobile_phone_number",
                  "p_phone_number",
                  "p_email",
                  "p_last_name",
                  "p_first_name",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      individualProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                {
                  type: "PROFILE_CREATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
              ],
            },
            properties: [
              {
                field: {
                  alias: "p_first_name",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Mike",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_last_name",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Wazowski",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_email",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "mwazowski@monsterinc.com",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_phone_number",
                  type: "PHONE",
                },
                value: {
                  content: {
                    value: "+123456789",
                    pretty: "+1 23456789",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_mobile_phone_number",
                  type: "PHONE",
                },
                value: {
                  content: {
                    value: "+987654321",
                    pretty: "+98 7654321",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_birth_date",
                  type: "DATE",
                },
                value: {
                  content: {
                    value: "1990-02-02",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_gender",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "M",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_address",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "1234 Elm Street",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_city",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Monstropolis",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_zip",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "12345",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_country_of_residence",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "US",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_proof_of_address_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: toGlobalId("ProfileFieldFile", profileFieldFiles[0].id),
                  },
                ],
              },
              {
                field: {
                  alias: "p_citizenship",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "US",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_tax_id",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "123456789",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_id_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: toGlobalId("ProfileFieldFile", profileFieldFiles[1].id),
                  },
                ],
              },
              {
                field: {
                  alias: "p_passport_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: toGlobalId("ProfileFieldFile", profileFieldFiles[2].id),
                  },
                ],
              },
              {
                field: {
                  alias: "p_passport_number",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "A2345678X",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_is_pep",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "N",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_risk",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "LOW",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_risk_assessment",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: toGlobalId("ProfileFieldFile", profileFieldFiles[3].id),
                  },
                ],
              },
              {
                field: {
                  alias: "p_source_of_funds",
                  type: "TEXT",
                },
                value: {
                  content: {
                    value: "Salary",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_background_check",
                  type: "BACKGROUND_CHECK",
                },
                value: {
                  content: {
                    query: {
                      name: "Mike Wazowski",
                      date: null,
                      type: "Person",
                    },
                    search: {
                      totalCount: 1,
                      createdAt: expect.any(String),
                    },
                    entity: {
                      id: "1",
                      type: "Person",
                      name: "Mike Wazowski",
                      properties: {},
                    },
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_occupation",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Scarer",
                  },
                },
                files: null,
              },
            ],
          },
        });
      });

      it("ignoring TEXT conflict on an expirable field should not trigger an expiration conflict", async () => {
        // make field expirable just for this test
        await mocks.knex
          .from("profile_type_field")
          .where("id", individualProfileTypeFields["p_risk"].id)
          .update("is_expirable", true);

        const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [UpdateProfileFieldValueInput!]) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualProfileTypeFields["p_risk"].id,
                ),
                content: {
                  value: "HIGH",
                },
              },
            ],
          },
        );

        expect(createProfileErrors).toBeUndefined();
        expect(createProfileData?.createProfile).toEqual({
          id: expect.any(String),
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  properties {
                    field {
                      alias
                      type
                    }
                    value {
                      content
                    }
                    files {
                      id
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: createProfileData!.createProfile.id,
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualProfileTypeFields["p_risk"].id,
                ),
                action: "IGNORE",
              },
            ],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", individualReply.id),
          associatedProfile: {
            id: createProfileData!.createProfile.id,
            properties: [
              {
                field: {
                  alias: "p_first_name",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Mike",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_last_name",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Wazowski",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_email",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "mwazowski@monsterinc.com",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_phone_number",
                  type: "PHONE",
                },
                value: {
                  content: {
                    value: "+123456789",
                    pretty: "+1 23456789",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_mobile_phone_number",
                  type: "PHONE",
                },
                value: {
                  content: {
                    value: "+987654321",
                    pretty: "+98 7654321",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_birth_date",
                  type: "DATE",
                },
                value: {
                  content: {
                    value: "1990-02-02",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_gender",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "M",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_address",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "1234 Elm Street",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_city",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Monstropolis",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_zip",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "12345",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_country_of_residence",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "US",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_proof_of_address_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_citizenship",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "US",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_tax_id",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "123456789",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_id_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_passport_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_passport_number",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "A2345678X",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_is_pep",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "N",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_risk",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "HIGH",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_risk_assessment",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_source_of_funds",
                  type: "TEXT",
                },
                value: {
                  content: {
                    value: "Salary",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_background_check",
                  type: "BACKGROUND_CHECK",
                },
                value: {
                  content: {
                    query: {
                      name: "Mike Wazowski",
                      date: null,
                      type: "Person",
                    },
                    search: {
                      totalCount: 1,
                      createdAt: expect.any(String),
                    },
                    entity: {
                      id: "1",
                      type: "Person",
                      name: "Mike Wazowski",
                      properties: {},
                    },
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_occupation",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Scarer",
                  },
                },
                files: null,
              },
            ],
          },
        });

        await mocks.knex
          .from("profile_type_field")
          .where("id", individualProfileTypeFields["p_risk"].id)
          .update("is_expirable", false);
      });

      it("ignoring FILE conflict on an expirable field should not trigger an expiration conflict", async () => {
        // make field expirable just for this test
        await mocks.knex
          .from("profile_type_field")
          .where("id", individualProfileTypeFields["p_id_document"].id)
          .update("is_expirable", true);

        const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!) {
              createProfile(profileTypeId: $profileTypeId) {
                id
              }
            }
          `,
          { profileTypeId: toGlobalId("ProfileType", individual.id) },
        );

        expect(createProfileErrors).toBeUndefined();
        expect(createProfileData?.createProfile).toEqual({
          id: expect.any(String),
        });

        const [fileUpload] = await mocks.createRandomFileUpload(1);

        // add file to profile
        const [profileFieldFile] = await mocks.knex.from("profile_field_file").insert(
          {
            created_by_user_id: user.id,
            file_upload_id: fileUpload.id,
            profile_id: fromGlobalId(createProfileData!.createProfile.id).id,
            type: "FILE",
            profile_type_field_id: individualProfileTypeFields["p_id_document"].id,
          },
          "*",
        );

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  properties {
                    field {
                      alias
                      type
                    }
                    value {
                      content
                    }
                    files {
                      id
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: createProfileData!.createProfile.id,
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualProfileTypeFields["p_id_document"].id,
                ),
                action: "IGNORE",
              },
            ],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", individualReply.id),
          associatedProfile: {
            id: createProfileData!.createProfile.id,
            properties: [
              {
                field: {
                  alias: "p_first_name",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Mike",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_last_name",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Wazowski",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_email",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "mwazowski@monsterinc.com",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_phone_number",
                  type: "PHONE",
                },
                value: {
                  content: {
                    value: "+123456789",
                    pretty: "+1 23456789",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_mobile_phone_number",
                  type: "PHONE",
                },
                value: {
                  content: {
                    value: "+987654321",
                    pretty: "+98 7654321",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_birth_date",
                  type: "DATE",
                },
                value: {
                  content: {
                    value: "1990-02-02",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_gender",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "M",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_address",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "1234 Elm Street",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_city",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Monstropolis",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_zip",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "12345",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_country_of_residence",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "US",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_proof_of_address_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_citizenship",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "US",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_tax_id",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "123456789",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_id_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: toGlobalId("ProfileFieldFile", profileFieldFile.id),
                  },
                ],
              },
              {
                field: {
                  alias: "p_passport_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_passport_number",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "A2345678X",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_is_pep",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "N",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_risk",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "LOW",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_risk_assessment",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_source_of_funds",
                  type: "TEXT",
                },
                value: {
                  content: {
                    value: "Salary",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_background_check",
                  type: "BACKGROUND_CHECK",
                },
                value: {
                  content: {
                    query: {
                      name: "Mike Wazowski",
                      date: null,
                      type: "Person",
                    },
                    search: {
                      totalCount: 1,
                      createdAt: expect.any(String),
                    },
                    entity: {
                      id: "1",
                      type: "Person",
                      name: "Mike Wazowski",
                      properties: {},
                    },
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_occupation",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Scarer",
                  },
                },
                files: null,
              },
            ],
          },
        });

        await mocks.knex
          .from("profile_type_field")
          .where("id", individualProfileTypeFields["p_id_document"].id)
          .update("is_expirable", false);
      });

      it("appends new files to the profile when passing APPEND resolution", async () => {
        const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!) {
              createProfile(profileTypeId: $profileTypeId) {
                id
              }
            }
          `,
          { profileTypeId: toGlobalId("ProfileType", legalEntity.id) },
        );

        expect(createProfileErrors).toBeUndefined();
        expect(createProfileData?.createProfile).toEqual({
          id: expect.any(String),
        });

        const [replyFile, profileFile1, profileFile2] = await mocks.createRandomFileUpload(
          3,
          (i) => ({
            path: ["/same-path", "/same-path", "/other-path"][i],
          }),
        );

        // add file to profile
        const profileFieldFiles = await mocks.knex.from("profile_field_file").insert(
          [profileFile1, profileFile2].map((file) => ({
            created_by_user_id: user.id,
            file_upload_id: file.id,
            profile_id: fromGlobalId(createProfileData!.createProfile.id).id,
            type: "FILE",
            profile_type_field_id: legalEntityProfileTypeFields["p_poa_document"].id,
          })),
          "*",
        );

        // add file with same path to the petition reply
        const [reply] = await mocks.knex.from("petition_field_reply").insert(
          {
            user_id: user.id,
            parent_petition_field_reply_id: individualReply.id,
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_poa_document")!
              .id,
            content: { file_upload_id: replyFile.id },
            type: "FILE_UPLOAD",
          },
          "*",
        );

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  properties {
                    field {
                      alias
                      type
                    }
                    value {
                      content
                    }
                    files {
                      id
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
            profileId: createProfileData!.createProfile.id,
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields["p_poa_document"].id,
                ),
                action: "APPEND",
              },
            ],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          associatedProfile: {
            id: createProfileData!.createProfile.id,
            properties: [
              {
                field: {
                  alias: "p_entity_name",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Monsters Inc.",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_trade_name",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Monsters Inc.",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_entity_type",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "INCORPORATED",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_registration_number",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "123456",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_tax_id",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "ABCDEF",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_registered_address",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "1234 Monster Street",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_city",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Monstropolis",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_zip",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "12345",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_country_of_incorporation",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "US",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_date_of_incorporation",
                  type: "DATE",
                },
                value: {
                  content: {
                    value: "1890-12-24",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_main_business_activity",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Scaring",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_ownership_structure",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_ubo_statement",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_financial_statements",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_risk",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "MEDIUM",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_risk_assessment",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_poa_types",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "GENERAL_POA",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_poa_scope",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "All",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_poa_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: toGlobalId("ProfileFieldFile", profileFieldFiles[0].id),
                  },
                  {
                    id: toGlobalId("ProfileFieldFile", profileFieldFiles[1].id),
                  },
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_poa_effective_date",
                  type: "DATE",
                },
                value: {
                  content: {
                    value: "2020-01-01",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_poa_expiration_date",
                  type: "DATE",
                },
                value: {
                  content: {
                    value: "2031-01-01",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_poa_revocation_conditions",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "None",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_poa_registered",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "Y",
                  },
                },
                files: null,
              },
            ],
          },
        });

        await mocks.knex.from("petition_field_reply").where("id", reply.id).delete();
      });

      it("replaces all distinct files from field when passing OVERWRITE resolution", async () => {
        const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!) {
              createProfile(profileTypeId: $profileTypeId) {
                id
              }
            }
          `,
          { profileTypeId: toGlobalId("ProfileType", legalEntity.id) },
        );

        expect(createProfileErrors).toBeUndefined();
        expect(createProfileData?.createProfile).toEqual({
          id: expect.any(String),
        });

        const [replyFile1, profileFile1, profileFile2] = await mocks.createRandomFileUpload(
          3,
          (i) => ({
            path: ["/reply-1", "/reply-1", "/profile-2"][i],
          }),
        );

        // add file to profile
        const profileFieldFiles = await mocks.knex.from("profile_field_file").insert(
          [profileFile1, profileFile2].map((file) => ({
            created_by_user_id: user.id,
            file_upload_id: file.id,
            profile_id: fromGlobalId(createProfileData!.createProfile.id).id,
            type: "FILE",
            profile_type_field_id: legalEntityProfileTypeFields["p_poa_document"].id,
          })),
          "*",
        );

        // add file with same path to the petition reply
        const [reply] = await mocks.knex.from("petition_field_reply").insert(
          {
            user_id: user.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_poa_document")!
              .id,
            content: { file_upload_id: replyFile1.id },
            type: "FILE_UPLOAD",
          },
          "*",
        );

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  properties {
                    field {
                      alias
                      type
                    }
                    value {
                      content
                    }
                    files {
                      id
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
            profileId: createProfileData!.createProfile.id,
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields["p_poa_document"].id,
                ),
                action: "OVERWRITE",
              },
            ],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();

        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          associatedProfile: {
            id: createProfileData!.createProfile.id,
            properties: [
              {
                field: {
                  alias: "p_entity_name",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Monsters Inc.",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_trade_name",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Monsters Inc.",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_entity_type",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "INCORPORATED",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_registration_number",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "123456",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_tax_id",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "ABCDEF",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_registered_address",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "1234 Monster Street",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_city",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Monstropolis",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_zip",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "12345",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_country_of_incorporation",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "US",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_date_of_incorporation",
                  type: "DATE",
                },
                value: {
                  content: {
                    value: "1890-12-24",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_main_business_activity",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "Scaring",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_ownership_structure",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_ubo_statement",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_financial_statements",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_risk",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "MEDIUM",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_risk_assessment",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_poa_types",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "GENERAL_POA",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_poa_scope",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "All",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_poa_document",
                  type: "FILE",
                },
                value: null,
                files: [
                  {
                    id: toGlobalId("ProfileFieldFile", profileFieldFiles[0].id),
                  },
                  {
                    id: expect.any(String),
                  },
                ],
              },
              {
                field: {
                  alias: "p_poa_effective_date",
                  type: "DATE",
                },
                value: {
                  content: {
                    value: "2020-01-01",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_poa_expiration_date",
                  type: "DATE",
                },
                value: {
                  content: {
                    value: "2031-01-01",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_poa_revocation_conditions",
                  type: "SHORT_TEXT",
                },
                value: {
                  content: {
                    value: "None",
                  },
                },
                files: null,
              },
              {
                field: {
                  alias: "p_poa_registered",
                  type: "SELECT",
                },
                value: {
                  content: {
                    value: "Y",
                  },
                },
                files: null,
              },
            ],
          },
        });

        await mocks.knex.from("petition_field_reply").where("id", reply.id).delete();
      });

      it("fails if petition is not closed", async () => {
        await mocks.knex
          .from("petition")
          .where("id", petition.id)
          .update({ status: "PENDING", closed_at: null });

        const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toContainGraphQLError("PETITION_STATUS_ERROR");
        expect(data).toBeNull();

        await mocks.knex
          .from("petition")
          .where("id", petition.id)
          .update({ status: "CLOSED", closed_at: new Date() });
      });

      it("fails if field is not linked to a profile type", async () => {
        await mocks.knex
          .from("petition_field")
          .where("id", individualField.id)
          .update("profile_type_id", null);

        const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();

        await mocks.knex
          .from("petition_field")
          .where("id", individualField.id)
          .update("profile_type_id", individual.id);
      });

      it("fails if field group is not visible", async () => {
        await mocks.knex
          .from("petition_field")
          .where("id", individualField.id)
          .update({
            visibility: {
              type: "HIDE",
              operator: "AND",
              conditions: [
                {
                  value: "HIDE_INDIVIDUAL",
                  fieldId: textField.id,
                  modifier: "ANY",
                  operator: "EQUAL",
                },
              ],
            },
          });

        await mocks.knex.from("petition_field_reply").insert({
          content: { value: "HIDE_INDIVIDUAL" },
          petition_field_id: textField.id,
          user_id: user.id,
          type: "TEXT",
        });

        const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();

        await mocks.knex.from("petition_field").where("id", individualField.id).update({
          visibility: null,
        });
      });

      it("ignores replies on fields that are not visible on current visibility config", async () => {
        await mocks.knex
          .from("petition_field")
          .whereIn(
            "id",
            [
              "le_p_registration_number",
              "le_p_tax_id",
              "le_p_registered_address",
              "le_p_city",
              "le_p_zip",
              "le_p_financial_statements",
            ].map((alias) => legalEntityChildFields.find((c) => c.alias === alias)!.id),
          )
          .update({
            visibility: {
              type: "HIDE",
              operator: "AND",
              conditions: [
                {
                  fieldId: legalEntityChildFields.find((c) => c.alias === "le_p_entity_type")!.id,
                  modifier: "ANY",
                  operator: "EQUAL",
                  value: "INCORPORATED",
                },
              ],
            },
          });

        const [profile] = await mocks.createRandomProfiles(organization.id, legalEntity.id, 1);

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                  properties {
                    field {
                      type
                      alias
                    }
                    value {
                      content
                    }
                    files {
                      id
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            overrideFields: [],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          associatedProfile: {
            id: expect.any(String),
            events: {
              totalCount: 19,
              items: [
                {
                  type: "PROFILE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    petitionId: toGlobalId("Petition", petition.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                ...[
                  "p_poa_document",
                  "p_risk_assessment",
                  "p_ubo_statement",
                  "p_ownership_structure",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_FILE_ADDED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileFieldFileId: expect.any(String),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      legalEntityProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                ...[
                  "p_poa_registered",
                  "p_poa_revocation_conditions",
                  "p_poa_expiration_date",
                  "p_poa_effective_date",
                  "p_poa_scope",
                  "p_poa_types",
                  "p_risk",
                  "p_main_business_activity",
                  "p_date_of_incorporation",
                  "p_country_of_incorporation",
                  "p_entity_type",
                  "p_trade_name",
                  "p_entity_name",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      legalEntityProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
              ],
            },
            properties: [
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_entity_name",
                },
                files: null,
                value: {
                  content: { value: "Monsters Inc." },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_trade_name",
                },
                files: null,
                value: {
                  content: { value: "Monsters Inc." },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_entity_type",
                },
                files: null,
                value: {
                  content: { value: "INCORPORATED" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_registration_number",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_tax_id",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_registered_address",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_city",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_zip",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_country_of_incorporation",
                },
                files: null,
                value: {
                  content: { value: "US" },
                },
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_date_of_incorporation",
                },
                files: null,
                value: {
                  content: { value: "1890-12-24" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_main_business_activity",
                },
                files: null,
                value: {
                  content: { value: "Scaring" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_ownership_structure",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_ubo_statement",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_financial_statements",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_risk",
                },
                files: null,
                value: {
                  content: { value: "MEDIUM" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_risk_assessment",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_poa_types",
                },
                files: null,
                value: {
                  content: { value: "GENERAL_POA" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_poa_scope",
                },
                files: null,
                value: {
                  content: { value: "All" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_poa_document",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_poa_effective_date",
                },
                files: null,
                value: {
                  content: { value: "2020-01-01" },
                },
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_poa_expiration_date",
                },
                files: null,
                value: {
                  content: { value: "2031-01-01" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_poa_revocation_conditions",
                },
                files: null,
                value: {
                  content: { value: "None" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_poa_registered",
                },
                files: null,
                value: {
                  content: { value: "Y" },
                },
              },
            ],
          },
        });

        await mocks.knex
          .from("petition_field")
          .where("parent_petition_field_id", legalEntityField.id)
          .update({ visibility: null });
      });

      it("fails if profile has different profile_type than the field group", async () => {
        const [profile] = await mocks.createRandomProfiles(organization.id, contract.id, 1);

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("fails if user does not have WRITE permission on a field to overwrite", async () => {
        await mocks.knex
          .from("profile_type_field")
          .where("id", individualProfileTypeFields["p_first_name"].id)
          .update("permission", "READ");

        const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);
        await mocks.knex.from("profile_field_value").insert({
          created_by_user_id: user.id,
          profile_id: profile.id,
          profile_type_field_id: individualProfileTypeFields["p_first_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Jane" },
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualProfileTypeFields["p_first_name"].id,
                ),
                action: "OVERWRITE",
              },
            ],
            expirations: [],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();

        await mocks.knex
          .from("profile_type_field")
          .where("id", individualProfileTypeFields["p_first_name"].id)
          .update("permission", "WRITE");
      });

      it("does not create values on properties with READ or HIDDEN permission", async () => {
        await mocks.knex
          .from("profile_type_field")
          .whereIn("id", [
            individualProfileTypeFields["p_first_name"].id,
            individualProfileTypeFields["p_last_name"].id,
            individualProfileTypeFields["p_id_document"].id,
          ])
          .update("permission", ["HIDDEN", "READ"][Math.round(Math.random())]);

        const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                field {
                  petition {
                    ... on Petition {
                      events(limit: 100, offset: 0) {
                        totalCount
                        items {
                          type
                          data
                        }
                      }
                    }
                  }
                }
                associatedProfile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                  properties {
                    field {
                      type
                      alias
                    }
                    files {
                      id
                    }
                    value {
                      id
                      content
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();

        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", individualReply.id),
          field: {
            petition: {
              events: {
                totalCount: 1,
                items: [
                  {
                    type: "PROFILE_ASSOCIATED",
                    data: {
                      userId: toGlobalId("User", user.id),
                      profileId: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                    },
                  },
                ],
              },
            },
          },
          associatedProfile: {
            id: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
            events: {
              totalCount: 22,
              items: [
                {
                  type: "PROFILE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    petitionId: toGlobalId("Petition", petition.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                ...["p_risk_assessment", "p_passport_document", "p_proof_of_address_document"].map(
                  (alias) => ({
                    type: "PROFILE_FIELD_FILE_ADDED",
                    data: {
                      userId: toGlobalId("User", user.id),
                      profileFieldFileId: expect.any(String),
                      profileTypeFieldId: toGlobalId(
                        "ProfileTypeField",
                        individualProfileTypeFields[alias].id,
                      ),
                      alias,
                    },
                  }),
                ),
                ...[
                  "p_occupation",
                  "p_background_check",
                  "p_source_of_funds",
                  "p_risk",
                  "p_is_pep",
                  "p_passport_number",
                  "p_tax_id",
                  "p_citizenship",
                  "p_country_of_residence",
                  "p_zip",
                  "p_city",
                  "p_address",
                  "p_gender",
                  "p_birth_date",
                  "p_mobile_phone_number",
                  "p_phone_number",
                  "p_email",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      individualProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
              ],
            },
            properties: [
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_first_name",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_last_name",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_email",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "mwazowski@monsterinc.com" },
                },
              },
              {
                field: {
                  type: "PHONE",
                  alias: "p_phone_number",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "+123456789", pretty: "+1 23456789" },
                },
              },
              {
                field: {
                  type: "PHONE",
                  alias: "p_mobile_phone_number",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "+987654321", pretty: "+98 7654321" },
                },
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_birth_date",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "1990-02-02" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_gender",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "M" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_address",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "1234 Elm Street" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_city",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Monstropolis" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_zip",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "12345" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_country_of_residence",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "US" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_proof_of_address_document",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_citizenship",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "US" },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_tax_id",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "123456789" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_id_document",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_passport_document",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_passport_number",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "A2345678X" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_is_pep",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "N" },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_risk",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "LOW" },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_risk_assessment",
                },
                files: [{ id: expect.any(String) }],
                value: null,
              },
              {
                field: {
                  type: "TEXT",
                  alias: "p_source_of_funds",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Salary" },
                },
              },
              {
                field: {
                  type: "BACKGROUND_CHECK",
                  alias: "p_background_check",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: {
                    query: {
                      name: "Mike Wazowski",
                      date: null,
                      type: "Person",
                    },
                    search: {
                      totalCount: 1,
                      createdAt: expect.any(String),
                    },
                    entity: {
                      id: "1",
                      type: "Person",
                      name: "Mike Wazowski",
                      properties: {},
                    },
                  },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_occupation",
                },
                files: null,
                value: {
                  id: expect.any(String),
                  content: { value: "Scarer" },
                },
              },
            ],
          },
        });

        await mocks.knex
          .from("profile_type_field")
          .whereIn("id", [
            individualProfileTypeFields["p_first_name"].id,
            individualProfileTypeFields["p_last_name"].id,
            individualProfileTypeFields["p_id_document"].id,
          ])
          .update("permission", "WRITE");
      });

      it("removes values and files from profile if overwriting with empty replies", async () => {
        const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [UpdateProfileFieldValueInput!]) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", legalEntity.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields["p_entity_name"].id,
                ),
                content: { value: "Parallel INC" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields["p_risk"].id,
                ),
                content: { value: "LOW" },
              },
            ],
          },
        );

        expect(createProfileErrors).toBeUndefined();
        expect(createProfileData?.createProfile).toEqual({
          id: expect.any(String),
        });

        const fileUploads = await mocks.createRandomFileUpload(2);
        // also insert some files
        await mocks.knex.from("profile_field_file").insert(
          ["p_ownership_structure", "p_ubo_statement"].map((alias, i) => ({
            created_by_user_id: user.id,
            file_upload_id: fileUploads[i].id,
            profile_id: fromGlobalId(createProfileData!.createProfile.id).id,
            profile_type_field_id: legalEntityProfileTypeFields[alias].id,
            type: "FILE",
          })),
        );

        // temporally delete replies from these fields
        const deletedReplies = await mocks.knex
          .from("petition_field_reply")
          .where("parent_petition_field_reply_id", legalEntityReply.id)
          .whereIn("petition_field_id", [
            legalEntityChildFields.find((f) => f.alias === "le_p_entity_name")!.id,
            legalEntityChildFields.find((f) => f.alias === "le_p_risk")!.id,
            legalEntityChildFields.find((f) => f.alias === "le_p_ownership_structure")!.id,
            legalEntityChildFields.find((f) => f.alias === "le_p_ubo_statement")!.id,
          ])
          .update({ deleted_at: new Date(), deleted_by: "TEST" })
          .returning("*");

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                  properties {
                    field {
                      type
                      alias
                    }
                    files {
                      id
                    }
                    value {
                      content
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
            profileId: createProfileData!.createProfile.id,
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields["p_entity_name"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields["p_risk"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields["p_ownership_structure"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields["p_ubo_statement"].id,
                ),
                action: "OVERWRITE",
              },
            ],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          associatedProfile: {
            id: createProfileData.createProfile.id,
            events: {
              totalCount: 28,
              items: [
                {
                  type: "PROFILE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    petitionId: toGlobalId("Petition", petition.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                ...["p_poa_document", "p_risk_assessment", "p_financial_statements"].map(
                  (alias) => ({
                    type: "PROFILE_FIELD_FILE_ADDED",
                    data: {
                      userId: toGlobalId("User", user.id),
                      profileTypeFieldId: toGlobalId(
                        "ProfileTypeField",
                        legalEntityProfileTypeFields[alias].id,
                      ),
                      profileFieldFileId: expect.any(String),
                      alias,
                    },
                  }),
                ),
                ...["p_ubo_statement", "p_ownership_structure"].map((alias) => ({
                  type: "PROFILE_FIELD_FILE_REMOVED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      legalEntityProfileTypeFields[alias].id,
                    ),
                    profileFieldFileId: expect.any(String),
                    alias,
                  },
                })),
                ...[
                  "p_poa_registered",
                  "p_poa_revocation_conditions",
                  "p_poa_expiration_date",
                  "p_poa_effective_date",
                  "p_poa_scope",
                  "p_poa_types",
                  "p_risk",
                  "p_main_business_activity",
                  "p_date_of_incorporation",
                  "p_country_of_incorporation",
                  "p_zip",
                  "p_city",
                  "p_registered_address",
                  "p_tax_id",
                  "p_registration_number",
                  "p_entity_type",
                  "p_trade_name",
                  "p_entity_name",
                  "p_risk",
                  "p_entity_name",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      legalEntityProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                {
                  type: "PROFILE_CREATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
              ],
            },
            properties: [
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_entity_name",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_trade_name",
                },
                files: null,
                value: {
                  content: {
                    value: "Monsters Inc.",
                  },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_entity_type",
                },
                files: null,
                value: {
                  content: {
                    value: "INCORPORATED",
                  },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_registration_number",
                },
                files: null,
                value: {
                  content: {
                    value: "123456",
                  },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_tax_id",
                },
                files: null,
                value: {
                  content: {
                    value: "ABCDEF",
                  },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_registered_address",
                },
                files: null,
                value: {
                  content: {
                    value: "1234 Monster Street",
                  },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_city",
                },
                files: null,
                value: {
                  content: {
                    value: "Monstropolis",
                  },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_zip",
                },
                files: null,
                value: {
                  content: {
                    value: "12345",
                  },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_country_of_incorporation",
                },
                files: null,
                value: {
                  content: {
                    value: "US",
                  },
                },
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_date_of_incorporation",
                },
                files: null,
                value: {
                  content: {
                    value: "1890-12-24",
                  },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_main_business_activity",
                },
                files: null,
                value: {
                  content: {
                    value: "Scaring",
                  },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_ownership_structure",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_ubo_statement",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_financial_statements",
                },
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
                value: null,
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_risk",
                },
                files: null,
                value: null,
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_risk_assessment",
                },
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
                value: null,
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_poa_types",
                },
                files: null,
                value: {
                  content: {
                    value: "GENERAL_POA",
                  },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_poa_scope",
                },
                files: null,
                value: {
                  content: {
                    value: "All",
                  },
                },
              },
              {
                field: {
                  type: "FILE",
                  alias: "p_poa_document",
                },
                files: [
                  {
                    id: expect.any(String),
                  },
                ],
                value: null,
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_poa_effective_date",
                },
                files: null,
                value: {
                  content: {
                    value: "2020-01-01",
                  },
                },
              },
              {
                field: {
                  type: "DATE",
                  alias: "p_poa_expiration_date",
                },
                files: null,
                value: {
                  content: {
                    value: "2031-01-01",
                  },
                },
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  alias: "p_poa_revocation_conditions",
                },
                files: null,
                value: {
                  content: {
                    value: "None",
                  },
                },
              },
              {
                field: {
                  type: "SELECT",
                  alias: "p_poa_registered",
                },
                files: null,
                value: {
                  content: {
                    value: "Y",
                  },
                },
              },
            ],
          },
        });

        await mocks.knex
          .from("petition_field_reply")
          .whereIn(
            "id",
            deletedReplies.map((r) => r.id),
          )
          .update({ deleted_at: null, deleted_by: null });
      });

      it("creates profile relationships based on the relationships between fields", async () => {
        await mocks.knex.from("petition_field_group_relationship").insert([
          {
            petition_id: petition.id,
            left_side_petition_field_id: individualField.id,
            right_side_petition_field_id: legalEntityField.id,
            direction: "LEFT_RIGHT",
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_director__managed_by",
            )!.id,
          },
          {
            petition_id: petition.id,
            left_side_petition_field_id: legalEntityField.id,
            right_side_petition_field_id: individualField.id,
            direction: "RIGHT_LEFT",
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_legal_representative__legally_represented",
            )!.id,
          },
        ]);

        const [individualProfile] = await mocks.createRandomProfiles(
          organization.id,
          individual.id,
          1,
        );

        await mocks.knex
          .from("petition_field_reply")
          .where("id", individualReply.id)
          .update("associated_profile_id", individualProfile.id);

        const [legalEntityProfile] = await mocks.createRandomProfiles(
          organization.id,
          legalEntity.id,
          1,
        );

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
            profileId: toGlobalId("Profile", legalEntityProfile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          associatedProfile: {
            id: expect.any(String),
            events: {
              totalCount: 27,
              items: [
                {
                  type: "PROFILE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PROFILE_RELATIONSHIP_CREATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileRelationshipId: expect.any(String),
                    relationshipAlias: "p_legal_representative__legally_represented",
                  },
                },
                {
                  type: "PROFILE_RELATIONSHIP_CREATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileRelationshipId: expect.any(String),
                    relationshipAlias: "p_director__managed_by",
                  },
                },
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    petitionId: toGlobalId("Petition", petition.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                ...[
                  "p_poa_document",
                  "p_risk_assessment",
                  "p_financial_statements",
                  "p_ubo_statement",
                  "p_ownership_structure",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_FILE_ADDED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileFieldFileId: expect.any(String),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      legalEntityProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                ...[
                  "p_poa_registered",
                  "p_poa_revocation_conditions",
                  "p_poa_expiration_date",
                  "p_poa_effective_date",
                  "p_poa_scope",
                  "p_poa_types",
                  "p_risk",
                  "p_main_business_activity",
                  "p_date_of_incorporation",
                  "p_country_of_incorporation",
                  "p_zip",
                  "p_city",
                  "p_registered_address",
                  "p_tax_id",
                  "p_registration_number",
                  "p_entity_type",
                  "p_trade_name",
                  "p_entity_name",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      legalEntityProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
              ],
            },
            relationships: expect.toIncludeSameMembers([
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", individualProfile.id),
                },
                rightSideProfile: {
                  id: data.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                },
                relationshipType: {
                  alias: "p_director__managed_by",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", individualProfile.id),
                },
                rightSideProfile: {
                  id: data.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                },
                relationshipType: {
                  alias: "p_legal_representative__legally_represented",
                },
              },
            ]),
          },
        });
      });

      it("does not insert a profile relationship if profile is already associated", async () => {
        await mocks.knex.from("petition_field_group_relationship").insert([
          {
            petition_id: petition.id,
            left_side_petition_field_id: individualField.id,
            right_side_petition_field_id: legalEntityField.id,
            direction: "LEFT_RIGHT",
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_director__managed_by",
            )!.id,
          },
        ]);

        const [individualProfile] = await mocks.createRandomProfiles(
          organization.id,
          individual.id,
          1,
        );

        const [legalEntityProfile] = await mocks.createRandomProfiles(
          organization.id,
          legalEntity.id,
          1,
        );

        await mocks.knex.from("profile_relationship").insert({
          created_by_user_id: user.id,
          left_side_profile_id: individualProfile.id,
          right_side_profile_id: legalEntityProfile.id,
          org_id: organization.id,
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_director__managed_by",
          )!.id,
        });

        await mocks.knex
          .from("petition_field_reply")
          .where("id", individualReply.id)
          .update("associated_profile_id", individualProfile.id);

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
            profileId: toGlobalId("Profile", legalEntityProfile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          associatedProfile: {
            id: toGlobalId("Profile", legalEntityProfile.id),
            events: {
              totalCount: 25,
              items: [
                {
                  type: "PROFILE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    petitionId: toGlobalId("Petition", petition.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                ...[
                  "p_poa_document",
                  "p_risk_assessment",
                  "p_financial_statements",
                  "p_ubo_statement",
                  "p_ownership_structure",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_FILE_ADDED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileFieldFileId: expect.any(String),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      legalEntityProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
                ...[
                  "p_poa_registered",
                  "p_poa_revocation_conditions",
                  "p_poa_expiration_date",
                  "p_poa_effective_date",
                  "p_poa_scope",
                  "p_poa_types",
                  "p_risk",
                  "p_main_business_activity",
                  "p_date_of_incorporation",
                  "p_country_of_incorporation",
                  "p_zip",
                  "p_city",
                  "p_registered_address",
                  "p_tax_id",
                  "p_registration_number",
                  "p_entity_type",
                  "p_trade_name",
                  "p_entity_name",
                ].map((alias) => ({
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      legalEntityProfileTypeFields[alias].id,
                    ),
                    alias,
                  },
                })),
              ],
            },
            relationships: [
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", individualProfile.id),
                },
                rightSideProfile: {
                  id: data.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                },
                relationshipType: {
                  alias: "p_director__managed_by",
                },
              },
            ],
          },
        });
      });

      it("creates relationships between different replies of the same field", async () => {
        await mocks.knex.from("petition_field_group_relationship").insert([
          {
            petition_id: petition.id,
            left_side_petition_field_id: individualField.id,
            right_side_petition_field_id: individualField.id,
            direction: "LEFT_RIGHT",
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_close_associate",
            )!.id,
          },
          {
            petition_id: petition.id,
            left_side_petition_field_id: individualField.id,
            right_side_petition_field_id: individualField.id,
            direction: "RIGHT_LEFT",
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_family_member",
            )!.id,
          },
        ]);

        const [individualA, individualB, individualC] = await mocks.createRandomProfiles(
          organization.id,
          individual.id,
          3,
        );

        const [individualReply2, individualReply3] = await mocks.createFieldGroupReply(
          individualField.id,
          undefined,
          2,
          () => ({
            user_id: user.id,
          }),
        );

        const { errors: individualAErrors, data: individualAData } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
            profileId: toGlobalId("Profile", individualA.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(individualAErrors).toBeUndefined();
        expect(individualAData?.archiveFieldGroupReplyIntoProfile).toEqual({
          associatedProfile: {
            id: toGlobalId("Profile", individualA.id),
            relationships: [], // first created profile will have no relationships
          },
        });

        const { errors: individualBErrors, data: individualBData } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply2.id),
            profileId: toGlobalId("Profile", individualB.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(individualBErrors).toBeUndefined();
        expect(individualBData?.archiveFieldGroupReplyIntoProfile).toEqual({
          associatedProfile: {
            id: toGlobalId("Profile", individualB.id),
            relationships: expect.toIncludeSameMembers([
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", individualA.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", individualB.id),
                },
                relationshipType: {
                  alias: "p_close_associate",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", individualA.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", individualB.id),
                },
                relationshipType: {
                  alias: "p_family_member",
                },
              },
            ]),
          },
        });

        const { errors: individualCErrors, data: individualCData } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", individualField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", individualReply3.id),
            profileId: toGlobalId("Profile", individualC.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(individualCErrors).toBeUndefined();
        expect(individualCData?.archiveFieldGroupReplyIntoProfile).toEqual({
          associatedProfile: {
            id: toGlobalId("Profile", individualC.id),
            relationships: expect.toIncludeSameMembers([
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", individualA.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", individualC.id),
                },
                relationshipType: {
                  alias: "p_close_associate",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", individualB.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", individualC.id),
                },
                relationshipType: {
                  alias: "p_close_associate",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", individualA.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", individualC.id),
                },
                relationshipType: {
                  alias: "p_family_member",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", individualB.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", individualC.id),
                },
                relationshipType: {
                  alias: "p_family_member",
                },
              },
            ]),
          },
        });

        await mocks.knex
          .from("petition_field_reply")
          .whereIn("id", [individualReply2.id, individualReply3.id])
          .delete();
      });

      it("archives family members profiles and creates relationships", async () => {
        const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
          status: "CLOSED",
        }));

        const [aboutYouField, yourParentsField, yourSiblingsField] =
          await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
            type: "FIELD_GROUP",
            multiple: i > 0,
            profile_type_id: individual.id,
          }));

        const [aboutYouFirstName, aboutYouLastName] = await mocks.createRandomPetitionFields(
          petition.id,
          2,
          (i) => ({
            type: "SHORT_TEXT",
            multiple: false,
            parent_petition_field_id: aboutYouField.id,
            profile_type_field_id: [
              individualProfileTypeFields["p_first_name"].id,
              individualProfileTypeFields["p_last_name"].id,
            ][i],
          }),
        );

        const [yourParentsFirstName, yourParentsLastName] = await mocks.createRandomPetitionFields(
          petition.id,
          2,
          (i) => ({
            type: "SHORT_TEXT",
            multiple: false,
            parent_petition_field_id: yourParentsField.id,
            profile_type_field_id: [
              individualProfileTypeFields["p_first_name"].id,
              individualProfileTypeFields["p_last_name"].id,
            ][i],
          }),
        );

        const [yourSiblingsFirstName, yourSiblingsLastName] =
          await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
            type: "SHORT_TEXT",
            multiple: false,
            parent_petition_field_id: yourSiblingsField.id,
            profile_type_field_id: [
              individualProfileTypeFields["p_first_name"].id,
              individualProfileTypeFields["p_last_name"].id,
            ][i],
          }));

        await mocks.knex.from("petition_field_group_relationship").insert([
          {
            petition_id: petition.id,
            left_side_petition_field_id: aboutYouField.id,
            profile_relationship_type_id: relationshipTypes.find(
              (t) => t.alias === "p_parent__child",
            )!.id,
            right_side_petition_field_id: yourParentsField.id,
            direction: "RIGHT_LEFT",
          },
          {
            petition_id: petition.id,
            left_side_petition_field_id: aboutYouField.id,
            profile_relationship_type_id: relationshipTypes.find(
              (t) => t.alias === "p_family_member",
            )!.id,
            right_side_petition_field_id: yourSiblingsField.id,
            direction: "RIGHT_LEFT",
          },
          {
            petition_id: petition.id,
            left_side_petition_field_id: yourParentsField.id,
            profile_relationship_type_id: relationshipTypes.find((t) => t.alias === "p_spouse")!.id,
            right_side_petition_field_id: yourParentsField.id,
            direction: "RIGHT_LEFT",
          },
          {
            petition_id: petition.id,
            left_side_petition_field_id: yourSiblingsField.id,
            profile_relationship_type_id: relationshipTypes.find(
              (t) => t.alias === "p_parent__child",
            )!.id,
            right_side_petition_field_id: yourParentsField.id,
            direction: "RIGHT_LEFT",
          },
          {
            petition_id: petition.id,
            left_side_petition_field_id: yourSiblingsField.id,
            profile_relationship_type_id: relationshipTypes.find(
              (t) => t.alias === "p_family_member",
            )!.id,
            right_side_petition_field_id: yourSiblingsField.id,
            direction: "RIGHT_LEFT",
          },
        ]);

        // create replies
        const [aboutYouReply, yourMotherReply, yourFatherReply, yourSisterReply, yourSisterReply2] =
          await mocks.createFieldGroupReply(aboutYouField.id, undefined, 5, (i) => ({
            user_id: user.id,
            petition_field_id: [
              aboutYouField.id,
              yourParentsField.id,
              yourParentsField.id,
              yourSiblingsField.id,
              yourSiblingsField.id,
            ][i],
          }));

        await mocks.knex.from("petition_field_reply").insert([
          {
            parent_petition_field_reply_id: aboutYouReply.id,
            petition_field_id: aboutYouFirstName.id,
            content: { value: "Bart" },
            type: "SHORT_TEXT",
            user_id: user.id,
          },
          {
            parent_petition_field_reply_id: aboutYouReply.id,
            petition_field_id: aboutYouLastName.id,
            content: { value: "Simpson" },
            type: "SHORT_TEXT",
            user_id: user.id,
          },
          {
            parent_petition_field_reply_id: yourMotherReply.id,
            petition_field_id: yourParentsFirstName.id,

            content: { value: "Marge" },
            type: "SHORT_TEXT",
            user_id: user.id,
          },
          {
            parent_petition_field_reply_id: yourMotherReply.id,
            petition_field_id: yourParentsLastName.id,
            content: { value: "Bouvier" },
            type: "SHORT_TEXT",
            user_id: user.id,
          },
          {
            parent_petition_field_reply_id: yourFatherReply.id,
            petition_field_id: yourParentsFirstName.id,
            content: { value: "Homer" },
            type: "SHORT_TEXT",
            user_id: user.id,
          },
          {
            parent_petition_field_reply_id: yourFatherReply.id,
            petition_field_id: yourParentsLastName.id,
            content: { value: "Simpson" },
            type: "SHORT_TEXT",
            user_id: user.id,
          },
          {
            parent_petition_field_reply_id: yourSisterReply.id,
            petition_field_id: yourSiblingsFirstName.id,
            content: { value: "Lisa" },
            type: "SHORT_TEXT",
            user_id: user.id,
          },
          {
            parent_petition_field_reply_id: yourSisterReply.id,
            petition_field_id: yourSiblingsLastName.id,
            content: { value: "Simpson" },
            type: "SHORT_TEXT",
            user_id: user.id,
          },
          {
            parent_petition_field_reply_id: yourSisterReply2.id,
            petition_field_id: yourSiblingsFirstName.id,
            content: { value: "Maggie" },
            type: "SHORT_TEXT",
            user_id: user.id,
          },
          {
            parent_petition_field_reply_id: yourSisterReply2.id,
            petition_field_id: yourSiblingsLastName.id,
            content: { value: "Simpson" },
            type: "SHORT_TEXT",
            user_id: user.id,
          },
        ]);

        const [
          bartSimpsonProfile,
          margeBouvierProfile,
          homerSimpsonProfile,
          lisaSimpsonProfile,
          maggieSimpsonProfile,
        ] = await mocks.createRandomProfiles(organization.id, individual.id, 5, () => ({
          status: "OPEN",
        }));

        const { errors: bartErrors, data: bartData } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", aboutYouField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", aboutYouReply.id),
            profileId: toGlobalId("Profile", bartSimpsonProfile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );
        expect(bartErrors).toBeUndefined();

        expect(bartData?.archiveFieldGroupReplyIntoProfile).toEqual({
          associatedProfile: {
            id: toGlobalId("Profile", bartSimpsonProfile.id),
            relationships: [],
          },
        });

        const { errors: margeErrors, data: margeData } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", yourParentsField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", yourMotherReply.id),
            profileId: toGlobalId("Profile", margeBouvierProfile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(margeErrors).toBeUndefined();

        expect(margeData?.archiveFieldGroupReplyIntoProfile).toEqual({
          associatedProfile: {
            id: toGlobalId("Profile", margeBouvierProfile.id),
            relationships: [
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", margeBouvierProfile.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", bartSimpsonProfile.id),
                },
                relationshipType: {
                  alias: "p_parent__child",
                },
              },
            ],
          },
        });

        const { errors: homerErrors, data: homerData } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", yourParentsField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", yourFatherReply.id),
            profileId: toGlobalId("Profile", homerSimpsonProfile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(homerErrors).toBeUndefined();

        expect(homerData?.archiveFieldGroupReplyIntoProfile).toEqual({
          associatedProfile: {
            id: toGlobalId("Profile", homerSimpsonProfile.id),
            relationships: expect.toIncludeSameMembers([
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", homerSimpsonProfile.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", bartSimpsonProfile.id),
                },
                relationshipType: {
                  alias: "p_parent__child",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", margeBouvierProfile.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", homerSimpsonProfile.id),
                },
                relationshipType: {
                  alias: "p_spouse",
                },
              },
            ]),
          },
        });

        const { errors: lisaErrors, data: lisaData } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", yourSiblingsField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", yourSisterReply.id),
            profileId: toGlobalId("Profile", lisaSimpsonProfile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(lisaErrors).toBeUndefined();

        expect(lisaData?.archiveFieldGroupReplyIntoProfile).toEqual({
          associatedProfile: {
            id: toGlobalId("Profile", lisaSimpsonProfile.id),
            relationships: expect.toIncludeSameMembers([
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", bartSimpsonProfile.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", lisaSimpsonProfile.id),
                },
                relationshipType: {
                  alias: "p_family_member",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", margeBouvierProfile.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", lisaSimpsonProfile.id),
                },
                relationshipType: {
                  alias: "p_parent__child",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", homerSimpsonProfile.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", lisaSimpsonProfile.id),
                },
                relationshipType: {
                  alias: "p_parent__child",
                },
              },
            ]),
          },
        });

        const { errors: maggieErrors, data: maggieData } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", yourSiblingsField.id),
            parentReplyId: toGlobalId("PetitionFieldReply", yourSisterReply2.id),
            profileId: toGlobalId("Profile", maggieSimpsonProfile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );

        expect(maggieErrors).toBeUndefined();

        expect(maggieData?.archiveFieldGroupReplyIntoProfile).toEqual({
          associatedProfile: {
            id: toGlobalId("Profile", maggieSimpsonProfile.id),
            relationships: expect.toIncludeSameMembers([
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", bartSimpsonProfile.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", maggieSimpsonProfile.id),
                },
                relationshipType: {
                  alias: "p_family_member",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", lisaSimpsonProfile.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", maggieSimpsonProfile.id),
                },
                relationshipType: {
                  alias: "p_family_member",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", homerSimpsonProfile.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", maggieSimpsonProfile.id),
                },
                relationshipType: {
                  alias: "p_parent__child",
                },
              },
              {
                leftSideProfile: {
                  id: toGlobalId("Profile", margeBouvierProfile.id),
                },
                rightSideProfile: {
                  id: toGlobalId("Profile", maggieSimpsonProfile.id),
                },
                relationshipType: {
                  alias: "p_parent__child",
                },
              },
            ]),
          },
        });
      });
    });

    describe("archiveFieldGroupReplyIntoProfile / custom profile types", () => {
      let profileType: ProfileType;
      let profileTypeFields: ProfileTypeField[];

      let petition: Petition;
      let fieldGroup: PetitionField;
      let checkboxChild: PetitionField;

      beforeEach(async () => {
        [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
        profileTypeFields = await mocks.createRandomProfileTypeFields(
          organization.id,
          profileType.id,
          ProfileTypeFieldTypeValues.length,
          (i) => ({ type: ProfileTypeFieldTypeValues[i], alias: ProfileTypeFieldTypeValues[i] }),
        );

        [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
          status: "CLOSED",
        }));
        [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "FIELD_GROUP",
          profile_type_id: profileType.id,
        }));
        [checkboxChild] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "CHECKBOX",
          parent_petition_field_id: fieldGroup.id,
          profile_type_field_id: profileTypeFields.find((f) => f.type === "CHECKBOX")!.id,
        }));
      });

      it("archives a CHECKBOX reply into a profile", async () => {
        const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
          user_id: user.id,
        }));
        await mocks.createCheckboxReply(checkboxChild.id, { userId: user.id }, ["A", "C"], () => ({
          parent_petition_field_reply_id: groupReply.id,
        }));

        const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  properties {
                    field {
                      id
                      type
                    }
                    value {
                      content
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
            parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );
        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          associatedProfile: {
            id: toGlobalId("Profile", profile.id),
            properties: [
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
                  type: "TEXT",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
                  type: "SHORT_TEXT",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
                  type: "FILE",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
                  type: "DATE",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
                  type: "PHONE",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[5].id),
                  type: "NUMBER",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[6].id),
                  type: "SELECT",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
                  type: "BACKGROUND_CHECK",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[8].id),
                  type: "CHECKBOX",
                },
                value: {
                  content: { value: ["A", "C"] },
                },
              },
            ],
          },
        });
      });

      it("throws conflict error if current CHECKBOX value in profile differs from parallel reply", async () => {
        const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
          user_id: user.id,
        }));
        await mocks.createCheckboxReply(checkboxChild.id, { userId: user.id }, ["A", "C"], () => ({
          parent_petition_field_reply_id: groupReply.id,
        }));

        const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
        await mocks.knex.from("profile_field_value").insert({
          profile_id: profile.id,
          profile_type_field_id: profileTypeFields.find((f) => f.type === "CHECKBOX")!.id,
          type: "CHECKBOX",
          content: { value: ["A"] },
          created_by_user_id: user.id,
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  properties {
                    field {
                      id
                      type
                    }
                    value {
                      content
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
            parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );
        expect(errors).toContainGraphQLError("CONFLICT_RESOLUTION_REQUIRED_ERROR", {
          conflictResolutions: [
            toGlobalId(
              "ProfileTypeField",
              profileTypeFields.find((f) => f.type === "CHECKBOX")!.id,
            ),
          ],
          expirations: [],
        });
        expect(data).toBeNull();
      });

      it("does not conflict if CHECKBOX values are the same but in different order", async () => {
        const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
          user_id: user.id,
        }));
        await mocks.createCheckboxReply(checkboxChild.id, { userId: user.id }, ["A", "C"], () => ({
          parent_petition_field_reply_id: groupReply.id,
        }));

        const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
        await mocks.knex.from("profile_field_value").insert({
          profile_id: profile.id,
          profile_type_field_id: profileTypeFields.find((f) => f.type === "CHECKBOX")!.id,
          type: "CHECKBOX",
          content: { value: ["C", "A"] },
          created_by_user_id: user.id,
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                associatedProfile {
                  id
                  properties {
                    field {
                      id
                      type
                    }
                    value {
                      content
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
            parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [],
            expirations: [],
          },
        );
        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          associatedProfile: {
            id: toGlobalId("Profile", profile.id),
            properties: [
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
                  type: "TEXT",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
                  type: "SHORT_TEXT",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
                  type: "FILE",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
                  type: "DATE",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
                  type: "PHONE",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[5].id),
                  type: "NUMBER",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[6].id),
                  type: "SELECT",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
                  type: "BACKGROUND_CHECK",
                },
                value: null,
              },
              {
                field: {
                  id: toGlobalId("ProfileTypeField", profileTypeFields[8].id),
                  type: "CHECKBOX",
                },
                value: {
                  content: { value: ["C", "A"] }, // keep the value in the profile
                },
              },
            ],
          },
        });
      });
    });

    describe("updatePetitionFieldGroupRelationships", () => {
      let petition: Petition;
      let individualFields: PetitionField[];
      let legalEntityFields: PetitionField[];
      let contractFields: PetitionField[];

      beforeAll(async () => {
        [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);

        individualFields = await mocks.createRandomPetitionFields(petition.id, 2, () => ({
          type: "FIELD_GROUP",
          profile_type_id: individual.id,
        }));

        legalEntityFields = await mocks.createRandomPetitionFields(petition.id, 2, () => ({
          type: "FIELD_GROUP",
          profile_type_id: legalEntity.id,
        }));

        contractFields = await mocks.createRandomPetitionFields(petition.id, 2, () => ({
          type: "FIELD_GROUP",
          profile_type_id: contract.id,
        }));
      });

      afterEach(async () => {
        await mocks.knex
          .from("petition_field_group_relationship")
          .where("petition_id", petition.id)
          .delete();
      });

      it("creates a relationship between two field groups", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                id
                fieldRelationships {
                  leftSidePetitionField {
                    id
                    profileType {
                      id
                    }
                  }
                  rightSidePetitionField {
                    id
                    profileType {
                      id
                    }
                  }
                  relationshipTypeWithDirection {
                    direction
                    profileRelationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[0].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_associated_company")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldGroupRelationships).toEqual({
          id: toGlobalId("Petition", petition.id),
          fieldRelationships: [
            {
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
                profileType: {
                  id: toGlobalId("ProfileType", individual.id),
                },
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
                profileType: {
                  id: toGlobalId("ProfileType", individual.id),
                },
              },
              relationshipTypeWithDirection: {
                direction: "LEFT_RIGHT",
                profileRelationshipType: {
                  alias: "p_parent__child",
                },
              },
            },
            {
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", legalEntityFields[0].id),
                profileType: {
                  id: toGlobalId("ProfileType", legalEntity.id),
                },
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", legalEntityFields[0].id),
                profileType: {
                  id: toGlobalId("ProfileType", legalEntity.id),
                },
              },
              relationshipTypeWithDirection: {
                direction: "LEFT_RIGHT",
                profileRelationshipType: {
                  alias: "p_associated_company",
                },
              },
            },
          ],
        });
      });

      it("adds a 3rd relationship on same fields after previously adding other 2", async () => {
        const { errors: mutation1Errors, data: mutation1Data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                fieldRelationships {
                  id
                  leftSidePetitionField {
                    id
                  }
                  rightSidePetitionField {
                    id
                  }
                  relationshipTypeWithDirection {
                    direction
                    profileRelationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find(
                    (r) => r.alias === "p_legal_representative__legally_represented",
                  )!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(mutation1Errors).toBeUndefined();
        expect(mutation1Data?.updatePetitionFieldGroupRelationships).toEqual({
          fieldRelationships: [
            {
              id: expect.any(String),
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
              },
              relationshipTypeWithDirection: {
                direction: "LEFT_RIGHT",
                profileRelationshipType: {
                  alias: "p_legal_representative__legally_represented",
                },
              },
            },
            {
              id: expect.any(String),
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
              },
              relationshipTypeWithDirection: {
                direction: "LEFT_RIGHT",
                profileRelationshipType: {
                  alias: "p_family_member",
                },
              },
            },
          ],
        });

        const { errors: mutation2Errors, data: mutation2Data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                fieldRelationships {
                  id
                  leftSidePetitionField {
                    id
                  }
                  rightSidePetitionField {
                    id
                  }
                  relationshipTypeWithDirection {
                    direction
                    profileRelationshipType {
                      alias
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[0].id,
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find(
                    (r) => r.alias === "p_legal_representative__legally_represented",
                  )!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[1].id,
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(mutation2Errors).toBeUndefined();
        expect(mutation2Data?.updatePetitionFieldGroupRelationships).toEqual({
          fieldRelationships: [
            {
              id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[0].id,
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
              },
              relationshipTypeWithDirection: {
                direction: "LEFT_RIGHT",
                profileRelationshipType: {
                  alias: "p_legal_representative__legally_represented",
                },
              },
            },
            {
              id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[1].id,
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
              },
              relationshipTypeWithDirection: {
                direction: "LEFT_RIGHT",
                profileRelationshipType: {
                  alias: "p_family_member",
                },
              },
            },
            {
              id: expect.any(String),
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
              },
              relationshipTypeWithDirection: {
                direction: "LEFT_RIGHT",
                profileRelationshipType: {
                  alias: "p_parent__child",
                },
              },
            },
          ],
        });
      });

      it("sends error if trying to create a reciprocal relationship twice with different directions", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_associated_company")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_associated_company")!.id,
                ),
                direction: "RIGHT_LEFT",
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("sends error if passing same relationship twice", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_main_contract__annex")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_main_contract__annex")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("sends error if passing same relationships twice with inverted sides", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_main_contract__annex")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_main_contract__annex")!.id,
                ),
                direction: "RIGHT_LEFT",
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("sends error if one of the fields is not linked to a profile type", async () => {
        await mocks.knex
          .from("petition_field")
          .where("id", individualFields[0].id)
          .update("profile_type_id", null);

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();

        await mocks.knex
          .from("petition_field")
          .where("id", individualFields[0].id)
          .update("profile_type_id", individual.id);
      });

      it("sends error if trying to pass an invalid relationship", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("INVALID_PROFILE_RELATIONSHIP_TYPE_ERROR");
        expect(data).toBeNull();
      });

      it("removes every relationship when passing empty array", async () => {
        const { errors: mutation1Errors, data: mutation1Data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                fieldRelationships {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find(
                    (r) => r.alias === "p_legal_representative__legally_represented",
                  )!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(mutation1Errors).toBeUndefined();
        expect(
          mutation1Data?.updatePetitionFieldGroupRelationships.fieldRelationships,
        ).toHaveLength(3);

        const { errors: mutation2Errors, data: mutation2Data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                fieldRelationships {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [],
          },
        );

        expect(mutation2Errors).toBeUndefined();
        expect(mutation2Data?.updatePetitionFieldGroupRelationships).toEqual({
          fieldRelationships: [],
        });
      });

      it("resets relationships when passing new array", async () => {
        const { errors: mutation1Errors, data: mutation1Data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                fieldRelationships {
                  leftSidePetitionField {
                    id
                  }
                  rightSidePetitionField {
                    id
                  }
                  relationshipTypeWithDirection {
                    profileRelationshipType {
                      alias
                    }
                    direction
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find(
                    (r) => r.alias === "p_legal_representative__legally_represented",
                  )!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(mutation1Errors).toBeUndefined();
        expect(mutation1Data?.updatePetitionFieldGroupRelationships).toEqual({
          fieldRelationships: [
            {
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
              },
              relationshipTypeWithDirection: {
                profileRelationshipType: {
                  alias: "p_legal_representative__legally_represented",
                },
                direction: "LEFT_RIGHT",
              },
            },
            {
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
              },
              relationshipTypeWithDirection: {
                profileRelationshipType: {
                  alias: "p_family_member",
                },
                direction: "LEFT_RIGHT",
              },
            },
            {
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
              },
              relationshipTypeWithDirection: {
                profileRelationshipType: {
                  alias: "p_parent__child",
                },
                direction: "LEFT_RIGHT",
              },
            },
          ],
        });

        const { errors: mutation2Errors, data: mutation2Data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                fieldRelationships {
                  leftSidePetitionField {
                    id
                  }
                  rightSidePetitionField {
                    id
                  }
                  relationshipTypeWithDirection {
                    profileRelationshipType {
                      alias
                    }
                    direction
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[1].id),
                direction: "LEFT_RIGHT",
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find(
                    (r) => r.alias === "p_legal_representative__legally_represented",
                  )!.id,
                ),
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
                direction: "RIGHT_LEFT",
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_contract__counterparty")!.id,
                ),
              },
            ],
          },
        );

        expect(mutation2Errors).toBeUndefined();
        expect(mutation2Data?.updatePetitionFieldGroupRelationships).toEqual({
          fieldRelationships: [
            {
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", legalEntityFields[1].id),
              },
              relationshipTypeWithDirection: {
                profileRelationshipType: {
                  alias: "p_legal_representative__legally_represented",
                },
                direction: "LEFT_RIGHT",
              },
            },
            {
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", contractFields[1].id),
              },
              relationshipTypeWithDirection: {
                profileRelationshipType: {
                  alias: "p_contract__counterparty",
                },
                direction: "RIGHT_LEFT",
              },
            },
          ],
        });
      });

      it("deletes every relationship and updates the one with provided id", async () => {
        const { errors: mutation1Errors, data: mutation1Data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                fieldRelationships {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find(
                    (r) => r.alias === "p_legal_representative__legally_represented",
                  )!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(mutation1Errors).toBeUndefined();
        expect(mutation1Data?.updatePetitionFieldGroupRelationships).toEqual({
          fieldRelationships: [
            { id: expect.any(String) },
            { id: expect.any(String) },
            { id: expect.any(String) },
          ],
        });

        const { errors: mutation2Errors, data: mutation2Data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                fieldRelationships {
                  leftSidePetitionField {
                    id
                  }
                  rightSidePetitionField {
                    id
                  }
                  relationshipTypeWithDirection {
                    profileRelationshipType {
                      alias
                    }
                    direction
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[1].id,
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
                ),
                direction: "RIGHT_LEFT",
              },
              {
                id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[2].id,
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_close_associate")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(mutation2Errors).toBeUndefined();
        expect(mutation2Data?.updatePetitionFieldGroupRelationships).toEqual({
          fieldRelationships: [
            {
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
              },
              relationshipTypeWithDirection: {
                profileRelationshipType: {
                  alias: "p_family_member",
                },
                direction: "RIGHT_LEFT",
              },
            },
            {
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", individualFields[1].id),
              },
              relationshipTypeWithDirection: {
                profileRelationshipType: {
                  alias: "p_close_associate",
                },
                direction: "LEFT_RIGHT",
              },
            },
          ],
        });

        const dbData = await mocks.knex
          .from("petition_field_group_relationship")
          .where("petition_id", petition.id)
          .select("*");

        expect(
          dbData.map(
            pick([
              "id",
              "left_side_petition_field_id",
              "right_side_petition_field_id",
              "profile_relationship_type_id",
              "deleted_at",
            ]),
          ),
        ).toIncludeSameMembers([
          {
            id: fromGlobalId(
              mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[0].id,
            ).id,
            left_side_petition_field_id: individualFields[0].id,
            right_side_petition_field_id: individualFields[1].id,
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_legal_representative__legally_represented",
            )!.id,
            deleted_at: expect.any(Date),
          },
          {
            id: fromGlobalId(
              mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[1].id,
            ).id,
            left_side_petition_field_id: individualFields[0].id,
            right_side_petition_field_id: individualFields[1].id,
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_family_member",
            )!.id,
            deleted_at: null,
          },
          {
            id: fromGlobalId(
              mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[2].id,
            ).id,
            left_side_petition_field_id: individualFields[0].id,
            right_side_petition_field_id: individualFields[1].id,
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_close_associate",
            )!.id,
            deleted_at: null,
          },
        ]);
      });

      it("deletes every relationship and creates a new one", async () => {
        const { errors: mutation1Errors, data: mutation1Data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                fieldRelationships {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find(
                    (r) => r.alias === "p_legal_representative__legally_represented",
                  )!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(mutation1Errors).toBeUndefined();
        expect(mutation1Data?.updatePetitionFieldGroupRelationships).toEqual({
          fieldRelationships: [
            { id: expect.any(String) },
            { id: expect.any(String) },
            { id: expect.any(String) },
          ],
        });

        const { errors: mutation2Errors, data: mutation2Data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                fieldRelationships {
                  leftSidePetitionField {
                    id
                  }
                  rightSidePetitionField {
                    id
                  }
                  relationshipTypeWithDirection {
                    profileRelationshipType {
                      alias
                    }
                    direction
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_main_contract__annex")!.id,
                ),
                direction: "RIGHT_LEFT",
              },
            ],
          },
        );

        expect(mutation2Errors).toBeUndefined();
        expect(mutation2Data?.updatePetitionFieldGroupRelationships).toEqual({
          fieldRelationships: [
            {
              leftSidePetitionField: {
                id: toGlobalId("PetitionField", contractFields[0].id),
              },
              rightSidePetitionField: {
                id: toGlobalId("PetitionField", contractFields[1].id),
              },
              relationshipTypeWithDirection: {
                profileRelationshipType: {
                  alias: "p_main_contract__annex",
                },
                direction: "RIGHT_LEFT",
              },
            },
          ],
        });

        const dbData = await mocks.knex
          .from("petition_field_group_relationship")
          .where("petition_id", petition.id)
          .select("*");

        expect(
          dbData.map(
            pick([
              "id",
              "left_side_petition_field_id",
              "right_side_petition_field_id",
              "profile_relationship_type_id",
              "deleted_at",
            ]),
          ),
        ).toIncludeSameMembers([
          {
            id: fromGlobalId(
              mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[0].id,
            ).id,
            left_side_petition_field_id: individualFields[0].id,
            right_side_petition_field_id: individualFields[1].id,
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_legal_representative__legally_represented",
            )!.id,
            deleted_at: expect.any(Date),
          },
          {
            id: fromGlobalId(
              mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[1].id,
            ).id,
            left_side_petition_field_id: individualFields[0].id,
            right_side_petition_field_id: individualFields[1].id,
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_family_member",
            )!.id,
            deleted_at: expect.any(Date),
          },
          {
            id: fromGlobalId(
              mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[2].id,
            ).id,
            left_side_petition_field_id: individualFields[0].id,
            right_side_petition_field_id: individualFields[1].id,
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_parent__child",
            )!.id,
            deleted_at: expect.any(Date),
          },
          {
            id: expect.any(Number),
            left_side_petition_field_id: contractFields[0].id,
            right_side_petition_field_id: contractFields[1].id,
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_main_contract__annex",
            )!.id,
            deleted_at: null,
          },
        ]);
      });

      it("sends error if trying to create non-reciprocal relationship on the same field", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
            ) {
              updatePetitionFieldGroupRelationships(
                petitionId: $petitionId
                relationships: $relationships
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            relationships: [
              {
                leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
                profileRelationshipTypeId: toGlobalId(
                  "ProfileRelationshipType",
                  relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
                ),
                direction: "LEFT_RIGHT",
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });
    });
  });
});
