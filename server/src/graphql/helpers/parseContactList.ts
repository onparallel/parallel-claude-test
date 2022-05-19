export type ExcelParsingError = {
  message: string;
  row: number;
  column: number;
};

type ParsedContact = {
  firstName: string;
  lastName?: string;
  email: string;
};

export async function parseContactList(
  data: string[][],
  options: {
    validateEmail: (email: string) => Promise<boolean>;
  }
): Promise<[ExcelParsingError[] | undefined, ParsedContact[]]> {
  const errors = [] as ExcelParsingError[];

  // first row is column headers
  const dataSliced = data.slice(1);

  const parsedContacts = [] as ParsedContact[];

  for (let index = 0; index < dataSliced.length; index++) {
    let rowHasError = false;
    const row = dataSliced[index];
    // empty rows are ignored
    if (!row.some((c) => !!c)) continue;

    // the columns are parsed to ParsedContact and the possible errors are stored with their row and column
    const firstName = row[0]?.trim();
    if (!firstName) {
      rowHasError = true;
      errors.push({ message: "First name is required", row: index + 2, column: 1 });
    }
    const lastName = row[1]?.trim();
    const email = row[2]?.trim().toLowerCase();
    if (!(await options.validateEmail(email))) {
      rowHasError = true;
      errors.push({ message: `${email} is not a valid email`, row: index + 2, column: 3 });
    }

    // we add the new contact to the cumulative array
    if (!rowHasError) {
      parsedContacts.push({ firstName, lastName, email });
    }
  }

  return [errors.length ? errors : undefined, parsedContacts];
}
