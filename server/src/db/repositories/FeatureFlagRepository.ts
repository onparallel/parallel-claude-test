import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import Knex from "knex";
import { indexBy, uniq } from "remeda";
import {
  fromDataLoader,
  FromDataLoaderOptions,
} from "../../util/fromDataLoader";
import { keyBuilder } from "../../util/keyBuilder";
import { MaybeArray } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { FeatureFlagName } from "../__types";

@injectable()
export class FeatureFlagRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  async userHasFeatureFlag(
    userId: number,
    featureFlag: FeatureFlagName,
    opts?: FromDataLoaderOptions
  ): Promise<boolean>;
  async userHasFeatureFlag(
    userId: number,
    featureFlags: FeatureFlagName[],
    opts?: FromDataLoaderOptions
  ): Promise<boolean[]>;
  async userHasFeatureFlag(
    userId: number,
    featureFlag: MaybeArray<FeatureFlagName>,
    opts?: FromDataLoaderOptions
  ): Promise<boolean | boolean[]> {
    return Array.isArray(featureFlag)
      ? ((await this._userHasFeatureFlag(
          featureFlag.map((featureFlag) => ({ userId, featureFlag })),
          opts
        )) as boolean[])
      : await this._userHasFeatureFlag({ userId, featureFlag }, opts);
  }

  private readonly _userHasFeatureFlag = fromDataLoader(
    new DataLoader<
      { userId: number; featureFlag: FeatureFlagName },
      boolean,
      string
    >(
      async (keys) => {
        const userIds = uniq(keys.map((k) => k.userId));
        const featureFlags = uniq(keys.map((k) => k.featureFlag));
        const { rows } = await this.knex.raw<{
          rows: { user_id: number; feature_flag: number; value: boolean }[];
        }>(
          /* sql */ `
          with selected_user as (
            select id as user_id, org_id from "user"
              where id in (${userIds.map(() => "?").join(",")})
          )
          select
            su.user_id as user_id,
            ff.name as feature_flag,
            coalesce(ffou.value, ffoo.value, ff.default_value) as value
          from selected_user su
            join feature_flag ff
              on ff.name in (${featureFlags.map(() => "?").join(",")})
            left join feature_flag_override ffoo
              on ffoo.feature_flag_name = ff.name and ffoo.org_id = su.org_id and ffoo.user_id is null
            left join feature_flag_override ffou
              on ffou.feature_flag_name = ff.name and ffou.user_id = su.user_id and ffou.org_id is null
        `,
          [...userIds, ...featureFlags]
        );
        const results = indexBy(rows, keyBuilder(["user_id", "feature_flag"]));
        return keys
          .map(keyBuilder(["userId", "featureFlag"]))
          .map((key) => results[key]?.value ?? false);
      },
      {
        cacheKeyFn: keyBuilder(["userId", "featureFlag"]),
      }
    )
  );
}
