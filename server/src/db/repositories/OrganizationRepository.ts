import { Duration } from "date-fns";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { indexBy, isNonNullish, unique } from "remeda";
import { EMAILS, IEmailsService } from "../../services/EmailsService";
import { BrandTheme, defaultBrandTheme } from "../../util/BrandTheme";
import { defaultPdfDocumentTheme } from "../../util/PdfDocumentTheme";
import { unMaybeArray } from "../../util/arrays";
import { fromGlobalId, isGlobalId } from "../../util/globalId";
import { keyBuilder } from "../../util/keyBuilder";
import { Maybe, MaybeArray } from "../../util/types";
import {
  CreateOrganization,
  CreateOrganizationTheme,
  FeatureFlagName,
  Organization,
  OrganizationStatus,
  OrganizationThemeType,
  OrganizationUsageLimit,
  OrganizationUsageLimitName,
  User,
  UserStatus,
} from "../__types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import { SystemRepository } from "./SystemRepository";

interface TUsageDetail {
  limit: number;
  duration: Duration;
  renewal_cycles?: Maybe<number>; // null will renew indefinitely
}

export interface OrganizationUsageDetails {
  USER_LIMIT: number;
  PETITION_SEND: TUsageDetail;
  // limits the number of uses of the signature production service with our shared API_KEY
  SIGNATURIT_SHARED_APIKEY?: TUsageDetail;
}

@injectable()
export class OrganizationRepository extends BaseRepository {
  constructor(
    @inject(KNEX) knex: Knex,
    @inject(EMAILS) private readonly emails: IEmailsService,
    @inject(SystemRepository) private system: SystemRepository,
  ) {
    super(knex);
  }

  readonly loadOrg = this.buildLoadBy("organization", "id", (q) => q.whereNull("deleted_at"));

  readonly loadOrgOwner = this.buildLoadBy("user", "org_id", (q) =>
    q.where({
      deleted_at: null,
      is_org_owner: true,
      status: "ACTIVE",
    }),
  );

  async getOrganizationsByUserEmail(email: string) {
    return await this.raw<Organization>(
      /* sql */ `
      select * from organization where id in (
	      select u.org_id from "user" u left join "user_data" ud on ud.id = u.user_data_id 
	      where u.deleted_at is null and u.status = 'ACTIVE' and ud.email = ?
      )`,
      [email],
    );
  }

  async loadRootOrganization() {
    const [org] = await this.from("organization").where("status", "ROOT").select("*");
    return org;
  }

  getPaginatedUsersForOrg(
    orgId: number,
    opts: {
      search?: Maybe<string>;
      excludeIds?: Maybe<number[]>;
      searchByEmailOnly?: Maybe<boolean>;
      sortBy?: SortBy<keyof User | "full_name" | "email" | "first_name" | "last_name">[];
      status?: Maybe<UserStatus[]>;
    } & PageOpts,
  ) {
    return this.getPagination<User>(
      this.from("user")
        .join("user_data", "user.user_data_id", "user_data.id")
        .where({ org_id: orgId })
        .whereNull("user.deleted_at")
        .whereNull("user_data.deleted_at")
        .mmodify((q) => {
          const { search, excludeIds, sortBy, status } = opts;
          if (search) {
            q.andWhere((q2) => {
              if (opts.searchByEmailOnly) {
                q2.where("user_data.email", search);
              } else {
                q2.whereSearch(
                  this.knex.raw(`concat(user_data.first_name, ' ', user_data.last_name)`) as any,
                  search,
                ).or.whereSearch("user_data.email", search);
              }
            });
          }
          if (excludeIds) {
            q.whereNotIn("user.id", excludeIds);
          }
          if (sortBy) {
            q.orderByRaw(
              sortBy
                .map((s) => {
                  // nullable columns
                  if (["last_active_at"].includes(s.field)) {
                    const nulls = s.order === "asc" ? "FIRST" : "LAST";
                    return `"${s.field}" ${s.order} NULLS ${nulls}`;
                  } else if (s.field === "full_name") {
                    const nulls = s.order === "asc" ? "FIRST" : "LAST";
                    return `"user_data".first_name ${s.order} NULLS ${nulls}, "user_data".last_name ${s.order} NULLS ${nulls}`;
                  } else if (
                    s.field === "first_name" ||
                    s.field === "last_name" ||
                    s.field === "email"
                  ) {
                    const nulls = s.order === "asc" ? "FIRST" : "LAST";
                    return `"user_data".${s.field} ${s.order} NULLS ${nulls}`;
                  } else {
                    return `"${s.field}" ${s.order}`;
                  }
                })
                .join(", "),
            );
          }

          if (isNonNullish(status) && status.length > 0) {
            q.whereIn("status", status);
          }
        })
        .orderBy("user.id")
        .select("user.*"),
      opts,
    );
  }

  getOrganizationUsersFilteredByEmail(
    orgId: number,
    opts: {
      emails: string[];
    } & PageOpts,
  ) {
    return this.getPagination<User>(
      this.from("user")
        .join("user_data", "user.user_data_id", "user_data.id")
        .where({ org_id: orgId })
        .whereNull("user.deleted_at")
        .whereNull("user_data.deleted_at")
        .whereIn("user_data.email", opts.emails)
        .orderBy("user.id")
        .select("user.*"),
      opts,
    );
  }

  readonly loadActiveUserCount = this.buildLoadCountBy("user", "org_id", (q) =>
    q.whereNull("deleted_at").andWhere("status", "ACTIVE"),
  );

  async updateOrganization(
    id: number,
    data: Partial<Organization>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const [org] = await this.from("organization", t)
      .where("id", id)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .returning("*");
    return org;
  }

  async updateOrganizationLastProfileDigest(orgId: number) {
    await this.from("organization")
      .where("id", orgId)
      .whereNull("deleted_at")
      .update({ last_profile_digest_at: this.now() });
  }

  async updateOrganizationUsageDetails(
    orgId: MaybeArray<number>,
    details: Partial<OrganizationUsageDetails>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const ids = unMaybeArray(orgId);
    return await this.from("organization", t)
      .whereIn("id", ids)
      .update(
        {
          usage_details: this.knex.raw(/* sql */ `"usage_details" ||  ?::jsonb`, [
            JSON.stringify(details),
          ]),
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );
  }

  async updateAppSumoLicense(orgId: number, payload: any, updatedBy: string, t?: Knex.Transaction) {
    const [org] = await this.from("organization", t)
      .where("id", orgId)
      .update({
        appsumo_license: this.knex.raw(
          /* sql */ `coalesce("appsumo_license", '{}'::jsonb) || ?::jsonb || jsonb_build_object('events', coalesce("appsumo_license"->'events','[]'::jsonb) || ?::jsonb)`,
          [payload, payload],
        ),
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .returning("*");
    return org;
  }

  async createOrganization(data: CreateOrganization, createdBy: string, t?: Knex.Transaction) {
    const [org] = await this.insert(
      "organization",
      {
        ...data,
        created_by: createdBy,
        updated_by: createdBy,
      },
      t,
    );
    return org;
  }

  getPaginatedOrganizations(
    opts: {
      search?: string | null;
      sortBy?: SortBy<keyof Organization>[];
      status?: OrganizationStatus | null;
    } & PageOpts,
  ) {
    return this.getPagination<Organization>(
      this.from("organization")
        .whereNull("deleted_at")
        .mmodify((q) => {
          const { search, status, sortBy } = opts;
          if (search) {
            q.whereSearch("name", search);
            if (search.match(/^\d+$/)) {
              q.or.where("id", parseInt(search, 10));
            } else if (isGlobalId(search, "Organization")) {
              q.or.where("id", fromGlobalId(search, "Organization").id);
            }
          }
          if (status) {
            q.where("status", status);
          }
          if (sortBy) {
            q.orderBy(sortBy.map(({ field, order }) => ({ column: field, order })));
          }
        })
        .orderBy("id")
        .select("*"),
      opts,
    );
  }

  readonly loadOrgLogoPath = this.buildLoader<number, Maybe<string>>(async (orgIds, t) => {
    const results = await this.raw<{ id: number; path: string }>(
      /* sql */ `
        select o.id, pfu.path from organization o
        join public_file_upload pfu on o.logo_public_file_id = pfu.id
        where o.id in ?
      `,
      [this.sqlIn(orgIds)],
      t,
    );
    const resultsById = indexBy(results, (x) => x.id);
    return orgIds.map((id) => resultsById[id]?.path ?? null);
  });

  readonly loadOrgIconPath = this.buildLoader<number, Maybe<string>>(async (orgIds, t) => {
    const results = await this.raw<{ id: number; path: string }>(
      /* sql */ `
        select o.id, pfu.path from organization o
        join public_file_upload pfu on o.icon_public_file_id = pfu.id
        where o.id in ?
      `,
      [this.sqlIn(orgIds)],
      t,
    );
    const resultsById = indexBy(results, (x) => x.id);
    return orgIds.map((id) => resultsById[id]?.path ?? null);
  });

  async getOrganizationOwner(orgId: number) {
    const [owner] = await this.from("user")
      .where({
        deleted_at: null,
        org_id: orgId,
        is_org_owner: true,
      })
      .select("*");

    return owner;
  }

  private _loadCurrentOrganizationUsageLimit = this.buildLoader<
    { orgId: number; limitName: OrganizationUsageLimitName },
    OrganizationUsageLimit | null,
    string
  >(
    async (keys, t) => {
      const rows = await this.from("organization_usage_limit", t)
        .whereIn("org_id", unique(keys.map((k) => k.orgId)))
        .whereIn("limit_name", unique(keys.map((k) => k.limitName)))
        .whereNull("period_end_date");
      const byKey = indexBy(rows, keyBuilder(["org_id", "limit_name"]));
      return keys.map(keyBuilder(["orgId", "limitName"])).map((k) => byKey[k] ?? null);
    },
    { cacheKeyFn: keyBuilder(["orgId", "limitName"]) },
  );

  async loadCurrentOrganizationUsageLimit(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    t?: Knex.Transaction,
  ): Promise<OrganizationUsageLimit | null> {
    if (isNonNullish(t)) {
      return await this._loadCurrentOrganizationUsageLimit.raw({ orgId, limitName }, t);
    } else {
      return await this._loadCurrentOrganizationUsageLimit({ orgId, limitName });
    }
  }

  async upsertOrganizationUsageLimit(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    limit: number,
    duration: Duration,
    t?: Knex.Transaction,
  ) {
    const [currentLimit] = await this.from("organization_usage_limit", t)
      .where({
        org_id: orgId,
        limit_name: limitName,
        period_end_date: null,
      })
      .select("*");

    if (isNonNullish(currentLimit)) {
      const [updatedLimit] = await this.from("organization_usage_limit", t)
        .where("id", currentLimit.id)
        .update(
          {
            limit,
            period: this.interval(duration),
          },
          "*",
        );
      return updatedLimit;
    } else {
      const [newLimit] = await this.from("organization_usage_limit", t)
        .insert({
          org_id: orgId,
          limit_name: limitName,
          limit,
          period: this.interval(duration),
        })
        .returning("*");

      return newLimit;
    }
  }

  async updateOrganizationCurrentUsageLimit(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    newLimit: number,
  ) {
    await this.from("organization_usage_limit")
      .where({
        org_id: orgId,
        limit_name: limitName,
        period_end_date: null,
      })
      .update({
        limit: newLimit,
      });
    this._loadCurrentOrganizationUsageLimit.dataloader.clear({ orgId, limitName });
  }

  async updateUsageLimitAsExpired(orgUsageLimitId: number, t?: Knex.Transaction) {
    const [usageLimit] = await this.from("organization_usage_limit", t)
      .where("id", orgUsageLimitId)
      .update({ period_end_date: this.now() }, "*");

    return usageLimit;
  }

  async updateOrganizationCurrentUsageLimitCredits(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    credits: number,
    t?: Knex.Transaction,
  ) {
    if (credits <= 0) {
      return 0;
    }

    const usage = await this.withTransaction(async (t) => {
      const [usage] = await this.from("organization_usage_limit", t)
        .where({
          period_end_date: null,
          limit_name: limitName,
          org_id: orgId,
        })
        .update({ used: this.knex.raw(`used + ?`, [credits]) }, "*");

      // check if org had enough credits before the update
      if (!usage || usage.used - credits >= usage.limit) {
        throw new Error("ORGANIZATION_USAGE_LIMIT_REACHED");
      }

      return usage;
    }, t);

    // if usage reached 80% or 100% of total credits in the period, send warning email to owner and admins
    for (const threshold of [100, 80]) {
      const value = Math.round((usage.limit * threshold) / 100);
      if (usage.used - credits < value && usage.used >= value) {
        const [{ period_end_date: periodEndDate }] = await this.raw<{ period_end_date: Date }>(
          `select (?::timestamptz + ?::interval) as period_end_date;`,
          [usage.period_start_date, this.interval(usage.period)],
          t,
        );
        await this.emails.sendOrganizationLimitsReachedEmail(orgId, limitName, usage.used, t);
        await this.system.createEvent(
          {
            type: "ORGANIZATION_LIMIT_REACHED",
            data: {
              org_id: usage.org_id,
              limit_name: limitName,
              total: usage.limit,
              used: usage.used,
              period_start_date: usage.period_start_date,
              period_end_date: periodEndDate,
            },
          },
          t,
        );
        break;
      }
    }

    return usage;
  }

  async getOrganizationsWithFeatureFlag(name: FeatureFlagName) {
    return await this.raw<Organization>(
      /* sql */ `
      select distinct(o.*) from organization o
      join feature_flag ff on ff.name = ?
      left join feature_flag_override ffoo on ffoo.feature_flag_name = ff.name and ffoo.org_id = o.id
      where coalesce(ffoo.value, ff.default_value) = true
    `,
      [name],
    );
  }

  readonly loadOrganizationTheme = this.buildLoadBy("organization_theme", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadOrgBrandTheme = this.buildLoadBy("organization_theme", "org_id", (q) =>
    q.where("type", "BRAND").whereNull("deleted_at"),
  );

  readonly loadPdfDocumentThemesByOrgId = this.buildLoadMultipleBy(
    "organization_theme",
    "org_id",
    (q) => q.where("type", "PDF_DOCUMENT").whereNull("deleted_at").orderBy("created_at", "desc"),
  );

  async createDefaultOrganizationThemes(orgId: number, createdBy: string, t?: Knex.Transaction) {
    await this.from("organization_theme", t).insert([
      {
        org_id: orgId,
        type: "PDF_DOCUMENT",
        name: "Default",
        is_default: true,
        data: this.json(defaultPdfDocumentTheme),
        created_by: createdBy,
      },
      {
        org_id: orgId,
        type: "BRAND",
        name: "Default",
        is_default: true,
        data: this.json(defaultBrandTheme),
        created_by: createdBy,
      },
    ]);
  }

  async createOrganizationTheme(
    orgId: number,
    name: string,
    type: OrganizationThemeType,
    data: any,
    createdBy: string,
  ) {
    const [theme] = await this.from("organization_theme").insert(
      {
        org_id: orgId,
        name,
        type,
        created_at: this.now(),
        created_by: createdBy,
        updated_at: this.now(),
        updated_by: createdBy,
        data,
        is_default: false,
      },
      "*",
    );

    return theme;
  }

  async updateOrganizationTheme(
    id: number,
    data: Partial<CreateOrganizationTheme>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const [theme] = await this.from("organization_theme", t)
      .where("id", id)
      .whereNull("deleted_at")
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );
    return theme;
  }

  async updateOrganizationBrandThemeDataByOrgId(
    orgId: number,
    data: Partial<BrandTheme>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const [theme] = await this.from("organization_theme", t)
      .where({
        org_id: orgId,
        type: "BRAND",
        is_default: true,
        deleted_at: null,
      })
      .update(
        {
          data: this.knex.raw(/* sql */ `"data" || ?::jsonb`, [JSON.stringify(data)]),
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );
    return theme;
  }

  async deleteOrganizationTheme(id: number, deletedBy: User) {
    await this.withTransaction(async (t) => {
      const [deletedTheme] = await this.from("organization_theme", t)
        .where("id", id)
        .whereNull("deleted_at")
        .update(
          {
            deleted_at: this.now(),
            deleted_by: `User:${deletedBy.id}`,
          },
          "*",
        );

      // update every petition using this deleted theme to go back to the default theme
      await this.raw(
        /* sql */ `
        with default_theme as (select * from organization_theme where org_id = ? and "type" = 'PDF_DOCUMENT' and is_default)
        update petition p set document_organization_theme_id = dt.id
        from default_theme dt
        where p.org_id = ? and p.document_organization_theme_id = ? and p.deleted_at is null
      `,
        [deletedBy.org_id, deletedBy.org_id, deletedTheme.id],
        t,
      );
    });
  }

  async setOrganizationThemeAsDefault(orgThemeId: number, updatedBy: string) {
    /**
     TODO: try to do this with a deferred constraint
    
     with selected_theme as (select * from organization_theme where id = ?)
      update organization_theme ot 
      set 
        is_default = (case ot.id when ? then true else false end),
        updated_at = NOW(),
        updated_by = ?
      from selected_theme st
      where ot.org_id = st.org_id and ot.type = st.type and ot.deleted_at is null
      returning ot.*;
    */
    await this.raw(
      /* sql */ `
      with selected_theme as (select * from organization_theme where id = ?)
      update organization_theme ot 
      set 
        is_default = false,
        updated_at = NOW(),
        updated_by = ?
      from selected_theme st
      where ot.org_id = st.org_id and ot.type = st.type and ot.deleted_at is null
      returning ot.*;
  `,
      [orgThemeId, updatedBy],
    );

    await this.from("organization_theme").where({ id: orgThemeId, deleted_at: null }).update({
      is_default: true,
      updated_at: this.now(),
      updated_by: updatedBy,
    });
  }

  async startNewOrganizationUsageLimitPeriod(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    limit: number,
    duration: Duration,
    t?: Knex.Transaction,
  ) {
    const currentPeriod = await this.loadCurrentOrganizationUsageLimit(orgId, limitName, t);
    let newPeriodStartDate = new Date();
    if (currentPeriod) {
      const oldLimit = await this.updateUsageLimitAsExpired(currentPeriod.id, t);
      newPeriodStartDate = oldLimit.period_end_date!;
    }
    await this.insert(
      "organization_usage_limit",
      {
        org_id: orgId,
        limit_name: limitName,
        limit,
        period: this.interval(duration),
        period_start_date: newPeriodStartDate,
      },
      t,
    );
  }

  getPaginatedUsageLimitsForOrg(
    orgId: number,
    opts: {
      limitName: OrganizationUsageLimitName;
    } & PageOpts,
  ) {
    return this.getPagination<OrganizationUsageLimit>(
      this.from("organization_usage_limit")
        .where({ org_id: orgId, limit_name: opts.limitName })
        .orderBy("period_end_date", "desc")
        .select("*"),
      opts,
    );
  }

  async renewExpiredOrganizationUsageLimits(freePetitionSendDetails: TUsageDetail) {
    return await this.raw<OrganizationUsageLimit>(
      /* sql */ `
      -- select limits that are expired 
      with current_limits as (
        select
          oul.*,
          jsonb_extract_path(o.usage_details, limit_name::text) != 'null'::jsonb as has_usage_defined,
          nullif(jsonb_extract_path(o.usage_details, limit_name::text, 'renewal_cycles'), 'null'::jsonb)::int as usage_renewal_cycles,
          nullif(jsonb_extract_path(o.usage_details, limit_name::text, 'limit'), 'null'::jsonb)::int as usage_limit,
          jsonb_extract_path(o.usage_details, limit_name::text, 'duration') as usage_duration
        from organization_usage_limit oul
        join organization o on o.id = oul.org_id
        where
          period_end_date is null
          and ("period_start_date" at time zone 'UTC') + "period" < now()
      ), 
      -- limits that will be renewed (not counting downgrades)
      renewable_limits as (
        select * from current_limits 
        where has_usage_defined
          and (usage_renewal_cycles is null or cycle_number < usage_renewal_cycles)
      ),
      -- PETITION_SEND limits that will be downgraded to FREE tier
      downgradeable_petition_limits as (
        select * from current_limits cl
        where cl.limit_name = 'PETITION_SEND'
        and cl.id not in (select id from renewable_limits)
      ),
      -- grab every expired limit and set its period_end_date
      -- if limit is renewable, subtract the excess from the used credits
      updated_limits as (
        update organization_usage_limit oul
        set 
          period_end_date = cl.period_start_date + cl.period,
          used = (
            case
              when cl.id in (select id from renewable_limits)
              then cl.used - greatest(0, cl.used - cl.limit) 
              else cl.used 
            end
          )
        from current_limits cl
        where cl.id = oul.id
        returning oul.* 
      ),
      renewed_limits as (
        -- create new limits for renewable limits 
        insert into organization_usage_limit ("org_id", "limit_name", "limit", "used", "period", "period_start_date", "cycle_number")
          select 
            rl.org_id, 
            rl.limit_name, 
            rl.usage_limit as "limit",
            greatest(0, rl.used - rl.limit) as "used",
            make_interval(
              secs => coalesce((usage_duration->'seconds')::int, 0),
              mins => coalesce((usage_duration->'minutes')::int, 0),
              hours => coalesce((usage_duration->'hours')::int, 0),
              days => coalesce((usage_duration->'days')::int, 0),
              weeks => coalesce((usage_duration->'weeks')::int, 0),
              months => coalesce((usage_duration->'months')::int, 0),
              years => coalesce((usage_duration->'years')::int, 0)
            ) as "period",
            rl.period_start_date + rl.period as "period_start_date", 
            rl.cycle_number + 1 as "cycle_number"
          from renewable_limits rl
        returning *
      )
      insert into organization_usage_limit ("org_id", "limit_name", "limit", "period", "period_start_date")
        select 
          dpl.org_id,
          dpl.limit_name,
          ?,
          ?,
          dpl.period_start_date + dpl.period
        from downgradeable_petition_limits dpl
      returning *;
    `,
      [freePetitionSendDetails.limit, this.interval(freePetitionSendDetails.duration)],
    );
  }
}
