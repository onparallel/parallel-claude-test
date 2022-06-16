import { parseContactList } from "../helpers/parseContactList";
import { faker } from "@faker-js/faker";
import { range } from "remeda";
describe("parseContactList", () => {
  it("parses a list of contacts", async () => {
    const list = range(0, 10).map((i) => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email(firstName, lastName, i === 0 ? "fake.com" : "test.com");
      return [firstName, lastName, email];
    });

    const [error, contacts] = await parseContactList(
      [["first name", "last name", "email"], ...list],
      {
        validateEmail: async (email) => email.endsWith("test.com"),
      }
    );

    expect(error).toBeDefined();
    expect(error).toHaveLength(1);
    expect(contacts).toHaveLength(9);
  });
});
