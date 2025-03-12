import DataLoader from "dataloader";
import { Duration } from "date-fns";
import { injectable } from "inversify";
import { Knex } from "knex";
import PostgresInterval from "postgres-interval";
import { groupBy, indexBy } from "remeda";
import { LocalizableUserText } from "../../graphql";
import { PetitionFieldMath, PetitionFieldVisibility } from "../../util/fieldLogic";
import { LazyPromise } from "../../util/promises/LazyPromise";
import { pMapChunk } from "../../util/promises/pMapChunk";
import { hashString } from "../../util/token";
import { KeysOfType, MaybeArray, Replace, unMaybeArray } from "../../util/types";
import type * as db from "../__types";
import { CreatePetitionEvent, PetitionEvent } from "../events/PetitionEvent";
import { CreateSystemEvent, SystemEvent } from "../events/SystemEvent";
import { CreatePetitionUserNotification, PetitionUserNotification } from "../notifications";
import { OrganizationUsageDetails } from "../repositories/OrganizationRepository";
import { ApprovalRequestStepConfig } from "../repositories/PetitionApprovalRequestRepository";
import {
  AutomaticNumberingConfig,
  PetitionCustomList,
  PetitionSignatureConfig,
  PetitionSignatureConfigSigner,
  PetitionSummaryConfig,
  PetitionVariable,
} from "../repositories/PetitionRepository";
import { sqlArray, sqlIn, sqlValues } from "./sql";

export interface TableTypes
  extends Replace<
    db.TableTypes,
    {
      petition_field: Replace<
        db.PetitionField,
        { visibility: PetitionFieldVisibility | null; math: PetitionFieldMath[] | null }
      >;
      petition_event: PetitionEvent;
      petition_user_notification: PetitionUserNotification;
      system_event: SystemEvent;
      organization: Replace<db.Organization, { usage_details: OrganizationUsageDetails }>;
      petition: Replace<
        db.Petition,
        {
          signature_config: PetitionSignatureConfig | null;
          summary_config: PetitionSummaryConfig | null;
          variables: PetitionVariable[];
          custom_lists: PetitionCustomList[] | null;
          automatic_numbering_config: AutomaticNumberingConfig | null;
          standard_list_definition_override: Pick<
            db.StandardListDefinition,
            "list_name" | "list_version"
          >[];
          approval_flow_config: ApprovalRequestStepConfig[] | null;
        }
      >;
      petition_signature_request: Replace<
        db.PetitionSignatureRequest,
        {
          signature_config: Replace<
            PetitionSignatureConfig,
            { signersInfo: (PetitionSignatureConfigSigner & { externalId: string })[] }
          >;
        }
      >;
      profile_type: Replace<db.ProfileType, { name: LocalizableUserText }>;
      profile_type_field: Replace<db.ProfileTypeField, { name: LocalizableUserText }>;
      file_export_log: Replace<db.FileExportLog, { json_export: any[] }>;
      standard_list_definition: Replace<
        db.StandardListDefinition,
        {
          title: LocalizableUserText;
          values: { key: string; prefix?: string; suffix?: string }[];
        }
      >;
    }
  > {}

export interface TableCreateTypes
  extends Replace<
    db.TableCreateTypes,
    {
      petition_event: CreatePetitionEvent;
      system_event: CreateSystemEvent;
      petition_user_notification: CreatePetitionUserNotification;
      petition: Replace<
        db.CreatePetition,
        {
          signature_config?: PetitionSignatureConfig | null;
          summary_config?: PetitionSummaryConfig | null;
          variables?: PetitionVariable[] | null;
          automatic_numbering_config?: AutomaticNumberingConfig | null;
          approval_flow_config?: ApprovalRequestStepConfig[] | null;
        }
      >;
      petition_signature_request: Replace<
        db.CreatePetitionSignatureRequest,
        { signature_config: PetitionSignatureConfig }
      >;
      profile_type_field: Replace<db.CreateProfileTypeField, { name: LocalizableUserText }>;
    }
  > {}

export interface PageOpts {
  offset?: number | null;
  limit?: number | null;
}

type TableNames = keyof TableTypes;

type QueryBuilderFunction<TRecord extends {}, TResult = TRecord[]> = (
  q: Knex.QueryBuilder<TRecord, TResult>,
) => void;

interface LoaderOptions {
  refresh?: boolean;
}

export interface Loader<K, V, C = K> {
  (key: K, options?: LoaderOptions): Promise<V>;
  (keys: ReadonlyArray<K>, options?: LoaderOptions): Promise<V[]>;
  dataloader: DataLoader<K, V, C>;
  raw: {
    (key: K, t?: Knex.Transaction): Promise<V>;
    (keys: ReadonlyArray<K>, t?: Knex.Transaction): Promise<V[]>;
  };
}

export interface Pagination<T> {
  items: Promise<T[]>;
  totalCount: Promise<number>;
}

@injectable()
export class BaseRepository {
  constructor(protected readonly knex: Knex) {}

  protected now() {
    return this.knex.raw("NOW()") as any;
  }

  protected count(as?: string) {
    return this.knex.raw(`count(*)::int as ??`, [as ?? "count"]);
  }

  protected json(value: any) {
    return this.knex.raw("?::jsonb", JSON.stringify(value)) as any;
  }

  protected interval(value: Duration) {
    return this.knex.raw(
      "?::interval",
      Object.assign(PostgresInterval(), value).toPostgres(),
    ) as any;
  }

  protected from<TName extends TableNames, TResult extends {} = TableTypes[TName]>(
    tableName: TName | Record<string, TName>,
    transaction?: Knex.Transaction,
  ) {
    return transaction ? transaction<TResult>(tableName) : this.knex<TResult>(tableName);
  }

  protected async raw<TResult>(
    sql: string,
    bindings?: readonly Knex.RawBinding[] | Record<string, Knex.RawBinding>,
    transaction?: Knex.Transaction,
  ): Promise<TResult[]> {
    let raw = this.knex.raw<{ rows: TResult[] }>(sql, bindings ?? []);
    if (transaction) {
      raw = raw.transacting(transaction);
    }
    const { rows } = await raw;
    return rows;
  }

  protected async exists(
    sql: string,
    bindings?: readonly Knex.RawBinding[],
    transaction?: Knex.Transaction,
  ): Promise<boolean> {
    const [{ exists }] = await this.raw<{ exists: boolean }>(
      /* sql */ `select exists(?)`,
      [this.knex.raw(sql, bindings ?? [])],
      transaction,
    );
    return exists;
  }

  protected insert<TName extends TableNames>(
    tableName: TName,
    data: MaybeArray<TableCreateTypes[TName]>,
    transaction?: Knex.Transaction,
  ) {
    return (
      transaction
        ? transaction<TableTypes[TName]>(tableName)
        : this.knex<TableTypes[TName]>(tableName)
    ).insert(data as any, "*");
  }

  protected buildLoader<K, V, C = K>(
    loadFn: (keys: ReadonlyArray<K>, t?: Knex.Transaction) => Promise<V[]>,
    options?: DataLoader.Options<K, V, C>,
  ): Loader<K, V, C> {
    const dataloader = new DataLoader<K, V, C>(
      async (keys) =>
        pMapChunk(keys, (chunk) => loadFn(chunk), { concurrency: 1, chunkSize: 10_000 }),
      options,
    );
    return Object.assign(
      async function (keys: MaybeArray<K>, options?: LoaderOptions) {
        const { refresh = false } = options ?? {};
        const arrayKeys = unMaybeArray(keys);
        if (refresh) {
          for (const key of arrayKeys) {
            dataloader.clear(key);
          }
        }
        const result = await dataloader.loadMany(arrayKeys);
        if (Array.isArray(keys)) {
          if (result.some((r) => r instanceof Error)) {
            throw new AggregateError(result.filter((r) => r instanceof Error));
          }
          return result;
        } else if (result[0] instanceof Error) {
          throw result[0];
        } else {
          return result[0];
        }
      },
      {
        dataloader,
        raw: async function raw(keys: MaybeArray<K>, t?: Knex.Transaction) {
          const result = await loadFn(unMaybeArray(keys), t);
          return Array.isArray(keys) ? result : result[0];
        },
      },
    ) as any;
  }

  protected buildLoadBy<
    TName extends TableNames,
    TColumn extends KeysOfType<TableTypes[TName], number | string | null>,
    TResult extends {} = TableTypes[TName],
  >(tableName: TName, column: TColumn, builder?: QueryBuilderFunction<TableTypes[TName]>) {
    return this.buildLoader<TableTypes[TName][TColumn], TResult | null>(async (values, t) => {
      const rows: TResult[] = await this.from(tableName, t)
        .whereIn(column as any, values as any)
        .modify((q) => builder?.(q as any))
        .select("*");
      const byValue = indexBy(rows, (r) => (r as any)[column]);
      return values.map((value) => byValue[value as any] ?? null);
    });
  }

  protected buildLoadMultipleBy<
    TName extends TableNames,
    TColumn extends KeysOfType<TableTypes[TName], number | string | null>,
    TResult extends {} = TableTypes[TName],
  >(tableName: TName, column: TColumn, builder?: QueryBuilderFunction<TableTypes[TName]>) {
    return this.buildLoader<TableTypes[TName][TColumn], TResult[]>(async (values, t) => {
      const rows: TResult[] = await this.from(tableName, t)
        .whereIn(column as any, values as any)
        .modify((q) => builder?.(q as any))
        .select("*");
      const byValue = groupBy(rows, (r) => (r as any)[column] as any);
      return values.map((value) => byValue[value as any] ?? []);
    });
  }

  protected buildLoadCountBy<
    TName extends TableNames,
    TColumn extends KeysOfType<TableTypes[TName], number | string | null>,
  >(tableName: TName, column: TColumn, builder?: QueryBuilderFunction<TableTypes[TName]>) {
    return this.buildLoader<TableTypes[TName][TColumn], number>(async (values, t) => {
      const rows: {
        aggr: any;
        count: number;
      }[] = await this.from(tableName, t)
        .whereIn(column as any, values as any)
        .modify((q) => builder?.(q as any))
        .groupBy(column)
        .select(this.knex.raw(`?? as aggr`, [column as string]), this.count());
      const byValue = indexBy(rows, (r) => r.aggr);
      return values.map((value) => byValue[value as any]?.count ?? 0);
    });
  }

  protected buildLoadExistsBy<
    TName extends TableNames,
    TColumn extends KeysOfType<TableTypes[TName], number | string | null>,
  >(tableName: TName, column: TColumn, builder?: QueryBuilderFunction<TableTypes[TName]>) {
    return this.buildLoader<TableTypes[TName][TColumn], boolean>(async (values, t) => {
      const rows: {
        column: number | string;
      }[] = await this.from(tableName, t)
        .whereIn(column as any, values as any)
        .modify((q) => builder?.(q as any))
        .distinct(this.knex.raw(`?? as column`, [column as string]));
      const set = new Set(rows.map((r) => r.column));
      return values.map((value) => set.has(value as any));
    });
  }

  protected getPagination<T>(
    query: Knex.QueryBuilder<any, T[]>,
    { offset, limit }: PageOpts,
  ): Pagination<T> {
    const totalCount = LazyPromise.from(async () => {
      const [{ count }] = await query
        .clone()
        .clearOrder()
        .clearSelect()
        .select<{ count: number }[]>(this.count());
      return count;
    });
    return {
      totalCount,
      items: LazyPromise.from(async () => {
        const count = await totalCount;
        return count === 0
          ? ([] as T[])
          : ((await query
              .clone()
              .offset(offset ?? 0)
              .limit(limit ?? 0)) as T[]);
      }),
    };
  }

  public async withTransaction<T>(
    transactionScope: (t: Knex.Transaction) => Promise<T>,
    transaction?: Knex.Transaction,
  ) {
    return transaction
      ? await transactionScope(transaction)
      : await this.knex.transaction(transactionScope);
  }

  protected async transactionLock(lockName: string, t: Knex.Transaction) {
    await this.raw(/* sql */ `select pg_advisory_xact_lock(?)`, [hashString(lockName)], t);
  }

  protected sqlIn(array: readonly Knex.RawBinding[], castAs?: string) {
    return sqlIn(this.knex, array, castAs);
  }

  protected sqlArray(array: readonly Knex.RawBinding[], castAs?: string) {
    return sqlArray(this.knex, array, castAs);
  }

  protected sqlValues(tuples: readonly Knex.RawBinding[][], castAs?: string[]) {
    return sqlValues(this.knex, tuples, castAs);
  }
}
