import { faker } from "@faker-js/faker";
import { parseISO } from "date-fns";
import { format, zonedTimeToUtc } from "date-fns-tz";
import { gql } from "graphql-request";
import { Knex } from "knex";
import { outdent } from "outdent";
import { isDefined, range, times } from "remeda";
import { Organization, Profile, ProfileType, ProfileTypeField, User } from "../../db/__types";
import { defaultProfileTypeFieldOptions } from "../../db/helpers/profileTypeFieldOptions";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

type UpdateProfileFieldValueInput = {
  profileTypeFieldId: string;
  content?: Record<string, any> | null;
  expiryDate?: string | null;
};

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
      { profileTypeId }
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
      { profileId, fields }
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

    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization("ADMIN"));
    await knex
      .from("organization")
      .update({ default_timezone: "Europe/Madrid" })
      .where("id", organization.id);

    await mocks.createFeatureFlags([{ name: "PROFILES", default_value: true }]);

    const [normalUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      organization_role: "NORMAL",
    }));
    const { apiKey } = await mocks.createUserAuthToken("normal-token", normalUser.id);
    normalUserApiKey = apiKey;
  });

  beforeEach(async () => {
    await mocks.knex.from("profile_field_file").delete();
    await mocks.knex.from("profile_field_value").delete();
    await mocks.knex.from("profile_type_field").delete();
    await mocks.knex.from("profile_event").delete();
    await mocks.knex.from("profile_subscription").delete();
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
        ][i]
    );

    profileType0Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[0].id,
      6,
      (i) =>
        [
          {
            name: json({ en: "First name", es: "Nombre" }),
            type: "SHORT_TEXT" as const,
            alias: "FIRST_NAME",
            options: {},
          },
          {
            name: json({ en: "Last name", es: "Apellido" }),
            type: "SHORT_TEXT" as const,
            alias: "LAST_NAME",
            options: {},
          },
          {
            name: json({ en: "Birth date", es: "Fecha de nacimiento" }),
            type: "DATE" as const,
            alias: "BIRTH_DATE",
            is_expirable: true,
            options: { useReplyAsExpiryDate: true },
          },
          {
            name: json({ en: "Phone", es: "Teléfono" }),
            type: "PHONE" as const,
            alias: "PHONE",
            options: {},
          },
          {
            name: json({ en: "Email", es: "Correo electrónico" }),
            type: "TEXT" as const,
            alias: "EMAIL",
            options: {},
          },
          {
            name: json({ en: "Passport", es: "Pasaporte" }),
            type: "SHORT_TEXT" as const,
            alias: "PASSPORT",
            is_expirable: true,
            expiry_alert_ahead_time: mocks.knex.raw(`'1 month'::interval`) as any,
            options: {},
          },
        ][i]
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
        ][i]
    );

    profileType2Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[2].id,
      2,
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
        ][i]
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
        ][i]
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
                }
                totalCount
              }
            }
          }
        `,
        {
          profileId: profile.id,
        }
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
            },
            files: null,
            value: { expiryDate: "2024-10-28", content: { value: "AA1234567" } },
          },
        ],
        events: {
          items: [
            { type: "PROFILE_FIELD_EXPIRY_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_FIELD_EXPIRY_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_CREATED" },
          ],
          totalCount: 7,
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
        }
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
        }
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
        { limit: 10, offset: 0, sortBy: ["name_ASC"] }
      );
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
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
        }
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
        }
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
        { name: { en: "Individual" } }
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
        }
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
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("updates profile names when chaging the profile name pattern", async () => {
      async function createIndividualProfile(firstName: string, lastName: string) {
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
          }
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
          }
        );
      }
      await createIndividualProfile("Mickey", "Mouse");
      await createIndividualProfile("Donald", "Duck");

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
        }
      );
      expect(data.profiles).toEqual({
        totalCount: 2,
        items: [
          { id: expect.any(String), name: "Mickey Mouse" },
          { id: expect.any(String), name: "Donald Duck" },
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
        }
      );

      expect(errors).toBeUndefined();
      expect(data2.updateProfileType).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        profileNamePattern: `{{${lastName}}}, {{${firstName}}}`,
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
        }
      );
      expect(data3.profiles).toEqual({
        totalCount: 2,
        items: [
          { id: expect.any(String), name: "Mouse, Mickey" },
          { id: expect.any(String), name: "Duck, Donald" },
        ],
      });
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
              profileNamePattern
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
          profileNamePattern: "Hello",
        }
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_NAME_PATTERN");
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
        }
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
        `{{${data.cloneProfileType.fields[0].id}}} {{${data.cloneProfileType.fields[1].id}}}`
      );
    });
  });

  describe("deleteProfileType", () => {
    it("deletes multiple profile types and its corresponding fields", async () => {
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateProfileTypeField", () => {
    let profileTypeField: ProfileTypeField;
    let profileTypeField2: ProfileTypeField;
    beforeEach(async () => {
      [profileTypeField, profileTypeField2] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileTypes[1].id,
        2,
        (i) => ({
          is_expirable: true,
          expiry_alert_ahead_time: mocks.knex.raw(`'1 month'::interval`) as any,
          alias: i === 0 ? "alias" : null,
          type: "TEXT",
        })
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
      );

      expect(errors).toContainGraphQLError("REMOVE_PROFILE_TYPE_FIELD_IS_EXPIRABLE_ERROR");
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
        }
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
        }
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
        }
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
        }
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
        { profileTypeId: toGlobalId("ProfileType", profileTypes[0].id) }
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
        }
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
        }
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
        properties: profileType0Fields.map((f) => ({
          field: { id: toGlobalId("ProfileTypeField", f.id), isExpirable: f.is_expirable },
          value: null,
        })),
      });

      const profile2 = await updateProfileValue(profile.id, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "John" },
        },
      ]);

      expect(profile2).toEqual({
        id: expect.any(String),
        name: "John",
        properties: profileType0Fields.map((f) => ({
          field: { id: toGlobalId("ProfileTypeField", f.id), isExpirable: f.is_expirable },
          value:
            f.id === profileType0Fields[0].id
              ? { content: { value: "John" }, expiryDate: null }
              : null,
        })),
      });

      const profile3 = await updateProfileValue(profile.id, [
        {
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Wick" },
        },
      ]);

      expect(profile3).toEqual({
        id: expect.any(String),
        name: "John Wick",
        properties: profileType0Fields.map((f) => ({
          field: { id: toGlobalId("ProfileTypeField", f.id), isExpirable: f.is_expirable },
          value:
            f.id === profileType0Fields[0].id
              ? { content: { value: "John" }, expiryDate: null }
              : f.id === profileType0Fields[1].id
              ? { content: { value: "Wick" }, expiryDate: null }
              : null,
        })),
      });
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
        properties: profileType0Fields.map((f) => ({
          field: { id: toGlobalId("ProfileTypeField", f.id), isExpirable: f.is_expirable },
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
        ])
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
        ])
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
        ])
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
        ])
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
        ])
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_FIELD_VALUE");
      expect(data).toBeNull();
    });
  });

  describe("deleteProfile", () => {
    it("deletes a profile", async () => {
      const profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));

      const { errors: query1Errors, data: query1Data } = await testClient.execute(gql`
        query {
          profiles(offset: 0, limit: 10) {
            items {
              id
            }
            totalCount
          }
        }
      `);
      expect(query1Errors).toBeUndefined();
      expect(query1Data.profiles).toEqual({ items: [{ id: profile.id }], totalCount: 1 });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!) {
            deleteProfile(profileIds: $profileIds)
          }
        `,
        {
          profileIds: [profile.id],
        }
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

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileIds: [GID!]!, $force: Boolean) {
            deleteProfile(profileIds: $profileIds, force: $force)
          }
        `,
        {
          profileIds: [profile.id],
          force: false,
        }
      );

      expect(errors).toContainGraphQLError("PROFILE_HAS_REPLIES_ERROR", { count: 1 });
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
        }
      );

      const rows = await mocks.knex
        .from("profile_field_file")
        .where(
          "id",
          fromGlobalId(createData?.createProfileFieldFileUploadLink.property.files[0].id).id
        )
        .select("*");

      expect(createErrors).toBeUndefined();
      expect(createData?.createProfileFieldFileUploadLink).toEqual({
        property: {
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
      );

      expect(errors).toContainGraphQLError("MAX_FILES_EXCEEDED");
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
        }
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData.profile).toEqual({
        properties: [{ files: null }, { files: [{ id: expect.any(String) }] }],
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
        }
      );

      expect(errors).toBeUndefined();
      expect(data.deleteProfileFieldFile).toEqual("SUCCESS");
    });
  });

  describe("subscribeToProfile", () => {
    let profile: Profile;
    let users: User[];
    let collaboratorApiKey: string;

    beforeEach(async () => {
      profile = await createProfile(toGlobalId("ProfileType", profileTypes[0].id));
      users = await mocks.createRandomUsers(organization.id, 3, (i) => ({
        organization_role: i === 0 ? "COLLABORATOR" : "NORMAL",
      }));

      ({ apiKey: collaboratorApiKey } = await mocks.createUserAuthToken(
        "collaborator-apikey",
        users[0].id
      ));
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
        { profileIds: [profile.id], userIds: users.map((u) => toGlobalId("User", u.id)) }
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
        }
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
        }
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
        }
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
        }
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
        }
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
});
