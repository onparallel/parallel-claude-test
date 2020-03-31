import { QueryBuilder } from "knex";

QueryBuilder.extend("whereLike", likeClause("like"));
QueryBuilder.extend("whereIlike", likeClause("ilike"));
QueryBuilder.extend("whereNotLike", likeClause("not like"));
QueryBuilder.extend("whereNotIlike", likeClause("not ilike"));

function likeClause<TRecord = any, TResult = unknown>(operator: string) {
  return function (
    this: QueryBuilder<TRecord, TResult>,
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

QueryBuilder.extend("mmodify", function mmodify<TRecord, TResult>(
  this: QueryBuilder<TRecord, TResult>,
  ...args: Parameters<QueryBuilder["modify"]>
) {
  return this.modify<TRecord, TResult>(...args);
});
