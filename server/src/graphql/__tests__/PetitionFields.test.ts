import { faker } from "@faker-js/faker";
import gql from "graphql-tag";
import { Knex } from "knex";
import { pick } from "remeda";
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
  UserGroup,
} from "../../db/__types";
import { defaultFieldProperties } from "../../db/helpers/fieldOptions";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toGlobalId } from "../../util/globalId";
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

    await mocks.knex.from("standard_list_definition").insert([
      {
        title: { en: "GAFI Blacklist" },
        list_name: "GAFI_BLACKLIST",
        list_version: "2024-06-01",
        list_type: "COUNTRIES",
        values: JSON.stringify([{ key: "AR" }, { key: "BR" }, { key: "UY" }]),
        source_name: "GAFI",
        created_by: `User:1`,
      },
    ]);
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
      const [name, date, country, backgroundCheck] = await mocks.createRandomPetitionFields(
        petition.id,
        4,
        (i) => ({
          type: ["SHORT_TEXT", "DATE", "SELECT", "BACKGROUND_CHECK"][i] as PetitionFieldType,
          parent_petition_field_id: fieldGroup.id,
          options: i === 2 ? { standardList: "COUNTRIES" } : {},
        }),
      );

      await mocks.knex
        .from("petition_field")
        .where("id", backgroundCheck.id)
        .update({
          options: JSON.stringify({
            autoSearchConfig: { name: [name.id], date: date.id, country: country.id, type: null },
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
            type: "SELECT",
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
                country: data.clonePetitionField.children[2].id,
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

    it("adds an IS_IN_LIST visibility condition with a standard list definition", async () => {
      const [selectField, textField] = await mocks.createRandomPetitionFields(
        userPetition.id,
        2,
        (i) => ({
          type: ["SELECT", "TEXT"][i] as PetitionFieldType,
          options: i === 0 ? { standardList: "COUNTRIES", values: [] } : {},
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              visibility
              math
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", textField.id),
          data: {
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: toGlobalId("PetitionField", selectField.id),
                  modifier: "ANY",
                  operator: "IS_IN_LIST",
                  value: "GAFI_BLACKLIST",
                },
              ],
            },
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: toGlobalId("PetitionField", selectField.id),
                    modifier: "ANY",
                    operator: "IS_IN_LIST",
                    value: "GAFI_BLACKLIST",
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "NUMBER",
                      value: 100,
                    },
                    variable: "score",
                  },
                ],
              },
            ],
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.updatePetitionField).toEqual({
        id: toGlobalId("PetitionField", textField.id),
        visibility: {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              fieldId: toGlobalId("PetitionField", selectField.id),
              modifier: "ANY",
              operator: "IS_IN_LIST",
              value: "GAFI_BLACKLIST",
            },
          ],
        },
        math: [
          {
            operator: "AND",
            conditions: [
              {
                fieldId: toGlobalId("PetitionField", selectField.id),
                modifier: "ANY",
                operator: "IS_IN_LIST",
                value: "GAFI_BLACKLIST",
              },
            ],
            operations: [
              {
                operator: "ADDITION",
                operand: {
                  type: "NUMBER",
                  value: 100,
                },
                variable: "score",
              },
            ],
          },
        ],
      });

      const [dbPetition] = await mocks.knex
        .from("petition")
        .where("id", userPetition.id)
        .select(["standard_list_definition_override"]);

      expect(dbPetition).toEqual({
        standard_list_definition_override: [
          { list_name: "GAFI_BLACKLIST", list_version: "2024-06-01" },
        ],
      });
    });

    it("sends error if list name is unknown on an IS_IN_LIST condition", async () => {
      const [selectField, textField] = await mocks.createRandomPetitionFields(
        userPetition.id,
        2,
        (i) => ({
          type: ["SELECT", "TEXT"][i] as PetitionFieldType,
          options: i === 0 ? { standardList: "COUNTRIES", values: [] } : {},
        }),
      );

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
          fieldId: toGlobalId("PetitionField", textField.id),
          data: {
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: toGlobalId("PetitionField", selectField.id),
                  modifier: "ANY",
                  operator: "IS_IN_LIST",
                  value: "UNKNOWN_STANDARD_LIST",
                },
              ],
            },
          },
        },
      );
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: "Assertion Error: Can't find list UNKNOWN_STANDARD_LIST referenced in condition 0",
      });
      expect(data).toBeNull();
    });

    it("sends error if standard list definition type does not match field standardList", async () => {
      const [selectField, textField] = await mocks.createRandomPetitionFields(
        userPetition.id,
        2,
        (i) => ({
          type: ["SELECT", "TEXT"][i] as PetitionFieldType,
          options: i === 0 ? { standardList: "CURRENCIES", values: [] } : {},
        }),
      );

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
          fieldId: toGlobalId("PetitionField", textField.id),
          data: {
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: toGlobalId("PetitionField", selectField.id),
                  modifier: "ANY",
                  operator: "IS_IN_LIST",
                  value: "GAFI_BLACKLIST",
                },
              ],
            },
          },
        },
      );
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: "Assertion Error: Can't reference standard list of type COUNTRIES in condition 0",
      });
      expect(data).toBeNull();
    });

    it("sends error if trying to update format on a profile-linked field with format", async () => {
      const [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      const [emailProfileTypeField] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        1,
        () => ({
          type: "SHORT_TEXT",
          options: { format: "EMAIL" },
        }),
      );

      const [field] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "SHORT_TEXT",
        parent_petition_field_id: fields[5].id,
        profile_type_field_id: emailProfileTypeField.id,
        options: { maxLength: 10000 },
      }));

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
          fieldId: toGlobalId("PetitionField", field.id),
          data: {
            options: { format: "IBAN" },
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("updates format if trying to update on a profile-linked field with no format", async () => {
      const [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      const [emailProfileTypeField] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        1,
        () => ({
          type: "SHORT_TEXT",
          options: { format: null },
        }),
      );

      const [field] = await mocks.createRandomPetitionFields(userPetition.id, 1, () => ({
        type: "SHORT_TEXT",
        parent_petition_field_id: fields[5].id,
        profile_type_field_id: emailProfileTypeField.id,
        options: { maxLength: 10000, replyOnlyFromProfile: false },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              id
              options
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", userPetition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          data: {
            options: { format: "IBAN" },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionField).toEqual({
        id: toGlobalId("PetitionField", field.id),
        options: {
          format: "IBAN",
          maxLength: 10000,
          replyOnlyFromProfile: false,
        },
      });
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
});
