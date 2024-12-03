import { PetitionFieldType } from "../db/__types";

// Same code in client/utils/petitionFields.ts
export const isValueCompatible = (oldType: PetitionFieldType, newType: PetitionFieldType) => {
  return (
    ["TEXT", "SHORT_TEXT", "SELECT", "DATE", "PHONE"].includes(oldType) &&
    ["TEXT", "SHORT_TEXT"].includes(newType)
  );
};
