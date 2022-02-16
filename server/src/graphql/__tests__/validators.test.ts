import faker from "@faker-js/faker";
import { Knex } from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Contact, Organization, OrgIntegration, User } from "../../db/__types";
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

    organizations = await mocks.createRandomOrganizations(2);
    users = [
      ...(await mocks.createRandomUsers(organizations[0].id, 1)),
      ...(await mocks.createRandomUsers(organizations[1].id, 1)),
    ];

    [signatureIntegration] = await mocks.createOrgIntegration({
      type: "SIGNATURE",
      provider: "SIGNATURIT",
      org_id: organizations[0].id,
      settings: { API_KEY: "<APIKEY>" },
      is_enabled: true,
    });
    [org1SignatureIntegration] = await mocks.createOrgIntegration({
      type: "SIGNATURE",
      provider: "SIGNATURIT",
      org_id: organizations[1].id,
      settings: { API_KEY: "<APIKEY>" },
      is_enabled: true,
    });
    [ssoIntegration] = await mocks.createOrgIntegration({
      type: "USER_PROVISIONING",
      provider: "AZURE",
      org_id: organizations[0].id,
      settings: { AUTH_KEY: "<KEY>" },
      is_enabled: true,
    });
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  describe("emailDomainIsNotSSO", () => {
    beforeAll(async () => {
      await mocks.createOrgIntegration([
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
    let contacts: Contact[];
    beforeAll(async () => {
      await mocks.createFeatureFlags([{ name: "PETITION_SIGNATURE", default_value: false }]);
      await knex.from("feature_flag_override").insert([
        { feature_flag_name: "PETITION_SIGNATURE", user_id: users[0].id, value: true },
        { feature_flag_name: "PETITION_SIGNATURE", user_id: users[1].id, value: false },
      ]);

      await mocks.createOrgIntegration([
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
      ]);
      contacts = await mocks.createRandomContacts(organizations[0].id, 2);
    });

    it("validates the signature configuration", async () => {
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: signatureIntegration.id,
              signersInfo: contacts.map((c) => ({
                firstName: c.first_name,
                lastName: c.last_name,
                email: c.email,
                contactId: c.id,
              })),
              timezone: "Europe/Madrid",
              title: "sign this!",
              allowAdditionalSigners: false,
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
              orgIntegrationId: org1SignatureIntegration.id,
              signersInfo: contacts.map((c) => ({
                firstName: c.first_name,
                lastName: c.last_name,
                email: c.email,
                contactId: c.id,
              })),
              timezone: "Europe/Madrid",
              title: "sign this!",
              allowAdditionalSigners: false,
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
              orgIntegrationId: ssoIntegration.id,
              signersInfo: contacts.map((c) => ({
                firstName: c.first_name,
                lastName: c.last_name,
                email: c.email,
                contactId: c.id,
              })),
              timezone: "Europe/Madrid",
              title: "sign this!",
              allowAdditionalSigners: false,
              review: false,
            },
          },
          { ...ctx, user: users[0] },
          {} as any
        )
      ).rejects.toThrowError();
    });

    it("throws error if timezone is invalid", async () => {
      await expect(
        validSignatureConfig((args) => args.config, "config")(
          {},
          {
            config: {
              orgIntegrationId: signatureIntegration.id,
              signersInfo: contacts.map((c) => ({
                firstName: c.first_name,
                lastName: c.last_name,
                email: c.email,
                contactId: c.id,
              })),
              timezone: "unknown",
              title: "sign this!",
              allowAdditionalSigners: false,
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
              orgIntegrationId: signatureIntegration.id,
              signersInfo: contacts.map((c) => ({
                firstName: c.first_name,
                lastName: c.last_name,
                email: c.email,
                contactId: c.id,
              })),
              timezone: "Europe/Madrid",
              allowAdditionalSigners: false,
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
              orgIntegrationId: signatureIntegration.id,
              signersInfo: [],
              timezone: "Europe/Madrid",
              title: "sign this!",
              allowAdditionalSigners: false,
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
