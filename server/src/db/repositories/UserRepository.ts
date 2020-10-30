import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateUser, User } from "../__types";
import { fromDataLoader } from "../../util/fromDataLoader";
import DataLoader from "dataloader";
import { indexBy } from "remeda";
import { Maybe } from "../../util/types";

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

  async createUser(data: CreateUser, user: User) {
    const [row] = await this.insert("user", {
      ...data,
      created_by: `User:${user.id}`,
      updated_by: `User:${user.id}`,
    });
    return row;
  }

  async fetchSegmentUserTraits(user: User): Promise<UserTraits> {
    const {
      rows: [traits],
    } = await this.knex.raw<{
      rows: {
        last_petition_created_at: Date;
        last_petition_sent_at: Date;
        last_petition_completed_at: Date;
      }[];
    }>(
      /* sql */ `
      select 
        max(pu.created_at) as last_petition_created_at,
        max(pa.created_at) as last_petition_sent_at,
        max(pe.created_at) as last_petition_completed_at
      from 
        petition_user pu
        left join petition_access pa on pu.petition_id = pa.petition_id 
        left join petition_event pe on pu.petition_id = pe.petition_id and pe.type = 'PETITION_COMPLETED'
      where 
        pu.user_id = ?`,
      [user.id]
    );

    return {
      email: user.email,
      createdAt: user.created_at.toISOString(),
      lastActiveAt: user.last_active_at?.toISOString() ?? null,
      lastPetitionCreatedAt:
        traits.last_petition_created_at?.toISOString() ?? null,
      lastPetitionSentAt: traits.last_petition_sent_at?.toISOString() ?? null,
      lastPetitionCompletedAt:
        traits.last_petition_completed_at?.toISOString() ?? null,
    };
  }
}

type UserTraits = {
  email: string;
  createdAt: string;
  lastActiveAt: Maybe<string>;
  lastPetitionCreatedAt: Maybe<string>;
  lastPetitionSentAt: Maybe<string>;
  lastPetitionCompletedAt: Maybe<string>;
};
