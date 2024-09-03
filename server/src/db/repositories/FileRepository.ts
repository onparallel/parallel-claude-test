import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { zip } from "remeda";
import { ILogger, LOGGER } from "../../services/Logger";
import { unMaybeArray } from "../../util/arrays";
import { pMapChunk } from "../../util/promises/pMapChunk";
import { MaybeArray } from "../../util/types";
import {
  CreateFileUpload,
  CreatePublicFileUpload,
  CreateTemporaryFile,
  FileUpload,
  PublicFileUpload,
} from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

@injectable()
export class FileRepository extends BaseRepository {
  constructor(
    @inject(KNEX) knex: Knex,
    @inject(LOGGER) public logger: ILogger,
  ) {
    super(knex);
  }

  readonly loadFileUpload = this.buildLoadBy("file_upload", "id", (q) => q.whereNull("deleted_at"));
  readonly loadFileUploadsByPath = this.buildLoadMultipleBy("file_upload", "path", (q) =>
    q.whereNull("deleted_at"),
  );

  async createFileUpload(data: MaybeArray<CreateFileUpload>, createdBy: string) {
    const fileUploads = await this.insert(
      "file_upload",
      unMaybeArray(data).map((data) => ({
        ...data,
        created_by: createdBy,
        updated_by: createdBy,
      })),
    ).returning("*");
    // Tengo las sospecha de que los errores de 403 vengan de que el orden en que retornamos
    // esto no coincide con el orden de insercion
    if (
      !zip(fileUploads, unMaybeArray(data)).every(
        ([fu, d]) =>
          fu.content_type === d.content_type && fu.size === d.size && fu.filename === d.filename,
      )
    ) {
      this.logger.error(new Error("fileUpload order doesn't match insert data. should guarantee"));
    }
    return fileUploads;
  }

  async cloneFileUpload(id: MaybeArray<number>, t?: Knex.Transaction) {
    const ids = unMaybeArray(id);
    // we need to use this cte to guarantee that the results are returned in the same order as the ids
    return await this.raw<FileUpload>(
      /* sql */ `
      with ids as (
        select * from (?) as t(id_index, id_value)
      )
      insert into file_upload(path, filename, size, content_type, upload_complete, password, created_at, created_by, updated_at, updated_by)
      select path, filename, size, content_type, upload_complete, password, created_at, created_by, updated_at, updated_by
      from file_upload join ids on ids.id_value = id
      where id in ?
      order by ids.id_index asc
      returning *
      `,
      [
        this.sqlValues(
          ids.map((id, index) => [index, id]),
          ["int", "int"],
        ),
        this.sqlIn(ids),
      ],
      t,
    );
  }

  async markFileUploadComplete(id: MaybeArray<number>, updatedBy: string) {
    await this.from("file_upload")
      .update(
        {
          upload_complete: true,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      )
      .whereIn("id", unMaybeArray(id))
      .where("upload_complete", false);
  }

  /** gets deleted file_upload's whose paths are not repeated on another not deleted file_upload */
  async getFileUploadsToDelete(daysAfterDeletion: number) {
    return await this.raw<FileUpload>(
      /* sql */ `
      select fu.* from file_upload fu
      left join file_upload fu2 on fu.path = fu2.path and fu2.deleted_at is null and fu2.file_deleted_at is null
      where fu.deleted_at is not null
      and fu.deleted_at < NOW() - make_interval(days => ?)
      and fu.file_deleted_at is null
      and fu2.id is null
    `,
      [daysAfterDeletion],
    );
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

  async deleteFileUpload(id: MaybeArray<number>, deletedBy: string, t?: Knex.Transaction) {
    const ids = unMaybeArray(id);
    if (ids.length === 0) {
      return;
    }

    await pMapChunk(
      ids,
      async (idsChunk) => {
        await this.from("file_upload", t)
          .update(
            {
              deleted_at: this.now(),
              deleted_by: deletedBy,
            },
            "*",
          )
          .whereIn("id", idsChunk);
      },
      { chunkSize: 200, concurrency: 5 },
    );
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
    q.whereNull("deleted_at"),
  );

  async createPublicFile(data: CreatePublicFileUpload, createdBy: string, t?: Knex.Transaction) {
    const rows = await this.insert(
      "public_file_upload",
      {
        ...data,
        created_by: createdBy,
        updated_by: createdBy,
      },
      t,
    ).returning("*");

    return rows[0];
  }

  async updatePublicFile(
    publicFileId: number,
    data: Partial<PublicFileUpload>,
    updatedBy: string,
    t?: Knex.Transaction,
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
