import { ExcelParsingError, WhitelistedError } from "./errors";
import { EMAIL_REGEX } from "./validators/validEmail";

type ParsedContact = {
  firstName: string;
  lastName?: string;
  email: string;
};

export function parseContactList(data: string[][]): ParsedContact[] {
  const errors = [] as ExcelParsingError[];

  // first row is column headers
  const parsedContacts = data.slice(1).reduce((acc, row, index) => {
    if (!row.some((c) => !!c)) return acc;

    const firstName = row[0]?.trim();
    if (!firstName) {
      errors.push(new ExcelParsingError("First name is required", index + 2));
    }
    const lastName = row[1]?.trim();
    const email = row[2]?.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errors.push(new ExcelParsingError(`${email} is not a valid email`, index + 2));
    }

    return [...acc, { firstName, lastName, email }];
  }, [] as ParsedContact[]);

  if (errors.length) {
    const rows = errors.flatMap((e) => e.row);
    throw new WhitelistedError(errors[0].message, "INVALID_FORMAT_ERROR", {
      rows,
    });
  }

  return parsedContacts;
}
