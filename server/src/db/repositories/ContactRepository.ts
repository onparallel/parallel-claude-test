import { inject, injectable } from "inversify";
import Knex from "knex";
import { MaybeArray } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike } from "../helpers/utils";
import { KNEX } from "../knex";
import { User, CreateContact } from "../__types";

@injectable()
export class ContactReposistory extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadOneById = this.buildLoadOneById("contact", "id", (q) =>
    q.whereNull("deleted_at")
  );

  async userHasAccessToContacts(userId: number, contactIds: number[]) {
    const [{ count }] = await this.from("contact")
      .where({
        owner_id: userId,
        deleted_at: null,
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
          deleted_at: null,
        })
        .modify((q) => {
          const { search, excludeIds } = opts;
          if (search) {
            q.andWhere((q2) => {
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

  async createContact(
    data: Omit<CreateContact, "owner_id" | "org_id">,
    user: User
  ) {
    const [row] = await this.insert("contact", {
      ...data,
      org_id: user.org_id,
      owner_id: user.id,
      created_by: `User:${user.id}`,
      updated_by: `User:${user.id}`,
    });
    return row;
  }

  async updateContact(
    contactId: number,
    data: Partial<CreateContact>,
    user: User
  ) {
    const [row] = await this.from("contact")
      .where("id", contactId)
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        },
        "*"
      );
    return row;
  }

  async deleteContactById(contactId: MaybeArray<number>, user: User) {
    return await this.from("contact")
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${user.id}`,
      })
      .whereIn("id", Array.isArray(contactId) ? contactId : [contactId]);
  }
}
