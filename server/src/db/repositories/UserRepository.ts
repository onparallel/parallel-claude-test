import { inject, injectable } from "inversify";
import Knex from "knex";
import { KNEX } from "../knex";
import { User } from "../__types";
import { indexBy } from "remeda";
import DataLoader from "dataloader";
import { fromDataLoader } from "../../util/fromDataLoader";
import { BaseRepository } from "../helpers/BaseRepository";

@injectable()
export class UserReposistory extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadOneByCognitoId = fromDataLoader(
    new DataLoader<string, User | null>(async ids => {
      const rows = await this.from("user")
        .whereIn("cognito_id", ids as string[])
        .where("deleted_at", null)
        .select("*");
      const byIds = indexBy(rows, r => r.cognito_id);
      return ids.map(id => byIds[id] ?? null);
    })
  );

  async updateUserById(
    id: number,
    data: Partial<User> & { updated_by: string }
  ) {
    const rows = await this.from("user")
      .update({
        ...data,
        updated_at: new Date()
      })
      .where({ id })
      .returning("*");
    return rows[0];
  }
}
