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
    ["TEXT", "SHORT_TEXT", "SELECT", "NUMBER", "DATE"].includes(oldType) &&
    ["TEXT", "SHORT_TEXT"].includes(newType)
  );
};
