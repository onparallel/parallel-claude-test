import { PetitionFieldType } from "../__types";

export function escapeLike(pattern: string, escape: string) {
  return pattern.replace(/([%_])/g, `${escape}$1`);
}

export type SortBy<T> = {
  column: T;
  order: "asc" | "desc";
};

export const isValueCompatible = (oldType: PetitionFieldType, newType: PetitionFieldType) => {
  return (
    ["TEXT", "SHORT_TEXT", "SELECT", "NUMBER"].includes(oldType) &&
    ["TEXT", "SHORT_TEXT", "NUMBER"].includes(newType)
  );
};

export const isOptionsCompatible = (oldType: PetitionFieldType, newType: PetitionFieldType) => {
  return (
    ["TEXT", "SHORT_TEXT", "SELECT", "CHECKBOX"].includes(oldType) &&
    ["TEXT", "SHORT_TEXT", "SELECT", "CHECKBOX"].includes(newType)
  );
};

export const isSettingsCompatible = (oldType: PetitionFieldType, newType: PetitionFieldType) => {
  return (
    ["TEXT", "SHORT_TEXT", "SELECT", "DYNAMIC_SELECT", "CHECKBOX"].includes(oldType) &&
    ["TEXT", "SHORT_TEXT", "SELECT", "DYNAMIC_SELECT", "CHECKBOX"].includes(newType)
  );
};
