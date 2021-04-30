export function escapeLike(pattern: string, escape: string) {
  return pattern.replace(/([%_])/g, `${escape}$1`);
}

export type SortBy<T> = {
  column: T;
  order: "asc" | "desc";
};

export const isValueCompatible = (oldType: string, newType: string) => {
  return (
    ["TEXT", "SHORT_TEXT", "SELECT"].includes(oldType) &&
    ["TEXT", "SHORT_TEXT"].includes(newType)
  );
};
