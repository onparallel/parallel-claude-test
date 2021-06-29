import { EMAIL_REGEX } from "./validators/validEmail";

type ParsedContact = {
  firstName: string;
  lastName?: string;
  email: string;
};

export function parseContactList(data: string[][]): ParsedContact[] {
  return data
    .slice(1) // first row is column headers
    .filter((row) => row.some((c) => !!c))
    .map((row) => {
      const firstName = row[0]?.trim();
      if (!firstName) {
        throw new Error("First name is required");
      }
      const lastName = row[1]?.trim();
      const email = row[2]?.trim().toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        throw new Error(`${email} is not a valid email`);
      }

      return { firstName, lastName, email };
    });
}
