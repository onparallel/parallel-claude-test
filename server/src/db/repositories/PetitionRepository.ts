import { inject, injectable } from "inversify";
import Knex from "knex";
import { KNEX } from "../knex";
import {
  Petition,
  PetitionField,
  PetitionFieldReply,
  PetitionStatus,
  PetitionAccess
} from "../__types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike } from "../helpers/utils";
import { fromDataLoader } from "../../util/fromDataLoader";
import DataLoader from "dataloader";
import { indexBy, sortBy, groupBy } from "remeda";
import { count } from "../../util/remedaExtensions";

@injectable()
export class PetitionRepository extends BaseRepository<Petition, "id"> {
  constructor(@inject(KNEX) knex: Knex) {
    super("petition", "id", knex);
  }

  async loadPetitionsForUser(
    userId: number,
    opts: {
      search?: string | null;
      status?: PetitionStatus | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.petitions
        .where({
          owner_id: userId,
          is_template: false,
          deleted_at: null
        })
        .modify(q => {
          if (opts.search) {
            q.whereIlike("name", `%${escapeLike(opts.search, "\\")}%`, "\\");
          }
          if (opts.status) {
            q.where("status", opts.status);
          }
          q.orderBy("id");
        }),
      opts
    );
  }

  readonly loadFieldsForPetition = fromDataLoader(
    new DataLoader<number, PetitionField[]>(async ids => {
      const rows = await this.petitionFields
        .whereIn("petition_id", ids as number[])
        .whereNull("deleted_at")
        .select("*");
      const byPetitionId = groupBy(rows, r => r.petition_id);
      return ids.map(id => {
        return sortBy(byPetitionId[<any>id] || [], p => p.position);
      });
    })
  );

  readonly loadFieldCountForPetition = fromDataLoader(
    new DataLoader<number, number>(async ids => {
      const rows = await this.petitionFields
        .whereIn("petition_id", ids as number[])
        .whereNull("deleted_at")
        .groupBy("petition_id")
        .select(
          "petition_id",
          this.knex.raw(`count(*)::integer as "count"`) as any
        );
      const byPetitionId = indexBy(rows, r => r.petition_id);
      return ids.map(id => byPetitionId[id]?.count ?? 0);
    })
  );

  readonly loadStatusForPetition = fromDataLoader(
    new DataLoader<
      number,
      {
        validated: number;
        replied: number;
        optional: number;
        total: number;
      }
    >(async ids => {
      const fields: (Pick<
        PetitionField,
        "id" | "petition_id" | "validated" | "optional"
      > & { replies: number })[] = await this.knex<PetitionField>(
        "petition_field as pf"
      )
        .leftJoin<PetitionFieldReply>(
          "petition_field_reply as pfr",
          function() {
            this.on("pf.id", "pfr.petition_field_id").andOnNull(
              "pfr.deleted_at"
            );
          }
        )
        .whereIn("pf.petition_id", ids as number[])
        .whereNull("pf.deleted_at")
        .groupBy("pf.id", "pf.petition_id", "pf.validated", "pf.optional")
        .select(
          "pf.id",
          "pf.petition_id",
          "pf.validated",
          "pf.optional",
          this.knex.raw(`count("pfr"."id")::integer as "replies"`) as any
        );

      const fieldsById = groupBy(fields, f => f.petition_id);
      return ids.map(id => {
        const fields = fieldsById[id] ?? [];
        return {
          validated: count(fields, f => f.validated),
          replied: count(fields, f => f.replies > 0 && !f.validated),
          optional: count(
            fields,
            f => f.optional && f.replies === 0 && !f.validated
          ),
          total: fields.length
        };
      });
    })
  );

  readonly loadAccessesForPetition = fromDataLoader(
    new DataLoader<number, PetitionAccess[]>(async ids => {
      const rows = await this.petitionAccesses
        .whereIn("petition_id", ids as number[])
        .whereNull("deleted_at")
        .select("*");
      const byPetitionId = groupBy(rows, r => r.petition_id);
      return ids.map(id => byPetitionId[<any>id] || []);
    })
  );
}
