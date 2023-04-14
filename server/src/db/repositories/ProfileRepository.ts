import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { indexBy, isDefined, omit, pick, times, uniq } from "remeda";
import { LocalizableUserText } from "../../graphql";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray, Replace } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import {
  CreateProfile,
  CreateProfileEvent,
  CreateProfileType,
  CreateProfileTypeField,
  Profile,
  ProfileFieldValue,
  ProfileType,
  UserLocale,
} from "../__types";

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

  readonly loadProfileTypeForProfileId = this.buildLoader<number, ProfileType | null>(
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
                ...omit(field, ["id", "profile_type_id", "created_at", "updated_at"]),
                profile_type_id: profileType.id,
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
            q.where("profile_type_id", filter?.profileTypeId);
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

  async createProfile(data: CreateProfile, createdBy: string) {
    const [profile] = await this.from("profile").insert(
      {
        ...data,
        created_at: this.now(),
        created_by: createdBy,
      },
      "*"
    );
    return profile;
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
                      current_profile_field_value_id: current?.id,
                      previous_profile_field_value_id: previous?.id,
                    },
                  } as CreateProfileEvent,
                ]
              : []),
            ...(expiryChanged
              ? [
                  {
                    org_id: profileType.org_id,
                    profile_id: profileId,
                    type: "PROFILE_FIELD_EXPIRY_UPDATED",
                    data: {
                      profile_type_field_id: current?.profile_type_field_id,
                      expires_at: current?.expires_at?.toISOString() ?? null,
                    },
                  } as CreateProfileEvent,
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
                  profile_field_file: pff.id,
                },
              } as CreateProfileEvent)
          ),
          ...(expiresAt !== undefined
            ? [
                {
                  org_id: profileType.org_id,
                  profile_id: profileId,
                  type: "PROFILE_FIELD_EXPIRY_UPDATED",
                  data: {
                    profile_type_field_id: profileTypeFieldId,
                    expires_at: expiresAt?.toISOString() ?? null,
                  },
                } as CreateProfileEvent,
              ]
            : []),
        ],
        t
      );
      return profileFieldFiles;
    });
  }

  async createEvent(events: MaybeArray<CreateProfileEvent>, t?: Knex.Transaction) {
    if (Array.isArray(events) && events.length === 0) {
      return [];
    }
    const profileEvents = await this.insert("profile_event", events, t);
    return profileEvents;
  }
}
