import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createPresignedPost, PresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import contentDisposition from "content-disposition";
import { inject, injectable } from "inversify";
import { chunk } from "remeda";
import { Readable } from "stream";
import { buffer } from "stream/consumers";
import { Memoize } from "typescript-memoize";
import { Config, CONFIG } from "../config";
import { unMaybeArray } from "../util/arrays";
import { awsLogger } from "../util/awsLogger";
import { MaybeArray } from "../util/types";
import { ILogger, LOGGER } from "./logger";

export interface IS3Service {
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
  downloadFile(key: string): Promise<Readable>;
  getFileMetadata(key: string): Promise<HeadObjectOutput>;
  deleteFile(key: MaybeArray<string>): Promise<void>;
  uploadFile(key: string, contentType: string, body: Buffer | Readable): Promise<HeadObjectOutput>;
}

const _4GB = 1024 * 1024 * 1024 * 4;

class S3Service implements IS3Service {
  constructor(private s3: S3Client, private bucketName: string) {}

  async getSignedUploadEndpoint(key: string, contentType: string, maxAllowedSize?: number) {
    return await createPresignedPost(this.s3, {
      Bucket: this.bucketName,
      Key: key,
      Expires: 60 * 30,
      Conditions: [
        ["eq", "$Content-Type", contentType],
        ["content-length-range", 0, Math.min(maxAllowedSize ?? _4GB, _4GB)],
      ],
    });
  }

  async getSignedDownloadEndpoint(key: string, filename: string, cdType: "attachment" | "inline") {
    return await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: contentDisposition(filename, { type: cdType }),
      }),
      { expiresIn: 60 * 30 }
    );
  }

  async downloadFile(key: string) {
    const response = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucketName, Key: key })
    );
    return Readable.from(await buffer(response.Body! as Readable));
  }

  async getFileMetadata(key: string) {
    return await this.s3.send(
      new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
    );
  }

  async deleteFile(keys: MaybeArray<string>) {
    const objects = unMaybeArray(keys).map((key) => ({ Key: key }));
    if (objects.length > 0) {
      // there's a limit of 1000 items per API call
      for (const objectsChunk of chunk(objects, 1000)) {
        await this.s3.send(
          new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: { Objects: objectsChunk },
          })
        );
      }
    }
  }

  async uploadFile(key: string, contentType: string, body: Buffer | Readable) {
    await new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        Body: body,
      },
    }).done();

    return await this.getFileMetadata(key);
  }
}

export const STORAGE_SERVICE = Symbol.for("STORAGE_SERVICE");

export interface IStorage {
  publicFiles: IS3Service;
  fileUploads: IS3Service;
  temporaryFiles: IS3Service;
}

@injectable()
export class StorageService implements IStorage {
  constructor(@inject(CONFIG) private config: Config, @inject(LOGGER) private logger: ILogger) {}

  @Memoize() private get s3() {
    return new S3Client({
      ...this.config.aws,
      useAccelerateEndpoint: true,
      logger: awsLogger(this.logger),
    });
  }

  @Memoize() public get fileUploads() {
    return new S3Service(this.s3, this.config.s3.fileUploadsBucketName);
  }

  @Memoize() public get temporaryFiles() {
    return new S3Service(this.s3, this.config.s3.temporaryFilesBucketName);
  }

  @Memoize() public get publicFiles() {
    return new S3Service(this.s3, this.config.s3.publicFilesBucketName);
  }
}
