import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import Knex from "knex";
import { groupBy } from "remeda";
import { fromDataLoader } from "../../util/fromDataLoader";
import { hash, random } from "../../util/token";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { User, UserAuthenticationToken } from "../__types";

@injectable()
export class UserAuthenticationRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  async userHasAccessToAuthTokens(ids: number[], userId: number) {
    const [{ count }] = await this.from("user_authentication_token")
      .whereIn("id", ids)
      .where({
        user_id: userId,
        deleted_at: null,
      })
      .select(this.count());

    return count === new Set(ids).size;
  }

  readonly loadUserAuthenticationTokens = fromDataLoader(
    new DataLoader<number, UserAuthenticationToken[]>(async (userIds) => {
      const rows = await this.from("user_authentication_token")
        .whereNull("deleted_at")
        .whereIn("user_id", userIds)
        .select("*");

      const byUserId = groupBy(rows, (r) => r.user_id);
      return userIds.map((id) => byUserId[id] ?? []);
    })
  );

  async createUserAuthenticationToken(tokenName: string, user: User) {
    const apiKey = random(48);
    const [userAuthToken] = await this.insert("user_authentication_token", {
      token_name: tokenName,
      token_hash: await hash(apiKey, ""),
      user_id: user.id,
      created_by: `User:${user.id}`,
    });

    return { apiKey, userAuthToken };
  }

  async deleteUserAuthenticationTokens(ids: number[], user: User) {
    return await this.from("user_authentication_token")
      .whereIn("id", ids)
      .where({
        user_id: user.id,
        deleted_at: null,
      })
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${user.id}`,
      })
      .returning("*");
  }
}
