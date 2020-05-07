import DataLoader from "dataloader";
import { injectable } from "inversify";
import Knex, { Transaction, QueryBuilder } from "knex";
import { indexBy } from "remeda";
import { fromDataLoader } from "../../util/fromDataLoader";
import { MaybeArray, UnwrapPromise } from "../../util/types";
import {
  TableCreateTypes,
  TablePrimaryKeys,
  TableTypes,
  Maybe,
} from "../__types";

export interface PageOpts {
  offset?: number | null;
  limit?: number | null;
}

type TableNames = keyof TableTypes;
type TableKey<
  TName extends TableNames
> = TableTypes[TName][TablePrimaryKeys[TName]] & (string | number);

interface Timestamped {
  created_at: Date;
  created_by: Maybe<string>;
  updated_at: Date;
  updated_by: Maybe<string>;
  deleted_at: Maybe<Date>;
  deleted_by: Maybe<string>;
}

@injectable()
export class BaseRepository {
  constructor(protected readonly knex: Knex) {}

  protected from<TName extends TableNames>(
    tableName: TName,
    transaction?: Transaction
  ) {
    return transaction
      ? transaction<TableTypes[TName]>(tableName)
      : this.knex<TableTypes[TName]>(tableName);
  }

  protected now() {
    return this.knex.raw("NOW()") as any;
  }

  protected count(as?: string) {
    return this.knex.raw(`count(*)::int as "${as ?? "count"}"`) as any;
  }

  protected insert<TName extends TableNames>(
    tableName: TName,
    data: MaybeArray<TableCreateTypes[TName]>,
    transaction?: Transaction
  ) {
    return (transaction
      ? transaction<TableTypes[TName]>(tableName)
      : this.knex<TableTypes[TName]>(tableName)
    ).insert(data as any, "*");
  }

  protected buildLoadById<TName extends TableNames>(
    tableName: TName,
    idColumn: TablePrimaryKeys[TName],
    builder?: (
      builder: QueryBuilder<TableTypes[TName], TableTypes[TName]>
    ) => void
  ) {
    return this.buildLoadBy(tableName, idColumn, builder);
  }

  protected buildLoadBy<
    TName extends TableNames,
    TColumn extends keyof TableTypes[TName]
  >(
    tableName: TName,
    column: TColumn,
    builder?: (
      builder: QueryBuilder<TableTypes[TName], TableTypes[TName]>
    ) => void
  ) {
    return fromDataLoader(
      new DataLoader<TableTypes[TName][TColumn], TableTypes[TName] | null>(
        async (values) => {
          const rows = (await this.knex
            .from<TableTypes[TName]>(tableName)
            .select("*")
            .modify((q) => builder?.(q))
            .whereIn(
              column,
              values as TableKey<TName>[]
            )) as TableTypes[TName][];
          const byValue = indexBy(rows, (r) => r[column]);
          return values.map((value) => byValue[value as any]);
        }
      )
    );
  }

  protected async loadPageAndCount<TRecord, TResult>(
    query: Knex.QueryBuilder<TRecord, TResult>,
    { offset, limit }: PageOpts
  ) {
    const [{ count }] = await query
      .clone()
      .clearOrder()
      .clearSelect()
      .select(this.count());
    if (count === 0) {
      return {
        totalCount: 0,
        items: ([] as unknown) as UnwrapPromise<typeof query>,
      };
    } else {
      return {
        totalCount: count as number,
        items: (await query
          .clone()
          .offset(offset ?? 0)
          .limit(limit ?? 0)) as UnwrapPromise<typeof query>,
      };
    }
  }
}
