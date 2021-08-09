import "knex";
declare module "knex" {
  namespace Knex {
    interface QueryBuilder<TRecord extends {} = any, TResult = any> {
      whereLike: WhereLike<TRecord, TResult>;
      whereIlike: WhereLike<TRecord, TResult>;
      whereNotLike: WhereLike<TRecord, TResult>;
      whereNotIlike: WhereLike<TRecord, TResult>;
      /**
       * Same as .modify but without any change in types. Use only chainable
       * methods that don't change the QueryBuilder generics.
       */
      mmodify(
        callback: QueryCallbackWithArgs<TRecord, TResult>,
        ...args: any[]
      ): QueryBuilder<TRecord, TResult>;
    }
    interface WhereLike<TRecord = any, TResult = unknown[]> {
      (columnName: keyof TRecord | Raw, pattern: string, escape?: string): QueryBuilder<
        TRecord,
        TResult
      >;
      (columnName: string, pattern: string, escape?: string): QueryBuilder<TRecord, TResult>;
    }
  }
}
