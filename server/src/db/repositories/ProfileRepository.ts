import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, indexBy, isDefined, omit, pick, times, uniq } from "remeda";
import { LocalizableUserText } from "../../graphql";
import { unMaybeArray } from "../../util/arrays";
import { keyBuilder } from "../../util/keyBuilder";
import { LazyPromise } from "../../util/promises/LazyPromise";
import { Maybe, MaybeArray, Replace } from "../../util/types";
import {
  CreateProfile,
  CreateProfileFieldFile,
  CreateProfileFieldValue,
  CreateProfileType,
  CreateProfileTypeField,
  Profile,
  ProfileEvent,
  ProfileFieldFile,
  ProfileFieldValue,
  ProfileType,
  ProfileTypeFieldType,
  UserLocale,
} from "../__types";
import {
  CreateProfileEvent,
  ProfileFieldExpiryUpdatedEvent,
  ProfileFieldFileAddedEvent,
  ProfileFieldValueUpdatedEvent,
} from "../events/ProfileEvent";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { SortBy, escapeLike } from "../helpers/utils";
import { KNEX } from "../knex";

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

  async createProfileType(
    data: MaybeArray<CreateProfileType>,
    createdBy: string,
    t?: Knex.Transaction
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
      "*"
    );
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
      const [profileType] = await this.createProfileType(
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

  async createProfileTypeField(
    profileTypeId: number,
    data: MaybeArray<
      Replace<
        Omit<CreateProfileTypeField, "profile_type_id" | "position">,
        { name: LocalizableUserText }
      >
    >,
    createdBy: string,
    t?: Knex.Transaction
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
          expiry_alert_ahead_time: isDefined(d.expiry_alert_ahead_time)
            ? this.interval(d.expiry_alert_ahead_time)
            : d.expiry_alert_ahead_time,
          created_by: createdBy,
          updated_by: createdBy,
        })),
        t
      );
    }, t);
  }

  async updateProfileTypeField(
    id: number,
    data: Partial<Omit<CreateProfileTypeField, "position">>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const [profileTypeField] = await this.from("profile_type_field", t)
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
    deletedBy: string,
    t?: Knex.Transaction
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

  readonly loadProfileFieldFilesByProfileTypeFieldId = this.buildLoadMultipleBy(
    "profile_field_file",
    "profile_type_field_id",
    (q) => q.whereNull("removed_at").whereNull("deleted_at")
  );

  async deleteProfileFieldFiles(profileFieldFileId: MaybeArray<number>, userId: number) {
    const ids = unMaybeArray(profileFieldFileId);
    if (ids.length === 0) {
      return;
    }

    await this.from("profile_field_file").whereIn("id", ids).update({
      removed_at: this.now(),
      removed_by_user_id: userId,
    });
  }

  getPaginatedProfileForOrg(
    orgId: number,
    opts: {
      search?: string | null;
      filter?: {
        profileId?: number[] | null;
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
          if (isDefined(filter?.profileId)) {
            q.whereIn("id", filter!.profileId);
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
          select 
            p.id, 
            jsonb_object_agg(
              pfv.profile_type_field_id, 
              case when pfv.removed_at is null 
                then pfv.content->>'value'
                else ''
              end) as values
          from "profile" p
          join profile_field_value pfv on pfv.profile_id = p.id
          where pfv.profile_type_field_id in ?
            and p.deleted_at is null and pfv.deleted_at is null
          group by p.id
        ) update "profile" p set
          "name" = substring(
            trim(both from concat(${times(pattern.length, () => "?::text").join(",")})),
            1,
            255
          ),
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

  async deleteProfile(profileId: MaybeArray<number>, deletedBy: string, t?: Knex.Transaction) {
    const ids = unMaybeArray(profileId);
    if (ids.length === 0) {
      return;
    }
    await this.from("profile", t).whereIn("id", ids).whereNull("deleted_at").update({
      deleted_at: this.now(),
      deleted_by: deletedBy,
    });
  }

  async deleteProfilesByProfileTypeId(
    profileTypeIds: MaybeArray<number>,
    deletedBy: string,
    t?: Knex.Transaction
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
    fields: {
      profileTypeFieldId: number;
      type: ProfileTypeFieldType;
      content?: Record<string, any> | null;
      expiryDate?: string | null;
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
      const fieldsWithContent = fields.filter((f) => isDefined(f.content));
      const currentValues =
        fieldsWithContent.length > 0
          ? await this.insert(
              "profile_field_value",
              fieldsWithContent.map((f) => ({
                profile_id: profileId,
                profile_type_field_id: f.profileTypeFieldId,
                type: f.type,
                content: f.content,
                created_by_user_id: userId,
                ...(f.expiryDate !== undefined
                  ? { expiry_date: f.expiryDate }
                  : { expiry_date: previousByPtfId[f.profileTypeFieldId]?.expiry_date ?? null }),
              })),
              t
            )
          : [];
      this.loadProfileFieldValuesByProfileId.dataloader.clear(profileId);
      const currentByPtfId = indexBy(currentValues, (v) => v.profile_type_field_id);
      await this.createEvent(
        fields.flatMap((f) => {
          const current = currentByPtfId[f.profileTypeFieldId] as ProfileFieldValue | undefined;
          const previous = previousByPtfId[f.profileTypeFieldId] as ProfileFieldValue | undefined;
          const expiryChanged =
            f.expiryDate !== undefined &&
            (previous?.expiry_date?.valueOf() ?? null) !== (f.expiryDate?.valueOf() ?? null);
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
                      expiry_date: current?.expiry_date ?? null,
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
        await this.updateProfileTypeProfileNamePattern(
          profileType.id,
          pattern,
          `User:${userId}`,
          t
        );
      }

      return await this.loadProfile.raw(profileId, t);
    });
  }

  async profileFieldRepliesHaveExpiryDateSet(
    profileTypeFieldId: number,
    type: ProfileTypeFieldType,
    t?: Knex.Transaction
  ) {
    const [{ count }] = await this.from(
      type === "FILE" ? "profile_field_file" : "profile_field_value",
      t
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

  async updateProfileFieldValuesByProfileTypeFieldId(
    profileTypeFieldId: number,
    data: Partial<CreateProfileFieldValue>,
    t?: Knex.Transaction
  ) {
    await this.from("profile_field_value", t)
      .where("profile_type_field_id", profileTypeFieldId)
      .whereNull("deleted_at")
      .whereNull("removed_at")
      .update(data);
  }

  async updateProfileFieldFilesByProfileTypeFieldId(
    profileTypeFieldId: number,
    data: Partial<CreateProfileFieldFile>,
    t?: Knex.Transaction
  ) {
    await this.from("profile_field_file", t)
      .where("profile_type_field_id", profileTypeFieldId)
      .whereNull("deleted_at")
      .whereNull("removed_at")
      .update(data);
  }

  async createProfileFieldFiles(
    profileId: number,
    profileTypeFieldId: number,
    fileUploadIds: number[],
    expiryDate: string | null | undefined,
    userId: number
  ) {
    return await this.withTransaction(async (t) => {
      const profileType = (await this.loadProfileTypeForProfileId.raw(profileId, t))!;
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
      const profileFieldFiles = await this.insert(
        "profile_field_file",
        fileUploadIds.map((fileUploadId) => ({
          profile_id: profileId,
          profile_type_field_id: profileTypeFieldId,
          type: "FILE" as const,
          file_upload_id: fileUploadId,
          expiry_date: previousFiles[0]?.expiry_date ?? expiryDate ?? null,
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
          ...(expiryDate !== undefined
            ? [
                {
                  org_id: profileType.org_id,
                  profile_id: profileId,
                  type: "PROFILE_FIELD_EXPIRY_UPDATED",
                  data: {
                    user_id: userId,
                    profile_type_field_id: profileTypeFieldId,
                    expiry_date: expiryDate ?? null,
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

  async updateProfileFieldFilesExpiryDate(
    profileId: number,
    profileTypeFieldId: number,
    expiryDate: Maybe<string>
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
    defaultTimezone: string,
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
      .whereNull("p.deleted_at")
      .whereNotNull("pfx.expiry_date")
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
          expiry_date: Date;
        }[] = await this.knex
          .unionAll([
            valuesQuery
              .clone()
              .select(
                "pfx.profile_id",
                "pfx.profile_type_field_id",
                "pfx.expiry_date",
                this.knex.raw(
                  /* sql */ `(pfx.expiry_date at time zone ?) - ptf.expiry_alert_ahead_time < now() as in_alert`,
                  [defaultTimezone]
                )
              ),
            filesQuery
              .clone()
              .distinctOn("pfx.profile_id", "pfx.profile_type_field_id")
              .select(
                "pfx.profile_id",
                "pfx.profile_type_field_id",
                "pfx.expiry_date",
                this.knex.raw(
                  /* sql */ `(pfx.expiry_date at time zone ?) - ptf.expiry_alert_ahead_time < now() as in_alert`,
                  [defaultTimezone]
                )
              ),
          ])
          .orderBy("in_alert", "desc")
          .orderBy("expiry_date", "asc")
          .orderBy("profile_id")
          .orderBy("profile_type_field_id")
          .offset(opts.offset ?? 0)
          .limit(opts.limit ?? 0);
        return properties.map(omit(["in_alert", "expiry_date"]));
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
            }))
          )
        ),
      ]
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
    q.whereNull("deleted_at")
  );
}
