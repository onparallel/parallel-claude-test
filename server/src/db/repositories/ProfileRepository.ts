import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { uniq } from "remeda";
import { LocalizableUserText } from "../../graphql";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray, Replace } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import {
  CreateProfile,
  CreateProfileType,
  CreateProfileTypeField,
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
      await this.raw(
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
      );
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
    (q) => q.where("is_current", true).whereNull("deleted_at")
  );

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
}
