import { Container } from "inversify";
import { Knex } from "knex";
import { pick } from "remeda";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import { Contact, Organization } from "../../__types";
import { KNEX } from "../../knex";
import { ContactRepository } from "../ContactRepository";
import { Mocks } from "./mocks";

describe("repositories/ContactRepository", () => {
  let container: Container;
  let knex: Knex;
  let c: ContactRepository;

  let orgs: Organization[];
  let mocks: Mocks;

  beforeAll(async () => {
    container = await createTestContainer();
    knex = container.get<Knex>(KNEX);
    c = container.get(ContactRepository);
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  beforeAll(async () => {
    await deleteAllData(knex);
    mocks = new Mocks(knex);
    orgs = await mocks.createRandomOrganizations(2);
    await mocks.createRandomContacts(orgs[0].id, 3, (index) => ({
      email: `contact.${index}@onparallel.com`,
      deleted_at: index === 1 ? new Date() : null,
    }));
    await mocks.createRandomContacts(orgs[1].id, 3, (index) => ({
      email: `contact.${index}@onparallel.com`,
      deleted_at: index === 2 ? new Date() : null,
    }));
  });

  describe("loadContactByEmail", () => {
    test("gets the contact from the right org", async () => {
      const result = await c.loadContactByEmail.raw({
        orgId: orgs[0].id,
        email: "contact.0@onparallel.com",
      });
      expect(result).toMatchObject({
        org_id: orgs[0].id,
        email: "contact.0@onparallel.com",
      });
    });

    test("gets multiple contacts", async () => {
      const result = await c.loadContactByEmail.raw([
        { orgId: orgs[0].id, email: "contact.0@onparallel.com" },
        { orgId: orgs[1].id, email: "contact.0@onparallel.com" },
        { orgId: orgs[1].id, email: "contact.1@onparallel.com" },
        { orgId: orgs[1].id, email: "contact.2@onparallel.com" },
      ]);
      expect(result).toMatchObject([
        {
          org_id: orgs[0].id,
          email: "contact.0@onparallel.com",
        },
        {
          org_id: orgs[1].id,
          email: "contact.0@onparallel.com",
        },
        {
          org_id: orgs[1].id,
          email: "contact.1@onparallel.com",
        },
        null,
      ]);
    });
  });

  describe("anonymizeContacts", () => {
    let contacts: Contact[] = [];

    beforeEach(async () => {
      contacts = await mocks.createRandomContacts(orgs[0].id, 4, () => ({
        deleted_at: new Date(),
      }));
    });

    it("anonymizes passed contacts", async () => {
      expect(
        contacts.map(pick(["email", "first_name", "last_name", "deleted_at"])),
      ).toIncludeSameMembers([
        {
          email: expect.any(String),
          first_name: expect.any(String),
          last_name: expect.any(String),
          deleted_at: expect.any(Date),
        },
        {
          email: expect.any(String),
          first_name: expect.any(String),
          last_name: expect.any(String),
          deleted_at: expect.any(Date),
        },
        {
          email: expect.any(String),
          first_name: expect.any(String),
          last_name: expect.any(String),
          deleted_at: expect.any(Date),
        },
        {
          email: expect.any(String),
          first_name: expect.any(String),
          last_name: expect.any(String),
          deleted_at: expect.any(Date),
        },
      ]);

      await c.anonymizeDeletedContacts(0);

      const contactsAfter = await knex
        .from("contact")
        .whereIn(
          "id",
          contacts.map((c) => c.id),
        )
        .select("*");

      expect(
        contactsAfter.map(
          pick(["email", "first_name", "last_name", "deleted_at", "anonymized_at"]),
        ),
      ).toIncludeSameMembers([
        {
          email: "",
          first_name: "",
          last_name: "",
          deleted_at: expect.any(Date),
          anonymized_at: expect.any(Date),
        },
        {
          email: "",
          first_name: "",
          last_name: "",
          deleted_at: expect.any(Date),
          anonymized_at: expect.any(Date),
        },
        {
          email: "",
          first_name: "",
          last_name: "",
          deleted_at: expect.any(Date),
          anonymized_at: expect.any(Date),
        },
        {
          email: "",
          first_name: "",
          last_name: "",
          deleted_at: expect.any(Date),
          anonymized_at: expect.any(Date),
        },
      ]);
    });
  });
});
