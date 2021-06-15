import * as faker from "faker";
import { createContact } from "../helpers/createContact";
import { createTestSession } from "../helpers/createTestSession";
import { login } from "../helpers/login";
import { user1 } from "../helpers/users";

createTestSession("contacts", (context) => {
  it("should create a contact", async () => {
    const { page } = context;
    await login(page, user1);

    const email = `${faker.datatype.uuid()}@onparallel.com`;
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    await createContact(page, { email, firstName, lastName });

    // Search for created contact
    await page.click("#contacts-reload");
    await page.fill("#contacts-search", email);
    const element = await page.waitForSelector(`text="${email}"`);
    await element.click();
    await page.waitForNavigation();

    const title = await page.title();
    expect(title).toBe(`${firstName} ${lastName} | Parallel`);
  });
});
