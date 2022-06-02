import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import {
  CreateFileUpload,
  CreatePublicFileUpload,
  CreateTemporaryFile,
  FileUpload,
  PublicFileUpload,
} from "../__types";

@injectable()
export class FileRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadFileUpload = this.buildLoadBy("file_upload", "id", (q) => q.whereNull("deleted_at"));
  readonly loadFileUploadsByPath = this.buildLoadMultipleBy("file_upload", "path", (q) =>
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

  async cloneFileUpload(id: number, t?: Knex.Transaction) {
    const [file] = await this.raw<FileUpload>(
      /* sql */ `
      insert into file_upload(path, filename, size, content_type, upload_complete, created_at, created_by, updated_at, updated_by)
      select path, filename, size, content_type, upload_complete, created_at, created_by, updated_at, updated_by
      from file_upload where id = ?
      returning *
      `,
      [id],
      t
    );
    return file;
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

  /** gets deleted file_upload's whose paths are not repeated on another not deleted file_upload */
  async getFileUploadsToDelete() {
    return await this.raw<FileUpload>(/* sql */ `
      select fu.* from file_upload fu
      left join file_upload fu2 on fu.path = fu2.path and fu2.deleted_at is null and fu2.file_deleted_at is null
      where fu.deleted_at is not null and fu.file_deleted_at is null
        and fu2.id is null
    `);
  }

  async updateFileUpload(id: MaybeArray<number>, data: Partial<FileUpload>, updatedBy: string) {
    const ids = unMaybeArray(id);
    if (ids.length === 0) {
      return [];
    }
    return await this.from("file_upload")
      .whereIn("id", ids)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .returning("*");
  }

  async deleteFileUpload(id: MaybeArray<number>, deletedBy?: string, t?: Knex.Transaction) {
    const ids = unMaybeArray(id);
    if (ids.length > 0) {
      await this.from("file_upload", t)
        .update(
          {
            deleted_at: this.now(),
            deleted_by: deletedBy,
          },
          "*"
        )
        .whereIn("id", ids);
    }
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
