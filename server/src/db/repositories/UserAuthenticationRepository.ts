import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { isDefined } from "remeda";
import { hash, random } from "../../util/token";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { User } from "../__types";

@injectable()
export class UserAuthenticationRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  async getUserFromUat(token: string) {
    const tokenHash = await hash(token, "");
    return await this.withTransaction(async (t) => {
      const [uat] = await this.from("user_authentication_token", t)
        .where({
          deleted_at: null,
          token_hash: tokenHash,
        })
        .update({ last_used_at: this.now() })
        .returning("*");

      if (!uat) return null;

      const [user] = await this.from("user", t)
        .where({ deleted_at: null, id: uat.user_id })
        .select();

      if (!user) {
        await t.rollback();
        return null;
      }

      if (!isDefined(uat.token_hint)) {
        await this.from("user_authentication_token", t)
          .where("id", uat.id)
          .update({ token_hint: token.slice(0, 5) });
      }

      return user;
    });
  }

  async userHasAccessToAuthTokens(ids: number[], userId: number) {
    const [{ count }] = await this.from("user_authentication_token")
      .whereIn("id", ids)
      .where({
        user_id: userId,
        deleted_at: null,
      })
      .select<{ count: number }[]>(this.count());

    return count === new Set(ids).size;
  }

  readonly loadUserAuthenticationByTokenHash = this.buildLoadBy(
    "user_authentication_token",
    "token_hash",
    (q) => q.whereNull("deleted_at")
  );

  readonly loadUserAuthenticationTokens = this.buildLoadMultipleBy(
    "user_authentication_token",
    "user_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at", "asc")
  );

  async createUserAuthenticationToken(tokenName: string, user: User) {
    const apiKey = random(32);
    const [userAuthToken] = await this.insert("user_authentication_token", {
      token_name: tokenName,
      token_hash: await hash(apiKey, ""),
      token_hint: apiKey.slice(0, 5),
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
