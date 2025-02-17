import { inject } from "inversify";
import { Knex } from "knex";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { CreatePetitionCommentAttachment } from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

// TODO: move every comment-related method from PetitionRepository to here
export class PetitionCommentRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadPetitionCommentAttachment = this.buildLoadBy(
    "petition_comment_attachment",
    "id",
    (q) => q.whereNull("deleted_at"),
  );

  readonly loadPetitionCommentAttachmentsByCommentId = this.buildLoadMultipleBy(
    "petition_comment_attachment",
    "petition_comment_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at", "asc"),
  );

  async createPetitionCommentAttachment(
    data: MaybeArray<CreatePetitionCommentAttachment>,
    createdBy: string,
  ) {
    const dataArr = unMaybeArray(data);
    if (dataArr.length === 0) {
      return;
    }

    await this.from("petition_comment_attachment").insert(
      dataArr.map((data) => ({
        ...data,
        created_at: this.now(),
        created_by: createdBy,
      })),
    );
  }
}
