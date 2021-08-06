import DataLoader from "dataloader";
import { injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, indexBy } from "remeda";
import { fromDataLoader } from "../../util/fromDataLoader";
import { KeysOfType, MaybeArray, UnwrapPromise } from "../../util/types";
import {
  CreatePetitionEvent,
  PetitionEvent,
  SystemEvent,
  CreateSystemEvent,
} from "../events";
import {
  CreatePetitionUserNotification,
  PetitionUserNotification,
} from "../notifications";
import {
  TableCreateTypes as _TableCreateTypes,
  TablePrimaryKeys,
  TableTypes as _TableTypes,
} from "../__types";

interface TableTypes
  extends Omit<
    _TableTypes,
    "PetitionEvent" | "SystemEvent" | "PetitionUserNotification"
  > {
  petition_event: PetitionEvent;
  petition_user_notification: PetitionUserNotification;
  system_event: SystemEvent;
}

interface TableCreateTypes
  extends Omit<
    _TableCreateTypes,
    | "CreatePetitionEvent"
    | "CreateSystemEvent"
    | "CreatePetitionUserNotification"
  > {
  petition_event: CreatePetitionEvent;
  system_event: CreateSystemEvent;
  petition_user_notification: CreatePetitionUserNotification;
}
export interface PageOpts {
  offset?: number | null;
  limit?: number | null;
}

type TableNames = keyof TableTypes;
type TableKey<TName extends TableNames> =
  TableTypes[TName][TablePrimaryKeys[TName]] & (string | number);

type QueryBuilderFunction<TRecord, TResult = TRecord> = (
  q: Knex.QueryBuilder<TRecord, TResult>
) => void;

@injectable()
export class BaseRepository {
  constructor(protected readonly knex: Knex) {}

  protected now() {
    return this.knex.raw("NOW()") as any;
  }

  protected count(as?: string) {
    return this.knex.raw(`count(*)::int as ??`, [as ?? "count"]);
  }

  protected from<TName extends TableNames>(
    tableName: TName,
    transaction?: Knex.Transaction
  ) {
    return transaction
      ? transaction<TableTypes[TName]>(tableName)
      : this.knex<TableTypes[TName]>(tableName);
  }

  protected async raw<TResult>(
    sql: string,
    bindings?: readonly Knex.RawBinding[],
    transaction?: Knex.Transaction
  ): Promise<TResult[]> {
    let raw = this.knex.raw<{ rows: TResult[] }>(sql, bindings ?? []);
    if (transaction) {
      raw = raw.transacting(transaction);
    }
    const { rows } = await raw;
    return rows;
  }

  protected insert<TName extends TableNames>(
    tableName: TName,
    data: MaybeArray<TableCreateTypes[TName]>,
    transaction?: Knex.Transaction
  ) {
    return (
      transaction
        ? transaction<TableTypes[TName]>(tableName)
        : this.knex<TableTypes[TName]>(tableName)
    ).insert(data as any, "*");
  }

  protected buildLoadBy<
    TName extends TableNames,
    TColumn extends KeysOfType<TableTypes[TName], number | string | null>
  >(
    tableName: TName,
    column: TColumn,
    builder?: QueryBuilderFunction<TableTypes[TName]>
  ) {
    return fromDataLoader(
      new DataLoader<TableTypes[TName][TColumn], TableTypes[TName] | null>(
        async (values) => {
          const rows = (await this.knex
            .from<TableTypes[TName]>(tableName)
            .whereIn(column as any, values as TableKey<TName>[])
            .modify((q) => builder?.(q))
            .select("*")) as TableTypes[TName][];
          const byValue = indexBy(rows, (r) => r[column]);
          return values.map((value) => byValue[value as any]);
        }
      )
    );
  }

  protected buildLoadMultipleBy<
    TName extends TableNames,
    TColumn extends KeysOfType<TableTypes[TName], number | string | null>
  >(
    tableName: TName,
    column: TColumn,
    builder?: QueryBuilderFunction<TableTypes[TName]>
  ) {
    return fromDataLoader(
      new DataLoader<TableTypes[TName][TColumn], TableTypes[TName][]>(
        async (values) => {
          const rows = (await this.knex
            .from<TableTypes[TName]>(tableName)
            .whereIn(column as any, values as TableKey<TName>[])
            .modify((q) => builder?.(q))
            .select("*")) as TableTypes[TName][];
          const byValue = groupBy(rows, (r) => r[column]);
          return values.map((value) => byValue[value as any] ?? []);
        }
      )
    );
  }

  protected buildLoadCountBy<
    TName extends TableNames,
    TColumn extends KeysOfType<TableTypes[TName], number | string | null>
  >(
    tableName: TName,
    column: TColumn,
    builder?: (
      builder: Knex.QueryBuilder<TableTypes[TName], TableTypes[TName]>
    ) => void
  ) {
    return fromDataLoader(
      new DataLoader<TableTypes[TName][TColumn], number>(async (values) => {
        const rows = (await this.knex
          .from<TableTypes[TName]>(tableName)
          .whereIn(column as any, values as TableKey<TName>[])
          .modify((q) => builder?.(q))
          .groupBy(column)
          .select(
            this.knex.raw(`?? as aggr`, [column as string]),
            this.count()
          )) as {
          aggr: any;
          count: number;
        }[];
        const byValue = indexBy(rows, (r) => r.aggr);
        return values.map((value) => byValue[value as any]?.count ?? 0);
      })
    );
  }

  protected async loadPageAndCount<TRecord, TResult>(
    query: Knex.QueryBuilder<TRecord, TResult>,
    { offset, limit }: PageOpts
  ): Promise<{
    totalCount: number;
    items: UnwrapPromise<Knex.QueryBuilder<TRecord, TResult>>;
  }> {
    const [{ count }] = await query
      .clone()
      .clearOrder()
      .clearSelect()
      .select(this.count());
    if (count === 0) {
      return {
        totalCount: 0,
        items: [],
      } as any;
    } else {
      return {
        totalCount: count as number,
        items: await query
          .clone()
          .offset(offset ?? 0)
          .limit(limit ?? 0),
      };
    }
  }

  public async withTransaction<T>(
    transactionScope: (t: Knex.Transaction) => Promise<T>,
    transaction?: Knex.Transaction
  ) {
    return transaction
      ? await transactionScope(transaction)
      : await this.knex.transaction(transactionScope);
  }
}
