import { inject, injectable } from "inversify";
import Knex from "knex";
import { hash, random } from "../../util/token";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import { User, UserAuthenticationToken } from "../__types";

@injectable()
export class UserAuthenticationRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  async validateApiKey(apiKey: string) {
    const tokenHash = await hash(apiKey, "");
    return await this.withTransaction(async (t) => {
      const [userId] = await this.from("user_authentication_token", t)
        .where({
          deleted_at: null,
          token_hash: tokenHash,
        })
        .update({ last_used_at: this.now() })
        .returning("user_id");

      if (!userId) return null;

      const [user] = await this.from("user")
        .where({ deleted_at: null, id: userId })
        .select();

      if (!user) {
        await t.rollback();
        return null;
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
      .select(this.count());

    return count === new Set(ids).size;
  }

  async loadUserAuthenticationTokens(
    userId: number,
    opts: {
      search?: string | null;
      sortBy?: SortBy<keyof UserAuthenticationToken>[];
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("user_authentication_token")
        .where({
          user_id: userId,
          deleted_at: null,
        })
        .mmodify((q) => {
          const { search, sortBy } = opts;
          if (search) {
            q.whereIlike("token_name", `%${escapeLike(search, "\\")}%`, "\\");
          }
          if (sortBy) {
            q.orderByRaw(
              sortBy
                .map((s) => {
                  // nullable column
                  if (["last_used_at"].includes(s.column)) {
                    return `${s.column} ${s.order} NULLS ${
                      s.order === "asc" ? "FIRST" : "LAST"
                    }`;
                  } else {
                    return `${s.column} ${s.order}`;
                  }
                })
                .join(", ")
            );
          }
        })
        .orderBy("id")
        .select("*"),
      opts
    );
  }

  async createUserAuthenticationToken(tokenName: string, user: User) {
    const apiKey = random(32);
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
