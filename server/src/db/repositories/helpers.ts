import DataLoader from "dataloader";
import { injectable, unmanaged } from "inversify";
import Knex from "knex";
import { indexBy } from "remeda";
import { User, Organization } from "../__types";
import { fromDataLoader } from "../../util/fromDataLoader";

export interface PageOpts {
  offset?: number | null;
  limit?: number | null;
}

@injectable()
export class BaseRepository<
  TType extends {},
  TId extends keyof TType & string
> {
  get organizations() {
    return this.knex<Organization>("organization");
  }

  get users() {
    return this.knex<User>("user");
  }

  constructor(
    @unmanaged() protected readonly tableName: string,
    @unmanaged() protected readonly idColumn: TId,
    protected readonly knex: Knex<TType>
  ) {}

  loadOneById = fromDataLoader(
    new DataLoader<TType[TId], TType>(async ids => {
      const rows = <TType[]>await this.knex
        .from<TType>(this.tableName)
        .select<TType>("*")
        .whereIn(this.idColumn, <any>ids);
      const byId = indexBy(rows, r => r[this.idColumn]);
      return ids.map(id => byId[<any>id]);
    })
  );

  protected async loadPageAndCount<TRecord, TResult>(
    query: Knex.QueryBuilder<TRecord, TResult>,
    { offset, limit }: PageOpts
  ) {
    const [{ count }] = await query.clone().count("*");
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
