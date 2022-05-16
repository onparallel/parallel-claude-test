import { PetitionFieldType } from "../db/__types";

export function isFileTypeField(
  type: PetitionFieldType
): type is "FILE_UPLOAD" | "ES_TAX_DOCUMENTS" {
  return type === "FILE_UPLOAD" || type === "ES_TAX_DOCUMENTS";
}
