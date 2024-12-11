import { inject } from "inversify";
import { Knex } from "knex";
import { indexBy, isNonNullish, isNullish, sumBy } from "remeda";
import { assert } from "ts-essentials";
import { never } from "../../util/never";
import {
  ProfileFieldValuesFilter,
  ProfileFieldValuesFilterOperator,
} from "../../util/ProfileFieldValuesFilter";
import {
  ContactLocale,
  Dashboard,
  DashboardModule,
  DashboardModuleType,
  PetitionStatus,
  ProfileStatus,
  ProfileTypeField,
  ProfileTypeFieldType,
} from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

type ModuleResultType =
  | {
      type: "COUNT";
    }
  | {
      type: "AGGREGATE";
      profileTypeFieldId: number;
      aggregate: "SUM" | "AVG" | "MAX" | "MIN";
    };

export type ModuleSettings<TType extends DashboardModuleType> = {
  CREATE_PARALLEL_BUTTON: {
    label: string;
    template_id: number;
  };
  PARALLELS_NUMBER: { filters: ParallelsFilter };
  PARALLELS_RATIO: {
    graphicType: "RATIO" | "PERCENTAGE";
    filters: [ParallelsFilter, ParallelsFilter];
  };
  PARALLELS_PIE_CHART: {
    graphicType: "DOUGHNUT" | "PIE";
    items: { label: string; color: string; filter: ParallelsFilter }[];
  };
  PROFILES_NUMBER: {
    profileTypeId: number;
    filters: ProfilesFilter;
  } & ModuleResultType;
  PROFILES_RATIO: {
    graphicType: "RATIO" | "PERCENTAGE";
    profileTypeId: number;
    filters: [ProfilesFilter, ProfilesFilter];
  } & ModuleResultType;
  PROFILES_PIE_CHART: {
    graphicType: "DOUGHNUT" | "PIE";
    profileTypeId: number;
    items: { label: string; color: string; filter: ProfilesFilter }[];
  } & ModuleResultType;
}[TType];

export interface ParallelsFilter {
  path?: string | null;
  status?: PetitionStatus[] | null;
  locale?: ContactLocale | null;
  signature?: (
    | "NO_SIGNATURE"
    | "NOT_STARTED"
    | "PENDING_START"
    | "PROCESSING"
    | "COMPLETED"
    | "CANCELLED"
  )[];
  tags?: {
    operator: "AND" | "OR";
    filters: {
      ids: number[];
      operator: "CONTAINS" | "DOES_NOT_CONTAIN" | "IS_EMPTY";
    }[];
  };
  sharedWith?: {
    operator: "AND" | "OR";
    filters: {
      type: "User" | "UserGroup";
      id: number;
      operator: "SHARED_WITH" | "NOT_SHARED_WITH" | "IS_OWNER" | "NOT_IS_OWNER";
    }[];
  };
  fromTemplateId?: number[] | null;
}

export interface ProfilesFilter {
  status?: ProfileStatus[] | null;
  values?: ProfileFieldValuesFilter | null;
}

export class DashboardRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  public readonly loadDashboard = this.buildLoadBy("dashboard", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  public readonly loadDashboardsByOrgId = this.buildLoadMultipleBy("dashboard", "org_id", (q) =>
    q.whereNull("deleted_at").orderBy("position", "asc"),
  );

  public readonly loadModulesByDashboardId = this.buildLoadMultipleBy(
    "dashboard_module",
    "dashboard_id",
    (q) => q.whereNull("deleted_at").orderBy("position", "asc"),
  );

  async getRefreshedDashboard(dashboardId: number, updatedBy: string) {
    const [dashboard] = await this.raw<Dashboard & { requires_refresh: boolean }>(
      /* sql */ `
      with refresh_dashboard as (
        update dashboard 
        set is_refreshing = true,
        updated_at = now(),
        updated_by = ?
        where id = ? 
        and deleted_at is null
        and is_refreshing = false
        and (
          last_refresh_at is null 
          or 
          (now() - last_refresh_at > make_interval(mins => 30))
          or exists (
            select 1 from dashboard_module 
            where dashboard_id = ? 
            and type != 'CREATE_PARALLEL_BUTTON'
            and deleted_at is null 
            and result is null
          )
        )
        returning *
      )
      select *, true as requires_refresh from refresh_dashboard
      union
      select *, false as requires_refresh from dashboard
      where
        id = ?
        and deleted_at is null
        and id not in (
          select id from refresh_dashboard
        );
    `,
      [updatedBy, dashboardId, dashboardId, dashboardId],
    );

    assert(dashboard, `Dashboard with id ${dashboardId} not found`);
    return dashboard;
  }

  async updateDashboardRefreshStatus(id: number, updatedBy: string) {
    await this.from("dashboard").where("id", id).whereNull("deleted_at").update(
      {
        is_refreshing: false,
        last_refresh_at: this.now(),
        updated_at: this.now(),
        updated_by: updatedBy,
      },
      "*",
    );
  }

  async updateDashboardModule(moduleId: number, data: Partial<DashboardModule>, updatedBy: string) {
    const [module] = await this.from("dashboard_module")
      .where("id", moduleId)
      .whereNull("deleted_at")
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .returning("*");

    return module;
  }

  private parallelsCountQuery(orgId: number, filters: ParallelsFilter) {
    return (
      this.from({ p: "petition" })
        .where("p.org_id", orgId)
        .where("p.is_template", false)
        .whereNull("p.deleted_at")
        .mmodify((q) => {
          if (filters?.path) {
            q.where("p.path", filters.path);
          }
          if (filters?.status && filters.status.length > 0) {
            q.whereIn("p.status", filters.status);
          }

          if (filters?.locale) {
            q.where("p.recipient_locale", filters.locale);
          }

          if (filters?.signature && filters.signature.length > 0) {
            q.where((q) => {
              if (filters.signature!.includes("NO_SIGNATURE")) {
                // no signature configured nor any previous signature request
                q.or.whereRaw(/* sql */ `
          p.signature_config is null
          and p.latest_signature_status is null
        `);
              }
              if (filters.signature!.includes("NOT_STARTED")) {
                // signature is configured, awaiting to complete the petition
                q.or.whereRaw(/* sql */ `
          p.signature_config is not null
          and p.latest_signature_status is null
          and p.status in ('DRAFT', 'PENDING')
        `);
              }
              if (filters.signature!.includes("PENDING_START")) {
                // petition is completed, need to manually start the signature
                // also show as pending start when user manually cancels the previous request
                // and signature is still configured
                q.or.whereRaw(/* sql */ `
          p.signature_config is not null 
          and p.status in ('COMPLETED', 'CLOSED')
          and (
            p.latest_signature_status is null
            or p.latest_signature_status = 'COMPLETED'
            or p.latest_signature_status = 'CANCELLED_BY_USER'
          )
        `);
              }
              if (filters.signature!.includes("PROCESSING")) {
                // signature is ongoing
                q.or.whereRaw(/* sql */ `
          p.latest_signature_status is not null
          and p.latest_signature_status not in ('COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED')
        `);
              }
              if (filters.signature!.includes("COMPLETED")) {
                // signature completed, everyone signed
                q.or.whereRaw(/* sql */ `
          p.signature_config is null
          and p.latest_signature_status is not null
          and p.latest_signature_status = 'COMPLETED'
        `);
              }
              if (filters.signature!.includes("CANCELLED")) {
                // cancelled by a reason external to user (request error, signer declined, etc)
                // or cancelled by user and no signature configured
                q.or.whereRaw(/* sql */ `
          p.latest_signature_status is not null
          and (
            p.latest_signature_status = 'CANCELLED'
            or ( 
              p.latest_signature_status = 'CANCELLED_BY_USER'
              and p.signature_config is null
            )
          )
        `);
              }
            });
          }

          if (filters?.tags) {
            const { filters: tagsFilters, operator } = filters.tags;

            q.joinRaw(/* sql */ `left join petition_tag pt on pt.petition_id = p.id`).modify(
              (q) => {
                for (const filter of tagsFilters) {
                  q = operator === "AND" ? q.and : q.or;

                  switch (filter.operator) {
                    case "CONTAINS":
                    case "DOES_NOT_CONTAIN":
                      q = filter.operator.startsWith("DOES_NOT_") ? q.not : q;
                      q.havingRaw(/* sql */ `array_agg(distinct pt.tag_id) @> ?`, [
                        this.sqlArray(filter.ids, "int"),
                      ]);
                      break;
                    case "IS_EMPTY":
                      q.havingRaw(/* sql */ `count(distinct pt.tag_id) = 0`);
                      break;
                  }
                }
              },
            );
          }

          if (filters?.sharedWith && filters.sharedWith.filters.length > 0) {
            const { filters: sharedWithFilters, operator } = filters.sharedWith;

            q.joinRaw(
              /* sql */ `join petition_permission pp2 on pp2.petition_id = p.id and pp2.deleted_at is null`,
            ).modify((q) => {
              for (const filter of sharedWithFilters) {
                const { id, type } = filter;
                const column = type === "User" ? "user_id" : "user_group_id";
                q = operator === "AND" ? q.and : q.or;
                switch (filter.operator) {
                  case "SHARED_WITH":
                  case "NOT_SHARED_WITH":
                    q = filter.operator.startsWith("NOT_") ? q.not : q;
                    q.havingRaw(
                      /* sql */ `? = any(array_remove(array_agg(distinct pp2.${column}), null))`,
                      [id],
                    );
                    break;
                  case "IS_OWNER":
                  case "NOT_IS_OWNER":
                    q = filter.operator.startsWith("NOT_") ? q.not : q;
                    q.havingRaw(
                      /* sql */ `sum(case pp2.type when 'OWNER' then (pp2.user_id = ?)::int else 0 end) > 0`,
                      [id],
                    );
                    break;
                }
              }
            });
          }

          if (filters?.fromTemplateId && filters.fromTemplateId.length > 0) {
            q.whereIn("p.from_template_id", filters.fromTemplateId!);
          }
        })
        // this group by is necessary for some of the builders to work
        .groupBy("p.id")
        .select(this.knex.raw(/* sql */ `distinct p.id`))
    );
  }

  private profilesCountQuery(
    orgId: number,
    profileTypeId: number,
    filters: ProfilesFilter,
    profileTypeFieldsById: Record<number, ProfileTypeField>,
    resultType: ModuleResultType,
  ) {
    assert(
      resultType.type !== "AGGREGATE" ||
        profileTypeFieldsById[resultType.profileTypeFieldId]?.type === "NUMBER",
      "Aggregation can only be done with NUMBER properties",
    );

    const joins: Record<number, string> = {};
    let index = 0;

    return this.from({ p: "profile" })
      .where("p.org_id", orgId)
      .where("profile_type_id", profileTypeId)
      .whereNull("p.deleted_at")
      .mmodify((q) => {
        function join(profileTypeFieldId: number) {
          const profileTypeField = profileTypeFieldsById[profileTypeFieldId];
          assert(profileTypeField, `Profile type field ${profileTypeFieldId} not found`);
          if (isNullish(joins[profileTypeFieldId])) {
            const alias = (joins[profileTypeFieldId] = `pfv${index++}`);
            const table =
              profileTypeField.type === "FILE" ? "profile_field_file" : "profile_field_value";
            q.joinRaw(
              /* sql */ `
                left join ${table} ${alias} 
                  on ${alias}.profile_id = p.id
                  and ${alias}.profile_type_field_id = ?
                  and ${alias}.deleted_at is null 
                  and ${alias}.removed_at is null
                `,
              [profileTypeFieldId],
            );
          }
        }
        if (resultType.type === "AGGREGATE") {
          join(resultType.profileTypeFieldId);
          const alias = joins[resultType.profileTypeFieldId];
          const content = this.knex.raw(`??.content`, [alias]);
          q.whereRaw(`? is not null`, [content])
            .orderBy("p.id")
            .select(
              this.knex.raw(/* sql */ `distinct on (p.id) p.id, (?->'value')::numeric as aggr`, [
                content,
              ]),
            );
        } else {
          q.select(this.knex.raw(/* sql */ `distinct p.id`));
        }
        if (isNonNullish(filters?.status) && filters!.status.length > 0) {
          q.whereIn("p.status", filters.status);
        }
        if (isNonNullish(filters?.values)) {
          assert(
            isNonNullish(profileTypeFieldsById),
            "if filter.values is defined, profileTypeFieldsById is required",
          );
          (function walkFilter(filter: ProfileFieldValuesFilter) {
            if ("conditions" in filter) {
              for (const condition of filter.conditions) {
                walkFilter(condition);
              }
            } else {
              join(filter.profileTypeFieldId);
            }
          })(filters.values);
          const applyValueFilter = (
            filter: ProfileFieldValuesFilter,
            q: Knex.QueryBuilder,
            currentOp: "AND" | "OR",
          ) => {
            if ("conditions" in filter) {
              const { conditions, logicalOperator } = filter;
              // this simplifies the query avoiding nested unnecessary parentheses
              // a AND (b AND c) => a AND b AND c
              // a OR (b OR c) => a OR b OR c
              if (logicalOperator === currentOp || conditions.length === 1) {
                conditions.forEach((c) => applyValueFilter(c, q, logicalOperator));
              } else {
                q.where((q) =>
                  conditions.forEach((c) =>
                    q[logicalOperator === "AND" ? "andWhere" : "orWhere"]((q) =>
                      applyValueFilter(c, q, logicalOperator),
                    ),
                  ),
                );
              }
            } else {
              const profileTypeField = profileTypeFieldsById[filter.profileTypeFieldId];
              const assertType = (...types: ProfileTypeFieldType[]) => {
                assert(
                  types.includes(profileTypeField.type),
                  `Invalid operator ${filter.operator} for type ${profileTypeField.type}`,
                );
              };
              const tableAlias = joins[filter.profileTypeFieldId];
              assert(isNonNullish(tableAlias), "invalid join");
              const content =
                profileTypeField.type === "FILE"
                  ? this.knex.raw(`??.id`, [tableAlias])
                  : this.knex.raw(`??.content`, [tableAlias]);
              const expiryDate = this.knex.raw(`??.expiry_date`, [tableAlias]);
              const [negated, operator] = filter.operator.startsWith("NOT_")
                ? ([
                    true,
                    filter.operator.slice("NOT_".length) as ProfileFieldValuesFilterOperator,
                  ] as const)
                : ([false, filter.operator] as const);
              const value = filter.value;
              const where = (builder: (q: Knex.QueryBuilder) => void, wrap: boolean) => {
                if (wrap) {
                  q.where(builder);
                } else {
                  builder(q);
                }
              };
              const apply = (sql: string, bindings: readonly Knex.RawBinding[]) => {
                const raw = this.knex.raw(sql, bindings);
                if (negated) {
                  where(
                    (q) => q.whereRaw(`? is null or not(?)`, [content, raw]),
                    currentOp === "AND",
                  );
                } else {
                  where(
                    (q) => q.whereRaw(`? is not null and ?`, [content, raw]),
                    currentOp === "OR",
                  );
                }
              };
              switch (operator) {
                case "HAS_VALUE":
                  if (negated) {
                    q.whereRaw(/* sql*/ `? is null`, [content]);
                  } else {
                    q.whereRaw(/* sql*/ `? is not null`, [content]);
                  }
                  break;
                case "EQUAL":
                  if (
                    ["TEXT", "SHORT_TEXT", "NUMBER", "DATE", "SELECT", "PHONE"].includes(
                      profileTypeField.type,
                    )
                  ) {
                    assert(isNonNullish(value));
                    apply(/* sql*/ `?->>'value' = ?`, [content, value]);
                  } else if (profileTypeField.type === "CHECKBOX") {
                    assert(Array.isArray(value));
                    apply(/* sql*/ `(?->'value' @> to_jsonb(?) and ?->'value' <@ to_jsonb(?))`, [
                      content,
                      this.sqlArray(value),
                      content,
                      this.sqlArray(value),
                    ]);
                  } else {
                    never();
                  }
                  break;
                case "START_WITH":
                  assertType("TEXT", "SHORT_TEXT");
                  assert(isNonNullish(value));
                  apply(/* sql*/ `starts_with(?->>'value', ?)`, [content, value]);
                  break;
                case "END_WITH":
                  assertType("TEXT", "SHORT_TEXT");
                  assert(isNonNullish(value));
                  apply(/* sql*/ `right(?->>'value', length(?)) = ?`, [content, value, value]);
                  break;
                case "CONTAIN":
                  assert(isNonNullish(value));
                  if (["TEXT", "SHORT_TEXT"].includes(profileTypeField.type)) {
                    apply(/* sql*/ `strpos(?->>'value', ?) > 0`, [content, value]);
                  } else if (profileTypeField.type === "CHECKBOX") {
                    assert(Array.isArray(value));
                    apply(/* sql*/ `?->'value' @> to_jsonb(?)`, [content, this.sqlArray(value)]);
                  } else {
                    never(`Invalid operator ${operator} for type ${profileTypeField.type}`);
                  }
                  break;
                case "IS_ONE_OF":
                  assertType("SELECT", "TEXT", "SHORT_TEXT");
                  assert(Array.isArray(value));
                  apply(/* sql*/ `?->>'value' in ?`, [content, this.sqlIn(value)]);
                  break;
                case "LESS_THAN":
                case "LESS_THAN_OR_EQUAL":
                case "GREATER_THAN":
                case "GREATER_THAN_OR_EQUAL":
                  assertType("NUMBER", "DATE");
                  assert(isNonNullish(value));
                  const op = {
                    LESS_THAN: "<",
                    LESS_THAN_OR_EQUAL: "<=",
                    GREATER_THAN: ">",
                    GREATER_THAN_OR_EQUAL: ">=",
                  }[operator];
                  const cast = {
                    NUMBER: "float",
                    DATE: "date",
                  }[profileTypeField.type as "NUMBER" | "DATE"];
                  apply(/* sql*/ `(?->>'value')::${cast} ${op} ?::${cast}`, [content, value]);
                  break;
                case "HAS_BG_CHECK_MATCH":
                  apply(
                    /* sql */ `(? -> 'entity' is not null and ? -> 'entity' != 'null'::jsonb)`,
                    [content, content],
                  );
                  break;
                case "HAS_BG_CHECK_RESULTS":
                  apply(
                    /* sql */ `(? -> 'search' is not null and ? -> 'search' != 'null'::jsonb and (? #>> '{search,totalCount}')::int > 0)`,
                    [content, content, content],
                  );
                  break;
                case "HAS_BG_CHECK_TOPICS":
                  assert(Array.isArray(value));
                  apply(
                    /* sql */ `(? -> 'entity' is not null and ? -> 'entity' != 'null'::jsonb and (? #> '{entity,properties,topics}') @> to_jsonb(?))`,
                    [content, content, content, this.sqlArray(value)],
                  );
                  break;
                case "IS_EXPIRED":
                  where(
                    (q) =>
                      q.whereRaw(`? is not null and now() > (? + 'P1D'::interval)`, [
                        expiryDate,
                        expiryDate,
                      ]),
                    currentOp === "OR",
                  );
                  break;
                case "EXPIRES_IN":
                  where(
                    (q) =>
                      q.whereRaw(
                        `? is not null and (now() + ?::interval) > (? + 'P1D'::interval)`,
                        [expiryDate, value, expiryDate],
                      ),
                    currentOp === "OR",
                  );
                  break;
                case "HAS_EXPIRY":
                  if (negated) {
                    q.whereRaw(/* sql*/ `? is null`, [expiryDate]);
                  } else {
                    q.whereRaw(/* sql*/ `? is not null`, [expiryDate]);
                  }
                  break;
                default:
                  throw new Error(`Operator ${operator} not implemented`);
              }
            }
          };
          applyValueFilter(filters.values, q, "AND");
        }
      });
  }

  async getParallelsNumberValue(orgId: number, settings: ModuleSettings<"PARALLELS_NUMBER">) {
    const [{ value }] = await this.knex
      .with("ps", this.parallelsCountQuery(orgId, settings.filters))
      .from("ps")
      .select<[{ value: number }]>(this.count("value"));

    return { value };
  }

  async getParallelsRatioValues(orgId: number, settings: ModuleSettings<"PARALLELS_RATIO">) {
    assert(settings.filters.length === 2, "Expected 2 filters");

    const data: { count: number; filter: 0 | 1 | -1 }[] = await this.knex
      .with("p0", this.parallelsCountQuery(orgId, settings.filters[0]))
      .with("p1", this.parallelsCountQuery(orgId, settings.filters[1]))
      .with("p_int", (q) =>
        q
          .select("*")
          .from("p0")
          .intersect((q2) => q2.select("*").from("p1")),
      )

      .select(this.count(), this.knex.raw(`-1 as filter`))
      .from("p_int")
      .union((q) => q.select(this.count(), this.knex.raw("0")).from("p0"))
      .union((q) => q.select(this.count(), this.knex.raw("1")).from("p1"));

    const value0 = data.find((d) => d.filter === 0)?.count;
    const value1 = data.find((d) => d.filter === 1)?.count;
    const intersectionValue = data.find((d) => d.filter === -1)?.count;

    assert(
      isNonNullish(value0) && isNonNullish(value1) && isNonNullish(intersectionValue),
      "Values not found",
    );

    return {
      value: [value0, value1],
      // ratio is incongruent if filter[0] is not fully included in filter[1]
      isIncongruent: intersectionValue !== value0,
    };
  }

  async getParallelsPieChartValues(orgId: number, settings: ModuleSettings<"PARALLELS_PIE_CHART">) {
    const data: { count: number; filter: number }[] = await this.knex
      .queryBuilder()
      .modify((q) => {
        settings.items.forEach(({ filter }, i) => {
          q.with(`p${i}`, this.parallelsCountQuery(orgId, filter));
        });
        q.with("p_union", (q) => {
          settings.items.forEach((_, i) => {
            q.union((u) => u.from(`p${i}`).select("*"));
          });
        });
      })
      .select(this.count(), this.knex.raw(`-1 as filter`))
      .from("p_union")
      .modify((q) => {
        settings.items.forEach((_, i) => {
          q.union((u) => u.from(`p${i}`).select(this.count(), this.knex.raw(`${i}`)));
        });
      });

    data.sort((a, b) => a.filter - b.filter); // order ASC

    const totalUnique = data.shift();
    assert(totalUnique && totalUnique.filter === -1, "Total unique not found");

    return {
      value: data.map((d) => d.count),
      // pie chart is incongruent if the sum of all parts is not equal to the unique total
      isIncongruent: sumBy(data, (d) => d.count) !== totalUnique.count,
    };
  }

  async getProfilesNumberValue(orgId: number, settings: ModuleSettings<"PROFILES_NUMBER">) {
    const fieldsById = indexBy(
      await this.from("profile_type_field")
        .where("profile_type_id", settings.profileTypeId)
        .whereNull("deleted_at")
        .select("*"),
      (f) => f.id,
    );

    const [{ value }] = await this.knex
      .with(
        "p",
        this.profilesCountQuery(
          orgId,
          settings.profileTypeId,
          settings.filters,
          fieldsById,
          settings,
        ),
      )
      .from("p")
      .select<[{ value: number }]>(
        settings.type === "AGGREGATE"
          ? this.knex.raw(`${settings.aggregate}(aggr::numeric) as value`)
          : this.count("value"),
      );

    return { value };
  }

  async getProfilesRatioValues(orgId: number, settings: ModuleSettings<"PROFILES_RATIO">) {
    assert(
      settings.type === "COUNT" || settings.aggregate === "SUM",
      "Expected type COUNT or aggregate SUM on settings",
    );

    assert(settings.filters.length === 2, "Expected 2 filters");

    const fieldsById = indexBy(
      await this.from("profile_type_field")
        .where("profile_type_id", settings.profileTypeId)
        .whereNull("deleted_at")
        .select("*"),
      (f) => f.id,
    );

    const data: { filter: number; count: number; aggr?: number }[] = await this.knex
      .queryBuilder()
      .modify((q) => {
        settings.filters.forEach((filter, i) => {
          q.with(
            `p${i}`,
            this.profilesCountQuery(orgId, settings.profileTypeId, filter, fieldsById, settings),
          );
        });
        q.with("p_int", (q) =>
          q
            .select("id")
            .from("p0")
            .intersect((q2) => q2.select("id").from("p1")),
        );
      })

      .select(this.knex.raw(`-1 as filter`), this.count(), this.knex.raw("0 as aggr"))
      .from("p_int")
      .modify((q) => {
        settings.filters.forEach((_, i) => {
          q.union((u) =>
            u
              .select(
                this.knex.raw(`${i}`),
                this.count(),
                settings.type === "AGGREGATE"
                  ? this.knex.raw(`${settings.aggregate}(aggr::numeric) as aggr`)
                  : this.knex.raw("0 as aggr"),
              )
              .from(`p${i}`),
          );
        });
      });

    data.sort((a, b) => a.filter - b.filter); // order ASC
    const intersection = data.shift();

    assert(
      isNonNullish(intersection) && intersection.filter === -1 && data.length === 2,
      "Values not found",
    );

    return {
      value: data.map((d) => (settings.type === "COUNT" ? d.count : (d.aggr ?? 0))),
      // ratio is incongruent if filter[0] is not fully included in filter[1]
      isIncongruent: intersection.count !== data[0].count,
    };
  }

  async getProfilesPieChartValues(orgId: number, settings: ModuleSettings<"PROFILES_PIE_CHART">) {
    assert(
      settings.type === "COUNT" || settings.aggregate === "SUM",
      "Expected type COUNT or aggregate SUM on settings",
    );

    const fieldsById = indexBy(
      await this.from("profile_type_field")
        .where("profile_type_id", settings.profileTypeId)
        .whereNull("deleted_at")
        .select("*"),
      (f) => f.id,
    );

    const data: { filter: number; count: number; aggr?: number }[] = await this.knex
      .queryBuilder()
      .modify((q) => {
        settings.items.forEach(({ filter }, i) => {
          q.with(
            `p${i}`,
            this.profilesCountQuery(orgId, settings.profileTypeId, filter, fieldsById, settings),
          );
        });
        q.with("p_union", (q) => {
          settings.items.forEach((_, i) => {
            q.union((u) => u.select("id").from(`p${i}`));
          });
        });
      })
      .select(this.knex.raw(`-1 as filter`), this.count(), this.knex.raw("0 as aggr"))
      .from("p_union")
      .modify((q) => {
        settings.items.forEach((_, i) => {
          q.union((u) =>
            u
              .select(
                this.knex.raw(`${i}`),
                this.count(),
                settings.type === "AGGREGATE"
                  ? this.knex.raw(`${settings.aggregate}(aggr::numeric) as aggr`)
                  : this.knex.raw("0 as aggr"),
              )
              .from(`p${i}`),
          );
        });
      });

    data.sort((a, b) => a.filter - b.filter); // order ASC

    const totalUnique = data.shift();
    assert(totalUnique && totalUnique.filter === -1, "Total unique not found");

    return {
      value: data.map((d) => (settings.type === "COUNT" ? d.count : (d.aggr ?? 0))),
      // pie chart is incongruent if the sum of all parts is not equal to the unique total
      isIncongruent: sumBy(data, (d) => d.count) !== totalUnique.count,
    };
  }
}
