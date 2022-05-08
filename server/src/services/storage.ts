import AWS from "aws-sdk";
import { HeadObjectOutput, PresignedPost } from "aws-sdk/clients/s3";
import contentDisposition from "content-disposition";
import { injectable } from "inversify";
import { chunk } from "remeda";
import { Readable } from "stream";
import { unMaybeArray } from "../util/arrays";
import { MaybeArray } from "../util/types";

export const STORAGE_FACTORY = Symbol.for("FACTORY<STORAGE>");

export type StorageFactory = (...args: ConstructorParameters<typeof Storage>) => IStorage;

export interface IStorage {
  getSignedUploadEndpoint(
    key: string,
    contentType: string,
    maxAllowedSize?: number
  ): Promise<PresignedPost>;
  getSignedDownloadEndpoint(
    key: string,
    filename: string,
    cdType: "attachment" | "inline"
  ): Promise<string>;
  downloadFile(key: string): Readable;
  getFileMetadata(key: string): Promise<HeadObjectOutput>;
  deleteFile(key: MaybeArray<string>): Promise<void>;
  uploadFile(key: string, contentType: string, body: Buffer | Readable): Promise<HeadObjectOutput>;
}
const _4GB = 1024 * 1024 * 1024 * 4;
@injectable()
export class Storage implements IStorage {
  constructor(private s3: AWS.S3, private bucketName: string) {}

  async getSignedUploadEndpoint(key: string, contentType: string, maxAllowedSize?: number) {
    return await new Promise<PresignedPost>((resolve, reject) => {
      this.s3.createPresignedPost(
        {
          Bucket: this.bucketName,
          Fields: { key },
          Expires: 60 * 30,
          Conditions: [
            ["eq", "$Content-Type", contentType],
            ["content-length-range", 0, Math.min(maxAllowedSize ?? _4GB, _4GB)],
          ],
        },
        (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );
    });
  }

  async getSignedDownloadEndpoint(key: string, filename: string, cdType: "attachment" | "inline") {
    return await this.s3.getSignedUrlPromise("getObject", {
      Bucket: this.bucketName,
      Key: key,
      Expires: 60 * 30,
      ResponseContentDisposition: contentDisposition(filename, {
        type: cdType,
      }),
    });
  }

  downloadFile(key: string) {
    return this.s3
      .getObject({
        Bucket: this.bucketName,
        Key: key,
      })
      .createReadStream();
  }

  async getFileMetadata(key: string) {
    return await this.s3
      .headObject({
        Bucket: this.bucketName,
        Key: key,
      })
      .promise();
  }

  async deleteFile(keys: MaybeArray<string>) {
    const objects = unMaybeArray(keys).map((key) => ({ Key: key }));
    if (objects.length > 0) {
      // there's a limit of 1000 items per API call
      for (const objectsChunk of chunk(objects, 1000))
        await this.s3
          .deleteObjects({
            Bucket: this.bucketName,
            Delete: { Objects: objectsChunk },
          })
          .promise();
    }
  }

  async uploadFile(key: string, contentType: string, body: Buffer | Readable) {
    await this.s3
      .upload(
        {
          Bucket: this.bucketName,
          Key: key,
          ContentType: contentType,
          Body: body,
        },
        {}
      )
      .promise();
    return await this.getFileMetadata(key);
  }
}
