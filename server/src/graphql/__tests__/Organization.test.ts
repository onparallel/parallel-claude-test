import { addDays, subDays } from "date-fns";
import { gql } from "graphql-request";
import { Knex } from "knex";
import { indexBy } from "remeda";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, OrganizationTheme, User, UserData } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { defaultPdfDocumentTheme } from "../../util/PdfDocumentTheme";
import { initServer, TestClient } from "./server";

describe("GraphQL/Organization", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let organization: Organization;
  let user: User;
  let pdfDocumentThemes: OrganizationTheme[];

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization("ADMIN"));

    pdfDocumentThemes = await mocks.createOrganizationThemes(organization.id, 3, (i) => ({
      type: "PDF_DOCUMENT",
      is_default: i === 0,
      name: i === 0 ? "Default theme" : `Theme ${i}`,
      created_at: subDays(new Date(), 4 - i), // to ensure correct order
    }));

    await knex.from("feature_flag").delete();
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("organization", () => {
    let orgUsers: User[] = [];
    let userDataById: Record<string, UserData> = {};
    beforeAll(async () => {
      orgUsers = await mocks.createRandomUsers(organization.id, 10);
      userDataById = indexBy(
        await mocks
          .knex("user_data")
          .whereIn(
            "id",
            [user, ...orgUsers].map((u) => u.user_data_id)
          )
          .select("*"),
        (d) => d.id
      );
    });

    it("queries the organization with all the users in default order", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($id: GID!) {
            organization(id: $id) {
              name
              status
              users(limit: 11, offset: 0) {
                totalCount
                items {
                  id
                  email
                  fullName
                }
              }
            }
          }
        `,
        { id: toGlobalId("Organization", organization.id) }
      );

      expect(errors).toBeUndefined();
      expect(data?.organization).toEqual({
        name: "Parallel",
        status: "DEV",
        users: {
          totalCount: 11,
          items: [user, ...orgUsers]
            .sort((a, b) => a.id - b.id)
            .map((u) => {
              const userData = userDataById[u.user_data_id];
              return {
                id: toGlobalId("User", u.id),
                email: userData.email,
                fullName: fullName(userData.first_name, userData.last_name),
              };
            }),
        },
      });
    });
  });

  describe("updateOrganizationAutoAnonymizePeriod", () => {
    let normalUser: User;
    let normalUserApiKey: string;
    beforeAll(async () => {
      [normalUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
        organization_role: "NORMAL",
      }));
      ({ apiKey: normalUserApiKey } = await mocks.createUserAuthToken(
        "normal-token",
        normalUser.id
      ));

      await mocks.createFeatureFlags([{ name: "AUTO_ANONYMIZE", default_value: true }]);
    });

    beforeEach(async () => {
      await mocks.updateFeatureFlag("AUTO_ANONYMIZE", true);
    });

    it("sends error if user doesn't have enabled feature_flag", async () => {
      await mocks.updateFeatureFlag("AUTO_ANONYMIZE", false);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($months: Int) {
            updateOrganizationAutoAnonymizePeriod(months: $months) {
              id
              anonymizePetitionsAfterMonths
            }
          }
        `,
        { months: 1 }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user is not admin", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($months: Int) {
            updateOrganizationAutoAnonymizePeriod(months: $months) {
              id
              anonymizePetitionsAfterMonths
            }
          }
        `,
        { months: 1 }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if period is invalid", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($months: Int) {
            updateOrganizationAutoAnonymizePeriod(months: $months) {
              id
              anonymizePetitionsAfterMonths
            }
          }
        `,
        { months: 0 }
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("updates auto-anonymize period of the user's organization", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($months: Int) {
            updateOrganizationAutoAnonymizePeriod(months: $months) {
              id
              anonymizePetitionsAfterMonths
            }
          }
        `,
        { months: 25 }
      );

      expect(errors).toBeUndefined();
      expect(data?.updateOrganizationAutoAnonymizePeriod).toEqual({
        id: toGlobalId("Organization", organization.id),
        anonymizePetitionsAfterMonths: 25,
      });
    });
  });

  describe("createOrganizationPdfDocumentTheme", () => {
    it("sends error when creating a theme with name longer than 255 chars", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($name: String!, $isDefault: Boolean!) {
            createOrganizationPdfDocumentTheme(name: $name, isDefault: $isDefault) {
              themes {
                pdfDocument {
                  id
                  name
                  isDefault
                  data
                }
              }
            }
          }
        `,
        { name: "X".repeat(256), isDefault: false }
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("creates a pdf document theme with default values and sets it as default theme", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($name: String!, $isDefault: Boolean!) {
            createOrganizationPdfDocumentTheme(name: $name, isDefault: $isDefault) {
              themes {
                pdfDocument {
                  id
                  name
                  isDefault
                  data
                }
              }
            }
          }
        `,
        { name: "Newest theme", isDefault: true }
      );

      expect(errors).toBeUndefined();
      expect(data?.createOrganizationPdfDocumentTheme).toEqual({
        themes: {
          pdfDocument: [
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id + 1),
              name: "Newest theme",
              isDefault: true,
              data: defaultPdfDocumentTheme,
            },
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id),
              name: "Theme 2",
              isDefault: false,
              data: defaultPdfDocumentTheme,
            },
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[1].id),
              name: "Theme 1",
              isDefault: false,
              data: defaultPdfDocumentTheme,
            },
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[0].id),
              name: "Default theme",
              isDefault: false,
              data: defaultPdfDocumentTheme,
            },
          ],
        },
      });
    });
  });

  describe("updateOrganizationPdfDocumentTheme", () => {
    it("sends error when passing unknown font-family", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($orgThemeId: GID!, $data: UpdateOrganizationPdfDocumentThemeInput!) {
            updateOrganizationPdfDocumentTheme(orgThemeId: $orgThemeId, data: $data) {
              themes {
                pdfDocument {
                  id
                  name
                  isDefault
                }
              }
            }
          }
        `,
        {
          orgThemeId: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id),
          data: {
            theme: {
              textFontFamily: "Comic Sans",
            },
          },
        }
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("updates the name of a theme and sets it as new default", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($orgThemeId: GID!, $data: UpdateOrganizationPdfDocumentThemeInput!) {
            updateOrganizationPdfDocumentTheme(orgThemeId: $orgThemeId, data: $data) {
              themes {
                pdfDocument {
                  id
                  name
                  isDefault
                }
              }
            }
          }
        `,
        {
          orgThemeId: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id),
          data: {
            isDefault: true,
            name: "My new default theme",
          },
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.updateOrganizationPdfDocumentTheme).toEqual({
        themes: {
          pdfDocument: [
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id + 1),
              name: "Newest theme",
              isDefault: false,
            },
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id),
              name: "My new default theme",
              isDefault: true,
            },
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[1].id),
              name: "Theme 1",
              isDefault: false,
            },
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[0].id),
              name: "Default theme",
              isDefault: false,
            },
          ],
        },
      });
    });

    it("partially updates the data of a document theme", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($orgThemeId: GID!, $data: UpdateOrganizationPdfDocumentThemeInput!) {
            updateOrganizationPdfDocumentTheme(orgThemeId: $orgThemeId, data: $data) {
              themes {
                pdfDocument {
                  id
                  name
                  isDefault
                  data
                }
              }
            }
          }
        `,
        {
          orgThemeId: toGlobalId("OrganizationTheme", pdfDocumentThemes[1].id),
          data: {
            theme: {
              marginLeft: 100,
              showLogo: false,
              textColor: "#ababab",
            },
          },
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.updateOrganizationPdfDocumentTheme).toEqual({
        themes: {
          pdfDocument: [
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id + 1),
              name: "Newest theme",
              isDefault: false,
              data: defaultPdfDocumentTheme,
            },
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id),
              name: "My new default theme",
              isDefault: true,
              data: defaultPdfDocumentTheme,
            },
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[1].id),
              name: "Theme 1",
              isDefault: false,
              data: {
                ...defaultPdfDocumentTheme,
                marginLeft: 100,
                showLogo: false,
                textColor: "#ababab",
              },
            },
            {
              id: toGlobalId("OrganizationTheme", pdfDocumentThemes[0].id),
              name: "Default theme",
              isDefault: false,
              data: defaultPdfDocumentTheme,
            },
          ],
        },
      });
    });
  });

  describe("deleteOrganizationPdfDocumentTheme", () => {
    it("sends error when trying to delete the default theme", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($orgThemeId: GID!) {
            deleteOrganizationPdfDocumentTheme(orgThemeId: $orgThemeId) {
              id
            }
          }
        `,
        { orgThemeId: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id) }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("deletes a document theme", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($orgThemeId: GID!) {
            deleteOrganizationPdfDocumentTheme(orgThemeId: $orgThemeId) {
              themes {
                pdfDocument {
                  id
                }
              }
            }
          }
        `,
        { orgThemeId: toGlobalId("OrganizationTheme", pdfDocumentThemes[1].id) }
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteOrganizationPdfDocumentTheme).toEqual({
        themes: {
          pdfDocument: [
            { id: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id + 1) },
            { id: toGlobalId("OrganizationTheme", pdfDocumentThemes[2].id) },
            { id: toGlobalId("OrganizationTheme", pdfDocumentThemes[0].id) },
          ],
        },
      });
    });
  });

  describe("restoreDefaultOrganizationPdfDocumentThemeFonts", () => {
    it("restores only the 'fonts' section of the theme", async () => {
      const [newTheme] = await mocks.createOrganizationThemes(organization.id, 1, () => ({
        type: "PDF_DOCUMENT",
        is_default: false,
        name: "test",
        data: {
          ...defaultPdfDocumentTheme,
          legalText: {
            es: [{ type: "paragraph", children: [{ text: "" }] }],
            en: [{ type: "paragraph", children: [{ text: "" }] }],
          },
          marginTop: 50,
          showLogo: false,
          textColor: "#ababab",
          title1Color: "#ffffff",
          title2Color: "#ffffff",
          textFontFamily: "Roboto Slab",
          title1FontFamily: "Source Serif Pro",
          title2FontFamily: "Inconsolata",
          textFontSize: 100,
          title1FontSize: 100,
          title2FontSize: 100,
        },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($orgThemeId: GID!) {
            restoreDefaultOrganizationPdfDocumentThemeFonts(orgThemeId: $orgThemeId) {
              data
            }
          }
        `,
        { orgThemeId: toGlobalId("OrganizationTheme", newTheme.id) }
      );

      expect(errors).toBeUndefined();
      expect(data!.restoreDefaultOrganizationPdfDocumentThemeFonts).toEqual({
        data: {
          ...newTheme.data,
          textColor: "#000000",
          title1Color: "#000000",
          title2Color: "#000000",
          textFontFamily: "IBM Plex Sans",
          title1FontFamily: "IBM Plex Sans",
          title2FontFamily: "IBM Plex Sans",
          textFontSize: 12,
          title1FontSize: 16,
          title2FontSize: 14,
        },
      });
    });
  });
});
