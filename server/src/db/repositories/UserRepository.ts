import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, indexBy } from "remeda";
import { CONFIG, Config } from "../../config";
import { unMaybeArray } from "../../util/arrays";
import { fromDataLoader } from "../../util/fromDataLoader";
import { Maybe, MaybeArray } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { escapeLike } from "../helpers/utils";
import { KNEX } from "../knex";
import { CreateUser, CreateUserData, User, UserData, UserGroup } from "../__types";
import { SystemRepository } from "./SystemRepository";

@injectable()
export class UserRepository extends BaseRepository {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(KNEX) knex: Knex,
    private system: SystemRepository
  ) {
    super(knex);
  }

  readonly loadUsersByCognitoId = fromDataLoader(
    new DataLoader<string, (User | null)[]>(async (cognitoIds) => {
      const userDatas = await this.from("user_data")
        .whereIn("cognito_id", cognitoIds)
        .whereNull("deleted_at")
        .select("*");

      const rows = await this.from("user")
        .update({ last_active_at: this.now() })
        .whereIn(
          "user_data_id",
          userDatas.map((data) => data.id)
        )
        .whereNull("deleted_at")
        .returning("*");

      const byUserDataId = groupBy(rows, (r) => r.user_data_id);
      return cognitoIds.map((cognitoId) => {
        const userData = userDatas.find((ud) => ud.cognito_id === cognitoId);
        return userData ? byUserDataId[userData.id] : [null];
      });
    })
  );

  readonly loadUser = this.buildLoadBy("user", "id", (q) => q.whereNull("deleted_at"));

  readonly loadUserData = this.buildLoadBy("user_data", "id", (q) => q.whereNull("deleted_at"));

  readonly loadUserDataByUserId = fromDataLoader(
    new DataLoader<number, Maybe<UserData>>(async (ids) => {
      const users = await this.raw<UserData>(
        /* sql */ `
        select ud.* from "user" u join "user_data" ud on u.user_data_id = ud.id
        where u.id in (${ids.map(() => "?").join(",")})
        and u.deleted_at is null and ud.deleted_at is null
      `,
        ids
      );

      const byUserId = indexBy(users, (u) => u.id);
      return ids.map((id) => byUserId[id]);
    })
  );

  readonly loadUserByExternalId = fromDataLoader(
    new DataLoader<{ orgId: number; externalId: string }, Maybe<User>>(async (args) => {
      const users = await this.raw<User>(
        /* sql */ `
          select u.* from "user"
          where (${args.map(() => "(org_id = ? and external_id = ?)").join(" or ")})
            and u.deleted_at is null
            and ud.deleted_at is null;          
        `,
        [...args.flatMap(({ orgId, externalId }) => [orgId, externalId])]
      );

      return args.map(
        (arg) =>
          users.find((u) => u.org_id === arg.orgId && u.external_id === arg.externalId) ?? null
      );
    })
  );

  readonly loadUsersByEmail = fromDataLoader(
    new DataLoader<string, (User | null)[]>(async (emails) => {
      const userDatas = await this.from("user_data")
        .whereIn("email", emails)
        .whereNull("deleted_at")
        .select("*");

      const rows = await this.from("user")
        .whereIn(
          "user_data_id",
          userDatas.map((data) => data.id)
        )
        .whereNull("deleted_at")
        .returning("*");

      const byUserDataId = groupBy(rows, (r) => r.user_data_id);
      return emails.map((email) => {
        const userData = userDatas.find((ud) => ud.email === email);
        return userData ? byUserDataId[userData.id] : [null];
      });
    })
  );

  async updateUserData(
    id: MaybeArray<number>,
    data: Partial<CreateUserData>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const ids = unMaybeArray(id);
    if (ids.length === 0) return [];

    for (const userId of ids) {
      // make sure user data is up to date when calling it from User and PublicUser gql objects
      this.loadUserData.dataloader.clear(userId);
    }

    return await this.from("user_data", t)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .whereIn("id", ids)
      .returning("*");
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
  ): Promise<User | null> {
    const [user] = await this.from("user", t)
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
    return user;
  }

  async updateUserDataByExternalId(
    externalId: string,
    orgId: number,
    data: Pick<CreateUserData, "first_name" | "last_name">,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const bindings = [data.first_name, data.last_name, orgId, externalId].filter(
      (v) => v !== undefined
    ) as Knex.RawBinding[];

    const [userData] = await this.raw<UserData>(
      /* sql */ `
      update "user_data" ud
      set 
        first_name = ?,
        last_name = ?
      from "user" u 
      where u.user_data_id = ud.id
        and u.org_id = ?
        and u.external_id = ? 
        and u.deleted_at is null
        and ud.deleted_at is null
      returning *;
    `,
      bindings
    );

    return userData;
  }

  async loadOrCreateUserData(data: CreateUserData, createdBy?: string, t?: Knex.Transaction) {
    const [userData] = await this.raw<UserData>(
      /* sql */ `
      ? 
      ON CONFLICT (email) WHERE deleted_at is NULL
      DO UPDATE SET
        -- need to do an update for the RETURNING to return the row
        email=EXCLUDED.email
      RETURNING *;`,
      [
        this.from("user_data").insert({
          ...data,
          created_by: createdBy,
          updated_by: createdBy,
        }),
      ],
      t
    );
    return userData;
  }

  async createUser(
    data: Omit<CreateUser, "user_data_id">,
    userData: CreateUserData,
    createdBy?: string,
    t?: Knex.Transaction
  ) {
    const _userData = await this.loadOrCreateUserData(userData, createdBy, t);
    const [user] = await this.insert(
      "user",
      {
        ...data,
        user_data_id: _userData.id,
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

  readonly loadAvatarUrlByUserDataId = fromDataLoader(
    new DataLoader<number, Maybe<string>>(async (userDataIds) => {
      const results = await this.raw<{ id: number; path: string }>(
        /* sql */ `
        select ud.id, pfu.path from "user_data" ud
          join public_file_upload pfu on ud.avatar_public_file_id = pfu.id
          where ud.id in ?
      `,
        [this.sqlIn(userDataIds)]
      );
      const resultsById = indexBy(results, (x) => x.id);
      return userDataIds.map((id) =>
        resultsById[id] ? `${this.config.misc.uploadsUrl}/${resultsById[id].path}` : null
      );
    })
  );
}
