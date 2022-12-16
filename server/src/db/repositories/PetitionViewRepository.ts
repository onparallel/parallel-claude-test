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

  async createPetitionListView(data: CreatePetitionListView, createdBy: string) {
    const [view] = await this.from("petition_list_view").insert(
      { ...data, created_by: createdBy },
      "*"
    );
    return view;
  }

  async updatePetitionListView(id: number, data: Partial<PetitionListView>, user: User) {
    const [view] = await this.from("petition_list_view")
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
