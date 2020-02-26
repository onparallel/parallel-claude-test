import DataLoader from "dataloader";
import { injectable, unmanaged } from "inversify";
import Knex from "knex";
import { indexBy } from "remeda";
import {
  User,
  Organization,
  Petition,
  PetitionField,
  PetitionFieldReply,
  PetitionAccess,
  TableTypes,
  TablePrimaryKeys
} from "../__types";
import { fromDataLoader } from "../../util/fromDataLoader";

export interface PageOpts {
  offset?: number | null;
  limit?: number | null;
}

@injectable()
export class BaseRepository {
  constructor(protected readonly knex: Knex) {}

  protected from<TName extends keyof TableTypes>(tableName: TName) {
    return this.knex<TableTypes[TName]>(tableName);
  }

  protected createLoadOneById<TName extends keyof TableTypes>(
    tableName: TName,
    idColumn: TablePrimaryKeys[TName]
  ) {
    return fromDataLoader(
      new DataLoader<
        TableTypes[TName][TablePrimaryKeys[TName]],
        TableTypes[TName] | null
      >(async ids => {
        const rows = <TableTypes[TName][]>await this.knex
          .from<TableTypes[TName]>(tableName)
          .select("*")
          .whereIn(
            idColumn,
            ids as TableTypes[TName][TablePrimaryKeys[TName]][]
          );
        const byId = indexBy(rows, r => r[idColumn]);
        return ids.map(id => byId[id]);
      })
    );
  }

  protected async loadPageAndCount<TRecord, TResult>(
    query: Knex.QueryBuilder<TRecord, TResult>,
    { offset, limit }: PageOpts
  ) {
    const [{ count }] = await query
      .clone()
      .clearOrder()
      .count("*");
    const totalCount = parseInt(count);
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
