import DataLoader from "dataloader";
import { injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, indexBy, isDefined, times } from "remeda";
import { fromDataLoader } from "../../util/fromDataLoader";
import { KeysOfType, MaybeArray, Replace, UnwrapPromise } from "../../util/types";
import { CreatePetitionEvent, CreateSystemEvent, PetitionEvent, SystemEvent } from "../events";
import { CreatePetitionUserNotification, PetitionUserNotification } from "../notifications";
import { OrganizationUsageDetails } from "../repositories/OrganizationRepository";
import {
  PetitionSignatureConfig,
  PetitionSignatureConfigSigner,
} from "../repositories/PetitionRepository";
import {
  CreatePetition,
  CreatePetitionSignatureRequest,
  Organization,
  Petition,
  PetitionSignatureRequest,
  TableCreateTypes as _TableCreateTypes,
  TableTypes as _TableTypes,
} from "../__types";

export interface TableTypes
  extends Replace<
    _TableTypes,
    {
      petition_event: PetitionEvent;
      petition_user_notification: PetitionUserNotification;
      system_event: SystemEvent;
      organization: Replace<Organization, { usage_details: OrganizationUsageDetails }>;
      petition: Replace<Petition, { signature_config: PetitionSignatureConfig | null }>;
      petition_signature_request: Replace<
        PetitionSignatureRequest,
        {
          signature_config: Replace<
            PetitionSignatureConfig,
            { signersInfo: (PetitionSignatureConfigSigner & { externalId?: string })[] }
          >;
        }
      >;
    }
  > {}

export interface TableCreateTypes
  extends Replace<
    _TableCreateTypes,
    {
      petition_event: CreatePetitionEvent;
      system_event: CreateSystemEvent;
      petition_user_notification: CreatePetitionUserNotification;
      petition: Replace<CreatePetition, { signature_config?: PetitionSignatureConfig | null }>;
      petition_signature_request: Replace<
        CreatePetitionSignatureRequest,
        { signature_config: PetitionSignatureConfig }
      >;
    }
  > {}
export interface PageOpts {
  offset?: number | null;
  limit?: number | null;
}

type TableNames = keyof TableTypes;

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

  protected from<TName extends TableNames>(tableName: TName, transaction?: Knex.Transaction) {
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
  >(tableName: TName, column: TColumn, builder?: QueryBuilderFunction<TableTypes[TName]>) {
    return fromDataLoader(
      new DataLoader<TableTypes[TName][TColumn], TableTypes[TName] | null>(async (values) => {
        const rows = (await this.knex
          .from<TableTypes[TName]>(tableName)
          .whereIn(column as any, values)
          .modify((q) => builder?.(q))
          .select("*")) as TableTypes[TName][];
        const byValue = indexBy(rows, (r) => r[column]);
        return values.map((value) => byValue[value as any]);
      })
    );
  }

  protected buildLoadMultipleBy<
    TName extends TableNames,
    TColumn extends KeysOfType<TableTypes[TName], number | string | null>
  >(tableName: TName, column: TColumn, builder?: QueryBuilderFunction<TableTypes[TName]>) {
    return fromDataLoader(
      new DataLoader<TableTypes[TName][TColumn], TableTypes[TName][]>(async (values) => {
        const rows = (await this.knex
          .from<TableTypes[TName]>(tableName)
          .whereIn(column as any, values)
          .modify((q) => builder?.(q))
          .select("*")) as TableTypes[TName][];
        const byValue = groupBy(rows, (r) => (r as any)[column as string]);
        return values.map((value) => byValue[value as any] ?? []);
      })
    );
  }

  protected buildLoadCountBy<
    TName extends TableNames,
    TColumn extends KeysOfType<TableTypes[TName], number | string | null>
  >(
    tableName: TName,
    column: TColumn,
    builder?: (builder: Knex.QueryBuilder<TableTypes[TName], TableTypes[TName]>) => void
  ) {
    return fromDataLoader(
      new DataLoader<TableTypes[TName][TColumn], number>(async (values) => {
        const rows = (await this.knex
          .from<TableTypes[TName]>(tableName)
          .whereIn(column as any, values)
          .modify((q) => builder?.(q))
          .groupBy(column)
          .select(this.knex.raw(`?? as aggr`, [column as string]), this.count())) as {
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
    const [{ count }] = await query.clone().clearOrder().clearSelect().select(this.count());
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

  protected sqlIn(array: readonly Knex.RawBinding[], castAs?: string) {
    const q = isDefined(castAs) ? `?::${castAs}` : "?";
    if (array.length === 0) {
      throw new Error("array can't be empty");
    }
    return this.knex.raw(/* sql */ `(${array.map(() => q).join(", ")})`, [...array]);
  }

  protected sqlArray(array: readonly Knex.RawBinding[], castAs?: string) {
    const q = isDefined(castAs) ? `?::${castAs}` : "?";
    return this.knex.raw(/* sql */ `array[${array.map(() => q).join(", ")}]`, [...array]);
  }

  protected sqlValues(tuples: readonly Knex.RawBinding[][], castAs?: string[]) {
    if (process.env.NODE_ENV !== "production" && isDefined(castAs)) {
      if (!tuples.every((tuple) => tuple.length === castAs.length)) {
        throw new Error("All tuples must have the same length as the castAs parameter");
      }
    }
    if (tuples.length === 0) {
      throw new Error("array can't be empty");
    }
    const tupleLength = tuples[0].length;
    if (process.env.NODE_ENV !== "production") {
      if (tuples.some((t) => t.length !== tupleLength)) {
        throw new Error("All tuples must have the same length as the castAs parameter");
      }
    }
    const q = isDefined(castAs)
      ? `(${castAs.map((element) => `?::${element}`).join(", ")})`
      : `(${times(tupleLength, () => "?").join(", ")})`;
    return this.knex.raw(/* sql */ `values ${tuples.map(() => q).join(", ")}`, [
      ...tuples.flatMap((t) => t),
    ]);
  }

  async getRowsToAnonymizeFrom<TName extends keyof TableTypes>(
    table: TableTypes[TName] extends { anonymized_at: Date | null } ? TName : never, // make sure the table has "anonymized_at" column
    days: number
  ) {
    return await this.from(table)
      .whereRaw(/* sql */ `"deleted_at" < NOW() - ?::interval`, [`${days} days`])
      .whereNull("anonymized_at")
      .select("*");
  }
}
