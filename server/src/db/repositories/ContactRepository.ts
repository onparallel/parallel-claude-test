import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { escapeLike } from "../helpers/utils";

@injectable()
export class ContactReposistory extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadOneById = this.buildLoadOneById("contact", "id", q =>
    q.whereNull("deleted_at")
  );

  async userHasAccessToContacts(userId: number, contactIds: number[]) {
    const [{ count }] = await this.from("contact")
      .where({
        owner_id: userId,
        deleted_at: null
      })
      .whereIn("id", contactIds)
      .select(this.count());
    return count === new Set(contactIds).size;
  }

  async loadContactsForUser(
    userId: number,
    opts: {
      search?: string | null;
      excludeIds?: number[] | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("contact")
        .where({
          owner_id: userId,
          deleted_at: null
        })
        .modify(q => {
          const { search, excludeIds } = opts;
          if (search) {
            q.andWhere(q2 => {
              q2.whereIlike(
                this.knex.raw(`concat("first_name", ' ', "last_name")`) as any,
                `%${escapeLike(search, "\\")}%`,
                "\\"
              ).or.whereIlike("email", `%${escapeLike(search, "\\")}%`, "\\");
            });
          }
          if (excludeIds) {
            q.whereNotIn("id", excludeIds);
          }
          q.orderBy("id");
        }),
      opts
    );
  }
}
