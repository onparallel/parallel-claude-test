import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import {
  CreateFileUpload,
  CreatePublicFileUpload,
  CreateTemporaryFile,
  PublicFileUpload,
} from "../__types";

@injectable()
export class FileRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadFileUpload = this.buildLoadBy("file_upload", "id", (q) => q.whereNull("deleted_at"));

  async createFileUpload(data: CreateFileUpload, createdBy: string) {
    const rows = await this.insert("file_upload", {
      ...data,
      created_by: createdBy,
      updated_by: createdBy,
    }).returning("*");
    return rows[0];
  }

  async markFileUploadComplete(id: number, updatedBy: string) {
    await this.from("file_upload")
      .update(
        {
          upload_complete: true,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*"
      )
      .where({ id: id, upload_complete: false });
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

  readonly loadTemporaryFile = this.buildLoadBy("temporary_file", "id");

  async createTemporaryFile(data: CreateTemporaryFile, createdBy: string) {
    const rows = await this.insert("temporary_file", {
      ...data,
      created_by: createdBy,
    }).returning("*");
    return rows[0];
  }

  readonly loadPublicFile = this.buildLoadBy("public_file_upload", "id", (q) =>
    q.whereNull("deleted_at")
  );

  async createPublicFile(data: CreatePublicFileUpload, createdBy?: string, t?: Knex.Transaction) {
    const rows = await this.insert(
      "public_file_upload",
      {
        ...data,
        created_by: createdBy,
        updated_by: createdBy,
      },
      t
    ).returning("*");

    return rows[0];
  }

  async updatePublicFile(
    publicFileId: number,
    data: Partial<PublicFileUpload>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const [row] = await this.from("public_file_upload", t)
      .where("id", publicFileId)
      .update({
        ...data,
        updated_by: updatedBy,
        updated_at: this.now(),
      })
      .returning("*");

    return row;
  }
}
