import { inject, injectable } from "inversify";
import { Knex } from "knex";
import pMap from "p-map";
import {
  filter,
  groupBy,
  indexBy,
  isNonNull,
  isNonNullish,
  isNullish,
  map,
  mapValues,
  omit,
  partition,
  pick,
  pipe,
  sortBy,
  times,
  unique,
  uniqueBy,
  zip,
} from "remeda";
import { assert } from "ts-essentials";
import { LocalizableUserText } from "../../graphql";
import { IQueuesService, QUEUES_SERVICE } from "../../services/QueuesService";
import { keyBuilder } from "../../util/keyBuilder";
import { ProfileFieldValuesFilter } from "../../util/ProfileFieldValuesFilter";
import { isAtLeast } from "../../util/profileTypeFieldPermission";
import { LazyPromise } from "../../util/promises/LazyPromise";
import { pMapChunk } from "../../util/promises/pMapChunk";
import { Maybe, MaybeArray, Replace, unMaybeArray } from "../../util/types";
import {
  CreatePetitionProfile,
  CreateProfile,
  CreateProfileExternalSourceEntity,
  CreateProfileRelationship,
  CreateProfileRelationshipType,
  CreateProfileRelationshipTypeAllowedProfileType,
  CreateProfileType,
  CreateProfileTypeField,
  CreateProfileTypeProcess,
  Organization,
  Petition,
  PetitionProfile,
  Profile,
  ProfileEvent,
  ProfileEventType,
  ProfileFieldFile,
  ProfileFieldValue,
  ProfileRelationship,
  ProfileRelationshipTypeAllowedProfileType,
  ProfileRelationshipTypeDirection,
  ProfileStatus,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldPermissionType,
  ProfileTypeFieldType,
  ProfileTypeProcess,
  ProfileTypeStandardType,
  User,
  UserLocale,
} from "../__types";
import {
  CreateProfileEvent,
  ProfileFieldExpiryUpdatedEvent,
  ProfileFieldFileAddedEvent,
  ProfileFieldFileRemovedEvent,
  ProfileFieldValueUpdatedEvent,
} from "../events/ProfileEvent";
import { BaseRepository, PageOpts, Pagination } from "../helpers/BaseRepository";
import { contentsAreEqual } from "../helpers/petitionProfileMapper";
import {
  ProfileTypeFieldOptions,
  profileTypeFieldSelectValues,
} from "../helpers/profileTypeFieldOptions";
import {
  PROFILE_VALUES_FILTER_REPOSITORY_HELPER,
  ProfileValuesFilterRepositoryHelper,
} from "../helpers/ProfileValuesFilterRepositoryHelper";
import { SortBy } from "../helpers/utils";
import { KNEX } from "../knex";

export interface ProfileFilter {
  profileId?: number[] | null;
  profileTypeId?: number[] | null;
  status?: ProfileStatus[] | null;
  values?: ProfileFieldValuesFilter | null;
}

@injectable()
export class ProfileRepository extends BaseRepository {
  constructor(
    @inject(KNEX) knex: Knex,
    @inject(QUEUES_SERVICE) private queues: IQueuesService,
    @inject(PROFILE_VALUES_FILTER_REPOSITORY_HELPER)
    private profileValuesFilter: ProfileValuesFilterRepositoryHelper,
  ) {
    super(knex);
  }

  readonly loadProfileType = this.buildLoadBy("profile_type", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadProfileTypesByOrgId = this.buildLoadMultipleBy("profile_type", "org_id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadProfileTypeField = this.buildLoadBy("profile_type_field", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadProfileTypeFieldsByProfileTypeId = this.buildLoadMultipleBy(
    "profile_type_field",
    "profile_type_id",
    (q) => q.whereNull("deleted_at").orderBy("position", "asc"),
  );

  readonly loadProfileTypeFieldsByProfileTypeIdFiltered = this.buildLoader<
    {
      profileTypeId: number;
      filter: {
        alias?: string | null;
        profileTypeFieldId?: number | null;
      }[];
    },
    ProfileTypeField[],
    string
  >(
    async (keys, t) => {
      const profileTypeIds = unique(keys.map((k) => k.profileTypeId));
      const aliases = unique(
        keys.flatMap((k) => k.filter.map((f) => f.alias)).filter(isNonNullish),
      );
      const profileTypeFieldIds = unique(
        keys.flatMap((k) => k.filter.map((f) => f.profileTypeFieldId)).filter(isNonNullish),
      );
      const rows = await this.from("profile_type_field", t)
        .whereIn("profile_type_id", profileTypeIds)
        .where((q) => {
          if (aliases.length > 0) {
            q.orWhereIn("alias", aliases);
          }
          if (profileTypeFieldIds.length > 0) {
            q.orWhereIn("id", profileTypeFieldIds);
          }
        })
        .whereNull("deleted_at")
        .orderBy("position", "asc")
        .select("*");

      const byId = groupBy(rows, (d) => d.profile_type_id);
      return keys.map((key) => {
        return (byId[key.profileTypeId] ?? []).filter((field) => {
          return key.filter.some((filter) => {
            if (filter.alias !== undefined && field.alias !== filter.alias) {
              return false;
            }
            if (filter.profileTypeFieldId && field.id !== filter.profileTypeFieldId) {
              return false;
            }
            return true;
          });
        });
      });
    },
    {
      cacheKeyFn: keyBuilder([
        "profileTypeId",
        (k) => k.filter.map((f) => `${f.alias}-${f.profileTypeFieldId}`).join(";"),
      ]),
    },
  );

  private readonly loadProfileTypeForProfileId = this.buildLoader<number, ProfileType | null>(
    async (keys, t) => {
      const profileTypes = await this.raw<ProfileType & { profile_id: number }>(
        /* sql */ `
        select pt.*, p.id as profile_id
        from "profile" p join profile_type pt on p.profile_type_id = pt.id
        where p.id in ? and p.deleted_at is null and pt.deleted_at is null
      `,
        [this.sqlIn(keys)],
        t,
      );
      const byId = indexBy(profileTypes, (pt) => pt.profile_id);
      return keys.map((id) => (isNonNullish(byId[id]) ? omit(byId[id], ["profile_id"]) : null));
    },
  );

  getPaginatedProfileTypesForOrg(
    orgId: number,
    opts: {
      search?: string | null;
      locale?: UserLocale;
      sortBy?: SortBy<"created_at" | "name">[];
      filter?: {
        includeArchived?: boolean | null;
        onlyArchived?: boolean | null;
        profileTypeId?: number[] | null;
      } | null;
    } & PageOpts,
  ) {
    return this.getPagination<ProfileType>(
      this.from("profile_type")
        .where("org_id", orgId)
        .whereNull("deleted_at")
        .mmodify((q) => {
          const { search, sortBy, locale, filter } = opts;

          if (filter?.includeArchived) {
            //nothing
          } else if (filter?.onlyArchived) {
            q.whereNotNull("archived_at");
          } else {
            q.whereNull("archived_at");
          }

          if (filter?.profileTypeId && filter.profileTypeId.length > 0) {
            q.whereIn("id", filter.profileTypeId);
          }

          if (search) {
            q.whereExists((q) =>
              q
                .select(this.knex.raw("1"))
                .fromRaw(`jsonb_each_text(name) AS t(key, value)`)
                .whereSearch("value", search),
            );
          }
          if (sortBy) {
            q.orderBy(
              sortBy.map(({ field, order }) => {
                if (field === "name") {
                  return { column: this.knex.raw(`"name"->>?`, [locale!]) as any, order };
                }
                return { column: field, order };
              }),
            );
          }
        })
        .orderBy("id")
        .select("*"),
      opts,
    );
  }

  async createProfileType(
    data: MaybeArray<CreateProfileType>,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    const dataArr = unMaybeArray(data);
    if (dataArr.length === 0) {
      throw new Error("No data provided");
    }
    return await this.from("profile_type", t).insert(
      dataArr.map((d) => ({
        ...d,
        created_by: createdBy,
        updated_by: createdBy,
      })),
      "*",
    );
  }

  async updateProfileType(
    id: number,
    data: Partial<CreateProfileType>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const [profileType] = await this.from("profile_type", t)
      .where({ id })
      .whereNull("deleted_at")
      .update(
        {
          ...omit(data, ["profile_name_pattern"]),
          profile_name_pattern: data.profile_name_pattern
            ? this.json(data.profile_name_pattern)
            : undefined,
          updated_by: updatedBy,
          updated_at: this.now(),
        },
        "*",
      );

    return profileType;
  }

  async cloneProfileType(
    id: number,
    data: Partial<CreateProfileType>,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    return await this.withTransaction(async (t) => {
      const sourceProfileType = (await this.loadProfileType.raw(id, t))!;
      const [profileType] = await this.createProfileType(
        { ...pick(sourceProfileType, ["org_id", "name", "name_plural", "icon"]), ...data },
        createdBy,
        t,
      );
      const sourceFields = await this.loadProfileTypeFieldsByProfileTypeId.raw(
        sourceProfileType.id,
        t,
      );
      const fields =
        sourceFields.length === 0
          ? []
          : await this.insert(
              "profile_type_field",
              sourceFields.map((field) => ({
                ...omit(field, [
                  "id",
                  "profile_type_id",
                  "expiry_alert_ahead_time",
                  "created_at",
                  "updated_at",
                ]),
                // when cloning a standard profile_type, set alias to null so cloned fields are not considered standard
                alias: sourceProfileType.standard_type ? null : field.alias,
                // remove "isStandard" from options values when cloning a standard profile_type, so the user can edit options
                options:
                  field.type === "SELECT"
                    ? {
                        ...field.options,
                        values: (field.options.values ?? []).map((v: any) => ({
                          ...omit(v, ["isStandard"]),
                        })),
                      }
                    : field.options,
                profile_type_id: profileType.id,
                expiry_alert_ahead_time:
                  field.is_expirable && field.expiry_alert_ahead_time
                    ? this.interval(field.expiry_alert_ahead_time)
                    : null,
                created_by: createdBy,
                updated_by: createdBy,
              })),
              t,
            ).returning("*");
      // update profile name pattern with new fields
      const [updatedProfileType] = await this.from("profile_type", t)
        .where({ id: profileType.id })
        .whereNull("deleted_at")
        .update(
          {
            profile_name_pattern: this.json(
              (sourceProfileType.profile_name_pattern as (number | string)[]).map((p) => {
                if (typeof p === "string") {
                  return p;
                } else {
                  // find cloned by position
                  const position = sourceFields.find((sf) => sf.id === p)!.position;
                  return fields.find((f) => f.position === position)!.id;
                }
              }),
            ),
          },
          "*",
        );
      return updatedProfileType;
    }, t);
  }

  async deleteProfileTypes(id: MaybeArray<number>, deletedBy: string, t?: Knex.Transaction) {
    const ids = unMaybeArray(id);
    if (ids.length === 0) {
      return;
    }
    await this.from("profile_type", t).whereIn("id", ids).whereNull("deleted_at").update({
      deleted_at: this.now(),
      deleted_by: deletedBy,
    });
  }

  async archiveProfileTypes(id: MaybeArray<number>, userId: number, t?: Knex.Transaction) {
    const ids = unMaybeArray(id);
    if (ids.length === 0) {
      return [];
    }
    return await this.from("profile_type", t)
      .whereIn("id", ids)
      .whereNull("deleted_at")
      .whereNull("archived_at")
      .update(
        {
          archived_at: this.now(),
          archived_by_user_id: userId,
        },
        "*",
      );
  }

  async unarchiveProfileTypes(id: MaybeArray<number>, t?: Knex.Transaction) {
    const ids = unMaybeArray(id);
    if (ids.length === 0) {
      return [];
    }
    return await this.from("profile_type", t)
      .whereIn("id", ids)
      .whereNull("deleted_at")
      .whereNotNull("archived_at")
      .update(
        {
          archived_at: null,
          archived_by_user_id: null,
        },
        "*",
      );
  }

  async createProfileTypeField(
    profileTypeId: number,
    data: MaybeArray<
      Replace<
        Omit<CreateProfileTypeField, "profile_type_id" | "position">,
        { name: LocalizableUserText }
      >
    >,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    const dataArr = unMaybeArray(data);
    if (dataArr.length === 0) {
      throw new Error("No data provided");
    }

    return await this.withTransaction(async (t) => {
      const [{ max }] = await this.from("profile_type_field", t)
        .whereNull("deleted_at")
        .where("profile_type_id", profileTypeId)
        .max("position");
      return await this.insert(
        "profile_type_field",
        dataArr.map((d, index) => ({
          profile_type_id: profileTypeId,
          position: max === null ? index : max + 1 + index,
          ...d,
          expiry_alert_ahead_time: isNonNullish(d.expiry_alert_ahead_time)
            ? this.interval(d.expiry_alert_ahead_time)
            : d.expiry_alert_ahead_time,
          created_by: createdBy,
          updated_by: createdBy,
        })),
        t,
      );
    }, t);
  }

  async updateProfileTypeField(
    id: MaybeArray<number>,
    data: Partial<Omit<CreateProfileTypeField, "position">>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const ids = unMaybeArray(id);
    return await this.from("profile_type_field", t)
      .whereIn("id", ids)
      .whereNull("deleted_at")
      .update(
        {
          ...data,
          expiry_alert_ahead_time: isNonNullish(data.expiry_alert_ahead_time)
            ? this.interval(data.expiry_alert_ahead_time)
            : data.expiry_alert_ahead_time,
          updated_by: updatedBy,
          updated_at: this.now(),
        },
        "*",
      );
  }

  async deleteProfileTypeFields(
    profileTypeId: number,
    profileTypeFieldIds: MaybeArray<number>,
    deletedBy: string,
  ) {
    if (Array.isArray(profileTypeFieldIds) && profileTypeFieldIds.length === 0) {
      return;
    }
    await this.withTransaction(async (t) => {
      await this.from("profile_type_field", t)
        .whereIn("id", unMaybeArray(profileTypeFieldIds))
        .whereNull("deleted_at")
        .update({ deleted_at: this.now(), deleted_by: deletedBy });
      await Promise.all([
        this.raw(
          /* sql */ `
            with new_positions as (
              select id, rank() over (order by position asc) - 1 as position
              from profile_type_field
              where profile_type_id = ? and deleted_at is null
            )
            update profile_type_field as ptf set
              position = np.position,
              updated_at = NOW(),
              updated_by = ?
            from new_positions np
            where np.id = ptf.id and np.position != ptf.position
          `,
          [profileTypeId, deletedBy],
          t,
        ),
        this.from("profile_field_value")
          .whereNull("deleted_at")
          .whereIn("profile_type_field_id", unMaybeArray(profileTypeFieldIds))
          .update({ deleted_at: this.now(), deleted_by: deletedBy }),
        this.from("profile_field_file")
          .whereNull("deleted_at")
          .whereIn("profile_type_field_id", unMaybeArray(profileTypeFieldIds))
          .update({ deleted_at: this.now(), deleted_by: deletedBy }),
      ]);
    });
    this.loadProfileTypeFieldsByProfileTypeId.dataloader.clear(profileTypeId);
  }

  async deleteProfileTypeFieldsByProfileTypeId(
    profileTypeId: MaybeArray<number>,
    deletedBy: string,
    t?: Knex.Transaction,
  ) {
    const profileTypeIds = unMaybeArray(profileTypeId);
    if (profileTypeIds.length === 0) {
      return;
    }
    await this.from("profile_type_field", t)
      .whereIn("profile_type_id", profileTypeIds)
      .whereNull("deleted_at")
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });
  }

  async updateProfileTypeFieldPositions(
    profileTypeId: number,
    profileTypeFieldIds: number[],
    updatedBy: string,
  ) {
    return await this.withTransaction(async (t) => {
      const profileTypeFields = await this.loadProfileTypeFieldsByProfileTypeId.raw(
        profileTypeId,
        t,
      );

      // check only valid fieldIds and not repeated
      const _profileTypeFieldIds = unique(profileTypeFieldIds);
      const ids = new Set(profileTypeFields.map((f) => f.id));
      if (
        _profileTypeFieldIds.length !== profileTypeFieldIds.length ||
        _profileTypeFieldIds.length !== ids.size ||
        _profileTypeFieldIds.some((id) => !ids.has(id))
      ) {
        throw new Error("INVALID_PROFILE_FIELD_IDS");
      }

      await this.raw(
        /* sql */ `
          update profile_type_field as ptf set
            position = t.position,
            updated_at = NOW(),
            updated_by = ?
          from (?) as t (id, position)
          where t.id = ptf.id and ptf.position != t.position;
        `,
        [
          updatedBy,
          this.sqlValues(
            profileTypeFieldIds.map((id, i) => [id, i]),
            ["int", "int"],
          ),
        ],
        t,
      );
      this.loadProfileTypeFieldsByProfileTypeId.dataloader.clear(profileTypeId);
    });
  }

  readonly loadProfile = this.buildLoadBy("profile", "id", (q) => q.whereNull("deleted_at"));

  readonly loadProfileFieldValuesByProfileId = this.buildLoadMultipleBy(
    "profile_field_value",
    "profile_id",
    (q) => q.whereNull("removed_at").whereNull("deleted_at"),
  );

  readonly loadProfileFieldValue = this.buildLoader<
    {
      profileId: number;
      profileTypeFieldId: number;
    },
    ProfileFieldValue | null,
    string
  >(
    async (keys, t) => {
      const values = await this.from("profile_field_value", t)
        .whereIn("profile_id", unique(keys.map((k) => k.profileId)))
        .whereIn("profile_type_field_id", unique(keys.map((k) => k.profileTypeFieldId)))
        .whereNull("removed_at")
        .whereNull("deleted_at");
      const byKey = indexBy(values, keyBuilder(["profile_id", "profile_type_field_id"]));
      return keys.map(keyBuilder(["profileId", "profileTypeFieldId"])).map((k) => byKey[k] ?? null);
    },
    { cacheKeyFn: keyBuilder(["profileId", "profileTypeFieldId"]) },
  );

  readonly loadProfileFieldFiles = this.buildLoader<
    {
      profileId: number;
      profileTypeFieldId: number;
    },
    ProfileFieldFile[] | null,
    string
  >(
    async (keys, t) => {
      const files = await this.from("profile_field_file", t)
        .whereIn("profile_id", unique(keys.map((k) => k.profileId)))
        .whereIn("profile_type_field_id", unique(keys.map((k) => k.profileTypeFieldId)))
        .whereNull("removed_at")
        .whereNull("deleted_at");
      const byKey = groupBy(files, keyBuilder(["profile_id", "profile_type_field_id"]));
      return keys.map(keyBuilder(["profileId", "profileTypeFieldId"])).map((k) => byKey[k] ?? null);
    },
    { cacheKeyFn: keyBuilder(["profileId", "profileTypeFieldId"]) },
  );

  readonly loadProfileFieldFileById = this.buildLoadBy("profile_field_file", "id", (q) =>
    q.whereNull("removed_at").whereNull("deleted_at").whereNotNull("file_upload_id"),
  );

  readonly loadProfileFieldFilesByProfileId = this.buildLoadMultipleBy(
    "profile_field_file",
    "profile_id",
    (q) => q.whereNull("removed_at").whereNull("deleted_at").whereNotNull("file_upload_id"),
  );

  async deleteProfileFieldFiles(profileFieldFileId: MaybeArray<number>, userId: number) {
    const ids = unMaybeArray(profileFieldFileId);
    if (ids.length === 0) {
      return [];
    }

    return await this.from("profile_field_file")
      .whereIn("id", ids)
      .where({ removed_at: null })
      .update(
        {
          removed_at: this.now(),
          removed_by_user_id: userId,
        },
        "*",
      );
  }

  async deleteProfileFieldFilesByProfileTypeFieldId(profileTypeFieldId: number, userId: number) {
    return await this.from("profile_field_file")
      .where({ removed_at: null, profile_type_field_id: profileTypeFieldId })
      .update(
        {
          removed_at: this.now(),
          removed_by_user_id: userId,
        },
        "*",
      );
  }

  getPaginatedProfileForOrg(
    orgId: number,
    opts: {
      search?: string | null;
      filter?: ProfileFilter | null;
      sortBy?: SortBy<"createdAt" | "name">[] | null;
    } & PageOpts,
    profileTypeFieldsById?: Record<number, ProfileTypeField>,
  ) {
    const columnMap = {
      createdAt: "created_at",
      name: "name_en",
    } as const;

    return this.getPagination<Profile>(
      this.knex
        .with(
          "p",
          this.from({ p: "profile" })
            .where("p.org_id", orgId)
            .whereNull("p.deleted_at")
            .mmodify((q) => {
              const { search, filter } = opts;
              if (search) {
                q.where((q1) =>
                  q1
                    .whereSearch(this.knex.raw("p.localizable_name->>'en'"), search)
                    .or.whereSearch(this.knex.raw("p.localizable_name->>'es'"), search),
                );
              }
              if (isNonNullish(filter?.profileId)) {
                q.whereIn("p.id", filter!.profileId);
              }
              if (isNonNullish(filter?.profileTypeId)) {
                q.whereIn("p.profile_type_id", unMaybeArray(filter!.profileTypeId));
              }
              if (isNonNullish(filter?.status) && filter!.status.length > 0) {
                q.whereIn("p.status", filter!.status);
              }
              if (isNonNullish(filter?.values)) {
                assert(
                  isNonNullish(profileTypeFieldsById),
                  "if filter.values is defined, profileTypeFieldsById is required",
                );
                const joins: Record<number, string> = {};
                this.profileValuesFilter.applyProfileValuesFilterJoins(
                  q,
                  filter.values,
                  joins,
                  profileTypeFieldsById,
                );
                this.profileValuesFilter.applyProfileValueFilter(
                  q,
                  filter.values,
                  joins,
                  profileTypeFieldsById,
                  "AND",
                );
              }
            })
            .orderBy("p.id")
            .select(this.knex.raw("distinct on (p.id) p.*")),
        )
        .from("p")
        .mmodify((q) => {
          if (isNonNullish(opts.sortBy) && opts.sortBy.length > 0) {
            q.orderByRaw(
              opts.sortBy
                .map((s) => {
                  const field = columnMap[s.field];
                  if (field === "name_en") {
                    return `"localizable_name"->>'en' ${s.order}`;
                  } else {
                    return `"${field}" ${s.order}`;
                  }
                })
                .join(", "),
            );
          }
        })
        .orderBy("p.id")
        .select("p.*"),
      opts,
    );
  }

  async createProfile(data: Omit<CreateProfile, "name">, userId: number) {
    return await this.withTransaction(async (t) => {
      const [profile] = await this.insert(
        "profile",
        {
          ...data,
          name: "", // deprecated
          created_at: this.now(),
          created_by: `User:${userId}`,
        },
        t,
      );
      await this.createEvent(
        {
          org_id: data.org_id,
          profile_id: profile.id,
          type: "PROFILE_CREATED",
          data: {
            user_id: userId,
          },
        },
        t,
      );
      return profile;
    });
  }

  async updateProfileStatus(profileIds: number[], status: ProfileStatus, updatedBy: string) {
    if (profileIds.length === 0) {
      return [];
    }
    return await this.raw<Profile>(
      /* sql */ `
      update "profile"
      set
        status = ?,
        closed_at = (
          case 
            when ? = 'OPEN' then null
            when ? = 'CLOSED' then coalesce(closed_at, now())
            else closed_at
          end
        ),
        deletion_scheduled_at = (
          case
            when ? = 'DELETION_SCHEDULED' then now()
            else null
          end
        ),
        updated_by = ?,
        updated_at = now()
      where id in ?
      and deleted_at is null
      and status != ?
      returning *;
    `,
      [status, status, status, status, updatedBy, this.sqlIn(profileIds), status],
    );
  }

  async countProfilesWithValuesOrFilesByProfileTypeFieldId(profileTypeFieldIds: number[]) {
    const [{ count }] = await this.raw<{ count: number }>(
      /* sql */ `
        with from_values as (
            select distinct profile_id from profile_field_value
            where profile_type_field_id in ? and deleted_at is null and removed_at is null
          ), from_files as (
            select distinct profile_id from profile_field_file
            where profile_type_field_id in ? and deleted_at is null and removed_at is null
          ), from_all as (
            select profile_id from from_values
            union
            select profile_id from from_files
          ) select count(*) from from_all
    `,
      [this.sqlIn(profileTypeFieldIds), this.sqlIn(profileTypeFieldIds)],
    );
    return count;
  }

  async updateProfileNamesWithPattern(
    pattern: (number | string)[],
    profileValues: {
      profileId: number;
      values: {
        [profileTypeFieldId: number]: string | null;
      };
    }[],
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const profileTypeFieldIds = pattern.filter((p) => typeof p === "number") as number[];
    const profileTypeFields = await this.loadProfileTypeField.raw(profileTypeFieldIds, t);
    const selectValuesById = Object.fromEntries(
      await pMap(
        profileTypeFields.filter((f) => f?.type === "SELECT"),
        async (field) => [field!.id, await profileTypeFieldSelectValues(field!.options)] as const,
        { concurrency: 10 },
      ),
    );

    // on SELECT properties, we need to replace the value with the label.
    const profileValuesWithSelectLabels = profileValues.map((pv) => ({
      profileId: pv.profileId,
      values: mapValues(pv.values, (value, fieldId) => {
        if (isNonNullish(selectValuesById[fieldId])) {
          const selectValue = selectValuesById[fieldId].find((v) => v.value === value);
          return selectValue
            ? { en: selectValue.label["en"], es: selectValue.label["es"] }
            : { en: value, es: value };
        } else {
          return value;
        }
      }),
    }));

    return await this.raw<Profile>(
      /* sql */ `
        with pv(id, values) as ( 
          ?
        ),
        names as (
          select
            id,
            substring(trim(both from concat(${times(pattern.length, () => "?::text").join(",")})), 1, 255) as en,
            substring(trim(both from concat(${times(pattern.length, () => "?::text").join(",")})), 1, 255) as es
          from pv
        )
        update "profile" p set
          localizable_name = ?,
          updated_by = ?,
          updated_at = now()
        from names
        where names.id = p.id
        returning p.*;
      `,
      [
        this.sqlValues(
          profileValuesWithSelectLabels.map((pv) => [pv.profileId, JSON.stringify(pv.values)]),
          ["int", "jsonb"],
        ),
        ...pattern.map((p) =>
          typeof p === "string"
            ? p
            : isNonNullish(selectValuesById[p])
              ? this.knex.raw(`coalesce(pv.values->?->>'en', pv.values->?->>'es', '')`, [
                  `${p}`,
                  `${p}`,
                ])
              : this.knex.raw(`coalesce(pv.values->>?, '')`, [`${p}`]),
        ),
        ...pattern.map((p) =>
          typeof p === "string"
            ? p
            : isNonNullish(selectValuesById[p])
              ? this.knex.raw(`coalesce(pv.values->?->>'es', pv.values->?->>'en', '')`, [
                  `${p}`,
                  `${p}`,
                ])
              : this.knex.raw(`coalesce(pv.values->>?, '')`, [`${p}`]),
        ),
        Object.keys(selectValuesById).length > 0
          ? this.knex.raw(`jsonb_build_object('en', en, 'es', es)`)
          : this.knex.raw(`jsonb_build_object('en', en)`),
        updatedBy,
      ],
      t,
    );
  }

  async updateProfileNamesByProfileTypePattern(
    profileTypeId: number,
    pattern: (string | number)[],
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    return await this.withTransaction(async (t) => {
      const profileValues = await this.raw<{
        profileId: number;
        values: {
          [profileTypeFieldId: number]: string | null;
        };
      }>(
        /* sql */ `
        select 
          p.id "profileId",
          jsonb_object_agg(
            coalesce(pfv.profile_type_field_id, 0), 
            pfv.content->>'value'
          ) as values
        from "profile" p
        left join profile_field_value pfv
          on pfv.profile_id = p.id and pfv.profile_type_field_id in ?
          and pfv.deleted_at is null and pfv.removed_at is null
        where
          p.profile_type_id = ?
          and p.deleted_at is null 
          group by p.id;
      `,
        [this.sqlIn(pattern.filter((p) => typeof p === "number")), profileTypeId],
        t,
      );

      if (profileValues.length > 0) {
        await pMapChunk(
          profileValues,
          async (chunk) => {
            await this.updateProfileNamesWithPattern(pattern, chunk, updatedBy, t);
          },
          {
            concurrency: 1,
            chunkSize: 100,
          },
        );
      }
    }, t);
  }

  async deleteProfile(profileId: MaybeArray<number>, deletedBy: string, t?: Knex.Transaction) {
    const ids = unMaybeArray(profileId);
    if (ids.length === 0) {
      return;
    }

    await this.from("petition_profile", t).whereIn("profile_id", ids).delete();

    await this.from("profile_field_value", t)
      .whereIn("profile_id", ids)
      .whereNull("deleted_at")
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });

    await this.from("profile_field_file", t)
      .whereIn("profile_id", ids)
      .whereNull("deleted_at")
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });

    await this.from("petition_field_reply", t)
      .whereNull("deleted_at")
      .whereNotNull("associated_profile_id")
      .whereIn("associated_profile_id", ids)
      .update({
        associated_profile_id: null,
        updated_at: this.now(),
        updated_by: deletedBy,
      });

    await this.from("profile", t).whereIn("id", ids).whereNull("deleted_at").update({
      deleted_at: this.now(),
      deleted_by: deletedBy,
    });
  }

  async deleteProfilesByProfileTypeId(
    profileTypeIds: MaybeArray<number>,
    deletedBy: string,
    t?: Knex.Transaction,
  ) {
    const ids = unMaybeArray(profileTypeIds);
    if (ids.length === 0) {
      return;
    }
    await this.from("profile", t).whereIn("profile_type_id", ids).whereNull("deleted_at").update({
      deleted_at: this.now(),
      deleted_by: deletedBy,
    });
  }

  async updateProfileFieldValue(
    profileId: number,
    _fields: {
      profileTypeFieldId: number;
      type: ProfileTypeFieldType;
      content?: Record<string, any> | null;
      expiryDate?: string | null;
    }[],
    userId: number | null,
    externalSourceIntegrationId?: number,
  ) {
    //ignore fields that have no content and no expiry date
    const fields = _fields.filter((f) => f.content !== undefined || f.expiryDate !== undefined);
    if (fields.length === 0) {
      return {
        profile: await this.loadProfile.raw(profileId),
        previousValues: [],
        currentValues: [],
      };
    }

    return await this.withTransaction(async (t) => {
      const profileValues = await this.from("profile_field_value", t)
        .whereNull("deleted_at")
        .whereNull("removed_at")
        .where("profile_id", profileId)
        .whereIn(
          "profile_type_field_id",
          fields.map((f) => f.profileTypeFieldId),
        )
        .select("*");

      const profileValuesByPtfId = indexBy(profileValues, (v) => v.profile_type_field_id);

      const removedFields = fields.filter((f) => f.content === null);
      const updatedFields = fields.filter((f) => {
        const currentValue = profileValuesByPtfId[f.profileTypeFieldId];
        return (
          f.content !== null &&
          (!currentValue ||
            (isNonNullish(f.content) && !contentsAreEqual(f as any, currentValue)) ||
            f.expiryDate !== currentValue.expiry_date)
        );
      });

      // mark as removed values with null content, or with distinct content or expiryDate from its current value
      const removeOrUpdateFields = [...removedFields, ...updatedFields];

      const previousValues =
        removeOrUpdateFields.length > 0
          ? await this.from("profile_field_value", t)
              .whereNull("deleted_at")
              .whereNull("removed_at")
              .where("profile_id", profileId)
              .whereIn(
                "profile_type_field_id",
                removeOrUpdateFields.map((f) => f.profileTypeFieldId),
              )
              .update({ removed_at: this.now(), removed_by_user_id: userId })
              .returning("*")
          : [];
      const previousByPtfId = indexBy(previousValues, (v) => v.profile_type_field_id);

      const currentValues =
        updatedFields.length > 0
          ? await this.insert(
              "profile_field_value",
              updatedFields.map((f) => ({
                profile_id: profileId,
                profile_type_field_id: f.profileTypeFieldId,
                type: f.type,
                content:
                  f.content !== undefined
                    ? f.content
                    : previousByPtfId[f.profileTypeFieldId]?.content,
                created_by_user_id: userId,
                ...(f.expiryDate !== undefined
                  ? { expiry_date: f.expiryDate }
                  : { expiry_date: previousByPtfId[f.profileTypeFieldId]?.expiry_date ?? null }),
                external_source_integration_id: externalSourceIntegrationId,
              })),
              t,
            )
          : [];
      this.loadProfileFieldValuesByProfileId.dataloader.clear(profileId);

      const profileType = (await this.loadProfileTypeForProfileId.raw(profileId, t))!;
      const pattern = profileType.profile_name_pattern as (string | number)[];
      if (removeOrUpdateFields.some((f) => pattern.includes(f.profileTypeFieldId))) {
        const profileValues = await this.raw<{
          profileId: number;
          values: {
            [profileTypeFieldId: number]: string | null;
          };
        }>(
          /* sql */ `
          select 
            p.id "profileId",
            jsonb_object_agg(
              coalesce(pfv.profile_type_field_id, 0), 
              pfv.content->>'value'
            ) as values
          from "profile" p
          left join profile_field_value pfv
            on pfv.profile_id = p.id and pfv.profile_type_field_id in ?
            and pfv.removed_at is null and pfv.deleted_at is null
          where
            p.id = ?
            and p.deleted_at is null 
            group by p.id;
        `,
          [this.sqlIn(pattern.filter((p) => typeof p === "number")), profileId],
          t,
        );

        const [profile] = await this.updateProfileNamesWithPattern(
          pattern,
          profileValues,
          `User:${userId}`,
          t,
        );

        return { profile, previousValues, currentValues };
      } else {
        return { profile: await this.loadProfile.raw(profileId, t), previousValues, currentValues };
      }
    });
  }

  async profileFieldRepliesHaveExpiryDateSet(
    profileTypeFieldId: number,
    type: ProfileTypeFieldType,
    t?: Knex.Transaction,
  ) {
    const [{ count }] = await this.from(
      type === "FILE" ? "profile_field_file" : "profile_field_value",
      t,
    )
      .where({
        profile_type_field_id: profileTypeFieldId,
        removed_at: null,
        deleted_at: null,
      })
      .whereNotNull("expiry_date")
      .select<{ count: number }[]>(this.count());

    return count > 0;
  }

  async removeProfileFieldValuesExpiryDateByProfileTypeFieldId(
    profileTypeFieldId: number,
    t?: Knex.Transaction,
  ) {
    return await this.from("profile_field_value", t)
      .where("profile_type_field_id", profileTypeFieldId)
      .whereNull("deleted_at")
      .whereNull("removed_at")
      .whereNotNull("expiry_date")
      .update({ expiry_date: null }, "*");
  }

  async removeProfileFieldFilesExpiryDateByProfileTypeFieldId(
    profileTypeFieldId: number,
    t?: Knex.Transaction,
  ) {
    return await this.from("profile_field_file", t)
      .where("profile_type_field_id", profileTypeFieldId)
      .whereNull("deleted_at")
      .whereNull("removed_at")
      .whereNotNull("expiry_date")
      .update({ expiry_date: null }, "*");
  }

  async createProfileFieldFiles(
    profileId: number,
    profileTypeFieldId: number,
    fileUploadIds: number[],
    expiryDate: string | null | undefined,
    userId: number,
  ) {
    if (fileUploadIds.length === 0) {
      return [];
    }
    return await this.withTransaction(async (t) => {
      const previousFiles =
        expiryDate === undefined
          ? await this.from("profile_field_file", t)
              .whereNull("deleted_at")
              .whereNull("removed_at")
              .where("profile_id", profileId)
              .where("profile_type_field_id", profileTypeFieldId)
              .select("*")
          : await this.from("profile_field_file", t)
              .whereNull("deleted_at")
              .whereNull("removed_at")
              .where("profile_id", profileId)
              .where("profile_type_field_id", profileTypeFieldId)
              .update({ expiry_date: expiryDate })
              .returning("*");
      return await this.insert(
        "profile_field_file",
        fileUploadIds.map((fileUploadId) => ({
          profile_id: profileId,
          profile_type_field_id: profileTypeFieldId,
          type: "FILE" as const,
          file_upload_id: fileUploadId,
          expiry_date: previousFiles[0]?.expiry_date ?? expiryDate ?? null,
          created_by_user_id: userId,
        })),
        t,
      );
    });
  }

  async updateProfileFieldFilesExpiryDate(
    profileId: number,
    profileTypeFieldId: number,
    expiryDate: Maybe<string>,
  ) {
    return await this.from("profile_field_file")
      .where({
        profile_id: profileId,
        profile_type_field_id: profileTypeFieldId,
        deleted_at: null,
        removed_at: null,
      })
      .update({ expiry_date: expiryDate }, "*");
  }

  getPaginatedEventsForProfile(profileId: number, opts: PageOpts) {
    return this.getPagination<ProfileEvent>(
      this.from("profile_event")
        .where("profile_id", profileId)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*"),
      opts,
    );
  }

  async createEvent(events: MaybeArray<CreateProfileEvent>, t?: Knex.Transaction) {
    const eventsArray = unMaybeArray(events);
    if (eventsArray.length === 0) {
      return [];
    }
    const profileEvents = await this.insert("profile_event", eventsArray, t);
    await this.queues.enqueueEvents(profileEvents, "profile_event", undefined, t);
    return profileEvents;
  }

  async createProfileUpdatedEvents(
    profileId: number,
    events: MaybeArray<
      | ProfileFieldExpiryUpdatedEvent<true>
      | ProfileFieldFileAddedEvent<true>
      | ProfileFieldFileRemovedEvent<true>
      | ProfileFieldValueUpdatedEvent<true>
    >,
    orgId: number,
    userId: number | null,
    t?: Knex.Transaction,
  ) {
    const eventsArray = unMaybeArray(events);
    if (eventsArray.length === 0) {
      return;
    }

    await this.createEvent(
      [
        ...eventsArray,
        {
          type: "PROFILE_UPDATED",
          profile_id: profileId,
          org_id: orgId,
          data: {
            user_id: userId,
          },
        },
      ],
      t,
    );
  }

  getPaginatedExpirableProfileFieldProperties(
    orgId: number,
    defaultTimezone: string,
    opts: {
      search?: Maybe<string>;
      filter?: Maybe<{
        profileTypeFieldId?: Maybe<number[]>;
        profileTypeId?: Maybe<number[]>;
        isInAlert?: boolean;
        subscribedByUserId?: number;
      }>;
    } & PageOpts,
  ): Pagination<{
    profile_id: number;
    profile_name: LocalizableUserText;
    profile_type_field_id: number;
    profile_type_field_name: LocalizableUserText;
    in_alert: boolean;
    expiry_date: string;
    is_expired: boolean;
  }> {
    const filter = (q: Knex.QueryBuilder) => {
      if (isNonNullish(opts.search)) {
        q.whereExists((q2) =>
          q2
            .select(this.knex.raw("1"))
            .fromRaw(`jsonb_each_text(p.localizable_name) AS t(key, value)`)
            .whereSearch("value", opts.search!),
        );
      }
      if (isNonNullish(opts.filter?.profileTypeId) && opts.filter!.profileTypeId.length > 0) {
        q.whereIn("p.profile_type_id", opts.filter!.profileTypeId);
      }
      if (
        isNonNullish(opts.filter?.profileTypeFieldId) &&
        opts.filter!.profileTypeFieldId.length > 0
      ) {
        q.whereIn("pfx.profile_type_field_id", opts.filter!.profileTypeFieldId);
      }
      if (isNonNullish(opts.filter?.isInAlert)) {
        q.whereRaw(
          /* sql */ `(pfx.expiry_date at time zone ?) - ptf.expiry_alert_ahead_time < now()`,
          [defaultTimezone],
        );
      }
      if (isNonNullish(opts.filter?.subscribedByUserId)) {
        q.join(this.knex.ref("profile_subscription").as("ps"), "ps.profile_id", "p.id")
          .whereNull("ps.deleted_at")
          .where("ps.user_id", opts.filter!.subscribedByUserId);
      }
    };
    const valuesQuery = this.knex
      .from(this.knex.ref("profile").as("p"))
      .join(this.knex.ref("profile_field_value").as("pfx"), "p.id", "pfx.profile_id")
      .join(this.knex.ref("profile_type_field").as("ptf"), "ptf.id", "pfx.profile_type_field_id")
      .where("p.org_id", orgId)
      .where("status", "OPEN")
      .whereNull("p.deleted_at")
      .whereNotNull("pfx.expiry_date")
      .whereNull("pfx.removed_at")
      .whereNull("pfx.deleted_at")
      .whereNotNull("ptf.expiry_alert_ahead_time")
      .modify(filter);
    const filesQuery = this.knex
      .from(this.knex.ref("profile").as("p"))
      .join(this.knex.ref("profile_field_file").as("pfx"), "p.id", "pfx.profile_id")
      .join(this.knex.ref("profile_type_field").as("ptf"), "ptf.id", "pfx.profile_type_field_id")
      .where("p.org_id", orgId)
      .where("status", "OPEN")
      .whereNull("p.deleted_at")
      .whereNotNull("pfx.expiry_date")
      .whereNull("pfx.removed_at")
      .whereNull("pfx.deleted_at")
      .whereNotNull("ptf.expiry_alert_ahead_time")
      .modify(filter);
    return {
      totalCount: LazyPromise.from<number>(async () => {
        const counts = await this.knex.unionAll([
          valuesQuery.clone().select<{ count: number }[]>(this.count()),
          this.knex
            .fromRaw(
              this.knex.raw("(?) t", [
                filesQuery.clone().distinct("pfx.profile_id", "pfx.profile_type_field_id"),
              ]),
            )
            .select<{ count: number }[]>(this.count()),
        ]);
        return counts[0].count + counts[1].count;
      }),
      items: LazyPromise.from(async () => {
        return await this.knex
          .unionAll([
            valuesQuery
              .clone()
              .select(
                "pfx.profile_id",
                "p.localizable_name as profile_name",
                "pfx.profile_type_field_id",
                "pfx.expiry_date",
                this.knex.raw(
                  /* sql */ `(pfx.expiry_date at time zone ?) - ptf.expiry_alert_ahead_time < now() as in_alert`,
                  [defaultTimezone],
                ),
                "ptf.name as profile_type_field_name",
                this.knex.raw(/* sql */ `(pfx.expiry_date at time zone ?) < now() as is_expired`, [
                  defaultTimezone,
                ]),
              ),
            filesQuery
              .clone()
              .distinctOn("pfx.profile_id", "pfx.profile_type_field_id")
              .select(
                "pfx.profile_id",
                "p.localizable_name as profile_name",
                "pfx.profile_type_field_id",
                "pfx.expiry_date",
                this.knex.raw(
                  /* sql */ `(pfx.expiry_date at time zone ?) - ptf.expiry_alert_ahead_time < now() as in_alert`,
                  [defaultTimezone],
                ),
                "ptf.name as profile_type_field_name",
                this.knex.raw(/* sql */ `(pfx.expiry_date at time zone ?) < now() as is_expired`, [
                  defaultTimezone,
                ]),
              ),
          ])
          .orderBy("in_alert", "desc")
          .orderBy("expiry_date", "asc")
          .orderBy("profile_id")
          .orderBy("profile_type_field_id")
          .offset(opts.offset ?? 0)
          .limit(opts.limit ?? 0);
      }),
    };
  }

  async subscribeUsersToProfiles(profileIds: number[], userIds: number[], createdBy: string) {
    if (userIds.length === 0) {
      throw new Error("expected userIds to be non-empty");
    }
    if (profileIds.length === 0) {
      throw new Error("expected profileIds to be non-empty");
    }

    await this.raw(
      /* sql */ `
      ? 
      ON CONFLICT (profile_id, user_id)
      WHERE deleted_at is NULL
      DO NOTHING`,
      [
        this.from("profile_subscription").insert(
          profileIds.flatMap((profileId) =>
            userIds.map((userId) => ({
              profile_id: profileId,
              user_id: userId,
              created_by: createdBy,
            })),
          ),
        ),
      ],
    );
  }

  async unsubscribeUsersFromProfiles(profileIds: number[], userIds: number[], deletedBy: string) {
    if (userIds.length === 0) {
      throw new Error("expected userIds to be non-empty");
    }
    if (profileIds.length === 0) {
      throw new Error("expected profileIds to be non-empty");
    }

    await this.from("profile_subscription")
      .whereIn("profile_id", profileIds)
      .whereIn("user_id", userIds)
      .whereNull("deleted_at")
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });
  }

  loadProfileSubscribers = this.buildLoadMultipleBy("profile_subscription", "profile_id", (q) =>
    q.whereNull("deleted_at"),
  );

  /**
   * @returns Organizations that
   * - have profiles feature enabled
   * - have not received a digest in the last 6 days
   * - their current time is after the passed date
   */
  async getOrganizationsForProfileAlertsDigest(afterDate: Date) {
    return await this.raw<Organization>(
      /* sql */ `
      select o.* from "organization" o
      join "feature_flag" ff on ff.name = 'PROFILES'
      left join "feature_flag_override" ffo on ffo.feature_flag_name = ff.name and ffo.org_id = o.id and ffo.user_id is null
      where o.deleted_at is null
      and coalesce(ffo.value, ff.default_value) = true
      and ?::timestamp at time zone o.default_timezone < now()
      and (o.last_profile_digest_at is null or o.last_profile_digest_at + make_interval(days=>6) < now())
    `,
      [afterDate.toISOString()],
    );
  }

  async getOrganizationUsersSubscribedToProfileAlerts(orgId: number) {
    return await this.from("user")
      .join(this.knex.ref("profile_subscription").as("ps"), "user.id", "ps.user_id")
      .where({
        "ps.deleted_at": null,
        "user.deleted_at": null,
        "user.status": "ACTIVE",
        "user.org_id": orgId,
      })
      .select<User[]>("user.*");
  }

  readonly loadProfilesByPetitionId = this.buildLoader<number, Profile[]>(
    async (petitionIds, t) => {
      const results = await this.from("profile", t)
        .join("petition_profile", "profile.id", "petition_profile.profile_id")
        .whereIn("petition_profile.petition_id", petitionIds)
        .whereNull("profile.deleted_at")
        .whereIn("profile.status", ["OPEN", "CLOSED"])
        .select<
          Array<Profile & { petition_id: number; pp_created_at: Date }>
        >("profile.*", "petition_profile.petition_id", "petition_profile.created_at as pp_created_at");

      const byPetitionId = groupBy(results, (r) => r.petition_id);
      return petitionIds.map((id) =>
        byPetitionId[id]
          ? sortBy(byPetitionId[id], (p) => p.pp_created_at).map((p) =>
              omit(p, ["petition_id", "pp_created_at"]),
            )
          : [],
      );
    },
  );

  async associateProfilesToPetition(
    data: CreatePetitionProfile[],
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    if (data.length === 0) {
      return [];
    }

    return await this.raw<PetitionProfile>(
      /* sql */ `
        ?
        on conflict (petition_id, profile_id)
        do nothing -- association is already there, ignore row
        returning *;
      `,
      [
        this.from("petition_profile").insert(
          data.map((d) => ({ ...d, created_at: this.now(), created_by: createdBy })),
        ),
      ],
      t,
    );
  }

  async disassociateProfileFromPetition(petitionIds: number[], profileIds: number[]) {
    if (profileIds.length === 0) {
      throw new Error("expected profileIds to be non-empty");
    }
    if (petitionIds.length === 0) {
      throw new Error("expected petitionIds to be non-empty");
    }

    return await this.from("petition_profile")
      .whereIn("petition_id", petitionIds)
      .whereIn("profile_id", profileIds)
      .delete()
      .returning("*");
  }

  async countProfilesAssociatedToPetitions(profileIds: number[], petitionIds: number[]) {
    if (profileIds.length === 0 || petitionIds.length === 0) {
      return 0;
    }

    const [{ count }] = await this.knex
      .from("petition_profile")
      .whereIn("profile_id", profileIds)
      .whereIn("petition_id", petitionIds)
      .select(this.count());

    return count as number;
  }

  readonly loadProfileTypeFieldUserEffectivePermission = this.buildLoader<
    { profileTypeFieldId: number; userId: number },
    ProfileTypeFieldPermissionType,
    string
  >(
    async (keys, t) => {
      const data = await this.raw<{
        ptf_id: number;
        user_id: number | null;
        permission: ProfileTypeFieldPermissionType;
      }>(
        /* sql */ `
          with permissions as (
            select
              ptfp.profile_type_field_id as ptf_id,
              coalesce(ugm.user_id, ptfp.user_id) as user_id,
              max(ptfp.permission) as permission
            from
              profile_type_field_permission ptfp
              left join user_group ug on ptfp.user_group_id = ug.id and ug.deleted_at is null
              left join user_group_member ugm on ug.id = ugm.user_group_id and ugm.deleted_at is null and ugm.user_id in ?
            where
              ptfp.profile_type_field_id in ? and ptfp.deleted_at is null
            group by
              ptfp.profile_type_field_id, coalesce(ugm.user_id, ptfp.user_id)
          )
          select * from permissions
          union all
          select
            ptf2.id as ptf_id,
            null as user_id,
            ptf2.permission as permission
          from profile_type_field ptf2
            where ptf2.id in ?

        `,
        [
          this.sqlIn(keys.map((k) => k.userId)),
          this.sqlIn(keys.map((k) => k.profileTypeFieldId)),
          this.sqlIn(keys.map((k) => k.profileTypeFieldId)),
        ],
        t,
      );

      const byKey = indexBy(data, keyBuilder(["ptf_id", "user_id"]));
      return keys.map((k) => {
        const customPermission: Maybe<ProfileTypeFieldPermissionType> =
          byKey[`${k.profileTypeFieldId},${k.userId}`]?.permission ?? null;
        const defaultPermission = byKey[`${k.profileTypeFieldId},null`].permission;
        if (isNullish(customPermission)) {
          return defaultPermission;
        }
        return isAtLeast(customPermission, defaultPermission)
          ? customPermission
          : defaultPermission;
      });
    },
    { cacheKeyFn: keyBuilder(["profileTypeFieldId", "userId"]) },
  );

  async resetProfileTypeFieldPermission(
    id: MaybeArray<number>,
    data: { userId?: number; userGroupId?: number; permission: ProfileTypeFieldPermissionType }[],
    updatedBy: string,
  ) {
    const ids = unMaybeArray(id);
    if (data.length === 0) {
      await this.from("profile_type_field_permission")
        .whereIn("profile_type_field_id", ids)
        .whereNull("deleted_at")
        .update({
          deleted_at: this.now(),
          deleted_by: updatedBy,
        });

      return;
    }

    const [byUserId, byUserGroupId] = partition(data, (d) => "userId" in d);
    await this.withTransaction(async (t) => {
      // remove every permission that is not in the data
      await this.from("profile_type_field_permission", t)
        .whereIn("profile_type_field_id", ids)
        .whereNull("deleted_at")
        .where((q) => {
          q.where((q2) => {
            q2.whereNotNull("user_group_id").and.whereNotIn(
              "user_group_id",
              byUserGroupId.map((d) => d.userGroupId!),
            );
          }).orWhere((q2) => {
            q2.whereNotNull("user_id").and.whereNotIn(
              "user_id",
              byUserId.map((d) => d.userId!),
            );
          });
        })
        .update({
          deleted_at: this.now(),
          deleted_by: updatedBy,
        });

      if (byUserId.length > 0) {
        await this.raw(
          /* sql */ `
        ?
        on conflict (profile_type_field_id, user_id) where deleted_at is null
        do update set
          permission = EXCLUDED.permission,
          updated_by = (
            case 
              when ptfp.permission = EXCLUDED.permission
              then ptfp.updated_by
              else ?
            end
          ),
          updated_at = (
            case 
              when ptfp.permission = EXCLUDED.permission
              then ptfp.updated_at
              else NOW() 
            end
          )
        returning *;
      `,
          [
            this.knex.from({ ptfp: "profile_type_field_permission" }).insert(
              ids.flatMap((profileTypeFieldId) =>
                byUserId.map((d) => ({
                  profile_type_field_id: profileTypeFieldId,
                  user_id: d.userId!,
                  permission: d.permission,
                  created_by: updatedBy,
                  updated_by: updatedBy,
                })),
              ),
            ),
            updatedBy,
          ],
          t,
        );
      }

      if (byUserGroupId.length > 0) {
        await this.raw(
          /* sql */ `
      ?
      on conflict (profile_type_field_id, user_group_id) where deleted_at is null
      do update set
        permission = EXCLUDED.permission,
        updated_by = (
          case 
            when ptfp.permission = EXCLUDED.permission
            then ptfp.updated_by
            else ?
          end
        ),
        updated_at = (
          case 
            when ptfp.permission = EXCLUDED.permission
            then ptfp.updated_at
            else NOW() 
          end
        )
      returning *;
    `,
          [
            this.knex.from({ ptfp: "profile_type_field_permission" }).insert(
              ids.flatMap((profileTypeFieldId) =>
                byUserGroupId.map((d) => ({
                  profile_type_field_id: profileTypeFieldId,
                  user_group_id: d.userGroupId!,
                  permission: d.permission,
                  created_by: updatedBy,
                  updated_by: updatedBy,
                })),
              ),
            ),
            updatedBy,
          ],
          t,
        );
      }
    });
  }

  readonly loadProfileTypeFieldPermissionsByProfileTypeFieldId = this.buildLoadMultipleBy(
    "profile_type_field_permission",
    "profile_type_field_id",
    (q) => q.whereNull("deleted_at"),
  );

  async getDeletedProfilesToAnonymize(daysAfterDeletion: number) {
    const profiles = await this.from("profile")
      .whereNotNull("deleted_at")
      .whereNull("anonymized_at")
      .whereRaw(/* sql */ `"deleted_at" < NOW() - make_interval(days => ?)`, [daysAfterDeletion])
      .select("id");

    return profiles.map((p) => p.id);
  }

  async getDeletedProfileFieldValuesToAnonymize(daysAfterDeletion: number) {
    const profileFieldValues = await this.from("profile_field_value")
      .whereNotNull("deleted_at")
      .whereNull("anonymized_at")
      .whereRaw(/* sql */ `"deleted_at" < NOW() - make_interval(days => ?)`, [daysAfterDeletion])
      .select("id");

    return profileFieldValues.map((p) => p.id);
  }

  async getDeletedProfileFieldFilesToAnonymize(daysAfterDeletion: number) {
    const profileFieldFiles = await this.from("profile_field_file")
      .whereNotNull("deleted_at")
      .whereNull("anonymized_at")
      .whereRaw(/* sql */ `"deleted_at" < NOW() - make_interval(days => ?)`, [daysAfterDeletion])
      .select("id");

    return profileFieldFiles.map((p) => p.id);
  }

  async deleteRemovedProfileFieldFiles(daysAfterRemoval: number, deletedBy: string) {
    return await this.from("profile_field_file")
      .whereNull("deleted_at")
      .whereNotNull("removed_at")
      .whereRaw(/* sql */ `"removed_at" < NOW() - make_interval(days => ?)`, [daysAfterRemoval])
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });
  }

  async deleteRemovedProfileFieldValues(daysAfterRemoval: number, deletedBy: string) {
    return await this.from("profile_field_value")
      .whereNull("deleted_at")
      .whereNotNull("removed_at")
      .whereRaw(/* sql */ `"removed_at" < NOW() - make_interval(days => ?)`, [daysAfterRemoval])
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });
  }

  async anonymizeProfile(profileIds: number[], t?: Knex.Transaction) {
    if (profileIds.length === 0) {
      return [];
    }

    const profiles = await this.from("profile", t)
      .whereIn("id", profileIds)
      .whereNotNull("deleted_at")
      .whereNull("anonymized_at")
      .update({ anonymized_at: this.now() })
      .returning(["id", "org_id"]);

    const [values, files] = await Promise.all([
      this.from("profile_field_value", t)
        .whereIn(
          "profile_id",
          profiles.map((p) => p.id),
        )
        .whereNull("anonymized_at")
        .select("id"),
      this.from("profile_field_file", t)
        .whereIn(
          "profile_id",
          profiles.map((p) => p.id),
        )
        .whereNull("anonymized_at")
        .select("id"),
    ]);

    await this.anonymizeProfileFieldValues(
      values.map((v) => v.id),
      t,
    );
    const fileIdsToDelete = await this.anonymizeProfileFieldFiles(
      files.map((f) => f.id),
      t,
    );

    await this.createEvent(
      profiles.map((p) => ({
        type: "PROFILE_ANONYMIZED",
        profile_id: p.id,
        org_id: p.org_id,
        data: {},
      })),
      t,
    );

    return fileIdsToDelete;
  }

  async anonymizeProfileFieldValues(ids: number[], t?: Knex.Transaction) {
    if (ids.length === 0) {
      return;
    }
    await this.withTransaction(async (t) => {
      await pMapChunk(
        ids,
        async (idsChunk) => {
          await this.from("profile_field_value", t)
            .whereIn("id", idsChunk)
            .whereNull("anonymized_at")
            .update({
              anonymized_at: this.now(),
              content: this.knex.raw(/* sql */ `
                case "type"
                  when 'BACKGROUND_CHECK' then 
                    content || jsonb_build_object('query', null, 'search', null, 'entity', null)
                  else 
                    content || jsonb_build_object('value', null)
                  end
              `),
            });
        },
        { chunkSize: 200, concurrency: 5 },
      );
    }, t);
  }

  async anonymizeProfileFieldFiles(ids: number[], t?: Knex.Transaction) {
    if (ids.length === 0) {
      return [];
    }
    const files = await this.withTransaction(async (t) => {
      return await pMapChunk(
        ids,
        async (idsChunk) => {
          return await this.raw<{ old_file_upload_id: number }>(
            /* sql */ `
            update profile_field_file pff
            set 
              anonymized_at = now(),
              file_upload_id = null
            from profile_field_file pff2
            where pff.id = pff2.id
            and pff.id in ?
            and pff.anonymized_at is null
            returning pff2.file_upload_id as old_file_upload_id;
          `,
            [this.sqlIn(idsChunk)],
            t,
          );
        },
        { chunkSize: 200, concurrency: 5 },
      );
    }, t);

    return files.map((f) => f.old_file_upload_id);
  }

  async getProfileIdsReadyForDeletion(daysAfterDeletion: number) {
    const profiles = await this.from("profile")
      .whereNull("deleted_at")
      .whereNull("anonymized_at")
      .where("status", "DELETION_SCHEDULED")
      .whereRaw(/* sql */ `"deletion_scheduled_at" + make_interval(days => ?) < NOW()`, [
        daysAfterDeletion,
      ])
      .select("id");

    return profiles.map((p) => p.id);
  }

  async getProfileFieldValueCountWithContent(
    profileTypeFieldId: number,
    type: ProfileTypeFieldType,
    content: string[],
  ) {
    const rows = await this.from("profile_field_value")
      .where("profile_type_field_id", profileTypeFieldId)
      .whereNull("deleted_at")
      .whereNull("removed_at")
      .mmodify((q) => {
        if (type === "CHECKBOX") {
          q.whereRaw(
            /* sql */ `exists (
            select 1
            from jsonb_array_elements_text("content"->'value') as elem
            where elem in ?
          )`,
            [this.sqlIn(content)],
          );
        } else {
          q.whereRaw(/* sql */ `"content"->>'value' in ?`, [this.sqlIn(content)]);
        }
      })
      .select("*");

    return Object.fromEntries(
      content
        .map<
          [string, number]
        >((value) => [value, rows.filter((row) => (type === "CHECKBOX" ? row.content.value.includes(value) : row.content.value === value)).length])
        .filter(([, count]) => count > 0),
    );
  }

  async updateProfileFieldValueContentByProfileTypeFieldId(
    profileTypeFieldId: number,
    type: ProfileTypeFieldType,
    data: {
      old: string;
      new?: string | null;
    }[],
    userId: number,
  ) {
    return await this.withTransaction(async (t) => {
      const previousValues = await this.from("profile_field_value", t)
        .whereNull("deleted_at")
        .whereNull("removed_at")
        .where("profile_type_field_id", profileTypeFieldId)
        .mmodify((q) => {
          if (type === "CHECKBOX") {
            q.whereRaw(
              /* sql */ `exists (
              select 1
              from jsonb_array_elements_text("content"->'value') as elem
              where elem in ?
            )`,
              [this.sqlIn(data.map((d) => d.old))],
            );
          } else {
            q.whereRaw(/* sql */ `content->>'value' in ?`, [this.sqlIn(data.map((d) => d.old))]);
          }
        })

        .update({ removed_at: this.now(), removed_by_user_id: userId })
        .returning("*");

      const fieldsWithContent =
        type === "CHECKBOX"
          ? previousValues
              .map((f) => ({
                ...f,
                content: {
                  value: (f.content.value as string[])
                    .map((value) => {
                      const found = data.find((d) => d.old === value);
                      return found ? found.new : value;
                    })
                    .filter(isNonNull),
                },
              }))
              .filter((f) => f.content.value.length > 0)
          : previousValues
              .filter((f) => data.find((d) => d.old === f.content.value && isNonNullish(d.new)))
              .map((f) => ({
                ...f,
                content: { value: data.find((d) => d.old === f.content.value)!.new },
              }));

      let currentValues: ProfileFieldValue[] = [];
      if (fieldsWithContent.length) {
        currentValues = await this.insert(
          "profile_field_value",
          fieldsWithContent.map((f) => ({
            profile_id: f.profile_id,
            profile_type_field_id: f.profile_type_field_id,
            type: f.type,
            content: this.json(f.content),
            created_by_user_id: userId,
            expiry_date: f.expiry_date,
          })),
          t,
        );
      }

      return { currentValues, previousValues };
    });
  }

  async getProfileEventsForUser(
    userId: number,
    options: {
      eventTypes?: Maybe<ProfileEventType[]>;
      before?: Maybe<number>;
      limit: number;
    },
  ) {
    return await this.raw<ProfileEvent>(
      /* sql */ `
      select pe.* from user_profile_event_log upel
      join profile_event pe on upel.profile_event_id = pe.id
      where upel.user_id = ?
        ${isNonNullish(options.before) ? /* sql */ `and upel.profile_event_id < ?` : ""}
        ${isNonNullish(options.eventTypes) ? /* sql */ `and pe.type in ?` : ""}
      order by pe.id desc
      limit ${options.limit};
    `,
      [
        userId,
        ...(isNonNullish(options.before) ? [options.before] : []),
        ...(isNonNullish(options.eventTypes) ? [this.sqlIn(options.eventTypes)] : []),
      ],
    );
  }

  async attachProfileEventsToUsers(profileEventId: number, userIds: number[]) {
    await this.insert(
      "user_profile_event_log",
      userIds.map((userId) => ({
        profile_event_id: profileEventId,
        user_id: userId,
      })),
    );
  }

  async getProfileIdsWithActiveMonitoringByProfileTypeFieldId(profileTypeFieldId: number) {
    const [profileTypeField] = await this.from("profile_type_field")
      .where({
        id: profileTypeFieldId,
        type: "BACKGROUND_CHECK",
        deleted_at: null,
      })
      .whereRaw(/*sql*/ `options->>'monitoring' is not null`)
      .select("*");

    if (!profileTypeField) {
      return [];
    }

    const { monitoring } = profileTypeField.options as ProfileTypeFieldOptions["BACKGROUND_CHECK"];

    const profiles = await this.from("profile")
      .where({
        status: "OPEN",
        profile_type_id: profileTypeField.profile_type_id,
        deleted_at: null,
        anonymized_at: null,
        closed_at: null,
      })
      .select("*");

    if (profiles.length === 0) {
      return [];
    }

    if (isNullish(monitoring?.activationCondition)) {
      // if no activation conditions are provided, return all profiles as every profile will have active monitoring
      return profiles.map((p) => p.id);
    }

    // for each profile, get its SELECT values that meets the activation conditions
    const profileFieldValues: { profile_id: number }[] = await this.from("profile_field_value")
      .where({
        removed_at: null,
        deleted_at: null,
        profile_type_field_id: monitoring.activationCondition.profileTypeFieldId,
        type: "SELECT",
      })
      .whereIn(
        "profile_id",
        profiles.map((p) => p.id),
      )
      .whereRaw(/* sql */ `content->>'value' in ?`, [
        this.sqlIn(monitoring.activationCondition.values),
      ])
      .select(this.knex.raw("distinct on (profile_id) profile_id"));

    return profileFieldValues.map((pfv) => pfv.profile_id);
  }

  /**
   * @returns every OPEN profile with at least 1 replied BACKGROUND_CHECK field with monitoring rules
   */
  private async getProfilesWithBackgroundCheckMonitoringRules(orgId: number) {
    return await this.raw<Profile>(
      /* sql */ `
      select distinct on (p.id) p.*
      from profile p
      join profile_field_value pfv 
        on pfv.profile_id = p.id
        and pfv.type = 'BACKGROUND_CHECK'
        and pfv.removed_at is null
        and pfv.deleted_at is null
      join profile_type_field ptf 
        on ptf.id = pfv.profile_type_field_id 
        and ptf.type = 'BACKGROUND_CHECK' 
        and ptf."options"->>'monitoring' is not null
        and ptf.deleted_at is null
      where
        p.status = 'OPEN'
        and p.org_id = ?
        and p.deleted_at is null;
    `,
      [orgId],
    );
  }

  async getBackgroundCheckProfileFieldValuesForRefreshByOrgId(
    orgId: number,
    requiresRefresh: (
      pfv: ProfileFieldValue,
      monitoring: ProfileTypeFieldOptions["BACKGROUND_CHECK"]["monitoring"],
      selectPfvs: ProfileFieldValue[],
    ) => boolean,
  ) {
    const profiles = await this.getProfilesWithBackgroundCheckMonitoringRules(orgId);

    const result: ProfileFieldValue[] = [];

    for (const profile of profiles) {
      const profileFieldValues = await this.from("profile_field_value")
        .where({ profile_id: profile.id, removed_at: null, deleted_at: null })
        .whereIn("type", ["BACKGROUND_CHECK", "SELECT"])
        .select("*");

      const [backgroundCheckPfvs, selectPfvs] = partition(
        profileFieldValues,
        (pfv) => pfv.type === "BACKGROUND_CHECK",
      );

      const backgroundCheckPtfs = await this.loadProfileTypeField(
        backgroundCheckPfvs.map((pfv) => pfv.profile_type_field_id),
      );

      for (const [pfv, ptf] of zip(backgroundCheckPfvs, backgroundCheckPtfs)) {
        const options = ptf?.options as ProfileTypeFieldOptions["BACKGROUND_CHECK"];

        if (requiresRefresh(pfv, options.monitoring, selectPfvs)) {
          result.push(pfv);
        }
      }
    }

    return result;
  }

  async getSubscribedUsersWithReadPermissions(
    pfvs: Pick<ProfileFieldValue, "profile_id" | "profile_type_field_id">[],
  ) {
    const results: Record<string, { profileId: number; profileTypeFieldId: number }[]> = {};

    const profileIds = unique(pfvs.map((pfv) => pfv.profile_id));
    const profileSubscriptions = (await this.loadProfileSubscribers(profileIds)).flat();

    for (const [userId, subscriptions] of Object.entries(
      groupBy(profileSubscriptions, (s) => s.user_id),
    )) {
      const userProfiles = subscriptions.map((s) => s.profile_id);

      const userProfileTypeFieldValues = pfvs
        .filter((pfv) => userProfiles.includes(pfv.profile_id))
        .map((pfv) => ({
          userId: parseInt(userId),
          profileTypeFieldId: pfv.profile_type_field_id,
          profileId: pfv.profile_id,
        }));

      const userEffectivePermissions = await this.loadProfileTypeFieldUserEffectivePermission(
        userProfileTypeFieldValues,
      );

      const userPfvs = zip(userProfileTypeFieldValues, userEffectivePermissions)
        .filter(([_, permission]) => isAtLeast(permission, "READ"))
        .map(([pfv]) => pfv);

      results[userId] = userPfvs.map(pick(["profileId", "profileTypeFieldId"]));
    }

    return results;
  }

  readonly loadProfileRelationshipTypeAllowedProfileTypesByProfileRelationshipTypeId =
    this.buildLoader<
      {
        orgId: number;
        profileRelationshipTypeId: number;
        direction: ProfileRelationshipTypeDirection;
      },
      ProfileRelationshipTypeAllowedProfileType[],
      string
    >(
      async (keys, t) => {
        const rows = await this.from("profile_relationship_type_allowed_profile_type")
          .whereIn(
            "org_id",
            keys.map((k) => k.orgId),
          )
          .whereIn(
            "profile_relationship_type_id",
            keys.map((k) => k.profileRelationshipTypeId),
          )
          .whereIn(
            "direction",
            keys.map((k) => k.direction),
          )
          .whereNull("deleted_at")
          .select("*");

        const results = groupBy(
          rows,
          keyBuilder(["org_id", "profile_relationship_type_id", "direction"]),
        );
        return keys
          .map(keyBuilder(["orgId", "profileRelationshipTypeId", "direction"]))
          .map((key) => results[key] ?? []);
      },
      { cacheKeyFn: keyBuilder(["orgId", "profileRelationshipTypeId", "direction"]) },
    );

  async getProfileRelationshipTypeAllowedProfileTypesByAllowedProfileTypeId(
    orgId: number,
    fixedProfileTypeId: Maybe<number>,
  ) {
    const data: (ProfileRelationshipTypeAllowedProfileType & { is_reciprocal: boolean })[] =
      await this.knex
        .from({
          prta: "profile_relationship_type_allowed_profile_type",
        })
        .join({ prt: "profile_relationship_type" }, "prt.id", "prta.profile_relationship_type_id")
        .where("prta.org_id", orgId)
        .whereNull("prta.deleted_at")
        .where("prt.org_id", orgId)
        .whereNull("prt.deleted_at")
        .mmodify((q) => {
          if (isNonNullish(fixedProfileTypeId)) {
            q.where("prta.allowed_profile_type_id", fixedProfileTypeId);
          }
        })
        .select("prt.is_reciprocal", "prta.*");

    return pipe(
      data,
      filter((d) => !(d.is_reciprocal && d.direction === "RIGHT_LEFT")), // remove RIGHT_LEFT if reciprocal, as those are duplicates and redundant
      uniqueBy((d) => `${d.profile_relationship_type_id}-${d.direction}`),
      map((d) => omit(d, ["is_reciprocal"]) as ProfileRelationshipTypeAllowedProfileType),
    );
  }

  readonly loadProfileRelationshipTypesByOrgId = this.buildLoadMultipleBy(
    "profile_relationship_type",
    "org_id",
    (q) => q.whereNull("deleted_at"),
  );

  readonly loadProfileRelationshipType = this.buildLoadBy("profile_relationship_type", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  async createProfileRelationshipType(
    data: MaybeArray<CreateProfileRelationshipType>,
    createdBy: string,
  ) {
    return await this.from("profile_relationship_type").insert(
      unMaybeArray(data).map((d) => ({ ...d, created_by: createdBy })),
      "*",
    );
  }

  async getOrganizationStandardProfileTypes(orgId: number) {
    return await this.from("profile_type")
      .where({ deleted_at: null, org_id: orgId })
      .whereNotNull("standard_type")
      .select("*");
  }

  async createProfileRelationshipAllowedProfileType(
    data: MaybeArray<CreateProfileRelationshipTypeAllowedProfileType>,
    createdBy: string,
  ) {
    return await this.from("profile_relationship_type_allowed_profile_type").insert(
      unMaybeArray(data).map((d) => ({ ...d, created_by: createdBy })),
      "*",
    );
  }

  async profileRelationshipsAreAllowed(
    orgId: number,
    relationships: {
      leftSideProfileTypeId: number;
      profileRelationshipTypeId: number;
      rightSideProfileTypeId: number;
    }[],
  ) {
    // for the association to be possible we need to find 2 rows with the same relationship type id.
    // - 1st row will be with the left profile type id and direction LEFT_RIGHT
    // - 2nd row will be with the right profile type id and direction RIGHT_LEFT
    const allowedRelationships = await this.from("profile_relationship_type_allowed_profile_type")
      .where("org_id", orgId)
      .whereIn(
        "profile_relationship_type_id",
        relationships.map((r) => r.profileRelationshipTypeId),
      )
      .whereNull("deleted_at");

    return relationships.every((r) => {
      const allowed = allowedRelationships.filter(
        (ar) =>
          ar.profile_relationship_type_id === r.profileRelationshipTypeId &&
          ((ar.allowed_profile_type_id === r.leftSideProfileTypeId &&
            ar.direction === "LEFT_RIGHT") ||
            (ar.allowed_profile_type_id === r.rightSideProfileTypeId &&
              ar.direction === "RIGHT_LEFT")),
      );

      return allowed.length === 2;
    });
  }

  readonly loadProfileRelationship = this.buildLoadBy("profile_relationship", "id", (q) =>
    q.whereNull("deleted_at").whereNull("removed_at"),
  );

  async createProfileRelationship(
    data: MaybeArray<Omit<CreateProfileRelationship, "org_id" | "created_by_user_id">>,
    user: User,
    ignoreConflicts = false,
    t?: Knex.Transaction,
  ) {
    const dataArr = unMaybeArray(data);
    if (dataArr.length === 0) {
      return;
    }

    const query = this.knex.from("profile_relationship").insert(
      dataArr.map((d) => ({
        ...d,
        created_by_user_id: user.id,
        org_id: user.org_id,
      })),
      "*",
    );

    if (ignoreConflicts) {
      query.onConflict().ignore();
    }

    const events = await this.raw<ProfileEvent>(
      /* sql */ `
        with pr as (?)
        insert into profile_event (org_id, profile_id, type, data)
        select
          ?::int as org_id,
          pr.left_side_profile_id,
          'PROFILE_RELATIONSHIP_CREATED'::profile_event_type,
          jsonb_build_object(
            'user_id', ?::int,
            'profile_relationship_id', pr.id,
            'profile_relationship_type_id', pr.profile_relationship_type_id,
            'profile_relationship_type_alias', prt.alias
          )
        from pr join profile_relationship_type prt on pr.profile_relationship_type_id = prt.id
        union all
        select
          ?::int as org_id,
          pr.right_side_profile_id,
          'PROFILE_RELATIONSHIP_CREATED'::profile_event_type,
          jsonb_build_object(
            'user_id', ?::int,
            'profile_relationship_id', pr.id,
            'profile_relationship_type_id', pr.profile_relationship_type_id,
            'profile_relationship_type_alias', prt.alias
          )
          from pr join profile_relationship_type prt on pr.profile_relationship_type_id = prt.id
        returning *
      `,
      [query, user.org_id, user.id, user.org_id, user.id],
      t,
    );
    await this.queues.enqueueEvents(events, "profile_event", undefined, t);
  }

  async removeProfileRelationships(profileRelationshipIds: number[], user: User) {
    return await this.from("profile_relationship")
      .where("org_id", user.org_id)
      .whereIn("id", profileRelationshipIds)
      .update({ removed_at: this.now(), removed_by_user_id: user.id })
      .returning("*");
  }

  async removeProfileRelationshipsByProfileId(profileIds: number[], user: User) {
    return await this.from("profile_relationship")
      .where("org_id", user.org_id)
      .where((q) =>
        q
          .orWhereIn("left_side_profile_id", profileIds)
          .orWhereIn("right_side_profile_id", profileIds),
      )
      .update({ removed_at: this.now(), removed_by_user_id: user.id })
      .returning("*");
  }

  async deleteProfileRelationshipsByProfileId(profileIds: number[], deletedBy: string) {
    return await this.from("profile_relationship")
      .where((q) =>
        q
          .orWhereIn("left_side_profile_id", profileIds)
          .orWhereIn("right_side_profile_id", profileIds),
      )
      .update({ deleted_at: this.now(), deleted_by: deletedBy })
      .returning("*");
  }

  readonly loadProfileRelationshipsByProfileId = this.buildLoader<number, ProfileRelationship[]>(
    async (values, t) => {
      const rows = await this.from("profile_relationship", t)
        .whereNull("deleted_at")
        .whereNull("removed_at")
        .where((q) => {
          q.orWhereIn("left_side_profile_id", values).orWhereIn("right_side_profile_id", values);
        })
        .orderBy("created_at", "asc")
        .orderBy("id", "asc")
        .select("*");

      return values.map(
        (profileId) =>
          rows.filter(
            (r) => r.left_side_profile_id === profileId || r.right_side_profile_id === profileId,
          ) ?? [],
      );
    },
  );

  readonly loadProfileRelationshipsByProfileIdFiltered = this.buildLoader<
    {
      profileId: number;
      filter: {
        fromSide?: "LEFT" | "RIGHT" | null;
        relationshipTypeId: number;
      }[];
    },
    ProfileRelationship[],
    string
  >(
    async (keys, t) => {
      const relationshipTypeIds = unique(
        keys.flatMap((k) => k.filter.map((f) => f.relationshipTypeId)),
      );
      const profileIds = unique(keys.map((k) => k.profileId));
      const rows = await this.from("profile_relationship", t)
        .whereNull("deleted_at")
        .whereNull("removed_at")
        .whereIn("profile_relationship_type_id", relationshipTypeIds)
        .where((q) => {
          q.orWhereIn("left_side_profile_id", profileIds).orWhereIn(
            "right_side_profile_id",
            profileIds,
          );
        })
        .orderBy("created_at", "asc")
        .orderBy("id", "asc")
        .select("*");

      return keys.map((key) => {
        return (
          rows.filter((r) =>
            key.filter.some((filter) => {
              if (filter.relationshipTypeId !== r.profile_relationship_type_id) {
                return false;
              }
              if (!filter.fromSide) {
                return true;
              }
              if (filter.fromSide === "LEFT" && r.left_side_profile_id === key.profileId) {
                return true;
              }
              if (filter.fromSide === "RIGHT" && r.right_side_profile_id === key.profileId) {
                return true;
              }
              return false;
            }),
          ) ?? []
        );
      });
    },
    {
      cacheKeyFn: keyBuilder([
        "profileId",
        (k) => k.filter.map((f) => `${f.relationshipTypeId}-${f.fromSide}`).join(";"),
      ]),
    },
  );

  async transferProfileSubscriptions(
    fromUserId: number,
    toUserId: number,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    await this.raw(
      /* sql */ `
      with deleted_subscription as (
        update profile_subscription
        set 
          deleted_at = now(),
          deleted_by = ?
        where
          user_id = ?
          and deleted_at is null
        returning *
      )
      insert into profile_subscription ("profile_id", "user_id", "created_by")
      select "profile_id", ?, ?
      from deleted_subscription
      on conflict (profile_id, user_id) where deleted_at is null do nothing;
    `,
      [updatedBy, fromUserId, toUserId, updatedBy],
      t,
    );
  }

  async getProfileTypesByStandardType(orgId: number, standardTypes: ProfileTypeStandardType[]) {
    return await this.from("profile_type")
      .where("org_id", orgId)
      .whereNull("deleted_at")
      .whereNull("archived_at")
      .whereNotNull("standard_type")
      .whereIn("standard_type", standardTypes)
      .orderBy("created_at", "desc")
      .select("*");
  }

  readonly loadProfileExternalSourceEntity = this.buildLoadBy(
    "profile_external_source_entity",
    "id",
  );

  async createProfileExternalSourceEntity(
    data: CreateProfileExternalSourceEntity,
    createdBy: string,
  ) {
    const [row] = await this.from("profile_external_source_entity").insert(
      {
        ...data,
        created_by: createdBy,
      },
      "*",
    );

    return row;
  }

  readonly loadUserProfileTypePinnedByUserId = this.buildLoadMultipleBy(
    "user_profile_type_pinned",
    "user_id",
    (q) => q.orderBy("id", "asc"),
  );

  readonly loadPinnedProfileTypesByUserId = this.buildLoader<number, ProfileType[]>(
    async (userIds, t) => {
      const rows = await this.from("user_profile_type_pinned", t)
        .join("profile_type", "user_profile_type_pinned.profile_type_id", "profile_type.id")
        .whereNull("profile_type.deleted_at")
        .whereIn("user_profile_type_pinned.user_id", userIds)
        .orderBy("user_profile_type_pinned.id", "asc")
        .select<({ user_id: number } & ProfileType)[]>(["user_id", "profile_type.*"]);

      const byUserId = groupBy(rows, (r) => r.user_id);
      return userIds.map((userId) => (byUserId[userId] ?? []).map((d) => omit(d, ["user_id"])));
    },
  );

  async pinProfileType(profileTypeId: number, userId: number) {
    await this.from("user_profile_type_pinned")
      .insert({
        profile_type_id: profileTypeId,
        user_id: userId,
      })
      .onConflict(["profile_type_id", "user_id"])
      .ignore();
  }

  async unpinProfileType(profileTypeId: number, userId: number) {
    await this.from("user_profile_type_pinned")
      .where({ profile_type_id: profileTypeId, user_id: userId })
      .delete();
  }

  async deletePinnedProfileTypes(profileTypeIds: number[], t?: Knex.Transaction) {
    await this.from("user_profile_type_pinned", t)
      .whereIn("profile_type_id", profileTypeIds)
      .delete();
  }

  readonly loadProfileTypeProcess = this.buildLoadBy("profile_type_process", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadProfileTypeProcessesByProfileTypeId = this.buildLoadMultipleBy(
    "profile_type_process",
    "profile_type_id",
    (q) => q.whereNull("deleted_at").orderBy("position", "asc"),
  );

  readonly loadTemplatesByProfileTypeProcessId = this.buildLoader<number, Petition[]>(
    async (keys) => {
      const rows = await this.from("profile_type_process_template")
        .join("petition", "profile_type_process_template.template_id", "petition.id")
        .whereNull("petition.deleted_at")
        .whereIn("profile_type_process_template.profile_type_process_id", keys)
        .orderBy("profile_type_process_template.created_at", "asc")
        .select("petition.*", "profile_type_process_id");

      const byProfileTypeProcessId = groupBy(rows, (r) => r.profile_type_process_id);
      return keys.map((key) => byProfileTypeProcessId[key] ?? []);
    },
  );

  async orgHasAccessToProfileTypeProcesses(profileTypeProcessIds: number[], orgId: number) {
    const profileTypes = await this.raw<ProfileType>(
      /* sql */ `
      select pt.*
      from profile_type_process ptp
      join profile_type pt on ptp.profile_type_id = pt.id
      where ptp.id in ?
        and pt.org_id = ?
        and ptp.deleted_at is null
        and pt.deleted_at is null
      `,
      [this.sqlIn(profileTypeProcessIds), orgId],
    );

    return profileTypes.every(isNonNullish);
  }

  async createProfileTypeProcess(
    data: Omit<CreateProfileTypeProcess, "position">,
    createdBy: string,
  ) {
    const [{ max }] = await this.from("profile_type_process")
      .where({ profile_type_id: data.profile_type_id, deleted_at: null })
      .max("position");

    if (max === 2) {
      throw new Error("MAX_PROCESS_LIMIT_REACHED");
    }

    const [profileTypeProcess] = await this.from("profile_type_process").insert(
      {
        ...data,
        position: max === null ? 0 : max + 1,
        created_by: createdBy,
      },
      "*",
    );

    return profileTypeProcess;
  }

  async deleteProfileTypeProcessTemplates(profileTypeProcessId: number) {
    await this.from("profile_type_process_template")
      .where("profile_type_process_id", profileTypeProcessId)
      .delete();
  }

  async assignTemplatesToProfileTypeProcess(
    processId: number,
    templateIds: number[],
    createdBy: string,
  ) {
    if (templateIds.length === 0) {
      return [];
    }
    return await this.from("profile_type_process_template").insert(
      templateIds.map((templateId) => ({
        profile_type_process_id: processId,
        template_id: templateId,
        created_by: createdBy,
      })),
      "*",
    );
  }

  async editProfileTypeProcess(
    profileTypeProcessId: number,
    data: Partial<ProfileTypeProcess>,
    updatedBy: string,
  ) {
    const [profileTypeProcess] = await this.from("profile_type_process")
      .where("id", profileTypeProcessId)
      .whereNull("deleted_at")
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );

    return profileTypeProcess;
  }

  async removeProfileTypeProcess(profileTypeProcessId: number, removedBy: string) {
    await this.from("profile_type_process_template")
      .where("profile_type_process_id", profileTypeProcessId)
      .delete();

    const [profileTypeProcess] = await this.from("profile_type_process")
      .where("id", profileTypeProcessId)
      .whereNull("deleted_at")
      .update({ deleted_at: this.now(), deleted_by: removedBy }, "*");

    await this.from("profile_type_process")
      .where("profile_type_id", profileTypeProcess.profile_type_id)
      .where("position", ">", profileTypeProcess.position)
      .whereNull("deleted_at")
      .update({
        position: this.knex.raw("position - 1"),
        updated_at: this.now(),
        updated_by: removedBy,
      });

    return profileTypeProcess;
  }

  async updateProfileTypeProcessPositions(
    profileTypeId: number,
    profileTypeProcessIds: number[],
    updatedBy: string,
  ) {
    await this.raw(
      /* sql */ `
        update profile_type_process as ptp set
          position = t.position,
          updated_at = NOW(),
          updated_by = ?
        from (?) as t (id, position)
        where t.id = ptp.id
        and ptp.profile_type_id = ?
        and ptp.position != t.position;
      `,
      [
        updatedBy,
        this.sqlValues(
          profileTypeProcessIds.map((id, i) => [id, i]),
          ["int", "int"],
        ),
        profileTypeId,
      ],
    );
  }

  readonly loadLatestPetitionByProfileIdProcessId = this.buildLoader<
    {
      profileId: number;
      processId: number;
    },
    Petition | null,
    string
  >(
    async (keys, t) => {
      const rows = await this.raw<
        Petition & { profile_id: number; profile_type_process_id: number }
      >(
        /* sql */ `
          select pp.profile_id, ptpt.profile_type_process_id, p.* from petition p 
          join profile_type_process_template ptpt on ptpt.template_id = p.from_template_id and ptpt.profile_type_process_id in ?
          join petition_profile pp on pp.petition_id = p.id and pp.profile_id in ?
          where p.deleted_at is null
          and p.is_template = false
          order by p.created_at desc;
        `,
        [this.sqlIn(keys.map((k) => k.processId)), this.sqlIn(keys.map((k) => k.profileId))],
        t,
      );

      const byKey = groupBy(rows, keyBuilder(["profile_id", "profile_type_process_id"]));
      return keys
        .map(keyBuilder(["profileId", "processId"]))
        .map((key) => (byKey[key] ?? []).at(0) ?? null);
    },
    { cacheKeyFn: keyBuilder(["profileId", "processId"]) },
  );

  async conflictCheckSearch(
    search: string,
    orgId: number,
    profileTypeIds: number[],
    profileTypeFieldIds: number[],
  ) {
    if (profileTypeIds.length === 0 || profileTypeFieldIds.length === 0) {
      return [];
    }

    return await this.raw<Profile>(
      /* sql */ `
      select * from profile p 
      where (
        p.id in (
          select distinct(profile_id) from profile_field_value pfv 
          join profile_type_field ptf on ptf.id = pfv.profile_type_field_id and ptf.id in :ptfs and ptf.deleted_at is null
          join profile_type pt on pt.id = ptf.profile_type_id and pt.id in :pts and pt.deleted_at is null and pt.org_id = :orgId
          where pfv.deleted_at is null 
          and pfv.removed_at is null
          and pfv.type in ('TEXT', 'SHORT_TEXT')
          and strict_word_similarity(:search, coalesce(pfv."content"->>'value', '')) > :threshold
        )
        or strict_word_similarity(:search, coalesce(p.localizable_name->>'es', '')) > :threshold
        or strict_word_similarity(:search, coalesce(p.localizable_name->>'en', '')) > :threshold
      )
      and p.deleted_at is null
      and p.anonymized_at is null; 
    `,
      {
        ptfs: this.sqlIn(profileTypeFieldIds),
        pts: this.sqlIn(profileTypeIds),
        orgId,
        search,
        threshold: 0.3,
      },
    );
  }
}
