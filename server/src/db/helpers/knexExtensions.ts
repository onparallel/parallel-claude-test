import { Knex, knex } from "knex";

(knex as any).QueryBuilder.extend("whereLike", likeClause("like"));
(knex as any).QueryBuilder.extend("whereIlike", likeClause("ilike"));
(knex as any).QueryBuilder.extend("whereNotLike", likeClause("not like"));
(knex as any).QueryBuilder.extend("whereNotIlike", likeClause("not ilike"));

function likeClause<TRecord = any, TResult = unknown>(operator: string) {
  return function (
    this: Knex.QueryBuilder<TRecord, TResult>,
    columnName: string,
    pattern: string,
    escape?: string
  ) {
    if (escape) {
      return this.whereRaw(`?? ${operator} ? escape ?`, [
        columnName,
        pattern,
        escape,
      ]);
    } else {
      return this.whereRaw(`?? ${operator} ?`, [columnName, pattern]);
    }
  };
}

(knex as any).QueryBuilder.extend("mmodify", function mmodify<
  TRecord,
  TResult
>(this: Knex.QueryBuilder<TRecord, TResult>, ...args: Parameters<Knex.QueryBuilder["modify"]>) {
  return this.modify<TRecord, TResult>(...args);
});
