import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateUser, User } from "../__types";

@injectable()
export class UserReposistory extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadOneByCognitoId = this.buildLoadOneBy("user", "cognito_id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadOneById = this.buildLoadOneById("user", "id", (q) =>
    q.whereNull("deleted_at")
  );

  async updateUserById(id: number, data: Partial<CreateUser>, user: User) {
    const rows = await this.from("user")
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: `User:${user.id}`,
      })
      .where({ id })
      .returning("*");
    return rows[0];
  }
}
