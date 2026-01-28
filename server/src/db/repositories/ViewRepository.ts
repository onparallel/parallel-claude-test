import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy } from "remeda";
import { keyBuilder } from "../../util/keyBuilder";
import { Maybe, MaybeArray, unMaybeArray } from "../../util/types";
import {
  CreatePetitionListView,
  CreateProfileListView,
  PetitionListView,
  ProfileListView,
  ProfileType,
  User,
} from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

@injectable()
export class ViewRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadPetitionListView = this.buildLoadBy("petition_list_view", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadPetitionListViewsByUserId = this.buildLoadMultipleBy(
    "petition_list_view",
    "user_id",
    (q) => q.whereNull("deleted_at").orderBy("position", "asc"),
  );

  async getPetitionListViewUsingTags(tagId: number) {
    return await this.from("petition_list_view")
      .whereNotNull("data")
      .whereRaw(
        `"data"->'tagsFilters'->'filters' @> jsonb_build_array(
          jsonb_build_object(
            'value',
            jsonb_build_array(?::int)
          )
        )`,
        [tagId],
      )
      .select("*");
  }

  async createPetitionListView(data: MaybeArray<CreatePetitionListView>, createdBy: string) {
    const views = unMaybeArray(data);
    if (views.length === 0) {
      return [];
    }
    return await this.from("petition_list_view").insert(
      views.map((view) => ({
        ...view,
        data: this.json(view.data),
        created_by: createdBy,
      })),
      "*",
    );
  }

  async updatePetitionListView(
    id: number,
    data: Partial<PetitionListView>,
    user: User,
    t?: Knex.Transaction,
  ) {
    const [view] = await this.from("petition_list_view", t)
      .where({ id, deleted_at: null, user_id: user.id })
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        },
        "*",
      );

    return view;
  }

  /**
   *
   * @param input list of bidimensional array where first argument is the ID of the view
   * and the second argument is its new configuration
   */
  async updatePetitionListViewData(input: [number, any][], user: User, t?: Knex.Transaction) {
    if (input.length > 0) {
      await this.raw(
        /* sql */ `
      with update_data("id", "data") as (?)
      update petition_list_view plv
      set 
        "data" = ud.data,
        "updated_at" = NOW(),
        "updated_by" = ?
      from "update_data" ud
      where 
        plv.id = ud.id
        and plv.deleted_at is null
        and plv.user_id = ?
    `,
        [this.sqlValues(input, ["int", "jsonb"]), `User:${user.id}`, user.id],
        t,
      );
    }
  }

  async markDefaultPetitionListView(id: Maybe<number>, user: User) {
    await this.from("petition_list_view")
      .where({ user_id: user.id, deleted_at: null })
      .update({
        updated_at: this.now(),
        updated_by: `User:${user.id}`,
        is_default: this.knex.raw(
          /* sql */ `
          case when (id != ?::int or ?::int is null) then false else true end
        `,
          [id, id],
        ),
      });
  }

  async reorderPetitionListViewsByUserId(userId: number, orderedIds: number[]) {
    await this.raw(
      /* sql */ `
      update petition_list_view plv set 
      position = t.position, 
      updated_at = NOW(),
      updated_by = ?
      from (?) as t (id, position)
      where plv.id = t.id
      and plv.user_id = ?
      and plv.deleted_at is null;
    `,
      [
        `User:${userId}`,
        this.sqlValues(
          orderedIds.map((id, i) => [id, i]),
          ["int", "int"],
        ),
        userId,
      ],
    );
  }

  async deletePetitionListView(id: number, user: User) {
    await this.from("petition_list_view")
      .where({
        id,
        user_id: user.id,
        deleted_at: null,
      })
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${user.id}`,
      });
  }

  readonly loadProfileListView = this.buildLoadBy("profile_list_view", "id", (q) =>
    q.whereNull("deleted_at"),
  );

  readonly loadProfileListViewsByUserIdProfileTypeId = this.buildLoader<
    { userId: number; profileTypeId: number },
    ProfileListView[],
    string
  >(
    async (keys, t) => {
      const rows = await this.from("profile_list_view", t)
        .whereIn(
          "user_id",
          keys.map((k) => k.userId),
        )
        .whereIn(
          "profile_type_id",
          keys.map((k) => k.profileTypeId),
        )
        .whereNull("deleted_at")
        .orderBy("position", "asc")
        .select("*");

      const results = groupBy(rows, keyBuilder(["user_id", "profile_type_id"]));
      return keys.map(keyBuilder(["userId", "profileTypeId"])).map((key) => results[key] ?? []);
    },
    { cacheKeyFn: keyBuilder(["userId", "profileTypeId"]) },
  );

  async createProfileListView(data: MaybeArray<CreateProfileListView>, createdBy: string) {
    const views = unMaybeArray(data);
    if (views.length === 0) {
      return [];
    }
    return await this.from("profile_list_view").insert(
      views.map((view) => ({
        ...view,
        data: this.json(view.data),
        created_by: createdBy,
      })),
      "*",
    );
  }

  async updateProfileListView(
    id: number,
    data: Partial<Omit<ProfileListView, "profile_type_id">>,
    user: User,
    t?: Knex.Transaction,
  ) {
    const [view] = await this.from("profile_list_view", t)
      .where({ id, deleted_at: null, user_id: user.id })
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        },
        "*",
      );

    return view;
  }

  async markDefaultProfileListView(id: number, profileTypeId: number, user: User) {
    const views = await this.from("profile_list_view")
      .where({
        user_id: user.id,
        profile_type_id: profileTypeId,
        deleted_at: null,
      })
      .update(
        {
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
          is_default: this.knex.raw(
            /* sql */ `
              case when (id != ?::int or ?::int is null) then false else true end
            `,
            [id, id],
          ),
        },
        "*",
      );

    return views.find((v) => v.id === id);
  }
  async reorderProfileListViewsByUserId(
    userId: number,
    profileTypeId: number,
    orderedIds: number[],
  ) {
    await this.raw(
      /* sql */ `
          update profile_list_view plv set 
          position = t.position, 
          updated_at = NOW(),
          updated_by = ?
          from (?) as t (id, position)
          where plv.id = t.id
          and plv.user_id = ?
          and plv.profile_type_id = ?
          and plv.deleted_at is null;
        `,
      [
        `User:${userId}`,
        this.sqlValues(
          orderedIds.map((id, i) => [id, i]),
          ["int", "int"],
        ),
        userId,
        profileTypeId,
      ],
    );
  }

  async deleteProfileListView(id: number, user: User) {
    await this.from("profile_list_view")
      .where({
        id,
        user_id: user.id,
        deleted_at: null,
      })
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${user.id}`,
      });
  }

  async createProfileListViewsByOrgId(
    orgId: number,
    profileType: ProfileType,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    switch (profileType.standard_type) {
      case "INDIVIDUAL":
      case "LEGAL_ENTITY":
        await this._createProfileListViewsByOrgId(
          orgId,
          profileType.id,
          ["p_client_status", "p_risk", "p_relationship"],
          createdBy,
          t,
        );
        break;
      case "CONTRACT":
        await this._createProfileListViewsByOrgId(
          orgId,
          profileType.id,
          ["p_signature_date", "p_expiration_date"],
          createdBy,
          t,
        );
        break;
      case "MATTER":
        await this._createProfileListViewsByOrgId(
          orgId,
          profileType.id,
          ["p_matter_id", "p_matter_status", "p_matter_risk", "p_kyc_date"],
          createdBy,
          t,
        );
        break;
      default:
        await this.createDefaultProfileListViewsByOrgId(orgId, profileType.id, createdBy, t);
        break;
    }
  }

  private async _createProfileListViewsByOrgId(
    orgId: number,
    profileTypeId: number,
    columnFieldAliases: string[],
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    await this.raw(
      /* sql */ `
      with ordered_aliases as (
        select * from (?) as t("alias", "custom_order")
      )
      insert into profile_list_view (user_id, profile_type_id, name, data, position, view_type, is_default, created_by)
      select
        u.id,
        ?,
        'ALL',
        jsonb_build_object(
          'columns', array_cat(array_agg(concat('field_', ptf.id) order by oa.custom_order), array['subscribers', 'createdAt']),
          'sort', null,
          'search', null,
          'status', null
        ),
        0,
        'ALL'::list_view_type,
        false,
        ?
      from "user" u
      join profile_type pt on pt.org_id = u.org_id
      join profile_type_field ptf on ptf.profile_type_id = pt.id
      join ordered_aliases oa on oa.alias = ptf.alias
      where u.org_id = ?
      and u.deleted_at is null
      and pt.id = ?
      and pt.deleted_at is null
      and ptf.deleted_at is null
      group by u.id;
    `,
      [
        this.sqlValues(
          columnFieldAliases.map((alias, i) => [alias, i]),
          ["text", "int"],
        ),
        profileTypeId,
        createdBy,
        orgId,
        profileTypeId,
      ],
      t,
    );
  }

  private async createDefaultProfileListViewsByOrgId(
    orgId: number,
    profileTypeId: number,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    await this.raw(
      /* sql */ `
      insert into profile_list_view (user_id, profile_type_id, name, data, position, view_type, is_default, created_by)
      select 
        u.id,
        ?,
        'ALL',
        jsonb_build_object(
          'columns', null,
          'sort', null,
          'search', null,
          'status', null
        ),
        0,
        'ALL'::list_view_type, 
        false,
        ?
      from "user" u 
      where u.org_id = ?
      and u.deleted_at is null;
    `,
      [profileTypeId, createdBy, orgId],
      t,
    );
  }

  async deleteProfileListViewsByProfileTypeId(
    profileTypeIds: number[],
    deletedBy: string,
    t?: Knex.Transaction,
  ) {
    await this.from("profile_list_view", t)
      .whereIn("profile_type_id", profileTypeIds)
      .whereNull("deleted_at")
      .update({
        deleted_at: this.now(),
        deleted_by: deletedBy,
      });
  }
}
