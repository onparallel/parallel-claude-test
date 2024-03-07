import { Knex, knex } from "knex";
import { escapeLike } from "./utils";
import ASCIIFolder from "fold-to-ascii";

(knex as any).QueryBuilder.extend("whereSearch", function <
  TRecord extends {} = any,
  TResult = unknown,
>(this: Knex.QueryBuilder<TRecord, TResult>, columnName: string, search: string) {
  return this.whereRaw(`unaccent(??) ilike ? escape ?`, [
    columnName,
    `%${escapeLike(ASCIIFolder.foldMaintaining(search), "\\")}%`,
    "\\",
  ]);
});

(knex as any).QueryBuilder.extend("mmodify", function mmodify<
  TRecord extends {},
  TResult extends {},
>(this: Knex.QueryBuilder<TRecord, TResult>, ...args: Parameters<Knex.QueryBuilder["modify"]>) {
  return this.modify<TRecord, TResult>(...args);
});
