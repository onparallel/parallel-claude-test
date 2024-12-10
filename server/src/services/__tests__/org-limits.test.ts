import { Duration, subMonths } from "date-fns";
import { Container } from "inversify";
import { Knex } from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { KNEX } from "../../db/knex";
import { OrganizationUsageDetails } from "../../db/repositories/OrganizationRepository";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { deleteAllData } from "../../util/knexUtils";
import { IOrgLimitsService, ORG_LIMITS_SERVICE } from "../OrgLimitsService";

describe("OrgLimitsService", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;

  let orgLimitsService: IOrgLimitsService;

  beforeAll(async () => {
    container = createTestContainer();
    knex = container.get(KNEX);
    mocks = new Mocks(knex);
    orgLimitsService = container.get<IOrgLimitsService>(ORG_LIMITS_SERVICE);
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  describe("renewExpiredOrganizationUsageLimits", () => {
    function duration(duration: Duration) {
      return {
        years: duration.years ?? 0,
        months: duration.months ?? 0,
        days: duration.days ?? 0,
        hours: duration.hours ?? 0,
        minutes: duration.minutes ?? 0,
        seconds: duration.seconds ?? 0,
      };
    }

    afterEach(async () => {
      await mocks.knex.from("organization_usage_limit").delete();
    });

    it("renews expired PETITION_SEND usage limits where used < limit", async () => {
      const [organization] = await mocks.createRandomOrganizations(1, () => ({
        usage_details: {
          PETITION_SEND: { limit: 200, duration: { months: 1 }, renewal_cycles: null },
        },
      }));

      const startDate = subMonths(new Date(), 1);
      await mocks.knex.from("organization_usage_limit").insert({
        org_id: organization.id,
        limit_name: "PETITION_SEND",
        limit: 100,
        used: 5,
        period: mocks.interval({ months: 1 }),
        period_start_date: startDate,
        cycle_number: 1,
      });

      await orgLimitsService.renewOrganizationUsageLimits("TEST");

      const dbLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", organization.id)
        .orderBy("id", "asc")
        .select("*");

      expect(dbLimits).toHaveLength(2);

      expect(dbLimits).toMatchObject([
        {
          limit_name: "PETITION_SEND",
          limit: 100,
          used: 5,
          period: duration({ months: 1 }),
          period_start_date: startDate,
          period_end_date: expect.any(Date),
          cycle_number: 1,
        },
        {
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 0,
          period: duration({ months: 1 }),
          period_start_date: dbLimits[0].period_end_date,
          period_end_date: null,
          cycle_number: 2,
        },
      ]);
    });

    it("renews expired PETITION_SEND usage limits where used > limit", async () => {
      const [organization] = await mocks.createRandomOrganizations(1, () => ({
        usage_details: {
          PETITION_SEND: { limit: 250, duration: { months: 1, days: 12 }, renewal_cycles: null },
        },
      }));

      const startDate = subMonths(new Date(), 1);
      await mocks.knex.from("organization_usage_limit").insert({
        org_id: organization.id,
        limit_name: "PETITION_SEND",
        limit: 100,
        used: 138,
        period: mocks.interval({ months: 1 }),
        period_start_date: startDate,
        cycle_number: 1,
      });

      await orgLimitsService.renewOrganizationUsageLimits("TEST");

      const dbLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", organization.id)
        .orderBy("id", "asc")
        .select("*");

      expect(dbLimits).toHaveLength(2);

      expect(dbLimits).toMatchObject([
        {
          limit_name: "PETITION_SEND",
          limit: 100,
          used: 100,
          period: duration({ months: 1 }),
          period_start_date: startDate,
          period_end_date: expect.any(Date),
          cycle_number: 1,
        },
        {
          limit_name: "PETITION_SEND",
          limit: 250,
          used: 38,
          period: duration({ months: 1, days: 12 }),
          period_start_date: dbLimits[0].period_end_date,
          period_end_date: null,
          cycle_number: 2,
        },
      ]);
    });

    it("renews expired SIGNATURIT_SHARED_APIKEY usage limits where used === limit", async () => {
      const [organization] = await mocks.createRandomOrganizations(1, () => ({
        usage_details: {
          PETITION_SEND: { limit: 200, duration: { months: 1 }, renewal_cycles: null },
          SIGNATURIT_SHARED_APIKEY: { limit: 300, duration: { years: 1 }, renewal_cycles: 4 },
        },
      }));

      const startDate = subMonths(new Date(), 13);
      await mocks.knex.from("organization_usage_limit").insert({
        org_id: organization.id,
        limit_name: "SIGNATURIT_SHARED_APIKEY",
        limit: 100,
        used: 100,
        period: mocks.interval({ years: 1 }),
        period_start_date: startDate,
        cycle_number: 3,
      });

      await orgLimitsService.renewOrganizationUsageLimits("TEST");

      const dbLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", organization.id)
        .orderBy("id", "asc")
        .select("*");

      expect(dbLimits).toHaveLength(2);

      expect(dbLimits).toMatchObject([
        {
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 100,
          used: 100,
          period: duration({ years: 1 }),
          period_start_date: startDate,
          period_end_date: expect.any(Date),
          cycle_number: 3,
        },
        {
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 300,
          used: 0,
          period: duration({ years: 1 }),
          period_start_date: dbLimits[0].period_end_date,
          period_end_date: null,
          cycle_number: 4,
        },
      ]);
    });

    it("renews expired SIGNATURIT_SHARED_APIKEY usage limits where used > limit", async () => {
      const [organization] = await mocks.createRandomOrganizations(1, () => ({
        usage_details: {
          SIGNATURIT_SHARED_APIKEY: { limit: 50, duration: { days: 12 } },
        },
      }));

      const startDate = subMonths(new Date(), 1);
      await mocks.knex.from("organization_usage_limit").insert({
        org_id: organization.id,
        limit_name: "SIGNATURIT_SHARED_APIKEY",
        limit: 100,
        used: 235,
        period: mocks.interval({ months: 1 }),
        period_start_date: startDate,
        cycle_number: 3,
      });

      await orgLimitsService.renewOrganizationUsageLimits("TEST");

      const dbLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", organization.id)
        .orderBy("id", "asc")
        .select("*");

      expect(dbLimits).toHaveLength(2);

      expect(dbLimits).toMatchObject([
        {
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 100,
          used: 100,
          period: duration({ months: 1 }),
          period_start_date: startDate,
          period_end_date: expect.any(Date),
          cycle_number: 3,
        },
        {
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 50,
          used: 135,
          period: duration({ days: 12 }),
          period_start_date: dbLimits[0].period_end_date,
          period_end_date: null,
          cycle_number: 4,
        },
      ]);
    });

    it("does not downgrade SIGNATURIT_SHARED_APIKEY limit to free tier when renewal_cycles ends", async () => {
      const [organization] = await mocks.createRandomOrganizations(1, () => ({
        usage_details: {
          SIGNATURIT_SHARED_APIKEY: { limit: 50, duration: { months: 1 }, renewal_cycles: 3 },
        },
      }));

      const startDate = subMonths(new Date(), 1);
      await mocks.knex.from("organization_usage_limit").insert({
        org_id: organization.id,
        limit_name: "SIGNATURIT_SHARED_APIKEY",
        limit: 100,
        used: 235,
        period: mocks.interval({ months: 1 }),
        period_start_date: startDate,
        cycle_number: 3,
      });

      await orgLimitsService.renewOrganizationUsageLimits("TEST");

      const dbLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", organization.id)
        .orderBy("id", "asc")
        .select("*");

      expect(dbLimits).toHaveLength(1);

      expect(dbLimits).toMatchObject([
        {
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 100,
          used: 235,
          period: duration({ months: 1 }),
          period_start_date: startDate,
          period_end_date: expect.any(Date),
          cycle_number: 3,
        },
      ]);
    });

    it("downgrades expired PETITION_SEND usage limits", async () => {
      const [organization] = await mocks.createRandomOrganizations(1, () => ({
        usage_details: {}, // no renewal
      }));

      const startDate = subMonths(new Date(), 1);
      await mocks.knex.from("organization_usage_limit").insert([
        {
          org_id: organization.id,
          limit_name: "PETITION_SEND",
          limit: 100,
          used: 10,
          period: mocks.interval({ months: 1 }),
          period_start_date: subMonths(startDate, 1),
          period_end_date: startDate,
          cycle_number: 2,
        },
        {
          org_id: organization.id,
          limit_name: "PETITION_SEND",
          limit: 100,
          used: 100,
          period: mocks.interval({ months: 1 }),
          period_start_date: startDate,
          cycle_number: 3,
        },
      ]);

      await orgLimitsService.renewOrganizationUsageLimits("TEST");

      const dbLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", organization.id)
        .orderBy("id", "asc")
        .select("*");

      expect(dbLimits).toHaveLength(3);

      expect(dbLimits).toMatchObject([
        {
          org_id: organization.id,
          limit_name: "PETITION_SEND",
          limit: 100,
          used: 10,
          period: duration({ months: 1 }),
          period_start_date: subMonths(startDate, 1),
          period_end_date: startDate,
          cycle_number: 2,
        },
        {
          limit_name: "PETITION_SEND",
          limit: 100,
          used: 100,
          period: duration({ months: 1 }),
          period_start_date: startDate,
          period_end_date: expect.any(Date),
          cycle_number: 3,
        },
        {
          limit_name: "PETITION_SEND",
          limit: 20,
          used: 0,
          period: duration({ months: 1 }),
          period_start_date: dbLimits[1].period_end_date,
          period_end_date: null,
          cycle_number: 1,
        },
      ]);

      const [updatedOrg] = await mocks.knex
        .from("organization")
        .where("id", organization.id)
        .select("*");

      expect(updatedOrg.usage_details).toEqual({
        PETITION_SEND: {
          limit: 20,
          duration: { months: 1 },
        },
      });
    });

    it("downgrades PETITION_SEND limit to free tier because renewal_cycles ended", async () => {
      const [organization] = await mocks.createRandomOrganizations(1, () => ({
        usage_details: {
          PETITION_SEND: { limit: 200, duration: { months: 1 }, renewal_cycles: 3 },
          SIGNATURIT_SHARED_APIKEY: { limit: 100, duration: { months: 2 } },
        },
      }));

      const startDate = subMonths(new Date(), 1);
      await mocks.knex.from("organization_usage_limit").insert({
        org_id: organization.id,
        limit_name: "PETITION_SEND",
        limit: 100,
        used: 5,
        period: mocks.interval({ months: 1 }),
        period_start_date: startDate,
        cycle_number: 3,
      });

      await orgLimitsService.renewOrganizationUsageLimits("TEST");

      const dbLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", organization.id)
        .orderBy("id", "asc")
        .select("*");

      expect(dbLimits).toHaveLength(2);

      expect(dbLimits).toMatchObject([
        {
          limit_name: "PETITION_SEND",
          limit: 100,
          used: 5,
          period: duration({ months: 1 }),
          period_start_date: startDate,
          period_end_date: expect.any(Date),
          cycle_number: 3,
        },
        {
          limit_name: "PETITION_SEND",
          limit: 20,
          used: 0,
          period: duration({ months: 1 }),
          period_start_date: dbLimits[0].period_end_date,
          period_end_date: null,
          cycle_number: 1,
        },
      ]);

      const [updatedOrg] = await mocks.knex
        .from("organization")
        .where("id", organization.id)
        .select("*");

      expect(updatedOrg.usage_details).toEqual({
        PETITION_SEND: {
          limit: 20,
          duration: { months: 1 },
        },
        SIGNATURIT_SHARED_APIKEY: { limit: 100, duration: { months: 2 } },
      });
    });

    it("renews limits for a lot of organizations at once", async () => {
      const orgUsageDetails: OrganizationUsageDetails[] = [
        {
          USER_LIMIT: 100,
          // renew both
          PETITION_SEND: { limit: 200, duration: { months: 1 }, renewal_cycles: null },
          SIGNATURIT_SHARED_APIKEY: { limit: 100, duration: { months: 2 } },
        },
        {
          // renew only PETITION_SEND
          USER_LIMIT: 100,
          PETITION_SEND: { limit: 200, duration: { months: 3 }, renewal_cycles: null },
        },
        {
          // renew SIGNATURIT, downgrade PETITION_SEND
          USER_LIMIT: 100,
          PETITION_SEND: { limit: 200, duration: { months: 3 }, renewal_cycles: 1 },
          SIGNATURIT_SHARED_APIKEY: { limit: 100, duration: { years: 1 }, renewal_cycles: 3 },
        },
        {
          // downgrade PETITION_SEND
          USER_LIMIT: 100,
          PETITION_SEND: { limit: 200, duration: { months: 3 }, renewal_cycles: 2 },
          SIGNATURIT_SHARED_APIKEY: { limit: 100, duration: { months: 2 }, renewal_cycles: 2 },
        },
      ];
      const orgs = await mocks.createRandomOrganizations(4, (i) => ({
        usage_details: orgUsageDetails[i],
      }));

      const baseDate = new Date();

      await mocks.knex.from("organization_usage_limit").insert([
        {
          org_id: orgs[0].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 200,
          period: mocks.interval({ months: 1 }),
          period_start_date: subMonths(baseDate, 2),
          period_end_date: subMonths(baseDate, 1),
          cycle_number: 1,
        },
        {
          org_id: orgs[0].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 203,
          period: mocks.interval({ months: 1 }),
          period_start_date: subMonths(baseDate, 1),
          period_end_date: null,
          cycle_number: 2,
        },
        {
          org_id: orgs[0].id,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 200,
          used: 30,
          period: mocks.interval({ months: 2 }),
          period_start_date: subMonths(baseDate, 2),
          period_end_date: null,
          cycle_number: 30,
        },
        {
          org_id: orgs[1].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 203,
          period: mocks.interval({ months: 3 }),
          period_start_date: subMonths(baseDate, 3),
          period_end_date: null,
          cycle_number: 1,
        },
        {
          org_id: orgs[1].id,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 200,
          used: 203,
          period: mocks.interval({ months: 2 }),
          period_start_date: subMonths(baseDate, 2),
          period_end_date: null,
          cycle_number: 30,
        },
        {
          org_id: orgs[2].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 150,
          period: mocks.interval({ months: 3 }),
          period_start_date: subMonths(baseDate, 3),
          period_end_date: null,
          cycle_number: 1,
        },
        {
          org_id: orgs[2].id,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 200,
          used: 30,
          period: mocks.interval({ months: 2 }),
          period_start_date: subMonths(baseDate, 2),
          period_end_date: null,
          cycle_number: 2,
        },
        {
          org_id: orgs[3].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 150,
          period: mocks.interval({ months: 3 }),
          period_start_date: subMonths(baseDate, 3),
          period_end_date: null,
          cycle_number: 2,
        },
        {
          org_id: orgs[3].id,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 200,
          used: 300,
          period: mocks.interval({ months: 2 }),
          period_start_date: subMonths(baseDate, 2),
          period_end_date: null,
          cycle_number: 2,
        },
      ]);

      await orgLimitsService.renewOrganizationUsageLimits("TEST");

      const org0Limits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", orgs[0].id)
        .orderBy([
          { column: "limit_name", order: "asc" },
          { column: "period_end_date", order: "asc", nulls: "last" },
        ])
        .select("*");

      expect(org0Limits).toMatchObject([
        {
          org_id: orgs[0].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 200,
          period: duration({ months: 1 }),
          period_start_date: subMonths(baseDate, 2),
          period_end_date: subMonths(baseDate, 1),
          cycle_number: 1,
        },
        {
          org_id: orgs[0].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 200,
          period: duration({ months: 1 }),
          period_start_date: subMonths(baseDate, 1),
          period_end_date: expect.any(Date),
          cycle_number: 2,
        },
        {
          org_id: orgs[0].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 3,
          period: duration({ months: 1 }),
          period_start_date: org0Limits[1].period_end_date,
          period_end_date: null,
          cycle_number: 3,
        },
        {
          org_id: orgs[0].id,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 200,
          used: 30,
          period: duration({ months: 2 }),
          period_start_date: subMonths(baseDate, 2),
          period_end_date: expect.any(Date),
          cycle_number: 30,
        },
        {
          org_id: orgs[0].id,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 100,
          used: 0,
          period: duration({ months: 2 }),
          period_start_date: org0Limits[3].period_end_date,
          period_end_date: null,
          cycle_number: 31,
        },
      ]);

      const org1Limits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", orgs[1].id)
        .orderBy([
          { column: "limit_name", order: "asc" },
          { column: "period_end_date", order: "asc", nulls: "last" },
        ])
        .select("*");

      expect(org1Limits).toMatchObject([
        {
          org_id: orgs[1].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 200,
          period: duration({ months: 3 }),
          period_start_date: subMonths(baseDate, 3),
          period_end_date: expect.any(Date),
          cycle_number: 1,
        },
        {
          org_id: orgs[1].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 3,
          period: duration({ months: 3 }),
          period_start_date: org1Limits[0].period_end_date,
          period_end_date: null,
          cycle_number: 2,
        },
        {
          org_id: orgs[1].id,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 200,
          used: 203,
          period: duration({ months: 2 }),
          period_start_date: subMonths(baseDate, 2),
          period_end_date: expect.any(Date),
          cycle_number: 30,
        },
      ]);

      const org2Limits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", orgs[2].id)
        .orderBy([
          { column: "limit_name", order: "asc" },
          { column: "period_end_date", order: "asc", nulls: "last" },
        ])
        .select("*");

      expect(org2Limits).toMatchObject([
        {
          org_id: orgs[2].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 150,
          period: duration({ months: 3 }),
          period_start_date: subMonths(baseDate, 3),
          period_end_date: expect.any(Date),
          cycle_number: 1,
        },
        {
          org_id: orgs[2].id,
          limit_name: "PETITION_SEND",
          limit: 20,
          used: 0,
          period: duration({ months: 1 }),
          period_start_date: org2Limits[0].period_end_date,
          period_end_date: null,
          cycle_number: 1,
        },
        {
          org_id: orgs[2].id,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 200,
          used: 30,
          period: duration({ months: 2 }),
          period_start_date: subMonths(baseDate, 2),
          period_end_date: expect.any(Date),
          cycle_number: 2,
        },
        {
          org_id: orgs[2].id,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 100,
          used: 0,
          period: duration({ years: 1 }),
          period_start_date: org2Limits[2].period_end_date,
          period_end_date: null,
          cycle_number: 3,
        },
      ]);

      const org3Limits = await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", orgs[3].id)
        .orderBy([
          { column: "limit_name", order: "asc" },
          { column: "period_end_date", order: "asc", nulls: "last" },
        ])
        .select("*");

      expect(org3Limits).toMatchObject([
        {
          org_id: orgs[3].id,
          limit_name: "PETITION_SEND",
          limit: 200,
          used: 150,
          period: duration({ months: 3 }),
          period_start_date: subMonths(baseDate, 3),
          period_end_date: expect.any(Date),
          cycle_number: 2,
        },
        {
          org_id: orgs[3].id,
          limit_name: "PETITION_SEND",
          limit: 20,
          used: 0,
          period: duration({ months: 1 }),
          period_start_date: org3Limits[0].period_end_date,
          period_end_date: null,
          cycle_number: 1,
        },
        {
          org_id: orgs[3].id,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 200,
          used: 300,
          period: duration({ months: 2 }),
          period_start_date: subMonths(baseDate, 2),
          period_end_date: expect.any(Date),
          cycle_number: 2,
        },
      ]);
    });
  });
});
