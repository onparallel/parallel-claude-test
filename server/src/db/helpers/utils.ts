export function escapeLike(pattern: string, escape: string) {
  return pattern.replace(/([%_])/g, `${escape}$1`);
}

export interface SortBy<T extends string = string> {
  field: T;
  order: "asc" | "desc";
}
