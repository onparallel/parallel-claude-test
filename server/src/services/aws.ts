import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";
import AWS from "aws-sdk";
import { promisify } from "util";
import contentDisposition from "content-disposition";

@injectable()
export class Aws {
  readonly s3: AWS.S3;

  constructor(@inject(CONFIG) private config: Config) {
    AWS.config.update({ ...config.aws, signatureVersion: "v4" });

    this.s3 = new AWS.S3({
      signatureVersion: "v4",
      region: this.config.aws.region,
      useAccelerateEndpoint: true,
    });
  }

  async getSignedUploadEndpoint(key: string, contentType: string) {
    return await this.s3.getSignedUrlPromise("putObject", {
      Bucket: this.config.s3.uplodsBucketName,
      Key: key,
      ContentType: contentType,
      Expires: 60 * 30,
    });
  }

  async getFileMetadata(key: string) {
    return this.s3
      .headObject({
        Bucket: this.config.s3.uplodsBucketName,
        Key: key,
      })
      .promise();
  }

  async deleteFile(key: string) {
    this.s3
      .deleteObject({
        Bucket: this.config.s3.uplodsBucketName,
        Key: key,
      })
      .promise();
  }

  async getSignedDownloadEndpoint(key: string, filename: string) {
    return await this.s3.getSignedUrlPromise("getObject", {
      Bucket: this.config.s3.uplodsBucketName,
      Key: key,
      Expires: 60 * 30,
      ResponseContentDisposition: contentDisposition(filename, {
        type: "inline",
      }),
    });
  }
}
