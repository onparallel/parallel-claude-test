import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateFileUpload, Contact } from "../__types";

@injectable()
export class FileUploadRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadOneById = this.buildLoadOneById("file_upload", "id", (q) =>
    q.whereNull("deleted_at")
  );

  async createFileUpload(data: CreateFileUpload, contact: Contact) {
    const rows = await this.insert("file_upload", {
      ...data,
      created_by: `Contact:${contact.id}`,
      updated_by: `Contact:${contact.id}`,
    }).returning("*");
    return rows[0];
  }

  async markFileUploadComplete(id: number) {
    await this.from("file_upload")
      .update({ upload_complete: true }, "*")
      .where("id", id);
  }

  async deleteFileUpload(id: number, contact: Contact) {
    await this.from("file_upload")
      .update(
        {
          deleted_at: this.now(),
          deleted_by: `Contact:${contact.id}`,
        },
        "*"
      )
      .where("id", id);
  }
}
