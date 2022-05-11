import { inject } from "inversify";
import { Knex } from "knex";
import { isDefined } from "remeda";
import { random } from "../../util/token";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateLicenseCode } from "../__types";

export class LicenseCodeRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadLicenseCode = this.buildLoadBy("license_code", "code");

  async createLicenseCode(source: string, details: any, createdBy: string) {
    if (source === "AppSumo" && isDefined(details.uuid)) {
      // for AppSumo licenses, we have to make sure there is no other license with same UUID that has already been redeemed
      const matches = await this.raw(
        /* sql */ `
        select * from "license_code" where "source" = 'AppSumo' and "details"->>'uuid' = ? and "status" = 'REDEEMED';
      `,
        [details.uuid]
      );
      if (matches.length > 0) {
        throw new Error();
      }
    }
    const [license] = await this.from("license_code")
      .insert({
        code: random(32),
        details,
        source,
        created_at: this.now(),
        created_by: createdBy,
      })
      .returning("*");
    return license;
  }

  async updateLicenseCode(
    id: number,
    data: Partial<CreateLicenseCode>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const [license] = await this.from("license_code", t)
      .where("id", id)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .returning("*");

    return license;
  }
}
