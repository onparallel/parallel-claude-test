import * as faker from "faker";
import { createContact } from "../helpers/createContact";
import { createTestSession } from "../helpers/createTestSession";
import { login } from "../helpers/login";
import { user1 } from "../helpers/users";

createTestSession("contacts", (context) => {
  describe("Creating a new contact", () => {
    it("should login", async () => {
      await login(context.page, user1);
      expect(context.page.url()).toMatch(/\/app\/petitions$/);
    });

    let contact: { email: string; firstName: string; lastName: string };
    it("should create a contact", async () => {
      contact = {
        email: `${faker.datatype.uuid()}@onparallel.com`,
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
      };
      await createContact(context.page, contact);
      return contact;
    });

    it("new contact should be available on search", async () => {
      // Search for created contact
      await context.page.click("#contacts-reload");
      await context.page.type("#contacts-search", contact.email);
      const element = await context.page.waitForSelector(
        `text="${contact.email}"`
      );
      await element.click();
      await context.page.waitForNavigation();
      const title = await context.page.title();
      expect(title).toBe(`${contact.firstName} ${contact.lastName} | Parallel`);
    });
  });
});
