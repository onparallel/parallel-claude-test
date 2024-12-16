import { subMinutes } from "date-fns";
import { gql } from "graphql-request";
import { Knex } from "knex";
import {
  Dashboard,
  DashboardModule,
  Organization,
  Petition,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldType,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("GraphQL / Dashboards", () => {
  let testClient: TestClient;
  let user: User;
  let organization: Organization;

  let superadmin: User;
  let rootOrg: Organization;
  let mocks: Mocks;

  let superadminApiKey: string;

  let dashboards: Dashboard[];
  let modules: DashboardModule[];

  let profileType: ProfileType;
  let shortTextProfileTypeField: ProfileTypeField;
  let numberProfileTypeField: ProfileTypeField;

  let rootOrgProfileType: ProfileType;
  let rootOrgProfileTypeField: ProfileTypeField;

  let userTemplate: Petition;
  let rootOrgTemplate: Petition;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([{ name: "DASHBOARDS", default_value: true }]);

    [rootOrg] = await mocks.createRandomOrganizations(1, () => ({ status: "ROOT" }));
    [superadmin] = await mocks.createRandomUsers(rootOrg.id, 1);
    const [userGroup] = await mocks.createUserGroups(1, rootOrg.id, [
      { name: "SUPERADMIN", effect: "GRANT" },
    ]);
    await mocks.insertUserGroupMembers(userGroup.id, [superadmin.id]);
    ({ apiKey: superadminApiKey } = await mocks.createUserAuthToken("token", superadmin.id));

    [userTemplate] = await mocks.createRandomTemplates(organization.id, user.id, 1);
    [rootOrgTemplate] = await mocks.createRandomTemplates(rootOrg.id, superadmin.id, 1);

    dashboards = await mocks.knex
      .from("dashboard")
      .insert([
        { org_id: organization.id, name: "Dashboard 1", position: 0 },
        { org_id: organization.id, name: "Dashboard 2", position: 1 },
      ])
      .returning("*");

    modules = await mocks.knex
      .from("dashboard_module")
      .insert([
        {
          dashboard_id: dashboards[0].id,
          position: 0,
          type: "CREATE_PETITION_BUTTON",
          size: "SMALL",
          title: "Create petition",
          settings: JSON.stringify({
            template_id: userTemplate.id,
            label: "KYC",
          }),
        },
        {
          dashboard_id: dashboards[0].id,
          position: 1,
          type: "PETITIONS_NUMBER",
          size: "LARGE",
          title: "Total closed petitions",
          settings: JSON.stringify({}),
        },
        {
          dashboard_id: dashboards[1].id,
          position: 0,
          type: "PROFILES_RATIO",
          size: "MEDIUM",
          title: "Open profiles percentage",
          settings: JSON.stringify({}),
        },
        {
          dashboard_id: dashboards[1].id,
          position: 1,
          type: "PROFILES_PIE_CHART",
          size: "LARGE",
          title: "Profiles by status",
          settings: JSON.stringify({}),
        },
        {
          dashboard_id: dashboards[1].id,
          position: 2,
          type: "PETITIONS_NUMBER",
          size: "LARGE",
          title: "Petitions",
          settings: JSON.stringify({}),
        },
        {
          dashboard_id: dashboards[1].id,
          position: 3,
          type: "PROFILES_PIE_CHART",
          size: "LARGE",
          title: "Profiles by status",
          settings: JSON.stringify({}),
        },
      ])
      .returning("*");

    [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
    [numberProfileTypeField, shortTextProfileTypeField] = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileType.id,
      2,
      (i) => ({ type: ["NUMBER", "SHORT_TEXT"][i] as ProfileTypeFieldType }),
    );

    [rootOrgProfileType] = await mocks.createRandomProfileTypes(rootOrg.id, 1);
    [rootOrgProfileTypeField] = await mocks.createRandomProfileTypeFields(
      rootOrg.id,
      rootOrgProfileType.id,
      1,
      () => ({ type: "SHORT_TEXT" }),
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  afterEach(async () => {
    await mocks.knex.from("task").where("name", "DASHBOARD_REFRESH").delete();
    await mocks.knex.from("dashboard").update({
      is_refreshing: false,
      last_refresh_at: null,
    });

    await mocks.knex.from("dashboard_module").delete();
    modules = await mocks.knex
      .from("dashboard_module")
      .insert([
        {
          dashboard_id: dashboards[0].id,
          position: 0,
          type: "CREATE_PETITION_BUTTON",
          size: "SMALL",
          title: "Create petition",
          settings: JSON.stringify({
            template_id: userTemplate.id,
            label: "KYC",
          }),
        },
        {
          dashboard_id: dashboards[0].id,
          position: 1,
          type: "PETITIONS_NUMBER",
          size: "LARGE",
          title: "Total closed petitions",
          settings: JSON.stringify({}),
        },
        {
          dashboard_id: dashboards[1].id,
          position: 0,
          type: "PROFILES_RATIO",
          size: "MEDIUM",
          title: "Open profiles percentage",
          settings: JSON.stringify({}),
        },
        {
          dashboard_id: dashboards[1].id,
          position: 1,
          type: "PROFILES_PIE_CHART",
          size: "LARGE",
          title: "Profiles by status",
          settings: JSON.stringify({}),
        },
        {
          dashboard_id: dashboards[1].id,
          position: 2,
          type: "PETITIONS_NUMBER",
          size: "LARGE",
          title: "Petitions",
          settings: JSON.stringify({}),
        },
        {
          dashboard_id: dashboards[1].id,
          position: 3,
          type: "PROFILES_PIE_CHART",
          size: "LARGE",
          title: "Profiles by status",
          settings: JSON.stringify({}),
        },
      ])
      .returning("*");
  });

  describe("me.dashboards", () => {
    it("queries every available dashboard for the user, without triggering refreshes", async () => {
      const { errors, data } = await testClient.execute(gql`
        query {
          me {
            dashboards {
              id
              isDefault
              isRefreshing
              lastRefreshAt
              modules {
                __typename
                id
                size
                title
              }
            }
          }
        }
      `);

      expect(errors).toBeUndefined();
      expect(data?.me).toEqual({
        dashboards: [
          {
            id: toGlobalId("Dashboard", dashboards[0].id),
            isDefault: false,
            isRefreshing: false,
            lastRefreshAt: null,
            modules: [
              {
                __typename: "DashboardCreatePetitionButtonModule",
                id: toGlobalId("DashboardModule", modules[0].id),
                size: "SMALL",
                title: "Create petition",
              },
              {
                __typename: "DashboardPetitionsNumberModule",
                id: toGlobalId("DashboardModule", modules[1].id),
                size: "LARGE",
                title: "Total closed petitions",
              },
            ],
          },
          {
            id: toGlobalId("Dashboard", dashboards[1].id),
            isDefault: false,
            isRefreshing: false,
            lastRefreshAt: null,
            modules: [
              {
                __typename: "DashboardProfilesRatioModule",
                id: toGlobalId("DashboardModule", modules[2].id),
                size: "MEDIUM",
                title: "Open profiles percentage",
              },
              {
                __typename: "DashboardProfilesPieChartModule",
                id: toGlobalId("DashboardModule", modules[3].id),
                size: "LARGE",
                title: "Profiles by status",
              },
              {
                __typename: "DashboardPetitionsNumberModule",
                id: toGlobalId("DashboardModule", modules[4].id),
                size: "LARGE",
                title: "Petitions",
              },
              {
                __typename: "DashboardProfilesPieChartModule",
                id: toGlobalId("DashboardModule", modules[5].id),
                size: "LARGE",
                title: "Profiles by status",
              },
            ],
          },
        ],
      });

      const dbTasks = await mocks.knex.from("task").where("name", "DASHBOARD_REFRESH").select("*");
      expect(dbTasks).toHaveLength(0);
    });
  });

  describe("dashboard", () => {
    it("queries a dashboard with its modules without triggering refresh", async () => {
      await mocks.knex
        .from("dashboard")
        .where("id", dashboards[0].id)
        .update({ last_refresh_at: new Date() });
      await mocks.knex
        .from("dashboard_module")
        .where("dashboard_id", dashboards[0].id)
        .whereNot("type", "CREATE_PETITION_BUTTON")
        .update({
          result: JSON.stringify({}), // only matter to be non-null
        });

      const { errors, data } = await testClient.execute(
        gql`
          query ($id: GID!) {
            dashboard(id: $id) {
              id
              isRefreshing
              modules {
                id
              }
            }
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[0].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.dashboard).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        isRefreshing: false,
        modules: [
          { id: toGlobalId("DashboardModule", modules[0].id) },
          { id: toGlobalId("DashboardModule", modules[1].id) },
        ],
      });

      const dbTask = await mocks.knex.from("task").where("name", "DASHBOARD_REFRESH").select("*");
      expect(dbTask).toHaveLength(0);
    });

    it("triggers a refresh if last_refresh_at is null", async () => {
      await mocks.knex
        .from("dashboard_module")
        .where("dashboard_id", dashboards[0].id)
        .whereNot("type", "CREATE_PETITION_BUTTON")
        .update({
          result: JSON.stringify({}), // only matter to be non-null
        });

      const { errors, data } = await testClient.execute(
        gql`
          query ($id: GID!) {
            dashboard(id: $id) {
              id
              isRefreshing
            }
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[0].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.dashboard).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        isRefreshing: true,
      });

      const dbTask = await mocks.knex.from("task").where("name", "DASHBOARD_REFRESH").select("*");
      expect(dbTask).toHaveLength(1);
    });

    it("triggers a refresh if last_refresh_at is older than 30 minutes", async () => {
      await mocks.knex
        .from("dashboard")
        .where("id", dashboards[0].id)
        .update({ last_refresh_at: subMinutes(new Date(), 31) });
      await mocks.knex
        .from("dashboard_module")
        .where("dashboard_id", dashboards[0].id)
        .whereNot("type", "CREATE_PETITION_BUTTON")
        .update({
          result: JSON.stringify({}), // only matter to be non-null
        });

      const { errors, data } = await testClient.execute(
        gql`
          query ($id: GID!) {
            dashboard(id: $id) {
              id
              isRefreshing
            }
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[0].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.dashboard).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        isRefreshing: true,
      });

      const dbTask = await mocks.knex.from("task").where("name", "DASHBOARD_REFRESH").select("*");
      expect(dbTask).toHaveLength(1);
    });

    it("triggers a refresh if last_refresh_at is not older than 30 minutes but any of the modules have null results", async () => {
      await mocks.knex
        .from("dashboard")
        .where("id", dashboards[0].id)
        .update({ last_refresh_at: new Date() });
      await mocks.knex
        .from("dashboard_module")
        .where("dashboard_id", dashboards[0].id)
        .whereNot("type", "CREATE_PETITION_BUTTON")
        .update({
          result: null,
        });

      const { errors, data } = await testClient.execute(
        gql`
          query ($id: GID!) {
            dashboard(id: $id) {
              id
              isRefreshing
            }
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[0].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.dashboard).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        isRefreshing: true,
      });

      const dbTask = await mocks.knex.from("task").where("name", "DASHBOARD_REFRESH").select("*");
      expect(dbTask).toHaveLength(1);
    });
  });

  describe("adminCreateDashboard", () => {
    it("creates an empty dashboard in last position", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation ($orgId: GID!, $name: String!) {
            adminCreateDashboard(orgId: $orgId, name: $name) {
              id
              name
            }
          }
        `,
        {
          orgId: toGlobalId("Organization", organization.id),
          name: "Dashboard 3",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.adminCreateDashboard).toEqual({
        id: expect.any(String),
        name: "Dashboard 3",
      });

      const { errors: queryErrors, data: queryData } = await testClient.execute(gql`
        query {
          me {
            dashboards {
              id
            }
          }
        }
      `);

      expect(queryErrors).toBeUndefined();
      expect(queryData?.me.dashboards).toEqual([
        { id: toGlobalId("Dashboard", dashboards[0].id) },
        { id: toGlobalId("Dashboard", dashboards[1].id) },
        { id: data?.adminCreateDashboard.id },
      ]);
    });

    it("sends error if normal user tries to create a dashboard", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($orgId: GID!, $name: String!) {
            adminCreateDashboard(orgId: $orgId, name: $name) {
              id
              name
            }
          }
        `,
        {
          orgId: toGlobalId("Organization", organization.id),
          name: "Dashboard X",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createCreatePetitionButtonDashboardModule", () => {
    it("creates a CREATE_PETITION_BUTTON module", async () => {
      const [template] = await mocks.createRandomTemplates(organization.id, user.id, 1);
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: CreatePetitionButtonDashboardModuleSettingsInput!
          ) {
            createCreatePetitionButtonDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                __typename
                id
                ... on DashboardCreatePetitionButtonModule {
                  settings {
                    template {
                      id
                    }
                    label
                  }
                }
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "KYC",
          size: "SMALL",
          settings: {
            templateId: toGlobalId("Petition", template.id),
            buttonLabel: "Start KYC...",
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createCreatePetitionButtonDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        modules: [
          {
            __typename: "DashboardCreatePetitionButtonModule",
            id: toGlobalId("DashboardModule", modules[0].id),
            settings: {
              label: "KYC",
              template: {
                id: toGlobalId("Petition", userTemplate.id),
              },
            },
          },
          {
            __typename: "DashboardPetitionsNumberModule",
            id: toGlobalId("DashboardModule", modules[1].id),
          },
          {
            __typename: "DashboardCreatePetitionButtonModule",
            id: expect.any(String),
            settings: {
              label: "Start KYC...",
              template: {
                id: toGlobalId("Petition", template.id),
              },
            },
          },
        ],
      });
    });

    it("sends error if templateId does not belong to same org as dashboard", async () => {
      const [template] = await mocks.createRandomTemplates(rootOrg.id, superadmin.id, 1);
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: CreatePetitionButtonDashboardModuleSettingsInput!
          ) {
            createCreatePetitionButtonDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                __typename
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "KYC",
          size: "SMALL",
          settings: {
            templateId: toGlobalId("Petition", template.id),
            buttonLabel: "Start KYC...",
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createPetitionsNumberDashboardModule", () => {
    it("creates a PETITIONS_NUMBER module with every filter", async () => {
      const [template] = await mocks.createRandomTemplates(organization.id, user.id);
      const [tag] = await mocks.createRandomTags(organization.id, 1);
      const [userGroup] = await mocks.createUserGroups(1, organization.id);

      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsNumberDashboardModuleSettingsInput!
          ) {
            createPetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              fromTemplateId: toGlobalId("Petition", template.id),
              locale: "es",
              path: "/",
              status: ["DRAFT", "COMPLETED"],
              signature: ["NO_SIGNATURE"],
              tags: {
                operator: "AND",
                filters: [{ operator: "CONTAINS", value: [toGlobalId("Tag", tag.id)] }],
              },
              sharedWith: {
                operator: "AND",
                filters: [
                  { operator: "SHARED_WITH", value: toGlobalId("UserGroup", userGroup.id) },
                  { operator: "IS_OWNER", value: toGlobalId("User", user.id) },
                ],
              },
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionsNumberDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        modules: [
          {
            id: toGlobalId("DashboardModule", modules[0].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[1].id),
          },
          {
            id: expect.any(String),
          },
        ],
      });
    });

    it("sends error if fromTemplateId in filters does not belong to same org as dashboard", async () => {
      const [template] = await mocks.createRandomTemplates(rootOrg.id, superadmin.id);
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsNumberDashboardModuleSettingsInput!
          ) {
            createPetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              fromTemplateId: toGlobalId("Petition", template.id),
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters.fromTemplateId",
        message: "Template not found",
      });
      expect(data).toBeNull();
    });

    it("sends error if tags in filters does not belong to same org as dashboard", async () => {
      const [tag] = await mocks.createRandomTags(rootOrg.id, 1);

      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsNumberDashboardModuleSettingsInput!
          ) {
            createPetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              tags: {
                operator: "AND",
                filters: [{ operator: "CONTAINS", value: [toGlobalId("Tag", tag.id)] }],
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters.tags.filters[0].value",
        message: "Tags not found",
      });
      expect(data).toBeNull();
    });

    it("sends error if tags filter operator is IS_EMPTY but values are passed", async () => {
      const [tag] = await mocks.createRandomTags(rootOrg.id, 1);
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsNumberDashboardModuleSettingsInput!
          ) {
            createPetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              tags: {
                operator: "AND",
                filters: [{ operator: "IS_EMPTY", value: [toGlobalId("Tag", tag.id)] }],
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters.tags.filters[0].value",
        message: "Must be empty",
      });
      expect(data).toBeNull();
    });

    it("sends error if tags filter operator is CONTAINS but no values are passed", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsNumberDashboardModuleSettingsInput!
          ) {
            createPetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              tags: {
                operator: "AND",
                filters: [{ operator: "CONTAINS", value: [] }],
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters.tags.filters[0].value",
        message: "A maximum of 10 tags is allowed in each filter line",
      });
      expect(data).toBeNull();
    });

    it("sends error if passing more than 5 tags filter", async () => {
      const [tag] = await mocks.createRandomTags(rootOrg.id, 1);

      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsNumberDashboardModuleSettingsInput!
          ) {
            createPetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              tags: {
                operator: "AND",
                filters: [
                  { operator: "IS_EMPTY", value: [] },
                  { operator: "CONTAINS", value: [toGlobalId("Tag", tag.id)] },
                  { operator: "CONTAINS", value: [toGlobalId("Tag", tag.id)] },
                  { operator: "CONTAINS", value: [toGlobalId("Tag", tag.id)] },
                  { operator: "CONTAINS", value: [toGlobalId("Tag", tag.id)] },
                  { operator: "CONTAINS", value: [toGlobalId("Tag", tag.id)] },
                ],
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters.tags.filters",
        message: "A maximum of 5 filter lines is allowed",
      });
      expect(data).toBeNull();
    });

    it("sends error if sharedWith users in filters does not belong to same org as dashboard", async () => {
      const [userGroup] = await mocks.createUserGroups(1, rootOrg.id);

      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsNumberDashboardModuleSettingsInput!
          ) {
            createPetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              sharedWith: {
                operator: "AND",
                filters: [
                  { operator: "SHARED_WITH", value: toGlobalId("UserGroup", userGroup.id) },
                ],
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters.sharedWith.filters[0].value",
        message: "User group not found",
      });
      expect(data).toBeNull();
    });

    it("sends error if passing more than 5 sharedWith filters", async () => {
      const [userGroup] = await mocks.createUserGroups(1, organization.id);
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsNumberDashboardModuleSettingsInput!
          ) {
            createPetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              sharedWith: {
                operator: "AND",
                filters: [
                  { operator: "SHARED_WITH", value: toGlobalId("UserGroup", userGroup.id) },
                  { operator: "IS_OWNER", value: toGlobalId("User", user.id) },
                  { operator: "SHARED_WITH", value: toGlobalId("User", user.id) },
                  { operator: "SHARED_WITH", value: toGlobalId("User", user.id) },
                  { operator: "SHARED_WITH", value: toGlobalId("User", user.id) },
                  { operator: "SHARED_WITH", value: toGlobalId("User", user.id) },
                ],
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters.sharedWith.filters",
        message: "A maximum of 5 filter lines is allowed",
      });
      expect(data).toBeNull();
    });

    it("sends error if one of the sharedWith filters is not a User or UserGroup", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsNumberDashboardModuleSettingsInput!
          ) {
            createPetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              sharedWith: {
                operator: "AND",
                filters: [
                  { operator: "SHARED_WITH", value: toGlobalId("User", user.id) },
                  { operator: "SHARED_WITH", value: toGlobalId("ProfileType", profileType.id) },
                ],
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters.sharedWith.filters[1].value",
        message: "Must be a user or user group",
      });
      expect(data).toBeNull();
    });

    it("sends error if one of the sharedWith filters user does not belong to the same organization as the dashboard", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsNumberDashboardModuleSettingsInput!
          ) {
            createPetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              sharedWith: {
                operator: "AND",
                filters: [{ operator: "SHARED_WITH", value: toGlobalId("User", superadmin.id) }],
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters.sharedWith.filters[0].value",
        message: "User not found",
      });
      expect(data).toBeNull();
    });
  });

  describe("createPetitionsRatioDashboardModule", () => {
    it("creates a PETITIONS_RATIO module", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsRatioDashboardModuleSettingsInput!
          ) {
            createPetitionsRatioDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Ratio of petitions",
          size: "SMALL",
          settings: {
            graphicType: "RATIO",
            filters: [
              { status: ["DRAFT", "PENDING"] },
              { status: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"] },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionsRatioDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        modules: [
          {
            id: toGlobalId("DashboardModule", modules[0].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[1].id),
          },
          {
            id: expect.any(String),
          },
        ],
      });
    });

    it("sends error if fromTemplateId does not belong to same org as dashboard", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsRatioDashboardModuleSettingsInput!
          ) {
            createPetitionsRatioDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Ratio of petitions",
          size: "SMALL",
          settings: {
            graphicType: "RATIO",
            filters: [
              {
                status: ["DRAFT", "PENDING"],
                fromTemplateId: toGlobalId("Petition", rootOrgTemplate.id),
              },
              { status: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"] },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters[0].fromTemplateId",
        message: "Template not found",
      });
      expect(data).toBeNull();
    });
  });

  describe("createPetitionsPieChartDashboardModule", () => {
    it("creates a PETITIONS_PIE_CHART module", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsPieChartDashboardModuleSettingsInput!
          ) {
            createPetitionsPieChartDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Pie chart of petitions",
          size: "LARGE",
          settings: {
            graphicType: "DOUGHNUT",
            items: [
              { label: "Draft", color: "#00FF00", filter: { status: ["DRAFT"] } },
              { label: "Completed", color: "#FF0000", filter: { status: ["COMPLETED"] } },
              { label: "Closed", color: "#0000FF", filter: { status: ["CLOSED"] } },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionsPieChartDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        modules: [
          {
            id: toGlobalId("DashboardModule", modules[0].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[1].id),
          },
          {
            id: expect.any(String),
          },
        ],
      });
    });

    it("sends error if passing no filters", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsPieChartDashboardModuleSettingsInput!
          ) {
            createPetitionsPieChartDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Pie chart of petitions",
          size: "LARGE",
          settings: {
            graphicType: "DOUGHNUT",
            items: [],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.items",
        message: "At least 1 filter is required",
      });
      expect(data).toBeNull();
    });

    it("sends error if passing invalid color value", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: PetitionsPieChartDashboardModuleSettingsInput!
          ) {
            createPetitionsPieChartDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Pie chart of petitions",
          size: "LARGE",
          settings: {
            graphicType: "DOUGHNUT",
            items: [
              { label: "Draft", color: "#00FF00", filter: { status: ["DRAFT"] } },
              { label: "Completed", color: "#xxxxx", filter: { status: ["COMPLETED"] } },
              { label: "Closed", color: "#0000FF", filter: { status: ["CLOSED"] } },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.items[1].color",
        message: "Argument must represent a HEX color value.",
      });
      expect(data).toBeNull();
    });
  });

  describe("createProfilesNumberDashboardModule", () => {
    it("creates a PROFILES_NUMBER COUNT module", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesNumberDashboardModuleSettingsInput!
          ) {
            createProfilesNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of open profiles",
          size: "SMALL",
          settings: {
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            filter: {
              status: ["OPEN"],
              values: {
                logicalOperator: "AND",
                conditions: [
                  {
                    profileTypeFieldId: toGlobalId(
                      "ProfileTypeField",
                      shortTextProfileTypeField.id,
                    ),
                    operator: "EQUAL",
                    value: "Mike",
                  },
                ],
              },
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfilesNumberDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        modules: [
          {
            id: toGlobalId("DashboardModule", modules[0].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[1].id),
          },
          {
            id: expect.any(String),
          },
        ],
      });
    });

    it("sends error if profileTypeFieldId in filter.values does not correspond to profileType", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesNumberDashboardModuleSettingsInput!
          ) {
            createProfilesNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Number of open profiles",
          size: "SMALL",
          settings: {
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            filter: {
              status: ["OPEN"],
              values: {
                logicalOperator: "AND",
                conditions: [
                  {
                    profileTypeFieldId: toGlobalId("ProfileTypeField", rootOrgProfileTypeField.id),
                    operator: "EQUAL",
                    value: "Mike",
                  },
                ],
              },
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filter.values",
        message: "profileTypeFieldId is not a valid profile type field ID",
      });
      expect(data).toBeNull();
    });

    it("creates a PROFILES_NUMBER AGGREGATE module", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesNumberDashboardModuleSettingsInput!
          ) {
            createProfilesNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Total sum of numeric values",
          size: "SMALL",
          settings: {
            type: "AGGREGATE",
            aggregate: "SUM",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
            filter: {
              status: ["OPEN"],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfilesNumberDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        modules: [
          {
            id: toGlobalId("DashboardModule", modules[0].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[1].id),
          },
          {
            id: expect.any(String),
          },
        ],
      });
    });

    it("sends error if profileTypeId does not belong to same org as dashboard", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesNumberDashboardModuleSettingsInput!
          ) {
            createProfilesNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Total sum of numeric values",
          size: "SMALL",
          settings: {
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", rootOrgProfileType.id),
            filter: {
              status: ["OPEN"],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing type COUNT and aggregate or profileTypeFieldId values", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesNumberDashboardModuleSettingsInput!
          ) {
            createProfilesNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Total sum of numeric values",
          size: "SMALL",
          settings: {
            type: "COUNT",
            aggregate: "SUM",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
            filter: {
              status: ["OPEN"],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.type",
        message: "Cannot have aggregate or profileTypeFieldId when type is COUNT",
      });
      expect(data).toBeNull();
    });

    it("sends error if passing type AGGREGATE and not passing aggregate or profileTypeFieldId values", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesNumberDashboardModuleSettingsInput!
          ) {
            createProfilesNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Total sum of numeric values",
          size: "SMALL",
          settings: {
            type: "AGGREGATE",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
            filter: {
              status: ["OPEN"],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.type",
        message: "aggregate and profileTypeFieldId are required when type is AGGREGATE",
      });
      expect(data).toBeNull();
    });

    it("sends error if profileTypeFieldId is not a NUMBER when type is AGGREGATE", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesNumberDashboardModuleSettingsInput!
          ) {
            createProfilesNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Total sum of numeric values",
          size: "SMALL",
          settings: {
            type: "AGGREGATE",
            aggregate: "MIN",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", shortTextProfileTypeField.id),
            filter: {
              status: ["OPEN"],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.type",
        message: "profileTypeFieldId must be a NUMBER field when type is AGGREGATE",
      });
      expect(data).toBeNull();
    });

    it("sends error if profileTypeFieldId does not belong to profileType", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesNumberDashboardModuleSettingsInput!
          ) {
            createProfilesNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Total sum of numeric values",
          size: "SMALL",
          settings: {
            type: "AGGREGATE",
            aggregate: "MIN",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", rootOrgProfileTypeField.id),
            filter: {
              status: ["OPEN"],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing profileId or profileTypeId in filters", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesNumberDashboardModuleSettingsInput!
          ) {
            createProfilesNumberDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Total sum of numeric values",
          size: "SMALL",
          settings: {
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            filter: {
              profileTypeId: toGlobalId("ProfileType", profileType.id),
              status: ["OPEN"],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filter.profileTypeId",
        message: "Cannot be set",
      });
      expect(data).toBeNull();
    });
  });

  describe("createProfilesRatioDashboardModule", () => {
    it("creates a PROFILES_RATIO COUNT module", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesRatioDashboardModuleSettingsInput!
          ) {
            createProfilesRatioDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Ratio of profiles",
          size: "SMALL",
          settings: {
            graphicType: "RATIO",
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            filters: [{ status: ["OPEN"] }, { status: ["OPEN", "CLOSED"] }],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfilesRatioDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
      });
    });

    it("creates a PROFILES_RATIO AGGREGATE(SUM) module", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesRatioDashboardModuleSettingsInput!
          ) {
            createProfilesRatioDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Ratio of profiles",
          size: "SMALL",
          settings: {
            graphicType: "RATIO",
            type: "AGGREGATE",
            aggregate: "SUM",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
            filters: [{ status: ["OPEN"] }, { status: ["OPEN", "CLOSED"] }],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfilesRatioDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
      });
    });

    it("sends error when creating a PROFILES_RATIO AGGREGATE(AVG/MIN/MAX) module", async () => {
      for (const aggregate of ["AVG", "MIN", "MAX"]) {
        const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
          gql`
            mutation (
              $dashboardId: GID!
              $title: String!
              $size: DashboardModuleSize!
              $settings: ProfilesRatioDashboardModuleSettingsInput!
            ) {
              createProfilesRatioDashboardModule(
                dashboardId: $dashboardId
                title: $title
                size: $size
                settings: $settings
              ) {
                id
              }
            }
          `,
          {
            dashboardId: toGlobalId("Dashboard", dashboards[0].id),
            title: "Ratio of profiles",
            size: "SMALL",
            settings: {
              graphicType: "RATIO",
              type: "AGGREGATE",
              aggregate,
              profileTypeId: toGlobalId("ProfileType", profileType.id),
              profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
              filters: [{ status: ["OPEN"] }, { status: ["OPEN", "CLOSED"] }],
            },
          },
        );

        expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
          argName: "settings.aggregate",
          message: "Only SUM is allowed for aggregate when type is AGGREGATE",
        });
        expect(data).toBeNull();
      }
    });

    it("sends error if passing more or less than 2 filters", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesRatioDashboardModuleSettingsInput!
          ) {
            createProfilesRatioDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Ratio of profiles",
          size: "SMALL",
          settings: {
            graphicType: "RATIO",
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            filters: [{ status: ["OPEN"] }],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters",
        message: "Exactly 2 filters are required",
      });
      expect(data).toBeNull();
    });

    it("sends error if profileTypeId does not belong to same org as dashboard", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesRatioDashboardModuleSettingsInput!
          ) {
            createProfilesRatioDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Ratio of profiles",
          size: "SMALL",
          settings: {
            graphicType: "RATIO",
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", rootOrgProfileType.id),
            filters: [{ status: ["OPEN"] }, { status: ["OPEN", "CLOSED"] }],
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing type COUNT and aggregate or profileTypeFieldId values", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesRatioDashboardModuleSettingsInput!
          ) {
            createProfilesRatioDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Ratio of profiles",
          size: "SMALL",
          settings: {
            graphicType: "RATIO",
            type: "COUNT",
            aggregate: "SUM",
            profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            filters: [{ status: ["OPEN"] }, { status: ["OPEN", "CLOSED"] }],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.type",
        message: "Cannot have aggregate or profileTypeFieldId when type is COUNT",
      });
      expect(data).toBeNull();
    });

    it("sends error if passing type AGGREGATE and not passing aggregate or profileTypeFieldId values", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesRatioDashboardModuleSettingsInput!
          ) {
            createProfilesRatioDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Ratio of profiles",
          size: "SMALL",
          settings: {
            graphicType: "RATIO",
            type: "AGGREGATE",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            filters: [{ status: ["OPEN"] }, { status: ["OPEN", "CLOSED"] }],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.type",
        message: "aggregate and profileTypeFieldId are required when type is AGGREGATE",
      });
      expect(data).toBeNull();
    });

    it("sends error if profileTypeFieldId does not belong to profileType", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesRatioDashboardModuleSettingsInput!
          ) {
            createProfilesRatioDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Ratio of profiles",
          size: "SMALL",
          settings: {
            graphicType: "RATIO",
            type: "AGGREGATE",
            aggregate: "SUM",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", rootOrgProfileTypeField.id),
            filters: [{ status: ["OPEN"] }, { status: ["OPEN", "CLOSED"] }],
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing profileId or profileTypeId in filters", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesRatioDashboardModuleSettingsInput!
          ) {
            createProfilesRatioDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Ratio of profiles",
          size: "SMALL",
          settings: {
            graphicType: "RATIO",
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            filters: [
              { status: ["OPEN"] },
              { profileId: toGlobalId("Profile", profile.id), status: ["OPEN", "CLOSED"] },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters[1].profileId",
        message: "Cannot be set",
      });
      expect(data).toBeNull();
    });
  });

  describe("createProfilesPieChartDashboardModule", () => {
    it("creates a PROFILES_PIE_CHART COUNT module", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesPieChartDashboardModuleSettingsInput!
          ) {
            createProfilesPieChartDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Profiles pie chart",
          size: "SMALL",
          settings: {
            graphicType: "PIE",
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            items: [
              { label: "Open", color: "#00ff00", filter: { status: ["OPEN"] } },
              { label: "Closed", color: "#ff0000", filter: { status: ["CLOSED"] } },
              { label: "Deleted", color: "#0000ff", filter: { status: ["DELETION_SCHEDULED"] } },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfilesPieChartDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
      });
    });

    it("creates a PROFILES_PIE_CHART AGGREGATE module", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesPieChartDashboardModuleSettingsInput!
          ) {
            createProfilesPieChartDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Profiles pie chart",
          size: "SMALL",
          settings: {
            graphicType: "PIE",
            type: "AGGREGATE",
            aggregate: "SUM",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
            items: [
              { label: "Open", color: "#00ff00", filter: { status: ["OPEN"] } },
              { label: "Closed", color: "#ff0000", filter: { status: ["CLOSED"] } },
              { label: "Deleted", color: "#0000ff", filter: { status: ["DELETION_SCHEDULED"] } },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfilesPieChartDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
      });
    });

    it("sends error if passing no filters", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesPieChartDashboardModuleSettingsInput!
          ) {
            createProfilesPieChartDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Profiles pie chart",
          size: "SMALL",
          settings: {
            graphicType: "PIE",
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            items: [],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.items",
        message: "At least 1 item is required",
      });
      expect(data).toBeNull();
    });

    it("sends error if passing invalid color value", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesPieChartDashboardModuleSettingsInput!
          ) {
            createProfilesPieChartDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Profiles pie chart",
          size: "SMALL",
          settings: {
            graphicType: "PIE",
            type: "AGGREGATE",
            aggregate: "SUM",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
            items: [
              { label: "Open", color: "#00ff00", filter: { status: ["OPEN"] } },
              { label: "Closed", color: "#ff0000", filter: { status: ["CLOSED"] } },
              { label: "Deleted", color: "red", filter: { status: ["DELETION_SCHEDULED"] } },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.items[2].color",
        message: "Argument must represent a HEX color value.",
      });
      expect(data).toBeNull();
    });

    it("sends error if profileTypeId does not belong to same org as dashboard", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesPieChartDashboardModuleSettingsInput!
          ) {
            createProfilesPieChartDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Profiles pie chart",
          size: "SMALL",
          settings: {
            graphicType: "PIE",
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", rootOrgProfileType.id),
            items: [
              { label: "Open", color: "#00ff00", filter: { status: ["OPEN"] } },
              { label: "Closed", color: "#ff0000", filter: { status: ["CLOSED"] } },
              { label: "Deleted", color: "#0000ff", filter: { status: ["DELETION_SCHEDULED"] } },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing profileId or profileTypeId in filters", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $title: String!
            $size: DashboardModuleSize!
            $settings: ProfilesPieChartDashboardModuleSettingsInput!
          ) {
            createProfilesPieChartDashboardModule(
              dashboardId: $dashboardId
              title: $title
              size: $size
              settings: $settings
            ) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          title: "Profiles pie chart",
          size: "SMALL",
          settings: {
            graphicType: "PIE",
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            items: [
              {
                label: "Open",
                color: "#00ff00",
                filter: {
                  profileTypeId: toGlobalId("ProfileType", profileType.id),
                  status: ["OPEN"],
                },
              },
              { label: "Closed", color: "#ff0000", filter: { status: ["CLOSED"] } },
              { label: "Deleted", color: "#0000ff", filter: { status: ["DELETION_SCHEDULED"] } },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.items[0].filter.profileTypeId",
        message: "Cannot be set",
      });
      expect(data).toBeNull();
    });
  });

  describe("deleteDashboardModule", () => {
    it("deletes a module from a dashboard and updates positions of other modules", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation ($dashboardId: GID!, $moduleId: GID!) {
            deleteDashboardModule(dashboardId: $dashboardId, moduleId: $moduleId) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[1].id),
          moduleId: toGlobalId("DashboardModule", modules[3].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[1].id),
        modules: [
          {
            id: toGlobalId("DashboardModule", modules[2].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[4].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[5].id),
          },
        ],
      });

      const dbModules = await mocks.knex
        .from("dashboard_module")
        .where("dashboard_id", dashboards[1].id)
        .whereNull("deleted_at")
        .orderBy("position", "asc")
        .select("id", "position", "updated_by");

      expect(dbModules).toEqual([
        {
          id: modules[2].id,
          position: 0,
          updated_by: null,
        },
        {
          id: modules[4].id,
          position: 1,
          updated_by: `User:${superadmin.id}`,
        },
        {
          id: modules[5].id,
          position: 2,
          updated_by: `User:${superadmin.id}`,
        },
      ]);
    });

    it("sends error if non-superadmin tries to delete a module", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($dashboardId: GID!, $moduleId: GID!) {
            deleteDashboardModule(dashboardId: $dashboardId, moduleId: $moduleId) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[1].id),
          moduleId: toGlobalId("DashboardModule", modules[3].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("updateDashboardModulePositions", () => {
    it("reorders modules in dashboard, updating only modules that changed position", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation ($dashboardId: GID!, $moduleIds: [GID!]!) {
            updateDashboardModulePositions(dashboardId: $dashboardId, moduleIds: $moduleIds) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[1].id),
          moduleIds: [
            toGlobalId("DashboardModule", modules[2].id),
            toGlobalId("DashboardModule", modules[4].id),
            toGlobalId("DashboardModule", modules[3].id),
            toGlobalId("DashboardModule", modules[5].id),
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateDashboardModulePositions).toEqual({
        id: toGlobalId("Dashboard", dashboards[1].id),
        modules: [
          {
            id: toGlobalId("DashboardModule", modules[2].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[4].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[3].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[5].id),
          },
        ],
      });

      const dbModules = await mocks.knex
        .from("dashboard_module")
        .where("dashboard_id", dashboards[1].id)
        .whereNull("deleted_at")
        .orderBy("position", "asc")
        .select("id", "position", "updated_by");

      expect(dbModules).toEqual([
        {
          id: modules[2].id,
          position: 0,
          updated_by: null,
        },
        {
          id: modules[4].id,
          position: 1,
          updated_by: `User:${superadmin.id}`,
        },
        {
          id: modules[3].id,
          position: 2,
          updated_by: `User:${superadmin.id}`,
        },
        {
          id: modules[5].id,
          position: 3,
          updated_by: null,
        },
      ]);
    });

    it("sends error if passing invalid or incomplete moduleIds", async () => {
      const { errors, data } = await testClient.withApiKey(superadminApiKey).execute(
        gql`
          mutation ($dashboardId: GID!, $moduleIds: [GID!]!) {
            updateDashboardModulePositions(dashboardId: $dashboardId, moduleIds: $moduleIds) {
              id
              modules {
                id
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[1].id),
          moduleIds: [
            toGlobalId("DashboardModule", modules[2].id),
            toGlobalId("DashboardModule", modules[4].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
