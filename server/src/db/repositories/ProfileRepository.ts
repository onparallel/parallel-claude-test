import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { indexBy, isDefined, omit, times, uniq } from "remeda";
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
    const [profile] = await this.from("profile_type").insert(
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
  readonly loadProfileFieldFilesByProfileId = this.buildLoadMultipleBy(
    "profile_field_file",
    "profile_id",
    (q) => q.whereNull("removed_at").whereNull("deleted_at")
  );

  getPaginatedProfileForOrg(
    orgId: number,
    opts: {
      search?: string | null;
      sortBy?: SortBy<"created_at" | "name">[];
    } & PageOpts
  ) {
    return this.getPagination<Profile>(
      this.from("profile")
        .where("org_id", orgId)
        .whereNull("deleted_at")
        .mmodify((q) => {
          const { search, sortBy } = opts;
          if (search) {
            q.whereEscapedILike("name", `%${escapeLike(search, "\\")}%`);
          }
          if (sortBy) {
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

  async createProfileFieldValue(
    profileId: number,
    contents: [profileTypeFieldId: number, content: any, expiresAt: Date | null][],
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
          contents.map(([profileTypeFieldId]) => profileTypeFieldId)
        )
        .update({ removed_at: this.now(), removed_by_user_id: userId })
        .returning("*");
      const previousByPtfId = indexBy(previousValues, (v) => v.profile_type_field_id);
      const currentValues = await this.insert(
        "profile_field_value",
        contents.map(([profileTypeFieldId, content, expiresAt]) => ({
          profile_id: profileId,
          profile_type_field_id: profileTypeFieldId,
          content,
          expires_at: expiresAt,
          created_by_user_id: userId,
        })),
        t
      );
      const currentByPtfId = indexBy(currentValues, (v) => v.profile_type_field_id);
      await this.createEvent(
        contents.map(([profileTypeFieldId]) => ({
          org_id: profileType.org_id,
          profile_id: profileId,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            current_value: currentByPtfId[profileTypeFieldId].id,
            previous_value: previousByPtfId[profileTypeFieldId]?.id,
          },
        })),
        t
      );
      const pattern = profileType.profile_name_pattern as (string | number)[];
      if (contents.some(([profileTypeFieldId]) => pattern.includes(profileTypeFieldId))) {
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

  async createEvent(events: MaybeArray<CreateProfileEvent>, t?: Knex.Transaction) {
    if (Array.isArray(events) && events.length === 0) {
      return [];
    }
    const profileEvents = await this.insert("profile_event", events, t);
    return profileEvents;
  }
}
