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
  const dataSliced = data.slice(1);

  const parsedContacts = [] as ParsedContact[];

  for (let index = 0; index < dataSliced.length; index++) {
    const row = dataSliced[index];
    // empty rows are ignored
    if (!row.some((c) => !!c)) continue;

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
    parsedContacts.push({ firstName, lastName, email });
  }

  if (errors.length) {
    throw new AggregateError(errors, errors[0].message);
  }

  return parsedContacts;
}
