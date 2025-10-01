import { createHmac } from "crypto";
import { inject, injectable } from "inversify";
import { mapValues } from "remeda";
import { CONFIG, Config } from "../config";

export const IMAGE_SERVICE = Symbol.for("IMAGE_SERVICE");

interface _ImageOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: "fill" | "inside" | "contain" | "cover" | "outside";
    options?: {
      withoutEnlargement?: boolean;
    };
  };
  flatten?: {
    background?: string;
  };
  toFormat?: "png" | "jpeg" | "webp";
}
type ImageOptions = DeepNullableIfUndefined<_ImageOptions>;

// this type makes all undefined values in an object nullable to match graphql inputs
type DeepNullableIfUndefined<T> = T extends object
  ? {
      [K in keyof T]: undefined extends T[K]
        ? null | DeepNullableIfUndefined<T[K]>
        : DeepNullableIfUndefined<T[K]>;
    }
  : undefined extends T
    ? null | T
    : T;

export interface IImageService {
  getImageUrl(path: string, options?: ImageOptions | null): Promise<string>;
  getAssetImageUrl(path: string, options?: ImageOptions | null): Promise<string>;
}

@injectable()
export class ImageService implements ImageService {
  constructor(@inject(CONFIG) private config: Config) {}

  private async _getImageUrl(bucketName: string, key: string, options: ImageOptions = {}) {
    const request = Buffer.from(
      JSON.stringify({
        bucket: bucketName,
        key,
        edits: this._normalizeOptions(options),
      }),
    ).toString("base64");
    const signature = createHmac("sha256", this.config.imageProxy.secret)
      .update(`/${request}`)
      .digest("hex");
    return `${this.config.misc.imagesUrl}/${request}?${new URLSearchParams({ signature })}`;
  }

  // remove any nulls
  private _normalizeOptions(options: ImageOptions | null) {
    function deepMapValues(value: any): any {
      if (Array.isArray(value)) {
        return value.map(deepMapValues);
      } else if (typeof value === "object" && value !== null) {
        return mapValues(value, deepMapValues);
      } else {
        return value ?? undefined;
      }
    }
    return deepMapValues(options ?? undefined);
  }

  async getImageUrl(key: string, options: ImageOptions = {}) {
    return await this._getImageUrl(this.config.s3.publicFilesBucketName, key, options);
  }

  async getAssetImageUrl(key: string, options: ImageOptions = {}) {
    return await this._getImageUrl(this.config.s3.assetsBucketName, key, options);
  }
}
