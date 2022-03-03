import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { indexBy } from "remeda";
import { CONFIG, Config } from "../../config";
import { Aws, AWS_SERVICE } from "../../services/aws";
import { unMaybeArray } from "../../util/arrays";
import { fromDataLoader } from "../../util/fromDataLoader";
import { Maybe, MaybeArray } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { escapeLike } from "../helpers/utils";
import { KNEX } from "../knex";
import { CreateUser, User, UserGroup } from "../__types";
import { SystemRepository } from "./SystemRepository";

@injectable()
export class UserRepository extends BaseRepository {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(KNEX) knex: Knex,
    @inject(AWS_SERVICE) private aws: Aws,
    private system: SystemRepository
  ) {
    super(knex);
  }

  readonly loadUserByCognitoId = fromDataLoader(
    new DataLoader<string, User | null>(async (cognitoIds) => {
      const rows = await this.from("user")
        .update({ last_active_at: this.now() })
        .whereIn("cognito_id", cognitoIds)
        .whereNull("deleted_at")
        .returning("*");
      const byCognitoId = indexBy(rows, (r) => r.cognito_id);
      return cognitoIds.map((cognitoId) => byCognitoId[cognitoId]);
    })
  );

  readonly loadUser = this.buildLoadBy("user", "id", (q) => q.whereNull("deleted_at"));

  readonly loadUserByEmail = this.buildLoadBy("user", "email", (q) => q.whereNull("deleted_at"));

  async loadUserByExternalId({
    orgId,
    externalId,
  }: {
    orgId: number;
    externalId: string;
  }): Promise<User | undefined> {
    const [user] = await this.from("user")
      .where({
        deleted_at: null,
        external_id: externalId,
        org_id: orgId,
      })
      .returning("*");

    return user;
  }

  async updateUserById(
    id: MaybeArray<number>,
    data: Partial<CreateUser>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const ids = unMaybeArray(id);
    return await this.from("user", t)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .whereIn("id", ids)
      .returning("*");
  }

  async updateUserByExternalId(
    externalId: string,
    orgId: number,
    data: Partial<CreateUser>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    return await this.from("user", t)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .where({
        external_id: externalId,
        org_id: orgId,
        deleted_at: null,
      })
      .returning("*");
  }

  async updateUserOnboardingStatus(key: string, value: "FINISHED" | "SKIPPED", user: User) {
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

  async createUser(data: CreateUser, createdBy?: string, t?: Knex.Transaction) {
    const [user] = await this.insert(
      "user",
      {
        ...data,
        created_by: createdBy,
        updated_by: createdBy,
      },
      t
    );

    await this.system.createEvent(
      {
        type: "USER_CREATED",
        data: {
          user_id: user.id,
          from: createdBy ? "invitation" : "sign-up",
        },
      },
      t
    );

    return user;
  }

  async searchUsers(
    orgId: number,
    search: string,
    opts: {
      includeGroups: boolean;
      includeInactive: boolean;
      excludeUsers: number[];
      excludeUserGroups: number[];
    }
  ) {
    const [users, userGroups] = await Promise.all([
      this.from("user")
        .where({
          org_id: orgId,
          deleted_at: null,
          ...(opts.includeInactive ? {} : { status: "ACTIVE" }),
        })
        .mmodify((q) => {
          if (opts.excludeUsers.length > 0) {
            q.whereNotIn("id", opts.excludeUsers);
          }
          q.andWhere((q) => {
            q.whereEscapedILike(
              this.knex.raw(`concat("first_name", ' ', "last_name")`) as any,
              `%${escapeLike(search, "\\")}%`,
              "\\"
            ).or.whereEscapedILike("email", `%${escapeLike(search, "\\")}%`, "\\");
          });
        })
        .select<({ __type: "User" } & User)[]>("*", this.knex.raw(`'User' as __type`)),
      opts.includeGroups
        ? this.from("user_group")
            .where({
              org_id: orgId,
              deleted_at: null,
            })
            .mmodify((q) => {
              if (opts.excludeUserGroups.length > 0) {
                q.whereNotIn("id", opts.excludeUserGroups);
              }
            })
            .whereEscapedILike("name", `%${escapeLike(search, "\\")}%`, "\\")
            .select<({ __type: "UserGroup" } & UserGroup)[]>(
              "*",
              this.knex.raw(`'UserGroup' as __type`)
            )
        : undefined,
    ]);
    return [...(userGroups ?? []), ...users];
  }

  readonly loadAvatarUrl = fromDataLoader(
    new DataLoader<number, Maybe<string>>(async (userIds) => {
      const results = await this.raw<{ id: number; path: string }>(
        /* sql */ `
        select u.id, pfu.path from "user" u
          join public_file_upload pfu on u.avatar_public_file_id = pfu.id
          where u.id in (${userIds.map(() => "?").join(",")})
      `,
        [...userIds]
      );
      const resultsById = indexBy(results, (x) => x.id);
      return userIds.map((id) =>
        resultsById[id] ? `${this.config.misc.uploadsUrl}/${resultsById[id].path}` : null
      );
    })
  );
}
