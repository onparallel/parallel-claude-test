import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateFileUpload, CreateTemporaryFile } from "../__types";

@injectable()
export class FileRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadFileUpload = this.buildLoadById("file_upload", "id", (q) =>
    q.whereNull("deleted_at")
  );

  async createFileUpload(data: CreateFileUpload, createdBy: string) {
    const rows = await this.insert("file_upload", {
      ...data,
      created_by: createdBy,
      updated_by: createdBy,
    }).returning("*");
    return rows[0];
  }

  async markFileUploadComplete(id: number) {
    await this.from("file_upload")
      .update({ upload_complete: true }, "*")
      .where("id", id);
  }

  async deleteFileUpload(id: number, deletedBy: string) {
    await this.from("file_upload")
      .update(
        {
          deleted_at: this.now(),
          deleted_by: deletedBy,
        },
        "*"
      )
      .where("id", id);
  }

  readonly loadTemporaryFile = this.buildLoadById("temporary_file", "id");

  async createTemporaryFile(data: CreateTemporaryFile, createdBy: string) {
    const rows = await this.insert("temporary_file", {
      ...data,
      created_by: createdBy,
    }).returning("*");
    return rows[0];
  }
}
