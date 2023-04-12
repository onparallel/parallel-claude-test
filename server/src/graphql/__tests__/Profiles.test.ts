import { gql } from "graphql-request";
import { Knex } from "knex";
import { last, times } from "remeda";
import { defaultProfileTypeFieldOptions } from "../../db/helpers/profileTypeFieldOptions";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, ProfileType, ProfileTypeField } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/Profiles", () => {
  let testClient: TestClient;

  let mocks: Mocks;
  let organization: Organization;
  let profileTypes: ProfileType[] = [];

  let profileType0Fields: ProfileTypeField[] = [];

  let normalUserApiKey = "";

  function json(value: any) {
    return mocks.knex.raw("?::jsonb", JSON.stringify(value));
  }

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization } = await mocks.createSessionUserAndOrganization("ADMIN"));

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
    await mocks.knex.from("profile_type").delete();

    profileTypes = await mocks.createRandomProfileTypes(
      organization.id,
      3,
      (i) =>
        [
          { name: json({ en: "Individual", es: "Persona física" }) },
          { name: json({ en: "Legal entity", es: "Persona jurídica" }) },
          { name: json({ en: "Contract", es: "Contrato" }) },
        ][i]
    );

    profileType0Fields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileTypes[0].id,
      5,
      (i) =>
        [
          {
            name: json({ en: "First name", es: "Nombre" }),
            type: "SHORT_TEXT" as const,
            alias: "FIRST_NAME",
          },
          {
            name: json({ en: "Last name", es: "Apellido" }),
            type: "SHORT_TEXT" as const,
            alias: "LAST_NAME",
          },
          {
            name: json({ en: "Birth date", es: "Fecha de nacimiento" }),
            type: "DATE" as const,
            alias: "BIRTH_DATE",
          },
          {
            name: json({ en: "Phone", es: "Teléfono" }),
            type: "PHONE" as const,
            alias: "PHONE",
          },
          {
            name: json({ en: "Email", es: "Correo electrónico" }),
            type: "SHORT_TEXT" as const,
            alias: "EMAIL",
          },
        ][i]
    );
    await mocks.knex
      .from("profile_type")
      .where("id", profileTypes[0].id)
      .update({
        profile_name_pattern: json([profileType0Fields[0].id, " ", profileType0Fields[1].id]),
      });
    const profileType1Fields = await mocks.createRandomProfileTypeFields(
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
        totalCount: 3,
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
            fields: times(5, (i) => ({
              position: i,
              name: { es: expect.any(String), en: expect.any(String) },
            })),
          },
          {
            id: toGlobalId("ProfileType", profileTypes[2].id),
            name: { en: "Contract", es: "Contrato" },
            fields: [],
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
            fields: times(5, (i) => ({ position: i })),
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
        fields: [
          {
            id: expect.any(String),
            name: { en: "Name", es: "Nombre" },
          },
        ],
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
        {
          name: { en: "Individual" },
        }
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
        for (const [profileTypeFieldId, value] of [
          [profileType0Fields[0].id, firstName],
          [profileType0Fields[1].id, lastName],
        ]) {
          await testClient.execute(
            gql`
              mutation ($profileId: GID!, $profileTypeFieldId: GID!, $content: JSONObject!) {
                createProfileFieldValue(
                  profileId: $profileId
                  profileTypeFieldId: $profileTypeFieldId
                  content: $content
                ) {
                  id
                }
              }
            `,
            {
              profileId: data.createProfile.id,
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFieldId),
              content: { value },
            }
          );
        }
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
  });

  describe("cloneProfileType", () => {
    it("clones a profile type", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            cloneProfileType(profileTypeId: $profileTypeId) {
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
        }
      );

      expect(errors).toBeUndefined();
      expect(data.cloneProfileType).toEqual({
        id: expect.any(String),
        name: { en: "Individual", es: "Persona física" },
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
        totalCount: 1,
        items: [
          {
            id: toGlobalId("ProfileType", profileTypes[0].id),
            name: { en: "Individual", es: "Persona física" },
            fields: times(5, (i) => ({ position: i })),
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
            name: { en: "my new field" },
            type: "SHORT_TEXT",
          },
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileTypeField).toEqual({
        id: expect.any(String),
        name: { en: "my new field" },
        alias: "alias",
        isExpirable: true,
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
  });

  describe("updateProfileTypeField", () => {
    let profileTypeField: ProfileTypeField;
    let profileTypeField2: ProfileTypeField;
    beforeEach(async () => {
      [profileTypeField, profileTypeField2] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileTypes[1].id,
        2,
        (i) => ({ is_expirable: true, alias: i === 0 ? "alias" : null })
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
  });

  describe("updateProfileTypeFieldPositions", () => {
    it("reorders positions of profile type fields", async () => {
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
            toGlobalId("ProfileTypeField", profileType0Fields[4].id),
            toGlobalId("ProfileTypeField", profileType0Fields[0].id),
            toGlobalId("ProfileTypeField", profileType0Fields[2].id),
            toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          ],
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeFieldPositions).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
        fields: [
          { id: toGlobalId("ProfileTypeField", profileType0Fields[3].id), position: 0 },
          { id: toGlobalId("ProfileTypeField", profileType0Fields[4].id), position: 1 },
          { id: toGlobalId("ProfileTypeField", profileType0Fields[0].id), position: 2 },
          { id: toGlobalId("ProfileTypeField", profileType0Fields[2].id), position: 3 },
          { id: toGlobalId("ProfileTypeField", profileType0Fields[1].id), position: 4 },
        ],
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
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfileTypeField).toEqual({
        id: toGlobalId("ProfileType", profileTypes[0].id),
      });

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($limit: Int, $offset: Int, $sortBy: [QueryProfileTypes_OrderBy!]) {
            profileTypes(limit: $limit, offset: $offset, sortBy: $sortBy) {
              totalCount
              items {
                id
                fields {
                  id
                  position
                }
              }
            }
          }
        `,
        {
          limit: 1,
          offset: 0,
          sortBy: ["createdAt_ASC"],
        }
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profileTypes).toEqual({
        totalCount: 3,
        items: [
          {
            id: toGlobalId("ProfileType", profileTypes[0].id),
            fields: [
              { id: toGlobalId("ProfileTypeField", profileType0Fields[0].id), position: 0 },
              { id: toGlobalId("ProfileTypeField", profileType0Fields[1].id), position: 1 },
              { id: toGlobalId("ProfileTypeField", profileType0Fields[3].id), position: 2 },
              { id: toGlobalId("ProfileTypeField", profileType0Fields[4].id), position: 3 },
            ],
          },
        ],
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

  describe("createProfileFieldValue", () => {
    it("creates field values and updates the name", async () => {
      const profileFragment = gql`
        fragment ProfileFragment on Profile {
          id
          name
          properties {
            field {
              id
            }
            value {
              content
            }
          }
        }
      `;
      const { data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            createProfile(profileTypeId: $profileTypeId) {
              ...ProfileFragment
            }
          }
          ${profileFragment}
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileTypes[0].id),
        }
      );
      expect(data.createProfile).toEqual({
        id: expect.any(String),
        name: "",
        properties: profileType0Fields.map((f) => ({
          field: { id: toGlobalId("ProfileTypeField", f.id) },
          value: null,
        })),
      });
      const { data: data2 } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $content: JSONObject!) {
            createProfileFieldValue(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              content: $content
            ) {
              ...ProfileFragment
            }
          }
          ${profileFragment}
        `,
        {
          profileId: data.createProfile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[0].id),
          content: { value: "John" },
        }
      );

      expect(data2?.createProfileFieldValue).toEqual({
        id: expect.any(String),
        name: "John",
        properties: profileType0Fields.map((f) => ({
          field: { id: toGlobalId("ProfileTypeField", f.id) },
          value: f.id === profileType0Fields[0].id ? { content: { value: "John" } } : null,
        })),
      });

      const { data: data3 } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!, $content: JSONObject!) {
            createProfileFieldValue(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              content: $content
            ) {
              ...ProfileFragment
            }
          }
          ${profileFragment}
        `,
        {
          profileId: data.createProfile.id,
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileType0Fields[1].id),
          content: { value: "Wick" },
        }
      );

      expect(data3?.createProfileFieldValue).toEqual({
        id: expect.any(String),
        name: "John Wick",
        properties: profileType0Fields.map((f) => ({
          field: { id: toGlobalId("ProfileTypeField", f.id) },
          value:
            f.id === profileType0Fields[0].id
              ? { content: { value: "John" } }
              : f.id === profileType0Fields[1].id
              ? { content: { value: "Wick" } }
              : null,
        })),
      });
    });
  });
});
