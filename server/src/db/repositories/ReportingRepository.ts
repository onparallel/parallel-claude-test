import async from "async";
import { inject, injectable } from "inversify";
import Knex from "knex";
import { chunk, indexBy, omit } from "remeda";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { Petition, PetitionAccess, PetitionField } from "../__types";

@injectable()
export class ReportingRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  async loadReportingData() {
    const organizations = await this.from("organization").select(
      "id",
      "name",
      "identifier",
      "status"
    );
    const users = await this.from("user").select(
      "id",
      "email",
      "first_name",
      "last_name",
      "org_id",
      "created_at",
      "last_active_at"
    );
    const petitionIds = (
      await this.from("petition").whereNull("deleted_at").select("id")
    ).map((r) => r.id);
    const petitions = await ((async.concatSeries(
      chunk(petitionIds, 100),
      async (batch) => {
        const [petitions, fields, accesses] = await Promise.all([
          this.from("petition")
            .whereIn("id", batch)
            .select(
              "id",
              "owner_id",
              "name",
              "status",
              "created_at",
              "updated_at"
            ),
          this.from("petition_field")
            .whereIn("petition_id", batch)
            .whereNull("deleted_at")
            .groupBy("petition_id")
            .select(
              "petition_id",
              ...["TEXT", "FILE_UPLOAD", "HEADING"].map((type) =>
                this.knex.raw(
                  `sum((type = '${type}')::int)::int as ${type.toLowerCase()}_fields`
                )
              )
            ),
          this.from("petition_access")
            .whereIn("petition_id", batch)
            .groupBy("petition_id")
            .select("petition_id", this.knex.raw("min(created_at) as sent_at")),
        ]);
        const fieldsByPetitionId = indexBy(
          (fields as unknown) as (Pick<PetitionField, "petition_id"> & {
            text_fields: number;
            file_upload_fields: number;
          })[],
          (f) => f.petition_id
        );
        const accessesByPetitionId = indexBy(
          (accesses as unknown) as (Pick<PetitionAccess, "petition_id"> & {
            sent_at: Date;
          })[],
          (f) => f.petition_id
        );
        return petitions.map((petition) => ({
          ...omit(petition, ["updated_at"]),
          completed_at:
            petition.status === "COMPLETED" ? petition.updated_at : null,
          ...omit(fieldsByPetitionId?.[petition.id] ?? {}, ["petition_id"]),
          ...omit(accessesByPetitionId?.[petition.id] ?? {}, ["petition_id"]),
        }));
      }
    ) as unknown) as Promise<
      (Pick<Petition, "id" | "owner_id" | "name" | "status" | "created_at"> & {
        sent_at: Date | null;
        completed_at: Date | null;
      })[]
    >);
    return { organizations, users, petitions };
  }
}
