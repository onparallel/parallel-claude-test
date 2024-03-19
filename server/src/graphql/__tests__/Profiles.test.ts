import { faker } from "@faker-js/faker";
import { gql } from "graphql-request";
import { Knex } from "knex";
import { outdent } from "outdent";
import { isDefined, range, times } from "remeda";
import {
  FileUpload,
  Organization,
  Petition,
  PetitionFieldReply,
  Profile,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldType,
  User,
  UserGroup,
} from "../../db/__types";
import { defaultProfileTypeFieldOptions } from "../../db/helpers/profileTypeFieldOptions";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

interface UpdateProfileFieldValueInput {
  profileTypeFieldId: string;
  content?: Record<string, any> | null;
  expiryDate?: string | null;
}

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

  let normalUserApiKey = "";

  function json(value: any) {
    return mocks.knex.raw("?::jsonb", JSON.stringify(value));
  }

  async function createProfile(profileTypeId: string, fields?: UpdateProfileFieldValueInput[]) {
    const { data } = await testClient.execute(
      gql`
        mutation ($profileTypeId: GID!) {
          createProfile(profileTypeId: $profileTypeId) {
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
      { profileTypeId },
    );
    if (isDefined(fields) && fields.length > 0) {
      return await updateProfileValue(data.createProfile.id, fields);
    } else {
      return data.createProfile;
    }
  }

  async function updateProfileValue(profileId: number, fields: UpdateProfileFieldValueInput[]) {
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
    if (isDefined(errors)) {
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

    await mocks.createFeatureFlags([{ name: "PROFILES", default_value: true }]);

    const [normalUser] = await mocks.createRandomUsers(organization.id);
    const { apiKey } = await mocks.createUserAuthToken("normal-token", normalUser.id);
    normalUserApiKey = apiKey;
  });

  beforeEach(async () => {
    await mocks.knex.from("profile_field_file").delete();
    await mocks.knex.from("profile_field_value").delete();
    await mocks.knex.from("profile_type_field_permission").delete();
    await mocks.knex.from("profile_type_field").delete();
    await mocks.knex.from("profile_event").delete();
    await mocks.knex.from("profile_subscription").delete();
    await mocks.knex.from("petition_profile").delete();
    await mocks.knex.from("profile").delete();
    await mocks.knex.from("profile_type").delete();

    profileTypes = await mocks.createRandomProfileTypes(
      organization.id,
      4,
      (i) =>
        [
          { name: json({ en: "Individual", es: "Persona física" }) },
          { name: json({ en: "Legal entity", es: "Persona jurídica" }) },
          { name: json({ en: "Contract", es: "Contrato" }) },
          { name: json({ en: "Expirable fields", es: "Campos con expiración" }) },
        ][i],
    );

    profileType0Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[0].id,
      7,
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
        ][i],
    );
    await mocks.knex
      .from("profile_type")
      .where("id", profileTypes[0].id)
      .update({
        profile_name_pattern: json([profileType0Fields[0].id, " ", profileType0Fields[1].id]),
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

    profileType2Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[2].id,
      4,
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
        ][i],
    );

    profileType3Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[3].id,
      3,
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
        ][i],
    );

    await mocks.knex
      .from("profile_type")
      .where("id", profileTypes[1].id)
      .update({
        profile_name_pattern: json([profileType1Fields[0].id]),
      });
  });

  afterAll(async () => {
    await testClient.stop();
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
              isExpirable: false,
              isUsedInProfileName: false,
            },
            files: null,
            value: null,
          },
        ],
        events: {
          items: [
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
          ],
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
        ],
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
        totalCount: 4,
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
          ],
        },
      });
    });
  });

  describe("createProfile", () => {
    it("creates a profile and subscribes the user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $subscribe: Boolean) {
            createProfile(profileTypeId: $profileTypeId, subscribe: $subscribe) {
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
          mutation ($profileTypeId: GID!, $subscribe: Boolean) {
            createProfile(profileTypeId: $profileTypeId, subscribe: $subscribe) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", archivedProfileType.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createProfileType", () => {
    it("creates a new profile type on organization", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($name: LocalizableUserText!) {
            createProfileType(name: $name) {
              id
              name
              fields {
                id
                name
              }
            }
          }
        `,
        {
          name: { en: "Individual" },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileType).toEqual({
        id: expect.any(String),
        name: { en: "Individual" },
        fields: [{ id: expect.any(String), name: { en: "Name", es: "Nombre" } }],
      });
    });

    it("fails when normal user tries to create a profile type", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($name: LocalizableUserText!) {
            createProfileType(name: $name) {
              id
              name
              fields {
                id
              }
            }
          }
        `,
        { name: { en: "Individual" } },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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

    it("updates profile names when changing the profile name pattern", async () => {
      async function createIndividualProfile(firstName?: string, lastName?: string) {
        const { data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!) {
              createProfile(profileTypeId: $profileTypeId) {
                id
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          },
        );
        await testClient.execute(
          gql`
            mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
              updateProfileFieldValue(profileId: $profileId, fields: $fields) {
                id
              }
            }
          `,
          {
            profileId: data.createProfile.id,
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
                content: { value: firstName },
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
                content: { value: lastName },
              },
            ],
          },
        );
      }
      await createIndividualProfile("Mickey", "Mouse");
      await createIndividualProfile("Donald", "Duck");
      await createIndividualProfile("Trump", "");
      await createIndividualProfile("", "Obama");
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
          { id: expect.any(String), name: "Trump" },
          { id: expect.any(String), name: "Obama" },
          { id: expect.any(String), name: "Mickey Mouse" },
          { id: expect.any(String), name: "Donald Duck" },
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
      expect(data2.updateProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        profileNamePattern: `{{ ${lastName} }}, {{ ${firstName} }}`,
      });

      const { data: data3 } = await testClient.execute(
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
      expect(data3.profiles).toEqual({
        totalCount: 5,
        items: [
          { id: expect.any(String), name: ", Trump" },
          { id: expect.any(String), name: "Obama," },
          { id: expect.any(String), name: "Mouse, Mickey" },
          { id: expect.any(String), name: "Duck, Donald" },
          { id: expect.any(String), name: "," },
        ],
      });

      const emptyField = toGlobalId("ProfileTypeField", profileType0Fields[5].id);
      const { errors: errorsEmptyField, data: dataEmptyField } = await testClient.execute(
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
          profileNamePattern: `{{${emptyField}}}-static-text`,
        },
      );

      expect(errorsEmptyField).toBeUndefined();
      expect(dataEmptyField.updateProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        profileNamePattern: `{{ ${emptyField} }}-static-text`,
      });

      const { data: dataProfilesEmptyField } = await testClient.execute(
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
      expect(dataProfilesEmptyField.profiles).toEqual({
        totalCount: 5,
        items: [
          { id: expect.any(String), name: "-static-text" },
          { id: expect.any(String), name: "-static-text" },
          { id: expect.any(String), name: "-static-text" },
          { id: expect.any(String), name: "-static-text" },
          { id: expect.any(String), name: "-static-text" },
        ],
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

    it("fails when trying to update name of a standard profile type", async () => {
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
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", standardProfileType.id),
          name: { en: "Updated name" },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails when trying to update profile name pattern of a standard profile type", async () => {
      const [standardProfileType] = await mocks.createRandomProfileTypes(
        organization.id,
        1,
        () => ({
          name: json({ en: "Standard", es: "Standard" }),
          standard_type: "CONTRACT",
        }),
      );

      const [profileTypeField] = await mocks.createRandomProfileTypeFields(
        organization.id,
        standardProfileType.id,
        1,
        () => ({ type: "SHORT_TEXT" }),
      );

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
          profileTypeId: toGlobalId("ProfileType", standardProfileType.id),
          profileNamePattern: `Hello {{${toGlobalId("ProfileTypeField", profileTypeField.id)}}}`,
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("cloneProfileType", () => {
    it("clones a profile type", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $name: LocalizableUserText) {
            cloneProfileType(profileTypeId: $profileTypeId, name: $name) {
              id
              name
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
        profileNamePattern: expect.anything(),
        fields: profileType0Fields.map((f) => ({
          id: expect.any(String),
          name: f.name,
          alias: f.alias,
        })),
      });
      expect(data.cloneProfileType.profileNamePattern).toEqual(
        `{{ ${data.cloneProfileType.fields[0].id} }} {{ ${data.cloneProfileType.fields[1].id} }}`,
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

    it("sends error when trying to archive a standard profile type", async () => {
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
          mutation ($profileTypeIds: [GID!]!) {
            archiveProfileType(profileTypeIds: $profileTypeIds) {
              id
            }
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", standardProfileType.id)],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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

    it("sends error when trying to unarchive a standard profile type", async () => {
      const [standardProfileType] = await mocks.createRandomProfileTypes(
        organization.id,
        1,
        () => ({
          name: json({ en: "Standard", es: "Standard" }),
          standard_type: "CONTRACT",
          archived_at: new Date(),
          archived_by_user_id: sessionUser.id,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            unarchiveProfileType(profileTypeIds: $profileTypeIds) {
              id
            }
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", standardProfileType.id)],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deleteProfileType", () => {
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
      expect(archiveData?.archiveProfileType).toEqual([
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
        totalCount: 2,
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

    it("sends error when trying to delete a standard profile type", async () => {
      const [standardProfileType] = await mocks.createRandomProfileTypes(
        organization.id,
        1,
        () => ({
          name: json({ en: "Standard", es: "Standard" }),
          standard_type: "CONTRACT",
          archived_at: new Date(),
          archived_by_user_id: sessionUser.id,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeIds: [GID!]!) {
            deleteProfileType(profileTypeIds: $profileTypeIds)
          }
        `,
        {
          profileTypeIds: [toGlobalId("ProfileType", standardProfileType.id)],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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
        options: defaultProfileTypeFieldOptions("SHORT_TEXT"),
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
            alias: "p_firstname",
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
  });

  describe("updateProfileTypeField", () => {
    let profileTypeField: ProfileTypeField;
    let profileTypeField2: ProfileTypeField;
    let profileTypeField3: ProfileTypeField;
    let selectWithStandardOptions: ProfileTypeField;

    beforeEach(async () => {
      [profileTypeField, profileTypeField2, profileTypeField3] =
        await mocks.createRandomProfileTypeFields(organization.id, profileTypes[1].id, 3, (i) => ({
          is_expirable: true,
          expiry_alert_ahead_time: mocks.knex.raw(`'1 month'::interval`) as any,
          alias: i === 0 ? "alias" : null,
          type: ["TEXT", "TEXT", "SELECT"][i] as ProfileTypeFieldType,
          options:
            i === 2
              ? {
                  values: [
                    { value: "AR", label: { es: "Argentina", en: "Argentina" } },
                    { value: "ES", label: { es: "España", en: "Spain" } },
                  ],
                }
              : {},
        }));

      [selectWithStandardOptions] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileTypes[1].id,
        1,
        () => ({
          type: "SELECT",
          alias: "p_standard",
          options: {
            values: [
              { value: "option_1", label: { es: "Opción 1", en: "Option 1" }, isStandard: true },
              { value: "option_2", label: { es: "Opción 2", en: "Option 2" }, isStandard: true },
              { value: "A", label: { es: "A", en: "A" } },
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
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField3.id),
          content: { value: "ES" },
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
          profileId: profile.id,
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: profile.id,
        events: {
          totalCount: 4,
          items: [
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_CREATED" },
          ],
        },
      });
    });

    it("sends profile_field_value_updated event when updating select field options with non-null substitutions", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[1].id), [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField3.id),
          content: { value: "ES" },
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
          profileId: profile.id,
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(data?.profile).toEqual({
        id: profile.id,
        events: {
          totalCount: 4,
          items: [
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_CREATED" },
          ],
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
          content: { value: "A" },
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
          content: { value: "A" },
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
            substitutions: [{ old: "A", new: "option_1" }],
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
          content: { value: "A" },
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
            substitutions: [{ old: "A", new: "unknown" }],
          },
        },
      );
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
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
            isUsedInProfileName: i < 2,
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
        name: "John",
        status: "OPEN",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2,
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
      ]);

      expect(updateProfileFieldInPattern2).toEqual({
        id: expect.any(String),
        name: "John Wick",
        status: "OPEN",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2,
          },
          value:
            f.id === profileType0Fields[0].id
              ? { content: { value: "John" }, expiryDate: null }
              : f.id === profileType0Fields[1].id
                ? { content: { value: "Wick" }, expiryDate: null }
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
        name: "John",
        status: "OPEN",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2,
          },
          value:
            f.id === profileType0Fields[0].id
              ? { content: { value: "John" }, expiryDate: null }
              : null,
        })),
      });

      const removesAllValuesInNamePattern = await updateProfileValue(profile.id, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: null,
        },
      ]);
      expect(removesAllValuesInNamePattern).toEqual({
        id: expect.any(String),
        name: "",
        status: "OPEN",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2,
          },
          value: null,
        })),
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
            isUsedInProfileName: i < 2,
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
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
        name: "Harry Potter",
        status: "OPEN",
        properties: profileType0Fields.map((f, i) => ({
          field: {
            id: toGlobalId("ProfileTypeField", f.id),
            isExpirable: f.is_expirable,
            isUsedInProfileName: i < 2,
          },
          value:
            f.id === profileType0Fields[0].id
              ? { content: { value: "Harry" }, expiryDate: null }
              : f.id === profileType0Fields[1].id
                ? { content: { value: "Potter" }, expiryDate: null }
                : f.id === profileType0Fields[5].id
                  ? { content: { value: "123456" }, expiryDate: "2030-01-01" }
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
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
        properties: [{ files: null }, { files: null }, { files: null }, { files: null }],
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
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
                petitions(limit: 10) {
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
          petitions: { items: [{ id: toGlobalId("Petition", petition.id) }], totalCount: 1 },
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

    it("sends error if linking same petition and profile multiple times", async () => {
      const { errors: link1Errors, data: link1Data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
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
        profile: {
          id: toGlobalId("Profile", profile.id),
        },
      });

      const { errors: link2Errors, data: link2Data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
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

      expect(link2Errors).toContainGraphQLError("PROFILE_ALREADY_ASSOCIATED_TO_PETITION");
      expect(link2Data).toBeNull();

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
                petitions(limit: 10) {
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
                petitions(limit: 10) {
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

    it("removes relation between profile and petition if petition is deleted", async () => {
      const { errors: linkErrors, data: linkData } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
              profile {
                id
                petitions(limit: 10) {
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
          petitions: { items: [{ id: toGlobalId("Petition", petition.id) }], totalCount: 1 },
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
              petitions(limit: 10) {
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
        petitions: { items: [], totalCount: 0 },
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

    it("removes relation between profile and petition if profile is deleted", async () => {
      const { errors: linkErrors, data: linkData } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileId: GID!) {
            associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
              profile {
                id
                petitions(limit: 10) {
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
          petitions: { items: [{ id: toGlobalId("Petition", petition.id) }], totalCount: 1 },
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

  describe('"disassociateProfileFromPetition", "disassociatePetitionFromProfile"', () => {
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
          mutation ($petitionId: GID!, $profileIds: [GID!]!) {
            disassociateProfileFromPetition(petitionId: $petitionId, profileIds: $profileIds)
          }
        `,
        {
          petitionId: toGlobalId("Petition", petitions[1].id),
          profileIds: [toGlobalId("Profile", profiles[0].id)],
        },
      );

      expect(unlinkErrors).toBeUndefined();
      expect(unlinkData?.disassociateProfileFromPetition).toEqual("SUCCESS");

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
              petitions(limit: 10) {
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
          petitions: { items: [{ id: toGlobalId("Petition", petitions[0].id) }], totalCount: 1 },
        },
      });
    });

    it("sends error when not all profiles are associated", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $profileIds: [GID!]!) {
            disassociateProfileFromPetition(petitionId: $petitionId, profileIds: $profileIds)
          }
        `,
        {
          petitionId: toGlobalId("Petition", petitions[0].id),
          profileIds: [toGlobalId("Profile", profiles[1].id)],
        },
      );

      expect(errors).toContainGraphQLError("PROFILE_ASSOCIATION_ERROR");
      expect(data).toBeNull();
    });

    it("disassociate petition from profile", async () => {
      const { errors: unlinkErrors, data: unlinkData } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $petitionIds: [GID!]!) {
            disassociatePetitionFromProfile(profileId: $profileId, petitionIds: $petitionIds)
          }
        `,
        {
          profileId: toGlobalId("Profile", profiles[0].id),
          petitionIds: [toGlobalId("Petition", petitions[1].id)],
        },
      );

      expect(unlinkErrors).toBeUndefined();
      expect(unlinkData?.disassociatePetitionFromProfile).toEqual("SUCCESS");

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
              petitions(limit: 10) {
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
          petitions: { items: [{ id: toGlobalId("Petition", petitions[0].id) }], totalCount: 1 },
        },
      });
    });

    it("sends error when not all petitions are associated", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $petitionIds: [GID!]!) {
            disassociatePetitionFromProfile(profileId: $profileId, petitionIds: $petitionIds)
          }
        `,
        {
          profileId: toGlobalId("Profile", profiles[0].id),
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

  describe("updateProfileTypeFieldPermission", () => {
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
            $profileTypeFieldId: GID!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionInput!]!
          ) {
            updateProfileTypeFieldPermission(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
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
        ],
      });
    });

    it("overrides field permission for a given user group", async () => {
      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionInput!]!
          ) {
            updateProfileTypeFieldPermission(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
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
            $profileTypeFieldId: GID!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionInput!]!
          ) {
            updateProfileTypeFieldPermission(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
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
            $profileTypeFieldId: GID!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionInput!]!
          ) {
            updateProfileTypeFieldPermission(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[3].id),
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
        ],
      });
    });

    it("uses greatest permission between default and user permission", async () => {
      const { errors } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionInput!]!
          ) {
            updateProfileTypeFieldPermission(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
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
        ],
      });
    });

    it("sends error if updating to HIDDEN a profile type field used on a profile_name_pattern", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $profileTypeFieldId: GID!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionInput!]!
          ) {
            updateProfileTypeFieldPermission(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
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
            $profileTypeFieldId: GID!
            $defaultPermission: ProfileTypeFieldPermissionType!
            $data: [UpdateProfileTypeFieldPermissionInput!]!
          ) {
            updateProfileTypeFieldPermission(
              profileTypeId: $profileTypeId
              profileTypeFieldId: $profileTypeFieldId
              defaultPermission: $defaultPermission
              data: $data
            ) {
              id
              defaultPermission
              myPermission
              permissions {
                __typename
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
          data: [],
          defaultPermission: "WRITE",
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeFieldPermission).toEqual({
        id: toGlobalId("ProfileTypeField", profileType0Fields[2].id),
        permissions: [],
        defaultPermission: "WRITE",
        myPermission: "WRITE",
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
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
});
