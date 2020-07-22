import { inject, injectable } from "inversify";
import Knex, { QueryBuilder } from "knex";
import { MaybeArray } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike } from "../helpers/utils";
import { KNEX } from "../knex";
import { CreateContact, User, Contact, PetitionAccess } from "../__types";
import { unMaybeArray } from "../../util/arrays";

@injectable()
export class ContactRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadContact = this.buildLoadById("contact", "id", (q) =>
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
      sortBy?: {
        column: keyof Contact | QueryBuilder;
        order?: "asc" | "desc";
      }[];
      excludeIds?: number[] | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("contact")
        .where({
          owner_id: userId,
          deleted_at: null,
        })
        .mmodify((q) => {
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
          q.orderBy(opts.sortBy ?? ["id"]);
        })
        .select("*"),
      opts
    );
  }

  async loadAccessesForContact(contactId: number, opts: PageOpts) {
    return await this.loadPageAndCount(
      this.knex<PetitionAccess>("petition_access as pa")
        .join("petition as p", "p.id", "pa.petition_id")
        .where("pa.contact_id", contactId)
        .whereNull("p.deleted_at")
        .orderBy("pa.created_at", "desc")
        .select<any, PetitionAccess[]>(this.knex.raw("pa.*")),
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
    return await this.knex.transaction(async (t) => {
      await this.from("contact", t)
        .update({
          deleted_at: this.now(),
          deleted_by: `User:${user.id}`,
        })
        .whereIn("id", unMaybeArray(contactId));

      await this.from("petition_access", t)
        .update({
          status: "INACTIVE",
        })
        .whereIn("contact_id", unMaybeArray(contactId));
    });
  }

  async getOrCreateContacts(emails: string[], user: User) {
    await this.knex.raw(
      /* sql */ `
      insert into contact (email, org_id, owner_id, created_by)
        values ${emails.map(() => `(?, ?, ?, ?)`).join(", ")}
        on conflict do nothing;
    `,
      emails.flatMap((email) => [
        email,
        user.org_id,
        user.id,
        `User:${user.id}`,
      ])
    );
    return await this.from("contact")
      .where("owner_id", user.id)
      .whereIn("email", emails)
      .whereNull("deleted_at")
      .select("*");
  }
}
