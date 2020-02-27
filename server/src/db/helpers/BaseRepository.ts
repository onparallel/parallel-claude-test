import DataLoader from "dataloader";
import { injectable } from "inversify";
import Knex from "knex";
import { indexBy } from "remeda";
import { fromDataLoader } from "../../util/fromDataLoader";
import { MaybeArray } from "../../util/types";
import {
  TableCreateTypes,
  TablePrimaryKeys,
  TableTypes,
  Maybe
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

  protected from<TName extends TableNames>(tableName: TName) {
    return this.knex<TableTypes[TName]>(tableName);
  }

  protected insert<TName extends TableNames>(
    tableName: TName,
    data: MaybeArray<TableCreateTypes[TName]>
  ) {
    return this.knex<TableTypes[TName]>(tableName).insert(data as any, "*");
  }

  protected buildLoadOneById<TName extends TableNames>(
    tableName: TName,
    idColumn: TablePrimaryKeys[TName]
  ) {
    return fromDataLoader(
      new DataLoader<TableKey<TName>, TableTypes[TName] | null>(async ids => {
        const rows = <TableTypes[TName][]>await this.knex
          .from<TableTypes[TName]>(tableName)
          .select("*")
          .whereIn(idColumn, ids as TableKey<TName>[]);
        const byId = indexBy(rows, r => r[idColumn]);
        return ids.map(id => byId[id]);
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
      .select(this.knex.raw(`count(*)::integer as "totalCount"`));
    if (totalCount === 0) {
      return { totalCount, items: [] };
    } else {
      return {
        totalCount,
        items: await query
          .clone()
          .select("*")
          .offset(offset ?? 0)
          .limit(limit ?? 0)
      };
    }
  }
}
