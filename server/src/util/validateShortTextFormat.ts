import { isValid as validIban } from "iban";
import { validCIF, validDNI, validNIE } from "spain-id";
import { EMAIL_REGEX } from "../graphql/helpers/validators/validEmail";

export async function validateShortTextFormat(value: string, format: string) {
  switch (format) {
    case "EMAIL":
      return EMAIL_REGEX.test(value);
    case "ES_DNI":
      return validDNI(value) || validNIE(value);
    case "ES_NIF":
      return validCIF(value);
    case "IBAN":
      return validIban(value);
    default:
      return true;
  }
}
