import Knex from "knex";

export function escapeLike(pattern: string, escape: string) {
  return pattern.replace(/([%_])/g, `${escape}$1`);
}
