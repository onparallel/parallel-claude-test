import faker from "faker";
import { Knex } from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, OrgIntegration, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { deleteAllData } from "../../util/knexUtils";
import { random } from "../../util/token";
import { WhitelistedError } from "../helpers/errors";
import { emailDomainIsNotSSO } from "../helpers/validators/emailDomainIsNotSSO";
import { validPassword } from "../helpers/validators/validPassword";
import { validRemindersConfig } from "../helpers/validators/validRemindersConfig";
import { validSignatureConfig } from "../helpers/validators/validSignatureConfig";

describe("GraphQL custom validators", () => {
  let knex: Knex;
  let ctx: ApiContext;
  let organizations: Organization[];
  let users: User[];
  let mocks: Mocks;

  let signatureIntegration: OrgIntegration;
  let org1SignatureIntegration: OrgIntegration;
  let ssoIntegration: OrgIntegration;

  beforeAll(async () => {
    const container = createTestContainer();
    knex = container.get<Knex>(KNEX);
    ctx = container.get<ApiContext>(ApiContext);
    mocks = new Mocks(knex);

    await deleteAllData(knex);

    organizations = await mocks.createRandomOrganizations(2);
    users = [
      ...(await mocks.createRandomUsers(organizations[0].id, 1)),
      ...(await mocks.createRandomUsers(organizations[1].id, 1)),
    ];

    signatureIntegration = await mocks.createOrgIntegration({
      type: "SIGNATURE",
      provider: "SIGNATURIT",
      org_id: organizations[0].id,
      settings: { API_KEY: "<APIKEY>" },
      is_enabled: true,
    });
    org1SignatureIntegration = await mocks.createOrgIntegration({
      type: "SIGNATURE",
      provider: "SIGNATURIT",
      org_id: organizations[1].id,
      settings: { API_KEY: "<APIKEY>" },
      is_enabled: true,
    });
    ssoIntegration = await mocks.createOrgIntegration({
      type: "USER_PROVISIONING",
      provider: "AZURE",
      org_id: organizations[0].id,
      settings: { AUTH_KEY: "<KEY>" },
      is_enabled: true,
    });
  });

  afterAll(async () => {
    await knex.destroy();
  });

  describe("emailDomainIsNotSSO", () => {
    beforeAll(async () => {
      await knex.from<OrgIntegration>("org_integration").insert([
        {
          is_enabled: true,
          org_id: organizations[0].id,
          provider: "AZURE",
          type: "SSO",
          settings: { EMAIL_DOMAINS: ["ssodomain.com"] },
        },
        {
          is_enabled: false,
          org_id: organizations[1].id,
          provider: "AZURE",
          type: "SSO",
          settings: { EMAIL_DOMAINS: ["disabledsso.com"] },
        },
      ]);
    });

    it("should not throw error if there is no integration on the domain", async () => {
      await expect(
        emailDomainIsNotSSO((args) => args.email)(
          {},
          { email: "mariano@onparallel.com" },
          ctx,
          {} as any
        )
      ).resolves.not.toThrowError();
    });

    it("should throw error if domain is registered as SSO", async () => {
      await expect(
        emailDomainIsNotSSO((args) => args.email)(
          {},
          { email: "mariano@ssodomain.com" },
          ctx,
          {} as any
        )
      ).rejects.toThrowError(
        new WhitelistedError("Email domain has a SSO provider enabled.", "SSO_DOMAIN_ENABLED_ERROR")
      );
    });

    it("should not throw error if integration is disabled", async () => {
      await expect(
        emailDomainIsNotSSO((args) => args.email)(
          {},
          { email: "mariano@disabledsso.com" },
          ctx,
          {} as any
        )
      ).resolves.not.toThrowError();
    });
  });

  describe("validPassword", () => {
    it("throws error if not passing password", () => {
      expect(() =>
        validPassword((args) => args.password)({}, { password: null }, ctx, {} as any)
      ).toThrowError();
    });

    it("throws error if password has less than 8 chars", () => {
      expect(() =>
        validPassword((args) => args.password)({}, { password: "1abcDEF" }, ctx, {} as any)
      ).toThrowError();
    });

    it("throws error if password does not contain lowercases", () => {
      expect(() =>
        validPassword((args) => args.password)(
          {},
          { password: random(20).toUpperCase() },
          ctx,
          {} as any
        )
      ).toThrowError();
    });

    it("throws error if password does not contain uppercases", () => {
      expect(() =>
        validPassword((args) => args.password)(
          {},
          { password: random(20).toLowerCase() },
          ctx,
          {} as any
        )
      ).toThrowError();
    });

    it("throws error if password does not contain numbers", () => {
      expect(() =>
        validPassword((args) => args.password)(
          {},
          { password: "lYWicILeaDOnoMpARdOWAcHeroeKiN" },
          ctx,
          {} as any
        )
      ).toThrowError();
    });

    it("validates a password", () => {
      expect(() =>
        validPassword((args) => args.password)(
          {},
          { password: random(10).toLowerCase().concat(random(10).toUpperCase(), "12345") },
          ctx,
          {} as any
        )
      ).not.toThrowError();
    });
  });

  describe("validSignatureConfig", () => {
    beforeAll(async () => {
      await mocks.createFeatureFlags([{ name: "PETITION_SIGNATURE", default_value: false }]);
      await knex.from("feature_flag_override").insert([
        { feature_flag_name: "PETITION_SIGNATURE", user_id: users[0].id, value: true },
        { feature_flag_name: "PETITION_SIGNATURE", user_id: users[1].id, value: false },
      ]);

      await knex.from("org_integration").insert(
        [
          {
            is_enabled: true,
            org_id: organizations[0].id,
            provider: "SIGNATURIT",
            type: "SIGNATURE",
            settings: {},
          },
          {
            is_enabled: false,
            org_id: organizations[1].id,
            provider: "SIGNATURIT",
            type: "SIGNATURE",
            settings: {},
          },
        ],
        "*"
      );
    });

    it("validates the signature configuration", async () => {
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: toGlobalId("OrgIntegration", signatureIntegration.id),
              signersInfo: [
                {
                  firstName: faker.name.firstName(),
                  lastName: faker.name.lastName(),
                  email: faker.internet.email(),
                },
              ],
              timezone: "Europe/Madrid",
              title: "sign this!",
              letRecipientsChooseSigners: false,
              review: false,
            },
          },
          { ...ctx, user: users[0] },
          {} as any
        )
      ).resolves.not.toThrowError();
    });

    it("throws error if used integration is of another organization", async () => {
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: toGlobalId("OrgIntegration", org1SignatureIntegration.id),
              signersInfo: [
                {
                  firstName: faker.name.firstName(),
                  lastName: faker.name.lastName(),
                  email: faker.internet.email(),
                },
              ],
              timezone: "Europe/Madrid",
              title: "sign this!",
              letRecipientsChooseSigners: false,
              review: false,
            },
          },
          { ...ctx, user: users[0] },
          {} as any
        )
      ).rejects.toThrowError();
    });

    it("throws error if used integration is not of type SIGNATURE", async () => {
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: toGlobalId("OrgIntegration", ssoIntegration.id),
              signersInfo: [
                {
                  firstName: faker.name.firstName(),
                  lastName: faker.name.lastName(),
                  email: faker.internet.email(),
                },
              ],
              timezone: "Europe/Madrid",
              title: "sign this!",
              letRecipientsChooseSigners: false,
              review: false,
            },
          },
          { ...ctx, user: users[0] },
          {} as any
        )
      ).rejects.toThrowError();
    });

    it("throws error if some signer email is not valid", async () => {
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: toGlobalId("OrgIntegration", signatureIntegration.id),
              signersInfo: [
                {
                  firstName: faker.name.firstName(),
                  lastName: faker.name.lastName(),
                  email: faker.internet.email(),
                },
                {
                  firstName: faker.name.firstName(),
                  lastName: faker.name.lastName(),
                  email: "invalidemail",
                },
              ],
              timezone: "Europe/Madrid",
              title: "sign this!",
              letRecipientsChooseSigners: false,
              review: false,
            },
          },
          { ...ctx, user: users[0] },
          {} as any
        )
      ).rejects.toThrowError();
    });

    it("throws error if user does not have signature feature flag", async () => {
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: toGlobalId("OrgIntegration", signatureIntegration.id),
              signersInfo: [],
              timezone: "Europe/Madrid",
              title: "sign this!",
              letRecipientsChooseSigners: true,
              review: false,
            },
          },
          { ...ctx, user: users[1] },
          {} as any
        )
      ).rejects.toThrowError();
    });

    it("throws error if user does not have an enabled signature integration", async () => {
      await knex
        .from("feature_flag_override")
        .where({ user_id: users[1].id, feature_flag_name: "PETITION_SIGNATURE" })
        .update("value", true);
      await knex
        .from("org_integration")
        .where("id", org1SignatureIntegration.id)
        .update("is_enabled", false);
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: toGlobalId("OrgIntegration", org1SignatureIntegration.id),
              signersInfo: [],
              timezone: "Europe/Madrid",
              title: "sign this!",
              letRecipientsChooseSigners: true,
              review: false,
            },
          },
          { ...ctx, user: users[1] },
          {} as any
        )
      ).rejects.toThrowError();
      await knex
        .from("feature_flag_override")
        .where({ user_id: users[1].id, feature_flag_name: "PETITION_SIGNATURE" })
        .update("value", false);
      await knex
        .from("org_integration")
        .where("id", org1SignatureIntegration.id)
        .update("is_enabled", true);
    });

    it("throws error if timezone is invalid", async () => {
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: toGlobalId("OrgIntegration", signatureIntegration.id),
              signersInfo: [
                {
                  firstName: faker.name.firstName(),
                  lastName: faker.name.lastName(),
                  email: faker.internet.email(),
                },
              ],
              timezone: "unknown",
              title: "sign this!",
              letRecipientsChooseSigners: false,
              review: false,
            },
          },
          { ...ctx, user: users[0] },
          {} as any
        )
      ).rejects.toThrowError();
    });

    it("throws error if title is not defined", async () => {
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: toGlobalId("OrgIntegration", signatureIntegration.id),
              signersInfo: [
                {
                  firstName: faker.name.firstName(),
                  lastName: faker.name.lastName(),
                  email: faker.internet.email(),
                },
              ],
              timezone: "Europe/Madrid",
              letRecipientsChooseSigners: false,
              review: false,
            },
          },
          { ...ctx, user: users[0] },
          {} as any
        )
      ).rejects.toThrowError();
    });

    it("throws error if user didn't specify signers and recipient is not allowed to choose", async () => {
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: toGlobalId("OrgIntegration", signatureIntegration.id),
              signersInfo: [],
              timezone: "Europe/Madrid",
              title: "sign this!",
              letRecipientsChooseSigners: false,
              review: false,
            },
          },
          { ...ctx, user: users[0] },
          {} as any
        )
      ).rejects.toThrowError();
    });
  });

  describe("validRemindersConfig", () => {
    it("validates the reminders configuration", () => {
      expect(() =>
        validRemindersConfig((args) => args.config, "config")(
          {},
          {
            config: {
              offset: 2,
              time: "09:30",
              timezone: "Europe/Madrid",
              weekdaysOnly: false,
            },
          },
          ctx,
          {} as any
        )
      ).not.toThrowError();
    });

    it("throws error if passing invalid time", () => {
      expect(() =>
        validRemindersConfig((args) => args.config, "config")(
          {},
          {
            config: {
              offset: 1,
              time: "50:10",
              timezone: "Europe/Madrid",
              weekdaysOnly: false,
            },
          },
          ctx,
          {} as any
        )
      ).toThrowError();
    });

    it("throws error if passing invalid timezone", () => {
      expect(() =>
        validRemindersConfig((args) => args.config, "config")(
          {},
          {
            config: {
              offset: 1,
              time: "10:10",
              timezone: "invalid",
              weekdaysOnly: false,
            },
          },
          ctx,
          {} as any
        )
      ).toThrowError();
    });

    it("throws error if passing offset less than 1", () => {
      expect(() =>
        validRemindersConfig((args) => args.config, "config")(
          {},
          {
            config: {
              offset: 0,
              time: "10:10",
              timezone: "Europe/Madrid",
              weekdaysOnly: false,
            },
          },
          ctx,
          {} as any
        )
      ).toThrowError();
    });
  });
});
