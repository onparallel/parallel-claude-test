import { inject, injectable } from "inversify";
import { Knex } from "knex";
import pMap from "p-map";
import { chunk, indexBy, omit } from "remeda";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { PetitionAccess, PetitionField, PetitionFieldType } from "../__types";

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
    const petitions = (
      await pMap(
        chunk(petitionIds, 100),
        async (batch) => {
          const [petitions, fields, accesses, petitionOwners] =
            await Promise.all([
              this.from("petition")
                .whereIn("id", batch)
                .select(
                  "id",
                  "name",
                  "status",
                  "created_at",
                  "updated_at",
                  "created_by"
                ),
              this.from("petition_field")
                .whereIn("petition_id", batch)
                .whereNull("deleted_at")
                .groupBy("petition_id")
                .select(
                  "petition_id",
                  ...(
                    [
                      "TEXT",
                      "SHORT_TEXT",
                      "FILE_UPLOAD",
                      "SELECT",
                      "DYNAMIC_SELECT",
                      "HEADING",
                    ] as PetitionFieldType[]
                  ).map((type) =>
                    this.knex.raw(
                      `(count(*) filter (where type = ?))::int as ??`,
                      [type, `${type.toLowerCase()}_fields`]
                    )
                  )
                ),
              this.from("petition_access")
                .whereIn("petition_id", batch)
                .groupBy("petition_id")
                .select(
                  "petition_id",
                  this.knex.raw("min(created_at) as sent_at")
                ),
              this.from("petition_permission")
                .whereIn("petition_id", batch)
                .where({
                  deleted_at: null,
                  type: "OWNER",
                })
                .select("user_id as owner_id", "petition_id"),
            ]);
          const fieldsByPetitionId = indexBy(
            fields as unknown as (Pick<PetitionField, "petition_id"> & {
              text_fields: number;
              file_upload_fields: number;
            })[],
            (f) => f.petition_id
          );
          const accessesByPetitionId = indexBy(
            accesses as unknown as (Pick<PetitionAccess, "petition_id"> & {
              sent_at: Date;
            })[],
            (f) => f.petition_id
          );
          const ownersByPetitionId = indexBy(
            petitionOwners as { owner_id: number; petition_id: number }[],
            (f) => f.petition_id
          );
          return petitions.map((petition) => ({
            ...omit(petition, ["updated_at"]),
            completed_at:
              petition.status === "COMPLETED" ? petition.updated_at : null,
            ...omit(fieldsByPetitionId?.[petition.id] ?? {}, ["petition_id"]),
            ...omit(accessesByPetitionId?.[petition.id] ?? {}, ["petition_id"]),
            ...omit(ownersByPetitionId?.[petition.id] ?? {}, ["petition_id"]),
          }));
        },
        { concurrency: 1 }
      )
    ).flat();
    return { organizations, users, petitions };
  }
}
