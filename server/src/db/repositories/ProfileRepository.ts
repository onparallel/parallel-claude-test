import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, indexBy, isDefined, omit, pick, times, uniq, values } from "remeda";
import { LocalizableUserText } from "../../graphql";
import { unMaybeArray } from "../../util/arrays";
import { Maybe, MaybeArray, Replace } from "../../util/types";
import {
  CreateProfileEvent,
  ProfileFieldExpiryUpdatedEvent,
  ProfileFieldFileAddedEvent,
  ProfileFieldValueUpdatedEvent,
} from "../events/ProfileEvent";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import {
  CreateProfile,
  CreateProfileType,
  CreateProfileTypeField,
  Profile,
  ProfileEvent,
  ProfileFieldFile,
  ProfileFieldValue,
  ProfileType,
  UserLocale,
} from "../__types";
import { keyBuilder } from "../../util/keyBuilder";
import { LazyPromise } from "../../util/promises/LazyPromise";

@injectable()
export class ProfileRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadProfileType = this.buildLoadBy("profile_type", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadProfileTypeField = this.buildLoadBy("profile_type_field", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadProfileTypeFieldsByProfileTypeId = this.buildLoadMultipleBy(
    "profile_type_field",
    "profile_type_id",
    (q) => q.whereNull("deleted_at").orderBy("position", "asc")
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
        t
      );
      const byId = indexBy(profileTypes, (pt) => pt.profile_id);
      return keys.map((id) => (isDefined(byId[id]) ? omit(byId[id], ["profile_id"]) : null));
    }
  );

  getPaginatedProfileTypesForOrg(
    orgId: number,
    opts: {
      search?: string | null;
      locale?: UserLocale;
      sortBy?: SortBy<"created_at" | "name">[];
    } & PageOpts
  ) {
    return this.getPagination<ProfileType>(
      this.from("profile_type")
        .where("org_id", orgId)
        .whereNull("deleted_at")
        .mmodify((q) => {
          const { search, sortBy, locale } = opts;
          if (search) {
            q.whereExists((q) =>
              q
                .select(this.knex.raw("1"))
                .fromRaw(`jsonb_each_text(name) AS t(key, value)`)
                .whereEscapedILike("value", `%${escapeLike(search, "\\")}%`)
            );
          }
          if (sortBy) {
            q.orderBy(
              sortBy.map(({ field, order }) => {
                if (field === "name") {
                  return { column: this.knex.raw(`"name"->>?`, [locale!]) as any, order };
                }
                return { column: field, order };
              })
            );
          }
        })
        .orderBy("id")
        .select("*"),
      opts
    );
  }

  async createProfileType(data: CreateProfileType, createdBy: string, t?: Knex.Transaction) {
    const [profile] = await this.from("profile_type", t).insert(
      {
        ...data,
        created_by: createdBy,
        updated_by: createdBy,
      },
      "*"
    );
    return profile;
  }

  async updateProfileType(
    id: number,
    data: Partial<CreateProfileType>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const [profileType] = await this.from("profile_type", t)
      .where({ id })
      .whereNull("deleted_at")
      .update(
        {
          ...data,
          updated_by: updatedBy,
          updated_at: this.now(),
        },
        "*"
      );

    return profileType;
  }

  async cloneProfileType(
    id: number,
    data: Partial<CreateProfileType>,
    createdBy: string,
    t?: Knex.Transaction
  ) {
    return await this.withTransaction(async (t) => {
      const sourceProfileType = (await this.loadProfileType.raw(id, t))!;
      const profileType = await this.createProfileType(
        { ...pick(sourceProfileType, ["org_id", "name"]), ...data },
        createdBy,
        t
      );
      const sourceFields = await this.loadProfileTypeFieldsByProfileTypeId.raw(
        sourceProfileType.id,
        t
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
                profile_type_id: profileType.id,
                expiry_alert_ahead_time:
                  field.is_expirable && field.expiry_alert_ahead_time
                    ? this.interval(field.expiry_alert_ahead_time)
                    : null,
                created_by: createdBy,
                updated_by: createdBy,
              })),
              t
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
              })
            ),
          },
          "*"
        );
      return updatedProfileType;
    }, t);
  }

  async deleteProfileTypes(id: MaybeArray<number>, deletedBy: string) {
    const ids = unMaybeArray(id);
    if (ids.length === 0) {
      return;
    }
    await this.from("profile_type").whereIn("id", ids).whereNull("deleted_at").update({
      deleted_at: this.now(),
      deleted_by: deletedBy,
    });
  }

  async createProfileTypeField(
    profileTypeId: number,
    data: Replace<
      Omit<CreateProfileTypeField, "profile_type_id" | "position">,
      { name: LocalizableUserText }
    >,
    createdBy: string,
    t?: Knex.Transaction
  ) {
    return await this.withTransaction(async (t) => {
      const [{ max }] = await this.from("profile_type_field", t)
        .whereNull("deleted_at")
        .where("profile_type_id", profileTypeId)
        .max("position");
      const [profileTypeField] = await this.insert(
        "profile_type_field",
        {
          profile_type_id: profileTypeId,
          position: max === null ? 0 : max + 1,
          ...data,
          expiry_alert_ahead_time: isDefined(data.expiry_alert_ahead_time)
            ? this.interval(data.expiry_alert_ahead_time)
            : data.expiry_alert_ahead_time,
          created_by: createdBy,
          updated_by: createdBy,
        },
        t
      );

      return profileTypeField;
    }, t);
  }

  async updateProfileTypeField(
    id: number,
    data: Partial<Omit<CreateProfileTypeField, "position">>,
    updatedBy: string
  ) {
    const [profileTypeField] = await this.from("profile_type_field")
      .where("id", id)
      .whereNull("deleted_at")
      .update(
        {
          ...data,
          expiry_alert_ahead_time: isDefined(data.expiry_alert_ahead_time)
            ? this.interval(data.expiry_alert_ahead_time)
            : data.expiry_alert_ahead_time,
          updated_by: updatedBy,
          updated_at: this.now(),
        },
        "*"
      );

    return profileTypeField;
  }

  async deleteProfileTypeFields(
    profileTypeId: number,
    profileTypeFieldIds: MaybeArray<number>,
    deletedBy: string
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
          t
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
    deletedBy: string
  ) {
    const profileTypeIds = unMaybeArray(profileTypeId);
    if (profileTypeIds.length === 0) {
      return;
    }
    await this.from("profile_type_field")
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
    updatedBy: string
  ) {
    return await this.withTransaction(async (t) => {
      const profileTypeFields = await this.loadProfileTypeFieldsByProfileTypeId.raw(
        profileTypeId,
        t
      );

      // check only valid fieldIds and not repeated
      const _profileTypeFieldIds = uniq(profileTypeFieldIds);
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
            ["int", "int"]
          ),
        ],
        t
      );
      this.loadProfileTypeFieldsByProfileTypeId.dataloader.clear(profileTypeId);
    });
  }

  readonly loadProfile = this.buildLoadBy("profile", "id", (q) => q.whereNull("deleted_at"));

  readonly loadProfileFieldValuesByProfileId = this.buildLoadMultipleBy(
    "profile_field_value",
    "profile_id",
    (q) => q.whereNull("removed_at").whereNull("deleted_at")
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
        .whereIn("profile_id", uniq(keys.map((k) => k.profileId)))
        .whereIn("profile_type_field_id", uniq(keys.map((k) => k.profileTypeFieldId)))
        .whereNull("removed_at")
        .whereNull("deleted_at");
      const byKey = indexBy(values, keyBuilder(["profile_id", "profile_type_field_id"]));
      return keys.map(keyBuilder(["profileId", "profileTypeFieldId"])).map((k) => byKey[k] ?? null);
    },
    { cacheKeyFn: keyBuilder(["profileId", "profileTypeFieldId"]) }
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
        .whereIn("profile_id", uniq(keys.map((k) => k.profileId)))
        .whereIn("profile_type_field_id", uniq(keys.map((k) => k.profileTypeFieldId)))
        .whereNull("removed_at")
        .whereNull("deleted_at");
      const byKey = groupBy(files, keyBuilder(["profile_id", "profile_type_field_id"]));
      return keys.map(keyBuilder(["profileId", "profileTypeFieldId"])).map((k) => byKey[k] ?? null);
    },
    { cacheKeyFn: keyBuilder(["profileId", "profileTypeFieldId"]) }
  );

  readonly loadProfileFieldFileById = this.buildLoadBy("profile_field_file", "id", (q) =>
    q.whereNull("removed_at").whereNull("deleted_at")
  );

  readonly loadProfileFieldFilesByProfileId = this.buildLoadMultipleBy(
    "profile_field_file",
    "profile_id",
    (q) => q.whereNull("removed_at").whereNull("deleted_at")
  );

  getPaginatedProfileForOrg(
    orgId: number,
    opts: {
      search?: string | null;
      filter?: {
        profileTypeId?: number[] | null;
      } | null;
      sortBy?: SortBy<"created_at" | "name">[];
    } & PageOpts
  ) {
    return this.getPagination<Profile>(
      this.from("profile")
        .where("org_id", orgId)
        .whereNull("deleted_at")
        .mmodify((q) => {
          const { search, sortBy, filter } = opts;
          if (search) {
            q.whereEscapedILike("name", `%${escapeLike(search, "\\")}%`);
          }
          if (isDefined(filter?.profileTypeId)) {
            q.whereIn("profile_type_id", filter!.profileTypeId);
          }
          if (isDefined(sortBy)) {
            q.orderBy(
              sortBy.map(({ field, order }) => {
                return { column: field, order };
              })
            );
          }
        })
        .orderBy("id")
        .select("*"),
      opts
    );
  }

  async createProfile(data: CreateProfile, userId: number) {
    return await this.withTransaction(async (t) => {
      const [profile] = await this.insert(
        "profile",
        {
          ...data,
          created_at: this.now(),
          created_by: `User:${userId}`,
        },
        t
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
        t
      );
      return profile;
    });
  }

  async updateProfile(profileId: number, data: Partial<CreateProfile>, updatedBy: string) {
    const [profile] = await this.from("profile")
      .where("id", profileId)
      .update({ ...data, updated_at: this.now(), updated_by: updatedBy }, "*");

    return profile;
  }

  async updateProfileTypeProfileNamePattern(
    profileTypeId: number,
    pattern: (string | number)[],
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    return await this.withTransaction(async (t) => {
      await this.raw(
        /* sql */ `
        with profile_values as (
          select p.id, jsonb_object_agg(pfv.profile_type_field_id, pfv.content->>'value') as values
          from "profile" p
          join profile_field_value pfv on pfv.profile_id = p.id
          where pfv.profile_type_field_id in ?
            and p.deleted_at is null and pfv.removed_at is null and pfv.deleted_at is null
          group by p.id
        ) update "profile" p set
          "name" =  trim(both from concat(${times(pattern.length, () => "?::text").join(",")})),
          updated_by = ?,
          updated_at = NOW()
        from profile_values pv
        where pv.id = p.id
      `,
        [
          this.sqlIn(pattern.filter((p) => typeof p === "number")),
          ...pattern.map((p) =>
            typeof p === "string" ? p : this.knex.raw(`coalesce(pv.values->>?, '')`, [`${p}`])
          ),
          updatedBy,
        ],
        t
      );
      return await this.updateProfileType(
        profileTypeId,
        { profile_name_pattern: this.json(pattern) },
        updatedBy,
        t
      );
    }, t);
  }

  async deleteProfile(profileId: MaybeArray<number>, deletedBy: string) {
    const ids = unMaybeArray(profileId);
    if (ids.length === 0) {
      return;
    }
    await this.from("profile").whereIn("id", ids).whereNull("deleted_at").update({
      deleted_at: this.now(),
      deleted_by: deletedBy,
    });
  }

  async updateProfileFieldValue(
    profileId: number,
    fields: {
      profileTypeFieldId: number;
      content?: Record<string, any> | null;
      expiresAt?: Date | null;
    }[],
    userId: number
  ) {
    return await this.withTransaction(async (t) => {
      const profileType = (await this.loadProfileTypeForProfileId.raw(profileId, t))!;
      const previousValues = await this.from("profile_field_value", t)
        .whereNull("deleted_at")
        .whereNull("removed_at")
        .where("profile_id", profileId)
        .whereIn(
          "profile_type_field_id",
          fields.map((f) => f.profileTypeFieldId)
        )
        .update({ removed_at: this.now(), removed_by_user_id: userId })
        .returning("*");
      const previousByPtfId = indexBy(previousValues, (v) => v.profile_type_field_id);
      const currentValues = await this.insert(
        "profile_field_value",
        fields
          .filter((f) => isDefined(f.content))
          .map((f) => ({
            profile_id: profileId,
            profile_type_field_id: f.profileTypeFieldId,
            content: f.content,
            created_by_user_id: userId,
            ...(f.expiresAt !== undefined
              ? { expires_at: f.expiresAt }
              : { expires_at: previousByPtfId[f.profileTypeFieldId]?.expires_at ?? null }),
          })),
        t
      );
      this.loadProfileFieldValuesByProfileId.dataloader.clear(profileId);
      const currentByPtfId = indexBy(currentValues, (v) => v.profile_type_field_id);
      await this.createEvent(
        fields.flatMap((f) => {
          const current = currentByPtfId[f.profileTypeFieldId] as ProfileFieldValue | undefined;
          const previous = previousByPtfId[f.profileTypeFieldId] as ProfileFieldValue | undefined;
          const expiryChanged =
            f.expiresAt !== undefined &&
            (previous?.expires_at?.valueOf() ?? null) !== (f.expiresAt?.valueOf() ?? null);
          return [
            ...(isDefined(current) || isDefined(previous)
              ? [
                  {
                    org_id: profileType.org_id,
                    profile_id: profileId,
                    type: "PROFILE_FIELD_VALUE_UPDATED",
                    data: {
                      user_id: userId,
                      profile_type_field_id: f.profileTypeFieldId,
                      current_profile_field_value_id: current?.id ?? null,
                      previous_profile_field_value_id: previous?.id ?? null,
                    },
                  } satisfies ProfileFieldValueUpdatedEvent<true>,
                ]
              : []),
            ...(expiryChanged
              ? [
                  {
                    org_id: profileType.org_id,
                    profile_id: profileId,
                    type: "PROFILE_FIELD_EXPIRY_UPDATED",
                    data: {
                      user_id: userId,
                      profile_type_field_id: f.profileTypeFieldId,
                      expires_at: current?.expires_at?.toISOString() ?? null,
                    },
                  } satisfies ProfileFieldExpiryUpdatedEvent<true>,
                ]
              : []),
          ];
        }),
        t
      );
      const pattern = profileType.profile_name_pattern as (string | number)[];
      if (fields.some((f) => pattern.includes(f.profileTypeFieldId))) {
        const [profile] = await this.raw<Profile>(
          /* sql */ `
          with profile_values as (
            select p.id, jsonb_object_agg(pfv.profile_type_field_id, pfv.content->>'value') as values
            from "profile" p
            join profile_field_value pfv on pfv.profile_id = p.id
            where pfv.profile_id = ? and pfv.profile_type_field_id in ?
              and p.deleted_at is null and pfv.removed_at is null and pfv.deleted_at is null
            group by p.id
          ) update "profile" p set
            "name" =  trim(both from concat(${times(pattern.length, () => "?::text").join(",")})),
            updated_by = ?,
            updated_at = NOW()
          from profile_values pv
          where pv.id = p.id
          returning p.*
        `,
          [
            profileId,
            this.sqlIn(pattern.filter((p) => typeof p === "number")),
            ...pattern.map((p) =>
              typeof p === "string" ? p : this.knex.raw(`coalesce(pv.values->>?, '')`, [`${p}`])
            ),
            `User:${userId}`,
          ],
          t
        );
        return profile;
      } else {
        return await this.loadProfile.raw(profileId, t);
      }
    });
  }

  async createProfileFieldFiles(
    profileId: number,
    profileTypeFieldId: number,
    fileUploadIds: number[],
    expiresAt: Date | null | undefined,
    userId: number
  ) {
    return await this.withTransaction(async (t) => {
      const profileType = (await this.loadProfileTypeForProfileId.raw(profileId, t))!;
      const previousFiles =
        expiresAt === undefined
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
              .update({ expires_at: expiresAt })
              .returning("*");
      const profileFieldFiles = await this.insert(
        "profile_field_file",
        fileUploadIds.map((fileUploadId) => ({
          profile_id: profileId,
          profile_type_field_id: profileTypeFieldId,
          file_upload_id: fileUploadId,
          expires_at: previousFiles[0]?.expires_at ?? null,
          created_by_user_id: userId,
        })),
        t
      );
      await this.createEvent(
        [
          ...profileFieldFiles.map(
            (pff) =>
              ({
                org_id: profileType.org_id,
                profile_id: pff.profile_id,
                type: "PROFILE_FIELD_FILE_ADDED",
                data: {
                  user_id: userId,
                  profile_type_field_id: profileTypeFieldId,
                  profile_field_file_id: pff.id,
                },
              } satisfies ProfileFieldFileAddedEvent<true>)
          ),
          ...(expiresAt !== undefined
            ? [
                {
                  org_id: profileType.org_id,
                  profile_id: profileId,
                  type: "PROFILE_FIELD_EXPIRY_UPDATED",
                  data: {
                    user_id: userId,
                    profile_type_field_id: profileTypeFieldId,
                    expires_at: expiresAt?.toISOString() ?? null,
                  },
                } satisfies ProfileFieldExpiryUpdatedEvent<true>,
              ]
            : []),
        ],
        t
      );
      return profileFieldFiles;
    });
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
      opts
    );
  }

  async createEvent(events: MaybeArray<CreateProfileEvent>, t?: Knex.Transaction) {
    if (Array.isArray(events) && events.length === 0) {
      return [];
    }
    return await this.insert("profile_event", events, t);
  }

  getPaginatedExpirableProfileFieldProperties(
    userId: number,
    orgId: number,
    opts: {
      search?: Maybe<string>;
      filter?: Maybe<{
        profileTypeFieldId?: Maybe<number[]>;
        profileTypeId?: Maybe<number[]>;
      }>;
    } & PageOpts
  ) {
    const filter = (q: Knex.QueryBuilder) => {
      if (isDefined(opts.search)) {
        q.whereEscapedILike("p.name", `%${escapeLike(opts.search, "\\")}%`, "\\");
      }
      if (isDefined(opts.filter?.profileTypeId) && opts.filter!.profileTypeId.length > 0) {
        q.whereIn("p.profile_type_id", opts.filter!.profileTypeId);
      }
      if (
        isDefined(opts.filter?.profileTypeFieldId) &&
        opts.filter!.profileTypeFieldId.length > 0
      ) {
        q.whereIn("pfx.profile_type_field_id", opts.filter!.profileTypeFieldId);
      }
    };
    const valuesQuery = this.knex
      .from(this.knex.ref("profile").as("p"))
      .join(this.knex.ref("profile_field_value").as("pfx"), "p.id", "pfx.profile_id")
      .join(this.knex.ref("profile_type_field").as("ptf"), "ptf.id", "pfx.profile_type_field_id")
      .where("p.org_id", orgId)
      .whereNull("p.deleted_at")
      .whereNotNull("pfx.expires_at")
      .whereNull("pfx.removed_at")
      .whereNull("pfx.deleted_at")
      .whereNotNull("ptf.expiry_alert_ahead_time")
      .modify(filter);
    const filesQuery = this.knex
      .from(this.knex.ref("profile").as("p"))
      .join(this.knex.ref("profile_field_file").as("pfx"), "p.id", "pfx.profile_id")
      .join(this.knex.ref("profile_type_field").as("ptf"), "ptf.id", "pfx.profile_type_field_id")
      .where("p.org_id", orgId)
      .whereNull("p.deleted_at")
      .whereNotNull("pfx.expires_at")
      .whereNull("pfx.removed_at")
      .whereNull("pfx.deleted_at")
      .whereNotNull("ptf.expiry_alert_ahead_time")
      .modify(filter);
    return {
      totalCount: LazyPromise.from(async () => {
        const counts = await this.knex.unionAll([
          valuesQuery.clone().select<{ count: number }[]>(this.count()),
          this.knex
            .fromRaw(
              this.knex.raw("(?) t", [
                filesQuery.clone().distinct("pfx.profile_id", "pfx.profile_type_field_id"),
              ])
            )
            .select<{ count: number }[]>(this.count()),
        ]);
        return counts[0].count + counts[1].count;
      }),
      items: LazyPromise.from(async () => {
        const properties: {
          profile_id: number;
          profile_type_field_id: number;
          in_alert: boolean;
          expires_at: Date;
        }[] = await this.knex
          .unionAll([
            valuesQuery
              .clone()
              .select(
                "pfx.profile_id",
                "pfx.profile_type_field_id",
                "pfx.expires_at",
                this.knex.raw(
                  /* sql */ `pfx.expires_at - ptf.expiry_alert_ahead_time < now() as in_alert`
                )
              ),
            filesQuery
              .clone()
              .distinctOn("pfx.profile_id", "pfx.profile_type_field_id")
              .select(
                "pfx.profile_id",
                "pfx.profile_type_field_id",
                "pfx.expires_at",
                this.knex.raw(
                  /* sql */ `pfx.expires_at - ptf.expiry_alert_ahead_time < now() as in_alert`
                )
              ),
          ])
          .orderBy("in_alert", "desc")
          .orderBy("expires_at", "asc")
          .orderBy("profile_id")
          .orderBy("profile_type_field_id")
          .offset(opts.offset ?? 0)
          .limit(opts.limit ?? 0);
        return properties.map(omit(["in_alert", "expires_at"]));
      }),
    };
  }
}
