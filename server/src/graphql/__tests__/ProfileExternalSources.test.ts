import { gql } from "graphql-request";
import { Knex } from "knex";
import { indexBy, pick } from "remeda";
import {
  Organization,
  OrgIntegration,
  ProfileExternalSourceEntity,
  ProfileType,
  ProfileTypeField,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION,
  EInformaProfileExternalSourceIntegration,
} from "../../integrations/profile-external-source/einforma/EInformaProfileExternalSourceIntegration";
import { PROFILES_SETUP_SERVICE, ProfilesSetupService } from "../../services/ProfilesSetupService";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("Profile External Sources", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let user: User;
  let organization: Organization;

  beforeAll(async () => {
    testClient = await initServer();

    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization(() => ({
      name: "Parallel",
      status: "DEV",
    })));

    const profilesSetup = testClient.container.get<ProfilesSetupService>(PROFILES_SETUP_SERVICE);

    await profilesSetup.createDefaultProfileTypes(organization.id, `User:${user.id}`);
    await mocks.createFeatureFlags([{ name: "PROFILES", default_value: true }]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("eInforma", () => {
    let orgIntegration: OrgIntegration;

    let providerProfileType: ProfileType;
    let individualProfileType: ProfileType;
    let legalEntityProfileType: ProfileType;
    let contractProfileType: ProfileType;

    let individualPTFsByAlias: Record<string, ProfileTypeField>;
    let legalEntityPTFsByAlias: Record<string, ProfileTypeField>;

    beforeAll(async () => {
      [orgIntegration] = await mocks.createOrgIntegration({
        org_id: organization.id,
        type: "PROFILE_EXTERNAL_SOURCE",
        provider: "EINFORMA",
        name: "eInforma",
        settings: {},
        is_enabled: true,
      });

      const standardProfileTypes = await mocks.knex
        .from("profile_type")
        .where("org_id", organization.id)
        .whereNotNull("standard_type")
        .whereNull("deleted_at")
        .orderBy("created_at", "desc")
        .select("*");

      individualProfileType = standardProfileTypes.find((pt) => pt.standard_type === "INDIVIDUAL")!;
      legalEntityProfileType = standardProfileTypes.find(
        (pt) => pt.standard_type === "LEGAL_ENTITY",
      )!;
      contractProfileType = standardProfileTypes.find((pt) => pt.standard_type === "CONTRACT")!;

      [providerProfileType] = await mocks.createRandomProfileTypes(organization.id, 1, () => ({
        name: { en: "Provider", es: "Proveedor" },
        standard_type: "INDIVIDUAL",
      }));

      const individualFields = await mocks.knex
        .from("profile_type_field")
        .where("profile_type_id", individualProfileType.id)
        .whereNull("deleted_at")
        .select("*");

      individualPTFsByAlias = indexBy(individualFields, (f) => f.alias!);

      const legalEntityFields = await mocks.knex
        .from("profile_type_field")
        .where("profile_type_id", legalEntityProfileType.id)
        .whereNull("deleted_at")
        .select("*");

      legalEntityPTFsByAlias = indexBy(legalEntityFields, (f) => f.alias!);
    });

    describe("profileExternalSourceSearch", () => {
      it("sends bad request error when passing invalid search object", async () => {
        for (const search of [
          { companySearch: "A" },
          { test: 1 },
          { province: "4" },
          { companySearch: "Parallel Solutions", province: "0" },
        ]) {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($integrationId: GID!, $profileTypeId: GID!, $search: JSONObject!) {
                profileExternalSourceSearch(
                  integrationId: $integrationId
                  profileTypeId: $profileTypeId
                  search: $search
                  locale: en
                ) {
                  __typename
                }
              }
            `,
            {
              integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
              profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
              search,
            },
          );

          expect(errors).toContainGraphQLError("BAD_REQUEST");
          expect(data).toBeNull();
        }
      });

      it("runs search by name on INDIVIDUAL profile type", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $profileTypeId: GID!, $search: JSONObject!) {
              profileExternalSourceSearch(
                integrationId: $integrationId
                profileTypeId: $profileTypeId
                search: $search
                locale: en
              ) {
                __typename
                ... on ProfileExternalSourceSearchMultipleResults {
                  totalCount
                  results {
                    key
                    columns {
                      key
                      label
                    }
                    rows
                  }
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            search: { companySearch: "Mike Ross" },
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          profileExternalSourceSearch: {
            __typename: "ProfileExternalSourceSearchMultipleResults",
            totalCount: 3,
            results: {
              key: "id",
              columns: [
                {
                  key: "denominacion",
                  label: "Name or company name",
                },
                {
                  key: "provincia",
                  label: "Province",
                },
              ],
              rows: [
                { id: "1", denominacion: "Mike Ross (1)", provincia: "Barcelona" },
                { id: "2", denominacion: "Mike Ross (2)", provincia: "Barcelona" },
                { id: "3", denominacion: "Mike Ross (3)", provincia: "Barcelona" },
              ],
            },
          },
        });
      });

      it("runs search by DNI on INDIVIDUAL profile type", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $profileTypeId: GID!, $search: JSONObject!) {
              profileExternalSourceSearch(
                integrationId: $integrationId
                profileTypeId: $profileTypeId
                search: $search
                locale: en
              ) {
                __typename
                ... on ProfileExternalSourceSearchSingleResult {
                  id
                  data {
                    profileTypeField {
                      alias
                    }
                    content
                  }
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            search: { companySearch: "Y1234567A" },
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          profileExternalSourceSearch: {
            __typename: "ProfileExternalSourceSearchSingleResult",
            id: expect.any(String),
            data: [
              {
                profileTypeField: {
                  alias: "p_first_name",
                },
                content: {
                  value: "MIKE",
                },
              },
              {
                profileTypeField: {
                  alias: "p_last_name",
                },
                content: {
                  value: "ROSS",
                },
              },
              {
                profileTypeField: {
                  alias: "p_email",
                },
                content: {
                  value: "mike@onparallel.com",
                },
              },
              {
                profileTypeField: {
                  alias: "p_address",
                },
                content: {
                  value: "Fake St. 123 08025 Barcelona (Barcelona)",
                },
              },
              {
                profileTypeField: {
                  alias: "p_city",
                },
                content: {
                  value: "Barcelona",
                },
              },
              {
                profileTypeField: {
                  alias: "p_zip",
                },
                content: {
                  value: "08025",
                },
              },
              {
                profileTypeField: {
                  alias: "p_tax_id",
                },
                content: {
                  value: "Y1234567A",
                },
              },
              {
                profileTypeField: {
                  alias: "p_occupation",
                },
                content: {
                  value: "Lawyer",
                },
              },
            ],
          },
        });
      });

      it("returns 0 multiple results when searching by unknown DNI", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $profileTypeId: GID!, $search: JSONObject!) {
              profileExternalSourceSearch(
                integrationId: $integrationId
                profileTypeId: $profileTypeId
                search: $search
                locale: en
              ) {
                __typename
                ... on ProfileExternalSourceSearchMultipleResults {
                  totalCount
                  results {
                    key
                    columns {
                      key
                      label
                    }
                    rows
                  }
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            search: { companySearch: "Y1234567Z" },
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.profileExternalSourceSearch).toEqual({
          __typename: "ProfileExternalSourceSearchMultipleResults",
          totalCount: 0,
          results: {
            key: "id",
            columns: [],
            rows: [],
          },
        });
      });

      it("runs search by company name on LEGAL_ENTITY profile type", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $profileTypeId: GID!, $search: JSONObject!) {
              profileExternalSourceSearch(
                integrationId: $integrationId
                profileTypeId: $profileTypeId
                search: $search
                locale: en
              ) {
                __typename
                ... on ProfileExternalSourceSearchMultipleResults {
                  totalCount
                  results {
                    key
                    columns {
                      key
                      label
                    }
                    rows
                  }
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            profileTypeId: toGlobalId("ProfileType", legalEntityProfileType.id),
            search: { companySearch: "Parallel" },
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          profileExternalSourceSearch: {
            __typename: "ProfileExternalSourceSearchMultipleResults",
            totalCount: 2,
            results: {
              key: "id",
              columns: [
                {
                  key: "denominacion",
                  label: "Name or company name",
                },
                {
                  key: "provincia",
                  label: "Province",
                },
              ],
              rows: [
                { id: "4", denominacion: "Parallel Solutions S.L. (1)", provincia: "Barcelona" },
                { id: "5", denominacion: "Parallel Solutions S.L. (2)", provincia: "Barcelona" },
              ],
            },
          },
        });
      });

      it("runs search by company tax ID on LEGAL_ENTITY profile type", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $profileTypeId: GID!, $search: JSONObject!) {
              profileExternalSourceSearch(
                integrationId: $integrationId
                profileTypeId: $profileTypeId
                search: $search
                locale: en
              ) {
                __typename
                ... on ProfileExternalSourceSearchSingleResult {
                  id
                  data {
                    profileTypeField {
                      alias
                    }
                    content
                  }
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            profileTypeId: toGlobalId("ProfileType", legalEntityProfileType.id),
            search: { companySearch: "B67505586" },
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          profileExternalSourceSearch: {
            __typename: "ProfileExternalSourceSearchSingleResult",
            id: expect.any(String),
            data: [
              {
                profileTypeField: {
                  alias: "p_entity_name",
                },
                content: {
                  value: "Parallel Solutions S.L.",
                },
              },
              {
                profileTypeField: {
                  alias: "p_tax_id",
                },
                content: {
                  value: "B67505586",
                },
              },
              {
                profileTypeField: {
                  alias: "p_registered_address",
                },
                content: {
                  value: "Fake St. 123 08025 Barcelona (Barcelona)",
                },
              },
              {
                profileTypeField: {
                  alias: "p_city",
                },
                content: {
                  value: "Barcelona",
                },
              },
              {
                profileTypeField: {
                  alias: "p_zip",
                },
                content: {
                  value: "08025",
                },
              },
              {
                profileTypeField: {
                  alias: "p_country_of_incorporation",
                },
                content: {
                  value: "ES",
                },
              },
              {
                profileTypeField: {
                  alias: "p_date_of_incorporation",
                },
                content: {
                  value: "2020-01-01",
                },
              },
            ],
          },
        });
      });

      it("returns null content on fields HIDDEN to the user", async () => {
        await mocks.knex
          .from("profile_type_field")
          .whereIn("id", [
            legalEntityPTFsByAlias["p_city"].id,
            legalEntityPTFsByAlias["p_tax_id"].id,
          ])
          .update({ permission: "HIDDEN" });

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $profileTypeId: GID!, $search: JSONObject!) {
              profileExternalSourceSearch(
                integrationId: $integrationId
                profileTypeId: $profileTypeId
                search: $search
                locale: en
              ) {
                __typename
                ... on ProfileExternalSourceSearchSingleResult {
                  id
                  data {
                    profileTypeField {
                      alias
                    }
                    content
                  }
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            profileTypeId: toGlobalId("ProfileType", legalEntityProfileType.id),
            search: { companySearch: "B67505586" },
          },
        );

        await mocks.knex
          .from("profile_type_field")
          .whereIn("id", [
            legalEntityPTFsByAlias["p_city"].id,
            legalEntityPTFsByAlias["p_tax_id"].id,
          ])
          .update({ permission: "WRITE" });

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          profileExternalSourceSearch: {
            __typename: "ProfileExternalSourceSearchSingleResult",
            id: expect.any(String),
            data: [
              {
                profileTypeField: {
                  alias: "p_entity_name",
                },
                content: {
                  value: "Parallel Solutions S.L.",
                },
              },
              {
                profileTypeField: {
                  alias: "p_tax_id",
                },
                content: null,
              },
              {
                profileTypeField: {
                  alias: "p_registered_address",
                },
                content: {
                  value: "Fake St. 123 08025 Barcelona (Barcelona)",
                },
              },
              {
                profileTypeField: {
                  alias: "p_city",
                },
                content: null,
              },
              {
                profileTypeField: {
                  alias: "p_zip",
                },
                content: { value: "08025" },
              },
              {
                profileTypeField: {
                  alias: "p_country_of_incorporation",
                },
                content: {
                  value: "ES",
                },
              },
              {
                profileTypeField: {
                  alias: "p_date_of_incorporation",
                },
                content: {
                  value: "2020-01-01",
                },
              },
            ],
          },
        });
      });

      it("sends error if requesting search by name on CONTRACT profile type", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $profileTypeId: GID!, $search: JSONObject!) {
              profileExternalSourceSearch(
                integrationId: $integrationId
                profileTypeId: $profileTypeId
                search: $search
                locale: en
              ) {
                __typename
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            profileTypeId: toGlobalId("ProfileType", contractProfileType.id),
            search: { companySearch: "Parallel Solutions" },
          },
        );

        expect(errors).toContainGraphQLError("BAD_REQUEST");
        expect(data).toBeNull();
      });

      it("sends error if requesting search by tax ID on CONTRACT profile type", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $profileTypeId: GID!, $search: JSONObject!) {
              profileExternalSourceSearch(
                integrationId: $integrationId
                profileTypeId: $profileTypeId
                search: $search
                locale: en
              ) {
                __typename
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            profileTypeId: toGlobalId("ProfileType", contractProfileType.id),
            search: { companySearch: "B67505586" },
          },
        );

        expect(errors).toContainGraphQLError("BAD_REQUEST");
        expect(data).toBeNull();
      });
    });

    describe("profileExternalSourceDetails", () => {
      it("returns details for an INDIVIDUAL profile type", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $externalId: ID!, $profileTypeId: GID!) {
              profileExternalSourceDetails(
                integrationId: $integrationId
                externalId: $externalId
                profileTypeId: $profileTypeId
              ) {
                id
                data {
                  profileTypeField {
                    alias
                  }
                  content
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            externalId: "Y1234567A",
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.profileExternalSourceDetails).toEqual({
          id: expect.any(String),
          data: [
            {
              profileTypeField: {
                alias: "p_first_name",
              },
              content: {
                value: "MIKE",
              },
            },
            {
              profileTypeField: {
                alias: "p_last_name",
              },
              content: {
                value: "ROSS",
              },
            },
            {
              profileTypeField: {
                alias: "p_email",
              },
              content: {
                value: "mike@onparallel.com",
              },
            },
            {
              profileTypeField: {
                alias: "p_address",
              },
              content: {
                value: "Fake St. 123 08025 Barcelona (Barcelona)",
              },
            },
            {
              profileTypeField: {
                alias: "p_city",
              },
              content: {
                value: "Barcelona",
              },
            },
            {
              profileTypeField: {
                alias: "p_zip",
              },
              content: {
                value: "08025",
              },
            },
            {
              profileTypeField: {
                alias: "p_tax_id",
              },
              content: {
                value: "Y1234567A",
              },
            },
            {
              profileTypeField: {
                alias: "p_occupation",
              },
              content: {
                value: "Lawyer",
              },
            },
          ],
        });
      });

      it("returns details for a LEGAL_ENTITY profile type", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $externalId: ID!, $profileTypeId: GID!) {
              profileExternalSourceDetails(
                integrationId: $integrationId
                externalId: $externalId
                profileTypeId: $profileTypeId
              ) {
                id
                data {
                  profileTypeField {
                    alias
                  }
                  content
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            externalId: "B67505586",
            profileTypeId: toGlobalId("ProfileType", legalEntityProfileType.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.profileExternalSourceDetails).toEqual({
          id: expect.any(String),
          data: [
            {
              profileTypeField: {
                alias: "p_entity_name",
              },
              content: {
                value: "Parallel Solutions S.L.",
              },
            },
            {
              profileTypeField: {
                alias: "p_tax_id",
              },
              content: {
                value: "B67505586",
              },
            },
            {
              profileTypeField: {
                alias: "p_registered_address",
              },
              content: {
                value: "Fake St. 123 08025 Barcelona (Barcelona)",
              },
            },
            {
              profileTypeField: {
                alias: "p_city",
              },
              content: {
                value: "Barcelona",
              },
            },
            {
              profileTypeField: {
                alias: "p_zip",
              },
              content: {
                value: "08025",
              },
            },
            {
              profileTypeField: {
                alias: "p_country_of_incorporation",
              },
              content: {
                value: "ES",
              },
            },
            {
              profileTypeField: {
                alias: "p_date_of_incorporation",
              },
              content: {
                value: "2020-01-01",
              },
            },
          ],
        });
      });

      it("sends error if requesting details on CONTRACT profile type", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $externalId: ID!, $profileTypeId: GID!) {
              profileExternalSourceDetails(
                integrationId: $integrationId
                externalId: $externalId
                profileTypeId: $profileTypeId
              ) {
                id
                data {
                  profileTypeField {
                    alias
                  }
                  content
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            externalId: "B67505586",
            profileTypeId: toGlobalId("ProfileType", contractProfileType.id),
          },
        );

        expect(errors).toContainGraphQLError("BAD_REQUEST");
        expect(data).toBeNull();
      });

      it("returns null content on fields HIDDEN to the user", async () => {
        await mocks.knex
          .from("profile_type_field")
          .whereIn("id", [
            legalEntityPTFsByAlias["p_city"].id,
            legalEntityPTFsByAlias["p_tax_id"].id,
          ])
          .update({ permission: "HIDDEN" });

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $externalId: ID!, $profileTypeId: GID!) {
              profileExternalSourceDetails(
                integrationId: $integrationId
                externalId: $externalId
                profileTypeId: $profileTypeId
              ) {
                id
                data {
                  profileTypeField {
                    alias
                  }
                  content
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            externalId: "B67505586",
            profileTypeId: toGlobalId("ProfileType", legalEntityProfileType.id),
          },
        );

        await mocks.knex
          .from("profile_type_field")
          .whereIn("id", [
            legalEntityPTFsByAlias["p_city"].id,
            legalEntityPTFsByAlias["p_tax_id"].id,
          ])
          .update({ permission: "WRITE" });

        expect(errors).toBeUndefined();
        expect(data?.profileExternalSourceDetails).toEqual({
          id: expect.any(String),
          data: [
            {
              profileTypeField: {
                alias: "p_entity_name",
              },
              content: {
                value: "Parallel Solutions S.L.",
              },
            },
            {
              profileTypeField: {
                alias: "p_tax_id",
              },
              content: null,
            },
            {
              profileTypeField: {
                alias: "p_registered_address",
              },
              content: {
                value: "Fake St. 123 08025 Barcelona (Barcelona)",
              },
            },
            {
              profileTypeField: {
                alias: "p_city",
              },
              content: null,
            },
            {
              profileTypeField: {
                alias: "p_zip",
              },
              content: { value: "08025" },
            },
            {
              profileTypeField: {
                alias: "p_country_of_incorporation",
              },
              content: { value: "ES" },
            },
            {
              profileTypeField: {
                alias: "p_date_of_incorporation",
              },
              content: {
                value: "2020-01-01",
              },
            },
          ],
        });
      });

      it("sends error if requesting details on an unknown entity", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($integrationId: GID!, $externalId: ID!, $profileTypeId: GID!) {
              profileExternalSourceDetails(
                integrationId: $integrationId
                externalId: $externalId
                profileTypeId: $profileTypeId
              ) {
                id
                data {
                  profileTypeField {
                    alias
                  }
                  content
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            externalId: "12345",
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
          },
        );

        expect(errors).toContainGraphQLError("ENTITY_NOT_FOUND");
        expect(data).toBeNull();
      });

      it("sends error if passing invalid combination of profileTypeId and profileId", async () => {
        const [individual] = await mocks.createRandomProfiles(
          organization.id,
          individualProfileType.id,
          1,
        );

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $integrationId: GID!
              $externalId: ID!
              $profileTypeId: GID!
              $profileId: GID
            ) {
              profileExternalSourceDetails(
                integrationId: $integrationId
                externalId: $externalId
                profileTypeId: $profileTypeId
                profileId: $profileId
              ) {
                id
                data {
                  profileTypeField {
                    alias
                  }
                  content
                }
              }
            }
          `,
          {
            integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
            externalId: "12345",
            profileTypeId: toGlobalId("ProfileType", legalEntityProfileType.id),
            profileId: toGlobalId("Profile", individual.id),
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });
    });

    describe("completeProfileFromExternalSource", () => {
      let individualEntity: ProfileExternalSourceEntity;
      let legalEntityEntity: ProfileExternalSourceEntity;
      let privateEntity: ProfileExternalSourceEntity;

      beforeAll(async () => {
        const [otherUser] = await mocks.createRandomUsers(organization.id, 1);
        [individualEntity, legalEntityEntity, privateEntity] = await mocks.knex
          .from("profile_external_source_entity")
          .insert([
            {
              created_by_user_id: user.id,
              integration_id: orgIntegration.id,
              standard_type: "INDIVIDUAL",
              data: {},
              parsed_data: {
                p_first_name: { value: "Mike" },
                p_last_name: { value: "Ross" },
                p_email: { value: "mike@onparallel.com" },
                p_address: { value: "Fake St. 123" },
                p_city: { value: "Barcelona" },
                p_tax_id: { value: "Y1234567A" },
                p_occupation: { value: "Lawyer" },
              },
            },
            {
              created_by_user_id: user.id,
              integration_id: orgIntegration.id,
              standard_type: "LEGAL_ENTITY",
              data: {},
              parsed_data: {
                p_entity_name: { value: "Parallel Solutions S.L." },
                p_trade_name: { value: "Parallel" },
                p_tax_id: { value: "B67505586" },
                p_city: { value: "Barcelona" },
                p_date_of_incorporation: { value: "2020-01-01" },
              },
            },
            {
              created_by_user_id: otherUser.id,
              integration_id: orgIntegration.id,
              standard_type: "INDIVIDUAL",
              data: {},
              parsed_data: {
                p_first_name: { value: "John" },
                p_last_name: { value: "Doe" },
              },
            },
          ])
          .returning("*");
      });

      it("completes empty INDIVIDUAL profile value with external source data", async () => {
        const [individual] = await mocks.createRandomProfiles(
          organization.id,
          individualProfileType.id,
          1,
        );

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileExternalSourceEntityId: GID!
              $profileTypeId: GID!
              $profileId: GID
              $conflictResolutions: [ProfileExternalSourceConflictResolution!]!
            ) {
              completeProfileFromExternalSource(
                profileExternalSourceEntityId: $profileExternalSourceEntityId
                profileTypeId: $profileTypeId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
              ) {
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
                  }
                  value {
                    content
                  }
                }
              }
            }
          `,
          {
            profileExternalSourceEntityId: toGlobalId(
              "ProfileExternalSourceEntity",
              individualEntity.id,
            ),
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            profileId: toGlobalId("Profile", individual.id),
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_first_name"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_last_name"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_email"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_address"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_city"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_tax_id"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_occupation"].id,
                ),
                action: "OVERWRITE",
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(pick(data?.completeProfileFromExternalSource, ["id", "events"])).toEqual({
          id: toGlobalId("Profile", individual.id),
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
                    individualPTFsByAlias["p_occupation"].id,
                  ),
                  alias: "p_occupation",
                },
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    individualPTFsByAlias["p_tax_id"].id,
                  ),
                  alias: "p_tax_id",
                },
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    individualPTFsByAlias["p_city"].id,
                  ),
                  alias: "p_city",
                },
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    individualPTFsByAlias["p_address"].id,
                  ),
                  alias: "p_address",
                },
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    individualPTFsByAlias["p_email"].id,
                  ),
                  alias: "p_email",
                },
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    individualPTFsByAlias["p_last_name"].id,
                  ),
                  alias: "p_last_name",
                },
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    individualPTFsByAlias["p_first_name"].id,
                  ),
                  alias: "p_first_name",
                },
              },
            ],
          },
        });
        expect(data?.completeProfileFromExternalSource.properties.slice(0, 28)).toEqual([
          { field: { alias: "p_first_name" }, value: { content: { value: "Mike" } } },
          { field: { alias: "p_last_name" }, value: { content: { value: "Ross" } } },
          { field: { alias: "p_email" }, value: { content: { value: "mike@onparallel.com" } } },
          { field: { alias: "p_phone_number" }, value: null },
          { field: { alias: "p_mobile_phone_number" }, value: null },
          { field: { alias: "p_birth_date" }, value: null },
          { field: { alias: "p_gender" }, value: null },
          { field: { alias: "p_address" }, value: { content: { value: "Fake St. 123" } } },
          { field: { alias: "p_city" }, value: { content: { value: "Barcelona" } } },
          { field: { alias: "p_zip" }, value: null },
          { field: { alias: "p_country_of_residence" }, value: null },
          { field: { alias: "p_proof_of_address_document" }, value: null },
          { field: { alias: "p_citizenship" }, value: null },
          { field: { alias: "p_tax_id" }, value: { content: { value: "Y1234567A" } } },
          { field: { alias: "p_id_document" }, value: null },
          { field: { alias: "p_passport_document" }, value: null },
          { field: { alias: "p_passport_number" }, value: null },
          { field: { alias: "p_is_pep" }, value: null },
          { field: { alias: "p_risk" }, value: null },
          { field: { alias: "p_risk_assessment" }, value: null },
          { field: { alias: "p_source_of_funds" }, value: null },
          { field: { alias: "p_background_check" }, value: null },
          { field: { alias: "p_occupation" }, value: { content: { value: "Lawyer" } } },
          { field: { alias: "p_poa" }, value: null },
          { field: { alias: "p_position" }, value: null },
          { field: { alias: "p_client_status" }, value: null },
          { field: { alias: "p_marital_status" }, value: null },
          { field: { alias: "p_relationship" }, value: null },
        ]);
      });

      it("completes LEGAL_ENTITY profile value with external source data", async () => {
        const [legalEntity] = await mocks.createRandomProfiles(
          organization.id,
          legalEntityProfileType.id,
          1,
        );
        // insert some values on profile
        await mocks.knex.from("profile_field_value").insert([
          {
            profile_id: legalEntity.id,
            profile_type_field_id: legalEntityPTFsByAlias["p_trade_name"].id,
            content: { value: "My Super Company" },
            created_by_user_id: user.id,
            type: "SHORT_TEXT",
          },
          {
            profile_id: legalEntity.id,
            profile_type_field_id: legalEntityPTFsByAlias["p_tax_id"].id,
            content: { value: "B67505586" },
            created_by_user_id: user.id,
            type: "SHORT_TEXT",
          },
          {
            profile_id: legalEntity.id,
            profile_type_field_id: legalEntityPTFsByAlias["p_city"].id,
            content: { value: "Tarragona" },
            created_by_user_id: user.id,
            type: "SHORT_TEXT",
          },
          {
            profile_id: legalEntity.id,
            profile_type_field_id: legalEntityPTFsByAlias["p_date_of_incorporation"].id,
            content: { value: "2024-12-29" },
            created_by_user_id: user.id,
            type: "DATE",
          },
        ]);

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileExternalSourceEntityId: GID!
              $profileTypeId: GID!
              $profileId: GID
              $conflictResolutions: [ProfileExternalSourceConflictResolution!]!
            ) {
              completeProfileFromExternalSource(
                profileExternalSourceEntityId: $profileExternalSourceEntityId
                profileTypeId: $profileTypeId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
              ) {
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
                  }
                  value {
                    content
                  }
                }
              }
            }
          `,
          {
            profileExternalSourceEntityId: toGlobalId(
              "ProfileExternalSourceEntity",
              legalEntityEntity.id,
            ),
            profileTypeId: toGlobalId("ProfileType", legalEntityProfileType.id),
            profileId: toGlobalId("Profile", legalEntity.id),
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityPTFsByAlias["p_entity_name"].id,
                ),
                action: "IGNORE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityPTFsByAlias["p_trade_name"].id,
                ),
                action: "IGNORE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityPTFsByAlias["p_tax_id"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityPTFsByAlias["p_city"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityPTFsByAlias["p_date_of_incorporation"].id,
                ),
                action: "OVERWRITE",
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(pick(data?.completeProfileFromExternalSource, ["id", "events"])).toEqual({
          id: toGlobalId("Profile", legalEntity.id),
          events: {
            totalCount: 4,
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
                    legalEntityPTFsByAlias["p_date_of_incorporation"].id,
                  ),
                  alias: "p_date_of_incorporation",
                },
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    legalEntityPTFsByAlias["p_city"].id,
                  ),
                  alias: "p_city",
                },
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    legalEntityPTFsByAlias["p_tax_id"].id,
                  ),
                  alias: "p_tax_id",
                },
              },
            ],
          },
        });
        expect(data?.completeProfileFromExternalSource.properties.slice(0, 31)).toEqual([
          { field: { alias: "p_entity_name" }, value: null },
          { field: { alias: "p_trade_name" }, value: { content: { value: "My Super Company" } } },
          { field: { alias: "p_entity_type" }, value: null },
          { field: { alias: "p_registration_number" }, value: null },
          { field: { alias: "p_tax_id" }, value: { content: { value: "B67505586" } } },
          { field: { alias: "p_registered_address" }, value: null },
          { field: { alias: "p_phone_number" }, value: null },
          { field: { alias: "p_city" }, value: { content: { value: "Barcelona" } } },
          { field: { alias: "p_zip" }, value: null },
          { field: { alias: "p_country" }, value: null },
          { field: { alias: "p_country_of_incorporation" }, value: null },
          {
            field: { alias: "p_date_of_incorporation" },
            value: { content: { value: "2020-01-01" } },
          },
          { field: { alias: "p_main_business_activity" }, value: null },
          { field: { alias: "p_ownership_structure" }, value: null },
          { field: { alias: "p_ubo_statement" }, value: null },
          { field: { alias: "p_financial_statements" }, value: null },
          { field: { alias: "p_risk" }, value: null },
          { field: { alias: "p_risk_assessment" }, value: null },
          { field: { alias: "p_poa_types" }, value: null },
          { field: { alias: "p_poa_scope" }, value: null },
          { field: { alias: "p_poa_document" }, value: null },
          { field: { alias: "p_poa_effective_date" }, value: null },
          { field: { alias: "p_poa_expiration_date" }, value: null },
          { field: { alias: "p_poa_revocation_conditions" }, value: null },
          { field: { alias: "p_poa_registered" }, value: null },
          { field: { alias: "p_background_check" }, value: null },
          { field: { alias: "p_tax_id_document" }, value: null },
          { field: { alias: "p_deed_incorporation" }, value: null },
          { field: { alias: "p_bylaws" }, value: null },
          { field: { alias: "p_client_status" }, value: null },
          { field: { alias: "p_relationship" }, value: null },
        ]);
      });

      it("creates and completes a new profile if passing null profileId", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileExternalSourceEntityId: GID!
              $profileTypeId: GID!
              $profileId: GID
              $conflictResolutions: [ProfileExternalSourceConflictResolution!]!
            ) {
              completeProfileFromExternalSource(
                profileExternalSourceEntityId: $profileExternalSourceEntityId
                profileTypeId: $profileTypeId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
              ) {
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
                  }
                  value {
                    content
                  }
                }
              }
            }
          `,
          {
            profileExternalSourceEntityId: toGlobalId(
              "ProfileExternalSourceEntity",
              individualEntity.id,
            ),
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            profileId: null,
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_first_name"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_last_name"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_email"].id,
                ),
                action: "IGNORE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_address"].id,
                ),
                action: "IGNORE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_city"].id,
                ),
                action: "IGNORE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_tax_id"].id,
                ),
                action: "IGNORE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_occupation"].id,
                ),
                action: "IGNORE",
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(pick(data.completeProfileFromExternalSource, ["id", "events"])).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 4,
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
                    individualPTFsByAlias["p_last_name"].id,
                  ),
                  alias: "p_last_name",
                },
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    individualPTFsByAlias["p_first_name"].id,
                  ),
                  alias: "p_first_name",
                },
              },
              {
                type: "PROFILE_CREATED",
                data: {
                  userId: toGlobalId("User", user.id),
                },
              },
            ],
          },
        });

        // check up to 28 first properties
        expect(data?.completeProfileFromExternalSource.properties.slice(0, 28)).toEqual([
          { field: { alias: "p_first_name" }, value: { content: { value: "Mike" } } },
          { field: { alias: "p_last_name" }, value: { content: { value: "Ross" } } },
          { field: { alias: "p_email" }, value: null },
          { field: { alias: "p_phone_number" }, value: null },
          { field: { alias: "p_mobile_phone_number" }, value: null },
          { field: { alias: "p_birth_date" }, value: null },
          { field: { alias: "p_gender" }, value: null },
          { field: { alias: "p_address" }, value: null },
          { field: { alias: "p_city" }, value: null },
          { field: { alias: "p_zip" }, value: null },
          { field: { alias: "p_country_of_residence" }, value: null },
          { field: { alias: "p_proof_of_address_document" }, value: null },
          { field: { alias: "p_citizenship" }, value: null },
          { field: { alias: "p_tax_id" }, value: null },
          { field: { alias: "p_id_document" }, value: null },
          { field: { alias: "p_passport_document" }, value: null },
          { field: { alias: "p_passport_number" }, value: null },
          { field: { alias: "p_is_pep" }, value: null },
          { field: { alias: "p_risk" }, value: null },
          { field: { alias: "p_risk_assessment" }, value: null },
          { field: { alias: "p_source_of_funds" }, value: null },
          { field: { alias: "p_background_check" }, value: null },
          { field: { alias: "p_occupation" }, value: null },
          { field: { alias: "p_poa" }, value: null },
          { field: { alias: "p_position" }, value: null },
          { field: { alias: "p_client_status" }, value: null },
          { field: { alias: "p_marital_status" }, value: null },
          { field: { alias: "p_relationship" }, value: null },
        ]);
      });

      it("sends error if trying to complete a CONTRACT profile", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileExternalSourceEntityId: GID!
              $profileTypeId: GID!
              $profileId: GID
              $conflictResolutions: [ProfileExternalSourceConflictResolution!]!
            ) {
              completeProfileFromExternalSource(
                profileExternalSourceEntityId: $profileExternalSourceEntityId
                profileTypeId: $profileTypeId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
              ) {
                id
              }
            }
          `,
          {
            profileExternalSourceEntityId: toGlobalId(
              "ProfileExternalSourceEntity",
              individualEntity.id,
            ),
            profileTypeId: toGlobalId("ProfileType", contractProfileType.id),
            profileId: null,
            conflictResolutions: [],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("sends error if trying to OVERWRITE a field with HIDDEN or READ permission", async () => {
        await mocks.knex
          .from("profile_type_field")
          .whereIn("id", [individualPTFsByAlias["p_city"].id, individualPTFsByAlias["p_tax_id"].id])
          .update({ permission: "READ" });

        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileExternalSourceEntityId: GID!
              $profileTypeId: GID!
              $profileId: GID
              $conflictResolutions: [ProfileExternalSourceConflictResolution!]!
            ) {
              completeProfileFromExternalSource(
                profileExternalSourceEntityId: $profileExternalSourceEntityId
                profileTypeId: $profileTypeId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
              ) {
                id
              }
            }
          `,
          {
            profileExternalSourceEntityId: toGlobalId(
              "ProfileExternalSourceEntity",
              individualEntity.id,
            ),
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            profileId: null,
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_first_name"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_last_name"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_email"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_address"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_city"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_tax_id"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_occupation"].id,
                ),
                action: "OVERWRITE",
              },
            ],
          },
        );

        await mocks.knex
          .from("profile_type_field")
          .whereIn("id", [individualPTFsByAlias["p_city"].id, individualPTFsByAlias["p_tax_id"].id])
          .update({ permission: "WRITE" });

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("sends error if user does not have access to external source entity", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileExternalSourceEntityId: GID!
              $profileTypeId: GID!
              $profileId: GID
              $conflictResolutions: [ProfileExternalSourceConflictResolution!]!
            ) {
              completeProfileFromExternalSource(
                profileExternalSourceEntityId: $profileExternalSourceEntityId
                profileTypeId: $profileTypeId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
              ) {
                id
              }
            }
          `,
          {
            profileExternalSourceEntityId: toGlobalId(
              "ProfileExternalSourceEntity",
              privateEntity.id,
            ),
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            profileId: null,
            conflictResolutions: [],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("sends error if not every entity field has a conflict resolution", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileExternalSourceEntityId: GID!
              $profileTypeId: GID!
              $profileId: GID
              $conflictResolutions: [ProfileExternalSourceConflictResolution!]!
            ) {
              completeProfileFromExternalSource(
                profileExternalSourceEntityId: $profileExternalSourceEntityId
                profileTypeId: $profileTypeId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
              ) {
                id
              }
            }
          `,
          {
            profileExternalSourceEntityId: toGlobalId(
              "ProfileExternalSourceEntity",
              individualEntity.id,
            ),
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            profileId: null,
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_first_name"].id,
                ),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualPTFsByAlias["p_last_name"].id,
                ),
                action: "OVERWRITE",
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("MISSING_CONFLICT_RESOLUTIONS");
        expect(data).toBeNull();
      });
    });

    describe("ProfileExternalSourceOrgIntegration", () => {
      it("lists searchableProfileTypes", async () => {
        const { errors, data } = await testClient.execute(gql`
          query {
            me {
              id
              organization {
                id
                integrations(type: PROFILE_EXTERNAL_SOURCE, limit: 10, offset: 0) {
                  totalCount
                  items {
                    id
                    ... on ProfileExternalSourceOrgIntegration {
                      searchableProfileTypes {
                        id
                        name
                        standardType
                      }
                    }
                  }
                }
              }
            }
          }
        `);
        expect(errors).toBeUndefined();
        expect(data).toMatchObject({
          me: {
            id: toGlobalId("User", user.id),
            organization: {
              id: toGlobalId("Organization", organization.id),
              integrations: {
                totalCount: 1,
                items: [
                  {
                    id: toGlobalId("OrgIntegration", orgIntegration.id),
                    searchableProfileTypes: [
                      {
                        id: toGlobalId("ProfileType", providerProfileType.id),
                        name: { en: "Provider", es: "Proveedor" },
                        standardType: "INDIVIDUAL",
                      },
                      {
                        id: toGlobalId("ProfileType", legalEntityProfileType.id),
                        name: { en: "Company", es: "Compañía" },
                        standardType: "LEGAL_ENTITY",
                      },
                      {
                        id: toGlobalId("ProfileType", individualProfileType.id),
                        name: { en: "Individual", es: "Persona" },
                        standardType: "INDIVIDUAL",
                      },
                    ],
                  },
                ],
              },
            },
          },
        });
      });

      it("builds searchParams definition for an INDIVIDUAL profileType", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            query ($profileTypeId: GID!) {
              me {
                organization {
                  integrations(type: PROFILE_EXTERNAL_SOURCE, limit: 10, offset: 0) {
                    totalCount
                    items {
                      id
                      name
                      type
                      ... on ProfileExternalSourceOrgIntegration {
                        searchParams(profileTypeId: $profileTypeId, locale: en) {
                          key
                          type
                          required
                          defaultValue
                          placeholder
                          label
                          options {
                            label
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          me: {
            organization: {
              integrations: {
                totalCount: 1,
                items: [
                  {
                    id: toGlobalId("OrgIntegration", orgIntegration.id),
                    name: "eInforma",
                    type: "PROFILE_EXTERNAL_SOURCE",
                    searchParams: [
                      {
                        key: "companySearch",
                        type: "TEXT",
                        required: true,
                        defaultValue: null,
                        placeholder: null,
                        label: "Name or tax ID",
                        options: null,
                      },
                      {
                        key: "province",
                        type: "SELECT",
                        required: false,
                        defaultValue: null,
                        placeholder: "Select a spanish province",
                        label: "Province",
                        options: expect.toBeArrayOfSize(52),
                      },
                    ],
                  },
                ],
              },
            },
          },
        });
      });

      it("builds searchParams definition for INDIVIDUAL profile with p_tax_id set", async () => {
        const [individual] = await mocks.createRandomProfiles(
          organization.id,
          individualProfileType.id,
          1,
        );
        await mocks.knex.from("profile_field_value").insert({
          profile_id: individual.id,
          profile_type_field_id: individualPTFsByAlias["p_tax_id"].id,
          content: { value: "Y0000000J" },
          created_by_user_id: user.id,
          type: "SHORT_TEXT",
        });

        const { errors, data } = await testClient.execute(
          gql`
            query ($profileTypeId: GID!, $profileId: GID) {
              me {
                organization {
                  integrations(type: PROFILE_EXTERNAL_SOURCE, limit: 10, offset: 0) {
                    totalCount
                    items {
                      id
                      name
                      type
                      ... on ProfileExternalSourceOrgIntegration {
                        searchParams(
                          profileTypeId: $profileTypeId
                          locale: en
                          profileId: $profileId
                        ) {
                          key
                          type
                          required
                          defaultValue
                          placeholder
                          label
                          options {
                            label
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            profileId: toGlobalId("Profile", individual.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          me: {
            organization: {
              integrations: {
                totalCount: 1,
                items: [
                  {
                    id: toGlobalId("OrgIntegration", orgIntegration.id),
                    name: "eInforma",
                    type: "PROFILE_EXTERNAL_SOURCE",
                    searchParams: [
                      {
                        key: "companySearch",
                        type: "TEXT",
                        required: true,
                        defaultValue: "Y0000000J",
                        placeholder: null,
                        label: "Name or tax ID",
                        options: null,
                      },
                      {
                        key: "province",
                        type: "SELECT",
                        required: false,
                        defaultValue: null,
                        placeholder: "Select a spanish province",
                        label: "Province",
                        options: expect.toBeArrayOfSize(52),
                      },
                    ],
                  },
                ],
              },
            },
          },
        });
      });

      it("builds searchParams definition for INDIVIDUAL profile with full name set", async () => {
        const [individual] = await mocks.createRandomProfiles(
          organization.id,
          individualProfileType.id,
          1,
        );
        await mocks.knex.from("profile_field_value").insert([
          {
            profile_id: individual.id,
            profile_type_field_id: individualPTFsByAlias["p_first_name"].id,
            content: { value: "Mike" },
            type: "SHORT_TEXT",
            created_by_user_id: user.id,
          },
          {
            profile_id: individual.id,
            profile_type_field_id: individualPTFsByAlias["p_last_name"].id,
            content: { value: "Ross" },
            type: "SHORT_TEXT",
            created_by_user_id: user.id,
          },
        ]);

        const { errors, data } = await testClient.execute(
          gql`
            query ($profileTypeId: GID!, $profileId: GID) {
              me {
                organization {
                  integrations(type: PROFILE_EXTERNAL_SOURCE, limit: 10, offset: 0) {
                    totalCount
                    items {
                      id
                      name
                      type
                      ... on ProfileExternalSourceOrgIntegration {
                        searchParams(
                          profileTypeId: $profileTypeId
                          locale: en
                          profileId: $profileId
                        ) {
                          key
                          type
                          required
                          defaultValue
                          placeholder
                          label
                          options {
                            label
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            profileId: toGlobalId("Profile", individual.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          me: {
            organization: {
              integrations: {
                totalCount: 1,
                items: [
                  {
                    id: toGlobalId("OrgIntegration", orgIntegration.id),
                    name: "eInforma",
                    type: "PROFILE_EXTERNAL_SOURCE",
                    searchParams: [
                      {
                        key: "companySearch",
                        type: "TEXT",
                        required: true,
                        defaultValue: "Mike Ross",
                        placeholder: null,
                        label: "Name or tax ID",
                        options: null,
                      },
                      {
                        key: "province",
                        type: "SELECT",
                        required: false,
                        defaultValue: null,
                        placeholder: "Select a spanish province",
                        label: "Province",
                        options: expect.toBeArrayOfSize(52),
                      },
                    ],
                  },
                ],
              },
            },
          },
        });
      });

      it("builds searchParams definition for LEGAL_ENTITY profile", async () => {
        const [legalEntity] = await mocks.createRandomProfiles(
          organization.id,
          legalEntityProfileType.id,
          1,
        );
        await mocks.knex.from("profile_field_value").insert([
          {
            // Should prioritize p_tax_id
            profile_id: legalEntity.id,
            profile_type_field_id: legalEntityPTFsByAlias["p_tax_id"].id,
            content: { value: "B67505586" },
            type: "SHORT_TEXT",
            created_by_user_id: user.id,
          },
          {
            profile_id: legalEntity.id,
            profile_type_field_id: legalEntityPTFsByAlias["p_trade_name"].id,
            content: { value: "Parallel" },
            type: "SHORT_TEXT",
            created_by_user_id: user.id,
          },
          {
            profile_id: legalEntity.id,
            profile_type_field_id: legalEntityPTFsByAlias["p_entity_name"].id,
            content: { value: "Parallel Solutions S.L." },
            type: "SHORT_TEXT",
            created_by_user_id: user.id,
          },
        ]);

        const { errors, data } = await testClient.execute(
          gql`
            query ($profileTypeId: GID!, $profileId: GID) {
              me {
                organization {
                  integrations(type: PROFILE_EXTERNAL_SOURCE, limit: 10, offset: 0) {
                    totalCount
                    items {
                      id
                      name
                      type
                      ... on ProfileExternalSourceOrgIntegration {
                        searchParams(
                          profileTypeId: $profileTypeId
                          locale: en
                          profileId: $profileId
                        ) {
                          key
                          type
                          required
                          defaultValue
                          placeholder
                          label
                          options {
                            label
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", legalEntityProfileType.id),
            profileId: toGlobalId("Profile", legalEntity.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          me: {
            organization: {
              integrations: {
                totalCount: 1,
                items: [
                  {
                    id: toGlobalId("OrgIntegration", orgIntegration.id),
                    name: "eInforma",
                    type: "PROFILE_EXTERNAL_SOURCE",
                    searchParams: [
                      {
                        key: "companySearch",
                        type: "TEXT",
                        required: true,
                        defaultValue: "B67505586",
                        placeholder: null,
                        label: "Company name or tax ID",
                        options: null,
                      },
                      {
                        key: "province",
                        type: "SELECT",
                        required: false,
                        defaultValue: null,
                        placeholder: "Select a spanish province",
                        label: "Province",
                        options: expect.toBeArrayOfSize(52),
                      },
                    ],
                  },
                ],
              },
            },
          },
        });
      });

      it("returns empty object if requesting searchParams on CONTRACT profileType", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            query ($profileTypeId: GID!) {
              me {
                organization {
                  integrations(type: PROFILE_EXTERNAL_SOURCE, limit: 10, offset: 0) {
                    totalCount
                    items {
                      id
                      name
                      type
                      ... on ProfileExternalSourceOrgIntegration {
                        searchParams(profileTypeId: $profileTypeId, locale: en) {
                          key
                          type
                          required
                          defaultValue
                          placeholder
                          label
                          options {
                            label
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", contractProfileType.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          me: {
            organization: {
              integrations: {
                totalCount: 1,
                items: [
                  {
                    id: toGlobalId("OrgIntegration", orgIntegration.id),
                    name: "eInforma",
                    type: "PROFILE_EXTERNAL_SOURCE",
                    searchParams: [], // eInforma can't search on CONTRACT profile
                  },
                ],
              },
            },
          },
        });
      });

      it("does not prefill defaultValues on searchParams if user does not have READ permission on the field", async () => {
        const [individual] = await mocks.createRandomProfiles(
          organization.id,
          individualProfileType.id,
          1,
        );
        await mocks.knex.from("profile_field_value").insert([
          {
            profile_id: individual.id,
            profile_type_field_id: individualPTFsByAlias["p_tax_id"].id,
            content: { value: "Y0000000J" },
            created_by_user_id: user.id,
            type: "SHORT_TEXT",
          },
        ]);

        await mocks.knex
          .from("profile_type_field")
          .where("id", individualPTFsByAlias["p_tax_id"].id)
          .update({ permission: "HIDDEN" });

        const { errors, data } = await testClient.execute(
          gql`
            query ($profileTypeId: GID!, $profileId: GID) {
              me {
                organization {
                  integrations(type: PROFILE_EXTERNAL_SOURCE, limit: 10, offset: 0) {
                    totalCount
                    items {
                      id
                      name
                      type
                      ... on ProfileExternalSourceOrgIntegration {
                        searchParams(
                          profileTypeId: $profileTypeId
                          locale: en
                          profileId: $profileId
                        ) {
                          key
                          type
                          required
                          defaultValue
                          placeholder
                          label
                          options {
                            label
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individualProfileType.id),
            profileId: toGlobalId("Profile", individual.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toEqual({
          me: {
            organization: {
              integrations: {
                totalCount: 1,
                items: [
                  {
                    id: toGlobalId("OrgIntegration", orgIntegration.id),
                    name: "eInforma",
                    type: "PROFILE_EXTERNAL_SOURCE",
                    searchParams: [
                      {
                        key: "companySearch",
                        type: "TEXT",
                        required: true,
                        defaultValue: null,
                        placeholder: null,
                        label: "Name or tax ID",
                        options: null,
                      },
                      {
                        key: "province",
                        type: "SELECT",
                        required: false,
                        defaultValue: null,
                        placeholder: "Select a spanish province",
                        label: "Province",
                        options: expect.toBeArrayOfSize(52),
                      },
                    ],
                  },
                ],
              },
            },
          },
        });

        await mocks.knex
          .from("profile_type_field")
          .where("id", individualPTFsByAlias["p_tax_id"].id)
          .update({ permission: "WRITE" });
      });

      it("sends error if passing invalid combination of profileTypeId and profileId", async () => {
        const [individual] = await mocks.createRandomProfiles(
          organization.id,
          individualProfileType.id,
          1,
        );

        const { errors, data } = await testClient.execute(
          gql`
            query ($profileTypeId: GID!, $profileId: GID) {
              me {
                organization {
                  integrations(type: PROFILE_EXTERNAL_SOURCE, limit: 10, offset: 0) {
                    totalCount
                    items {
                      id
                      name
                      type
                      ... on ProfileExternalSourceOrgIntegration {
                        searchParams(
                          profileTypeId: $profileTypeId
                          locale: en
                          profileId: $profileId
                        ) {
                          key
                          type
                          required
                          defaultValue
                          placeholder
                          label
                          options {
                            label
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", legalEntityProfileType.id),
            profileId: toGlobalId("Profile", individual.id),
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });
    });

    describe("buildCustomProfileTypeFieldValueContentsByProfileTypeFieldId", () => {
      let eInforma: EInformaProfileExternalSourceIntegration;
      let cnaeSelect: ProfileTypeField;

      beforeAll(async () => {
        eInforma = testClient.container.get<EInformaProfileExternalSourceIntegration>(
          EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION,
        );

        [cnaeSelect] = await mocks.knex.from("profile_type_field").insert(
          {
            type: "SELECT",
            options: {
              standardList: "CNAE",
            },
            profile_type_id: individualProfileType.id,
            position: Object.entries(individualPTFsByAlias).length + 1,
            name: { en: "CNAE", es: "CNAE" },
            permission: "WRITE",
          },
          "*",
        );

        await mocks.knex
          .from("org_integration")
          .where("id", orgIntegration.id)
          .update(
            {
              settings: {
                ...orgIntegration.settings,
                CUSTOM_PROPERTIES_MAP: {
                  [individualProfileType.id]: {
                    [cnaeSelect.id]: "cnae",
                    [individualPTFsByAlias["p_source_of_funds"].id]: "web",
                  },
                },
              },
            },
            "*",
          );
      });

      it("builds custom properties data when providing CUSTOM_PROPERTY_MAP on integration settings", async () => {
        const customData =
          await eInforma.buildCustomProfileTypeFieldValueContentsByProfileTypeFieldId(
            orgIntegration.id,
            individualProfileType.id,
            "INDIVIDUAL",
            {
              denominacion: "MUTUA MADRILEÑA AUTOMOVILISTA SOCIEDAD DE SEGUROS A PRIMA FIJA",
              nombreComercial: ["TORRE DE CRISTAL", "MUTUA MADRILEÑA AUTOMOVILISTA"],
              domicilioSocial: "PASEO CASTELLANA, 33",
              localidad: "28046 MADRID (Madrid)",
              formaJuridica: "OTROS TIPOS NO DEFINIDOS",
              cnae: "6512 - Seguros distintos de los seguros de vida",
              identificativo: "V28027118",
              situacion: "Activa",
              telefono: [915555555, 902175176, 917025410, 902555550],
              fax: [913083128],
              web: ["www.grupomutua.es", "www.mutua-mad.es"],
              email: "vmenchero@mutua.es",
              cargoPrincipal: "GARRALDA RUIZ DE VELASCO, IGNACIO",
              capitalSocial: 32611644.46,
              empleados: 1727,
              fechaConstitucion: "1930-03-13",
            },
            () => true,
            async () => true,
          );

        expect(customData).toEqual({
          [`_.${cnaeSelect.id}`]: { value: "6512" },
          [`_.${individualPTFsByAlias["p_source_of_funds"].id}`]: { value: "www.grupomutua.es" },
        });
      });
    });
  });
});
