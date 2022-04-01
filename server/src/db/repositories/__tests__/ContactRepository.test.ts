import { Container } from "inversify";
import { Knex } from "knex";
import { isDefined } from "remeda";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import { KNEX } from "../../knex";
import { Contact, Organization } from "../../__types";
import { ContactRepository } from "../ContactRepository";
import { Mocks } from "./mocks";

describe("repositories/ContactRepository", () => {
  let container: Container;
  let knex: Knex;
  let c: ContactRepository;

  let orgs: Organization[];
  let mocks: Mocks;

  beforeAll(async () => {
    container = createTestContainer();
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
      const result = await c.loadContactByEmail(
        { orgId: orgs[0].id, email: "contact.0@onparallel.com" },
        { cache: false }
      );
      expect(result).toMatchObject({
        org_id: orgs[0].id,
        email: "contact.0@onparallel.com",
      });
    });

    test("gets multiple contacts", async () => {
      const result = await c.loadContactByEmail(
        [
          { orgId: orgs[0].id, email: "contact.0@onparallel.com" },
          { orgId: orgs[1].id, email: "contact.0@onparallel.com" },
          { orgId: orgs[1].id, email: "contact.1@onparallel.com" },
          { orgId: orgs[1].id, email: "contact.2@onparallel.com" },
        ],
        { cache: false }
      );
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
        contacts.every((c) => c.email !== "" && c.first_name !== "" && c.last_name !== "")
      ).toEqual(true);

      await c.anonymizeDeletedContacts(0);

      const contactsAfter = (await c.loadContact(contacts.map((c) => c.id))).filter(isDefined);

      expect(contactsAfter.length).toEqual(contacts.length);

      expect(
        contactsAfter.every(
          (c) =>
            c.anonymized_at !== null && c.email === "" && c.first_name === "" && c.last_name === ""
        )
      ).toEqual(true);
    });
  });
});
