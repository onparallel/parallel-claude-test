import AWS, { AWSError } from "aws-sdk";
import { HeadObjectOutput, ManagedUpload } from "aws-sdk/clients/s3";
import { PromiseResult } from "aws-sdk/lib/request";
import contentDisposition from "content-disposition";
import { injectable } from "inversify";
import { Readable } from "stream";

export const STORAGE_FACTORY = Symbol.for("FACTORY<STORAGE>");

export type StorageFactory = (
  ...args: ConstructorParameters<typeof Storage>
) => IStorage;

export interface IStorage {
  getSignedUploadEndpoint(key: string, contentType: string): Promise<string>;
  getSignedDownloadEndpoint(
    key: string,
    filename: string,
    cdType: "attachment" | "inline"
  ): Promise<string>;
  downloadFile(key: string): Readable;
  getFileMetadata(
    key: string
  ): Promise<PromiseResult<HeadObjectOutput, AWSError>>;
  deleteFile(key: string): Promise<void>;
  uploadFile(
    key: string,
    contentType: string,
    body: Buffer | Readable
  ): Promise<ManagedUpload.SendData>;
}

@injectable()
export class Storage implements IStorage {
  constructor(private s3: AWS.S3, private bucketName: string) {}

  async getSignedUploadEndpoint(key: string, contentType: string) {
    return await this.s3.getSignedUrlPromise("putObject", {
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      Expires: 60 * 30,
    });
  }

  async getSignedDownloadEndpoint(
    key: string,
    filename: string,
    cdType: "attachment" | "inline"
  ) {
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
    return this.s3
      .headObject({
        Bucket: this.bucketName,
        Key: key,
      })
      .promise();
  }

  async deleteFile(key: string) {
    this.s3
      .deleteObject({
        Bucket: this.bucketName,
        Key: key,
      })
      .promise();
  }

  async uploadFile(key: string, contentType: string, body: Buffer | Readable) {
    return this.s3
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
  }
}
