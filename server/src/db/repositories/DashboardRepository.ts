import { inject } from "inversify";
import { Knex } from "knex";
import { indexBy, isNonNullish, isNullish, sumBy, unique } from "remeda";
import { assert } from "ts-essentials";
import {
  PROFILE_TYPE_FIELD_SERVICE,
  ProfileTypeFieldService,
} from "../../services/ProfileTypeFieldService";
import { hashString } from "../../util/token";
import { Replace } from "../../util/types";
import {
  CreateDashboard,
  CreateDashboardModule,
  Dashboard,
  DashboardModule,
  DashboardModuleType,
  ProfileTypeField,
  User,
} from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import {
  PETITION_FILTER_REPOSITORY_HELPER,
  PetitionFilterRepositoryHelper,
} from "../helpers/PetitionFilterRepositoryHelper";
import {
  PROFILE_VALUES_FILTER_REPOSITORY_HELPER,
  ProfileValuesFilterRepositoryHelper,
} from "../helpers/ProfileValuesFilterRepositoryHelper";
import { KNEX } from "../knex";
import { PetitionFilter } from "./PetitionRepository";
import { ProfileFilter } from "./ProfileRepository";

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
  CREATE_PETITION_BUTTON: {
    label: string;
    template_id: number;
  };

  PETITIONS_NUMBER: {
    filters: PetitionFilter;
  };

  PETITIONS_RATIO: {
    graphicType: "RATIO" | "PERCENTAGE";
    filters: [PetitionFilter, PetitionFilter];
  };

  PETITIONS_PIE_CHART: {
    graphicType: "DOUGHNUT" | "PIE";
    items: {
      label: string;
      color: string;
      filter: PetitionFilter;
    }[];
  };

  PROFILES_NUMBER: {
    profileTypeId: number;
    filters: ProfileFilter;
  } & ModuleResultType;

  PROFILES_RATIO: {
    graphicType: "RATIO" | "PERCENTAGE";
    profileTypeId: number;
    filters: [ProfileFilter, ProfileFilter];
  } & ModuleResultType;

  PROFILES_PIE_CHART: {
    graphicType: "DOUGHNUT" | "PIE";
    profileTypeId: number;
    items: {
      label: string;
      color: string;
      filter: ProfileFilter;
    }[];
  } & ModuleResultType & {
      // optionally pass a SELECT profileTypeFieldId to build items array from field values
      groupByProfileTypeFieldId?: number;
      groupByFilter?: ProfileFilter; // extra filters to apply to all grouped items
    };
}[TType];

const COLORS = ["#E2E8F0", "#F5EFE8", "#FEEBC8", "#FED7D7", "#DDDCF8", "#CEEDFF", "#D5E7DE"];

export class DashboardRepository extends BaseRepository {
  constructor(
    @inject(KNEX) knex: Knex,
    @inject(PROFILE_VALUES_FILTER_REPOSITORY_HELPER)
    private profileValuesFilter: ProfileValuesFilterRepositoryHelper,
    @inject(PETITION_FILTER_REPOSITORY_HELPER)
    private petitionFilter: PetitionFilterRepositoryHelper,
    @inject(PROFILE_TYPE_FIELD_SERVICE)
    private profileTypeFields: ProfileTypeFieldService,
  ) {
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

  public readonly loadDashboardModule = this.buildLoadBy("dashboard_module", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  async createDashboard(data: Omit<CreateDashboard, "position">, createdBy: string) {
    const orgDashboards = await this.loadDashboardsByOrgId.raw(data.org_id);
    const lastDashboard = orgDashboards.at(-1);

    const [dashboard] = await this.from("dashboard").insert(
      {
        ...data,
        position: lastDashboard ? lastDashboard.position + 1 : 0,
        created_at: this.now(),
        created_by: createdBy,
      },
      "*",
    );

    return dashboard;
  }

  async updateDashboard(dashboardId: number, data: Partial<Dashboard>, updatedBy: string) {
    const [dashboard] = await this.from("dashboard")
      .where("id", dashboardId)
      .whereNull("deleted_at")
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );

    return dashboard;
  }

  async deleteDashboard(dashboardId: number, deletedBy: string) {
    await this.from("dashboard_module")
      .where({
        dashboard_id: dashboardId,
        deleted_at: null,
      })
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });

    await this.from("dashboard")
      .where({
        id: dashboardId,
        deleted_at: null,
      })
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });
  }

  async cloneDashboard(dashboardId: number, name: string, user: User) {
    const newDashboard = await this.createDashboard(
      {
        org_id: user.org_id,
        name,
      },
      `User:${user.id}`,
    );

    const modules = await this.loadModulesByDashboardId.raw(dashboardId);
    if (modules.length > 0) {
      await this.from("dashboard_module").insert(
        modules.map((module) => ({
          dashboard_id: newDashboard.id,
          position: module.position,
          settings: module.settings,
          type: module.type,
          size: module.size,
          title: module.title,
          created_at: this.now(),
          created_by: `User:${user.id}`,
        })),
      );
    }

    return newDashboard;
  }

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
            and type != 'CREATE_PETITION_BUTTON'
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

  private petitionsCountQuery(orgId: number, filters: PetitionFilter) {
    const builders: Knex.QueryCallbackWithArgs[] = [];
    this.petitionFilter.applyPetitionFilter(builders, filters, "PETITION");

    return (
      this.from({ p: "petition" })
        .where("p.org_id", orgId)
        .where("p.is_template", false)
        .whereNull("p.deleted_at")
        .mmodify(function (q) {
          builders.forEach((b) => b.call(this, q));
          if (filters.path) {
            q.where("p.path", filters.path);
          }
        })
        // this group by is necessary for some of the builders to work
        .select(this.knex.raw(/* sql */ `distinct p.id`))
    );
  }

  private profilesCountQuery(
    orgId: number,
    profileTypeId: number,
    filters: ProfileFilter,
    profileTypeFieldsById: Record<number, ProfileTypeField>,
    settings: ModuleResultType & {
      groupByProfileTypeFieldId?: number;
      groupByFilter?: ProfileFilter;
    },
  ) {
    assert(
      settings.type !== "AGGREGATE" ||
        profileTypeFieldsById[settings.profileTypeFieldId]?.type === "NUMBER",
      "Aggregation can only be done with NUMBER properties",
    );

    assert(
      isNullish(settings.groupByProfileTypeFieldId) ||
        profileTypeFieldsById[settings.groupByProfileTypeFieldId]?.type === "SELECT",
      "Group by can only be done with SELECT properties",
    );

    const joins: Record<number, string> = {};
    return this.from({ p: "profile" })
      .where("p.org_id", orgId)
      .where("profile_type_id", profileTypeId)
      .whereNull("p.deleted_at")
      .mmodify((q) => {
        q.orderBy("p.id").select(this.knex.raw(/* sql */ `distinct on (p.id) p.id`));

        if (settings.type === "AGGREGATE") {
          const profileTypeField = profileTypeFieldsById[settings.profileTypeFieldId];
          this.profileValuesFilter.applyProfileTypeFieldJoin(q, joins, profileTypeField);
          const content = this.profileValuesFilter.getProfileTypeFieldContent(
            joins,
            profileTypeField,
          );
          q.whereRaw(`? is not null`, [content]).select(
            this.knex.raw(/* sql */ `(?->'value')::numeric as aggr`, [content]),
          );
        }

        if (settings.groupByProfileTypeFieldId) {
          const profileTypeField = profileTypeFieldsById[settings.groupByProfileTypeFieldId];
          this.profileValuesFilter.applyProfileTypeFieldJoin(q, joins, profileTypeField);
          const content = this.profileValuesFilter.getProfileTypeFieldContent(
            joins,
            profileTypeField,
          );
          q.select(
            this.knex.raw(/* sql */ `(coalesce(?, '{}'::jsonb)->>'value') as group_by_value`, [
              content,
            ]),
          );
        }

        if (isNonNullish(filters?.status) && filters!.status.length > 0) {
          q.whereIn("p.status", filters.status);
        }
        if (isNonNullish(filters?.values)) {
          assert(
            isNonNullish(profileTypeFieldsById),
            "if filter.values is defined, profileTypeFieldsById is required",
          );
          this.profileValuesFilter.applyProfileValuesFilterJoins(
            q,
            filters.values,
            joins,
            profileTypeFieldsById,
          );
          this.profileValuesFilter.applyProfileValueFilter(
            q,
            filters.values,
            joins,
            profileTypeFieldsById,
            "AND",
          );
        }
      });
  }

  async getPetitionsNumberValue(orgId: number, settings: ModuleSettings<"PETITIONS_NUMBER">) {
    const [{ count }] = await this.knex
      .with("ps", this.petitionsCountQuery(orgId, settings.filters))
      .from("ps")
      .select<[{ count: number }]>(this.count());

    return { count };
  }

  async getPetitionsRatioValues(orgId: number, settings: ModuleSettings<"PETITIONS_RATIO">) {
    assert(settings.filters.length === 2, "Expected 2 filters");

    const data: { count: number; filter: 0 | 1 | -1 }[] = await this.knex
      .with("p0", this.petitionsCountQuery(orgId, settings.filters[0]))
      .with("p1", this.petitionsCountQuery(orgId, settings.filters[1]))
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
      items: [{ count: value0 }, { count: value1 }],
      // ratio is incongruent if filter[0] is not fully included in filter[1]
      isIncongruent: intersectionValue !== value0,
    };
  }

  async getPetitionsPieChartValues(orgId: number, settings: ModuleSettings<"PETITIONS_PIE_CHART">) {
    const data: { count: number; filter: number }[] = await this.knex
      .queryBuilder()
      .modify((q) => {
        settings.items.forEach(({ filter }, i) => {
          q.with(`p${i}`, this.petitionsCountQuery(orgId, filter));
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
      items: data.map((d) => ({
        count: d.count,
        label: settings.items[d.filter].label,
        color: settings.items[d.filter].color,
      })),
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

    const [{ count, aggr }] = await this.knex
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
      .select<[{ count: number; aggr: number | null }]>(
        this.count(),
        settings.type === "AGGREGATE"
          ? this.knex.raw(/* sql */ `coalesce(${settings.aggregate}(aggr::numeric), 0) as aggr`)
          : this.knex.raw(/* sql */ `null as aggr`),
      );

    return { count, aggr };
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
                  ? this.knex.raw(
                      /* sql */ `coalesce(${settings.aggregate}(aggr::numeric), 0) as aggr`,
                    )
                  : this.knex.raw(/* sql */ `null as aggr`),
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
      items: data.map((d) => ({
        count: d.count,
        aggr: d.aggr,
      })),
      isIncongruent: intersection.count !== data[0].count,
    };
  }

  private async profilesPieChartByCustomValues(
    orgId: number,
    settings: ModuleSettings<"PROFILES_PIE_CHART">,
    fieldsById: Record<string, ProfileTypeField>,
  ) {
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
                  ? this.knex.raw(
                      /* sql */ `coalesce(${settings.aggregate}(aggr::numeric), 0) as aggr`,
                    )
                  : this.knex.raw(/* sql */ `null as aggr`),
              )
              .from(`p${i}`),
          );
        });
      });

    data.sort((a, b) => a.filter - b.filter); // order ASC

    const totalUnique = data.shift();
    assert(totalUnique && totalUnique.filter === -1, "Total unique not found");

    return {
      items: data.map((d) => ({
        count: d.count,
        aggr: d.aggr,
        label: settings.items[d.filter].label,
        color: settings.items[d.filter].color,
      })),
      // pie chart is incongruent if the sum of all parts is not equal to the unique total
      isIncongruent: sumBy(data, (d) => d.count) !== totalUnique.count,
    };
  }

  private async profilesPieChartGroupedByFieldValues(
    orgId: number,
    settings: ModuleSettings<"PROFILES_PIE_CHART">,
    fieldsById: Record<string, ProfileTypeField>,
  ) {
    assert(settings.groupByProfileTypeFieldId, "groupByProfileTypeFieldId is required");

    const groupByField = fieldsById[settings.groupByProfileTypeFieldId];
    assert(
      groupByField && groupByField.type === "SELECT",
      `Profile type field ${settings.groupByProfileTypeFieldId} not found`,
    );

    const data: { count: number; aggr?: number; group_by_value: string | null }[] = await this.knex
      .with(
        `p_all`,
        this.profilesCountQuery(
          orgId,
          settings.profileTypeId,
          settings.groupByFilter ?? {},
          fieldsById,
          settings,
        ),
      )
      .select(
        this.count(),
        settings.type === "AGGREGATE"
          ? this.knex.raw(/* sql */ `coalesce(${settings.aggregate}(aggr::numeric), 0) as aggr`)
          : this.knex.raw(/* sql */ `null as aggr`),
        this.knex.raw("group_by_value"),
      )
      .groupBy("p_all.group_by_value")
      .from("p_all");

    const groupByValues = await this.profileTypeFields.loadProfileTypeFieldSelectValues(
      groupByField.options,
    );
    const showOptionsWithColors = !!groupByField.options.showOptionsWithColors;
    return {
      items: data.map((d) => {
        const value = groupByValues.find((v) => v.value === d.group_by_value);
        return {
          count: d.count,
          aggr: d.aggr,
          label: value?.label ?? null,
          color: value
            ? ((showOptionsWithColors ? value.color : null) ??
              COLORS[Math.abs(hashString(value.value)) % COLORS.length])
            : null,
        };
      }),
      isIncongruent: false, // values grouped by SELECT field will never be incongruent
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

    if (isNonNullish(settings.groupByProfileTypeFieldId)) {
      return await this.profilesPieChartGroupedByFieldValues(orgId, settings, fieldsById);
    } else {
      return await this.profilesPieChartByCustomValues(orgId, settings, fieldsById);
    }
  }

  async createDashboardModule<TType extends DashboardModuleType>(
    data: Omit<
      Replace<CreateDashboardModule, { type: TType; settings: ModuleSettings<TType> }>,
      "position"
    >,
    createdBy: string,
  ) {
    const modules = await this.loadModulesByDashboardId.raw(data.dashboard_id); // do not cache as same loader may be called in gql response after creating the module
    const lastModule = modules.at(-1);
    const position = lastModule ? lastModule.position + 1 : 0;

    await this.from("dashboard_module").insert({
      ...data,
      position,
      created_at: this.now(),
      created_by: createdBy,
    });
  }

  async deleteDashboardModule(dashboardId: number, moduleId: number, deletedBy: string) {
    const [module] = await this.from("dashboard_module")
      .where("id", moduleId)
      .where("dashboard_id", dashboardId)
      .update(
        {
          deleted_at: this.now(),
          deleted_by: deletedBy,
        },
        ["position"],
      );

    assert(isNonNullish(module), `Module with id ${moduleId} not found`);

    await this.from("dashboard_module")
      .where("dashboard_id", dashboardId)
      .where("position", ">", module.position)
      .update({
        updated_at: this.now(),
        updated_by: deletedBy,
        position: this.knex.raw(`"position" - 1`) as any,
      });
  }

  async updateDashboardModulePositions(
    dashboardId: number,
    moduleIds: number[],
    updatedBy: string,
  ) {
    await this.withTransaction(async (t) => {
      await this.transactionLock(`reorderDashboardModules(${dashboardId})`, t);
      const allModules = await this.from("dashboard_module", t)
        .where("dashboard_id", dashboardId)
        .whereNull("deleted_at")
        .orderBy("position", "asc")
        .select("*");

      this.validateDashboardModuleReorder(allModules, moduleIds);

      // [id, position]
      // filter all fields that will not change its position
      const modulesToUpdate = allModules
        .map((module, i) =>
          moduleIds[i] === module.id ? null : [module.id, moduleIds.indexOf(module.id)],
        )
        .filter(isNonNullish);

      if (modulesToUpdate.length > 0) {
        await this.raw(
          /* sql */ `
            update dashboard_module as dm set
              position = t.position,
              updated_at = NOW(),
              updated_by = ?
            from (?) as t (id, position)
            where t.id = dm.id;
          `,
          [updatedBy, this.sqlValues(modulesToUpdate, ["int", "int"])],
          t,
        );
      }
    });
  }

  private validateDashboardModuleReorder(allModules: DashboardModule[], moduleIds: number[]) {
    // check only valid moduleIds and not repeated
    const _moduleIds = unique(moduleIds);
    const ids = new Set(allModules.map((m) => m.id));
    if (
      _moduleIds.length !== moduleIds.length ||
      _moduleIds.length !== ids.size ||
      _moduleIds.some((id) => !ids.has(id))
    ) {
      throw new Error("INVALID_MODULE_IDS");
    }
  }
}
