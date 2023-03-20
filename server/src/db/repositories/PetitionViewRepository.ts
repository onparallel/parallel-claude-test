import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { Maybe } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreatePetitionListView, PetitionListView, User } from "../__types";

@injectable()
export class PetitionViewRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadPetitionListView = this.buildLoadBy("petition_list_view", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadPetitionListViewsByUserId = this.buildLoadMultipleBy(
    "petition_list_view",
    "user_id",
    (q) => q.whereNull("deleted_at").orderBy("position", "asc")
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
        [tagId]
      )
      .select("*");
  }

  async createPetitionListView(data: CreatePetitionListView, createdBy: string) {
    const [view] = await this.from("petition_list_view").insert(
      { ...data, created_by: createdBy },
      "*"
    );
    return view;
  }

  async updatePetitionListView(
    id: number,
    data: Partial<PetitionListView>,
    user: User,
    t?: Knex.Transaction
  ) {
    const [view] = await this.from("petition_list_view", t)
      .where({ id, deleted_at: null, user_id: user.id })
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        },
        "*"
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
        t
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
          [id, id]
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
          ["int", "int"]
        ),
        userId,
      ]
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
}
