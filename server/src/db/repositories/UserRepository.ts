import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateUser, User } from "../__types";
import { fromDataLoader } from "../../util/fromDataLoader";
import DataLoader from "dataloader";
import { indexBy } from "remeda";

@injectable()
export class UserRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadSessionUser = fromDataLoader(
    new DataLoader<string, User>(async (cognitoIds) => {
      const rows = await this.from("user")
        .update({ last_active_at: this.now() })
        .whereIn("cognito_id", cognitoIds)
        .whereNull("deleted_at")
        .returning("*");
      const byCognitoId = indexBy(rows, (r) => r.cognito_id);
      return cognitoIds.map((cognitoId) => byCognitoId[cognitoId]);
    })
  );

  readonly loadUsers = fromDataLoader(
    new DataLoader<number, User>(async (ids) => {
      return await this.from("user")
        .whereIn("id", ids)
        .whereNull("deleted_at")
        .returning("*");
    })
  );

  readonly loadUser = this.buildLoadById("user", "id", (q) =>
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

  async updateUserOnboardingStatus(
    key: string,
    value: "FINISHED" | "SKIPPED",
    user: User
  ) {
    if (!/^\w+$/.test(key)) {
      throw new Error("Invalid onboarding key");
    }
    const rows = await this.from("user")
      .update({
        onboarding_status: this.knex.raw(
          `jsonb_set("onboarding_status", '{${key}}', '{"${value}": true}')`
        ),
        updated_at: this.now(),
        updated_by: `User:${user.id}`,
      })
      .where("id", user.id)
      .returning("*");
    return rows[0];
  }
}
