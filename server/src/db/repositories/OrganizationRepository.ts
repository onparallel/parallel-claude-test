import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { indexBy } from "remeda";
import { Config, CONFIG } from "../../config";
import { EMAILS, IEmailsService } from "../../services/emails";
import { unMaybeArray } from "../../util/arrays";
import { fromDataLoader } from "../../util/fromDataLoader";
import { defaultPdfDocumentTheme } from "../../util/PdfDocumentTheme";
import { Maybe, MaybeArray } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import {
  CreateOrganization,
  CreateOrganizationTheme,
  CreateOrganizationUsageLimit,
  FeatureFlagName,
  Organization,
  OrganizationStatus,
  OrganizationThemeType,
  OrganizationUsageLimit,
  OrganizationUsageLimitName,
  User,
} from "../__types";
import { SystemRepository } from "./SystemRepository";

export type OrganizationUsageDetails = {
  USER_LIMIT: number;
  PETITION_SEND: {
    limit: number;
    period: string; //pg interval
  };
  // limits the number of uses of the signature production service with our shared API_KEY
  SIGNATURIT_SHARED_APIKEY: {
    limit: number;
    period: string;
  };
};

@injectable()
export class OrganizationRepository extends BaseRepository {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(KNEX) knex: Knex,
    @inject(EMAILS) private readonly emails: IEmailsService,
    @inject(SystemRepository) private system: SystemRepository
  ) {
    super(knex);
  }

  readonly loadOrg = this.buildLoadBy("organization", "id", (q) => q.whereNull("deleted_at"));

  readonly loadOrgOwner = this.buildLoadBy("user", "org_id", (q) =>
    q.whereNull("deleted_at").where("organization_role", "OWNER").where("status", "ACTIVE")
  );

  readonly loadOwnerAndAdmins = this.buildLoadMultipleBy("user", "org_id", (q) =>
    q
      .whereNull("deleted_at")
      .whereIn("organization_role", ["OWNER", "ADMIN"])
      .where("status", "ACTIVE")
  );

  async getOrganizationsByUserEmail(email: string) {
    return await this.raw<Organization>(
      /* sql */ `
      select * from organization where id in (
	      select u.org_id from "user" u left join "user_data" ud on ud.id = u.user_data_id 
	      where u.deleted_at is null and u.status = 'ACTIVE' and ud.email = ?
      )`,
      [email]
    );
  }

  async loadRootOrganization() {
    const [org] = await this.from("organization").where("status", "ROOT").select("*");
    return org;
  }

  async loadOrgUsers(
    orgId: number,
    opts: {
      search?: string | null;
      excludeIds?: number[] | null;
      sortBy?: SortBy<keyof User | "full_name" | "email" | "first_name" | "last_name">[];
      includeInactive?: boolean | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount<any, User[]>(
      this.from("user")
        .join("user_data", "user.user_data_id", "user_data.id")
        .where({ org_id: orgId })
        .whereNull("user.deleted_at")
        .whereNull("user_data.deleted_at")
        .mmodify((q) => {
          const { search, excludeIds, sortBy, includeInactive } = opts;
          if (search) {
            q.andWhere((q2) => {
              q2.whereEscapedILike(
                this.knex.raw(`concat(user_data.first_name, ' ', user_data.last_name)`) as any,
                `%${escapeLike(search, "\\")}%`,
                "\\"
              ).or.whereEscapedILike("user_data.email", `%${escapeLike(search, "\\")}%`, "\\");
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
                .join(", ")
            );
          }
          if (!includeInactive) {
            q.where("status", "ACTIVE");
          }
        })
        .orderBy("user.id")
        .select("user.*"),
      opts
    );
  }

  readonly loadActiveUserCount = this.buildLoadCountBy("user", "org_id", (q) =>
    q.whereNull("deleted_at").andWhere("status", "ACTIVE")
  );

  async updateOrganization(
    id: number,
    data: Partial<CreateOrganization>,
    updatedBy: string,
    t?: Knex.Transaction
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

  async updateAppSumoLicense(orgId: number, payload: any, updatedBy: string, t?: Knex.Transaction) {
    const [org] = await this.from("organization", t)
      .where("id", orgId)
      .update({
        appsumo_license: this.knex.raw(
          /* sql */ `coalesce("appsumo_license", '{}'::jsonb) || ?::jsonb || jsonb_build_object('events', coalesce("appsumo_license"->'events','[]'::jsonb) || ?::jsonb)`,
          [payload, payload]
        ),
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .returning("*");
    return org;
  }

  async createOrganization(data: CreateOrganization, createdBy?: string, t?: Knex.Transaction) {
    const [org] = await this.insert(
      "organization",
      {
        ...data,
        created_by: createdBy,
        updated_by: createdBy,
      },
      t
    );

    await this.createSandboxSignatureIntegration(org.id, createdBy, t);
    await this.createDefaultOrganizationThemes(org.id, createdBy, t);

    return org;
  }

  async loadOrganizations(
    opts: {
      search?: string | null;
      sortBy?: SortBy<keyof Organization>[];
      status?: OrganizationStatus | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("organization")
        .whereNull("deleted_at")
        .mmodify((q) => {
          const { search, status, sortBy } = opts;
          if (search) {
            q.whereEscapedILike("name", `%${escapeLike(search, "\\")}%`, "\\");
          }
          if (status) {
            q.where("status", status);
          }
          if (sortBy) {
            q.orderBy(sortBy);
          }
        })
        .orderBy("id")
        .select("*"),
      opts
    );
  }

  readonly loadOrgLogoPath = fromDataLoader(
    new DataLoader<number, Maybe<string>>(async (orgIds) => {
      const results = await this.raw<{ id: number; path: string }>(
        /* sql */ `
        select o.id, pfu.path from organization o
          join public_file_upload pfu on o.logo_public_file_id = pfu.id
          where o.id in ?
      `,
        [this.sqlIn(orgIds)]
      );
      const resultsById = indexBy(results, (x) => x.id);
      return orgIds.map((id) => resultsById[id]?.path ?? null);
    })
  );

  readonly loadOrgIconPath = fromDataLoader(
    new DataLoader<number, Maybe<string>>(async (orgIds) => {
      const results = await this.raw<{ id: number; path: string }>(
        /* sql */ `
        select o.id, pfu.path from organization o
          join public_file_upload pfu on o.icon_public_file_id = pfu.id
          where o.id in ?
      `,
        [this.sqlIn(orgIds)]
      );
      const resultsById = indexBy(results, (x) => x.id);
      return orgIds.map((id) => resultsById[id]?.path ?? null);
    })
  );

  async getOrganizationOwner(orgId: number) {
    const [owner] = await this.from("user")
      .where({
        deleted_at: null,
        org_id: orgId,
        organization_role: "OWNER",
      })
      .select("*");

    return owner;
  }

  async getOrganizationCurrentUsageLimit(
    orgId: number,
    limitName: OrganizationUsageLimitName
  ): Promise<OrganizationUsageLimit | null> {
    const [row] = await this.from("organization_usage_limit").where({
      org_id: orgId,
      period_end_date: null,
      limit_name: limitName,
    });

    return row;
  }

  async getOrganizationExpiredUsageLimitsAndDetails() {
    return await this.raw<
      OrganizationUsageLimit & { usage_details: OrganizationUsageDetails }
    >(/* sql */ `
      select oul.*, o.usage_details
        from organization_usage_limit oul
        join organization o on o.id = oul.org_id
      where period_end_date is null and ("period_start_date" at time zone 'UTC') + "period" < now()
    `);
  }

  async createOrganizationUsageLimit(
    orgId: number,
    data: MaybeArray<Omit<CreateOrganizationUsageLimit, "org_id">>,
    t?: Knex.Transaction
  ) {
    const dataArr = unMaybeArray(data).map((d) => ({ org_id: orgId, ...d }));
    return await this.insert("organization_usage_limit", dataArr, t);
  }

  async upsertOrganizationUsageLimit(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    limit: number,
    period: string,
    t?: Knex.Transaction
  ) {
    return await this.raw(
      /* sql */ `
      ? 
      ON CONFLICT (org_id, limit_name) WHERE period_end_date is NULL
      DO UPDATE SET
        "limit"=EXCLUDED.limit,
        "period"=EXCLUDED.period
      RETURNING *;`,
      [
        this.from("organization_usage_limit").insert({
          org_id: orgId,
          limit_name: limitName,
          period,
          limit,
        }),
      ],
      t
    );
  }

  async updateUsageLimitAsExpired(orgUsageLimitId: number) {
    return await this.raw<OrganizationUsageLimit>(
      /* sql */ `UPDATE organization_usage_limit SET "period_end_date" = "period_start_date" + "period" WHERE "id" = ? RETURNING *`,
      [orgUsageLimitId]
    );
  }

  async updateOrganizationCurrentUsageLimitCredits(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    credits: number,
    t?: Knex.Transaction
  ) {
    const [usage] = await this.from("organization_usage_limit", t)
      .where({
        period_end_date: null,
        limit_name: limitName,
        org_id: orgId,
      })
      .update({ used: this.knex.raw(`used + ?`, [credits]) }, "*");

    // if usage reached 80% or 100% of total credits in the period, send warning email to owner and admins
    for (const threshold of [100, 80]) {
      const value = Math.round((usage.limit * threshold) / 100);
      if (usage.used - credits < value && usage.used >= value) {
        const [{ period_end_date: periodEndDate }] = await this.raw(
          `select (?::timestamptz + ?::interval) as period_end_date;`,
          [usage.period_start_date, usage.period]
        );
        await this.emails.sendOrganizationLimitsReachedEmail(orgId, limitName, usage.used, t);
        await this.system.createEvent({
          type: "ORGANIZATION_LIMIT_REACHED",
          data: {
            org_id: usage.org_id,
            limit_name: limitName,
            total: usage.limit,
            used: usage.used,
            period_start_date: usage.period_start_date,
            period_end_date: periodEndDate,
          },
        });
        break;
      }
    }
    return usage;
  }

  async createSandboxSignatureIntegration(orgId: number, createdBy?: string, t?: Knex.Transaction) {
    return await this.from("org_integration", t).insert(
      {
        org_id: orgId,
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        name: "Signaturit Sandbox",
        settings: {
          CREDENTIALS: {
            API_KEY: this.config.signature.signaturitSandboxApiKey,
          },
          ENVIRONMENT: "sandbox",
        },
        is_default: true,
        is_enabled: true,
        created_at: this.now(),
        created_by: createdBy,
      },
      "*"
    );
  }

  async getOrganizationsWithFeatureFlag(name: FeatureFlagName) {
    return await this.raw<Organization>(
      /* sql */ `
      select distinct(o.*) from organization o
      join feature_flag ff on ff.name = ?
      left join feature_flag_override ffoo on ffoo.feature_flag_name = ff.name and ffoo.org_id = o.id
      where coalesce(ffoo.value, ff.default_value) = true
    `,
      [name]
    );
  }

  readonly loadOrganizationTheme = this.buildLoadBy("organization_theme", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadPdfDocumentThemesByOrgId = this.buildLoadMultipleBy(
    "organization_theme",
    "org_id",
    (q) => q.where("type", "PDF_DOCUMENT").whereNull("deleted_at").orderBy("created_at", "desc")
  );

  async createDefaultOrganizationThemes(orgId: number, createdBy?: string, t?: Knex.Transaction) {
    await this.from("organization_theme", t).insert({
      org_id: orgId,
      type: "PDF_DOCUMENT",
      name: "Default",
      is_default: true,
      data: JSON.stringify(defaultPdfDocumentTheme),
      created_by: createdBy,
    });
  }

  async createOrganizationTheme(
    orgId: number,
    name: string,
    type: OrganizationThemeType,
    createdBy: string
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
        data: defaultPdfDocumentTheme,
        is_default: false,
      },
      "*"
    );

    return theme;
  }

  async updateOrganizationTheme(
    id: number,
    data: Partial<CreateOrganizationTheme>,
    updatedBy: string,
    t?: Knex.Transaction
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
        "*"
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
          "*"
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
        t
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
      [orgThemeId, updatedBy]
    );

    await this.from("organization_theme").where({ id: orgThemeId, deleted_at: null }).update({
      is_default: true,
      updated_at: this.now(),
      updated_by: updatedBy,
    });
  }
}
