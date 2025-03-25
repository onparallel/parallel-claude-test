import { subMonths } from "date-fns";
import { Container } from "inversify";
import { Knex } from "knex";
import { range } from "remeda";
import { createTestContainer } from "../../../../test/testContainer";
import { toGlobalId } from "../../../util/globalId";
import { deleteAllData } from "../../../util/knexUtils";
import {
  ContactLocale,
  Organization,
  Petition,
  PetitionStatus,
  ProfileStatus,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldType,
  Tag,
  User,
  UserGroup,
} from "../../__types";
import { KNEX } from "../../knex";
import { DashboardRepository, ModuleSettings } from "../DashboardRepository";
import { PetitionFilter } from "../PetitionRepository";
import { Mocks } from "./mocks";

describe("DashboardRepository", () => {
  let container: Container;
  let knex: Knex;
  let dashboards: DashboardRepository;

  let mocks: Mocks;
  let organization: Organization;
  const users: User[] = [];

  beforeAll(async () => {
    container = await createTestContainer();
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);
    dashboards = container.get(DashboardRepository);

    const { organization: rootOrg, user: sessionUser } =
      await mocks.createSessionUserAndOrganization();

    organization = rootOrg;
    users.push(sessionUser);

    const moreUsers = await mocks.createRandomUsers(organization.id, 2);
    users.push(...moreUsers);
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  describe("getPetitionsNumberValue", () => {
    let templates: Petition[];

    let tags: Tag[];
    let userGroups: UserGroup[];

    async function count(filters: PetitionFilter) {
      return await dashboards.getPetitionsNumberValue(organization.id, { filters });
    }

    beforeAll(async () => {
      templates = await mocks.createRandomTemplates(organization.id, users[0].id, 2);
      tags = await mocks.createRandomTags(organization.id, 3, (i) => ({
        name: ["KYC", "AML", "HIGH_RISK"][i],
      }));

      await mocks.createRandomPetitions(organization.id, users[0].id, 4, (i) => ({
        from_template_id: templates[0].id,
        status: ["DRAFT", "DRAFT", "DRAFT", "PENDING"][i] as PetitionStatus,
        recipient_locale: "en",
      }));

      const completedKycs = await mocks.createRandomPetitions(
        organization.id,
        users[0].id,
        4,
        (i) => ({
          path: "/KYC/",
          status: "COMPLETED",
          latest_signature_status: "COMPLETED",
          recipient_locale: ["it", "es", "en", "en"][i] as ContactLocale,
          from_template_id: templates[0].id,
        }),
      );
      await mocks.tagPetitions(
        completedKycs.slice(0, 3).map((p) => p.id),
        tags[0].id,
      );

      await mocks.tagPetitions([completedKycs[0].id], tags[2].id);

      userGroups = await mocks.createUserGroups(1, organization.id);
      await mocks.insertUserGroupMembers(
        userGroups[0].id,
        users.map((u) => u.id),
      );

      const closedAmls = await mocks.createRandomPetitions(organization.id, users[1].id, 7, () => ({
        status: "CLOSED",
        recipient_locale: "es",
      }));
      await mocks.tagPetitions(
        closedAmls.map((p) => p.id),
        tags[1].id,
      );

      await mocks.sharePetitions(
        closedAmls.slice(0, 4).map((p) => p.id),
        users[0].id,
        "READ",
      );
      await mocks.sharePetitionWithGroups(closedAmls[4].id, [userGroups[0].id], "READ");
    });

    afterAll(async () => {
      await mocks.knex.from("petition").update({ deleted_at: new Date() });
    });

    it("counts petitions in a specific path", async () => {
      expect(await count({ path: "/KYC/" })).toEqual({ count: 4 });
    });

    it("counts petitions with DRAFT or PENDING status", async () => {
      expect(await count({ status: ["DRAFT", "PENDING"] })).toEqual({ count: 4 });
    });

    it("counts petitions with a specific locale", async () => {
      expect(await count({ locale: "it" })).toEqual({ count: 1 });
    });

    it("counts petitions with a completed signature", async () => {
      expect(await count({ signature: ["COMPLETED"] })).toEqual({ count: 4 });
    });

    it("counts petitions with specific tags", async () => {
      expect(
        await count({
          tags: {
            operator: "AND",
            filters: [
              { operator: "CONTAINS", value: [tags[0].id, tags[2].id] },
              { operator: "DOES_NOT_CONTAIN", value: [tags[1].id] },
            ],
          },
        }),
      ).toEqual({ count: 1 });

      expect(
        await count({
          tags: {
            operator: "OR",
            filters: [
              { operator: "CONTAINS", value: [tags[2].id] },
              { operator: "IS_EMPTY", value: [] },
            ],
          },
        }),
      ).toEqual({ count: 6 });
    });

    it("counts petitions with no tags", async () => {
      expect(
        await count({
          tags: {
            operator: "AND",
            filters: [{ operator: "IS_EMPTY", value: [] }],
          },
        }),
      ).toEqual({ count: 5 });
    });

    it("counts petitions shared with me", async () => {
      expect(
        await count({
          sharedWith: {
            operator: "AND",
            filters: [
              {
                operator: "SHARED_WITH",
                value: toGlobalId("User", users[0].id),
              },
              {
                operator: "NOT_IS_OWNER",
                value: toGlobalId("User", users[0].id),
              },
            ],
          },
        }),
      ).toEqual({ count: 5 });
    });

    it("counts petitions not shared with me", async () => {
      expect(
        await count({
          sharedWith: {
            operator: "AND",
            filters: [
              {
                operator: "NOT_SHARED_WITH",
                value: toGlobalId("User", users[0].id),
              },
            ],
          },
        }),
      ).toEqual({ count: 2 });
    });

    it("counts petitions shared with me through a specific user group", async () => {
      expect(
        await count({
          sharedWith: {
            operator: "AND",
            filters: [
              {
                operator: "SHARED_WITH",
                value: toGlobalId("UserGroup", userGroups[0].id),
              },
              {
                operator: "NOT_IS_OWNER",
                value: toGlobalId("User", users[0].id),
              },
            ],
          },
        }),
      ).toEqual({ count: 1 });
    });

    it("counts petitions that i own", async () => {
      expect(
        await count({
          sharedWith: {
            operator: "AND",
            filters: [
              {
                operator: "IS_OWNER",
                value: toGlobalId("User", users[0].id),
              },
            ],
          },
        }),
      ).toEqual({ count: 8 });
    });

    it("counts petitions from a specific template", async () => {
      expect(await count({ fromTemplateId: [templates[0].id] })).toEqual({ count: 8 });
    });

    it("counts petitions with multiple filters", async () => {
      expect(
        await count({
          status: ["COMPLETED"],
          path: "/KYC/",
          signature: ["COMPLETED"],
          fromTemplateId: [templates[0].id],
          tags: {
            operator: "AND",
            filters: [{ operator: "IS_EMPTY", value: [] }],
          },
        }),
      ).toEqual({ count: 1 });
    });
  });

  describe("getProfilesNumberValue", () => {
    async function count(settings: ModuleSettings<"PROFILES_NUMBER">) {
      return await dashboards.getProfilesNumberValue(organization.id, settings);
    }

    let individual: ProfileType;
    let individualFields: ProfileTypeField[];

    let contract: ProfileType;
    let contractFields: ProfileTypeField[];

    beforeAll(async () => {
      [individual, contract] = await mocks.createRandomProfileTypes(organization.id, 2);
      individualFields = await mocks.createRandomProfileTypeFields(
        organization.id,
        individual.id,
        5,
        (i) => ({
          type: ["SHORT_TEXT", "FILE", "BACKGROUND_CHECK", "DATE", "SELECT"][
            i
          ] as ProfileTypeFieldType,
          alias: ["name", "id_doc", "background_check", "birth_date", "risk"][i],
          is_expirable: false,
          options:
            i === 4
              ? {
                  values: [
                    { label: { en: "High Risk" }, value: "HIGH" },
                    { label: { en: "Medium Risk" }, value: "MEDIUM" },
                    { label: { en: "Low Risk" }, value: "LOW" },
                  ],
                }
              : {},
        }),
      );
      contractFields = await mocks.createRandomProfileTypeFields(
        organization.id,
        contract.id,
        5,
        (i) => ({
          type: ["TEXT", "PHONE", "CHECKBOX", "DATE", "NUMBER"][i] as ProfileTypeFieldType,
          is_expirable: i === 3,
          alias: ["name", "phone", "options", "end_date", "contract_value"][i],
          options:
            i === 2
              ? {
                  values: [
                    { label: { en: "A" }, value: "A" },
                    { label: { en: "B" }, value: "B" },
                    { label: { en: "C" }, value: "C" },
                  ],
                }
              : i === 3
                ? { useReplyAsExpiryDate: true }
                : {},
        }),
      );

      const individuals = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        4,
        (i) => ({
          status: ["OPEN", "OPEN", "CLOSED", "DELETION_SCHEDULED"][i] as ProfileStatus,
          closed_at: [null, null, new Date(), new Date()][i],
          deletion_scheduled_at: [null, null, null, new Date()][i],
        }),
      );

      const contracts = await mocks.createRandomProfiles(organization.id, contract.id, 2, (i) => ({
        status: ["OPEN", "CLOSED"][i] as ProfileStatus,
        closed_at: [null, new Date()][i],
      }));

      // ########################
      // ALBUS DUMBLEDORE PROFILE
      // ########################
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: individuals[0].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[0].id,
          type: "SHORT_TEXT",
          content: { value: "Albus Dumbledore" },
        },
        {
          profile_id: individuals[0].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[2].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Albus Dumbledore",
              date: null,
              type: "Person",
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: 1,
                  type: "Person",
                  name: "Albus Dumbledore",
                  properties: {
                    topics: ["poi"],
                  },
                },
              ],
            },
            entity: {
              id: 1,
              type: "Person",
              name: "Albus Dumbledore",
              properties: {
                topics: ["poi"],
              },
            },
          },
        },
        {
          profile_id: individuals[0].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[3].id,
          type: "DATE",
          content: { value: "1881-08-01" },
        },
        {
          profile_id: individuals[0].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[4].id,
          type: "SELECT",
          content: { value: "HIGH" },
        },
      ]);
      const [dumbledoreId] = await mocks.createRandomFileUpload(1);
      await mocks.knex.from("profile_field_file").insert({
        profile_id: individuals[0].id,
        created_by_user_id: users[0].id,
        profile_type_field_id: individualFields[1].id,
        type: "FILE",
        file_upload_id: dumbledoreId.id,
      });

      // ########################
      // HARRY POTTER PROFILE
      // ########################
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: individuals[1].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[0].id,
          type: "SHORT_TEXT",
          content: { value: "Harry Potter" },
        },
        {
          profile_id: individuals[1].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[2].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Harry Potter",
              date: null,
              type: "Person",
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: 2,
                  type: "Person",
                  name: "Hary Potter",
                  properties: {
                    topics: [],
                  },
                },
              ],
            },
            entity: null,
          },
        },
        {
          profile_id: individuals[1].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[3].id,
          type: "DATE",
          content: { value: "1190-08-11" },
        },
        {
          profile_id: individuals[1].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[4].id,
          type: "SELECT",
          content: { value: "LOW" },
        },
      ]);

      // ########################
      // TOM RIDDLE PROFILE
      // ########################
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: individuals[2].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[0].id,
          type: "SHORT_TEXT",
          content: { value: "Tom Riddle" },
        },
        {
          profile_id: individuals[2].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[2].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Tom Riddle",
              date: null,
              type: "Person",
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: 3,
                  type: "Person",
                  name: "Tom Riddle",
                  properties: {
                    topics: ["wanted", "poi"],
                  },
                },
              ],
            },
            entity: {
              id: 3,
              type: "Person",
              name: "Tom Riddle",
              properties: {
                topics: ["wanted", "poi"],
              },
            },
          },
        },
        {
          profile_id: individuals[2].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[4].id,
          type: "SELECT",
          content: { value: "HIGH" },
        },
      ]);

      // ########################
      // LILY POTTER PROFILE
      // ########################
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: individuals[3].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[0].id,
          type: "SHORT_TEXT",
          content: { value: "Lily Potter" },
        },
        {
          profile_id: individuals[3].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[2].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Lily Potter",
              date: null,
              type: "Person",
            },
            search: {
              totalCount: 0,
              items: [],
            },
            entity: null,
          },
        },
        {
          profile_id: individuals[3].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: individualFields[4].id,
          type: "SELECT",
          content: { value: "LOW" },
        },
      ]);

      // ########################
      // DUMBLEDORE CONTRACT
      // ########################
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: contracts[0].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: contractFields[0].id,
          type: "TEXT",
          content: { value: "Work Contract" },
        },
        {
          profile_id: contracts[0].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: contractFields[1].id,
          type: "PHONE",
          content: { value: "+123456789" },
        },
        {
          profile_id: contracts[0].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: contractFields[2].id,
          type: "CHECKBOX",
          content: { value: ["A", "C"] },
        },
        {
          profile_id: contracts[0].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: contractFields[3].id,
          type: "DATE",
          content: { value: new Date().toISOString().split("T")[0] },
          expiry_date: new Date().toISOString().split("T")[0],
        },
        {
          profile_id: contracts[0].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: contractFields[4].id,
          type: "NUMBER",
          content: { value: 1000 },
        },
      ]);

      // ########################
      // SEVERUS SNAPE CONTRACT
      // ########################
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: contracts[1].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: contractFields[0].id,
          type: "TEXT",
          content: { value: "Work Contract" },
        },
        {
          profile_id: contracts[1].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: contractFields[1].id,
          type: "PHONE",
          content: { value: "+123456789" },
        },
        {
          profile_id: contracts[1].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: contractFields[2].id,
          type: "CHECKBOX",
          content: { value: ["A", "B"] },
        },
        {
          profile_id: contracts[1].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: contractFields[3].id,
          type: "DATE",
          content: { value: subMonths(new Date(), 1).toISOString().split("T")[0] }, // expired 1 month ago
          expiry_date: subMonths(new Date(), 1).toISOString().split("T")[0],
        },
        {
          profile_id: contracts[1].id,
          created_by_user_id: users[0].id,
          profile_type_field_id: contractFields[4].id,
          type: "NUMBER",
          content: { value: 500 },
        },
      ]);
    });

    afterAll(async () => {
      await mocks.knex.from("profile").update({ deleted_at: new Date() });
    });

    it("counts profiles with OPEN or CLOSED status", async () => {
      expect(
        await count({
          profileTypeId: individual.id,
          filters: { status: ["OPEN", "CLOSED"] },
          type: "COUNT",
        }),
      ).toEqual({ count: 3, aggr: null });
    });

    it("sends error if passing unknown profileTypeFieldId", async () => {
      await expect(
        count({
          profileTypeId: contract.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [{ profileTypeFieldId: individualFields[0].id, operator: "HAS_VALUE" }],
            },
          },
          type: "COUNT",
        }),
      ).rejects.toThrow();
    });

    it("counts OPEN profiles of CONTRACT type", async () => {
      expect(
        await count({
          profileTypeId: contract.id,
          filters: {
            status: ["OPEN"],
          },
          type: "COUNT",
        }),
      ).toEqual({ count: 1, aggr: null });
    });

    it("counts profiles with HAS_VALUE operator", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: individual.id,
          filters: {
            values: {
              logicalOperator: "OR",
              conditions: [
                { profileTypeFieldId: individualFields[1].id, operator: "HAS_VALUE" },
                { profileTypeFieldId: individualFields[3].id, operator: "HAS_VALUE" },
              ],
            },
          },
        }),
      ).toEqual({ count: 2, aggr: null });
    });

    it("counts profiles with NOT_HAS_VALUE operator", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: individual.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                { profileTypeFieldId: individualFields[2].id, operator: "NOT_HAS_VALUE" },
              ],
            },
          },
        }),
      ).toEqual({ count: 0, aggr: null });
    });

    it("counts profiles with HAS_BG_CHECK_RESULTS operator", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: individual.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                { profileTypeFieldId: individualFields[2].id, operator: "HAS_BG_CHECK_RESULTS" },
              ],
            },
          },
        }),
      ).toEqual({ count: 3, aggr: null });
    });

    it("counts profiles with HAS_VALUE & NOT_HAS_BG_CHECK_RESULTS operators", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: individual.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                { profileTypeFieldId: individualFields[2].id, operator: "HAS_VALUE" },
                {
                  profileTypeFieldId: individualFields[2].id,
                  operator: "NOT_HAS_BG_CHECK_RESULTS",
                },
              ],
            },
          },
        }),
      ).toEqual({ count: 1, aggr: null });
    });

    it("counts profiles with HAS_VALUE & NOT_HAS_BG_CHECK_MATCH operator", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: individual.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                { profileTypeFieldId: individualFields[2].id, operator: "HAS_VALUE" },
                { profileTypeFieldId: individualFields[2].id, operator: "NOT_HAS_BG_CHECK_MATCH" },
              ],
            },
          },
        }),
      ).toEqual({ count: 2, aggr: null });
    });

    it("counts profiles with HAS_BG_CHECK_TOPICS operator", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: individual.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: individualFields[2].id,
                  operator: "HAS_BG_CHECK_TOPICS",
                  value: ["poi"],
                },
              ],
            },
          },
        }),
      ).toEqual({ count: 2, aggr: null });
    });

    it("counts profiles with IS_EXPIRED operator", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: contract.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: contractFields[3].id,
                  operator: "IS_EXPIRED",
                },
              ],
            },
          },
        }),
      ).toEqual({ count: 1, aggr: null });
    });

    it("counts profiles with EXPIRES_IN operator", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: contract.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: contractFields[3].id,
                  operator: "EXPIRES_IN",
                  value: "P1D",
                },
              ],
            },
          },
        }),
      ).toEqual({ count: 2, aggr: null });
    });

    it("counts profiles with GREATER_THAN operator", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: contract.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: contractFields[4].id,
                  operator: "GREATER_THAN",
                  value: 500,
                },
              ],
            },
          },
        }),
      ).toEqual({ count: 1, aggr: null });
    });

    it("counts profiles with NOT_HAS_EXPIRY operator", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: individual.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: individualFields[3].id,
                  operator: "NOT_HAS_EXPIRY",
                },
              ],
            },
          },
        }),
      ).toEqual({ count: 4, aggr: null });
    });

    it("counts profiles with CHECKBOX CONTAIN filters", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: contract.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: contractFields[2].id,
                  operator: "CONTAIN",
                  value: ["A"],
                },
              ],
            },
          },
        }),
      ).toEqual({ count: 2, aggr: null });
    });

    it("counts profiles with CHECKBOX EQUAL filters", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: contract.id,
          filters: {
            values: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: contractFields[2].id,
                  operator: "EQUAL",
                  value: ["A", "C"],
                },
              ],
            },
          },
        }),
      ).toEqual({ count: 1, aggr: null });
    });

    it("counts OPEN profiles with certain bg check topic and high risk", async () => {
      expect(
        await count({
          type: "COUNT",
          profileTypeId: individual.id,
          filters: {
            status: ["OPEN"],
            values: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: individualFields[2].id,
                  operator: "HAS_BG_CHECK_TOPICS",
                  value: ["poi"],
                },
                {
                  profileTypeFieldId: individualFields[4].id,
                  operator: "EQUAL",
                  value: "HIGH",
                },
              ],
            },
          },
        }),
      ).toEqual({ count: 1, aggr: null });
    });

    it("sends error when aggregating by an unknown field", async () => {
      await expect(
        count({
          profileTypeId: contract.id,
          type: "AGGREGATE",
          aggregate: "SUM",
          profileTypeFieldId: individualFields[0].id,
          filters: {},
        }),
      ).rejects.toThrow();
    });

    it("sends error when aggregating by a field of type !== NUMBER", async () => {
      await expect(
        count({
          profileTypeId: contract.id,
          type: "AGGREGATE",
          aggregate: "SUM",
          profileTypeFieldId: contractFields[0].id,
          filters: {},
        }),
      ).rejects.toThrow();
    });

    it("aggregates contract values", async () => {
      for (const [aggregate, aggr, countValue] of [
        ["SUM", 1500, 2],
        ["AVG", 750, 2],
        ["MIN", 500, 2],
        ["MAX", 1000, 2],
      ] as ["SUM" | "AVG" | "MIN" | "MAX", number, number][]) {
        expect(
          await count({
            profileTypeId: contract.id,
            type: "AGGREGATE",
            aggregate,
            profileTypeFieldId: contractFields[4].id,
            filters: {},
          }),
        ).toEqual({ aggr, count: countValue });
      }
    });
  });

  describe("getPetitionsRatioValues", () => {
    beforeAll(async () => {
      await mocks.createRandomPetitions(organization.id, users[0].id, 10, (i) => ({
        status: [
          "DRAFT",
          "DRAFT",
          "DRAFT",
          "PENDING",
          "COMPLETED",
          "COMPLETED",
          "CLOSED",
          "CLOSED",
          "CLOSED",
          "CLOSED",
        ][i] as PetitionStatus,
      }));
    });

    afterAll(async () => {
      await mocks.knex.from("petition").update({ deleted_at: new Date() });
    });

    it("calculates the ratio of DRAFT or PENDING petitions", async () => {
      expect(
        await dashboards.getPetitionsRatioValues(organization.id, {
          graphicType: "RATIO",
          filters: [
            { status: ["DRAFT", "PENDING"] },
            { status: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"] },
          ],
        }),
      ).toEqual({
        items: [{ count: 4 }, { count: 10 }],
        isIncongruent: false,
      });
    });

    it("detects incongruent filters", async () => {
      expect(
        await dashboards.getPetitionsRatioValues(organization.id, {
          graphicType: "RATIO",
          filters: [{ status: ["DRAFT", "PENDING"] }, { status: ["DRAFT", "COMPLETED", "CLOSED"] }],
        }),
      ).toEqual({
        items: [{ count: 4 }, { count: 9 }],
        isIncongruent: true,
      });
    });
  });

  describe("getProfilesRatioValues", () => {
    let profileType: ProfileType;
    beforeAll(async () => {
      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);

      await mocks.createRandomProfiles(organization.id, profileType.id, 10, (i) => ({
        status: [
          "OPEN",
          "OPEN",
          "OPEN",
          "OPEN",
          "OPEN",
          "OPEN",
          "CLOSED",
          "CLOSED",
          "DELETION_SCHEDULED",
          "DELETION_SCHEDULED",
        ][i] as ProfileStatus,
        closed_at: i < 6 ? null : new Date(),
        deletion_scheduled_at: i < 8 ? null : new Date(),
      }));
    });

    afterAll(async () => {
      await mocks.knex.from("profile").update({ deleted_at: new Date() });
    });

    it("calculates the ratio of OPEN profiles", async () => {
      expect(
        await dashboards.getProfilesRatioValues(organization.id, {
          type: "COUNT",
          graphicType: "RATIO",
          profileTypeId: profileType.id,
          filters: [{ status: ["OPEN"] }, { status: ["OPEN", "CLOSED"] }],
        }),
      ).toEqual({
        items: [
          { count: 6, aggr: null },
          { count: 8, aggr: null },
        ],
        isIncongruent: false,
      });
    });

    it("detects incongruent filters", async () => {
      expect(
        await dashboards.getProfilesRatioValues(organization.id, {
          type: "COUNT",
          graphicType: "RATIO",
          profileTypeId: profileType.id,
          filters: [{ status: ["OPEN", "CLOSED"] }, { status: ["OPEN"] }],
        }),
      ).toEqual({
        items: [
          { count: 8, aggr: null },
          { count: 6, aggr: null },
        ],
        isIncongruent: true,
      });
    });
  });

  describe("getPetitionsPieChartValues", () => {
    beforeAll(async () => {
      await mocks.createRandomPetitions(organization.id, users[0].id, 20, (i) => ({
        status: [
          ...range(0, 2).map(() => "DRAFT"),
          ...range(0, 5).map(() => "PENDING"),
          ...range(0, 7).map(() => "COMPLETED"),
          ...range(0, 6).map(() => "CLOSED"),
        ][i] as PetitionStatus,
      }));
    });

    afterAll(async () => {
      await mocks.knex.from("petition").update({ deleted_at: new Date() });
    });

    it("calculates the amount of petitions in each status", async () => {
      expect(
        await dashboards.getPetitionsPieChartValues(organization.id, {
          graphicType: "PIE",
          items: [
            { label: "En proceso", color: "#FF0000", filter: { status: ["DRAFT", "PENDING"] } },
            { label: "Completados", color: "#00FF00", filter: { status: ["COMPLETED"] } },
            { label: "Cerrados", color: "#0000FF", filter: { status: ["CLOSED"] } },
          ],
        }),
      ).toEqual({
        items: [
          { label: "En proceso", color: "#FF0000", count: 7 },
          { label: "Completados", color: "#00FF00", count: 7 },
          { label: "Cerrados", color: "#0000FF", count: 6 },
        ],
        isIncongruent: false,
      });
    });

    it("detects incongruent filters", async () => {
      expect(
        await dashboards.getPetitionsPieChartValues(organization.id, {
          graphicType: "PIE",
          items: [
            { label: "Borradores", color: "#FF0000", filter: { status: ["DRAFT"] } },
            { label: "En proceso", color: "#FF0000", filter: { status: ["DRAFT", "PENDING"] } },
            { label: "Completados", color: "#00FF00", filter: { status: ["COMPLETED"] } },
            { label: "Cerrados", color: "#0000FF", filter: { status: ["CLOSED"] } },
          ],
        }),
      ).toEqual({
        items: [
          { label: "Borradores", color: "#FF0000", count: 2 },
          { label: "En proceso", color: "#FF0000", count: 7 },
          { label: "Completados", color: "#00FF00", count: 7 },
          { label: "Cerrados", color: "#0000FF", count: 6 },
        ],
        isIncongruent: true,
      });
    });
  });

  describe("getProfilesPieChartValues", () => {
    let profileType: ProfileType;
    let riskSelectField: ProfileTypeField;
    let numberField: ProfileTypeField;
    let countrySelectField: ProfileTypeField;
    beforeAll(async () => {
      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      [riskSelectField, numberField, countrySelectField] =
        await mocks.createRandomProfileTypeFields(organization.id, profileType.id, 3, (i) => ({
          type: ["SELECT", "NUMBER", "SELECT"][i] as ProfileTypeFieldType,
          options:
            i === 0
              ? {
                  values: [
                    { label: { en: "High Risk" }, color: "#aa0000", value: "HIGH" },
                    { label: { en: "Medium Risk" }, color: "#bb0000", value: "MEDIUM" },
                    { label: { en: "Low Risk" }, color: "#cc0000", value: "LOW" },
                  ],
                  showOptionsWithColors: true,
                }
              : i === 1
                ? {}
                : i === 2
                  ? { standardList: "COUNTRIES" }
                  : {},
        }));

      const profiles = await mocks.createRandomProfiles(
        organization.id,
        profileType.id,
        10,
        (i) => ({
          status: [
            "OPEN",
            "OPEN",
            "OPEN",
            "OPEN",
            "OPEN",
            "OPEN",
            "CLOSED",
            "CLOSED",
            "DELETION_SCHEDULED",
            "DELETION_SCHEDULED",
          ][i] as ProfileStatus,
          closed_at: i < 6 ? null : new Date(),
          deletion_scheduled_at: i < 8 ? null : new Date(),
        }),
      );

      await mocks.knex.from("profile_field_value").insert([
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[0].id,
          profile_type_field_id: riskSelectField.id,
          type: "SELECT",
          content: { value: "HIGH" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[0].id,
          profile_type_field_id: numberField.id,
          type: "NUMBER",
          content: { value: 1000 },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[0].id,
          profile_type_field_id: countrySelectField.id,
          type: "SELECT",
          content: { value: "AR" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[1].id,
          profile_type_field_id: riskSelectField.id,
          type: "SELECT",
          content: { value: "HIGH" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[1].id,
          profile_type_field_id: numberField.id,
          type: "NUMBER",
          content: { value: 500 },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[1].id,
          profile_type_field_id: countrySelectField.id,
          type: "SELECT",
          content: { value: "FR" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[2].id,
          profile_type_field_id: riskSelectField.id,
          type: "SELECT",
          content: { value: "HIGH" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[2].id,
          profile_type_field_id: numberField.id,
          type: "NUMBER",
          content: { value: 200 },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[2].id,
          profile_type_field_id: countrySelectField.id,
          type: "SELECT",
          content: { value: "AR" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[3].id,
          profile_type_field_id: riskSelectField.id,
          type: "SELECT",
          content: { value: "MEDIUM" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[3].id,
          profile_type_field_id: numberField.id,
          type: "NUMBER",
          content: { value: 0 },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[3].id,
          profile_type_field_id: countrySelectField.id,
          type: "SELECT",
          content: { value: "AR" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[4].id,
          profile_type_field_id: riskSelectField.id,
          type: "SELECT",
          content: { value: "MEDIUM" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[4].id,
          profile_type_field_id: numberField.id,
          type: "NUMBER",
          content: { value: -100 },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[4].id,
          profile_type_field_id: countrySelectField.id,
          type: "SELECT",
          content: { value: "FR" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[5].id,
          profile_type_field_id: riskSelectField.id,
          type: "SELECT",
          content: { value: "MEDIUM" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[5].id,
          profile_type_field_id: numberField.id,
          type: "NUMBER",
          content: { value: 800 },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[5].id,
          profile_type_field_id: countrySelectField.id,
          type: "SELECT",
          content: { value: "FR" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[6].id,
          profile_type_field_id: countrySelectField.id,
          type: "SELECT",
          content: { value: "GB" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[7].id,
          profile_type_field_id: numberField.id,
          type: "NUMBER",
          content: { value: 12345 },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[8].id,
          profile_type_field_id: riskSelectField.id,
          type: "SELECT",
          content: { value: "LOW" },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[8].id,
          profile_type_field_id: numberField.id,
          type: "NUMBER",
          content: { value: 8000 },
        },
        {
          created_by_user_id: users[0].id,
          profile_id: profiles[8].id,
          profile_type_field_id: countrySelectField.id,
          type: "SELECT",
          content: { value: "ES" },
        },
      ]);
    });

    afterAll(async () => {
      await mocks.knex.from("profile").update({ deleted_at: new Date() });
    });

    it("calculates the amount of profiles in each status", async () => {
      expect(
        await dashboards.getProfilesPieChartValues(organization.id, {
          type: "COUNT",
          graphicType: "PIE",
          profileTypeId: profileType.id,
          items: [
            { label: "Abiertos", color: "#FF0000", filter: { status: ["OPEN"] } },
            { label: "Cerrados", color: "#00FF00", filter: { status: ["CLOSED"] } },
            { label: "Eliminados", color: "#0000FF", filter: { status: ["DELETION_SCHEDULED"] } },
          ],
        }),
      ).toEqual({
        items: [
          { label: "Abiertos", color: "#FF0000", count: 6, aggr: null },
          { label: "Cerrados", color: "#00FF00", count: 2, aggr: null },
          { label: "Eliminados", color: "#0000FF", count: 2, aggr: null },
        ],
        isIncongruent: false,
      });
    });

    it("aggregates numeric value by profile risk", async () => {
      expect(
        await dashboards.getProfilesPieChartValues(organization.id, {
          graphicType: "PIE",
          type: "AGGREGATE",
          aggregate: "SUM",
          profileTypeFieldId: numberField.id,
          profileTypeId: profileType.id,
          items: [
            {
              color: "#FF0000",
              label: "HIGH RISK",
              filter: {
                status: ["OPEN", "CLOSED"],
                values: {
                  profileTypeFieldId: riskSelectField.id,
                  operator: "EQUAL",
                  value: "HIGH",
                },
              },
            },
            {
              color: "#FF0000",
              label: "MEDIUM RISK",
              filter: {
                status: ["OPEN", "CLOSED"],
                values: {
                  profileTypeFieldId: riskSelectField.id,
                  operator: "EQUAL",
                  value: "MEDIUM",
                },
              },
            },
            {
              color: "#FF0000",
              label: "LOW RISK",
              filter: {
                status: ["OPEN", "CLOSED"],
                values: {
                  profileTypeFieldId: riskSelectField.id,
                  operator: "EQUAL",
                  value: "LOW",
                },
              },
            },
          ],
        }),
      ).toEqual({
        items: [
          { label: "HIGH RISK", color: "#FF0000", count: 3, aggr: 1700 },
          { label: "MEDIUM RISK", color: "#FF0000", count: 3, aggr: 700 },
          { label: "LOW RISK", color: "#FF0000", count: 0, aggr: 0 },
        ],
        isIncongruent: false,
      });
    });

    it("aggregates numeric values by profile risk, grouping by SELECT property", async () => {
      expect(
        await dashboards.getProfilesPieChartValues(organization.id, {
          type: "AGGREGATE",
          aggregate: "SUM",
          items: [],
          graphicType: "PIE",
          profileTypeId: profileType.id,
          profileTypeFieldId: numberField.id,
          groupByProfileTypeFieldId: riskSelectField.id,
          groupByFilter: {
            status: ["OPEN", "CLOSED"],
          },
        }),
      ).toEqual({
        items: expect.toIncludeSameMembers([
          { label: { en: "High Risk" }, color: "#aa0000", count: 3, aggr: 1700 },
          { label: { en: "Medium Risk" }, color: "#bb0000", count: 3, aggr: 700 },
          { label: null, color: null, count: 1, aggr: 12345 },
        ]),
        isIncongruent: false,
      });
    });

    it("sends error when grouping by a property of type other than SELECT", async () => {
      await expect(
        dashboards.getProfilesPieChartValues(organization.id, {
          type: "AGGREGATE",
          aggregate: "SUM",
          items: [],
          graphicType: "PIE",
          profileTypeId: profileType.id,
          profileTypeFieldId: numberField.id,
          groupByProfileTypeFieldId: numberField.id,
          groupByFilter: {
            status: ["OPEN", "CLOSED"],
          },
        }),
      ).rejects.toThrow();
    });

    it("counts number of profile of each risk, grouping by SELECT property", async () => {
      expect(
        await dashboards.getProfilesPieChartValues(organization.id, {
          type: "COUNT",
          items: [],
          graphicType: "PIE",
          profileTypeId: profileType.id,
          groupByProfileTypeFieldId: riskSelectField.id,
        }),
      ).toEqual({
        items: expect.toIncludeSameMembers([
          { label: { en: "High Risk" }, color: "#aa0000", count: 3, aggr: null },
          { label: { en: "Medium Risk" }, color: "#bb0000", count: 3, aggr: null },
          { label: { en: "Low Risk" }, color: "#cc0000", count: 1, aggr: null },
          { label: null, color: null, count: 3, aggr: null },
        ]),
        isIncongruent: false,
      });
    });

    it("aggregates numeric values by profile risk, grouping by SELECT property with countries standardList", async () => {
      expect(
        await dashboards.getProfilesPieChartValues(organization.id, {
          type: "AGGREGATE",
          aggregate: "SUM",
          items: [],
          graphicType: "PIE",
          profileTypeId: profileType.id,
          profileTypeFieldId: numberField.id,
          groupByProfileTypeFieldId: countrySelectField.id,
        }),
      ).toEqual({
        items: expect.toIncludeSameMembers([
          {
            label: { en: "Argentina", es: "Argentina" },
            color: expect.any(String),
            aggr: 1200,
            count: 3,
          },
          {
            label: { en: "France", es: "Francia" },
            color: expect.any(String),
            aggr: 1200,
            count: 3,
          },
          { label: { en: "Spain", es: "España" }, color: expect.any(String), aggr: 8000, count: 1 },
          { label: null, color: null, aggr: 12345, count: 1 },
        ]),
        isIncongruent: false,
      });
    });

    it("detects incongruent filters", async () => {
      expect(
        await dashboards.getProfilesPieChartValues(organization.id, {
          type: "COUNT",
          graphicType: "PIE",
          profileTypeId: profileType.id,
          items: [
            { label: "Abiertos", color: "#FF0000", filter: { status: ["OPEN"] } },
            { label: "Cerrados", color: "#00FF00", filter: { status: ["OPEN", "CLOSED"] } },
            { label: "Eliminados", color: "#0000FF", filter: { status: ["DELETION_SCHEDULED"] } },
          ],
        }),
      ).toEqual({
        items: [
          { label: "Abiertos", color: "#FF0000", count: 6, aggr: null },
          { label: "Cerrados", color: "#00FF00", count: 8, aggr: null },
          { label: "Eliminados", color: "#0000FF", count: 2, aggr: null },
        ],
        isIncongruent: true,
      });
    });

    it("sends error if trying to aggregate by something other than SUM", async () => {
      for (const aggregate of ["AVG", "MIN", "MAX"] as const) {
        await expect(
          dashboards.getProfilesPieChartValues(organization.id, {
            graphicType: "PIE",
            type: "AGGREGATE",
            aggregate,
            profileTypeFieldId: numberField.id,
            profileTypeId: profileType.id,
            items: [
              {
                color: "#FF0000",
                label: "HIGH RISK",
                filter: {
                  status: ["OPEN", "CLOSED"],
                  values: {
                    profileTypeFieldId: riskSelectField.id,
                    operator: "EQUAL",
                    value: "HIGH",
                  },
                },
              },
              {
                color: "#FF0000",
                label: "MEDIUM RISK",
                filter: {
                  status: ["OPEN", "CLOSED"],
                  values: {
                    profileTypeFieldId: riskSelectField.id,
                    operator: "EQUAL",
                    value: "MEDIUM",
                  },
                },
              },
              {
                color: "#FF0000",
                label: "LOW RISK",
                filter: {
                  status: ["OPEN", "CLOSED"],
                  values: {
                    profileTypeFieldId: riskSelectField.id,
                    operator: "EQUAL",
                    value: "LOW",
                  },
                },
              },
            ],
          }),
        ).rejects.toThrow();
      }
    });
  });
});
