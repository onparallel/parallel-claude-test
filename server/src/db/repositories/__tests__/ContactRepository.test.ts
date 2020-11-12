import { Container } from "inversify";
import Knex from "knex";
import { createContainer } from "../../../container";
import { deleteAllData } from "../../../util/knexUtils";
import { KNEX } from "../../knex";
import { Organization } from "../../__types";
import { ContactRepository } from "../ContactRepository";
import { Mocks } from "./mocks";

describe("repositories/ContactRepository", () => {
  let container: Container;
  let knex: Knex;
  let c: ContactRepository;

  let orgs: Organization[];

  beforeAll(async () => {
    container = createContainer();
    knex = container.get<Knex>(KNEX);
    c = container.get(ContactRepository);
  });

  afterAll(async () => {
    await knex.destroy();
  });

  describe("loadContactByEmail", () => {
    beforeAll(async () => {
      await deleteAllData(knex);
      const mocks = new Mocks(knex);
      orgs = await mocks.createRandomOrganizations(2);
      await mocks.createRandomContacts(orgs[0].id, 3, (index) => ({
        email: `contact.${index}@parallel.so`,
        deleted_at: index === 1 ? new Date() : null,
      }));
      await mocks.createRandomContacts(orgs[1].id, 3, (index) => ({
        email: `contact.${index}@parallel.so`,
        deleted_at: index === 2 ? new Date() : null,
      }));
    });

    test("gets the contact from the right org", async () => {
      const result = await c.loadContactByEmail(
        { orgId: orgs[0].id, email: "contact.0@parallel.so" },
        { cache: false }
      );
      expect(result).toMatchObject({
        org_id: orgs[0].id,
        email: "contact.0@parallel.so",
      });
    });

    test("gets multiple contacts", async () => {
      const result = await c.loadContactByEmail(
        [
          { orgId: orgs[0].id, email: "contact.0@parallel.so" },
          { orgId: orgs[1].id, email: "contact.0@parallel.so" },
          { orgId: orgs[1].id, email: "contact.1@parallel.so" },
          { orgId: orgs[1].id, email: "contact.2@parallel.so" },
        ],
        { cache: false }
      );
      expect(result).toMatchObject([
        {
          org_id: orgs[0].id,
          email: "contact.0@parallel.so",
        },
        {
          org_id: orgs[1].id,
          email: "contact.0@parallel.so",
        },
        {
          org_id: orgs[1].id,
          email: "contact.1@parallel.so",
        },
        null,
      ]);
    });
  });
});
