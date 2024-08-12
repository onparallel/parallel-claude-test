import { PetitionFieldType } from "../db/__types";

export function isFileTypeField(
  type: PetitionFieldType,
): type is "FILE_UPLOAD" | "ES_TAX_DOCUMENTS" | "DOW_JONES_KYC" | "ID_VERIFICATION" {
  return (
    type === "FILE_UPLOAD" ||
    type === "ES_TAX_DOCUMENTS" ||
    type === "DOW_JONES_KYC" ||
    type === "ID_VERIFICATION"
  );
}
