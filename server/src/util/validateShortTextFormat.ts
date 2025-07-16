import { isValid as validIban } from "iban";
import { validCIF, validDNI, validNIE } from "spain-id";
import { isValidEmail } from "../graphql/helpers/validators/validEmail";

export function validateShortTextFormat(value: string, format: string) {
  switch (format) {
    case "EMAIL":
      return isValidEmail(value);
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
