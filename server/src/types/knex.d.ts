import * as Knex from "knex";

declare module "knex" {
  interface QueryBuilder {
    whereLike: WhereLike;
    whereIlike: WhereLike;
    whereNotLike: WhereLike;
    whereNotIlike: WhereLike;
  }
  interface WhereLike<TRecord = any, TResult = unknown[]> {
    (columnName: keyof TRecord, pattern: string, escape?: string): QueryBuilder<
      TRecord,
      TResult
    >;
    (columnName: string, pattern: string, escape?: string): QueryBuilder<
      TRecord,
      TResult
    >;
  }
}
