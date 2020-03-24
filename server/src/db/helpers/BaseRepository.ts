import DataLoader from "dataloader";
import { injectable } from "inversify";
import Knex, { Transaction, QueryBuilder } from "knex";
import { indexBy } from "remeda";
import { fromDataLoader } from "../../util/fromDataLoader";
import { MaybeArray } from "../../util/types";
import {
  TableCreateTypes,
  TablePrimaryKeys,
  TableTypes,
  Maybe,
} from "../__types";
import { handler } from "../../util/handler";

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

  protected buildLoadOneById<TName extends TableNames>(
    tableName: TName,
    idColumn: TablePrimaryKeys[TName],
    builder?: (
      builder: QueryBuilder<TableTypes[TName], TableTypes[TName]>
    ) => void
  ) {
    return fromDataLoader(
      new DataLoader<TableKey<TName>, TableTypes[TName] | null>(async (ids) => {
        const rows = <TableTypes[TName][]>await this.knex
          .from<TableTypes[TName]>(tableName)
          .select("*")
          .modify((q) => builder?.(q))
          .whereIn(idColumn, ids as TableKey<TName>[]);
        const byId = indexBy(rows, (r) => r[idColumn]);
        return ids.map((id) => byId[id]);
      })
    );
  }

  protected async loadPageAndCount<TRecord, TResult>(
    query: Knex.QueryBuilder<TRecord, TResult>,
    { offset, limit }: PageOpts
  ) {
    const [{ totalCount }] = await query
      .clone()
      .clearOrder()
      .select(this.count("totalCount"));
    if (totalCount === 0) {
      return { totalCount, items: [] };
    } else {
      return {
        totalCount,
        items: await query
          .clone()
          .select("*")
          .offset(offset ?? 0)
          .limit(limit ?? 0),
      };
    }
  }
}
