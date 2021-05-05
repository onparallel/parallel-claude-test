import { EMAIL_REGEX } from "./validators/validEmail";

type ParsedContact = {
  firstName: string;
  lastName: string;
  email: string;
};

export function parseContactList(data: string[][]): ParsedContact[] {
  return data
    .slice(1) // first row is column headers
    .filter((row) => row.some((c) => !!c))
    .map((row) => {
      const entry = row.filter((cell) => !!cell);
      if (entry.length !== 3) {
        throw new Error("Not enough data");
      }

      const firstName = entry[0].trim();
      const lastName = entry[1].trim();
      const email = entry[2].trim().toLowerCase();

      if (!EMAIL_REGEX.test(email)) {
        throw new Error(`${email} is not a valid email`);
      }

      return { firstName, lastName, email };
    });
}
