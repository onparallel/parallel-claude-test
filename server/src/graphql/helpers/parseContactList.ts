import { ExcelParsingError } from "./errors";
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
    // empty rows are ignored
    if (!row.some((c) => !!c)) return acc;

    // the columns are parsed to ParsedContact and the possible errors are stored with their row and column
    const firstName = row[0]?.trim();
    if (!firstName) {
      errors.push(new ExcelParsingError("First name is required", index + 2, 1));
    }
    const lastName = row[1]?.trim();
    const email = row[2]?.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errors.push(new ExcelParsingError(`${email} is not a valid email`, index + 2, 3));
    }

    // we add the new contact to the cumulative array
    return [...acc, { firstName, lastName, email }];
  }, [] as ParsedContact[]);

  if (errors.length) {
    throw new AggregateError(errors, errors[0].message);
  }

  return parsedContacts;
}
