import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateEmailEvent, CreateEmailLog, EmailLog, TemporaryFile } from "../__types";

@injectable()
export class EmailLogRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadEmailLog = this.buildLoadBy("email_log", "id");

  async createEmail(data: CreateEmailLog) {
    const rows = await this.insert("email_log", data).returning("*");
    return rows[0];
  }

  async addEmailAttachments(emailLogId: number, temporaryFileIds: MaybeArray<number>) {
    if (Array.isArray(temporaryFileIds) && temporaryFileIds.length === 0) {
      return;
    }
    await this.insert(
      "email_attachment",
      unMaybeArray(temporaryFileIds).map((temporaryFileId) => ({
        email_log_id: emailLogId,
        temporary_file_id: temporaryFileId,
      }))
    );
  }

  async getEmailAttachments(emailLogId: number) {
    const { rows } = await this.knex.raw<{ rows: TemporaryFile[] }>(
      /* sql */ `
        select tf.* from temporary_file as tf
        join email_attachment as ea on ea.temporary_file_id = tf.id
        where ea.email_log_id = ?
      `,
      [emailLogId]
    );
    return rows;
  }

  async updateWithResponse(id: number, data: Partial<EmailLog>) {
    return await this.from("email_log")
      .update(
        {
          ...data,
          sent_at: this.now(),
        },
        "*"
      )
      .where("id", id);
  }

  async findInternalId(externalId: string) {
    const [entry] = await this.from("email_log").where("external_id", externalId).select("id");
    return entry ? entry.id : null;
  }

  async createEmailEvent(data: CreateEmailEvent) {
    return await this.insert("email_event", data);
  }

  readonly loadEmailEvents = this.buildLoadMultipleBy("email_event", "email_log_id", (q) =>
    q.orderBy("created_at")
  );
}
