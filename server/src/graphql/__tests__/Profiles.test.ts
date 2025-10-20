import { faker } from "@faker-js/faker";
import { gql } from "graphql-request";
import { Knex } from "knex";
import { outdent } from "outdent";
import { indexBy, isNonNullish, omit, pick, range, times } from "remeda";
import {
  FileUpload,
  Organization,
  Petition,
  PetitionFieldReply,
  PetitionFieldType,
  Profile,
  ProfileFieldFile,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldType,
  ProfileTypeFieldTypeValues,
  User,
  UserGroup,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { ProfileRepository } from "../../db/repositories/ProfileRepository";
import { PROFILES_SETUP_SERVICE, ProfilesSetupService } from "../../services/ProfilesSetupService";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("GraphQL/Profiles", () => {
  let testClient: TestClient;

  let mocks: Mocks;
  let organization: Organization;
  let sessionUser: User;
  let profileTypes: ProfileType[] = [];

  let profileType0Fields: ProfileTypeField[] = [];
  let profileType1Fields: ProfileTypeField[] = [];
  let profileType2Fields: ProfileTypeField[] = [];
  let profileType3Fields: ProfileTypeField[] = [];
  let profileType4Fields: ProfileTypeField[] = [];

  let normalUserApiKey = "";

  function json(value: any) {
    return mocks.knex.raw("?::jsonb", JSON.stringify(value));
  }

  async function createProfile(
    profileTypeId: string,
    fields: { content: any; expiryDate?: string | null; profileTypeFieldId: string }[] = [],
  ) {
    const { data } = await testClient.execute(
      gql`
        mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
          createProfile(profileTypeId: $profileTypeId, fields: $fields) {
            id
            name
            status
            properties {
              field {
                id
                isExpirable
                isUsedInProfileName
              }
              value {
                content
                expiryDate
              }
            }
          }
        }
      `,
      { profileTypeId, fields },
    );

    return data.createProfile;
  }

  async function updateProfileValue(
    profileId: string,
    fields: { content?: any | null; expiryDate?: string | null; profileTypeFieldId: string }[] = [],
  ) {
    const { data, errors } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            name
            status
            properties {
              field {
                id
                isExpirable
                isUsedInProfileName
              }
              value {
                content
                expiryDate
              }
            }
          }
        }
      `,
      { profileId, fields },
    );
    if (isNonNullish(errors)) {
      throw errors;
    }
    return data.updateProfileFieldValue;
  }

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization());
    await knex
      .from("organization")
      .update({ default_timezone: "Europe/Madrid" })
      .where("id", organization.id);

    await mocks.createFeatureFlags([
      { name: "PROFILES", default_value: true },
      { name: "CREATE_PROFILE_TYPE", default_value: true },
    ]);

    const [normalUser] = await mocks.createRandomUsers(organization.id);
    const { apiKey } = await mocks.createUserAuthToken("normal-token", normalUser.id);
    normalUserApiKey = apiKey;
  });

  beforeEach(async () => {
    await mocks.knex.from("profile_field_file").delete();
    await mocks.knex.from("profile_field_value").delete();
    await mocks.knex.from("profile_type_field_permission").delete();
    await mocks.knex
      .from("petition_field")
      .update({ profile_type_id: null, profile_type_field_id: null });
    await mocks.knex.from("profile_type_field").delete();
    await mocks.knex.from("profile_event").delete();
    await mocks.knex.from("profile_subscription").delete();
    await mocks.knex.from("petition_profile").delete();
    await mocks.knex.from("petition_field_reply").update("associated_profile_id", null);
    await mocks.knex.from("profile").delete();
    await mocks.knex.from("petition_field").update("profile_type_id", null);
    await mocks.knex.from("user_profile_type_pinned").delete();
    await mocks.knex.from("profile_type_process_template").delete();
    await mocks.knex.from("profile_type_process").delete();
    await mocks.knex.from("profile_list_view").delete();
    await mocks.knex.from("event_subscription").delete();
    await mocks.knex.from("profile_type").update({
      deleted_at: new Date(),
      archived_at: new Date(),
      archived_by_user_id: sessionUser.id,
    });

    profileTypes = await mocks.createRandomProfileTypes(
      organization.id,
      5,
      (i) =>
        [
          { name: json({ en: "Individual", es: "Persona física" }), icon: "PERSON" },
          { name: json({ en: "Legal entity", es: "Persona jurídica" }), icon: "BUILDING" },
          { name: json({ en: "Contract", es: "Contrato" }), icon: "DOCUMENT" },
          {
            name: json({ en: "Expirable fields", es: "Campos con expiración" }),
            icon: "DATABASE",
          },
          {
            name: json({ en: "Unique fields", es: "Campos únicos" }),
            icon: "DATABASE",
          },
        ][i],
    );

    profileType0Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[0].id,
      9,
      (i) =>
        [
          {
            name: json({ en: "First name", es: "Nombre" }),
            type: "SHORT_TEXT" as const,
            alias: "FIRST_NAME",
            permission: "WRITE" as const,
            options: {},
          },
          {
            name: json({ en: "Last name", es: "Apellido" }),
            type: "SHORT_TEXT" as const,
            alias: "LAST_NAME",
            permission: "WRITE" as const,
            options: {},
          },
          {
            name: json({ en: "Birth date", es: "Fecha de nacimiento" }),
            type: "DATE" as const,
            alias: "BIRTH_DATE",
            is_expirable: true,
            permission: "WRITE" as const,
            options: { useReplyAsExpiryDate: true },
          },
          {
            name: json({ en: "Phone", es: "Teléfono" }),
            type: "PHONE" as const,
            alias: "PHONE",
            permission: "WRITE" as const,
            options: {},
          },
          {
            name: json({ en: "Email", es: "Correo electrónico" }),
            type: "TEXT" as const,
            alias: "EMAIL",
            permission: "WRITE" as const,
            options: {},
          },
          {
            name: json({ en: "Passport", es: "Pasaporte" }),
            type: "SHORT_TEXT" as const,
            alias: "PASSPORT",
            is_expirable: true,
            permission: "WRITE" as const,
            expiry_alert_ahead_time: mocks.knex.raw(`'1 month'::interval`) as any,
            options: {},
          },
          {
            name: json({ en: "Risk", es: "Riesgo" }),
            type: "SELECT" as const,
            alias: "RISK",
            is_expirable: false,
            permission: "WRITE" as const,
            options: {
              values: [
                {
                  label: { en: "Low", es: "Bajo" },
                  value: "low",
                },
                {
                  label: { en: "Medium", es: "Medio" },
                  value: "medium",
                },
                {
                  label: { en: "High", es: "Alto" },
                  value: "high",
                },
              ],
              showOptionsWithColors: true,
            },
          },
          {
            name: json({ en: "Gender", es: "Género" }),
            type: "SELECT" as const,
            alias: "GENDER",
            is_expirable: false,
            permission: "WRITE" as const,
            options: {
              values: [
                {
                  label: { en: "Male", es: "Hombre" },
                  value: "M",
                },
                {
                  label: { en: "Female", es: "Mujer" },
                  value: "F",
                },
              ],
            },
          },
          {
            name: json({ en: "Background check", es: "Antecedentes" }),
            type: "BACKGROUND_CHECK" as const,
            alias: "BACKGROUND_CHECK",
            is_expirable: false,
            permission: "WRITE" as const,
            options: {},
          },
        ][i],
    );
    await mocks.knex
      .from("profile_type")
      .where("id", profileTypes[0].id)
      .update({
        profile_name_pattern: json([
          profileType0Fields[0].id,
          " ",
          profileType0Fields[1].id,
          " (",
          profileType0Fields[6].id,
          " risk)",
        ]),
      });
    profileType1Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[1].id,
      3,
      (i) =>
        [
          {
            name: json({ en: "Name", es: "Nombre" }),
            type: "SHORT_TEXT" as const,
            alias: "NAME",
          },
          {
            name: json({ en: "Tax ID", es: "CIF" }),
            type: "SHORT_TEXT" as const,
            alias: "TAX_ID",
          },
          {
            name: json({ en: "Address", es: "Dirección" }),
            type: "TEXT" as const,
            alias: "ADDRESS",
          },
        ][i],
    );

    await mocks.knex
      .from("profile_type")
      .where("id", profileTypes[1].id)
      .update({
        profile_name_pattern: json([profileType1Fields[0].id]),
      });

    profileType2Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[2].id,
      6,
      (i) =>
        [
          {
            name: json({ en: "Address", es: "Dirección" }),
            type: "TEXT" as const,
            alias: "ADDRESS",
            is_expirable: true,
          },
          {
            name: json({ en: "ID", es: "DNI" }),
            type: "FILE" as const,
            alias: "ID_PHOTO",
            is_expirable: true,
          },
          {
            name: json({ en: "Contract", es: "Contrato" }),
            type: "FILE" as const,
            alias: "CONTRACT",
            permission: "READ" as const,
          },
          {
            name: json({ en: "Bank ID", es: "ID de Banco" }),
            type: "TEXT" as const,
            alias: "BANK_ID",
            permission: "READ" as const,
          },
          {
            name: json({ en: "Contract Value", es: "Valor del contrato" }),
            type: "NUMBER" as const,
            alias: "CONTRACT_VALUE",
            permission: "WRITE" as const,
          },
          {
            name: json({ en: "Expiry date", es: "Fecha de expiración" }),
            type: "DATE" as const,
            alias: "EXPIRY_DATE",
            permission: "WRITE" as const,
          },
        ][i],
    );

    profileType3Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[3].id,
      5,
      (i) =>
        [
          {
            name: json({ en: "date", es: "fecha" }),
            type: "DATE" as const,
            is_expirable: true,
            options: { useReplyAsExpiryDate: true },
            expiry_alert_ahead_time: mocks.knex.raw(`'1 month'::interval`) as any,
          },
          {
            name: json({ en: "text", es: "texto" }),
            type: "TEXT" as const,
            is_expirable: true,
            expiry_alert_ahead_time: mocks.knex.raw(`'1 month'::interval`) as any,
          },
          {
            name: json({ en: "no alert", es: "sin alerta" }),
            type: "TEXT" as const,
            is_expirable: true,
            expiry_alert_ahead_time: null,
          },
          {
            name: json({ en: "Risk", es: "Riesgo" }),
            type: "SELECT" as const,
            alias: "RISK",
            is_expirable: false,
            permission: "WRITE" as const,
            options: {
              values: [
                {
                  id: "1",
                  label: { en: "Low", es: "Bajo" },
                  value: "low",
                },
                {
                  id: "2",
                  label: { en: "Medium", es: "Medio" },
                  value: "medium",
                },
                {
                  id: "3",
                  label: { en: "High", es: "Alto" },
                  value: "high",
                },
              ],
              showOptionsWithColors: true,
            },
          },
          {
            name: json({ en: "Options", es: "Opciones" }),
            type: "CHECKBOX" as const,
            alias: "OPTIONS",
            is_expirable: false,
            permission: "WRITE" as const,
            options: {
              values: [
                { value: "A", label: { en: "Option A", es: "Opción A" } },
                { value: "B", label: { en: "Option B", es: "Opción B" } },
                { value: "C", label: { en: "Option C", es: "Opción C" } },
              ],
            },
          },
        ][i],
    );

    profileType4Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[4].id,
      3,
      (i) =>
        [
          {
            name: json({ en: "ID", es: "ID" }),
            type: "SHORT_TEXT" as const,
            alias: "ID",
            is_unique: true,
          },
          {
            name: json({ en: "Name", es: "Nombre" }),
            type: "SHORT_TEXT" as const,
            alias: "NAME",
          },
          {
            name: json({ en: "Tax ID", es: "Tax ID" }),
            type: "SHORT_TEXT" as const,
            alias: "TAX_ID",
            is_unique: true,
          },
        ][i],
    );

    await mocks.knex
      .from("profile_type")
      .where("id", profileTypes[4].id)
      .update({
        profile_name_pattern: json([profileType4Fields[0].id, " ", profileType4Fields[1].id]),
      });
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("profiles", () => {
    let harryPotterId: string;
    let harveySpecterId: string;
    let unknownPersonId: string;

    let profileAId: string;
    let profileBCId: string;
    let profileACId: string;

    let contractId: string;
    let expiredContractId: string;

    beforeEach(async () => {
      const harryPotter = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harry" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Potter" },
        },
      ]);
      await mocks.createProfileFieldValues(fromGlobalId(harryPotter.id).id, [
        {
          created_by_user_id: sessionUser.id,
          type: "BACKGROUND_CHECK",
          profile_type_field_id: profileType0Fields[8].id,
          content: JSON.stringify({
            query: {
              name: "Harry Potter",
              date: null,
              type: "PERSON",
            },
            search: {
              totalCount: 1,
              items: [], // doesn't matter
              createdAt: new Date(),
            },
            entity: null,
          }),
        },
      ]);

      const harveySpecter = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harvey" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Specter" },
        },
      ]);

      await mocks.createProfileFieldValues(fromGlobalId(harveySpecter.id).id, [
        {
          created_by_user_id: sessionUser.id,
          type: "BACKGROUND_CHECK",
          profile_type_field_id: profileType0Fields[8].id,
          content: JSON.stringify({
            query: {
              name: "Harvey Specter",
              date: null,
              type: "PERSON",
            },
            search: {
              totalCount: 2,
              items: [], // doesn't matter
              createdAt: new Date(),
            },
            entity: {
              id: "1",
              type: "PERSON",
              name: "Harvey Specter",
              createdAt: new Date(),
              properties: {
                topics: ["role.lawyer", "poi"],
              },
            },
          }),
        },
      ]);

      const unknownPerson = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      await mocks.createProfileFieldValues(fromGlobalId(unknownPerson.id).id, [
        {
          created_by_user_id: sessionUser.id,
          type: "BACKGROUND_CHECK",
          profile_type_field_id: profileType0Fields[8].id,
          content: JSON.stringify({
            query: {
              name: "N/A",
              date: null,
              type: "PERSON",
            },
            search: {
              totalCount: 0,
              items: [], // doesn't matter
              createdAt: new Date(),
            },
            entity: null,
          }),
        },
      ]);

      const profileA = await createProfile(toGlobalId("ProfileType", profileTypes[3].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
          content: { value: ["A"] },
        },
      ]);

      const profileBC = await createProfile(toGlobalId("ProfileType", profileTypes[3].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
          content: { value: ["B", "C"] },
        },
      ]);

      const profileAC = await createProfile(toGlobalId("ProfileType", profileTypes[3].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
          content: { value: ["A", "C"] },
        },
      ]);

      const contract = await createProfile(toGlobalId("ProfileType", profileTypes[2].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[0].id),
          content: { value: "1234 Main St" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[4].id),
          content: { value: 1000 },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[5].id),
          content: { value: "2030-10-19" },
        },
      ]);
      const [fileUpload] = await mocks.createRandomFileUpload(1);
      await mocks.knex.from("profile_field_file").insert({
        created_by_user_id: sessionUser.id,
        profile_id: fromGlobalId(contract.id).id,
        type: "FILE",
        profile_type_field_id: profileType2Fields[1].id,
        file_upload_id: fileUpload.id,
      });

      const expiredContract = await createProfile(toGlobalId("ProfileType", profileTypes[2].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[4].id),
          content: { value: 1300 },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[5].id),
          content: { value: "2000-01-01" },
        },
      ]);

      harryPotterId = harryPotter.id;
      harveySpecterId = harveySpecter.id;
      unknownPersonId = unknownPerson.id;

      profileAId = profileA.id;
      profileBCId = profileBC.id;
      profileACId = profileAC.id;

      contractId = contract.id;
      expiredContractId = expiredContract.id;
    });

    it("queries profiles filtering by its current values", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              operator: "START_WITH",
              value: "Har",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 2,
        items: [{ id: harryPotterId }, { id: harveySpecterId }],
      });
    });

    it("queries profiles with multiple value filters", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
                  operator: "START_WITH",
                  value: "Har",
                },
                {
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
                  operator: "EQUAL",
                  value: "Potter",
                },
              ],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 1,
        items: [{ id: harryPotterId }],
      });
    });

    it("queries profiles with numerical value filter", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[2].id),
            values: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[4].id),
                  operator: "GREATER_THAN_OR_EQUAL",
                  value: 1000,
                },
                {
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[0].id),
                  operator: "CONTAIN",
                  value: "Main St",
                },
              ],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 1,
        items: [{ id: contractId }],
      });
    });

    it("queries profiles with an array of possible values", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              operator: "IS_ONE_OF",
              value: ["Harry", "Harvey"],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 2,
        items: [{ id: harryPotterId }, { id: harveySpecterId }],
      });
    });

    it("sends error if using IS_ONE_OF or NOT_IS_ONE_OF condition with a non-array value", async () => {
      for (const operator of ["IS_ONE_OF", "NOT_IS_ONE_OF"]) {
        const { errors, data } = await testClient.execute(
          gql`
            query ($filter: ProfileFilter) {
              profiles(limit: 100, offset: 0, filter: $filter) {
                totalCount
                items {
                  id
                }
              }
            }
          `,
          {
            filter: {
              profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
              values: {
                profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
                operator,
                value: "Harry",
              },
            },
          },
        );

        expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
        expect(data).toBeNull();
      }
    });

    it("sends error if using array values with a non-array condition", async () => {
      for (const operator of [
        "EQUAL",
        "NOT_EQUAL",
        "START_WITH",
        "END_WITH",
        "CONTAIN",
        "NOT_CONTAIN",
        "LESS_THAN",
        "LESS_THAN_OR_EQUAL",
        "GREATER_THAN",
        "GREATER_THAN_OR_EQUAL",
      ]) {
        const { errors, data } = await testClient.execute(
          gql`
            query ($filter: ProfileFilter) {
              profiles(limit: 100, offset: 0, filter: $filter) {
                totalCount
                items {
                  id
                }
              }
            }
          `,
          {
            filter: {
              profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
              values: {
                logicalOperator: "OR",
                conditions: [
                  {
                    profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
                    operator,
                    value: ["Harry", "Harvey"],
                  },
                ],
              },
            },
          },
        );

        expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
        expect(data).toBeNull();
      }
    });

    it("queries profiles with HAS_BG_CHECK_MATCH operator", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
              operator: "HAS_BG_CHECK_MATCH",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 1,
        items: [{ id: harveySpecterId }],
      });
    });

    it("queries profiles with NOT_HAS_BG_CHECK_MATCH operator", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
              operator: "NOT_HAS_BG_CHECK_MATCH",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 2,
        items: [{ id: harryPotterId }, { id: unknownPersonId }],
      });
    });

    it("queries profiles with HAS_BG_CHECK_RESULTS operator", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
              operator: "HAS_BG_CHECK_RESULTS",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 2,
        items: [{ id: harryPotterId }, { id: harveySpecterId }],
      });
    });

    it("queries profiles with NOT_HAS_BG_CHECK_RESULTS operator", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
              operator: "NOT_HAS_BG_CHECK_RESULTS",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 1,
        items: [{ id: unknownPersonId }],
      });
    });

    it("queries profiles with HAS_BG_CHECK_TOPICS operator", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
              operator: "HAS_BG_CHECK_TOPICS",
              value: ["poi"],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 1,
        items: [{ id: harveySpecterId }],
      });
    });

    it("queries profiles with NOT_HAS_BG_CHECK_TOPICS operator", async () => {
      for (const [value, profiles] of [
        [["poi"], [harryPotterId, unknownPersonId]],
        [["wanted"], [harryPotterId, harveySpecterId, unknownPersonId]],
      ] as [string[], string[]][]) {
        const { errors, data } = await testClient.execute(
          gql`
            query ($filter: ProfileFilter) {
              profiles(limit: 100, offset: 0, filter: $filter) {
                totalCount
                items {
                  id
                }
              }
            }
          `,
          {
            filter: {
              profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
              values: {
                profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
                operator: "NOT_HAS_BG_CHECK_TOPICS",
                value,
              },
            },
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.profiles).toEqual({
          totalCount: profiles.length,
          items: profiles.map((id) => ({ id })),
        });
      }
    });

    it("queries profiles with values on CHECKBOX field", async () => {
      for (const [operator, value, profiles] of [
        ["EQUAL", ["A", "C"], [profileACId]],
        ["CONTAIN", ["C"], [profileBCId, profileACId]],
        ["NOT_CONTAIN", ["A"], [profileBCId]],
        ["NOT_EQUAL", ["A"], [profileBCId, profileACId]],
      ] as [string, string[], string[]][]) {
        const { errors, data } = await testClient.execute(
          gql`
            query ($filter: ProfileFilter) {
              profiles(limit: 100, offset: 0, filter: $filter) {
                totalCount
                items {
                  id
                }
              }
            }
          `,
          {
            filter: {
              profileTypeId: toGlobalId("ProfileType", profileTypes[3].id),
              values: {
                profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
                operator,
                value,
              },
            },
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.profiles).toEqual({
          totalCount: profiles.length,
          items: profiles.map((id) => ({ id })),
        });
      }
    });

    it("queries profiles with values on CHECKBOX field and OR logical operator", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[3].id),
            values: {
              logicalOperator: "OR",
              conditions: [
                {
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
                  operator: "EQUAL",
                  value: ["A"],
                },
                {
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
                  operator: "CONTAIN",
                  value: ["B"],
                },
              ],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 2,
        items: [{ id: profileAId }, { id: profileBCId }],
      });
    });

    it("queries profiles containing FILE replies", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[2].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
              operator: "HAS_VALUE",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 1,
        items: [{ id: contractId }],
      });
    });

    it("queries contracts with multiple filters", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[2].id),
            values: {
              logicalOperator: "OR",
              conditions: [
                {
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
                  operator: "NOT_HAS_VALUE",
                },
                {
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[4].id),
                  operator: "LESS_THAN_OR_EQUAL",
                  value: 1000,
                },
              ],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 2,
        items: [{ id: contractId }, { id: expiredContractId }],
      });
    });

    it("filters by HAS_EXPIRY on a cached value", async () => {
      await updateProfileValue(harryPotterId, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          content: { value: "1990-01-01" },
          expiryDate: "1990-01-01",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
              operator: "HAS_EXPIRY",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 1,
        items: [{ id: harryPotterId }],
      });
    });

    it("filters by NOT_HAS_EXPIRY on a cached value", async () => {
      await updateProfileValue(harryPotterId, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          content: { value: "1990-01-01" },
          expiryDate: "1990-01-01",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
              operator: "NOT_HAS_EXPIRY",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 2,
        items: [{ id: harveySpecterId }, { id: unknownPersonId }],
      });
    });

    it("filters by GREATER_THAN on a cached DATE value", async () => {
      await updateProfileValue(harryPotterId, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          content: { value: "1990-01-02" },
          expiryDate: "1990-01-02",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          query ($filter: ProfileFilter) {
            profiles(limit: 100, offset: 0, filter: $filter) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          filter: {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            values: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
              operator: "GREATER_THAN",
              value: "1990-01-01",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profiles).toEqual({
        totalCount: 1,
        items: [{ id: harryPotterId }],
      });
    });
  });

  describe("profile", () => {
    it("queries a profile", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harry" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Potter" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          content: { value: "2029-01-01" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[5].id),
          content: { value: "AA1234567" },
          expiryDate: "2024-10-28",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              name
              profileType {
                id
                name
              }
              properties {
                field {
                  id
                  name
                  options
                  isExpirable
                  isUsedInProfileName
                }
                files {
                  id
                }
                value {
                  expiryDate
                  content
                }
              }
              events(limit: 10, offset: 0) {
                items {
                  type
                  profile {
                    id
                  }
                  ... on ProfileCreatedEvent {
                    user {
                      id
                    }
                  }
                  ... on ProfileUpdatedEvent {
                    user {
                      id
                    }
                  }
                  ... on ProfileFieldValueUpdatedEvent {
                    user {
                      id
                    }
                  }
                  ... on ProfileFieldExpiryUpdatedEvent {
                    user {
                      id
                    }
                  }
                }
                totalCount
              }
            }
          }
        `,
        {
          profileId: profile.id,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: profile.id,
        name: profile.name,
        profileType: {
          id: toGlobalId("ProfileType", profileTypes[0].id),
          name: { es: "Persona física", en: "Individual" },
        },
        properties: [
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              name: { en: "First name", es: "Nombre" },
              options: {},
              isExpirable: false,
              isUsedInProfileName: true,
            },
            files: null,
            value: { expiryDate: null, content: { value: "Harry" } },
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
              name: { en: "Last name", es: "Apellido" },
              options: {},
              isExpirable: false,
              isUsedInProfileName: true,
            },
            files: null,
            value: { expiryDate: null, content: { value: "Potter" } },
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
              name: { en: "Birth date", es: "Fecha de nacimiento" },
              options: { useReplyAsExpiryDate: true },
              isExpirable: true,
              isUsedInProfileName: false,
            },
            files: null,
            value: { expiryDate: "2029-01-01", content: { value: "2029-01-01" } },
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[3].id),
              name: { en: "Phone", es: "Teléfono" },
              options: {},
              isExpirable: false,
              isUsedInProfileName: false,
            },
            files: null,
            value: null,
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[4].id),
              name: { en: "Email", es: "Correo electrónico" },
              options: {},
              isExpirable: false,
              isUsedInProfileName: false,
            },
            files: null,
            value: null,
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[5].id),
              name: { en: "Passport", es: "Pasaporte" },
              options: {},
              isExpirable: true,
              isUsedInProfileName: false,
            },
            files: null,
            value: { expiryDate: "2024-10-28", content: { value: "AA1234567" } },
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
              name: { en: "Risk", es: "Riesgo" },
              options: {
                values: [
                  {
                    label: { en: "Low", es: "Bajo" },
                    value: "low",
                  },
                  {
                    label: { en: "Medium", es: "Medio" },
                    value: "medium",
                  },
                  {
                    label: { en: "High", es: "Alto" },
                    value: "high",
                  },
                ],
                showOptionsWithColors: true,
              },
              isExpirable: false,
              isUsedInProfileName: true,
            },
            files: null,
            value: null,
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[7].id),
              isExpirable: false,
              isUsedInProfileName: false,
              name: { en: "Gender", es: "Género" },
              options: {
                values: [
                  { label: { en: "Male", es: "Hombre" }, value: "M" },
                  {
                    label: { en: "Female", es: "Mujer" },
                    value: "F",
                  },
                ],
              },
            },
            files: null,
            value: null,
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
              isExpirable: false,
              isUsedInProfileName: false,
              name: { en: "Background check", es: "Antecedentes" },
              options: {},
            },
            files: null,
            value: null,
          },
        ],
        events: {
          items: expect.toIncludeSameMembers([
            {
              type: "PROFILE_UPDATED",
              profile: { id: profile.id },
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_FIELD_EXPIRY_UPDATED",
              profile: { id: profile.id },
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_FIELD_VALUE_UPDATED",
              profile: { id: profile.id },
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_FIELD_EXPIRY_UPDATED",
              profile: { id: profile.id },
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_FIELD_VALUE_UPDATED",
              profile: { id: profile.id },
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_FIELD_VALUE_UPDATED",
              profile: { id: profile.id },
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_FIELD_VALUE_UPDATED",
              profile: { id: profile.id },
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_CREATED",
              profile: { id: profile.id },
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
          ]),
          totalCount: 8,
        },
      });
    });

    it("returns null values on HIDDEN fields", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harry" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Potter" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          content: { value: "2029-01-01" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[5].id),
          content: { value: "AA1234567" },
          expiryDate: "2024-10-28",
        },
      ]);

      await mocks.knex
        .from("profile_type_field")
        .whereIn("id", [
          profileType0Fields[2].id,
          profileType0Fields[3].id,
          profileType0Fields[5].id,
        ])
        .update("permission", "HIDDEN");

      const { errors, data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              properties {
                field {
                  id
                  myPermission
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
        `,
        {
          profileId: profile.id,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: profile.id,
        properties: [
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              myPermission: "WRITE",
            },
            files: null,
            value: { content: { value: "Harry" } },
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
              myPermission: "WRITE",
            },
            files: null,
            value: { content: { value: "Potter" } },
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
              myPermission: "HIDDEN",
            },
            files: null,
            value: null,
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[3].id),
              myPermission: "HIDDEN",
            },
            files: null,
            value: null,
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[4].id),
              myPermission: "WRITE",
            },
            files: null,
            value: null,
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[5].id),
              myPermission: "HIDDEN",
            },
            files: null,
            value: null,
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
              myPermission: "WRITE",
            },
            files: null,
            value: null,
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[7].id),
              myPermission: "WRITE",
            },
            files: null,
            value: null,
          },
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
              myPermission: "WRITE",
            },
            files: null,
            value: null,
          },
        ],
      });
    });

    it("queries associated petitions of a profile, ignoring petitions that are scheduled for deletion", async () => {
      const petitions = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        2,
        (i) => ({ deletion_scheduled_at: i === 0 ? new Date() : null }),
      );
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));

      const profileId = fromGlobalId(profile.id, "Profile").id;

      await mocks.knex.from("petition_profile").insert([
        { petition_id: petitions[0].id, profile_id: profileId },
        { petition_id: petitions[1].id, profile_id: profileId },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              associatedPetitions(limit: 10) {
                items {
                  id
                }
                totalCount
              }
            }
          }
        `,
        { profileId: toGlobalId("Profile", profileId) },
      );

      expect(errors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: toGlobalId("Profile", profileId),
        associatedPetitions: {
          items: [{ id: toGlobalId("Petition", petitions[1].id) }],
          totalCount: 1,
        },
      });
    });
  });

  describe("profileTypes", () => {
    it("queries organization profile types", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query (
            $limit: Int
            $offset: Int
            $sortBy: [QueryProfileTypes_OrderBy!]
            $locale: UserLocale
          ) {
            profileTypes(limit: $limit, offset: $offset, sortBy: $sortBy, locale: $locale) {
              totalCount
              items {
                id
                name
                fields {
                  position
                  name
                }
              }
            }
          }
        `,
        {
          limit: 10,
          offset: 0,
          sortBy: ["name_DESC"],
          locale: "en",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileTypes).toEqual({
        totalCount: 5,
        items: [
          {
            id: toGlobalId("ProfileType", profileTypes[4].id),
            name: { en: "Unique fields", es: "Campos únicos" },
            fields: times(3, (i) => ({
              position: i,
              name: { es: expect.any(String), en: expect.any(String) },
            })),
          },
          {
            id: toGlobalId("ProfileType", profileTypes[1].id),
            name: { en: "Legal entity", es: "Persona jurídica" },
            fields: times(3, (i) => ({
              position: i,
              name: { es: expect.any(String), en: expect.any(String) },
            })),
          },
          {
            id: toGlobalId("ProfileType", profileTypes[0].id),
            name: { en: "Individual", es: "Persona física" },
            fields: profileType0Fields.map((f, i) => ({
              position: i,
              name: f.name,
            })),
          },
          {
            id: toGlobalId("ProfileType", profileTypes[3].id),
            name: { en: "Expirable fields", es: "Campos con expiración" },
            fields: profileType3Fields.map((f, i) => ({ position: i, name: f.name })),
          },
          {
            id: toGlobalId("ProfileType", profileTypes[2].id),
            name: { en: "Contract", es: "Contrato" },
            fields: [
              {
                name: { en: "Address", es: "Dirección" },
                position: 0,
              },
              {
                name: { en: "ID", es: "DNI" },
                position: 1,
              },
              {
                name: { en: "Contract", es: "Contrato" },
                position: 2,
              },
              {
                name: { en: "Bank ID", es: "ID de Banco" },
                position: 3,
              },
              {
                name: { en: "Contract Value", es: "Valor del contrato" },
                position: 4,
              },
              { name: { en: "Expiry date", es: "Fecha de expiración" }, position: 5 },
            ],
          },
        ],
      });
    });

    it("queries organization profile type with search filter", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query (
            $limit: Int
            $offset: Int
            $sortBy: [QueryProfileTypes_OrderBy!]
            $search: String
          ) {
            profileTypes(limit: $limit, offset: $offset, sortBy: $sortBy, search: $search) {
              totalCount
              items {
                id
                name
                fields {
                  position
                }
              }
            }
          }
        `,
        {
          limit: 10,
          offset: 0,
          sortBy: ["createdAt_ASC"],
          search: "Indiv",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileTypes).toEqual({
        totalCount: 1,
        items: [
          {
            id: toGlobalId("ProfileType", profileTypes[0].id),
            name: { en: "Individual", es: "Persona física" },
            fields: profileType0Fields.map((f, i) => ({ position: i })),
          },
        ],
      });
    });

    it("sends error when querying profile types and sorting by name with no locale", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($limit: Int, $offset: Int, $sortBy: [QueryProfileTypes_OrderBy!]) {
            profileTypes(limit: $limit, offset: $offset, sortBy: $sortBy) {
              totalCount
            }
          }
        `,
        { limit: 10, offset: 0, sortBy: ["name_ASC"] },
      );
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("queries organization profile types with filter", async () => {
      await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            archiveProfileType(profileTypeIds: $profileTypeIds) {
              id
            }
          }
        `,
        {
          profileTypeIds: [
            toGlobalId("ProfileType", profileTypes[0].id),
            toGlobalId("ProfileType", profileTypes[1].id),
          ],
        },
      );

      const { errors, data } = await testClient.execute(
        gql`
          query (
            $limit: Int
            $offset: Int
            $sortBy: [QueryProfileTypes_OrderBy!]
            $locale: UserLocale
            $filter: ProfileTypeFilter
          ) {
            profileTypes(
              limit: $limit
              offset: $offset
              sortBy: $sortBy
              locale: $locale
              filter: $filter
            ) {
              totalCount
              items {
                id
                name
                fields {
                  position
                  name
                }
              }
            }
          }
        `,
        {
          limit: 10,
          offset: 0,
          sortBy: ["name_DESC"],
          locale: "en",
          filter: {
            onlyArchived: true,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileTypes).toEqual({
        totalCount: 2,
        items: [
          {
            id: toGlobalId("ProfileType", profileTypes[1].id),
            name: { en: "Legal entity", es: "Persona jurídica" },
            fields: times(3, (i) => ({
              position: i,
              name: { es: expect.any(String), en: expect.any(String) },
            })),
          },
          {
            id: toGlobalId("ProfileType", profileTypes[0].id),
            name: { en: "Individual", es: "Persona física" },
            fields: profileType0Fields.map((f, i) => ({
              position: i,
              name: f.name,
            })),
          },
        ],
      });
    });
  });

  describe("profileTypeField visibility", () => {
    let profile: Profile;
    beforeEach(async () => {
      [profile] = await mocks.createRandomProfiles(organization.id, profileTypes[0].id, 1);
    });

    afterEach(async () => {
      await mocks.knex.from("profile_type_field_permission").delete();
    });

    it("defaults to profile type field permission", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              profileType {
                id
                fields {
                  alias
                  myPermission
                }
              }
            }
          }
        `,
        { profileId: toGlobalId("Profile", profile.id) },
      );

      expect(errors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: toGlobalId("Profile", profile.id),
        profileType: {
          id: toGlobalId("ProfileType", profileTypes[0].id),
          fields: [
            {
              alias: "FIRST_NAME",
              myPermission: "WRITE",
            },
            {
              alias: "LAST_NAME",
              myPermission: "WRITE",
            },
            {
              alias: "BIRTH_DATE",
              myPermission: "WRITE",
            },
            {
              alias: "PHONE",
              myPermission: "WRITE",
            },
            {
              alias: "EMAIL",
              myPermission: "WRITE",
            },
            {
              alias: "PASSPORT",
              myPermission: "WRITE",
            },
            {
              alias: "RISK",
              myPermission: "WRITE",
            },
            {
              alias: "GENDER",
              myPermission: "WRITE",
            },
            {
              alias: "BACKGROUND_CHECK",
              myPermission: "WRITE",
            },
          ],
        },
      });
    });

    it("returns right permission when field has overrides", async () => {
      const [otherUser] = await mocks.createRandomUsers(organization.id);

      await mocks.knex
        .from("profile_type_field")
        .where({ profile_type_id: profileTypes[0].id })
        .update({ permission: "READ" });

      await mocks.knex.from("profile_type_field_permission").insert(
        profileType0Fields.map((field) => ({
          user_id: otherUser.id,
          profile_type_field_id: field.id,
          permission: "WRITE",
        })),
      );

      const { errors, data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              profileType {
                id
                fields {
                  alias
                  myPermission
                }
              }
            }
          }
        `,
        { profileId: toGlobalId("Profile", profile.id) },
      );

      expect(errors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: toGlobalId("Profile", profile.id),
        profileType: {
          id: toGlobalId("ProfileType", profileTypes[0].id),
          fields: [
            {
              alias: "FIRST_NAME",
              myPermission: "READ",
            },
            {
              alias: "LAST_NAME",
              myPermission: "READ",
            },
            {
              alias: "BIRTH_DATE",
              myPermission: "READ",
            },
            {
              alias: "PHONE",
              myPermission: "READ",
            },
            {
              alias: "EMAIL",
              myPermission: "READ",
            },
            {
              alias: "PASSPORT",
              myPermission: "READ",
            },
            {
              alias: "RISK",
              myPermission: "READ",
            },
            {
              alias: "GENDER",
              myPermission: "READ",
            },
            {
              alias: "BACKGROUND_CHECK",
              myPermission: "READ",
            },
          ],
        },
      });
    });

    it("overrides profile type field permission for user", async () => {
      await mocks.knex
        .from("profile_type_field")
        .whereIn(
          "id",
          profileType0Fields.map((f) => f.id),
        )
        .update("permission", "HIDDEN");

      await mocks.knex.from("profile_type_field_permission").insert([
        {
          user_id: sessionUser.id,
          profile_type_field_id: profileType0Fields[0].id,
          permission: "READ",
        },
        {
          user_id: sessionUser.id,
          profile_type_field_id: profileType0Fields[2].id,
          permission: "WRITE",
        },
        {
          user_id: sessionUser.id,
          profile_type_field_id: profileType0Fields[4].id,
          permission: "HIDDEN",
        },
        {
          user_id: sessionUser.id,
          profile_type_field_id: profileType0Fields[5].id,
          permission: "READ",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              profileType {
                id
                fields {
                  alias
                  myPermission
                }
              }
            }
          }
        `,
        { profileId: toGlobalId("Profile", profile.id) },
      );

      expect(errors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: toGlobalId("Profile", profile.id),
        profileType: {
          id: toGlobalId("ProfileType", profileTypes[0].id),
          fields: [
            {
              alias: "FIRST_NAME",
              myPermission: "READ",
            },
            {
              alias: "LAST_NAME",
              myPermission: "HIDDEN",
            },
            {
              alias: "BIRTH_DATE",
              myPermission: "WRITE",
            },
            {
              alias: "PHONE",
              myPermission: "HIDDEN",
            },
            {
              alias: "EMAIL",
              myPermission: "HIDDEN",
            },
            {
              alias: "PASSPORT",
              myPermission: "READ",
            },
            {
              alias: "RISK",
              myPermission: "HIDDEN",
            },
            {
              alias: "GENDER",
              myPermission: "HIDDEN",
            },
            {
              alias: "BACKGROUND_CHECK",
              myPermission: "HIDDEN",
            },
          ],
        },
      });
    });

    it("overrides profile type field permission for user group", async () => {
      const [userGroup] = await mocks.createUserGroups(1, organization.id);
      await mocks.insertUserGroupMembers(userGroup.id, [sessionUser.id]);

      await mocks.knex
        .from("profile_type_field")
        .whereIn(
          "id",
          profileType0Fields.map((f) => f.id),
        )
        .update("permission", "HIDDEN");

      await mocks.knex.from("profile_type_field_permission").insert([
        {
          user_group_id: userGroup.id,
          profile_type_field_id: profileType0Fields[0].id,
          permission: "READ",
        },
        {
          user_group_id: userGroup.id,
          profile_type_field_id: profileType0Fields[2].id,
          permission: "WRITE",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              profileType {
                id
                fields {
                  alias
                  myPermission
                }
              }
            }
          }
        `,
        { profileId: toGlobalId("Profile", profile.id) },
      );

      expect(errors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: toGlobalId("Profile", profile.id),
        profileType: {
          id: toGlobalId("ProfileType", profileTypes[0].id),
          fields: [
            {
              alias: "FIRST_NAME",
              myPermission: "READ",
            },
            {
              alias: "LAST_NAME",
              myPermission: "HIDDEN",
            },
            {
              alias: "BIRTH_DATE",
              myPermission: "WRITE",
            },
            {
              alias: "PHONE",
              myPermission: "HIDDEN",
            },
            {
              alias: "EMAIL",
              myPermission: "HIDDEN",
            },
            {
              alias: "PASSPORT",
              myPermission: "HIDDEN",
            },
            {
              alias: "RISK",
              myPermission: "HIDDEN",
            },
            {
              alias: "GENDER",
              myPermission: "HIDDEN",
            },
            {
              alias: "BACKGROUND_CHECK",
              myPermission: "HIDDEN",
            },
          ],
        },
      });
    });

    it("selects greatest permission when user has multiple overrides", async () => {
      await mocks.knex
        .from("profile_type_field")
        .whereIn(
          "id",
          profileType0Fields.map((f) => f.id),
        )
        .update("permission", "HIDDEN");
      const groups = await mocks.createUserGroups(3, organization.id);
      await mocks.insertUserGroupMembers(groups[0].id, [sessionUser.id]);
      await mocks.insertUserGroupMembers(groups[1].id, [sessionUser.id]);
      await mocks.insertUserGroupMembers(groups[2].id, [sessionUser.id]);

      await mocks.knex.from("profile_type_field_permission").insert([
        {
          user_id: sessionUser.id,
          profile_type_field_id: profileType0Fields[0].id,
          permission: "HIDDEN",
        },
        {
          user_group_id: groups[0].id,
          profile_type_field_id: profileType0Fields[0].id,
          permission: "READ",
        },
        {
          user_group_id: groups[0].id,
          profile_type_field_id: profileType0Fields[1].id,
          permission: "HIDDEN",
        },
        {
          user_group_id: groups[1].id,
          profile_type_field_id: profileType0Fields[1].id,
          permission: "READ",
        },
        {
          user_id: sessionUser.id,
          profile_type_field_id: profileType0Fields[1].id,
          permission: "WRITE",
        },
        {
          user_id: sessionUser.id,
          profile_type_field_id: profileType0Fields[2].id,
          permission: "HIDDEN",
        },
        {
          user_group_id: groups[2].id,
          profile_type_field_id: profileType0Fields[2].id,
          permission: "READ",
        },
        {
          user_group_id: groups[1].id,
          profile_type_field_id: profileType0Fields[2].id,
          permission: "HIDDEN",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              profileType {
                id
                fields {
                  alias
                  myPermission
                }
              }
            }
          }
        `,
        { profileId: toGlobalId("Profile", profile.id) },
      );

      expect(errors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: toGlobalId("Profile", profile.id),
        profileType: {
          id: toGlobalId("ProfileType", profileTypes[0].id),
          fields: [
            {
              alias: "FIRST_NAME",
              myPermission: "READ",
            },
            {
              alias: "LAST_NAME",
              myPermission: "WRITE",
            },
            {
              alias: "BIRTH_DATE",
              myPermission: "READ",
            },
            {
              alias: "PHONE",
              myPermission: "HIDDEN",
            },
            {
              alias: "EMAIL",
              myPermission: "HIDDEN",
            },
            {
              alias: "PASSPORT",
              myPermission: "HIDDEN",
            },
            {
              alias: "RISK",
              myPermission: "HIDDEN",
            },
            {
              alias: "GENDER",
              myPermission: "HIDDEN",
            },
            {
              alias: "BACKGROUND_CHECK",
              myPermission: "HIDDEN",
            },
          ],
        },
      });
    });
  });

  describe("createProfile", () => {
    afterEach(async () => {
      await mocks.knex.from("profile_event").delete();
      await mocks.knex.from("profile_field_value").delete();
      await mocks.knex.from("profile_subscription").delete();
      await mocks.knex.from("profile").delete();
    });

    it("creates a profile and subscribes the user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $subscribe: Boolean
            $fields: [CreateProfileFieldValueInput!]!
          ) {
            createProfile(profileTypeId: $profileTypeId, subscribe: $subscribe, fields: $fields) {
              id
              profileType {
                id
              }
              subscribers {
                user {
                  id
                }
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          subscribe: true,
          fields: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfile).toEqual({
        id: expect.any(String),
        profileType: {
          id: toGlobalId("ProfileType", profileTypes[0].id),
        },
        subscribers: [
          {
            user: {
              id: toGlobalId("User", sessionUser.id),
            },
          },
        ],
      });
    });

    it("sends error if trying to create a profile with an archived profile type", async () => {
      const [archivedProfileType] = await mocks.createRandomProfileTypes(
        organization.id,
        1,
        () => ({
          archived_at: new Date(),
          archived_by_user_id: sessionUser.id,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $subscribe: Boolean
            $fields: [CreateProfileFieldValueInput!]!
          ) {
            createProfile(profileTypeId: $profileTypeId, subscribe: $subscribe, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", archivedProfileType.id),
          fields: [],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("creates a profile and completes fields", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
              profileType {
                id
              }
              properties {
                field {
                  type
                }
                value {
                  content
                }
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[3].id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[0].id),
              content: { value: "2020-10-23" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[1].id),
              content: { value: "Harry" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[2].id),
              content: { value: "Potter" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[3].id),
              content: { value: "high" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
              content: { value: ["A", "C"] },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfile).toEqual({
        id: expect.any(String),
        profileType: {
          id: toGlobalId("ProfileType", profileTypes[3].id),
        },
        properties: [
          {
            field: {
              type: "DATE",
            },
            value: {
              content: { value: "2020-10-23" },
            },
          },
          {
            field: {
              type: "TEXT",
            },
            value: {
              content: { value: "Harry" },
            },
          },
          {
            field: {
              type: "TEXT",
            },
            value: {
              content: { value: "Potter" },
            },
          },
          {
            field: {
              type: "SELECT",
            },
            value: {
              content: { value: "high" },
            },
          },
          {
            field: {
              type: "CHECKBOX",
            },
            value: {
              content: {
                value: ["A", "C"],
              },
            },
          },
        ],
      });
    });

    it("sends error if passing invalid values on fields input", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[3].id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
              content: { value: ["unknown"] },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("sends error if creating a profile with duplicated values on a UNIQUE field", async () => {
      const { errors: errors1, data: data1 } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[4].id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
              content: { value: "1" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
              content: { value: "Mike Ross" },
            },
          ],
        },
      );

      expect(errors1).toBeUndefined();
      expect(data1.createProfile).toEqual({
        id: expect.any(String),
      });

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[4].id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
              content: { value: "2" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
              content: { value: "Harvey Specter" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
              content: { value: "HS_2" },
            },
          ],
        },
      );

      expect(errors2).toBeUndefined();
      expect(data2.createProfile).toEqual({
        id: expect.any(String),
      });

      const { errors: errors3 } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[4].id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
              content: { value: "Mike Specter" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
              content: { value: "HS_2" },
            },
          ],
        },
      );

      expect(errors3).toContainGraphQLError("PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT", {
        conflicts: [
          {
            profileId: data2.createProfile.id,
            profileName: { en: "2 Harvey Specter", es: "2 Harvey Specter" },
            profileStatus: "OPEN",
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
            profileTypeFieldName: { en: "Tax ID", es: "Tax ID" },
          },
        ],
      });
    });

    it("sends error if creating a profile with duplicated values on multiple UNIQUE fields", async () => {
      const { errors: errors1, data: data1 } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[4].id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
              content: { value: "1" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
              content: { value: "Mike Ross" },
            },
          ],
        },
      );

      expect(errors1).toBeUndefined();
      expect(data1.createProfile).toEqual({
        id: expect.any(String),
      });

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[4].id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
              content: { value: "2" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
              content: { value: "Harvey Specter" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
              content: { value: "HS_2" },
            },
          ],
        },
      );

      expect(errors2).toBeUndefined();
      expect(data2.createProfile).toEqual({
        id: expect.any(String),
      });

      const { errors: errors3 } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[4].id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
              content: { value: "1" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
              content: { value: "Mike Specter" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
              content: { value: "HS_2" },
            },
          ],
        },
      );

      expect(errors3).toContainGraphQLError("PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT", {
        conflicts: [
          {
            profileId: data1.createProfile.id,
            profileName: { en: "1 Mike Ross", es: "1 Mike Ross" },
            profileStatus: "OPEN",
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
            profileTypeFieldName: { en: "ID", es: "ID" },
          },
          {
            profileId: data2.createProfile.id,
            profileName: { en: "2 Harvey Specter", es: "2 Harvey Specter" },
            profileStatus: "OPEN",
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
            profileTypeFieldName: { en: "Tax ID", es: "Tax ID" },
          },
        ],
      });
    });
  });

  describe("createProfileType", () => {
    beforeAll(async () => {
      const profilesSetup = testClient.container.get<ProfilesSetupService>(PROFILES_SETUP_SERVICE);
      await profilesSetup.createDefaultProfileTypes(organization.id, "TEST");
    });

    it("creates a new profile type on organization", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($name: LocalizableUserText!, $pluralName: LocalizableUserText!) {
            createProfileType(name: $name, pluralName: $pluralName) {
              id
              name
              pluralName
              fields {
                id
                name
              }
            }
          }
        `,
        {
          name: { en: "Individual" },
          pluralName: { en: "Individuals" },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileType).toEqual({
        id: expect.any(String),
        name: { en: "Individual" },
        pluralName: { en: "Individuals" },
        fields: [{ id: expect.any(String), name: { en: "Name", es: "Nombre" } }],
      });
    });

    it("fails when normal user tries to create a profile type", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($name: LocalizableUserText!, $pluralName: LocalizableUserText!) {
            createProfileType(name: $name, pluralName: $pluralName) {
              id
              name
              pluralName
              fields {
                id
              }
            }
          }
        `,
        { name: { en: "Individual" }, pluralName: { en: "Individuals" } },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("creates a view on the created profile type", async () => {
      const { errors: createErrors, data: createData } = await testClient.execute(
        gql`
          mutation ($name: LocalizableUserText!, $pluralName: LocalizableUserText!) {
            createProfileType(name: $name, pluralName: $pluralName) {
              id
            }
          }
        `,
        { name: { en: "Individual" }, pluralName: { en: "Individuals" } },
      );

      expect(createErrors).toBeUndefined();
      expect(createData?.createProfileType).toEqual({
        id: expect.any(String),
      });

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileTypeId: GID!) {
            me {
              profileListViews(profileTypeId: $profileTypeId) {
                type
                isDefault
                data {
                  columns
                  search
                  sort {
                    __typename
                  }
                }
                profileType {
                  id
                }
              }
            }
          }
        `,
        { profileTypeId: createData.createProfileType.id },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData).toEqual({
        me: {
          profileListViews: [
            {
              type: "ALL",
              isDefault: false,
              data: {
                columns: null,
                search: null,
                sort: null,
              },
              profileType: { id: createData.createProfileType.id },
            },
          ],
        },
      });
    });

    it("creates a new profile type based on an INDIVIDUAL standard type, and sets allowed relationships with current standard types", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $name: LocalizableUserText!
            $pluralName: LocalizableUserText!
            $standardType: ProfileTypeStandardType
          ) {
            createProfileType(name: $name, pluralName: $pluralName, standardType: $standardType) {
              id
              name
              pluralName
              standardType
              isStandard
              fields {
                id
                type
                name
                isUsedInProfileName
                alias
                isStandard
              }
            }
          }
        `,
        {
          name: { en: "My Individual", es: "Mi Persona" },
          pluralName: { en: "My Individuals", es: "Mis Personas" },
          standardType: "INDIVIDUAL",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileType).toEqual({
        id: expect.any(String),
        name: { en: "My Individual", es: "Mi Persona" },
        pluralName: { en: "My Individuals", es: "Mis Personas" },
        standardType: "INDIVIDUAL",
        isStandard: true,
        fields: [
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "First name", es: "Nombre" },
            isUsedInProfileName: true,
            alias: "p_first_name",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Last name", es: "Apellido" },
            isUsedInProfileName: true,
            alias: "p_last_name",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Email", es: "Correo electrónico" },
            isUsedInProfileName: false,
            alias: "p_email",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "PHONE",
            name: { en: "Phone number", es: "Número de teléfono" },
            isUsedInProfileName: false,
            alias: "p_phone_number",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "PHONE",
            name: { en: "Mobile phone number", es: "Número de teléfono móvil" },
            isUsedInProfileName: false,
            alias: "p_mobile_phone_number",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "DATE",
            name: { en: "Date of birth", es: "Fecha de nacimiento" },
            isUsedInProfileName: false,
            alias: "p_birth_date",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Gender", es: "Género" },
            isUsedInProfileName: false,
            alias: "p_gender",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Address", es: "Dirección" },
            isUsedInProfileName: false,
            alias: "p_address",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "City", es: "Ciudad" },
            isUsedInProfileName: false,
            alias: "p_city",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "ZIP code", es: "Código postal" },
            isUsedInProfileName: false,
            alias: "p_zip",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Country of residence", es: "País de residencia" },
            isUsedInProfileName: false,
            alias: "p_country_of_residence",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Proof of address document", es: "Documento de prueba de domicilio" },
            isUsedInProfileName: false,
            alias: "p_proof_of_address_document",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Citizenship", es: "Nacionalidad" },
            isUsedInProfileName: false,
            alias: "p_citizenship",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "ID number", es: "Número de identificación" },
            isUsedInProfileName: false,
            alias: "p_tax_id",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "ID document", es: "Documento de identidad" },
            isUsedInProfileName: false,
            alias: "p_id_document",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Passport", es: "Pasaporte" },
            isUsedInProfileName: false,
            alias: "p_passport_document",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Passport number", es: "Número de pasaporte" },
            isUsedInProfileName: false,
            alias: "p_passport_number",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Is PEP?", es: "¿Es PRP?" },
            isUsedInProfileName: false,
            alias: "p_is_pep",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Risk", es: "Riesgo" },
            isUsedInProfileName: false,
            alias: "p_risk",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Risk assessment", es: "Evaluación de riesgo" },
            isUsedInProfileName: false,
            alias: "p_risk_assessment",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "TEXT",
            name: { en: "Source of funds", es: "Orígen de los fondos" },
            isUsedInProfileName: false,
            alias: "p_source_of_funds",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "BACKGROUND_CHECK",
            name: { en: "Background check", es: "Búsqueda en listados" },
            isUsedInProfileName: false,
            alias: "p_background_check",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Occupation", es: "Ocupación" },
            isUsedInProfileName: false,
            alias: "p_occupation",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Power of attorney", es: "Poder de representación" },
            isUsedInProfileName: false,
            alias: "p_poa",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Position", es: "Cargo" },
            isUsedInProfileName: false,
            alias: "p_position",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Client status", es: "Estado cliente" },
            isUsedInProfileName: false,
            alias: "p_client_status",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Marital status", es: "Estado civil" },
            isUsedInProfileName: false,
            alias: "p_marital_status",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "CHECKBOX",
            name: { en: "Relationship", es: "Relación" },
            isUsedInProfileName: false,
            alias: "p_relationship",
            isStandard: true,
          },
        ],
      });

      const newProfileTypeId = fromGlobalId(data.createProfileType.id, "ProfileType").id;
      const profileRelationshipTypes = await mocks.knex
        .from("profile_relationship_type")
        .where("org_id", organization.id)
        .where("deleted_at", null)
        .select("id", "alias");

      const relationshipsByAlias = indexBy(profileRelationshipTypes, (r) => r.alias);
      const dbAllowedRelationships = await mocks.knex
        .from("profile_relationship_type_allowed_profile_type")
        .where("org_id", organization.id)
        .where("deleted_at", null)
        .where("allowed_profile_type_id", newProfileTypeId)
        .select("*");
      expect(dbAllowedRelationships).toHaveLength(18);
      expect(
        dbAllowedRelationships.map(pick(["direction", "profile_relationship_type_id"])),
      ).toIncludeSameMembers([
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_parent__child"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_parent__child"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_family_member"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_family_member"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_close_associate"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_close_associate"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_spouse"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_spouse"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id:
            relationshipsByAlias["p_legal_representative__legally_represented"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id:
            relationshipsByAlias["p_legal_representative__legally_represented"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id:
            relationshipsByAlias["p_legal_guardian__legally_guarded"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id:
            relationshipsByAlias["p_legal_guardian__legally_guarded"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_director__managed_by"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id:
            relationshipsByAlias["p_shareholder__participated_in_by"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id:
            relationshipsByAlias["p_beneficial_owner__direct_or_indirect_property"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_contract__counterparty"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
        },
      ]);
    });

    it("creates a new profile type based on an LEGAL_ENTITY standard type, and sets allowed relationships with current standard types", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $name: LocalizableUserText!
            $pluralName: LocalizableUserText!
            $standardType: ProfileTypeStandardType
          ) {
            createProfileType(name: $name, pluralName: $pluralName, standardType: $standardType) {
              id
              name
              pluralName
              standardType
              isStandard
              fields {
                id
                type
                name
                isUsedInProfileName
                alias
                isStandard
              }
            }
          }
        `,
        {
          name: { en: "My Legal Entity", es: "Mi Entidad Legal" },
          pluralName: { en: "My Legal Entities", es: "Mis Entidades Legales" },
          standardType: "LEGAL_ENTITY",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileType).toEqual({
        id: expect.any(String),
        name: { en: "My Legal Entity", es: "Mi Entidad Legal" },
        pluralName: { en: "My Legal Entities", es: "Mis Entidades Legales" },
        standardType: "LEGAL_ENTITY",
        isStandard: true,
        fields: [
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Entity name", es: "Denominación social" },
            isUsedInProfileName: true,
            alias: "p_entity_name",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Trade name", es: "Nombre comercial" },
            isUsedInProfileName: false,
            alias: "p_trade_name",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Entity type", es: "Tipo de Entidad" },
            isUsedInProfileName: false,
            alias: "p_entity_type",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Registration number", es: "Número de registro" },
            isUsedInProfileName: false,
            alias: "p_registration_number",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Tax ID", es: "Número de identificación fiscal" },
            isUsedInProfileName: false,
            alias: "p_tax_id",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Registered address", es: "Domicilio social" },
            isUsedInProfileName: false,
            alias: "p_registered_address",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "PHONE",
            name: { en: "Phone number", es: "Teléfono" },
            isUsedInProfileName: false,
            alias: "p_phone_number",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "City", es: "Ciudad" },
            isUsedInProfileName: false,
            alias: "p_city",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "ZIP Code", es: "Código postal" },
            isUsedInProfileName: false,
            alias: "p_zip",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Country", es: "País" },
            isUsedInProfileName: false,
            alias: "p_country",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Country of incorporation", es: "País de constitución" },
            isUsedInProfileName: false,
            alias: "p_country_of_incorporation",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "DATE",
            name: { en: "Date of incorporation", es: "Fecha de constitución" },
            isUsedInProfileName: false,
            alias: "p_date_of_incorporation",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Main business activity", es: "Actividad comercial principal" },
            isUsedInProfileName: false,
            alias: "p_main_business_activity",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Ownership structure", es: "Estructura de propiedad" },
            isUsedInProfileName: false,
            alias: "p_ownership_structure",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "UBO statement", es: "Acta de titularidad real" },
            isUsedInProfileName: false,
            alias: "p_ubo_statement",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Financial statements", es: "Estados financieros" },
            isUsedInProfileName: false,
            alias: "p_financial_statements",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Risk", es: "Riesgo" },
            isUsedInProfileName: false,
            alias: "p_risk",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Risk assessment", es: "Evaluación de riesgo" },
            isUsedInProfileName: false,
            alias: "p_risk_assessment",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Power of attorney types", es: "Tipos de Poderes" },
            isUsedInProfileName: false,
            alias: "p_poa_types",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Power of attorney scope", es: "Alcance del Poder" },
            isUsedInProfileName: false,
            alias: "p_poa_scope",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Power of attorney document", es: "Documento del poder de representación" },
            isUsedInProfileName: false,
            alias: "p_poa_document",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "DATE",
            name: {
              en: "Effective date of power of attorney",
              es: "Fecha de inicio del poder",
            },
            isUsedInProfileName: false,
            alias: "p_poa_effective_date",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "DATE",
            name: {
              en: "Expiration date of power of attorney",
              es: "Fecha de vencimiento del poder",
            },
            isUsedInProfileName: false,
            alias: "p_poa_expiration_date",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Revocation conditions", es: "Condiciones de revocación" },
            isUsedInProfileName: false,
            alias: "p_poa_revocation_conditions",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Registered power of attorney", es: "Poder de representación registrado" },
            isUsedInProfileName: false,
            alias: "p_poa_registered",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "BACKGROUND_CHECK",
            name: { en: "Background check", es: "Búsqueda en listados" },
            isUsedInProfileName: false,
            alias: "p_background_check",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: {
              en: "Tax identification document",
              es: "Código de identificación fiscal (documento)",
            },
            isUsedInProfileName: false,
            alias: "p_tax_id_document",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Deed of incorporation", es: "Escritura de constitución" },
            isUsedInProfileName: false,
            alias: "p_deed_incorporation",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Bylaws", es: "Estatutos sociales" },
            isUsedInProfileName: false,
            alias: "p_bylaws",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Client status", es: "Estado cliente" },
            isUsedInProfileName: false,
            alias: "p_client_status",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "CHECKBOX",
            name: { en: "Relationship", es: "Relación" },
            isUsedInProfileName: false,
            alias: "p_relationship",
            isStandard: true,
          },
        ],
      });

      const newProfileTypeId = fromGlobalId(data.createProfileType.id, "ProfileType").id;

      const profileRelationshipTypes = await mocks.knex
        .from("profile_relationship_type")
        .where("org_id", organization.id)
        .where("deleted_at", null)
        .select("id", "alias");
      const relationshipsByAlias = indexBy(profileRelationshipTypes, (r) => r.alias);
      const dbAllowedRelationships = await mocks.knex
        .from("profile_relationship_type_allowed_profile_type")
        .where("org_id", organization.id)
        .where("deleted_at", null)
        .where("allowed_profile_type_id", newProfileTypeId)
        .select("*");
      expect(dbAllowedRelationships).toHaveLength(14);
      expect(
        dbAllowedRelationships.map(pick(["direction", "profile_relationship_type_id"])),
      ).toIncludeSameMembers([
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id:
            relationshipsByAlias["p_legal_representative__legally_represented"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id:
            relationshipsByAlias["p_legal_representative__legally_represented"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_director__managed_by"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id:
            relationshipsByAlias["p_shareholder__participated_in_by"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id:
            relationshipsByAlias["p_shareholder__participated_in_by"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id:
            relationshipsByAlias["p_beneficial_owner__direct_or_indirect_property"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_contract__counterparty"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_parent_company__subsidiary"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_parent_company__subsidiary"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_main_office__branch_office"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_main_office__branch_office"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_associated_company"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_associated_company"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
        },
      ]);
    });

    it("creates a new profile type based on an CONTRACT standard type, and sets allowed relationships with current standard types", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $name: LocalizableUserText!
            $pluralName: LocalizableUserText!
            $standardType: ProfileTypeStandardType
          ) {
            createProfileType(name: $name, pluralName: $pluralName, standardType: $standardType) {
              id
              name
              pluralName
              standardType
              isStandard
              fields {
                id
                type
                name
                isUsedInProfileName
                alias
                isStandard
              }
            }
          }
        `,
        {
          name: { en: "My Contract", es: "Mi Contrato" },
          pluralName: { en: "My Contracts", es: "Mis Contratos" },
          standardType: "CONTRACT",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileType).toEqual({
        id: expect.any(String),
        name: { en: "My Contract", es: "Mi Contrato" },
        pluralName: { en: "My Contracts", es: "Mis Contratos" },
        standardType: "CONTRACT",
        isStandard: true,
        fields: [
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Counterparty", es: "Contraparte" },
            isUsedInProfileName: true,
            alias: "p_counterparty",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Contract type", es: "Tipo de contrato" },
            isUsedInProfileName: true,
            alias: "p_contract_type",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "DATE",
            name: { en: "Effective date", es: "Fecha de inicio" },
            isUsedInProfileName: false,
            alias: "p_effective_date",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "DATE",
            name: { en: "Expiration date", es: "Fecha de vencimiento" },
            isUsedInProfileName: false,
            alias: "p_expiration_date",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Jurisdiction", es: "Jurisdicción" },
            isUsedInProfileName: false,
            alias: "p_jurisdiction",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "NUMBER",
            name: { en: "Contract value", es: "Valor del contrato" },
            isUsedInProfileName: false,
            alias: "p_contract_value",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Currency", es: "Moneda" },
            isUsedInProfileName: false,
            alias: "p_contract_currency",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Payment terms", es: "Términos de pago" },
            isUsedInProfileName: false,
            alias: "p_payment_terms",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Renewal terms", es: "Términos de renovación" },
            isUsedInProfileName: false,
            alias: "p_renewal_terms",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Original document", es: "Documento original" },
            isUsedInProfileName: false,
            alias: "p_original_document",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "FILE",
            name: { en: "Amendments", es: "Enmiendas" },
            isUsedInProfileName: false,
            alias: "p_amendments",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Termination clauses", es: "Cláusulas de terminación" },
            isUsedInProfileName: false,
            alias: "p_termination_clauses",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SELECT",
            name: { en: "Confidentiality agreement", es: "Acuerdo de confidencialidad" },
            isUsedInProfileName: false,
            alias: "p_confidentiality_agreement",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Performance metrics", es: "Métricas de desempeño" },
            isUsedInProfileName: false,
            alias: "p_performance_metrics",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Dispute resolution mechanism", es: "Mecanismo de resolución de disputas" },
            isUsedInProfileName: false,
            alias: "p_dispute_resolution_mechanism",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Compliance obligations", es: "Obligaciones de cumplimiento" },
            isUsedInProfileName: false,
            alias: "p_compliance_obligations",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Security provisions", es: "Provisiones de seguridad" },
            isUsedInProfileName: false,
            alias: "p_security_provisions",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "TEXT",
            name: { en: "Notes", es: "Notas" },
            isUsedInProfileName: false,
            alias: "p_notes",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: {
              en: "Billing contact full name",
              es: "Nombre completo del contacto de facturación",
            },
            isUsedInProfileName: false,
            alias: "p_billing_contact_full_name",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: {
              en: "Billing contact email",
              es: "Correo electrónico del contacto de facturación",
            },
            isUsedInProfileName: false,
            alias: "p_billing_contact_email",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Legal contact full name", es: "Nombre completo del contacto de legal" },
            isUsedInProfileName: false,
            alias: "p_legal_contact_full_name",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "SHORT_TEXT",
            name: { en: "Legal contact email", es: "Correo electrónico del contacto de legal" },
            isUsedInProfileName: false,
            alias: "p_legal_contact_email",
            isStandard: true,
          },
          {
            id: expect.any(String),
            type: "DATE",
            name: { en: "Signature date", es: "Fecha de firma" },
            isUsedInProfileName: false,
            alias: "p_signature_date",
            isStandard: true,
          },
        ],
      });

      const newProfileTypeId = fromGlobalId(data.createProfileType.id, "ProfileType").id;
      const relationships = await mocks.knex
        .from("profile_relationship_type")
        .where("org_id", organization.id)
        .where("deleted_at", null)
        .select("id", "alias");
      const relationshipsByAlias = indexBy(relationships, (r) => r.alias);
      const dbAllowedRelationships = await mocks.knex
        .from("profile_relationship_type_allowed_profile_type")
        .where("org_id", organization.id)
        .where("deleted_at", null)
        .where("allowed_profile_type_id", newProfileTypeId)
        .select("*");
      expect(dbAllowedRelationships).toHaveLength(5);
      expect(
        dbAllowedRelationships.map(pick(["direction", "profile_relationship_type_id"])),
      ).toIncludeSameMembers([
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_contract__counterparty"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_main_contract__annex"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_main_contract__annex"].id,
        },
        {
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipsByAlias["p_addendum__amended_by"].id,
        },
        {
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipsByAlias["p_addendum__amended_by"].id,
        },
      ]);
    });
  });

  describe("updateProfileType", () => {
    it("updates a profile type", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $name: LocalizableUserText!) {
            updateProfileType(profileTypeId: $profileTypeId, name: $name) {
              id
              name
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          name: { en: "updated name" },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[1].id),
        name: { en: "updated name" },
      });
    });

    it("fails when normal user tries to update a profile type", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($profileTypeId: GID!, $name: LocalizableUserText!) {
            updateProfileType(profileTypeId: $profileTypeId, name: $name) {
              id
              name
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          name: { en: "updated name" },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("creates a task to update profile names when changing the profile name pattern", async () => {
      async function createIndividualProfile(firstName?: string, lastName?: string, risk?: string) {
        await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
            fields: [
              ...(firstName
                ? [
                    {
                      profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
                      content: { value: firstName },
                    },
                  ]
                : []),
              ...(lastName
                ? [
                    {
                      profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
                      content: { value: lastName },
                    },
                  ]
                : []),
              ...(risk
                ? [
                    {
                      profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
                      content: { value: risk },
                    },
                  ]
                : []),
            ],
          },
        );
      }
      await createIndividualProfile("Mickey", "Mouse", "low");
      await createIndividualProfile("Donald", "Duck", "low");
      await createIndividualProfile("Trump", "", "high");
      await createIndividualProfile("", "Obama", "medium");
      await createIndividualProfile();

      const { data } = await testClient.execute(
        gql`
          query ($limit: Int, $offset: Int, $sortBy: [QueryProfiles_OrderBy!]) {
            profiles(limit: $limit, offset: $offset, sortBy: $sortBy) {
              totalCount
              items {
                id
                name
              }
            }
          }
        `,
        {
          limit: 10,
          offset: 0,
          sortBy: ["name_DESC"],
          locale: "en",
        },
      );
      expect(data.profiles).toEqual({
        totalCount: 5,
        items: [
          { id: expect.any(String), name: "Trump  (High risk)" },
          { id: expect.any(String), name: "Obama (Medium risk)" },
          { id: expect.any(String), name: "Mickey Mouse (Low risk)" },
          { id: expect.any(String), name: "Donald Duck (Low risk)" },
          { id: expect.any(String), name: "" },
        ],
      });
      const firstName = toGlobalId("ProfileTypeField", profileType0Fields[0].id);
      const lastName = toGlobalId("ProfileTypeField", profileType0Fields[1].id);
      const { errors, data: data2 } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileNamePattern: String!) {
            updateProfileType(
              profileTypeId: $profileTypeId
              profileNamePattern: $profileNamePattern
            ) {
              id
              profileNamePattern
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileNamePattern: `{{${lastName}}}, {{${firstName}}}`,
        },
      );

      expect(errors).toBeUndefined();

      const dbTask = await mocks.knex
        .from("task")
        .where("name", "PROFILE_NAME_PATTERN_UPDATED")
        .select("*");

      expect(dbTask).toHaveLength(1);
      expect(dbTask[0]).toMatchObject({
        name: "PROFILE_NAME_PATTERN_UPDATED",
        input: {
          profile_type_id: profileTypes[0].id,
        },
        user_id: sessionUser.id,
        processed_at: null,
      });

      expect(data2.updateProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        profileNamePattern: `{{ ${lastName} }}, {{ ${firstName} }}`,
      });
    });

    it("fails when passing a profile name pattern whit invalid fields in it", async () => {
      const phoneField = toGlobalId("ProfileTypeField", profileType0Fields[3].id);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileNamePattern: String!) {
            updateProfileType(
              profileTypeId: $profileTypeId
              profileNamePattern: $profileNamePattern
            ) {
              id
              profileNamePattern
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileNamePattern: `{{${phoneField}}}`,
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_NAME_PATTERN");
      expect(data).toBeNull();
    });

    it("fails when passing a profile name pattern without fields in it", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileNamePattern: String!) {
            updateProfileType(
              profileTypeId: $profileTypeId
              profileNamePattern: $profileNamePattern
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileNamePattern: "Hello",
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_NAME_PATTERN");
      expect(data).toBeNull();
    });

    it("fails when using a HIDDEN field in the profile name pattern", async () => {
      await mocks.knex.from("profile_type_field").where("id", profileType0Fields[0].id).update({
        permission: "HIDDEN",
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileNamePattern: String!) {
            updateProfileType(
              profileTypeId: $profileTypeId
              profileNamePattern: $profileNamePattern
            ) {
              id
              profileNamePattern
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileNamePattern: `{{ ${toGlobalId("ProfileTypeField", profileType0Fields[0].id)} }}`,
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_NAME_PATTERN");
      expect(data).toBeNull();
    });

    it("updates the name of a standard profile type", async () => {
      const [standardProfileType] = await mocks.createRandomProfileTypes(
        organization.id,
        1,
        () => ({
          name: json({ en: "Standard", es: "Standard" }),
          standard_type: "CONTRACT",
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $name: LocalizableUserText!) {
            updateProfileType(profileTypeId: $profileTypeId, name: $name) {
              id
              name
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", standardProfileType.id),
          name: { en: "Updated name" },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileType).toEqual({
        id: toGlobalId("ProfileType", standardProfileType.id),
        name: { en: "Updated name" },
      });
    });

    it("updates fields 'isUsedInProfileName' when changing the profile name pattern", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileNamePattern: String) {
            updateProfileType(
              profileTypeId: $profileTypeId
              profileNamePattern: $profileNamePattern
            ) {
              id
              fields {
                alias
                isUsedInProfileName
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileNamePattern: `CLIENT {{ ${toGlobalId("ProfileTypeField", profileType0Fields[0].id)} }} ({{ ${toGlobalId("ProfileTypeField", profileType0Fields[5].id)} }})`,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        fields: [
          {
            alias: "FIRST_NAME",
            isUsedInProfileName: true,
          },
          {
            alias: "LAST_NAME",
            isUsedInProfileName: false,
          },
          {
            alias: "BIRTH_DATE",
            isUsedInProfileName: false,
          },
          {
            alias: "PHONE",
            isUsedInProfileName: false,
          },
          {
            alias: "EMAIL",
            isUsedInProfileName: false,
          },
          {
            alias: "PASSPORT",
            isUsedInProfileName: true,
          },
          {
            alias: "RISK",
            isUsedInProfileName: false,
          },
          {
            alias: "GENDER",
            isUsedInProfileName: false,
          },
          {
            alias: "BACKGROUND_CHECK",
            isUsedInProfileName: false,
          },
        ],
      });
    });
  });

  describe("cloneProfileType", () => {
    // TODO UNIQUE
    it("clones a profile type", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $name: LocalizableUserText) {
            cloneProfileType(profileTypeId: $profileTypeId, name: $name) {
              id
              name
              icon
              profileNamePattern
              fields {
                id
                name
                alias
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          name: { en: "cloned profile" },
        },
      );

      expect(errors).toBeUndefined();
      expect(data.cloneProfileType).toEqual({
        id: expect.any(String),
        name: { en: "cloned profile" },
        icon: "PERSON",
        profileNamePattern: expect.anything(),
        fields: profileType0Fields.map((f) => ({
          id: expect.any(String),
          name: f.name,
          alias: f.alias,
        })),
      });
      expect(data.cloneProfileType.profileNamePattern).toEqual(
        `{{ ${data.cloneProfileType.fields[0].id} }} {{ ${data.cloneProfileType.fields[1].id} }} ({{ ${data.cloneProfileType.fields[6].id} }} risk)`,
      );
    });

    it("cloning a standard profile type makes it mutable", async () => {
      const [standardProfileType] = await mocks.createRandomProfileTypes(
        organization.id,
        1,
        () => ({
          name: json({ en: "Standard", es: "Standard" }),
          standard_type: "CONTRACT",
        }),
      );

      await mocks.createRandomProfileTypeFields(
        organization.id,
        standardProfileType.id,
        3,
        (i) => ({
          alias: `p_${i}`,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            cloneProfileType(profileTypeId: $profileTypeId) {
              isStandard
              fields {
                isStandard
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", standardProfileType.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.cloneProfileType).toEqual({
        isStandard: false,
        fields: [{ isStandard: false }, { isStandard: false }, { isStandard: false }],
      });
    });

    it("creates a new view on the cloned profile type", async () => {
      const { errors: createErrors, data: createData } = await testClient.execute(
        gql`
          mutation ($name: LocalizableUserText!, $pluralName: LocalizableUserText!) {
            createProfileType(name: $name, pluralName: $pluralName) {
              id
            }
          }
        `,
        { name: { en: "Individual" }, pluralName: { en: "Individuals" } },
      );

      expect(createErrors).toBeUndefined();
      expect(createData?.createProfileType).toEqual({
        id: expect.any(String),
      });

      const { errors: cloneErrors, data: cloneData } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            cloneProfileType(profileTypeId: $profileTypeId) {
              id
            }
          }
        `,
        {
          profileTypeId: createData.createProfileType.id,
        },
      );

      expect(cloneErrors).toBeUndefined();
      expect(cloneData?.cloneProfileType).toEqual({
        id: expect.any(String),
      });

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileTypeId: GID!) {
            me {
              profileListViews(profileTypeId: $profileTypeId) {
                type
                isDefault
                data {
                  columns
                  search
                  sort {
                    __typename
                  }
                }
                profileType {
                  id
                }
              }
            }
          }
        `,
        { profileTypeId: cloneData.cloneProfileType.id },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData).toEqual({
        me: {
          profileListViews: [
            {
              type: "ALL",
              isDefault: false,
              data: {
                columns: null,
                search: null,
                sort: null,
              },
              profileType: { id: cloneData.cloneProfileType.id },
            },
          ],
        },
      });
    });
  });

  describe("archiveProfileType", () => {
    it("archives multiple profile types", async () => {
      const { errors: archiveErrors, data: archiveData } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            archiveProfileType(profileTypeIds: $profileTypeIds) {
              id
              archivedAt
              archivedBy {
                id
              }
            }
          }
        `,
        {
          profileTypeIds: [
            toGlobalId("ProfileType", profileTypes[1].id),
            toGlobalId("ProfileType", profileTypes[2].id),
          ],
        },
      );

      expect(archiveErrors).toBeUndefined();
      expect(archiveData?.archiveProfileType).toIncludeSameMembers([
        {
          id: toGlobalId("ProfileType", profileTypes[1].id),
          archivedAt: expect.any(Date),
          archivedBy: { id: toGlobalId("User", sessionUser.id) },
        },
        {
          id: toGlobalId("ProfileType", profileTypes[2].id),
          archivedAt: expect.any(Date),
          archivedBy: { id: toGlobalId("User", sessionUser.id) },
        },
      ]);
    });

    it("does not unpin profile type when archiving it", async () => {
      await mocks.knex
        .from("user_profile_type_pinned")
        .insert({ user_id: sessionUser.id, profile_type_id: profileTypes[0].id });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            archiveProfileType(profileTypeIds: $profileTypeIds) {
              id
              isPinned
              archivedAt
            }
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", profileTypes[0].id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveProfileType).toEqual([
        {
          id: toGlobalId("ProfileType", profileTypes[0].id),
          isPinned: true,
          archivedAt: expect.any(Date),
        },
      ]);
    });
  });

  describe("unarchiveProfileType", () => {
    it("unarchives multiple profile types", async () => {
      const { errors: archiveErrors, data: archiveData } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            archiveProfileType(profileTypeIds: $profileTypeIds) {
              id
            }
          }
        `,
        {
          profileTypeIds: [
            toGlobalId("ProfileType", profileTypes[1].id),
            toGlobalId("ProfileType", profileTypes[2].id),
          ],
        },
      );

      expect(archiveErrors).toBeUndefined();
      expect(archiveData?.archiveProfileType).toIncludeSameMembers([
        { id: toGlobalId("ProfileType", profileTypes[1].id) },
        { id: toGlobalId("ProfileType", profileTypes[2].id) },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            unarchiveProfileType(profileTypeIds: $profileTypeIds) {
              id
            }
          }
        `,
        {
          profileTypeIds: [
            toGlobalId("ProfileType", profileTypes[1].id),
            toGlobalId("ProfileType", profileTypes[2].id),
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.unarchiveProfileType).toIncludeSameMembers([
        { id: toGlobalId("ProfileType", profileTypes[1].id) },
        { id: toGlobalId("ProfileType", profileTypes[2].id) },
      ]);
    });
  });

  describe("deleteProfileType", () => {
    let petition: Petition;
    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
    });
    afterAll(async () => {
      await mocks.knex.from("petition_field").where("petition_id", petition.id).delete();
    });

    it("fails try to delete a profile type before archive it", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            deleteProfileType(profileTypeIds: $profileTypeIds)
          }
        `,
        {
          profileTypeIds: [
            toGlobalId("ProfileType", profileTypes[1].id),
            toGlobalId("ProfileType", profileTypes[2].id),
          ],
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("deletes multiple profile types and its corresponding fields", async () => {
      const { errors: archiveErrors, data: archiveData } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            archiveProfileType(profileTypeIds: $profileTypeIds) {
              id
            }
          }
        `,
        {
          profileTypeIds: [
            toGlobalId("ProfileType", profileTypes[1].id),
            toGlobalId("ProfileType", profileTypes[2].id),
          ],
        },
      );

      expect(archiveErrors).toBeUndefined();
      expect(archiveData?.archiveProfileType).toIncludeSameMembers([
        { id: toGlobalId("ProfileType", profileTypes[1].id) },
        { id: toGlobalId("ProfileType", profileTypes[2].id) },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            deleteProfileType(profileTypeIds: $profileTypeIds)
          }
        `,
        {
          profileTypeIds: [
            toGlobalId("ProfileType", profileTypes[1].id),
            toGlobalId("ProfileType", profileTypes[2].id),
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfileType).toEqual("SUCCESS");

      const dbProfileTypes = await mocks.knex
        .from<ProfileType>("profile_type")
        .whereIn("id", [profileTypes[1].id, profileTypes[2].id])
        .select("*");

      const dbProfileTypeFields = await mocks.knex
        .from<ProfileTypeField>("profile_type_field")
        .whereIn("profile_type_id", [profileTypes[1].id, profileTypes[2].id])
        .select("*");

      expect(dbProfileTypes.every((t) => t.deleted_at !== null)).toEqual(true);
      expect(dbProfileTypeFields.every((f) => f.deleted_at !== null)).toEqual(true);

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($limit: Int, $offset: Int, $sortBy: [QueryProfileTypes_OrderBy!]) {
            profileTypes(limit: $limit, offset: $offset, sortBy: $sortBy) {
              totalCount
              items {
                id
                name
                fields {
                  position
                }
              }
            }
          }
        `,
        {
          limit: 10,
          offset: 0,
          sortBy: ["createdAt_ASC"],
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profileTypes).toEqual({
        totalCount: 3,
        items: [
          {
            id: toGlobalId("ProfileType", profileTypes[0].id),
            name: { en: "Individual", es: "Persona física" },
            fields: profileType0Fields.map((f, i) => ({ position: i })),
          },
          {
            id: toGlobalId("ProfileType", profileTypes[3].id),
            name: { en: "Expirable fields", es: "Campos con expiración" },
            fields: profileType3Fields.map((f, i) => ({ position: i })),
          },
          {
            id: toGlobalId("ProfileType", profileTypes[4].id),
            name: { en: "Unique fields", es: "Campos únicos" },
            fields: profileType4Fields.map((f, i) => ({ position: i })),
          },
        ],
      });
    });

    it("fails when normal user tries to delete a profile type", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            deleteProfileType(profileTypeIds: $profileTypeIds)
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", profileTypes[0].id)],
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("unpins a profile type when deleting it", async () => {
      const [profileType] = await mocks.createRandomProfileTypes(organization.id, 1, () => ({
        archived_at: new Date(),
        archived_by_user_id: sessionUser.id,
      }));

      await mocks.knex
        .from("user_profile_type_pinned")
        .insert({ user_id: sessionUser.id, profile_type_id: profileType.id });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            deleteProfileType(profileTypeIds: $profileTypeIds)
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", profileType.id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfileType).toEqual("SUCCESS");

      const dbPinned = await mocks.knex
        .from("user_profile_type_pinned")
        .where({ profile_type_id: profileType.id })
        .select("*");

      expect(dbPinned).toHaveLength(0);
    });

    it("deletes every view on the deleted profile type", async () => {
      const profileTypes = await mocks.createRandomProfileTypes(organization.id, 3, () => ({
        archived_at: new Date(),
        archived_by_user_id: sessionUser.id,
      }));
      const users = await mocks.createRandomUsers(organization.id, 4);
      const views = await mocks.knex.from("profile_list_view").insert(
        [sessionUser.id, ...users.map((u) => u.id)].flatMap((userId) =>
          profileTypes.map((pt) => ({
            user_id: userId,
            profile_type_id: pt.id,
            name: "",
            data: {
              columns: null,
              search: null,
              sort: null,
            },
            position: 0,
            view_type: "ALL",
            is_default: false,
          })),
        ),
        "*",
      );

      const { errors } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            deleteProfileType(profileTypeIds: $profileTypeIds)
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", profileTypes[0].id)],
        },
      );

      expect(errors).toBeUndefined();

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileTypeId: GID!) {
            me {
              profileListViews(profileTypeId: $profileTypeId) {
                id
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.me).toEqual({
        profileListViews: [],
      });

      const updatedDbViews = await mocks.knex
        .from("profile_list_view")
        .whereIn(
          "id",
          views.map((v) => v.id),
        )
        .select("*");

      expect(
        updatedDbViews.map(pick(["profile_type_id", "user_id", "deleted_at"])),
      ).toIncludeSameMembers(
        [sessionUser.id, ...users.map((u) => u.id)].flatMap((userId) =>
          profileTypes.map((pt) => ({
            profile_type_id: pt.id,
            user_id: userId,
            deleted_at: pt.id === profileTypes[0].id ? expect.any(Date) : null,
          })),
        ),
      );
    });

    it("removes FIELD_GROUP associations with the deleted profile type", async () => {
      const fieldGroups = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        type: "FIELD_GROUP",
        profile_type_id: profileTypes[i].id,
      }));
      const children = [
        ...(await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
          parent_petition_field_id: fieldGroups[0].id,
          profile_type_field_id: profileType0Fields[i].id,
          type: "SHORT_TEXT",
        }))),
        ...(await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
          parent_petition_field_id: fieldGroups[1].id,
          profile_type_field_id: profileType1Fields[i].id,
          type: "SHORT_TEXT",
        }))),
      ];

      await mocks.knex
        .from("profile_type")
        .update({
          archived_at: new Date(),
          archived_by_user_id: sessionUser.id,
        })
        .where("id", profileTypes[0].id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            deleteProfileType(profileTypeIds: $profileTypeIds)
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", profileTypes[0].id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfileType).toEqual("SUCCESS");

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($id: GID!) {
            petition(id: $id) {
              fields {
                id
                type
                profileType {
                  id
                }
                children {
                  id
                  type
                  profileTypeField {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          id: toGlobalId("Petition", petition.id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.petition).toEqual({
        fields: [
          {
            id: toGlobalId("PetitionField", fieldGroups[0].id),
            type: "FIELD_GROUP",
            profileType: null,
            children: children.slice(0, 3).map((c) => ({
              id: toGlobalId("PetitionField", c.id),
              type: c.type,
              profileTypeField: null,
            })),
          },
          {
            id: toGlobalId("PetitionField", fieldGroups[1].id),
            type: "FIELD_GROUP",
            profileType: {
              id: toGlobalId("ProfileType", profileTypes[1].id),
            },
            children: children.slice(3, 6).map((c, i) => ({
              id: toGlobalId("PetitionField", c.id),
              type: c.type,
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", profileType1Fields[i].id),
              },
            })),
          },
        ],
      });

      const dbFieldGroups = await mocks.knex
        .from("petition_field")
        .whereIn(
          "id",
          fieldGroups.map((fg) => fg.id),
        )
        .select("id", "type", "profile_type_id");

      expect(dbFieldGroups.map(pick(["id", "type", "profile_type_id"]))).toIncludeSameMembers([
        { id: fieldGroups[0].id, type: "FIELD_GROUP", profile_type_id: null },
        { id: fieldGroups[1].id, type: "FIELD_GROUP", profile_type_id: profileTypes[1].id },
      ]);

      const dbChildren = await mocks.knex
        .from("petition_field")
        .whereIn(
          "id",
          children.map((c) => c.id),
        )
        .select("id", "type", "profile_type_field_id");

      expect(dbChildren.map(pick(["id", "type", "profile_type_field_id"]))).toIncludeSameMembers([
        ...children
          .slice(0, 3)
          .map((c) => ({ id: c.id, type: c.type, profile_type_field_id: null })),
        ...children.slice(3, 6).map((c, i) => ({
          id: c.id,
          type: c.type,
          profile_type_field_id: profileType1Fields[i].id,
        })),
      ]);
    });

    it("deletes allowed relationships when deleting a profile type", async () => {
      const relationships = await mocks.knex.from("profile_relationship_type").insert(
        ["rel_1", "rel_2", "rel_3"].map((alias) => ({
          alias,
          org_id: organization.id,
          left_right_name: { en: "Left Right" },
          right_left_name: { en: "Right Left" },
          is_reciprocal: false,
        })),
        "*",
      );
      const relationshipsByAlias = indexBy(relationships, (r) => r.alias);
      await mocks.knex.from("profile_relationship_type_allowed_profile_type").insert([
        {
          org_id: organization.id,
          profile_relationship_type_id: relationshipsByAlias["rel_1"].id,
          allowed_profile_type_id: profileTypes[0].id,
          direction: "LEFT_RIGHT",
        },
        {
          org_id: organization.id,
          profile_relationship_type_id: relationshipsByAlias["rel_2"].id,
          allowed_profile_type_id: profileTypes[0].id,
          direction: "LEFT_RIGHT",
        },
        {
          org_id: organization.id,
          profile_relationship_type_id: relationshipsByAlias["rel_3"].id,
          allowed_profile_type_id: profileTypes[1].id,
          direction: "LEFT_RIGHT",
        },
      ]);

      await mocks.knex
        .from("profile_type")
        .update({
          archived_at: new Date(),
          archived_by_user_id: sessionUser.id,
        })
        .where("id", profileTypes[0].id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            deleteProfileType(profileTypeIds: $profileTypeIds)
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", profileTypes[0].id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfileType).toEqual("SUCCESS");

      const dbAllowedRelationships = await mocks.knex
        .from("profile_relationship_type_allowed_profile_type")
        .where("org_id", organization.id)
        .where("allowed_profile_type_id", profileTypes[0].id)
        .select("*");
      expect(dbAllowedRelationships).toHaveLength(2);
      expect(dbAllowedRelationships.map(pick(["deleted_at"]))).toEqual([
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
      ]);
    });

    it("sends error if a subscription on the profile type exists for any user", async () => {
      const [otherUser] = await mocks.createRandomUsers(organization.id);
      await mocks.knex.from("event_subscription").insert([
        {
          type: "PROFILE",
          endpoint: "https://www.example.com",
          from_profile_type_id: profileTypes[0].id,
          user_id: otherUser.id,
          event_types: json(["PROFILE_CREATED"]),
          is_enabled: false,
          name: "test",
        },
        {
          type: "PROFILE",
          endpoint: "https://www.example.com",
          from_profile_type_id: null,
          user_id: sessionUser.id,
          event_types: json(["PROFILE_CLOSED"]),
          is_enabled: true,
          name: "test",
        },
      ]);

      await mocks.knex
        .from("profile_type")
        .update({
          archived_at: new Date(),
          archived_by_user_id: sessionUser.id,
        })
        .where("id", profileTypes[0].id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            deleteProfileType(profileTypeIds: $profileTypeIds)
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", profileTypes[0].id)],
        },
      );

      expect(errors).toContainGraphQLError("EVENT_SUBSCRIPTION_EXISTS_ERROR", {
        count: 1,
      });
      expect(data).toBeNull();
    });

    it("removes event subscription on the profile type if passing force flag", async () => {
      const [otherUser] = await mocks.createRandomUsers(organization.id);
      await mocks.knex.from("event_subscription").insert([
        {
          type: "PROFILE",
          endpoint: "https://www.example.com",
          from_profile_type_id: profileTypes[0].id,
          user_id: otherUser.id,
          event_types: json(["PROFILE_CREATED"]),
          is_enabled: false,
          name: "test",
        },
        {
          type: "PROFILE",
          endpoint: "https://www.example.com",
          from_profile_type_id: null,
          user_id: sessionUser.id,
          event_types: json(["PROFILE_CLOSED"]),
          is_enabled: true,
          name: "test",
        },
      ]);

      await mocks.knex
        .from("profile_type")
        .update({
          archived_at: new Date(),
          archived_by_user_id: sessionUser.id,
        })
        .where("id", profileTypes[0].id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            deleteProfileType(profileTypeIds: $profileTypeIds, force: true)
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", profileTypes[0].id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfileType).toEqual("SUCCESS");

      const dbEventSubscriptions = await mocks.knex
        .from("event_subscription")
        .where("from_profile_type_id", profileTypes[0].id)
        .whereNull("deleted_at")
        .select("*");
      expect(dbEventSubscriptions).toHaveLength(0);
    });
  });

  describe("createProfileTypeField", () => {
    it("creates a new field on last position", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
              name
              alias
              isExpirable
              expiryAlertAheadTime
              options
              position
              type
              isUsedInProfileName
              profileType {
                id
                fields {
                  position
                }
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          data: {
            alias: "alias",
            isExpirable: true,
            expiryAlertAheadTime: { months: 1 },
            name: { en: "my new field" },
            type: "SHORT_TEXT",
            options: {},
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileTypeField).toEqual({
        id: expect.any(String),
        name: { en: "my new field" },
        alias: "alias",
        isExpirable: true,
        expiryAlertAheadTime: { months: 1 },
        options: {},
        position: 3,
        type: "SHORT_TEXT",
        isUsedInProfileName: false,
        profileType: {
          id: toGlobalId("ProfileType", profileTypes[1].id),
          fields: [{ position: 0 }, { position: 1 }, { position: 2 }, { position: 3 }],
        },
      });
    });

    it("fails when normal user tries to create a profile type field", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: { name: { en: "field" }, type: "TEXT" },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails when creating a field with used alias", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
              alias
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: {
            alias: "LAST_NAME",
            name: { en: "Address", es: "Dirección" },
            type: "TEXT",
          },
        },
      );

      expect(errors).toContainGraphQLError("ALIAS_ALREADY_EXISTS");
      expect(data).toBeNull();
    });

    it("fails when creating a field with unknown option", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          data: {
            alias: "unknown",
            isExpirable: true,
            expiryAlertAheadTime: { months: 1 },
            name: { en: "my new field" },
            type: "TEXT",
            options: { unknown: false },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when creating a BACKGROUND_CHECK field with invalid monitoring frequency", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: {
            name: { en: "Background Check" },
            type: "BACKGROUND_CHECK",
            options: {
              monitoring: {
                searchFrequency: {
                  type: "FIXED",
                  frequency: "1_DAY",
                },
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when creating a BACKGROUND_CHECK field with a non-SELECT field in variable search frequency", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: {
            name: { en: "Background Check" },
            type: "BACKGROUND_CHECK",
            options: {
              monitoring: {
                searchFrequency: {
                  type: "VARIABLE",
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id), // TEXT field
                  options: [{ value: "abc", frequency: "5_YEARS" }],
                },
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when creating a BACKGROUND_CHECK field with a SELECT field of another profileType in variable search frequency", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: {
            name: { en: "Background Check" },
            type: "BACKGROUND_CHECK",
            options: {
              monitoring: {
                searchFrequency: {
                  type: "VARIABLE",
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[3].id), // SELECT field of another profile_type
                  options: [
                    { value: "low", frequency: "5_YEARS" },
                    { value: "medium", frequency: "5_YEARS" },
                    { value: "high", frequency: "5_YEARS" },
                  ],
                },
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when creating a BACKGROUND_CHECK field with an invalid variable search frequency value", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: {
            name: { en: "Background Check" },
            type: "BACKGROUND_CHECK",
            options: {
              monitoring: {
                searchFrequency: {
                  type: "VARIABLE",
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
                  options: [
                    { value: "unknown", frequency: "5_YEARS" },
                    { value: "medium", frequency: "5_YEARS" },
                    { value: "high", frequency: "5_YEARS" },
                  ],
                },
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when creating a BACKGROUND_CHECK field with incomplete values on variable search frequency", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: {
            name: { en: "Background Check" },
            type: "BACKGROUND_CHECK",
            options: {
              monitoring: {
                searchFrequency: {
                  type: "VARIABLE",
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
                  options: [
                    { value: "medium", frequency: "5_YEARS" },
                    { value: "high", frequency: "5_YEARS" },
                  ],
                },
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when creating a BACKGROUND_CHECK field and activationCondition field is not SELECT", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: {
            name: { en: "Background Check" },
            type: "BACKGROUND_CHECK",
            options: {
              monitoring: {
                searchFrequency: {
                  type: "FIXED",
                  frequency: "5_YEARS",
                },
                activationCondition: {
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id), // TEXT type
                  values: ["abc"],
                },
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when creating a BACKGROUND_CHECK field and activationCondition field values are invalid", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: {
            name: { en: "Background Check" },
            type: "BACKGROUND_CHECK",
            options: {
              monitoring: {
                searchFrequency: {
                  type: "FIXED",
                  frequency: "5_YEARS",
                },
                activationCondition: {
                  profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
                  values: ["medium", "higherrrrr"],
                },
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when creating a field with alias starting with p_", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          data: {
            alias: "p_first_name",
            name: { en: "First Name" },
            type: "TEXT",
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("creates a SELECT field with standard countries list", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              options
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          data: {
            name: { en: "Country" },
            type: "SELECT",
            options: { values: [], standardList: "COUNTRIES" },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileTypeField.options.values).toBeArrayOfSize(250);
    });

    it("creates a UNIQUE SHORT_TEXT field on the profile type", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
              type
              isUnique
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          data: {
            isUnique: true,
            name: { en: "ID" },
            type: "SHORT_TEXT",
            options: {},
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileTypeField).toEqual({
        id: expect.any(String),
        type: "SHORT_TEXT",
        isUnique: true,
      });
    });

    it("sends error if new UNIQUE field is not SHORT_TEXT", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $data: CreateProfileTypeFieldInput!) {
            createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
              id
              type
              isUnique
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          data: {
            isUnique: true,
            name: { en: "Date" },
            type: "DATE",
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        message: "Unique fields are only supported for short text fields",
      });
      expect(data).toBeNull();
    });
  });

  describe("updateProfileTypeField", () => {
    let profileTypeField: ProfileTypeField;
    let profileTypeField2: ProfileTypeField;
    let selectProfileTypeField: ProfileTypeField;
    let backgroundCheckProfileTypeField: ProfileTypeField;
    let profileTypeField3: ProfileTypeField;
    let selectWithStandardOptions: ProfileTypeField;
    let checkboxProfileTypeField: ProfileTypeField;

    beforeEach(async () => {
      [
        profileTypeField,
        profileTypeField2,
        profileTypeField3,
        selectProfileTypeField,
        checkboxProfileTypeField,
        backgroundCheckProfileTypeField,
      ] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileTypes[1].id,
        6,
        (i) => ({
          is_expirable: true,
          expiry_alert_ahead_time: mocks.knex.raw(`'1 month'::interval`) as any,
          alias: i === 0 ? "alias" : null,
          type: ["TEXT", "TEXT", "SELECT", "SELECT", "CHECKBOX", "BACKGROUND_CHECK"][
            i
          ] as ProfileTypeFieldType,
          options:
            i === 2 || i === 4
              ? {
                  values: [
                    { value: "AR", label: { es: "Argentina", en: "Argentina" } },
                    { value: "ES", label: { es: "España", en: "Spain" } },
                  ],
                }
              : i === 3
                ? {
                    values: [
                      {
                        label: { en: "Low", es: "Bajo" },
                        value: "low",
                      },
                      {
                        label: { en: "Medium", es: "Medio" },
                        value: "medium",
                      },
                      {
                        label: { en: "High", es: "Alto" },
                        value: "high",
                      },
                    ],
                  }
                : {},
        }),
      );

      [selectWithStandardOptions] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileTypes[1].id,
        1,
        () => ({
          type: "SELECT",
          alias: "p_standard_options",
          options: {
            values: [
              { value: "option_1", label: { en: "Option 1", es: "Opción 1" }, isStandard: true },
              { value: "option_2", label: { en: "Option 2", es: "Opción 2" }, isStandard: true },
              {
                value: "option_3_nostandard",
                label: { en: "Option 3", es: "Opción 3" },
              },
            ],
          },
        }),
      );
    });

    it("updates the information of the profile type field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              name
              alias
              isExpirable
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
          data: {
            alias: "new_alias",
            isExpirable: false,
            name: { en: "new_name", es: "nuevo_nombre" },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", profileTypeField.id),
        name: { en: "new_name", es: "nuevo_nombre" },
        alias: "new_alias",
        isExpirable: false,
      });
    });

    it("fails when normal user tries to update another profile type field", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
          data: { name: { es: "name" } },
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails when passing invalid field options", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
          data: { options: { unknown: true } },
        },
      );
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when reusing the same alias", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              name
              alias
              isExpirable
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField2.id),
          data: {
            alias: "alias",
          },
        },
      );
      expect(errors).toContainGraphQLError("ALIAS_ALREADY_EXISTS");
      expect(data).toBeNull();
    });

    it("updates the options of a DATE type field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              options
              isExpirable
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          data: {
            options: { useReplyAsExpiryDate: false },
            isExpirable: true,
            expiryAlertAheadTime: { months: 3 },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
        options: { useReplyAsExpiryDate: false },
        isExpirable: true,
      });
    });

    it("updates value_cache in profiles where DATE field is_expirable is updated", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          content: { value: "1990-10-10" },
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
              force: true
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          data: { isExpirable: false },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
      });

      const [dbProfile] = await mocks.knex
        .from("profile")
        .where("id", fromGlobalId(profile.id).id)
        .select("*");

      expect(dbProfile?.value_cache).toEqual({
        [profileType0Fields[2].id]: {
          content: { value: "1990-10-10" },
        },
      });
    });

    it("removes values expiry date when disabling caducity of profile field type", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
          content: { value: "abcd" },
          expiryDate: "2023-08-08",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
            $force: Boolean
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
              force: $force
            ) {
              id
              isExpirable
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
          data: { isExpirable: false },
          force: true,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", profileTypeField.id),
        isExpirable: false,
      });

      const { errors: query2Errors, data: query2Data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              properties {
                field {
                  id
                }
                value {
                  content
                  expiryDate
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
        },
      );

      expect(query2Errors).toBeUndefined();
      expect(query2Data?.profile).toEqual({
        id: profile.id,
        properties: [
          {
            field: { id: toGlobalId("ProfileTypeField", profileType1Fields[0].id) },
            value: null,
          },
          {
            field: { id: toGlobalId("ProfileTypeField", profileType1Fields[1].id) },
            value: null,
          },
          {
            field: { id: toGlobalId("ProfileTypeField", profileType1Fields[2].id) },
            value: null,
          },
          {
            field: { id: toGlobalId("ProfileTypeField", profileTypeField.id) },
            value: { content: { value: "abcd" }, expiryDate: null },
          },
          {
            field: { id: toGlobalId("ProfileTypeField", profileTypeField2.id) },
            value: null,
          },
          {
            field: { id: toGlobalId("ProfileTypeField", profileTypeField3.id) },
            value: null,
          },
          {
            field: { id: toGlobalId("ProfileTypeField", selectProfileTypeField.id) },
            value: null,
          },
          {
            field: { id: toGlobalId("ProfileTypeField", checkboxProfileTypeField.id) },
            value: null,
          },
          {
            field: { id: toGlobalId("ProfileTypeField", backgroundCheckProfileTypeField.id) },
            value: null,
          },
          {
            field: { id: toGlobalId("ProfileTypeField", selectWithStandardOptions.id) },
            value: null,
          },
        ],
      });
    });

    it("sends error when removing when disabling caducity of profile field type, values have caducity and not passing force flag", async () => {
      await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
          content: { value: "abcd" },
          expiryDate: "2023-08-08",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              isExpirable
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
          data: { isExpirable: false },
        },
      );

      expect(errors).toContainGraphQLError("REMOVE_PROFILE_TYPE_FIELD_IS_EXPIRABLE_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when removing a SELECT option that is being used in a profile_field_value", async () => {
      await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField3.id),
          content: { value: "ES" },
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField3.id),
          data: {
            options: {
              values: [{ value: "AR", label: { es: "Argentina", en: "Argentina" } }],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("REMOVE_PROFILE_TYPE_FIELD_SELECT_OPTIONS_ERROR");
      expect(data).toBeNull();
    });

    it("sends profile_field_value_updated event when updating select field options with null substitutions", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, profileTypes[1].id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeField3.id,
          content: { value: "ES" },
          created_by_user_id: sessionUser.id,
          type: "SELECT",
        },
      ]);

      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField3.id),
          data: {
            options: {
              values: [{ value: "AR", label: { es: "Argentina", en: "Argentina" } }],
            },
            substitutions: [{ old: "ES", new: null }],
          },
        },
      );

      expect(errors).toBeUndefined();

      const { data, errors: queryErrors } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              events(limit: 100, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 2,
          items: [{ type: "PROFILE_UPDATED" }, { type: "PROFILE_FIELD_VALUE_UPDATED" }],
        },
      });
    });

    it("sends profile_field_value_updated event when updating select field options with non-null substitutions", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, profileTypes[1].id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeField3.id,
          content: { value: "ES" },
          created_by_user_id: sessionUser.id,
          type: "SELECT",
        },
      ]);

      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField3.id),
          data: {
            options: {
              values: [
                { value: "AR", label: { es: "Argentina", en: "Argentina" } },
                { value: "FR", label: { es: "Francia", en: "France" } },
              ],
            },
            substitutions: [{ old: "ES", new: "FR" }],
          },
        },
      );

      expect(errors).toBeUndefined();

      const { data, errors: queryErrors } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              events(limit: 100, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 2,
          items: [{ type: "PROFILE_UPDATED" }, { type: "PROFILE_FIELD_VALUE_UPDATED" }],
        },
      });
    });

    it("fails when updating field alias to start with p_", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
          data: { alias: "p_alias" },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when tying to update standard SELECT options of field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
          data: {
            options: {
              values: [
                { value: "option_1_updated", label: { es: "Opción 1", en: "Option 1" } },
                { value: "option_2", label: { es: "Opción 2", en: "Option 2" } },
              ],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails when trying to delete standard SELECT options of field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
          data: {
            options: {
              values: [{ value: "option_2", label: { es: "Opción 2", en: "Option 2" } }],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("allows to add new SELECT options to standard field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              options
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
          data: {
            options: {
              values: [
                { value: "option_1", label: { es: "Opción 1", en: "Option 1" } },
                { value: "option_2", label: { es: "Opción 2", en: "Option 2" } },
                { value: "option_3", label: { es: "Opción 3", en: "Option 3" } },
              ],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
        options: {
          values: [
            { value: "option_1", label: { es: "Opción 1", en: "Option 1" }, isStandard: true },
            { value: "option_2", label: { es: "Opción 2", en: "Option 2" }, isStandard: true },
            { value: "option_3", label: { es: "Opción 3", en: "Option 3" } },
          ],
        },
      });
    });

    it("allows to update to standard list if every used value is already in the standard list", async () => {
      await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField3.id),
          content: { value: "AR" },
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              options
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField3.id),
          data: {
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField.options.values).toBeArrayOfSize(250);
    });

    it("fails when updating name or alias of a standard field", async () => {
      for (const updateData of [{ name: { en: "new name" } }, { alias: "new_alias" }]) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileTypeId: GID!
              $profileTypeFieldId: GID!
              $data: UpdateProfileTypeFieldInput!
            ) {
              updateProfileTypeField(
                profileTypeId: $profileTypeId
                profileTypeFieldId: $profileTypeFieldId
                data: $data
              ) {
                id
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
            data: updateData,
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      }
    });

    it("allows to update isExpirable and expiryAlertAheadTime of a standard field", async () => {
      for (const updateData of [{ isExpirable: true }, { expiryAlertAheadTime: { months: 1 } }]) {
        const { errors } = await testClient.execute(
          gql`
            mutation (
              $profileTypeId: GID!
              $profileTypeFieldId: GID!
              $data: UpdateProfileTypeFieldInput!
            ) {
              updateProfileTypeField(
                profileTypeId: $profileTypeId
                profileTypeFieldId: $profileTypeFieldId
                data: $data
              ) {
                id
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
            data: updateData,
          },
        );

        expect(errors).toBeUndefined();
      }
    });

    it("fails if trying to remove SELECT option used in a profile field value", async () => {
      await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
          content: { value: "option_3_nostandard" },
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeFieldId: GID!
            $profileTypeId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeFieldId: $profileTypeFieldId
              profileTypeId: $profileTypeId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          data: {
            options: {
              values: [
                { value: "option_1", label: { es: "Opción 1", en: "Option 1" } },
                { value: "option_2", label: { es: "Opción 2", en: "Option 2" } },
              ],
            },
          },
        },
      );
      expect(errors).toContainGraphQLError("REMOVE_PROFILE_TYPE_FIELD_SELECT_OPTIONS_ERROR");
      expect(data).toBeNull();
    });

    it("does not fail if offering substitution when removing SELECT option used in a profile field value", async () => {
      await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
          content: { value: "option_3_nostandard" },
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeFieldId: GID!
            $profileTypeId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeFieldId: $profileTypeFieldId
              profileTypeId: $profileTypeId
              data: $data
            ) {
              id
              options
            }
          }
        `,
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          data: {
            options: {
              values: [
                { value: "option_1", label: { es: "Opción 1", en: "Option 1" } },
                { value: "option_2", label: { es: "Opción 2", en: "Option 2" } },
              ],
            },
            substitutions: [{ old: "option_3_nostandard", new: "option_1" }],
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
        options: {
          values: [
            { value: "option_1", label: { es: "Opción 1", en: "Option 1" }, isStandard: true },
            { value: "option_2", label: { es: "Opción 2", en: "Option 2" }, isStandard: true },
          ],
        },
      });
    });

    it("fails when offering unknown substitution", async () => {
      await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
          content: { value: "option_3_nostandard" },
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeFieldId: GID!
            $profileTypeId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeFieldId: $profileTypeFieldId
              profileTypeId: $profileTypeId
              data: $data
            ) {
              id
              options
            }
          }
        `,
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectWithStandardOptions.id),
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          data: {
            options: {
              values: [
                { value: "option_1", label: { es: "Opción 1", en: "Option 1" } },
                { value: "option_2", label: { es: "Opción 2", en: "Option 2" } },
              ],
            },
            substitutions: [{ old: "option_3_nostandard", new: "unknown" }],
          },
        },
      );
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("removes value from value array in CHECKBOX field value when removing it from the configuration", async () => {
      await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", checkboxProfileTypeField.id),
          content: { value: ["ES", "AR"] },
        },
      ]);

      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", checkboxProfileTypeField.id),
          data: {
            options: {
              values: [{ value: "AR", label: { es: "Argentina", en: "Argentina" } }],
            },
            substitutions: [{ old: "ES", new: null }],
          },
        },
      );

      expect(errors).toBeUndefined();

      const dbValues = await mocks.knex
        .from("profile_field_value")
        .where("profile_type_field_id", checkboxProfileTypeField.id)
        .select("content", "removed_at");

      expect(dbValues).toIncludeSameMembers([
        { content: { value: ["ES", "AR"] }, removed_at: expect.any(Date) },
        { content: { value: ["AR"] }, removed_at: null },
      ]);
    });

    it("removes profile value in CHECKBOX field value when removing all its values from configuration", async () => {
      await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", checkboxProfileTypeField.id),
          content: { value: ["ES", "AR"] },
        },
      ]);

      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", checkboxProfileTypeField.id),
          data: {
            options: {
              values: [],
            },
            substitutions: [
              { old: "ES", new: null },
              { old: "AR", new: null },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();

      const dbValues = await mocks.knex
        .from("profile_field_value")
        .where("profile_type_field_id", checkboxProfileTypeField.id)
        .select("content", "removed_at");

      expect(dbValues).toIncludeSameMembers([
        { content: { value: ["ES", "AR"] }, removed_at: expect.any(Date) },
      ]);
    });

    it("replaces one of the profile values in CHECKBOX field value when passing substitution", async () => {
      await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", checkboxProfileTypeField.id),
          content: { value: ["ES", "AR"] },
        },
      ]);

      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", checkboxProfileTypeField.id),
          data: {
            options: {
              values: [
                { value: "AR", label: { es: "Argentina", en: "Argentina" } },
                { value: "BR", label: { es: "Brasil", en: "Brasil" } },
              ],
            },
            substitutions: [{ old: "ES", new: "BR" }],
          },
        },
      );

      expect(errors).toBeUndefined();

      const dbValues = await mocks.knex
        .from("profile_field_value")
        .where("profile_type_field_id", checkboxProfileTypeField.id)
        .select("content", "removed_at");

      expect(dbValues).toIncludeSameMembers([
        { content: { value: ["ES", "AR"] }, removed_at: expect.any(Date) },
        { content: { value: ["BR", "AR"] }, removed_at: null },
      ]);
    });

    it("fails if trying to update options of a profile type field that is being used in monitoring rules", async () => {
      await mocks.knex
        .from("profile_type_field")
        .where("id", backgroundCheckProfileTypeField.id)
        .update({
          options: {
            monitoring: {
              searchFrequency: { type: "FIXED", frequency: "5_YEARS" },
              activationCondition: {
                profileTypeFieldId: selectProfileTypeField.id,
                values: ["high"],
              },
            },
          },
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              isExpirable
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectProfileTypeField.id),
          data: { options: { standardList: "NON_EU_COUNTRIES" } },
        },
      );

      expect(errors).toContainGraphQLError("FIELD_USED_IN_MONITORING_RULE", {
        profileTypeFieldIds: [toGlobalId("ProfileTypeField", backgroundCheckProfileTypeField.id)],
      });
      expect(data).toBeNull();
    });

    it("allows to update everything except options of a profile type field that is being used in monitoring rules", async () => {
      await mocks.knex
        .from("profile_type_field")
        .where("id", backgroundCheckProfileTypeField.id)
        .update({
          options: {
            monitoring: {
              searchFrequency: { type: "FIXED", frequency: "5_YEARS" },
              activationCondition: {
                profileTypeFieldId: selectProfileTypeField.id,
                values: ["high"],
              },
            },
          },
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              alias
              name
              isExpirable
              expiryAlertAheadTime
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", selectProfileTypeField.id),
          data: {
            alias: "my_new_select_alias",
            name: {
              en: "MY SELECT",
              es: "MI SELECT",
            },
            isExpirable: true,
            expiryAlertAheadTime: { months: 1 },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", selectProfileTypeField.id),
        alias: "my_new_select_alias",
        name: { en: "MY SELECT", es: "MI SELECT" },
        isExpirable: true,
        expiryAlertAheadTime: { months: 1 },
      });
    });

    it("fails if trying to disable monitoring from a BACKGROUND_CHECK field but there are profiles with active monitoring - no activationCondition", async () => {
      await mocks.knex
        .from("profile_type_field")
        .where("id", backgroundCheckProfileTypeField.id)
        .update({
          options: {
            monitoring: {
              searchFrequency: {
                type: "FIXED",
                frequency: "5_YEARS",
              },
            },
          },
        });

      const [profile] = await mocks.createRandomProfiles(organization.id, profileTypes[1].id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", backgroundCheckProfileTypeField.id),
          data: {
            options: {
              monitoring: null,
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("REMOVE_PROFILE_TYPE_FIELD_MONITORING_ERROR", {
        profileIds: [toGlobalId("Profile", profile.id)],
      });

      expect(data).toBeNull();
    });

    it("fails if trying to disable monitoring from a BACKGROUND_CHECK field but there are profiles with active monitoring - with activationCondition", async () => {
      await mocks.knex
        .from("profile_type_field")
        .where("id", backgroundCheckProfileTypeField.id)
        .update({
          options: {
            monitoring: {
              searchFrequency: {
                type: "FIXED",
                frequency: "5_YEARS",
              },
              activationCondition: {
                profileTypeFieldId: selectProfileTypeField.id,
                values: ["high"],
              },
            },
          },
        });

      const profiles = await mocks.createRandomProfiles(organization.id, profileTypes[1].id, 2);

      await mocks.createProfileFieldValues(profiles[1].id, [
        {
          content: { value: "high" },
          created_by_user_id: sessionUser.id,
          profile_type_field_id: selectProfileTypeField.id,
          type: "SELECT",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", backgroundCheckProfileTypeField.id),
          data: {
            options: {
              monitoring: null,
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("REMOVE_PROFILE_TYPE_FIELD_MONITORING_ERROR", {
        profileIds: [toGlobalId("Profile", profiles[1].id)],
      });

      expect(data).toBeNull();
    });

    it("allows to disable monitoring rules if no profile has active monitoring on the field - no profiles with monitoring", async () => {
      await mocks.knex
        .from("profile_type_field")
        .where("id", backgroundCheckProfileTypeField.id)
        .update({
          options: {
            monitoring: {
              searchFrequency: {
                type: "FIXED",
                frequency: "5_YEARS",
              },
              activationCondition: {
                profileTypeFieldId: selectProfileTypeField.id,
                values: ["high"],
              },
            },
          },
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              options
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", backgroundCheckProfileTypeField.id),
          data: {
            options: {
              monitoring: null,
            },
          },
        },
      );

      expect(errors).toBeUndefined();

      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", backgroundCheckProfileTypeField.id),
        options: {
          monitoring: null,
        },
      });
    });

    it("allows to disable monitoring rules if no profile has active monitoring on the field - activationCondition doesn't match", async () => {
      await mocks.knex
        .from("profile_type_field")
        .where("id", backgroundCheckProfileTypeField.id)
        .update({
          options: {
            monitoring: {
              searchFrequency: {
                type: "FIXED",
                frequency: "5_YEARS",
              },
              activationCondition: {
                profileTypeFieldId: selectProfileTypeField.id,
                values: ["high"],
              },
            },
          },
        });

      const profiles = await mocks.createRandomProfiles(organization.id, profileTypes[1].id, 2);

      await mocks.createProfileFieldValues(profiles[1].id, [
        {
          content: { value: "medium" },
          created_by_user_id: sessionUser.id,
          profile_type_field_id: selectProfileTypeField.id,
          type: "SELECT",
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              options
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", backgroundCheckProfileTypeField.id),
          data: {
            options: {
              monitoring: null,
            },
          },
        },
      );

      expect(errors).toBeUndefined();

      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", backgroundCheckProfileTypeField.id),
        options: {
          monitoring: null,
        },
      });
    });

    it("updates values in multiple profiles", async () => {
      const profiles = await mocks.createRandomProfiles(organization.id, profileTypes[1].id, 3);

      const [p0Value] = await mocks.createProfileFieldValues(profiles[0].id, [
        {
          content: { value: "ES" },
          profile_type_field_id: profileTypeField3.id,
          type: "SELECT",
          created_by_user_id: sessionUser.id,
        },
      ]);

      const [p1Value] = await mocks.createProfileFieldValues(profiles[1].id, [
        {
          content: { value: "ES" },
          profile_type_field_id: profileTypeField3.id,
          type: "SELECT",
          created_by_user_id: sessionUser.id,
        },
      ]);

      await mocks.createProfileFieldValues(profiles[2].id, [
        {
          content: { value: "AR" },
          profile_type_field_id: profileTypeField3.id,
          type: "SELECT",
          created_by_user_id: sessionUser.id,
        },
      ]);

      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField3.id),
          data: {
            options: {
              values: [
                { value: "AR", label: { es: "Argentina", en: "Argentina" } },
                { value: "FR", label: { es: "Francia", en: "France" } },
              ],
            },
            substitutions: [{ old: "ES", new: "FR" }],
          },
        },
      );

      expect(errors).toBeUndefined();

      const profileEvents = await mocks.knex
        .from("profile_event")
        .whereIn("profile_id", [profiles[0].id, profiles[1].id, profiles[2].id])
        .orderBy("profile_id", "asc")
        .orderBy("created_at", "desc")
        .orderBy("id", "desc")
        .select(["profile_id", "type", "data"]);

      expect(profileEvents).toEqual([
        {
          profile_id: profiles[0].id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: sessionUser.id,
            org_integration_id: null,
          },
        },
        {
          profile_id: profiles[0].id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeField3.id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: p0Value.id,
            alias: null,
          },
        },
        {
          profile_id: profiles[1].id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: sessionUser.id,
            org_integration_id: null,
          },
        },
        {
          profile_id: profiles[1].id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeField3.id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: p1Value.id,
            alias: null,
          },
        },
      ]);
    });

    it("updates value_cache in profiles where CHECKBOX field options are updated", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[3].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
          content: { value: ["A", "B"] },
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeFieldId: GID!
            $profileTypeId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeFieldId: $profileTypeFieldId
              profileTypeId: $profileTypeId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
          profileTypeId: toGlobalId("ProfileType", profileTypes[3].id),
          data: {
            options: {
              values: [
                { value: "AA", label: { es: "A", en: "A" } },
                { value: "BB", label: { es: "B", en: "B" } },
                { value: "C", label: { es: "C", en: "C" } },
              ],
            },
            substitutions: [
              { old: "A", new: "AA" },
              { old: "B", new: "BB" },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
      });

      const [updatedProfile] = await mocks.knex
        .from("profile")
        .where("id", fromGlobalId(profile.id).id)
        .select("*");
      expect(updatedProfile.value_cache).toEqual({
        [profileType3Fields[4].id]: { content: { value: ["AA", "BB"] } },
      });
    });

    it("updates value_cache in profiles where CHECKBOX field options are removed", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[3].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
          content: { value: ["A", "B"] },
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeFieldId: GID!
            $profileTypeId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeFieldId: $profileTypeFieldId
              profileTypeId: $profileTypeId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
          profileTypeId: toGlobalId("ProfileType", profileTypes[3].id),
          data: {
            options: {
              values: [
                { value: "AA", label: { es: "A", en: "A" } },
                { value: "C", label: { es: "C", en: "C" } },
              ],
            },
            substitutions: [
              { old: "A", new: "AA" },
              { old: "B", new: null },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
      });

      const [updatedProfile] = await mocks.knex
        .from("profile")
        .where("id", fromGlobalId(profile.id).id)
        .select("*");
      expect(updatedProfile.value_cache).toEqual({
        [profileType3Fields[4].id]: { content: { value: ["AA"] } },
      });
    });

    it("updates value_cache in profiles where SELECT field options are updated", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harvey" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Specter" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
          content: { value: "high" },
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeFieldId: GID!
            $profileTypeId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeFieldId: $profileTypeFieldId
              profileTypeId: $profileTypeId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: {
            options: {
              values: [
                { value: "low", label: { es: "Bajo", en: "Low" } },
                { value: "medium", label: { es: "Medio", en: "Medium" } },
                { value: "very-high", label: { es: "Muy alto", en: "Very high" } },
              ],
            },
            substitutions: [{ old: "high", new: "very-high" }],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
      });

      const [updatedProfile] = await mocks.knex
        .from("profile")
        .where("id", fromGlobalId(profile.id).id)
        .select("*");
      expect(updatedProfile.value_cache).toEqual({
        [profileType0Fields[0].id]: {
          content: { value: "Harvey" },
        },
        [profileType0Fields[1].id]: {
          content: { value: "Specter" },
        },
        [profileType0Fields[6].id]: {
          content: { value: "very-high" },
        },
      });
    });

    it("removes value_cache in profiles where SELECT field options are removed", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harvey" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Specter" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
          content: { value: "high" },
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeFieldId: GID!
            $profileTypeId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeFieldId: $profileTypeFieldId
              profileTypeId: $profileTypeId
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          data: {
            options: {
              values: [
                { value: "low", label: { es: "Bajo", en: "Low" } },
                { value: "medium", label: { es: "Medio", en: "Medium" } },
              ],
            },
            substitutions: [{ old: "high", new: null }],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
      });

      const [updatedProfile] = await mocks.knex
        .from("profile")
        .where("id", fromGlobalId(profile.id).id)
        .select("*");
      expect(updatedProfile.value_cache).toEqual({
        [profileType0Fields[0].id]: {
          content: { value: "Harvey" },
        },
        [profileType0Fields[1].id]: {
          content: { value: "Specter" },
        },
      });
    });

    it("allows to update UNIQUE property of a field if there are no duplicated profiles", async () => {
      for (const value of ["1", "2", "3", "4", "5"]) {
        const { errors } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[4].id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
                content: { value },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
      }

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              isUnique
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[4].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
          data: {
            isUnique: false,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeField).toEqual({
        id: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
        isUnique: false,
      });

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_type_field_id", profileType4Fields[0].id)
        .whereNull("removed_at")
        .whereNull("deleted_at")
        .select("*");

      expect(pfvs).toBeArrayOfSize(5);
      expect(pfvs.map(pick(["profile_type_field_is_unique"]))).toEqual([
        { profile_type_field_is_unique: false },
        { profile_type_field_is_unique: false },
        { profile_type_field_is_unique: false },
        { profile_type_field_is_unique: false },
        { profile_type_field_is_unique: false },
      ]);
    });

    it("sends error if updating UNIQUE property and there are duplicated profiles", async () => {
      const profileIds = [];
      for (const [index, value] of [
        "Mike",
        "Harvey",
        "Peter",
        "Mike",
        "Peter",
        "Harvey",
      ].entries()) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[4].id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
                content: { value: index.toString() },
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
                content: { value },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data.createProfile.id).toBeDefined();
        profileIds.push(data.createProfile.id);
      }

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $data: UpdateProfileTypeFieldInput!
          ) {
            updateProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              id
              isUnique
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[4].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
          data: {
            isUnique: true,
          },
        },
      );

      expect(errors).toContainGraphQLError("DUPLICATE_VALUES_EXIST");
      expect(data).toBeNull();
    });
  });

  describe("updateProfileTypeFieldPositions", () => {
    it("reorders positions of profile type fields", async () => {
      const newOrder = faker.helpers.shuffle(profileType0Fields.map((f) => f.id));
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            updateProfileTypeFieldPositions(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
            ) {
              id
              fields {
                id
                position
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: newOrder.map((id) => toGlobalId("ProfileTypeField", id)),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeFieldPositions).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        fields: newOrder.map((id, i) => ({
          id: toGlobalId("ProfileTypeField", id),
          position: i,
        })),
      });
    });

    it("fails when normal user tries to move a profile type field", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            updateProfileTypeFieldPositions(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
            ) {
              id
              fields {
                id
                position
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [
            toGlobalId("ProfileTypeField", profileType0Fields[3].id),
            toGlobalId("ProfileTypeField", profileType0Fields[4].id),
            toGlobalId("ProfileTypeField", profileType0Fields[0].id),
            toGlobalId("ProfileTypeField", profileType0Fields[2].id),
            toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails when not passing full array of profile type field ids", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            updateProfileTypeFieldPositions(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
            ) {
              id
              fields {
                id
                position
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [
            toGlobalId("ProfileTypeField", profileType0Fields[3].id),
            toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_IDS");
      expect(data).toBeNull();
    });
  });

  describe("deleteProfileTypeField", () => {
    let petition: Petition;
    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
    });
    afterAll(async () => {
      await mocks.knex.from("petition_field").where("petition_id", petition.id).delete();
    });

    it("deletes a profile type field and reorders the positions", async () => {
      const removedPtfId = profileType0Fields[2].id;
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            deleteProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", removedPtfId)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfileTypeField).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
      });

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileTypeId: GID!) {
            profileType(profileTypeId: $profileTypeId) {
              id
              fields {
                id
                position
              }
            }
          }
        `,
        { profileTypeId: toGlobalId("ProfileType", profileTypes[0].id) },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        fields: profileType0Fields
          .filter((f) => f.id !== removedPtfId)
          .map((f, i) => ({ id: toGlobalId("ProfileTypeField", f.id), position: i })),
      });
    });

    it("fails when deleting a field used in the profile name pattern", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            deleteProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[0].id)],
        },
      );

      expect(errors).toContainGraphQLError("FIELD_USED_IN_PATTERN");
      expect(data).toBeNull();
    });

    it("fails when a normal user tries to delete a profile type field", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            deleteProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[0].id)],
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails when deleting a standard field", async () => {
      const [standardField] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileTypes[1].id,
        1,
        () => ({
          alias: "p_name",
          type: "TEXT",
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            deleteProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", standardField.id)],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if trying to delete a profile type field that is being used in monitoring rules", async () => {
      const [bgCheck] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileTypes[0].id,
        1,
        () => ({
          type: "BACKGROUND_CHECK",
          options: {
            monitoring: {
              activationCondition: {
                profileTypeFieldId: profileType0Fields[7].id,
                values: ["M"],
              },
            },
          },
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            deleteProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[7].id)],
        },
      );

      expect(errors).toContainGraphQLError("FIELD_USED_IN_MONITORING_RULE", {
        profileTypeFieldIds: [toGlobalId("ProfileTypeField", bgCheck.id)],
      });
      expect(data).toBeNull();
    });

    it("updates cache in profile when deleting a profile type field", async () => {
      await mocks.knex
        .from("profile_type")
        .where("id", profileTypes[0].id)
        .update({
          profile_name_pattern: json([profileType0Fields[0].id, " ", profileType0Fields[1].id]),
        });

      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harvey" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Specter" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
          content: { value: "high" },
        },
      ]);

      const profileId = fromGlobalId(profile.id).id;

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            deleteProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
              force: true
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[6].id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfileTypeField).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
      });

      const [updatedProfile] = await mocks.knex.from("profile").where("id", profileId).select("*");
      expect(updatedProfile.value_cache).toEqual({
        [profileType0Fields[0].id]: {
          content: { value: "Harvey" },
        },
        [profileType0Fields[1].id]: {
          content: { value: "Specter" },
        },
      });
    });

    it("unlinks FIELD_GROUP children when deleting a profile type field", async () => {
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, (i) => ({
        type: "FIELD_GROUP",
        profile_type_id: profileTypes[0].id,
      }));
      const children = await mocks.createRandomPetitionFields(petition.id, 4, (i) => ({
        parent_petition_field_id: fieldGroup.id,
        profile_type_field_id: profileType0Fields[i].id,
        type: "SHORT_TEXT",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            deleteProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[2].id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfileTypeField).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
      });

      const dbChildren = await mocks.knex
        .from("petition_field")
        .whereIn(
          "id",
          children.map((c) => c.id),
        )
        .select("*");

      expect(
        dbChildren.map(pick(["id", "profile_type_id", "profile_type_field_id"])),
      ).toIncludeSameMembers([
        {
          id: children[0].id,
          profile_type_id: null,
          profile_type_field_id: profileType0Fields[0].id,
        },
        {
          id: children[1].id,
          profile_type_id: null,
          profile_type_field_id: profileType0Fields[1].id,
        },
        { id: children[2].id, profile_type_id: null, profile_type_field_id: null },
        {
          id: children[3].id,
          profile_type_id: null,
          profile_type_field_id: profileType0Fields[3].id,
        },
      ]);
    });

    it("sends error if a subscription on the profile type field exists for any user", async () => {
      await mocks.knex.from("event_subscription").insert([
        {
          type: "PROFILE",
          endpoint: "https://www.example.com",
          from_profile_type_field_ids: [profileType0Fields[2].id],
          user_id: sessionUser.id,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            deleteProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[2].id)],
        },
      );

      expect(errors).toContainGraphQLError("DELETE_PROFILE_TYPE_FIELD_ERROR", {
        aggregatedErrors: [
          {
            code: "EVENT_SUBSCRIPTION_EXISTS_ERROR",
            message: "A subscription exists for at least one of the provided profile type fields",
            count: 1,
          },
        ],
      });
      expect(data).toBeNull();
    });

    it("removes event subscription on the profile type field if passing force flag", async () => {
      await mocks.knex.from("event_subscription").insert([
        {
          type: "PROFILE",
          endpoint: "https://www.example.com",
          from_profile_type_field_ids: [profileType0Fields[2].id],
          user_id: sessionUser.id,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeFieldIds: [GID!]!) {
            deleteProfileTypeField(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
              force: true
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[2].id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfileTypeField).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
      });

      const dbEventSubscriptions = await mocks.knex
        .from("event_subscription")
        .where("from_profile_type_field_ids", [profileType0Fields[2].id])
        .whereNull("deleted_at")
        .select("*");
      expect(dbEventSubscriptions).toHaveLength(0);
    });
  });

  describe("updateProfileFieldValue", () => {
    it("updates field values and updates the name", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      expect(profile).toEqual({
        id: expect.any(String),
        name: "",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2 || i === 6,
          },
          value: null,
        })),
        status: "OPEN",
      });

      const updateProfileFieldInPattern = await updateProfileValue(profile.id, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "John" },
        },
      ]);

      expect(updateProfileFieldInPattern).toEqual({
        id: expect.any(String),
        name: "John  ( risk)",
        status: "OPEN",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2 || i === 6,
          },
          value:
            f.id === profileType0Fields[0].id
              ? { content: { value: "John" }, expiryDate: null }
              : null,
        })),
      });

      const updateProfileFieldInPattern2 = await updateProfileValue(profile.id, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Wick" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id), // Risk SELECT
          content: { value: "high" },
        },
      ]);

      expect(updateProfileFieldInPattern2).toEqual({
        id: expect.any(String),
        name: "John Wick (High risk)",
        status: "OPEN",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2 || i === 6,
          },
          value:
            f.id === profileType0Fields[0].id
              ? { content: { value: "John" }, expiryDate: null }
              : f.id === profileType0Fields[1].id
                ? { content: { value: "Wick" }, expiryDate: null }
                : f.id === profileType0Fields[6].id
                  ? { content: { value: "high" }, expiryDate: null }
                  : null,
        })),
      });

      const removesOneValue = await updateProfileValue(profile.id, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: null,
        },
      ]);
      expect(removesOneValue).toEqual({
        id: expect.any(String),
        name: "John  (High risk)",
        status: "OPEN",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2 || i === 6,
          },
          value:
            f.id === profileType0Fields[0].id
              ? { content: { value: "John" }, expiryDate: null }
              : f.id === profileType0Fields[6].id
                ? { content: { value: "high" }, expiryDate: null }
                : null,
        })),
      });

      const removesAllValuesInNamePattern = await updateProfileValue(profile.id, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: null,
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
          content: null,
        },
      ]);
      expect(removesAllValuesInNamePattern).toEqual({
        id: expect.any(String),
        name: "( risk)",
        status: "OPEN",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2 || i === 6,
          },
          value: null,
        })),
      });
    });

    it("does not remove current value or create events if the new value is exactly the same", async () => {
      const [profile] = await mocks.createRandomProfiles(
        organization.id,
        profileTypes[0].id,
        1,
        () => ({
          status: "OPEN",
        }),
      );

      await mocks.createProfileFieldValues(profile.id, [
        {
          type: profileType0Fields[0].type,
          profile_type_field_id: profileType0Fields[0].id,
          content: { value: "John" },
          created_by_user_id: sessionUser.id,
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $profileId: GID!
            $fields: [UpdateProfileFieldValueInput!]!
            $propertiesFilter: [ProfileFieldPropertyFilter!]!
          ) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              properties(filter: $propertiesFilter) {
                field {
                  id
                }
                value {
                  content
                }
              }
              events(offset: 0, limit: 100) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          propertiesFilter: [
            { profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id) },
          ],
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              content: { value: "John" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        properties: [
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
            },
            value: {
              content: { value: "John" },
            },
          },
        ],
        events: {
          totalCount: 0,
          items: [],
        },
      });

      const dbValues = await mocks.knex.from("profile_field_value").where("profile_id", profile.id);

      expect(dbValues).toHaveLength(1);
      expect(dbValues[0]).toMatchObject({
        deleted_at: null,
        removed_at: null,
        content: { value: "John" },
      });
    });

    it("does not remove current value or create events if the new expiry date is exactly the same", async () => {
      const [profile] = await mocks.createRandomProfiles(
        organization.id,
        profileTypes[0].id,
        1,
        () => ({
          status: "OPEN",
        }),
      );

      await mocks.createProfileFieldValues(profile.id, [
        {
          type: profileType0Fields[5].type,
          profile_type_field_id: profileType0Fields[5].id,
          content: { value: "YB5340186" },
          expiry_date: "2030-01-01",
          created_by_user_id: sessionUser.id,
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $profileId: GID!
            $fields: [UpdateProfileFieldValueInput!]!
            $propertiesFilter: [ProfileFieldPropertyFilter!]!
          ) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              properties(filter: $propertiesFilter) {
                field {
                  id
                }
                value {
                  content
                  expiryDate
                }
              }
              events(offset: 0, limit: 100) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          propertiesFilter: [
            { profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[5].id) },
          ],
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[5].id),
              expiryDate: "2030-01-01",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        properties: [
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType0Fields[5].id),
            },
            value: {
              content: { value: "YB5340186" },
              expiryDate: "2030-01-01",
            },
          },
        ],
        events: {
          totalCount: 0,
          items: [],
        },
      });

      const dbValues = await mocks.knex.from("profile_field_value").where("profile_id", profile.id);

      expect(dbValues).toHaveLength(1);
      expect(dbValues[0]).toMatchObject({
        deleted_at: null,
        removed_at: null,
        content: { value: "YB5340186" },
        expiry_date: "2030-01-01",
      });
    });

    it("does not remove current value or create events if the new value is exactly the same - CHECKBOX", async () => {
      const [profile] = await mocks.createRandomProfiles(
        organization.id,
        profileTypes[3].id,
        1,
        () => ({
          status: "OPEN",
        }),
      );

      await mocks.createProfileFieldValues(profile.id, [
        {
          type: profileType3Fields[4].type,
          profile_type_field_id: profileType3Fields[4].id,
          content: { value: ["A", "C"] },
          created_by_user_id: sessionUser.id,
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $profileId: GID!
            $fields: [UpdateProfileFieldValueInput!]!
            $propertiesFilter: [ProfileFieldPropertyFilter!]!
          ) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              properties(filter: $propertiesFilter) {
                field {
                  id
                }
                value {
                  content
                  expiryDate
                }
              }
              events(offset: 0, limit: 100) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          propertiesFilter: [
            { profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id) },
          ],
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
              content: { value: ["C", "A"] }, // order should not matter
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        properties: [
          {
            field: {
              id: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
            },
            value: {
              content: { value: ["A", "C"] },
              expiryDate: null,
            },
          },
        ],
        events: {
          totalCount: 0,
          items: [],
        },
      });

      const dbValues = await mocks.knex.from("profile_field_value").where("profile_id", profile.id);

      expect(dbValues).toHaveLength(1);
      expect(dbValues[0]).toMatchObject({
        deleted_at: null,
        removed_at: null,
        content: { value: ["A", "C"] },
      });
    });

    it("fails if trying to update on a closed profile", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      expect(profile).toEqual({
        id: expect.any(String),
        name: "",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2 || i === 6,
          },
          value: null,
        })),
        status: "OPEN",
      });

      await mocks.knex
        .from("profile")
        .where("id", fromGlobalId(profile.id).id)
        .update({ status: "CLOSED", closed_at: new Date() });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              content: { value: "John" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_STATUS_ERROR");
      expect(data).toBeNull();
    });

    it("updates the expiry date on fields that expire", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harry" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Potter" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
          content: { value: "medium" },
        },
      ]);

      const profile2 = await updateProfileValue(profile.id, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[5].id),
          content: { value: "123456" },
          expiryDate: "2030-01-01",
        },
      ]);

      expect(profile2).toEqual({
        id: expect.any(String),
        name: "Harry Potter (Medium risk)",
        status: "OPEN",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2 || i === 6,
          },
          value:
            f.id === profileType0Fields[0].id
              ? { content: { value: "Harry" }, expiryDate: null }
              : f.id === profileType0Fields[1].id
                ? { content: { value: "Potter" }, expiryDate: null }
                : f.id === profileType0Fields[5].id
                  ? { content: { value: "123456" }, expiryDate: "2030-01-01" }
                  : f.id === profileType0Fields[6].id
                    ? { content: { value: "medium" }, expiryDate: null }
                    : null,
        })),
      });
    });

    it("fails if trying to set expiry in a non expirable field", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harry" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Potter" },
        },
      ]);

      await expect(
        updateProfileValue(profile.id, [
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
            content: { value: "1988-12-15" },
            expiryDate: "2030-01-01",
          },
        ]),
      ).rejects.toContainGraphQLError("EXPIRY_ON_NON_EXPIRABLE_FIELD");
    });

    it("fails if trying to set expiry in when removing field", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harry" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Potter" },
        },
      ]);

      await expect(
        updateProfileValue(profile.id, [
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
            content: null,
            expiryDate: "2030-01-01",
          },
        ]),
      ).rejects.toContainGraphQLError("EXPIRY_ON_REMOVED_FIELD");
    });

    it("fails if trying to update the value of a FILE type field", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));

      await expect(
        updateProfileValue(profile.id, [
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
            content: { value: "aaa" },
          },
        ]),
      ).rejects.toContainGraphQLError("FORBIDDEN");
    });

    it("fails if passing invalid content", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));

      await expect(
        updateProfileValue(profile.id, [
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[0].id),
            content: { value: 123456 },
          },
        ]),
      ).rejects.toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
    });

    it("fails if setting expiry on a field with no value", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));

      await expect(
        updateProfileValue(profile.id, [
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[0].id),
            expiryDate: "2030-01-01",
          },
        ]),
      ).rejects.toContainGraphQLError("EXPIRY_ON_NONEXISTING_VALUE");
    });

    it("fails if trying to exceed max chars for SHORT_TEXT value", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              name
              properties {
                field {
                  id
                  isExpirable
                }
                value {
                  content
                  expiryDate
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              content: { value: "x".repeat(1001) },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("fails if trying to pass invalid content to SHORT_TEXT value", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              name
              properties {
                field {
                  id
                  isExpirable
                }
                value {
                  content
                  expiryDate
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              content: { value: 123456 },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("fails if trying to pass multiline content to SHORT_TEXT value", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              name
              properties {
                field {
                  id
                  isExpirable
                }
                value {
                  content
                  expiryDate
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              content: {
                value: outdent`
                hello!
                goodbye.`,
              },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("fails if trying to exceed max chars for TEXT value", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              name
              properties {
                field {
                  id
                  isExpirable
                }
                value {
                  content
                  expiryDate
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[4].id),
              content: { value: "x".repeat(10_001) },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("fails if trying to pass unknown date to DATE value", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              name
              properties {
                field {
                  id
                  isExpirable
                }
                value {
                  content
                  expiryDate
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
              content: { value: "May the 4th" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("fails if trying to pass invalid content to DATE value", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              name
              properties {
                field {
                  id
                  isExpirable
                }
                value {
                  content
                  expiryDate
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
              content: { value: 1234 },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("fails if trying to pass invalid content to PHONE value", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              name
              properties {
                field {
                  id
                  isExpirable
                }
                value {
                  content
                  expiryDate
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[3].id),
              content: { value: 1234 },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("fails if trying to pass unknown number to PHONE value", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              name
              properties {
                field {
                  id
                  isExpirable
                }
                value {
                  content
                  expiryDate
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[3].id),
              content: { value: "0800-333-parallel" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("fails if trying to pass wrong option value to SELECT value", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              name
              properties {
                field {
                  id
                  isExpirable
                }
                value {
                  content
                  expiryDate
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
              content: { value: "wrong_value" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("fails if trying to update the value of a field with READ permission", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[3].id),
              content: { value: "ABCD" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("updates a CHECKBOX property", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, profileTypes[3].id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
              properties {
                field {
                  type
                }
                value {
                  content
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
              content: { value: ["A"] },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 2,
          items: [{ type: "PROFILE_UPDATED" }, { type: "PROFILE_FIELD_VALUE_UPDATED" }],
        },
        properties: [
          { field: { type: "DATE" }, value: null },
          { field: { type: "TEXT" }, value: null },
          { field: { type: "TEXT" }, value: null },
          { field: { type: "SELECT" }, value: null },
          { field: { type: "CHECKBOX" }, value: { content: { value: ["A"] } } },
        ],
      });
    });

    it("fails if passing invalid value on a CHECKBOX property", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, profileTypes[3].id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[4].id),
              content: { value: ["ABC"] },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });

    it("updates cache in profile when updating values and expiry dates", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harvey" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          content: { value: "2023-08-19" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
          content: { value: "medium" },
        },
      ]);

      const { errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              content: { value: "Mike" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
              content: { value: "Ross" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
              content: { value: "1990-10-10" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[3].id),
              content: { value: "+34611611611" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
              content: { value: "high" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();

      const [dbProfile] = await mocks.knex
        .from("profile")
        .where("id", fromGlobalId(profile.id).id)
        .select("*");

      expect(dbProfile?.value_cache).toEqual({
        [profileType0Fields[0].id]: {
          content: { value: "Mike" },
        },
        [profileType0Fields[1].id]: {
          content: { value: "Ross" },
        },
        [profileType0Fields[2].id]: {
          content: { value: "1990-10-10" },
          expiry_date: "1990-10-10",
        },
        [profileType0Fields[3].id]: {
          content: { value: "+34611611611" },
        },
        [profileType0Fields[6].id]: {
          content: { value: "high" },
        },
      });
    });

    it("updating values twice with same content should maintain cache as expected", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "Harvey" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          content: { value: "2023-08-19" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
          content: { value: "medium" },
        },
      ]);

      const { errors } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileId: profile.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
              content: { value: "Harvey" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
              content: { value: "Dent" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[6].id),
              content: { value: "medium" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();

      const [dbProfile] = await mocks.knex
        .from("profile")
        .where("id", fromGlobalId(profile.id).id)
        .select("*");

      expect(dbProfile?.value_cache).toEqual({
        [profileType0Fields[0].id]: {
          content: { value: "Harvey" },
        },
        [profileType0Fields[1].id]: {
          content: { value: "Dent" },
        },
        [profileType0Fields[2].id]: {
          content: { value: "2023-08-19" },
          expiry_date: "2023-08-19",
        },
        [profileType0Fields[6].id]: {
          content: { value: "medium" },
        },
      });
    });

    it("sends error if updating a UNIQUE field with a value that already exists", async () => {
      const profileA = await createProfile(toGlobalId("ProfileType", profileTypes[4].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
          content: { value: "A" },
        },
      ]);
      const profileB = await createProfile(toGlobalId("ProfileType", profileTypes[4].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
          content: { value: "B" },
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileId: profileA.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
              content: { value: "B" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
              content: { value: "Harvey" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT", {
        conflicts: [
          {
            profileId: profileB.id,
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
            profileTypeFieldName: { en: "ID", es: "ID" },
            profileName: { en: "B", es: "B" },
            profileStatus: "OPEN",
          },
        ],
      });
      expect(data).toBeNull();
    });

    it("sends error if updating multiple UNIQUE fields with values that already exist", async () => {
      const profileA = await createProfile(toGlobalId("ProfileType", profileTypes[4].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
          content: { value: "A" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
          content: { value: "Harvey" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
          content: { value: "A_HARVEY" },
        },
      ]);

      const profileB = await createProfile(toGlobalId("ProfileType", profileTypes[4].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
          content: { value: "B" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
          content: { value: "Mike" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
          content: { value: "B_MIKE" },
        },
      ]);
      const profileC = await createProfile(toGlobalId("ProfileType", profileTypes[4].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
          content: { value: "C" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[1].id),
          content: { value: "Peter" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
          content: { value: "C_PETER" },
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileId: profileC.id,
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
              content: { value: "B" },
            },
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
              content: { value: "A_HARVEY" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT", {
        conflicts: [
          {
            profileId: profileA.id,
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[2].id),
            profileTypeFieldName: { en: "Tax ID", es: "Tax ID" },
            profileName: { en: "A Harvey", es: "A Harvey" },
            profileStatus: "OPEN",
          },
          {
            profileId: profileB.id,
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileType4Fields[0].id),
            profileTypeFieldName: { en: "ID", es: "ID" },
            profileName: { en: "B Mike", es: "B Mike" },
            profileStatus: "OPEN",
          },
        ],
      });
      expect(data).toBeNull();
    });
  });

  describe("deleteProfile", () => {
    it("deletes a profile", async () => {
      const [profile] = await mocks.createRandomProfiles(
        organization.id,
        profileTypes[0].id,
        1,
        () => ({
          status: "CLOSED",
          closed_at: new Date(),
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            deleteProfile(profileIds: $profileIds)
          }
        `,
        {
          profileIds: [toGlobalId("Profile", profile.id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfile).toEqual("SUCCESS");

      const { errors: query2Errors, data: query2Data } = await testClient.execute(gql`
        query {
          profiles(offset: 0, limit: 10) {
            items {
              id
            }
            totalCount
          }
        }
      `);
      expect(query2Errors).toBeUndefined();
      expect(query2Data.profiles).toEqual({ items: [], totalCount: 0 });
    });

    it("fails if profile has replies and force is not passed", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "William" },
        },
      ]);

      await mocks.knex
        .from("profile")
        .where("id", fromGlobalId(profile.id).id)
        .update({ status: "CLOSED", closed_at: new Date() });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!, $force: Boolean) {
            deleteProfile(profileIds: $profileIds, force: $force)
          }
        `,
        {
          profileIds: [profile.id],
          force: false,
        },
      );

      expect(errors).toContainGraphQLError("PROFILE_HAS_REPLIES_ERROR", { count: 1 });
      expect(data).toBeNull();
    });

    it("fails to delete an OPEN profile", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      expect(profile.status).toEqual("OPEN");

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            deleteProfile(profileIds: $profileIds)
          }
        `,
        {
          profileIds: [profile.id],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_STATUS_ERROR");
      expect(data).toBeNull();
    });

    it("removes associated_profile_id from petition replies when deleting a profile", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        profile_type_id: profileTypes[0].id,
      }));

      const [profile] = await mocks.createRandomProfiles(
        organization.id,
        profileTypes[0].id,
        1,
        () => ({
          status: "CLOSED",
          closed_at: new Date(),
        }),
      );

      const [reply] = await mocks.createRandomTextReply(fieldGroup.id, undefined, 1, () => ({
        user_id: sessionUser.id,
        type: "FIELD_GROUP",
        associated_profile_id: profile.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            deleteProfile(profileIds: $profileIds)
          }
        `,
        {
          profileIds: [toGlobalId("Profile", profile.id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfile).toEqual("SUCCESS");

      const [dbReply] = await mocks.knex
        .from("petition_field_reply")
        .where("id", reply.id)
        .select("*");

      expect(omit(dbReply, ["updated_at", "updated_by"])).toEqual({
        ...omit(reply, ["updated_at", "updated_by"]),
        associated_profile_id: null,
      });
    });
  });

  describe("createProfileFieldFileUploadLink", () => {
    it("creates a FILE reply on a profile field and returns the upload URL", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      const { errors: createErrors, data: createData } = await testClient.execute(
        gql`
          mutation (
            $profileId: GID!
            $profileTypeFieldId: GID!
            $data: [FileUploadInput!]!
            $expiryDate: Date
          ) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
              expiryDate: $expiryDate
            ) {
              property {
                profile {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                      ... on ProfileCreatedEvent {
                        user {
                          id
                        }
                      }
                      ... on ProfileUpdatedEvent {
                        user {
                          id
                        }
                      }
                      ... on ProfileFieldFileAddedEvent {
                        user {
                          id
                        }
                      }
                      ... on ProfileFieldExpiryUpdatedEvent {
                        user {
                          id
                        }
                      }
                    }
                  }
                }
                field {
                  id
                }
                files {
                  id
                  expiryDate
                  field {
                    id
                  }
                  profile {
                    id
                  }
                  removedBy {
                    id
                  }
                  removedAt
                  anonymizedAt
                }
                value {
                  id
                }
              }
              uploads {
                file {
                  id
                  expiryDate
                  file {
                    isComplete
                    contentType
                    filename
                    size
                  }
                }
                presignedPostData {
                  fields
                  url
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          data: [{ contentType: "image/png", size: 1024, filename: "ID.png" }],
          expiryDate: "2025-10-01",
        },
      );

      await mocks.knex
        .from("profile_field_file")
        .where(
          "id",
          fromGlobalId(createData?.createProfileFieldFileUploadLink.property.files[0].id).id,
        )
        .select("*");

      expect(createErrors).toBeUndefined();
      expect(createData?.createProfileFieldFileUploadLink).toEqual({
        property: {
          profile: {
            id: profile.id,
            events: {
              totalCount: 4,
              items: [
                {
                  type: "PROFILE_UPDATED",
                  user: { id: toGlobalId("User", sessionUser.id) },
                },
                {
                  type: "PROFILE_FIELD_EXPIRY_UPDATED",
                  user: { id: toGlobalId("User", sessionUser.id) },
                },
                {
                  type: "PROFILE_FIELD_FILE_ADDED",
                  user: { id: toGlobalId("User", sessionUser.id) },
                },
                {
                  type: "PROFILE_CREATED",
                  user: { id: toGlobalId("User", sessionUser.id) },
                },
              ],
            },
          },
          field: {
            id: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          },
          files: [
            {
              id: expect.any(String),
              expiryDate: "2025-10-01",
              field: { id: toGlobalId("ProfileTypeField", profileType2Fields[1].id) },
              profile: { id: profile.id },
              removedBy: null,
              removedAt: null,
              anonymizedAt: null,
            },
          ],
          value: null,
        },
        uploads: [
          {
            file: {
              id: expect.any(String),
              expiryDate: "2025-10-01",
              file: { isComplete: false, contentType: "image/png", size: 1024, filename: "ID.png" },
            },
            presignedPostData: { fields: {}, url: "" },
          },
        ],
      });

      const { errors: completeErrors, data: completeData } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $profileFieldFileIds: [GID!]!) {
            profileFieldFileUploadComplete(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              profileFieldFileIds: $profileFieldFileIds
            ) {
              id
              field {
                id
              }
              file {
                isComplete
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          profileFieldFileIds: [createData!.createProfileFieldFileUploadLink.property.files[0].id],
        },
      );

      expect(completeErrors).toBeUndefined();
      expect(completeData?.profileFieldFileUploadComplete).toEqual([
        {
          id: createData!.createProfileFieldFileUploadLink.property.files[0].id,
          field: {
            id: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          },
          file: {
            isComplete: true,
          },
        },
      ]);
    });

    it("updates expiry_date field if passing an empty list of files", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      const { errors: createErrors, data: createData } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $data: [FileUploadInput!]!) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              property {
                field {
                  id
                }
                files {
                  id
                  expiryDate
                }
              }
              uploads {
                file {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          data: [{ contentType: "image/png", size: 1024, filename: "ID.png" }],
        },
      );

      expect(createErrors).toBeUndefined();
      expect(createData?.createProfileFieldFileUploadLink).toEqual({
        property: {
          field: {
            id: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          },
          files: [
            {
              id: expect.any(String),
              expiryDate: null,
            },
          ],
        },
        uploads: [{ file: { id: expect.any(String) } }],
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileId: GID!
            $profileTypeFieldId: GID!
            $data: [FileUploadInput!]!
            $expiryDate: Date
          ) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
              expiryDate: $expiryDate
            ) {
              property {
                files {
                  id
                  expiryDate
                }
              }
              uploads {
                file {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          data: [],
          expiryDate: "2024-10-10",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileFieldFileUploadLink).toEqual({
        property: {
          files: [
            {
              id: createData!.createProfileFieldFileUploadLink.property.files[0].id,
              expiryDate: "2024-10-10",
            },
          ],
        },
        uploads: [], // empty array as no files were passed
      });
    });

    it("sends error if passing empty list of files and no expiryDate", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $data: [FileUploadInput!]!) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              property {
                files {
                  id
                  expiryDate
                }
              }
              uploads {
                file {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          data: [],
        },
      );

      expect(errors).toContainGraphQLError("VALIDATOR_CONDITION_ERROR");
      expect(data).toBeNull();
    });

    it("fails if trying to upload more than 10 files", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      const { errors: createErrors, data: createData } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $data: [FileUploadInput!]!) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              property {
                field {
                  id
                }
                files {
                  id
                  expiryDate
                }
              }
              uploads {
                file {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          data: [{ contentType: "image/png", size: 1024, filename: "ID.png" }],
        },
      );

      expect(createErrors).toBeUndefined();
      expect(createData?.createProfileFieldFileUploadLink).toEqual({
        property: {
          field: {
            id: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          },
          files: [
            {
              id: expect.any(String),
              expiryDate: null,
            },
          ],
        },
        uploads: [{ file: { id: expect.any(String) } }],
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileId: GID!
            $profileTypeFieldId: GID!
            $data: [FileUploadInput!]!
            $expiryDate: Date
          ) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
              expiryDate: $expiryDate
            ) {
              property {
                files {
                  id
                  expiryDate
                }
              }
              uploads {
                file {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          data: [],
          expiryDate: "2024-10-10",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileFieldFileUploadLink).toEqual({
        property: {
          files: [
            {
              id: createData!.createProfileFieldFileUploadLink.property.files[0].id,
              expiryDate: "2024-10-10",
            },
          ],
        },
        uploads: [], // empty array as no files were passed
      });
    });

    it("sends error if passing empty list of files and no expiryDate", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $data: [FileUploadInput!]!) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              property {
                files {
                  id
                  expiryDate
                }
              }
              uploads {
                file {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          data: [],
        },
      );

      expect(errors).toContainGraphQLError("VALIDATOR_CONDITION_ERROR");
      expect(data).toBeNull();
    });

    it("fails if trying to upload more than 10 files", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $data: [FileUploadInput!]!) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              property {
                field {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          data: range(0, 11).map(() => ({
            contentType: "image/png",
            size: 1024,
            filename: "ID.png",
          })),
        },
      );

      expect(errors).toContainGraphQLError("MAX_FILES_EXCEEDED");
      expect(data).toBeNull();
    });

    it("fails if trying to upload a file on a field with READ access", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $data: [FileUploadInput!]!) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
            ) {
              property {
                field {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[2].id),
          data: [
            {
              contentType: "image/png",
              size: 1024,
              filename: "ID.png",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if trying to upload a file on a closed profile", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      await mocks.knex.from("profile").where("id", fromGlobalId(profile.id).id).update({
        status: "CLOSED",
        closed_at: new Date(),
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileId: GID!
            $profileTypeFieldId: GID!
            $data: [FileUploadInput!]!
            $expiryDate: Date
          ) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
              expiryDate: $expiryDate
            ) {
              __typename
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          data: [{ contentType: "image/png", size: 1024, filename: "ID.png" }],
          expiryDate: "2025-10-01",
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_STATUS_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("deleteProfileFieldFile", () => {
    it("deletes a file from a profile field", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      const [file] = await mocks.createRandomFileUpload(1);
      await mocks.knex.from("profile_field_file").insert({
        file_upload_id: file.id,
        profile_id: fromGlobalId(profile.id).id,
        profile_type_field_id: profileType2Fields[1].id,
        type: "FILE" as const,
        created_by_user_id: sessionUser.id,
      });

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              properties {
                files {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData.profile).toEqual({
        properties: [
          { files: null },
          { files: [{ id: expect.any(String) }] },
          { files: null },
          { files: null },
          { files: null },
          { files: null },
        ],
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $profileFieldFileIds: [GID!]!) {
            deleteProfileFieldFile(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              profileFieldFileIds: $profileFieldFileIds
            )
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          profileFieldFileIds: [queryData.profile.properties[1].files[0].id],
        },
      );

      expect(errors).toBeUndefined();
      expect(data.deleteProfileFieldFile).toEqual("SUCCESS");

      const { errors: profileEventsQueryErrors, data: profileEventsQueryData } =
        await testClient.execute(
          gql`
            query ($profileId: GID!) {
              profile(profileId: $profileId) {
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    ... on ProfileCreatedEvent {
                      user {
                        id
                      }
                    }
                    ... on ProfileUpdatedEvent {
                      user {
                        id
                      }
                    }
                    ... on ProfileFieldFileRemovedEvent {
                      user {
                        id
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileId: profile.id,
          },
        );

      expect(profileEventsQueryErrors).toBeUndefined();
      expect(profileEventsQueryData.profile).toEqual({
        events: {
          totalCount: 3,
          items: [
            {
              type: "PROFILE_UPDATED",
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_FIELD_FILE_REMOVED",
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_CREATED",
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
          ],
        },
      });
    });

    it("deletes all files from the profile field", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      const files = await mocks.createRandomFileUpload(3);
      await mocks.knex.from("profile_field_file").insert(
        files.map((file) => ({
          file_upload_id: file.id,
          profile_id: fromGlobalId(profile.id).id,
          profile_type_field_id: profileType2Fields[1].id,
          type: "FILE" as const,
          created_by_user_id: sessionUser.id,
        })),
      );

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              properties {
                files {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData.profile).toEqual({
        properties: [
          { files: null },
          {
            files: [
              { id: expect.any(String) },
              { id: expect.any(String) },
              { id: expect.any(String) },
            ],
          },
          { files: null },
          { files: null },
          { files: null },
          { files: null },
        ],
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!) {
            deleteProfileFieldFile(profileId: $profileId, profileTypeFieldId: $profileTypeFieldId)
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data.deleteProfileFieldFile).toEqual("SUCCESS");

      const { errors: profileEventsQueryErrors, data: profileEventsQueryData } =
        await testClient.execute(
          gql`
            query ($profileId: GID!) {
              profile(profileId: $profileId) {
                properties {
                  files {
                    id
                  }
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    ... on ProfileCreatedEvent {
                      user {
                        id
                      }
                    }
                    ... on ProfileUpdatedEvent {
                      user {
                        id
                      }
                    }
                    ... on ProfileFieldFileRemovedEvent {
                      user {
                        id
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileId: profile.id,
          },
        );

      expect(profileEventsQueryErrors).toBeUndefined();
      expect(profileEventsQueryData.profile).toEqual({
        properties: [
          { files: null },
          { files: null },
          { files: null },
          { files: null },
          { files: null },
          { files: null },
        ],
        events: {
          totalCount: 5,
          items: [
            {
              type: "PROFILE_UPDATED",
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_FIELD_FILE_REMOVED",
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_FIELD_FILE_REMOVED",
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_FIELD_FILE_REMOVED",
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
            {
              type: "PROFILE_CREATED",
              user: {
                id: toGlobalId("User", sessionUser.id),
              },
            },
          ],
        },
      });
    });

    it("fails if trying to delete a file on a closed profile", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      await mocks.knex.from("profile").where("id", fromGlobalId(profile.id).id).update({
        status: "CLOSED",
        closed_at: new Date(),
      });

      const [file] = await mocks.createRandomFileUpload(1);
      await mocks.knex.from("profile_field_file").insert({
        file_upload_id: file.id,
        profile_id: fromGlobalId(profile.id).id,
        profile_type_field_id: profileType2Fields[1].id,
        type: "FILE" as const,
        created_by_user_id: sessionUser.id,
      });

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              status
              properties {
                files {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: profile.id,
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData.profile).toEqual({
        status: "CLOSED",
        properties: [
          { files: null },
          { files: [{ id: expect.any(String) }] },
          { files: null },
          { files: null },
          { files: null },
          { files: null },
        ],
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $profileFieldFileIds: [GID!]!) {
            deleteProfileFieldFile(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              profileFieldFileIds: $profileFieldFileIds
            )
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          profileFieldFileIds: [queryData.profile.properties[1].files[0].id],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_STATUS_ERROR");
      expect(data).toBeNull();
    });

    it("fails if trying to delete a file from a field with READ permission", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      const profileId = fromGlobalId(profile.id).id;
      const [file] = await mocks.createRandomFileUpload(1);
      const [profileFieldFile] = await mocks.knex.from("profile_field_file").insert(
        {
          profile_id: profileId,
          profile_type_field_id: profileType2Fields[2].id,
          file_upload_id: file.id,
          type: "FILE" as const,
          created_by_user_id: sessionUser.id,
        },
        "*",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $profileFieldFileIds: [GID!]!) {
            deleteProfileFieldFile(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              profileFieldFileIds: $profileFieldFileIds
            )
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[2].id),
          profileFieldFileIds: [toGlobalId("ProfileFieldFile", profileFieldFile.id)],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("copyFileReplyToProfileFieldFile", () => {
    let fileUploadReply: PetitionFieldReply;
    let file: FileUpload;
    let petition: Petition;

    beforeAll(async () => {
      [file] = await mocks.createRandomFileUpload(1);
      [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1, () => ({
        is_template: false,
        status: "DRAFT",
      }));
      const [fileUploadField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FILE_UPLOAD",
        multiple: true,
      }));
      [fileUploadReply] = await mocks.createRandomFileReply(fileUploadField.id, 1, () => ({
        content: { file_upload_id: file.id },
        type: "FILE_UPLOAD",
        user_id: sessionUser.id,
      }));
    });

    it("copy file reply from petition field to profile FILE field", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileId: GID!
            $profileTypeFieldId: GID!
            $petitionId: GID!
            $fileReplyIds: [GID!]!
          ) {
            copyFileReplyToProfileFieldFile(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              petitionId: $petitionId
              fileReplyIds: $fileReplyIds
            ) {
              file {
                contentType
                filename
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          petitionId: toGlobalId("Petition", petition.id),
          fileReplyIds: [toGlobalId("PetitionFieldReply", fileUploadReply.id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.copyFileReplyToProfileFieldFile).toEqual([
        {
          file: { contentType: file.content_type, filename: file.filename },
        },
      ]);

      const [pff] = await mocks.knex
        .from("profile_field_file")
        .where({
          profile_id: fromGlobalId(profile.id).id,
          profile_type_field_id: profileType2Fields[1].id,
          removed_at: null,
          deleted_at: null,
        })
        .select("*");

      expect(pff.petition_field_reply_id).toEqual(fileUploadReply.id);
    });

    it("fails if copying file reply from petition into a closed profile", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[2].id));
      await mocks.knex.from("profile").where("id", fromGlobalId(profile.id).id).update({
        status: "CLOSED",
        closed_at: new Date(),
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileId: GID!
            $profileTypeFieldId: GID!
            $petitionId: GID!
            $fileReplyIds: [GID!]!
          ) {
            copyFileReplyToProfileFieldFile(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              petitionId: $petitionId
              fileReplyIds: $fileReplyIds
            ) {
              file {
                contentType
                filename
              }
            }
          }
        `,
        {
          profileId: profile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType2Fields[1].id),
          petitionId: toGlobalId("Petition", petition.id),
          fileReplyIds: [toGlobalId("PetitionFieldReply", fileUploadReply.id)],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_STATUS_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("subscribeToProfile", () => {
    let profile: Profile;
    let users: User[];
    let collaboratorApiKey: string;

    beforeEach(async () => {
      profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      users = await mocks.createRandomUsers(organization.id, 3);

      ({ apiKey: collaboratorApiKey } = await mocks.createUserAuthToken(
        "collaborator-apikey",
        users[0].id,
      ));

      const [collaboratorGroup] = await mocks.createUserGroups(1, organization.id, [
        { effect: "DENY", name: "PROFILES:SUBSCRIBE_PROFILES" },
      ]);
      await mocks.insertUserGroupMembers(collaboratorGroup.id, [users[0].id]);
    });

    it("subscribes to a profile", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!, $userIds: [GID!]!) {
            subscribeToProfile(profileIds: $profileIds, userIds: $userIds) {
              id
              subscribers {
                user {
                  id
                }
              }
            }
          }
        `,
        { profileIds: [profile.id], userIds: users.map((u) => toGlobalId("User", u.id)) },
      );

      expect(errors).toBeUndefined();
      expect(data?.subscribeToProfile).toEqual([
        {
          id: profile.id,
          subscribers: [
            { user: { id: toGlobalId("User", users[0].id) } },
            { user: { id: toGlobalId("User", users[1].id) } },
            { user: { id: toGlobalId("User", users[2].id) } },
          ],
        },
      ]);
    });

    it("sends error if collaborator tries to subscribe someone else", async () => {
      const { errors, data } = await testClient.withApiKey(collaboratorApiKey).execute(
        gql`
          mutation ($profileIds: [GID!]!, $userIds: [GID!]!) {
            subscribeToProfile(profileIds: $profileIds, userIds: $userIds) {
              id
              subscribers {
                user {
                  id
                }
              }
            }
          }
        `,
        {
          profileIds: [profile.id],
          userIds: users.slice(1).map((u) => toGlobalId("User", u.id)),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("unsubscribeFromProfile", () => {
    let profile: any;
    let users: User[];

    beforeEach(async () => {
      profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      users = await mocks.createRandomUsers(organization.id, 1);
      await mocks.knex
        .from("profile_subscription")
        .insert({ user_id: users[0].id, profile_id: fromGlobalId(profile.id as string).id });
    });

    it("unsubscribes from a profile", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!, $userIds: [GID!]!) {
            unsubscribeFromProfile(profileIds: $profileIds, userIds: $userIds) {
              id
              subscribers {
                user {
                  id
                }
              }
            }
          }
        `,
        {
          profileIds: [profile.id],
          userIds: [toGlobalId("User", users[0].id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.unsubscribeFromProfile).toEqual([
        {
          id: profile.id,
          subscribers: [],
        },
      ]);
    });
  });

  describe("expiringProfileProperties", () => {
    let profile: any;
    beforeEach(async () => {
      profile = await createProfile(toGlobalId("ProfileType", profileTypes[3].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[0].id),
          content: { value: "2024-03-03" },
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[1].id),
          content: { value: "text reply" },
          expiryDate: "2025-01-01",
        },
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType3Fields[2].id),
          content: { value: "text reply" },
        },
      ]);
    });

    it("queries all the user profile expiring properties", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($limit: Int, $offset: Int) {
            expiringProfileProperties(limit: $limit, offset: $offset) {
              totalCount
              items {
                profile {
                  id
                }
                field {
                  id
                }
                value {
                  id
                  content
                  expiryDate
                }
                files {
                  id
                  expiryDate
                }
              }
            }
          }
        `,
        {
          limit: 100,
          offset: 0,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.expiringProfileProperties).toEqual({
        totalCount: 2,
        items: [
          {
            profile: { id: profile.id },
            field: { id: toGlobalId("ProfileTypeField", profileType3Fields[0].id) },
            value: {
              id: expect.any(String),
              content: { value: "2024-03-03" },
              expiryDate: "2024-03-03",
            },
            files: null,
          },
          {
            profile: { id: profile.id },
            field: { id: toGlobalId("ProfileTypeField", profileType3Fields[1].id) },
            value: {
              id: expect.any(String),
              content: { value: "text reply" },
              expiryDate: "2025-01-01",
            },
            files: null,
          },
        ],
      });
    });

    it("filters expiring profile properties by profile type id", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($limit: Int, $offset: Int, $filter: ProfilePropertyFilter) {
            expiringProfileProperties(limit: $limit, offset: $offset, filter: $filter) {
              totalCount
              items {
                profile {
                  id
                }
                field {
                  id
                }
                value {
                  id
                  content
                  expiryDate
                }
                files {
                  id
                  expiryDate
                }
              }
            }
          }
        `,
        {
          limit: 100,
          offset: 0,
          filter: {
            profileTypeId: [toGlobalId("ProfileType", profileTypes[0].id)],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.expiringProfileProperties).toEqual({
        totalCount: 0,
        items: [],
      });
    });

    it("filters expiring profile properties by profile type field id", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($limit: Int, $offset: Int, $filter: ProfilePropertyFilter) {
            expiringProfileProperties(limit: $limit, offset: $offset, filter: $filter) {
              totalCount
              items {
                profile {
                  id
                }
                field {
                  id
                }
                value {
                  id
                  content
                  expiryDate
                }
                files {
                  id
                  expiryDate
                }
              }
            }
          }
        `,
        {
          limit: 100,
          offset: 0,
          filter: {
            profileTypeFieldId: [toGlobalId("ProfileTypeField", profileType3Fields[0].id)],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.expiringProfileProperties).toEqual({
        totalCount: 1,
        items: [
          {
            profile: { id: profile.id },
            field: { id: toGlobalId("ProfileTypeField", profileType3Fields[0].id) },
            value: {
              id: expect.any(String),
              content: { value: "2024-03-03" },
              expiryDate: "2024-03-03",
            },
            files: null,
          },
        ],
      });
    });
  });

  describe("associateProfileToPetition", () => {
    let petition: Petition;
    let profile: Profile;

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
      [profile] = await mocks.createRandomProfiles(organization.id, profileTypes[0].id);
    });

    it("links a profile to a petition", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
              profile {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    ... on PetitionAssociatedEvent {
                      user {
                        id
                      }
                    }
                  }
                }
                associatedPetitions(limit: 10) {
                  items {
                    id
                  }
                  totalCount
                }
              }
              petition {
                id
                profiles {
                  id
                }
                events(limit: 10, offset: 0) {
                  items {
                    type
                    data
                  }
                  totalCount
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.associateProfileToPetition).toEqual({
        profile: {
          id: toGlobalId("Profile", profile.id),
          events: {
            totalCount: 1,
            items: [
              {
                type: "PETITION_ASSOCIATED",
                user: {
                  id: toGlobalId("User", sessionUser.id),
                },
              },
            ],
          },
          associatedPetitions: {
            items: [{ id: toGlobalId("Petition", petition.id) }],
            totalCount: 1,
          },
        },
        petition: {
          id: toGlobalId("Petition", petition.id),
          profiles: [{ id: toGlobalId("Profile", profile.id) }],
          events: {
            totalCount: 1,
            items: [
              {
                type: "PROFILE_ASSOCIATED",
                data: {
                  userId: toGlobalId("User", sessionUser.id),
                  profileId: toGlobalId("Profile", profile.id),
                },
              },
            ],
          },
        },
      });
    });

    it("does not send error if linking same petition and profile multiple times", async () => {
      const { errors: link1Errors, data: link1Data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
              id
              profile {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(link1Errors).toBeUndefined();
      expect(link1Data?.associateProfileToPetition).toEqual({
        id: expect.any(String),
        profile: {
          id: toGlobalId("Profile", profile.id),
        },
      });

      const { errors: link2Errors, data: link2Data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(link2Errors).toBeUndefined();
      expect(link2Data?.associateProfileToPetition).toEqual({
        id: link1Data.associateProfileToPetition.id,
      });

      const petitionProfiles = await mocks.knex
        .from("petition_profile")
        .where({ petition_id: petition.id })
        .select("*");

      expect(petitionProfiles).toHaveLength(1);
    });

    it("sends error if user doesn't have access to a petition", async () => {
      const [otherUser] = await mocks.createRandomUsers(organization.id, 1);
      const [otherPetition] = await mocks.createRandomPetitions(organization.id, otherUser.id, 1);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
              profile {
                id
                associatedPetitions(limit: 10) {
                  items {
                    id
                  }
                  totalCount
                }
              }
              petition {
                id
                profiles {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", otherPetition.id),
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user doesn't have access to a profile", async () => {
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      const [otherProfileType] = await mocks.createRandomProfileTypes(otherOrg.id, 1);
      const [otherProfile] = await mocks.createRandomProfiles(otherOrg.id, otherProfileType.id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
              profile {
                id
                associatedPetitions(limit: 10) {
                  items {
                    id
                  }
                  totalCount
                }
              }
              petition {
                id
                profiles {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          profileId: toGlobalId("Profile", otherProfile.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("removes relation between profile and petition if petition is permanently deleted", async () => {
      const { errors: linkErrors, data: linkData } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
              profile {
                id
                associatedPetitions(limit: 10) {
                  items {
                    id
                  }
                  totalCount
                }
              }
              petition {
                id
                profiles {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(linkErrors).toBeUndefined();
      expect(linkData?.associateProfileToPetition).toEqual({
        profile: {
          id: toGlobalId("Profile", profile.id),
          associatedPetitions: {
            items: [{ id: toGlobalId("Petition", petition.id) }],
            totalCount: 1,
          },
        },
        petition: {
          id: toGlobalId("Petition", petition.id),
          profiles: [{ id: toGlobalId("Profile", profile.id) }],
        },
      });

      const { errors: deleteError, data: deleteData } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            deletePetitions(ids: [$petitionId], deletePermanently: true)
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        },
      );

      expect(deleteError).toBeUndefined();
      expect(deleteData?.deletePetitions).toEqual("SUCCESS");

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              associatedPetitions(limit: 10) {
                items {
                  id
                }
                totalCount
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profile).toEqual({
        id: toGlobalId("Profile", profile.id),
        associatedPetitions: { items: [], totalCount: 0 },
      });

      const petitionProfile = await mocks.knex
        .from("petition_profile")
        .where({
          petition_id: petition.id,
          profile_id: profile.id,
        })
        .select("*");

      expect(petitionProfile).toHaveLength(0);
    });

    it("do not remove relation between profile and petition if petition is sent to bin", async () => {
      const { errors: linkErrors, data: linkData } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
              profile {
                id
                associatedPetitions(limit: 10) {
                  items {
                    id
                  }
                  totalCount
                }
              }
              petition {
                id
                profiles {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(linkErrors).toBeUndefined();
      expect(linkData?.associateProfileToPetition).toEqual({
        profile: {
          id: toGlobalId("Profile", profile.id),
          associatedPetitions: {
            items: [{ id: toGlobalId("Petition", petition.id) }],
            totalCount: 1,
          },
        },
        petition: {
          id: toGlobalId("Petition", petition.id),
          profiles: [{ id: toGlobalId("Profile", profile.id) }],
        },
      });

      const { errors: deleteError, data: deleteData } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            deletePetitions(ids: [$petitionId])
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        },
      );

      expect(deleteError).toBeUndefined();
      expect(deleteData?.deletePetitions).toEqual("SUCCESS");

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              associatedPetitions(limit: 10) {
                items {
                  id
                }
                totalCount
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profile).toEqual({
        id: toGlobalId("Profile", profile.id),
        associatedPetitions: { items: [], totalCount: 0 },
      });

      const petitionProfile = await mocks.knex
        .from("petition_profile")
        .where({
          petition_id: petition.id,
          profile_id: profile.id,
        })
        .select("*");

      expect(petitionProfile).toHaveLength(1);
    });

    it("removes relation between profile and petition if profile is deleted", async () => {
      const { errors: linkErrors, data: linkData } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
              profile {
                id
                associatedPetitions(limit: 10) {
                  items {
                    id
                  }
                  totalCount
                }
              }
              petition {
                id
                profiles {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(linkErrors).toBeUndefined();
      expect(linkData?.associateProfileToPetition).toEqual({
        profile: {
          id: toGlobalId("Profile", profile.id),
          associatedPetitions: {
            items: [{ id: toGlobalId("Petition", petition.id) }],
            totalCount: 1,
          },
        },
        petition: {
          id: toGlobalId("Petition", petition.id),
          profiles: [{ id: toGlobalId("Profile", profile.id) }],
        },
      });

      await mocks.knex
        .from("profile")
        .where("id", profile.id)
        .update({ status: "CLOSED", closed_at: new Date() });

      const { errors: deleteError, data: deleteData } = await testClient.execute(
        gql`
          mutation ($profileId: GID!) {
            deleteProfile(profileIds: [$profileId])
          }
        `,
        { profileId: toGlobalId("Profile", profile.id) },
      );

      expect(deleteError).toBeUndefined();
      expect(deleteData?.deleteProfile).toEqual("SUCCESS");

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              id
              ... on Petition {
                profiles {
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

      expect(queryErrors).toBeUndefined();
      expect(queryData?.petition).toEqual({
        id: toGlobalId("Petition", petition.id),
        profiles: [],
      });

      const petitionProfile = await mocks.knex
        .from("petition_profile")
        .where({
          petition_id: petition.id,
          profile_id: profile.id,
        })
        .select("*");

      expect(petitionProfile).toHaveLength(0);
    });
  });

  describe("disassociateProfilesFromPetitions", () => {
    let petitions: Petition[];
    let profiles: Profile[];

    beforeEach(async () => {
      await mocks.knex.from("petition_profile").delete();

      petitions = await mocks.createRandomPetitions(organization.id, sessionUser.id, 3);
      profiles = await mocks.createRandomProfiles(organization.id, profileTypes[1].id, 3);
      await mocks.knex("petition_profile").insert([
        {
          petition_id: petitions[0].id,
          profile_id: profiles[0].id,
        },
        {
          petition_id: petitions[0].id,
          profile_id: profiles[2].id,
        },
        {
          petition_id: petitions[1].id,
          profile_id: profiles[0].id,
        },
        {
          petition_id: petitions[1].id,
          profile_id: profiles[1].id,
        },
        {
          petition_id: petitions[1].id,
          profile_id: profiles[2].id,
        },
      ]);
    });

    it("disassociate profile from petition", async () => {
      const { errors: unlinkErrors, data: unlinkData } = await testClient.execute(
        gql`
          mutation ($petitionIds: [GID!]!, $profileIds: [GID!]!) {
            disassociateProfilesFromPetitions(petitionIds: $petitionIds, profileIds: $profileIds)
          }
        `,
        {
          petitionIds: [toGlobalId("Petition", petitions[1].id)],
          profileIds: [toGlobalId("Profile", profiles[0].id)],
        },
      );

      expect(unlinkErrors).toBeUndefined();
      expect(unlinkData?.disassociateProfilesFromPetitions).toEqual("SUCCESS");

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($petitionId: GID!, $profileId: GID!) {
            petition(id: $petitionId) {
              id
              ... on Petition {
                events(limit: 10, offset: 0) {
                  items {
                    type
                    data
                  }
                  totalCount
                }
                profiles {
                  id
                }
              }
            }
            profile(profileId: $profileId) {
              id
              events(limit: 100, offset: 0) {
                totalCount
                items {
                  type
                  ... on PetitionDisassociatedEvent {
                    user {
                      id
                    }
                  }
                }
              }
              associatedPetitions(limit: 10) {
                items {
                  id
                }
                totalCount
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petitions[1].id),
          profileId: toGlobalId("Profile", profiles[0].id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData).toEqual({
        petition: {
          id: toGlobalId("Petition", petitions[1].id),
          profiles: [
            { id: toGlobalId("Profile", profiles[1].id) },
            { id: toGlobalId("Profile", profiles[2].id) },
          ],
          events: {
            items: [
              {
                type: "PROFILE_DISASSOCIATED",
                data: {
                  userId: toGlobalId("User", sessionUser.id),
                  petitionAccessId: null,
                  profileId: toGlobalId("Profile", profiles[0].id),
                },
              },
            ],
            totalCount: 1,
          },
        },
        profile: {
          id: toGlobalId("Profile", profiles[0].id),
          events: {
            totalCount: 1,
            items: [
              {
                type: "PETITION_DISASSOCIATED",
                user: {
                  id: toGlobalId("User", sessionUser.id),
                },
              },
            ],
          },
          associatedPetitions: {
            items: [{ id: toGlobalId("Petition", petitions[0].id) }],
            totalCount: 1,
          },
        },
      });
    });

    it("sends error when not all profiles are associated", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionIds: [GID!]!, $profileIds: [GID!]!) {
            disassociateProfilesFromPetitions(petitionIds: $petitionIds, profileIds: $profileIds)
          }
        `,
        {
          petitionIds: [toGlobalId("Petition", petitions[0].id)],
          profileIds: [toGlobalId("Profile", profiles[1].id)],
        },
      );

      expect(errors).toContainGraphQLError("PROFILE_ASSOCIATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when not all petitions are associated", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!, $petitionIds: [GID!]!) {
            disassociateProfilesFromPetitions(profileIds: $profileIds, petitionIds: $petitionIds)
          }
        `,
        {
          profileIds: [toGlobalId("Profile", profiles[0].id)],
          petitionIds: [
            toGlobalId("Petition", petitions[0].id),
            toGlobalId("Petition", petitions[1].id),
            toGlobalId("Petition", petitions[2].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("PROFILE_ASSOCIATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateProfileTypeFieldPermissions", () => {
    let user: User;
    let userGroup: UserGroup;
    let userApiKey: string;

    beforeAll(async () => {
      [user] = await mocks.createRandomUsers(organization.id, 1);
      [userGroup] = await mocks.createUserGroups(1, organization.id);
      await mocks.insertUserGroupMembers(userGroup.id, [user.id]);
      ({ apiKey: userApiKey } = await mocks.createUserAuthToken("user-token", user.id));
    });

    it("overrides field permission for a given user", async () => {
      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldIds: [GID!]!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionsInput!]!
          ) {
            updateProfileTypeFieldPermissions(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[0].id)],
          data: [{ userId: toGlobalId("User", user.id), permission: "WRITE" }],
          defaultPermission: "READ",
        },
      );

      expect(errors).toBeUndefined();

      const { errors: queryErrors, data: queryData } = await testClient
        .withApiKey(userApiKey)
        .execute(
          gql`
            query ($profileTypeId: GID!) {
              profileType(profileTypeId: $profileTypeId) {
                fields {
                  alias
                  defaultPermission
                  myPermission
                  permissions {
                    permission
                    target {
                      __typename
                      ... on User {
                        id
                      }
                      ... on UserGroup {
                        id
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          },
        );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profileType).toEqual({
        fields: [
          {
            alias: "FIRST_NAME",
            defaultPermission: "READ",
            myPermission: "WRITE",
            permissions: [
              {
                permission: "WRITE",
                target: { __typename: "User", id: toGlobalId("User", user.id) },
              },
            ],
          },
          {
            alias: "LAST_NAME",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "BIRTH_DATE",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "PHONE",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "EMAIL",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "PASSPORT",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "RISK",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "GENDER",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "BACKGROUND_CHECK",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
        ],
      });
    });

    it("overrides field permission for a given user group", async () => {
      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldIds: [GID!]!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionsInput!]!
          ) {
            updateProfileTypeFieldPermissions(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[2].id)],
          defaultPermission: "HIDDEN",
          data: [{ userGroupId: toGlobalId("UserGroup", userGroup.id), permission: "READ" }],
        },
      );

      expect(errors).toBeUndefined();

      const { errors: queryErrors, data: queryData } = await testClient
        .withApiKey(userApiKey)
        .execute(
          gql`
            query ($profileTypeId: GID!) {
              profileType(profileTypeId: $profileTypeId) {
                fields {
                  alias
                  myPermission
                  defaultPermission
                  permissions {
                    permission
                    target {
                      __typename
                      ... on User {
                        id
                      }
                      ... on UserGroup {
                        id
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          },
        );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profileType).toEqual({
        fields: [
          {
            alias: "FIRST_NAME",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "LAST_NAME",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "BIRTH_DATE",
            defaultPermission: "HIDDEN",
            myPermission: "READ",
            permissions: [
              {
                permission: "READ",
                target: { __typename: "UserGroup", id: toGlobalId("UserGroup", userGroup.id) },
              },
            ],
          },
          {
            alias: "PHONE",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "EMAIL",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "PASSPORT",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "RISK",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "GENDER",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "BACKGROUND_CHECK",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
        ],
      });
    });

    it("updates permission if user already has override", async () => {
      await mocks.knex.from("profile_type_field_permission").insert({
        profile_type_field_id: profileType0Fields[0].id,
        user_id: user.id,
        permission: "HIDDEN",
      });

      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldIds: [GID!]!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionsInput!]!
          ) {
            updateProfileTypeFieldPermissions(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[0].id)],
          data: [{ userId: toGlobalId("User", user.id), permission: "READ" }],
          defaultPermission: "READ",
        },
      );

      expect(errors).toBeUndefined();

      const { errors: queryErrors, data: queryData } = await testClient
        .withApiKey(userApiKey)
        .execute(
          gql`
            query ($profileTypeId: GID!) {
              profileType(profileTypeId: $profileTypeId) {
                fields {
                  alias
                  myPermission
                  defaultPermission
                  permissions {
                    permission
                    target {
                      __typename
                      ... on User {
                        id
                      }
                      ... on UserGroup {
                        id
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          },
        );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profileType).toEqual({
        fields: [
          {
            alias: "FIRST_NAME",
            defaultPermission: "READ",
            myPermission: "READ",
            permissions: [
              {
                permission: "READ",
                target: { __typename: "User", id: toGlobalId("User", user.id) },
              },
            ],
          },
          {
            alias: "LAST_NAME",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "BIRTH_DATE",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "PHONE",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "EMAIL",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "PASSPORT",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "RISK",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "GENDER",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "BACKGROUND_CHECK",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
        ],
      });
    });

    it("updates permission if user group already has override", async () => {
      await mocks.knex.from("profile_type_field_permission").insert({
        profile_type_field_id: profileType0Fields[3].id,
        user_group_id: userGroup.id,
        permission: "HIDDEN",
      });

      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldIds: [GID!]!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionsInput!]!
          ) {
            updateProfileTypeFieldPermissions(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[3].id)],
          data: [{ userGroupId: toGlobalId("UserGroup", userGroup.id), permission: "WRITE" }],
          defaultPermission: "READ",
        },
      );

      expect(errors).toBeUndefined();

      const { errors: queryErrors, data: queryData } = await testClient
        .withApiKey(userApiKey)
        .execute(
          gql`
            query ($profileTypeId: GID!) {
              profileType(profileTypeId: $profileTypeId) {
                fields {
                  alias
                  myPermission
                  defaultPermission
                  permissions {
                    permission
                    target {
                      __typename
                      ... on User {
                        id
                      }
                      ... on UserGroup {
                        id
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          },
        );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profileType).toEqual({
        fields: [
          {
            alias: "FIRST_NAME",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "LAST_NAME",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "BIRTH_DATE",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "PHONE",
            defaultPermission: "READ",
            myPermission: "WRITE",
            permissions: [
              {
                permission: "WRITE",
                target: { __typename: "UserGroup", id: toGlobalId("UserGroup", userGroup.id) },
              },
            ],
          },
          {
            alias: "EMAIL",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "PASSPORT",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "RISK",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "GENDER",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "BACKGROUND_CHECK",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
        ],
      });
    });

    it("uses greatest permission between default and user permission", async () => {
      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldIds: [GID!]!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionsInput!]!
          ) {
            updateProfileTypeFieldPermissions(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[2].id)],
          data: [{ userId: toGlobalId("User", user.id), permission: "HIDDEN" }],
          defaultPermission: "READ",
        },
      );
      expect(errors).toBeUndefined();

      const { errors: queryErrors, data: queryData } = await testClient
        .withApiKey(userApiKey)
        .execute(
          gql`
            query ($profileTypeId: GID!) {
              profileType(profileTypeId: $profileTypeId) {
                fields {
                  alias
                  myPermission
                  defaultPermission
                  permissions {
                    permission
                    target {
                      __typename
                      ... on User {
                        id
                      }
                      ... on UserGroup {
                        id
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          },
        );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profileType).toEqual({
        fields: [
          {
            alias: "FIRST_NAME",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "LAST_NAME",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "BIRTH_DATE",
            myPermission: "READ",
            defaultPermission: "READ",
            permissions: [
              {
                permission: "HIDDEN",
                target: { __typename: "User", id: toGlobalId("User", user.id) },
              },
            ],
          },
          {
            alias: "PHONE",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "EMAIL",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "PASSPORT",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "RISK",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "GENDER",
            myPermission: "WRITE",
            defaultPermission: "WRITE",
            permissions: [],
          },
          {
            alias: "BACKGROUND_CHECK",
            defaultPermission: "WRITE",
            myPermission: "WRITE",
            permissions: [],
          },
        ],
      });
    });

    it("sends error if updating to HIDDEN a profile type field used on a profile_name_pattern", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldIds: [GID!]!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionsInput!]!
          ) {
            updateProfileTypeFieldPermissions(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[0].id)],
          defaultPermission: "HIDDEN",
          data: [],
        },
      );
      expect(errors).toContainGraphQLError("PROFILE_TYPE_FIELD_IS_PART_OF_PROFILE_NAME");
      expect(data).toBeNull();
    });

    it("removes every permission when passing empty array", async () => {
      await mocks.knex.from("profile_type_field_permission").insert({
        user_id: user.id,
        profile_type_field_id: profileType0Fields[2].id,
        permission: "READ",
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldIds: [GID!]!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionsInput!]!
          ) {
            updateProfileTypeFieldPermissions(
              profileTypeId: $profileTypeId
              profileTypeFieldIds: $profileTypeFieldIds
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
              fields {
                defaultPermission
                myPermission
                permissions {
                  __typename
                }
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldIds: [toGlobalId("ProfileTypeField", profileType0Fields[2].id)],
          data: [],
          defaultPermission: "WRITE",
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeFieldPermissions).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        fields: profileType0Fields.map(() => ({
          permissions: [],
          defaultPermission: "WRITE",
          myPermission: "WRITE",
        })),
      });
    });
  });

  describe("reopenProfile", () => {
    let closedProfile: Profile;
    let openProfile: Profile;

    beforeEach(async () => {
      [closedProfile] = await mocks.createRandomProfiles(
        organization.id,
        profileTypes[0].id,
        1,
        () => ({
          status: "CLOSED",
          closed_at: new Date(),
        }),
      );
      [openProfile] = await mocks.createRandomProfiles(organization.id, profileTypes[0].id);
    });

    it("updates profile status to OPEN", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            reopenProfile(profileIds: $profileIds) {
              id
              status
              events(limit: 100, offset: 0) {
                items {
                  type
                  ... on ProfileReopenedEvent {
                    user {
                      id
                    }
                  }
                }
                totalCount
              }
            }
          }
        `,
        {
          profileIds: [toGlobalId("Profile", closedProfile.id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.reopenProfile).toEqual([
        {
          id: toGlobalId("Profile", closedProfile.id),
          status: "OPEN",
          events: {
            totalCount: 1,
            items: [
              {
                type: "PROFILE_REOPENED",
                user: { id: toGlobalId("User", sessionUser.id) },
              },
            ],
          },
        },
      ]);

      const [dbProfile] = await mocks.knex
        .from("profile")
        .where("id", closedProfile.id)
        .select("*");

      expect(dbProfile).toMatchObject({
        id: closedProfile.id,
        status: "OPEN",
        closed_at: null,
        deletion_scheduled_at: null,
      });
    });

    it("sends error if profile is already in wanted status", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            reopenProfile(profileIds: $profileIds) {
              id
            }
          }
        `,
        {
          profileIds: [toGlobalId("Profile", openProfile.id)],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_STATUS_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("closeProfile", () => {
    let profile: Profile;

    beforeEach(async () => {
      [profile] = await mocks.createRandomProfiles(organization.id, profileTypes[0].id);
    });

    it("updates profile status to CLOSED", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            closeProfile(profileIds: $profileIds) {
              id
              status
              events(limit: 100, offset: 0) {
                items {
                  type
                  ... on ProfileClosedEvent {
                    user {
                      id
                    }
                  }
                }
                totalCount
              }
            }
          }
        `,
        {
          profileIds: [toGlobalId("Profile", profile.id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.closeProfile).toEqual([
        {
          id: toGlobalId("Profile", profile.id),
          status: "CLOSED",
          events: {
            totalCount: 1,
            items: [
              {
                type: "PROFILE_CLOSED",
                user: { id: toGlobalId("User", sessionUser.id) },
              },
            ],
          },
        },
      ]);

      const [dbProfile] = await mocks.knex.from("profile").where("id", profile.id).select("*");

      expect(dbProfile).toMatchObject({
        id: profile.id,
        status: "CLOSED",
        closed_at: expect.any(Date),
        deletion_scheduled_at: null,
      });
    });
  });

  describe("scheduleProfileForDeletion", () => {
    let openProfile: Profile;
    let closedProfile: Profile;
    const closedAtDate = new Date("2023-07-24T00:00:00.000Z");

    beforeEach(async () => {
      [openProfile, closedProfile] = await mocks.createRandomProfiles(
        organization.id,
        profileTypes[0].id,
        2,
        (i) => ({
          status: i === 0 ? "OPEN" : "CLOSED",
          closed_at: i === 0 ? null : closedAtDate,
        }),
      );
    });

    it("schedules an OPEN profile for deletion", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            scheduleProfileForDeletion(profileIds: $profileIds) {
              id
              status
              events(limit: 100, offset: 0) {
                items {
                  type
                  ... on ProfileScheduledForDeletionEvent {
                    user {
                      id
                    }
                  }
                }
                totalCount
              }
            }
          }
        `,
        {
          profileIds: [toGlobalId("Profile", openProfile.id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.scheduleProfileForDeletion).toEqual([
        {
          id: toGlobalId("Profile", openProfile.id),
          status: "DELETION_SCHEDULED",
          events: {
            totalCount: 1,
            items: [
              {
                type: "PROFILE_SCHEDULED_FOR_DELETION",
                user: { id: toGlobalId("User", sessionUser.id) },
              },
            ],
          },
        },
      ]);

      const [dbProfile] = await mocks.knex.from("profile").where("id", openProfile.id).select("*");

      expect(dbProfile).toMatchObject({
        id: openProfile.id,
        status: "DELETION_SCHEDULED",
        deletion_scheduled_at: expect.any(Date),
        closed_at: null,
      });
    });

    it("schedules a CLOSED profile for deletion", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            scheduleProfileForDeletion(profileIds: $profileIds) {
              id
              status
              events(limit: 100, offset: 0) {
                items {
                  type
                  ... on ProfileScheduledForDeletionEvent {
                    user {
                      id
                    }
                  }
                }
                totalCount
              }
            }
          }
        `,
        {
          profileIds: [toGlobalId("Profile", closedProfile.id)],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.scheduleProfileForDeletion).toEqual([
        {
          id: toGlobalId("Profile", closedProfile.id),
          status: "DELETION_SCHEDULED",
          events: {
            totalCount: 1,
            items: [
              {
                type: "PROFILE_SCHEDULED_FOR_DELETION",
                user: { id: toGlobalId("User", sessionUser.id) },
              },
            ],
          },
        },
      ]);

      const [dbProfile] = await mocks.knex
        .from("profile")
        .where("id", closedProfile.id)
        .select("*");

      expect(dbProfile).toMatchObject({
        id: closedProfile.id,
        status: "DELETION_SCHEDULED",
        deletion_scheduled_at: expect.any(Date),
        closed_at: closedAtDate,
      });

      expect(dbProfile.closed_at!.getTime()).toBeLessThan(
        dbProfile.deletion_scheduled_at!.getTime(),
      );
    });

    it("going from CLOSED to DELETION_SCHEDULED and back to CLOSED should keep first closed_at date", async () => {
      const { errors } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            scheduleProfileForDeletion(profileIds: $profileIds) {
              id
            }
          }
        `,
        {
          profileIds: [toGlobalId("Profile", closedProfile.id)],
        },
      );

      expect(errors).toBeUndefined();

      const [scheduledDbProfile] = await mocks.knex
        .from("profile")
        .where("id", closedProfile.id)
        .select("*");

      expect(scheduledDbProfile).toMatchObject({
        id: closedProfile.id,
        status: "DELETION_SCHEDULED",
        deletion_scheduled_at: expect.any(Date),
        closed_at: closedAtDate,
      });

      const { errors: errors2 } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            closeProfile(profileIds: $profileIds) {
              id
            }
          }
        `,
        {
          profileIds: [toGlobalId("Profile", closedProfile.id)],
        },
      );

      expect(errors2).toBeUndefined();

      const [closedDbProfile] = await mocks.knex
        .from("profile")
        .where("id", closedProfile.id)
        .select("*");

      expect(closedDbProfile).toMatchObject({
        id: closedProfile.id,
        status: "CLOSED",
        deletion_scheduled_at: null,
        closed_at: closedAtDate,
      });
    });
  });

  describe("copyReplyContentToProfileFieldValue", () => {
    let petition: Petition;
    let textReply: PetitionFieldReply;

    let profile: Profile;

    let withSavedEntity: PetitionFieldReply;
    let withAllFalsePositives: PetitionFieldReply;
    let withNoSavedEntity: PetitionFieldReply;
    let withEmptySearch: PetitionFieldReply;

    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
      const petitionFields = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        type: ["TEXT", "BACKGROUND_CHECK"][i] as PetitionFieldType,
        multiple: true,
      }));

      [textReply] = await mocks.createRandomTextReply(petitionFields[0].id, undefined, 1, () => ({
        user_id: sessionUser.id,
      }));

      [withSavedEntity] = await mocks.createRandomTextReply(
        petitionFields[1].id,
        undefined,
        1,
        () => ({
          user_id: sessionUser.id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "PERSON",
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
              ],
              createdAt: new Date().toISOString(),
            },
            entity: {
              id: "Q7747",
              name: "Vladimir Vladimirovich PUTIN",
              type: "Person",
              properties: {},
              createdAt: new Date().toISOString(),
            },
          },
        }),
      );

      [withAllFalsePositives] = await mocks.createRandomTextReply(
        petitionFields[1].id,
        undefined,
        1,
        () => ({
          user_id: sessionUser.id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "PERSON",
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "Q7748",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
              ],
              createdAt: new Date().toISOString(),
            },
            entity: null,
            falsePositives: [
              { id: "Q7747", addedAt: new Date().toISOString(), addedByUserId: sessionUser.id },
              { id: "Q7748", addedAt: new Date().toISOString(), addedByUserId: sessionUser.id },
            ],
          },
        }),
      );

      [withNoSavedEntity] = await mocks.createRandomTextReply(
        petitionFields[1].id,
        undefined,
        1,
        () => ({
          user_id: sessionUser.id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "PERSON",
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "Q7748",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
              ],
              createdAt: new Date().toISOString(),
            },
            entity: null,
            falsePositives: [
              { id: "Q7747", addedAt: new Date().toISOString(), addedByUserId: sessionUser.id },
            ],
          },
        }),
      );

      [withEmptySearch] = await mocks.createRandomTextReply(
        petitionFields[1].id,
        undefined,
        1,
        () => ({
          user_id: sessionUser.id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "PERSON",
            },
            search: {
              totalCount: 0,
              items: [],
              createdAt: new Date().toISOString(),
            },
            entity: null,
          },
        }),
      );
    });

    beforeEach(async () => {
      await mocks.knex.from("profile_type_field_permission").insert({
        profile_type_field_id: profileType0Fields[8].id,
        permission: "WRITE",
        user_id: sessionUser.id,
      });

      [profile] = await mocks.createRandomProfiles(organization.id, profileTypes[0].id);
    });

    it("fails if user does not have WRITE permission on the profile type field", async () => {
      await mocks.knex.from("profile_type_field").where("id", profileType0Fields[8].id).update({
        permission: "HIDDEN",
      });

      await mocks.knex
        .from("profile_type_field_permission")
        .where({ profile_type_field_id: profileType0Fields[8].id, user_id: sessionUser.id })
        .update({ permission: "READ" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $replyId: GID!
            $profileId: GID!
            $profileTypeFieldId: GID!
          ) {
            copyReplyContentToProfileFieldValue(
              petitionId: $petitionId
              replyId: $replyId
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
            ) {
              id
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", withSavedEntity.id),
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
        },
      );

      await mocks.knex.from("profile_type_field").where("id", profileType0Fields[8].id).update({
        permission: "WRITE",
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if target reply is not BACKGROUND_CHECK", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $replyId: GID!
            $profileId: GID!
            $profileTypeFieldId: GID!
          ) {
            copyReplyContentToProfileFieldValue(
              petitionId: $petitionId
              replyId: $replyId
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
            ) {
              id
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", textReply.id),
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
        },
      );

      expect(errors).toContainGraphQLError("INVALID_FIELD_TYPE_ERROR");
      expect(data).toBeNull();
    });

    it("copies BACKGROUND_CHECK reply with saved entity to profile as non-draft value", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $replyId: GID!
            $profileId: GID!
            $profileTypeFieldId: GID!
          ) {
            copyReplyContentToProfileFieldValue(
              petitionId: $petitionId
              replyId: $replyId
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
            ) {
              id
              content
              isDraft
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", withSavedEntity.id),
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.copyReplyContentToProfileFieldValue).toEqual({
        id: expect.any(String),
        isDraft: false,
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: "PERSON",
          },
          search: {
            totalCount: 1,
            falsePositivesCount: 0,
            createdAt: expect.any(String),
          },
          entity: {
            id: "Q7747",
            name: "Vladimir Vladimirovich PUTIN",
            type: "Person",
            properties: {},
            createdAt: expect.any(String),
          },
        },
      });
    });

    it("copies BACKGROUND_CHECK reply with all false positives to profile as non-draft value", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $replyId: GID!
            $profileId: GID!
            $profileTypeFieldId: GID!
          ) {
            copyReplyContentToProfileFieldValue(
              petitionId: $petitionId
              replyId: $replyId
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
            ) {
              id
              content
              isDraft
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", withAllFalsePositives.id),
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.copyReplyContentToProfileFieldValue).toEqual({
        id: expect.any(String),
        isDraft: false,
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: "PERSON",
          },
          search: {
            totalCount: 2,
            falsePositivesCount: 2,
            createdAt: expect.any(String),
          },
          entity: null,
        },
      });
    });

    it("copies BACKGROUND_CHECK reply with no saved entity to profile as draft value", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $replyId: GID!
            $profileId: GID!
            $profileTypeFieldId: GID!
          ) {
            copyReplyContentToProfileFieldValue(
              petitionId: $petitionId
              replyId: $replyId
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
            ) {
              id
              content
              isDraft
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", withNoSavedEntity.id),
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.copyReplyContentToProfileFieldValue).toEqual({
        id: expect.any(String),
        isDraft: true,
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: "PERSON",
          },
          search: {
            totalCount: 2,
            falsePositivesCount: 1,
            createdAt: expect.any(String),
          },
          entity: null,
        },
      });
    });

    it("copies BACKGROUND_CHECK reply with empty search to profile as draft value", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $replyId: GID!
            $profileId: GID!
            $profileTypeFieldId: GID!
          ) {
            copyReplyContentToProfileFieldValue(
              petitionId: $petitionId
              replyId: $replyId
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
            ) {
              id
              content
              isDraft
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", withEmptySearch.id),
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[8].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.copyReplyContentToProfileFieldValue).toEqual({
        id: expect.any(String),
        isDraft: true,
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: "PERSON",
          },
          search: {
            totalCount: 0,
            falsePositivesCount: 0,
            createdAt: expect.any(String),
          },
          entity: null,
        },
      });
    });
  });

  describe("pinProfileType", () => {
    it("pins a profile type to the user's navbar", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            pinProfileType(profileTypeId: $profileTypeId) {
              id
              isPinned
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.pinProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        isPinned: true,
      });

      const dbPinnedProfileType = await mocks.knex
        .from("user_profile_type_pinned")
        .where({
          user_id: sessionUser.id,
          profile_type_id: profileTypes[0].id,
        })
        .first();

      expect(dbPinnedProfileType).toBeDefined();

      const { errors: queryErrors, data: queryData } = await testClient.execute(gql`
        query {
          me {
            pinnedProfileTypes {
              id
            }
          }
        }
      `);

      expect(queryErrors).toBeUndefined();
      expect(queryData?.me.pinnedProfileTypes).toEqual([
        { id: toGlobalId("ProfileType", profileTypes[0].id) },
      ]);
    });

    it("does nothing when pinning the same profile type twice", async () => {
      // First pin
      await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            pinProfileType(profileTypeId: $profileTypeId) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
        },
      );

      // Second pin (should not throw an error)
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            pinProfileType(profileTypeId: $profileTypeId) {
              id
              isPinned
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.pinProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[1].id),
        isPinned: true,
      });

      const dbPinnedProfileTypes = await mocks.knex.from("user_profile_type_pinned").where({
        user_id: sessionUser.id,
        profile_type_id: profileTypes[1].id,
      });

      expect(dbPinnedProfileTypes).toHaveLength(1);
    });

    it("allows to pin an archived profile type", async () => {
      await mocks.knex
        .from("profile_type")
        .where("id", profileTypes[2].id)
        .update({ archived_at: new Date(), archived_by_user_id: sessionUser.id });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            pinProfileType(profileTypeId: $profileTypeId) {
              id
              isPinned
              archivedAt
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[2].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.pinProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[2].id),
        isPinned: true,
        archivedAt: expect.any(Date),
      });

      const dbPinnedProfileType = await mocks.knex
        .from("user_profile_type_pinned")
        .where({
          user_id: sessionUser.id,
          profile_type_id: profileTypes[2].id,
        })
        .first();

      expect(dbPinnedProfileType).toBeDefined();
    });
  });

  describe("unpinProfileType", () => {
    it("unpins a profile type from the user's navbar", async () => {
      await mocks.knex
        .from("user_profile_type_pinned")
        .insert({ user_id: sessionUser.id, profile_type_id: profileTypes[0].id });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            unpinProfileType(profileTypeId: $profileTypeId) {
              id
              isPinned
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.unpinProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        isPinned: false,
      });

      const dbPinnedProfileType = await mocks.knex
        .from("user_profile_type_pinned")
        .where({
          user_id: sessionUser.id,
          profile_type_id: profileTypes[0].id,
        })
        .first();

      expect(dbPinnedProfileType).toBeUndefined();
    });

    it("does nothing when unpinning the same profile type twice", async () => {
      await mocks.knex
        .from("user_profile_type_pinned")
        .insert({ user_id: sessionUser.id, profile_type_id: profileTypes[1].id });

      // Unpin the profile type
      await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            unpinProfileType(profileTypeId: $profileTypeId) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
        },
      );

      // Try to unpin again (should not throw an error)
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            unpinProfileType(profileTypeId: $profileTypeId) {
              id
              isPinned
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[1].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.unpinProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[1].id),
        isPinned: false,
      });

      const dbPinnedProfileType = await mocks.knex
        .from("user_profile_type_pinned")
        .where({
          user_id: sessionUser.id,
          profile_type_id: profileTypes[1].id,
        })
        .first();

      expect(dbPinnedProfileType).toBeUndefined();
    });
  });

  describe("profileTypeFieldValueHistory", () => {
    let profileType: ProfileType;
    let profileTypeFieldsByType: Record<ProfileTypeFieldType, ProfileTypeField>;

    let profile: Profile;
    let profilesRepo: ProfileRepository;
    beforeAll(() => {
      profilesRepo = testClient.container.get(ProfileRepository);
    });
    beforeEach(async () => {
      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);

      const profileTypeFields = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        ProfileTypeFieldTypeValues.length,
        (i) => ({
          type: ProfileTypeFieldTypeValues[i],
        }),
      );

      profileTypeFieldsByType = indexBy(profileTypeFields, (f) => f.type);

      await mocks.knex
        .from("profile_type_field")
        .whereIn("id", [
          profileTypeFieldsByType["SELECT"].id,
          profileTypeFieldsByType["CHECKBOX"].id,
        ])
        .update({
          options: {
            standardList: null,
            values: [
              {
                value: "option_1",
                label: { en: "Option 1", es: "Opción 1" },
              },
              {
                value: "option_2",
                label: { en: "Option 2", es: "Opción 2" },
              },
              {
                value: "option_3",
                label: { en: "Option 3", es: "Opción 3" },
              },
            ],
          },
        });

      [profile] = await mocks.createRandomProfiles(organization.id, profileType.id);

      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["TEXT"].id),
          content: { value: "Hello!" },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["TEXT"].id),
          content: { value: "Hello World!" },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["TEXT"].id),
          content: { value: "Hello" },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["TEXT"].id),
          content: { value: "Bye!" },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["TEXT"].id),
          content: null,
        },
      ]);

      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["DATE"].id),
          content: { value: "2025-01-01" },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["DATE"].id),
          content: null,
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["DATE"].id),
          content: { value: "2025-02-01" },
        },
      ]);

      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["NUMBER"].id),
          content: { value: 1 },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["NUMBER"].id),
          content: { value: 2 },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["NUMBER"].id),
          content: { value: 3 },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["NUMBER"].id),
          content: null,
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["NUMBER"].id),
          content: { value: 4 },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["NUMBER"].id),
          content: { value: 40 },
        },
      ]);

      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["SELECT"].id),
          content: { value: "option_2" },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["SELECT"].id),
          content: { value: "option_2" },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["SELECT"].id),
          content: { value: "option_3" },
        },
      ]);

      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId(
            "ProfileTypeField",
            profileTypeFieldsByType["CHECKBOX"].id,
          ),
          content: { value: ["option_1"] },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId(
            "ProfileTypeField",
            profileTypeFieldsByType["CHECKBOX"].id,
          ),
          content: { value: ["option_1", "option_2"] },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId(
            "ProfileTypeField",
            profileTypeFieldsByType["CHECKBOX"].id,
          ),
          content: { value: ["option_1", "option_2", "option_3"] },
        },
      ]);
      await updateProfileValue(toGlobalId("Profile", profile.id), [
        {
          profileTypeFieldId: toGlobalId(
            "ProfileTypeField",
            profileTypeFieldsByType["CHECKBOX"].id,
          ),
          content: { value: ["option_1", "option_3"] },
        },
      ]);

      await profilesRepo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            type: "BACKGROUND_CHECK",
            profileTypeFieldId: profileTypeFieldsByType["BACKGROUND_CHECK"].id,
            content: {
              query: {
                name: "John Doe",
                date: "2024-10-10",
                type: "PERSON",
                country: "FR",
              },
              search: {
                totalCount: 2,
                items: [
                  {
                    id: "123",
                    type: "PERSON",
                    name: "John Doe",
                    properties: {},
                  },
                  {
                    id: "1234",
                    type: "PERSON",
                    name: "John Doe 2",
                    properties: {},
                  },
                ],
                createdAt: new Date(),
              },
              entity: null,
            },
          },
        ],
        sessionUser.id,
        organization.id,
        "MANUAL",
      );

      await profilesRepo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            type: "BACKGROUND_CHECK",
            profileTypeFieldId: profileTypeFieldsByType["BACKGROUND_CHECK"].id,
            content: {
              query: {
                name: "John Doe",
                date: "2024-10-10",
                type: "PERSON",
                country: "FR",
              },
              search: {
                totalCount: 2,
                items: [
                  {
                    id: "123",
                    type: "PERSON",
                    name: "John Doe",
                    properties: {},
                  },
                  {
                    id: "1234",
                    type: "PERSON",
                    name: "John Doe 2",
                    properties: {},
                  },
                ],
                createdAt: new Date(),
              },
              entity: null,
              falsePositives: [{ id: "1234", addedAt: new Date(), addedByUserId: sessionUser.id }],
            },
          },
        ],
        sessionUser.id,
        organization.id,
        "MANUAL",
      );
      await profilesRepo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            type: "BACKGROUND_CHECK",
            profileTypeFieldId: profileTypeFieldsByType["BACKGROUND_CHECK"].id,
            content: {
              query: {
                name: "John Doe",
                date: "2024-10-10",
                type: "PERSON",
                country: "FR",
              },
              search: {
                totalCount: 2,
                items: [
                  {
                    id: "123",
                    type: "PERSON",
                    name: "John Doe",
                    properties: {},
                  },
                  {
                    id: "1234",
                    type: "PERSON",
                    name: "John Doe 2",
                    properties: {},
                  },
                ],
                createdAt: new Date(),
              },
              entity: {
                id: "123",
                type: "PERSON",
                name: "John Doe",
                properties: {},
                createdAt: new Date(),
              },
              falsePositives: [{ id: "1234", addedAt: new Date(), addedByUserId: sessionUser.id }],
            },
          },
        ],
        sessionUser.id,
        organization.id,
        "MANUAL",
      );
    });

    it("gets history of a TEXT property", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          query ($profileId: GID!, $profileTypeFieldId: GID!) {
            profileTypeFieldValueHistory(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              offset: 0
              limit: 100
            ) {
              totalCount
              items {
                id
                content
                createdAt
                removedAt
                source
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["TEXT"].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileTypeFieldValueHistory).toEqual({
        totalCount: 4,
        items: [
          {
            id: expect.any(String),
            content: { value: "Bye!" },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
            source: "MANUAL",
          },
          {
            id: expect.any(String),
            content: { value: "Hello" },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
            source: "MANUAL",
          },
          {
            id: expect.any(String),
            content: { value: "Hello World!" },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
            source: "MANUAL",
          },
          {
            id: expect.any(String),
            content: { value: "Hello!" },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
            source: "MANUAL",
          },
        ],
      });
    });

    it("gets history of a DATE property", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          query ($profileId: GID!, $profileTypeFieldId: GID!) {
            profileTypeFieldValueHistory(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              offset: 0
              limit: 100
            ) {
              totalCount
              items {
                id
                content
                createdAt
                removedAt
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["DATE"].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileTypeFieldValueHistory).toEqual({
        totalCount: 2,
        items: [
          {
            id: expect.any(String),
            content: { value: "2025-02-01" },
            createdAt: expect.any(Date),
            removedAt: null,
          },
          {
            id: expect.any(String),
            content: { value: "2025-01-01" },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
        ],
      });
    });

    it("gets history of a NUMBER property", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          query ($profileId: GID!, $profileTypeFieldId: GID!) {
            profileTypeFieldValueHistory(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              offset: 1
              limit: 100
            ) {
              totalCount
              items {
                id
                content
                createdAt
                removedAt
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["NUMBER"].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileTypeFieldValueHistory).toEqual({
        totalCount: 5,
        items: [
          {
            id: expect.any(String),
            content: { value: 4 },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
          {
            id: expect.any(String),
            content: { value: 3 },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
          {
            id: expect.any(String),
            content: { value: 2 },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
          {
            id: expect.any(String),
            content: { value: 1 },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
        ],
      });
    });

    it("gets history of a SELECT property", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          query ($profileId: GID!, $profileTypeFieldId: GID!) {
            profileTypeFieldValueHistory(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              offset: 0
              limit: 100
            ) {
              totalCount
              items {
                id
                content
                createdAt
                removedAt
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["SELECT"].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileTypeFieldValueHistory).toEqual({
        totalCount: 2,
        items: [
          {
            id: expect.any(String),
            content: { value: "option_3" },
            createdAt: expect.any(Date),
            removedAt: null,
          },
          {
            id: expect.any(String),
            content: { value: "option_2" },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
        ],
      });
    });

    it("gets history of a CHECKBOX property", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          query ($profileId: GID!, $profileTypeFieldId: GID!) {
            profileTypeFieldValueHistory(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              offset: 0
              limit: 100
            ) {
              totalCount
              items {
                id
                content
                createdAt
                removedAt
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId(
            "ProfileTypeField",
            profileTypeFieldsByType["CHECKBOX"].id,
          ),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileTypeFieldValueHistory).toEqual({
        totalCount: 4,
        items: [
          {
            id: expect.any(String),
            content: { value: ["option_1", "option_3"] },
            createdAt: expect.any(Date),
            removedAt: null,
          },
          {
            id: expect.any(String),
            content: { value: ["option_1", "option_2", "option_3"] },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
          {
            id: expect.any(String),
            content: { value: ["option_1", "option_2"] },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
          {
            id: expect.any(String),
            content: { value: ["option_1"] },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
        ],
      });
    });

    it("gets history of a BACKGROUND_CHECK property", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          query ($profileId: GID!, $profileTypeFieldId: GID!) {
            profileTypeFieldValueHistory(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              offset: 0
              limit: 100
            ) {
              totalCount
              items {
                id
                content
                createdAt
                removedAt
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId(
            "ProfileTypeField",
            profileTypeFieldsByType["BACKGROUND_CHECK"].id,
          ),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileTypeFieldValueHistory).toEqual({
        totalCount: 3,
        items: [
          {
            id: expect.any(String),
            content: {
              query: {
                name: "John Doe",
                date: "2024-10-10",
                type: "PERSON",
                country: "FR",
              },
              search: {
                totalCount: 2,
                falsePositivesCount: 1,
                createdAt: expect.any(String),
              },
              entity: {
                id: "123",
                type: "PERSON",
                name: "John Doe",
                properties: {},
                createdAt: expect.any(String),
              },
            },
            createdAt: expect.any(Date),
            removedAt: null,
          },
          {
            id: expect.any(String),
            content: {
              query: {
                name: "John Doe",
                date: "2024-10-10",
                type: "PERSON",
                country: "FR",
              },
              search: {
                totalCount: 2,
                falsePositivesCount: 1,
                createdAt: expect.any(String),
              },
              entity: null,
            },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
          {
            id: expect.any(String),
            content: {
              query: {
                name: "John Doe",
                date: "2024-10-10",
                type: "PERSON",
                country: "FR",
              },
              search: {
                totalCount: 2,
                falsePositivesCount: 0,
                createdAt: expect.any(String),
              },
              entity: null,
            },
            createdAt: expect.any(Date),
            removedAt: expect.any(Date),
          },
        ],
      });
    });

    it("sends error if property is of type FILE", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($profileId: GID!, $profileTypeFieldId: GID!) {
            profileTypeFieldValueHistory(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              offset: 0
              limit: 100
            ) {
              totalCount
              items {
                id
                content
                createdAt
                removedAt
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldsByType["FILE"].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("profileTypeFieldFileHistory", () => {
    let profileType: ProfileType;

    let profile: Profile;
    let profileTypeField: ProfileTypeField;
    let profilesRepo: ProfileRepository;

    let fileUploads: FileUpload[];
    let pffs1: ProfileFieldFile[];
    let pffs2: ProfileFieldFile[];
    beforeAll(() => {
      profilesRepo = testClient.container.get(ProfileRepository);
    });

    beforeEach(async () => {
      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);

      [profileTypeField] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        1,
        () => ({
          type: "FILE",
        }),
      );

      [profile] = await mocks.createRandomProfiles(organization.id, profileType.id);

      fileUploads = await mocks.createRandomFileUpload(3, (i) => ({
        filename: `file_${i + 1}.pdf`,
      }));
      pffs1 = await profilesRepo.createProfileFieldFiles(
        profile.id,
        profileTypeField.id,
        fileUploads.slice(0, 2).map((fu) => ({ fileUploadId: fu.id })),
        null,
        sessionUser.id,
        "MANUAL",
      );
      await profilesRepo.createProfileUpdatedEvents(
        profile.id,
        pffs1.map((pff) => ({
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_FILE_ADDED",
          data: {
            profile_type_field_id: profileTypeField.id,
            profile_field_file_id: pff.id,
            alias: profileTypeField.alias,
            user_id: sessionUser.id,
          },
        })),
        organization.id,
        sessionUser.id,
      );

      await profilesRepo.deleteProfileFieldFiles(pffs1[0].id, sessionUser.id);
      await profilesRepo.createProfileUpdatedEvents(
        profile.id,
        [
          {
            org_id: organization.id,
            profile_id: profile.id,
            type: "PROFILE_FIELD_FILE_REMOVED",
            data: {
              user_id: sessionUser.id,
              profile_type_field_id: profileTypeField.id,
              profile_field_file_id: pffs1[0].id,
              alias: profileTypeField.alias,
            },
          },
        ],
        organization.id,
        sessionUser.id,
      );

      pffs2 = await profilesRepo.createProfileFieldFiles(
        profile.id,
        profileTypeField.id,
        fileUploads.slice(2).map((fu) => ({ fileUploadId: fu.id })),
        null,
        sessionUser.id,
        "MANUAL",
      );
      await profilesRepo.createProfileUpdatedEvents(
        profile.id,
        pffs2.map((pff) => ({
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_FILE_ADDED",
          data: {
            profile_type_field_id: profileTypeField.id,
            profile_field_file_id: pff.id,
            alias: profileTypeField.alias,
            user_id: sessionUser.id,
          },
        })),
        organization.id,
        sessionUser.id,
      );
    });

    it("gets history of a FILE property", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          query ($profileId: GID!, $profileTypeFieldId: GID!) {
            profileTypeFieldFileHistory(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              offset: 0
              limit: 100
            ) {
              totalCount
              items {
                eventType
                profileFieldFile {
                  id
                  source
                  createdBy {
                    id
                  }
                  createdAt
                  file {
                    filename
                  }
                  removedBy {
                    id
                  }
                  removedAt
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileTypeFieldFileHistory).toEqual({
        totalCount: 4,
        items: [
          {
            eventType: "ADDED",
            profileFieldFile: {
              id: toGlobalId("ProfileFieldFile", pffs2[0].id),
              source: "MANUAL",
              createdBy: {
                id: toGlobalId("User", sessionUser.id),
              },
              createdAt: expect.any(Date),
              file: {
                filename: "file_3.pdf",
              },
              removedBy: null,
              removedAt: null,
            },
          },
          {
            eventType: "REMOVED",
            profileFieldFile: {
              id: toGlobalId("ProfileFieldFile", pffs1[0].id),
              source: "MANUAL",
              createdBy: {
                id: toGlobalId("User", sessionUser.id),
              },
              createdAt: expect.any(Date),
              file: {
                filename: "file_1.pdf",
              },
              removedBy: {
                id: toGlobalId("User", sessionUser.id),
              },
              removedAt: expect.any(Date),
            },
          },
          {
            eventType: "ADDED",
            profileFieldFile: {
              id: toGlobalId("ProfileFieldFile", pffs1[1].id),
              source: "MANUAL",
              createdBy: {
                id: toGlobalId("User", sessionUser.id),
              },
              createdAt: expect.any(Date),
              file: {
                filename: "file_2.pdf",
              },
              removedBy: null,
              removedAt: null,
            },
          },
          {
            eventType: "ADDED",
            profileFieldFile: {
              id: toGlobalId("ProfileFieldFile", pffs1[0].id),
              source: "MANUAL",
              createdBy: {
                id: toGlobalId("User", sessionUser.id),
              },
              createdAt: expect.any(Date),
              file: {
                filename: "file_1.pdf",
              },
              removedBy: {
                id: toGlobalId("User", sessionUser.id),
              },
              removedAt: expect.any(Date),
            },
          },
        ],
      });
    });
  });
});
