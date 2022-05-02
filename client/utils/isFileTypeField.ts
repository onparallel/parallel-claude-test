import { PetitionFieldType } from "@parallel/graphql/__types";

export function isFileTypeField(type: PetitionFieldType) {
  return type === "FILE_UPLOAD" || type === "ES_TAX_DOCUMENTS";
}
