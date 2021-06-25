import * as faker from "faker";
import { createContact, createRandomContact } from "../helpers/contacts";
import { createTestSession } from "../helpers/createTestSession";
import { login } from "../helpers/login";
import { user1 } from "../helpers/users";

createTestSession("contacts", (context) => {
  describe("Creating a new contact", () => {
    it("should create a contact", async () => {
      await login(context.page, user1);
      expect(context.page.url()).toMatch(/\/app\/petitions$/);

      const contact = createRandomContact();
      await createContact(context.page, contact);

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
