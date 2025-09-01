import { subMinutes } from "date-fns";
import { gql } from "graphql-request";
import { Knex } from "knex";
import { pick, shuffle } from "remeda";
import {
  CreateDashboardModule,
  Dashboard,
  DashboardModule,
  DashboardPermission,
  Organization,
  Petition,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldType,
  User,
  UserGroup,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

function modulesBuilder(dashboards: Dashboard[], templateId: number): CreateDashboardModule[] {
  return [
    {
      dashboard_id: dashboards[0].id,
      position: 0,
      type: "CREATE_PETITION_BUTTON",
      size: "SMALL",
      title: "Create petition",
      settings: JSON.stringify({
        template_id: templateId,
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
    {
      dashboard_id: dashboards[1].id,
      position: 4,
      type: "PETITIONS_RATIO",
      size: "SMALL",
      title: "Petitions ratio",
      settings: JSON.stringify({}),
    },
    {
      dashboard_id: dashboards[1].id,
      position: 5,
      type: "PETITIONS_PIE_CHART",
      size: "SMALL",
      title: "Petitions pie chart",
      settings: JSON.stringify({}),
    },
    {
      dashboard_id: dashboards[1].id,
      position: 6,
      type: "PROFILES_NUMBER",
      size: "SMALL",
      title: "Profiles number",
      settings: JSON.stringify({}),
    },
    {
      dashboard_id: dashboards[2].id,
      position: 0,
      type: "PETITIONS_RATIO",
      size: "SMALL",
      title: "Petitions ratio",
      settings: JSON.stringify({}),
    },
    {
      dashboard_id: dashboards[2].id,
      position: 1,
      type: "PETITIONS_PIE_CHART",
      size: "SMALL",
      title: "Petitions pie chart",
      settings: JSON.stringify({}),
    },
    {
      dashboard_id: dashboards[2].id,
      position: 2,
      type: "PROFILES_NUMBER",
      size: "SMALL",
      title: "Profiles number",
      settings: JSON.stringify({}),
    },
  ];
}

describe("GraphQL / Dashboards", () => {
  let testClient: TestClient;
  let user: User;
  let organization: Organization;

  let noPermissionsApiKey: string;
  let mocks: Mocks;

  let dashboards: Dashboard[];
  let modules: DashboardModule[];

  let profileType: ProfileType;
  let shortTextProfileTypeField: ProfileTypeField;
  let numberProfileTypeField: ProfileTypeField;
  let riskSelectProfileTypeField: ProfileTypeField;
  let countrySelectProfileTypeField: ProfileTypeField;

  let userTemplate: Petition;

  let otherOrg: Organization;
  let otherUser: User;
  let otherTemplate: Petition;

  let otherProfileType: ProfileType;
  let otherProfileTypeField: ProfileTypeField;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([{ name: "DASHBOARDS", default_value: true }]);

    const [userGroup] = await mocks.createUserGroups(1, organization.id, [
      { name: "DASHBOARDS:LIST_DASHBOARDS", effect: "GRANT" },
      { name: "DASHBOARDS:CREATE_DASHBOARDS", effect: "GRANT" },
    ]);
    await mocks.insertUserGroupMembers(userGroup.id, [user.id]);

    const [userNoPermission] = await mocks.createRandomUsers(organization.id, 1);
    ({ apiKey: noPermissionsApiKey } = await mocks.createUserAuthToken(
      "no-permission",
      userNoPermission.id,
    ));

    [userTemplate] = await mocks.createRandomTemplates(organization.id, user.id, 1);

    [otherOrg] = await mocks.createRandomOrganizations(1);
    [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);
    [otherTemplate] = await mocks.createRandomTemplates(otherOrg.id, otherUser.id, 1);

    dashboards = await mocks.knex
      .from("dashboard")
      .insert([
        { org_id: organization.id, name: "Dashboard 1" },
        { org_id: organization.id, name: "Dashboard 2" },
        { org_id: organization.id, name: "Dashboard 3" },
        { org_id: organization.id, name: "Dashboard 4" },
        { org_id: organization.id, name: "Dashboard 5" },
      ])
      .returning("*");

    await mocks.knex.from("dashboard_permission").insert([
      {
        dashboard_id: dashboards[0].id,
        user_id: user.id,
        type: "OWNER",
      },
      {
        dashboard_id: dashboards[0].id,
        user_group_id: userGroup.id,
        type: "READ",
      },
      {
        dashboard_id: dashboards[1].id,
        user_id: user.id,
        type: "READ",
      },
      {
        dashboard_id: dashboards[1].id,
        user_group_id: userGroup.id,
        type: "WRITE",
      },
      {
        dashboard_id: dashboards[2].id,
        user_id: user.id,
        type: "READ",
      },
      {
        dashboard_id: dashboards[3].id,
        user_id: userNoPermission.id,
        type: "READ",
      },
    ]);

    modules = await mocks.knex
      .from("dashboard_module")
      .insert(modulesBuilder(dashboards, userTemplate.id))
      .returning("*");

    [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
    [
      numberProfileTypeField,
      shortTextProfileTypeField,
      riskSelectProfileTypeField,
      countrySelectProfileTypeField,
    ] = await mocks.createRandomProfileTypeFields(organization.id, profileType.id, 4, (i) => ({
      type: ["NUMBER", "SHORT_TEXT", "SELECT", "SELECT"][i] as ProfileTypeFieldType,
      options:
        i === 2
          ? {
              values: [
                { label: { en: "High", es: "Alto" }, value: "HIGH", color: "#ff0000" },
                { label: { en: "Medium", es: "Medio" }, value: "MEDIUM", color: "#00ff00" },
                { label: { en: "Low", es: "Bajo" }, value: "LOW", color: "#0000ff" },
              ],
              showOptionsWithColors: true,
            }
          : i === 3
            ? { standardList: "COUNTRIES" }
            : {},
    }));

    [otherProfileType] = await mocks.createRandomProfileTypes(otherOrg.id, 1);
    [otherProfileTypeField] = await mocks.createRandomProfileTypeFields(
      otherOrg.id,
      otherProfileType.id,
      1,
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
      .insert(modulesBuilder(dashboards, userTemplate.id))
      .returning("*");

    await mocks.knex
      .from("user")
      .where("id", user.id)
      .update({ preferences: JSON.stringify({}) });
  });

  describe("dashboards", () => {
    it("queries every available dashboard for the user, without triggering refreshes", async () => {
      const { errors, data } = await testClient.execute(gql`
        query {
          me {
            dashboards {
              id
              myEffectivePermission
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
            myEffectivePermission: "OWNER",
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
            myEffectivePermission: "WRITE",
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
              {
                __typename: "DashboardPetitionsRatioModule",
                id: toGlobalId("DashboardModule", modules[6].id),
                size: "SMALL",
                title: "Petitions ratio",
              },
              {
                __typename: "DashboardPetitionsPieChartModule",
                id: toGlobalId("DashboardModule", modules[7].id),
                size: "SMALL",
                title: "Petitions pie chart",
              },
              {
                __typename: "DashboardProfilesNumberModule",
                id: toGlobalId("DashboardModule", modules[8].id),
                size: "SMALL",
                title: "Profiles number",
              },
            ],
          },
          {
            id: toGlobalId("Dashboard", dashboards[2].id),
            myEffectivePermission: "READ",
            isRefreshing: false,
            lastRefreshAt: null,
            modules: [
              {
                __typename: "DashboardPetitionsRatioModule",
                id: toGlobalId("DashboardModule", modules[9].id),
                size: "SMALL",
                title: "Petitions ratio",
              },
              {
                __typename: "DashboardPetitionsPieChartModule",
                id: toGlobalId("DashboardModule", modules[10].id),
                size: "SMALL",
                title: "Petitions pie chart",
              },
              {
                __typename: "DashboardProfilesNumberModule",
                id: toGlobalId("DashboardModule", modules[11].id),
                size: "SMALL",
                title: "Profiles number",
              },
            ],
          },
        ],
      });

      const dbTasks = await mocks.knex.from("task").where("name", "DASHBOARD_REFRESH").select("*");
      expect(dbTasks).toHaveLength(0);
    });

    it("returns user dashboards with custom order preferences", async () => {
      await mocks.knex
        .from("user")
        .where("id", user.id)
        .update({
          preferences: JSON.stringify({
            DASHBOARDS: {
              tab_order: [dashboards[1].id, dashboards[0].id],
            },
          }),
        });

      const { errors, data } = await testClient.execute(gql`
        query {
          me {
            dashboards {
              id
            }
          }
        }
      `);

      expect(errors).toBeUndefined();
      expect(data?.me).toEqual({
        dashboards: [
          {
            id: toGlobalId("Dashboard", dashboards[1].id),
          },
          {
            id: toGlobalId("Dashboard", dashboards[0].id),
          },
          {
            id: toGlobalId("Dashboard", dashboards[2].id),
          },
        ],
      });
    });

    it("does not return dashboards list if user does not have DASHBOARDS:LIST_DASHBOARDS permission", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(gql`
        query {
          me {
            dashboards {
              id
            }
          }
        }
      `);

      expect(errors).toBeUndefined();
      expect(data?.me).toEqual({
        dashboards: [],
      });
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
              myEffectivePermission
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
        myEffectivePermission: "OWNER",
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

  describe("createDashboard", () => {
    it("creates an empty dashboard in last position", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($name: String!) {
            createDashboard(name: $name) {
              id
              name
            }
          }
        `,
        {
          name: "Dashboard 4",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createDashboard).toEqual({
        id: expect.any(String),
        name: "Dashboard 4",
      });

      const { errors: queryErrors, data: queryData } = await testClient.execute(gql`
        query {
          me {
            dashboards {
              id
              myEffectivePermission
            }
          }
        }
      `);

      expect(queryErrors).toBeUndefined();
      expect(queryData?.me.dashboards).toEqual([
        { id: toGlobalId("Dashboard", dashboards[0].id), myEffectivePermission: "OWNER" },
        { id: toGlobalId("Dashboard", dashboards[1].id), myEffectivePermission: "WRITE" },
        { id: toGlobalId("Dashboard", dashboards[2].id), myEffectivePermission: "READ" },
        { id: data?.createDashboard.id, myEffectivePermission: "OWNER" },
      ]);
    });

    it("sends error if user without permission tries to create a dashboard", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
        gql`
          mutation ($name: String!) {
            createDashboard(name: $name) {
              id
              name
            }
          }
        `,
        {
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
      const { errors, data } = await testClient.execute(
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

    it("sends error if user does not have group permission", async () => {
      const [template] = await mocks.createRandomTemplates(organization.id, user.id, 1);
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
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

    it("sends error if user does not have WRITE permission on the dashboard", async () => {
      const [template] = await mocks.createRandomTemplates(organization.id, user.id, 1);
      const { errors, data } = await testClient.execute(
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
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[2].id),
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

    it("sends error if templateId does not belong to same org as dashboard", async () => {
      const { errors, data } = await testClient.execute(
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
            templateId: toGlobalId("Petition", otherTemplate.id),
            buttonLabel: "Start KYC...",
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user does not have any permissions on the dashboard", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
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
          dashboardId: toGlobalId("Dashboard", dashboards[3].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              locale: "es",
              path: "/",
              status: ["DRAFT", "COMPLETED"],
              signature: ["NO_SIGNATURE"],
            },
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

      const { errors, data } = await testClient.execute(
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
              approvals: {
                operator: "AND",
                filters: [
                  { operator: "STATUS", value: "APPROVED" },
                  { operator: "ASSIGNED_TO", value: toGlobalId("User", user.id) },
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
      const { errors, data } = await testClient.execute(
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
              fromTemplateId: [toGlobalId("Petition", otherTemplate.id)],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters.fromTemplateId[0]",
        message: "Template not found",
      });
      expect(data).toBeNull();
    });

    it("sends error if tags in filters does not belong to same org as dashboard", async () => {
      const [tag] = await mocks.createRandomTags(otherOrg.id, 1);

      const { errors, data } = await testClient.execute(
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
      const [tag] = await mocks.createRandomTags(otherOrg.id, 1);
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
      const [tag] = await mocks.createRandomTags(otherOrg.id, 1);

      const { errors, data } = await testClient.execute(
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
        message: "Must have between 1 and 5 filter lines",
      });
      expect(data).toBeNull();
    });

    it("sends error if sharedWith users in filters does not belong to same org as dashboard", async () => {
      const [userGroup] = await mocks.createUserGroups(1, otherOrg.id);

      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
        message: "Must have between 1 and 5 filter lines",
      });
      expect(data).toBeNull();
    });

    it("sends error if one of the sharedWith filters is not a User or UserGroup", async () => {
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
                filters: [{ operator: "SHARED_WITH", value: toGlobalId("User", otherUser.id) }],
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

    it("sends error if user does not have group permissions", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
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
              locale: "es",
              path: "/",
              status: ["DRAFT", "COMPLETED"],
              signature: ["NO_SIGNATURE"],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user does not have WRITE permissions on the dashboard", async () => {
      const { errors, data } = await testClient.execute(
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
          dashboardId: toGlobalId("Dashboard", dashboards[2].id),
          title: "Number of petitions",
          size: "SMALL",
          settings: {
            filters: {
              locale: "es",
              path: "/",
              status: ["DRAFT", "COMPLETED"],
              signature: ["NO_SIGNATURE"],
            },
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createPetitionsRatioDashboardModule", () => {
    it("creates a PETITIONS_RATIO module", async () => {
      const { errors, data } = await testClient.execute(
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

    it("sends error if user does not have group permissions", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if fromTemplateId does not belong to same org as dashboard", async () => {
      const { errors, data } = await testClient.execute(
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
                fromTemplateId: [toGlobalId("Petition", otherTemplate.id)],
              },
              { status: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"] },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.filters[0].fromTemplateId[0]",
        message: "Template not found",
      });
      expect(data).toBeNull();
    });
  });

  describe("createPetitionsPieChartDashboardModule", () => {
    it("creates a PETITIONS_PIE_CHART module", async () => {
      const { errors, data } = await testClient.execute(
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

    it("sends error if user does not have group permissions", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user does not have WRITE permissions on the dashboard", async () => {
      const { errors, data } = await testClient.execute(
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
          dashboardId: toGlobalId("Dashboard", dashboards[2].id),
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing no filters", async () => {
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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

    it("sends error if user does not have group permissions", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user does not have WRITE permissions on the dashboard", async () => {
      const { errors, data } = await testClient.execute(
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
          dashboardId: toGlobalId("Dashboard", dashboards[2].id),
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if profileTypeFieldId in filter.values does not correspond to profileType", async () => {
      const { errors, data } = await testClient.execute(
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
                    profileTypeFieldId: toGlobalId("ProfileTypeField", otherProfileTypeField.id),
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
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
            profileTypeId: toGlobalId("ProfileType", otherProfileType.id),
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
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
            profileTypeFieldId: toGlobalId("ProfileTypeField", otherProfileTypeField.id),
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
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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

    it("sends error if user does not have group permissions", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user does not have WRITE permissions on the dashboard", async () => {
      const { errors, data } = await testClient.execute(
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
          dashboardId: toGlobalId("Dashboard", dashboards[2].id),
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

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("creates a PROFILES_RATIO AGGREGATE(SUM) module", async () => {
      const { errors, data } = await testClient.execute(
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
        const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
            profileTypeId: toGlobalId("ProfileType", otherProfileType.id),
            filters: [{ status: ["OPEN"] }, { status: ["OPEN", "CLOSED"] }],
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing type COUNT and aggregate or profileTypeFieldId values", async () => {
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
            profileTypeFieldId: toGlobalId("ProfileTypeField", otherProfileTypeField.id),
            filters: [{ status: ["OPEN"] }, { status: ["OPEN", "CLOSED"] }],
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing profileId or profileTypeId in filters", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfilesPieChartDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
      });
    });

    it("sends error if trying to filter DELETION_SCHEDULED profiles", async () => {
      const { errors, data } = await testClient.execute(
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

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.items[2].filter.status",
        message: "Invalid status",
      });
      expect(data).toBeNull();
    });

    it("sends error if user does not have group permissions", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
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
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user does not have WRITE permissions on the dashboard", async () => {
      const { errors, data } = await testClient.execute(
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
          dashboardId: toGlobalId("Dashboard", dashboards[2].id),
          title: "Profiles pie chart",
          size: "SMALL",
          settings: {
            graphicType: "PIE",
            type: "COUNT",
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            items: [
              { label: "Open", color: "#00ff00", filter: { status: ["OPEN"] } },
              { label: "Closed", color: "#ff0000", filter: { status: ["CLOSED"] } },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("creates a PROFILES_PIE_CHART AGGREGATE module", async () => {
      const { errors, data } = await testClient.execute(
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
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfilesPieChartDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
      });
    });

    it("sends error if passing no items", async () => {
      const { errors, data } = await testClient.execute(
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
      const { errors, data } = await testClient.execute(
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
              { label: "Closed", color: "red", filter: { status: ["CLOSED"] } },
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

    it("sends error if profileTypeId does not belong to same org as dashboard", async () => {
      const { errors, data } = await testClient.execute(
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
            profileTypeId: toGlobalId("ProfileType", otherProfileType.id),
            items: [
              { label: "Open", color: "#00ff00", filter: { status: ["OPEN"] } },
              { label: "Closed", color: "#ff0000", filter: { status: ["CLOSED"] } },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing profileId or profileTypeId in filters", async () => {
      const { errors, data } = await testClient.execute(
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
              { label: "Open", color: "#0000ff", filter: { status: ["OPEN"] } },
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

    it("creates a pie chart based on the values of a SELECT property with custom options", async () => {
      const { errors, data } = await testClient.execute(
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
              modules {
                id
              }
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
            groupByProfileTypeFieldId: toGlobalId(
              "ProfileTypeField",
              riskSelectProfileTypeField.id,
            ),
            items: [],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfilesPieChartDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        modules: [
          { id: toGlobalId("DashboardModule", modules[0].id) },
          { id: toGlobalId("DashboardModule", modules[1].id) },
          { id: expect.any(String) },
        ],
      });
    });

    it("creates a pie chart aggregating values of NUMBER field on OPEN profiles and grouping by a SELECT property with standardList COUNTRIES", async () => {
      const { errors, data } = await testClient.execute(
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
              modules {
                id
              }
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
            profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            groupByProfileTypeFieldId: toGlobalId(
              "ProfileTypeField",
              countrySelectProfileTypeField.id,
            ),
            groupByFilter: {
              status: ["OPEN", "CLOSED"],
            },
            items: [],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfilesPieChartDashboardModule).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        modules: [
          { id: toGlobalId("DashboardModule", modules[0].id) },
          { id: toGlobalId("DashboardModule", modules[1].id) },
          { id: expect.any(String) },
        ],
      });
    });

    it("sends error if trying to group by but property is not SELECT", async () => {
      const { errors, data } = await testClient.execute(
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
              modules {
                id
              }
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
            profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            groupByProfileTypeFieldId: toGlobalId("ProfileTypeField", shortTextProfileTypeField.id),
            items: [],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.groupByProfileTypeFieldId",
        message: "Must be a SELECT field",
      });
      expect(data).toBeNull();
    });

    it("sends error if trying to group by and passing settings.items array", async () => {
      const { errors, data } = await testClient.execute(
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
              modules {
                id
              }
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
            profileTypeFieldId: toGlobalId("ProfileTypeField", numberProfileTypeField.id),
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            groupByProfileTypeFieldId: toGlobalId(
              "ProfileTypeField",
              countrySelectProfileTypeField.id,
            ),
            groupByFilter: {
              status: ["OPEN", "CLOSED"],
            },
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
              { label: "Open", color: "#0000ff", filter: { status: ["OPEN"] } },
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "settings.items",
        message: "Must be empty when groupByProfileTypeFieldId is provided",
      });
      expect(data).toBeNull();
    });
  });

  describe("updateCreatePetitionButtonDashboardModule", () => {
    it("should update create petition button module settings", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $moduleId: GID!
            $data: UpdateCreatePetitionButtonDashboardModuleInput!
          ) {
            updateCreatePetitionButtonDashboardModule(
              dashboardId: $dashboardId
              moduleId: $moduleId
              data: $data
            ) {
              id
              title
              size
              ... on DashboardCreatePetitionButtonModule {
                settings {
                  label
                  template {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          moduleId: toGlobalId("DashboardModule", modules[0].id),
          data: {
            title: "Updated Button",
            size: "MEDIUM",
            settings: {
              buttonLabel: "Create New KYC",
              templateId: toGlobalId("Petition", userTemplate.id),
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateCreatePetitionButtonDashboardModule).toEqual({
        id: toGlobalId("DashboardModule", modules[0].id),
        title: "Updated Button",
        size: "MEDIUM",
        settings: {
          label: "Create New KYC",
          template: {
            id: toGlobalId("Petition", userTemplate.id),
          },
        },
      });
    });
  });

  describe("updatePetitionsNumberDashboardModule", () => {
    it("should update petitions number module settings", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation UpdatePetitionsNumberDashboardModule(
            $dashboardId: GID!
            $moduleId: GID!
            $data: UpdatePetitionsNumberDashboardModuleInput!
          ) {
            updatePetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              moduleId: $moduleId
              data: $data
            ) {
              id
              title
              size
              ... on DashboardPetitionsNumberModule {
                settings {
                  filters {
                    status
                  }
                }
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          moduleId: toGlobalId("DashboardModule", modules[1].id),
          data: {
            title: "Updated Title",
            size: "MEDIUM",
            settings: {
              filters: {
                status: ["DRAFT", "PENDING"],
              },
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionsNumberDashboardModule).toEqual({
        id: toGlobalId("DashboardModule", modules[1].id),
        title: "Updated Title",
        size: "MEDIUM",
        settings: {
          filters: {
            status: ["DRAFT", "PENDING"],
          },
        },
      });
    });

    it("sets approvals filter", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation UpdatePetitionsNumberDashboardModule(
            $dashboardId: GID!
            $moduleId: GID!
            $data: UpdatePetitionsNumberDashboardModuleInput!
          ) {
            updatePetitionsNumberDashboardModule(
              dashboardId: $dashboardId
              moduleId: $moduleId
              data: $data
            ) {
              id
              title
              size
              ... on DashboardPetitionsNumberModule {
                settings {
                  filters {
                    approvals {
                      operator
                      filters {
                        operator
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[0].id),
          moduleId: toGlobalId("DashboardModule", modules[1].id),
          data: {
            title: "Updated Title",
            size: "MEDIUM",
            settings: {
              filters: {
                approvals: {
                  operator: "OR",
                  filters: [
                    { operator: "STATUS", value: "REJECTED" },
                    { operator: "ASSIGNED_TO", value: toGlobalId("User", user.id) },
                  ],
                },
              },
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionsNumberDashboardModule).toEqual({
        id: toGlobalId("DashboardModule", modules[1].id),
        title: "Updated Title",
        size: "MEDIUM",
        settings: {
          filters: {
            approvals: {
              operator: "OR",
              filters: [
                { operator: "STATUS", value: "REJECTED" },
                { operator: "ASSIGNED_TO", value: toGlobalId("User", user.id) },
              ],
            },
          },
        },
      });
    });
  });

  describe("updatePetitionsRatioDashboardModule", () => {
    it("should update petitions ratio module settings", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation UpdatePetitionsRatioDashboardModule(
            $dashboardId: GID!
            $moduleId: GID!
            $data: UpdatePetitionsRatioDashboardModuleInput!
          ) {
            updatePetitionsRatioDashboardModule(
              dashboardId: $dashboardId
              moduleId: $moduleId
              data: $data
            ) {
              id
              title
              size
              ... on DashboardPetitionsRatioModule {
                settings {
                  graphicType
                  filters {
                    status
                  }
                }
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[1].id),
          moduleId: toGlobalId("DashboardModule", modules[6].id),
          data: {
            title: "Updated Ratio",
            size: "MEDIUM",
            settings: {
              graphicType: "PERCENTAGE",
              filters: [{ status: ["COMPLETED"] }, { status: ["CLOSED"] }],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionsRatioDashboardModule).toEqual({
        id: toGlobalId("DashboardModule", modules[6].id),
        title: "Updated Ratio",
        size: "MEDIUM",
        settings: {
          graphicType: "PERCENTAGE",
          filters: [{ status: ["COMPLETED"] }, { status: ["CLOSED"] }],
        },
      });
    });
  });

  describe("updatePetitionsPieChartDashboardModule", () => {
    it("should update petitions pie chart module settings", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation UpdatePetitionsPieChartDashboardModule(
            $dashboardId: GID!
            $moduleId: GID!
            $data: UpdatePetitionsPieChartDashboardModuleInput!
          ) {
            updatePetitionsPieChartDashboardModule(
              dashboardId: $dashboardId
              moduleId: $moduleId
              data: $data
            ) {
              id
              title
              size
              ... on DashboardPetitionsPieChartModule {
                settings {
                  graphicType
                  items {
                    label
                    color
                    filter {
                      status
                    }
                  }
                }
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[1].id),
          moduleId: toGlobalId("DashboardModule", modules[7].id),
          data: {
            title: "Updated Pie Chart",
            size: "MEDIUM",
            settings: {
              graphicType: "DOUGHNUT",
              items: [
                {
                  label: "Open",
                  color: "#00ff00",
                  filter: { status: ["PENDING"] },
                },
                {
                  label: "Closed",
                  color: "#ff0000",
                  filter: { status: ["CLOSED"] },
                },
              ],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionsPieChartDashboardModule).toEqual({
        id: toGlobalId("DashboardModule", modules[7].id),
        title: "Updated Pie Chart",
        size: "MEDIUM",
        settings: {
          graphicType: "DOUGHNUT",
          items: [
            {
              label: "Open",
              color: "#00ff00",
              filter: { status: ["PENDING"] },
            },
            {
              label: "Closed",
              color: "#ff0000",
              filter: { status: ["CLOSED"] },
            },
          ],
        },
      });
    });
  });

  describe("updateProfilesNumberDashboardModule", () => {
    it("should update profiles number module settings", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation UpdateProfilesNumberDashboardModule(
            $dashboardId: GID!
            $moduleId: GID!
            $data: UpdateProfilesNumberDashboardModuleInput!
          ) {
            updateProfilesNumberDashboardModule(
              dashboardId: $dashboardId
              moduleId: $moduleId
              data: $data
            ) {
              id
              title
              size
              ... on DashboardProfilesNumberModule {
                settings {
                  type
                  profileTypeId
                  filters {
                    status
                  }
                }
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[1].id),
          moduleId: toGlobalId("DashboardModule", modules[8].id),
          data: {
            title: "Updated Number",
            size: "MEDIUM",
            settings: {
              type: "COUNT",
              profileTypeId: toGlobalId("ProfileType", profileType.id),
              filter: {
                status: ["OPEN", "CLOSED"],
              },
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfilesNumberDashboardModule).toEqual({
        id: toGlobalId("DashboardModule", modules[8].id),
        title: "Updated Number",
        size: "MEDIUM",
        settings: {
          type: "COUNT",
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          filters: {
            status: ["OPEN", "CLOSED"],
          },
        },
      });
    });
  });

  describe("updateProfilesRatioDashboardModule", () => {
    it("should update profiles ratio module settings", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation UpdateProfilesRatioDashboardModule(
            $dashboardId: GID!
            $moduleId: GID!
            $data: UpdateProfilesRatioDashboardModuleInput!
          ) {
            updateProfilesRatioDashboardModule(
              dashboardId: $dashboardId
              moduleId: $moduleId
              data: $data
            ) {
              id
              title
              size
              ... on DashboardProfilesRatioModule {
                settings {
                  type
                  graphicType
                  profileTypeId
                  filters {
                    status
                  }
                }
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[1].id),
          moduleId: toGlobalId("DashboardModule", modules[2].id),
          data: {
            title: "Updated Ratio",
            size: "MEDIUM",
            settings: {
              type: "COUNT",
              graphicType: "PERCENTAGE",
              profileTypeId: toGlobalId("ProfileType", profileType.id),
              filters: [{ status: ["OPEN"] }, { status: ["CLOSED"] }],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfilesRatioDashboardModule).toEqual({
        id: toGlobalId("DashboardModule", modules[2].id),
        title: "Updated Ratio",
        size: "MEDIUM",
        settings: {
          type: "COUNT",
          graphicType: "PERCENTAGE",
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          filters: [{ status: ["OPEN"] }, { status: ["CLOSED"] }],
        },
      });
    });
  });

  describe("updateProfilesPieChartDashboardModule", () => {
    it("should update profiles pie chart module settings", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation UpdateProfilesPieChartDashboardModule(
            $dashboardId: GID!
            $moduleId: GID!
            $data: UpdateProfilesPieChartDashboardModuleInput!
          ) {
            updateProfilesPieChartDashboardModule(
              dashboardId: $dashboardId
              moduleId: $moduleId
              data: $data
            ) {
              id
              title
              size
              ... on DashboardProfilesPieChartModule {
                settings {
                  type
                  graphicType
                  profileTypeId
                  items {
                    label
                    color
                    filter {
                      status
                    }
                  }
                }
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboards[1].id),
          moduleId: toGlobalId("DashboardModule", modules[3].id),
          data: {
            title: "Updated Pie Chart",
            size: "MEDIUM",
            settings: {
              type: "COUNT",
              graphicType: "PIE",
              profileTypeId: toGlobalId("ProfileType", profileType.id),
              items: [
                {
                  label: "Open",
                  color: "#00ff00",
                  filter: { status: ["OPEN"] },
                },
                {
                  label: "Closed",
                  color: "#ff0000",
                  filter: { status: ["CLOSED"] },
                },
              ],
            },
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfilesPieChartDashboardModule).toEqual({
        id: toGlobalId("DashboardModule", modules[3].id),
        title: "Updated Pie Chart",
        size: "MEDIUM",
        settings: {
          type: "COUNT",
          graphicType: "PIE",
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          items: [
            {
              label: "Open",
              color: "#00ff00",
              filter: { status: ["OPEN"] },
            },
            {
              label: "Closed",
              color: "#ff0000",
              filter: { status: ["CLOSED"] },
            },
          ],
        },
      });
    });
  });

  describe("deleteDashboardModule", () => {
    it("deletes a module from a dashboard and updates positions of other modules", async () => {
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
          {
            id: toGlobalId("DashboardModule", modules[6].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[7].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[8].id),
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
          updated_by: `User:${user.id}`,
        },
        {
          id: modules[5].id,
          position: 2,
          updated_by: `User:${user.id}`,
        },
        {
          id: modules[6].id,
          position: 3,
          updated_by: `User:${user.id}`,
        },
        {
          id: modules[7].id,
          position: 4,
          updated_by: `User:${user.id}`,
        },
        {
          id: modules[8].id,
          position: 5,
          updated_by: `User:${user.id}`,
        },
      ]);
    });

    it("sends error if user does not have group permissions", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
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

    it("sends error if user does not have WRITE permissions on the dashboard", async () => {
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
          dashboardId: toGlobalId("Dashboard", dashboards[2].id),
          moduleId: toGlobalId("DashboardModule", modules[6].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("updateDashboardModulePositions", () => {
    it("reorders modules in dashboard, updating only modules that changed position", async () => {
      const { errors, data } = await testClient.execute(
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
            toGlobalId("DashboardModule", modules[7].id),
            toGlobalId("DashboardModule", modules[6].id),
            toGlobalId("DashboardModule", modules[8].id),
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
          {
            id: toGlobalId("DashboardModule", modules[7].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[6].id),
          },
          {
            id: toGlobalId("DashboardModule", modules[8].id),
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
          updated_by: `User:${user.id}`,
        },
        {
          id: modules[3].id,
          position: 2,
          updated_by: `User:${user.id}`,
        },
        {
          id: modules[5].id,
          position: 3,
          updated_by: null,
        },
        {
          id: modules[7].id,
          position: 4,
          updated_by: `User:${user.id}`,
        },
        {
          id: modules[6].id,
          position: 5,
          updated_by: `User:${user.id}`,
        },
        {
          id: modules[8].id,
          position: 6,
          updated_by: null,
        },
      ]);
    });

    it("sends error if user does not have group permissions", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
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
            toGlobalId("DashboardModule", modules[6].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user does not have WRITE permissions on the dashboard", async () => {
      const { errors, data } = await testClient.execute(
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
          dashboardId: toGlobalId("Dashboard", dashboards[2].id),
          moduleIds: [
            toGlobalId("DashboardModule", modules[10].id),
            toGlobalId("DashboardModule", modules[11].id),
            toGlobalId("DashboardModule", modules[9].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing invalid or incomplete moduleIds", async () => {
      const { errors, data } = await testClient.execute(
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

  describe("updateDashboard", () => {
    it("updates dashboard name", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!, $name: String!) {
            updateDashboard(id: $id, name: $name) {
              id
              name
            }
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[0].id),
          name: "Updated dashboard name",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateDashboard).toEqual({
        id: toGlobalId("Dashboard", dashboards[0].id),
        name: "Updated dashboard name",
      });
    });

    it("sends error if user does not have permissions on dashboard", async () => {
      const [otherDashboard] = await mocks.knex
        .from("dashboard")
        .insert({ org_id: otherOrg.id, name: "Other dashboard", position: 0 })
        .returning("*");

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!, $name: String!) {
            updateDashboard(id: $id, name: $name) {
              id
              name
            }
          }
        `,
        {
          id: toGlobalId("Dashboard", otherDashboard.id),
          name: "Updated dashboard name",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user does not have WRITE permissions on dashboard", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!, $name: String!) {
            updateDashboard(id: $id, name: $name) {
              id
              name
            }
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[2].id),
          name: "Updated dashboard name",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("cloneDashboard", () => {
    it("clones dashboard and every module inside it", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!, $name: String!) {
            cloneDashboard(id: $id, name: $name) {
              id
              name
              myEffectivePermission
              isRefreshing
              lastRefreshAt
              modules {
                __typename
                size
                title
              }
            }
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[2].id),
          name: "Cloned dashboard",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.cloneDashboard).toEqual({
        id: expect.any(String),
        name: "Cloned dashboard",
        myEffectivePermission: "OWNER",
        isRefreshing: false,
        lastRefreshAt: null,
        modules: [
          {
            __typename: "DashboardPetitionsRatioModule",
            size: "SMALL",
            title: "Petitions ratio",
          },
          {
            __typename: "DashboardPetitionsPieChartModule",
            size: "SMALL",
            title: "Petitions pie chart",
          },
          {
            __typename: "DashboardProfilesNumberModule",
            size: "SMALL",
            title: "Profiles number",
          },
        ],
      });

      const dbPermissions = await mocks.knex
        .from("dashboard_permission")
        .where("dashboard_id", fromGlobalId(data.cloneDashboard.id).id)
        .select("*");

      expect(dbPermissions.map(pick(["user_id", "type", "deleted_at"]))).toEqual([
        { user_id: user.id, type: "OWNER", deleted_at: null },
      ]);
    });
  });

  describe("deleteDashboard", () => {
    it("deletes a dashboard and all modules inside it if user is OWNER", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!) {
            deleteDashboard(id: $id)
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[0].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteDashboard).toEqual("SUCCESS");

      const dbDashboard = await mocks.knex
        .from("dashboard")
        .where("id", dashboards[0].id)
        .select("deleted_at");

      expect(dbDashboard[0].deleted_at).not.toBeNull();

      const dbModules = await mocks.knex
        .from("dashboard_module")
        .where("dashboard_id", dashboards[0].id)
        .select("deleted_at");

      expect(dbModules).toHaveLength(2);
      for (const module of dbModules) {
        expect(module.deleted_at).not.toBeNull();
      }

      const dbPermissions = await mocks.knex
        .from("dashboard_permission")
        .where("dashboard_id", dashboards[0].id)
        .select("*");

      for (const permission of dbPermissions) {
        expect(permission.deleted_at).not.toBeNull();
      }
    });

    it("sends error if user does not have permission", async () => {
      const { errors, data } = await testClient.withApiKey(noPermissionsApiKey).execute(
        gql`
          mutation ($id: GID!) {
            deleteDashboard(id: $id)
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[1].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("only deletes dashboard permissions if user has READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!) {
            deleteDashboard(id: $id)
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[2].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteDashboard).toEqual("SUCCESS");

      const dbDashboard = await mocks.knex
        .from("dashboard")
        .where("id", dashboards[2].id)
        .select("deleted_at");

      expect(dbDashboard[0].deleted_at).toBeNull();

      const dbModules = await mocks.knex
        .from("dashboard_module")
        .where("dashboard_id", dashboards[2].id)
        .select("deleted_at");

      expect(dbModules).toHaveLength(3);
      for (const module of dbModules) {
        expect(module.deleted_at).toBeNull();
      }

      const dbPermissions = await mocks.knex
        .from("dashboard_permission")
        .where("dashboard_id", dashboards[2].id)
        .where("user_id", user.id)
        .select("*");

      for (const permission of dbPermissions) {
        expect(permission.deleted_at).not.toBeNull();
      }
    });

    it("sends error if user tries to delete a dashboard shared to them through a user group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($id: GID!) {
            deleteDashboard(id: $id)
          }
        `,
        {
          id: toGlobalId("Dashboard", dashboards[1].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createDashboardPermissions", () => {
    let dashboard: Dashboard;
    let ownerPermission: DashboardPermission;

    let users: User[];
    let userGroups: UserGroup[];

    beforeAll(async () => {
      users = await mocks.createRandomUsers(organization.id, 3);
      userGroups = await mocks.createUserGroups(3, organization.id);

      await mocks.insertUserGroupMembers(userGroups[0].id, [user.id, users[0].id]);
    });

    beforeEach(async () => {
      [dashboard] = await mocks.knex
        .from("dashboard")
        .insert({
          org_id: organization.id,
          name: "My dashboard",
        })
        .returning("*");

      [ownerPermission] = await mocks.knex.from("dashboard_permission").insert(
        {
          dashboard_id: dashboard.id,
          user_id: user.id,
          type: "OWNER",
        },
        "*",
      );
    });

    it("creates a permission for a user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $userIds: [GID!]
            $permissionType: DashboardPermissionType!
          ) {
            createDashboardPermissions(
              dashboardId: $dashboardId
              userIds: $userIds
              permissionType: $permissionType
            ) {
              id
              myEffectivePermission
              permissions {
                id
                user {
                  id
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          userIds: [toGlobalId("User", users[0].id)],
          permissionType: "READ",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createDashboardPermissions).toEqual({
        id: toGlobalId("Dashboard", dashboard.id),
        myEffectivePermission: "OWNER",
        permissions: expect.toIncludeSameMembers([
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", user.id) },
            type: "OWNER",
          },
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", users[0].id) },
            type: "READ",
          },
        ]),
      });
    });

    it("ignores duplicated ids", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $userIds: [GID!]
            $permissionType: DashboardPermissionType!
          ) {
            createDashboardPermissions(
              dashboardId: $dashboardId
              userIds: $userIds
              permissionType: $permissionType
            ) {
              id
              myEffectivePermission
              permissions {
                id
                user {
                  id
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          userIds: [
            toGlobalId("User", users[0].id),
            toGlobalId("User", users[0].id),
            toGlobalId("User", users[0].id),
          ],
          permissionType: "READ",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createDashboardPermissions).toEqual({
        id: toGlobalId("Dashboard", dashboard.id),
        myEffectivePermission: "OWNER",
        permissions: expect.toIncludeSameMembers([
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", user.id) },
            type: "OWNER",
          },
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", users[0].id) },
            type: "READ",
          },
        ]),
      });

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $userIds: [GID!]
            $permissionType: DashboardPermissionType!
          ) {
            createDashboardPermissions(
              dashboardId: $dashboardId
              userIds: $userIds
              permissionType: $permissionType
            ) {
              id
              myEffectivePermission
              permissions {
                id
                user {
                  id
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          userIds: [
            toGlobalId("User", users[0].id),
            toGlobalId("User", users[0].id),
            toGlobalId("User", users[0].id),
          ],
          permissionType: "WRITE",
        },
      );

      expect(errors2).toBeUndefined();
      expect(data2?.createDashboardPermissions).toEqual({
        id: toGlobalId("Dashboard", dashboard.id),
        myEffectivePermission: "OWNER",
        permissions: expect.toIncludeSameMembers([
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", user.id) },
            type: "OWNER",
          },
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", users[0].id) },
            type: "READ",
          },
        ]),
      });
    });

    it("creates a permission for a group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $userGroupIds: [GID!]
            $permissionType: DashboardPermissionType!
          ) {
            createDashboardPermissions(
              dashboardId: $dashboardId
              userGroupIds: $userGroupIds
              permissionType: $permissionType
            ) {
              id
              myEffectivePermission
              permissions {
                id
                user {
                  id
                }
                userGroup {
                  id
                  members {
                    user {
                      id
                    }
                  }
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          userGroupIds: [toGlobalId("UserGroup", userGroups[0].id)],
          permissionType: "WRITE",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createDashboardPermissions).toEqual({
        id: toGlobalId("Dashboard", dashboard.id),
        myEffectivePermission: "OWNER",
        permissions: expect.toIncludeSameMembers([
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", user.id) },
            userGroup: null,
            type: "OWNER",
          },
          {
            id: expect.any(String),
            user: null,
            userGroup: {
              id: toGlobalId("UserGroup", userGroups[0].id),
              members: [
                { user: { id: toGlobalId("User", user.id) } },
                { user: { id: toGlobalId("User", users[0].id) } },
              ],
            },
            type: "WRITE",
          },
        ]),
      });
    });

    it("creates permissions for multiple users and groups", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $userIds: [GID!]
            $userGroupIds: [GID!]
            $permissionType: DashboardPermissionType!
          ) {
            createDashboardPermissions(
              dashboardId: $dashboardId
              userIds: $userIds
              userGroupIds: $userGroupIds
              permissionType: $permissionType
            ) {
              id
              myEffectivePermission
              permissions {
                id
                user {
                  id
                }
                userGroup {
                  id
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          userIds: users.map((u) => toGlobalId("User", u.id)),
          userGroupIds: userGroups.map((g) => toGlobalId("UserGroup", g.id)),
          permissionType: "READ",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createDashboardPermissions).toEqual({
        id: toGlobalId("Dashboard", dashboard.id),
        myEffectivePermission: "OWNER",
        permissions: expect.toIncludeSameMembers([
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", user.id) },
            userGroup: null,
            type: "OWNER",
          },
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", users[0].id) },
            userGroup: null,
            type: "READ",
          },
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", users[1].id) },
            userGroup: null,
            type: "READ",
          },
          {
            id: expect.any(String),
            user: { id: toGlobalId("User", users[2].id) },
            userGroup: null,
            type: "READ",
          },
          {
            id: expect.any(String),
            user: null,
            userGroup: { id: toGlobalId("UserGroup", userGroups[0].id) },
            type: "READ",
          },
          {
            id: expect.any(String),
            user: null,
            userGroup: { id: toGlobalId("UserGroup", userGroups[1].id) },
            type: "READ",
          },
          {
            id: expect.any(String),
            user: null,
            userGroup: { id: toGlobalId("UserGroup", userGroups[2].id) },
            type: "READ",
          },
        ]),
      });
    });

    it("sends error if not passing userIds or userGroupIds", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($dashboardId: GID!, $permissionType: DashboardPermissionType!) {
            createDashboardPermissions(dashboardId: $dashboardId, permissionType: $permissionType) {
              id
              myEffectivePermission
              permissions {
                id
                user {
                  id
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionType: "READ",
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "userIds, userGroupIds",
        message: "Must pass at least one user or user group",
      });
      expect(data).toBeNull();
    });

    it("sends error if user is not editor of the dashboard", async () => {
      await mocks.knex
        .from("dashboard_permission")
        .where("id", ownerPermission.id)
        .update({ type: "READ" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $userIds: [GID!]
            $permissionType: DashboardPermissionType!
          ) {
            createDashboardPermissions(
              dashboardId: $dashboardId
              userIds: $userIds
              permissionType: $permissionType
            ) {
              id
              myEffectivePermission
              permissions {
                id
                user {
                  id
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          userIds: [toGlobalId("User", users[0].id)],
          permissionType: "WRITE",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to create OWNER permission", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $userIds: [GID!]
            $permissionType: DashboardPermissionType!
          ) {
            createDashboardPermissions(
              dashboardId: $dashboardId
              userIds: $userIds
              permissionType: $permissionType
            ) {
              id
              myEffectivePermission
              permissions {
                id
                user {
                  id
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          userIds: [toGlobalId("User", users[0].id)],
          permissionType: "OWNER",
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "permissionType",
        message: "Cannot create OWNER permission",
      });
      expect(data).toBeNull();
    });
  });

  describe("updateDashboardPermission", () => {
    let dashboard: Dashboard;
    let permissions: DashboardPermission[];

    let users: User[];

    let userGroups: UserGroup[];

    let user0ApiKey: string;

    beforeAll(async () => {
      users = await mocks.createRandomUsers(organization.id, 3);
      userGroups = await mocks.createUserGroups(3, organization.id, [
        { name: "DASHBOARDS:LIST_DASHBOARDS", effect: "GRANT" },
        { name: "DASHBOARDS:CREATE_DASHBOARDS", effect: "GRANT" },
      ]);

      ({ apiKey: user0ApiKey } = await mocks.createUserAuthToken("user0-apikey", users[0].id));

      await mocks.insertUserGroupMembers(userGroups[0].id, [user.id, users[0].id]);
    });

    beforeEach(async () => {
      [dashboard] = await mocks.knex
        .from("dashboard")
        .insert({
          org_id: organization.id,
          name: "My dashboard",
        })
        .returning("*");

      permissions = await mocks.knex.from("dashboard_permission").insert(
        [
          {
            dashboard_id: dashboard.id,
            user_id: user.id,
            type: "OWNER",
          },
          {
            dashboard_id: dashboard.id,
            user_id: users[0].id,
            type: "WRITE",
          },
          {
            dashboard_id: dashboard.id,
            user_group_id: userGroups[0].id,
            type: "READ",
          },
        ],
        "*",
      );
    });

    it("edits a permission for a user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $permissionId: GID!
            $newPermissionType: DashboardPermissionType!
          ) {
            updateDashboardPermission(
              dashboardId: $dashboardId
              permissionId: $permissionId
              newPermissionType: $newPermissionType
            ) {
              id
              user {
                id
              }
              type
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", permissions[1].id),
          newPermissionType: "READ",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateDashboardPermission).toEqual({
        id: toGlobalId("DashboardPermission", permissions[1].id),
        user: {
          id: toGlobalId("User", users[0].id),
        },
        type: "READ",
      });
    });

    it("edits a permission for a group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $permissionId: GID!
            $newPermissionType: DashboardPermissionType!
          ) {
            updateDashboardPermission(
              dashboardId: $dashboardId
              permissionId: $permissionId
              newPermissionType: $newPermissionType
            ) {
              id
              userGroup {
                id
              }
              type
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", permissions[2].id),
          newPermissionType: "WRITE",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateDashboardPermission).toEqual({
        id: toGlobalId("DashboardPermission", permissions[2].id),
        userGroup: {
          id: toGlobalId("UserGroup", userGroups[0].id),
        },
        type: "WRITE",
      });
    });

    it("sends error if user is not editor of the dashboard", async () => {
      await mocks.knex
        .from("dashboard_permission")
        .where("id", permissions[1].id)
        .update("type", "READ");

      const { errors, data } = await testClient.withApiKey(user0ApiKey).execute(
        gql`
          mutation (
            $dashboardId: GID!
            $permissionId: GID!
            $newPermissionType: DashboardPermissionType!
          ) {
            updateDashboardPermission(
              dashboardId: $dashboardId
              permissionId: $permissionId
              newPermissionType: $newPermissionType
            ) {
              id
              userGroup {
                id
              }
              type
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", permissions[2].id),
          newPermissionType: "WRITE",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to edit the OWNER permission", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $permissionId: GID!
            $newPermissionType: DashboardPermissionType!
          ) {
            updateDashboardPermission(
              dashboardId: $dashboardId
              permissionId: $permissionId
              newPermissionType: $newPermissionType
            ) {
              id
              userGroup {
                id
              }
              type
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", permissions[0].id),
          newPermissionType: "WRITE",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to upgrade a permission to OWNER", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $permissionId: GID!
            $newPermissionType: DashboardPermissionType!
          ) {
            updateDashboardPermission(
              dashboardId: $dashboardId
              permissionId: $permissionId
              newPermissionType: $newPermissionType
            ) {
              id
              userGroup {
                id
              }
              type
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", permissions[1].id),
          newPermissionType: "OWNER",
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        argName: "newPermissionType",
        message: "Cannot set permission to OWNER",
      });
      expect(data).toBeNull();
    });

    it("sends error if target permission does not exist on the dashboard", async () => {
      const [newDashboard] = await mocks.knex
        .from("dashboard")
        .insert({
          org_id: organization.id,
          name: "My dashboard",
        })
        .returning("*");

      const [newPermission] = await mocks.knex.from("dashboard_permission").insert(
        {
          dashboard_id: newDashboard.id,
          user_id: users[0].id,
          type: "READ",
        },
        "*",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $dashboardId: GID!
            $permissionId: GID!
            $newPermissionType: DashboardPermissionType!
          ) {
            updateDashboardPermission(
              dashboardId: $dashboardId
              permissionId: $permissionId
              newPermissionType: $newPermissionType
            ) {
              id
              userGroup {
                id
              }
              type
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", newPermission.id),
          newPermissionType: "READ",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deleteDashboardPermission", () => {
    let dashboard: Dashboard;
    let permissions: DashboardPermission[];

    let users: User[];
    let userGroups: UserGroup[];

    let user0ApiKey: string;

    beforeAll(async () => {
      users = await mocks.createRandomUsers(organization.id, 3);
      userGroups = await mocks.createUserGroups(3, organization.id, [
        { name: "DASHBOARDS:LIST_DASHBOARDS", effect: "GRANT" },
        { name: "DASHBOARDS:CREATE_DASHBOARDS", effect: "GRANT" },
      ]);

      await mocks.insertUserGroupMembers(userGroups[0].id, [user.id, users[0].id]);

      ({ apiKey: user0ApiKey } = await mocks.createUserAuthToken("user0-apikey", users[0].id));
    });

    beforeEach(async () => {
      [dashboard] = await mocks.knex
        .from("dashboard")
        .insert({
          org_id: organization.id,
          name: "My dashboard",
        })
        .returning("*");

      permissions = await mocks.knex.from("dashboard_permission").insert(
        [
          {
            dashboard_id: dashboard.id,
            user_id: user.id,
            type: "OWNER",
          },
          {
            dashboard_id: dashboard.id,
            user_id: users[0].id,
            type: "WRITE",
          },
          {
            dashboard_id: dashboard.id,
            user_group_id: userGroups[0].id,
            type: "READ",
          },
        ],
        "*",
      );
    });
    it("deletes a permission for a user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($dashboardId: GID!, $permissionId: GID!) {
            deleteDashboardPermission(dashboardId: $dashboardId, permissionId: $permissionId) {
              id
              myEffectivePermission
              permissions {
                user {
                  id
                }
                userGroup {
                  id
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", permissions[1].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteDashboardPermission).toEqual({
        id: toGlobalId("Dashboard", dashboard.id),
        myEffectivePermission: "OWNER",
        permissions: expect.toIncludeSameMembers([
          {
            user: { id: toGlobalId("User", user.id) },
            userGroup: null,
            type: "OWNER",
          },
          {
            user: null,
            userGroup: { id: toGlobalId("UserGroup", userGroups[0].id) },
            type: "READ",
          },
        ]),
      });
    });

    it("deletes a permission for a group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($dashboardId: GID!, $permissionId: GID!) {
            deleteDashboardPermission(dashboardId: $dashboardId, permissionId: $permissionId) {
              id
              myEffectivePermission
              permissions {
                user {
                  id
                }
                userGroup {
                  id
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", permissions[2].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteDashboardPermission).toEqual({
        id: toGlobalId("Dashboard", dashboard.id),
        myEffectivePermission: "OWNER",
        permissions: expect.toIncludeSameMembers([
          {
            user: { id: toGlobalId("User", user.id) },
            userGroup: null,
            type: "OWNER",
          },
          {
            user: { id: toGlobalId("User", users[0].id) },
            userGroup: null,
            type: "WRITE",
          },
        ]),
      });
    });

    it("sends error if trying to delete an OWNER permission", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($dashboardId: GID!, $permissionId: GID!) {
            deleteDashboardPermission(dashboardId: $dashboardId, permissionId: $permissionId) {
              id
              myEffectivePermission
              permissions {
                user {
                  id
                }
                userGroup {
                  id
                }
                type
              }
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", permissions[0].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user is not OWNER of the permission", async () => {
      await mocks.knex
        .from("dashboard_permission")
        .where("id", permissions[1].id)
        .update("type", "READ");

      const { errors, data } = await testClient.withApiKey(user0ApiKey).execute(
        gql`
          mutation ($dashboardId: GID!, $permissionId: GID!) {
            deleteDashboardPermission(dashboardId: $dashboardId, permissionId: $permissionId) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", permissions[1].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if target permission does not exist on the dashboard", async () => {
      const [newDashboard] = await mocks.knex
        .from("dashboard")
        .insert({
          org_id: organization.id,
          name: "My dashboard",
        })
        .returning("*");

      const [newPermission] = await mocks.knex.from("dashboard_permission").insert(
        {
          dashboard_id: newDashboard.id,
          user_id: users[0].id,
          type: "READ",
        },
        "*",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($dashboardId: GID!, $permissionId: GID!) {
            deleteDashboardPermission(dashboardId: $dashboardId, permissionId: $permissionId) {
              id
            }
          }
        `,
        {
          dashboardId: toGlobalId("Dashboard", dashboard.id),
          permissionId: toGlobalId("DashboardPermission", newPermission.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("reorderDashboards", () => {
    it("reorders user dashboards", async () => {
      const { data: queryData } = await testClient.execute(gql`
        query {
          me {
            dashboards {
              id
            }
          }
        }
      `);

      const dashboards = queryData.me.dashboards as { id: string }[];
      const randomReorder = shuffle(dashboards);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($ids: [GID!]!) {
            reorderDashboards(ids: $ids) {
              id
              dashboards {
                id
              }
            }
          }
        `,
        {
          ids: randomReorder.map((d) => d.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.reorderDashboards).toEqual({
        id: toGlobalId("User", user.id),
        dashboards: randomReorder,
      });
    });
  });
});
