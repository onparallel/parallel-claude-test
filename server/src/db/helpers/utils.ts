export function escapeLike(pattern: string, escape: string) {
  return pattern.replace(/([%_])/g, `${escape}$1`);
}

export type SortBy<T> = {
  field: T;
  order: "asc" | "desc";
};
