import { createHmac } from "crypto";
import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";

export const IMAGE_SERVICE = Symbol.for("IMAGE_SERVICE");

interface ImageOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: "fill" | "inside" | "contain" | "cover" | "outside";
    options?: {
      withoutEnlargement?: boolean;
    };
  };
}

export interface IImageService {
  getImageUrl(path: string, options?: ImageOptions): Promise<string>;
}

@injectable()
export class ImageService implements ImageService {
  constructor(@inject(CONFIG) private config: Config) {}

  async getImageUrl(key: string, options: ImageOptions = {}) {
    const request = Buffer.from(
      JSON.stringify({
        bucket: this.config.s3.publicFilesBucketName,
        key,
        edits: options,
      })
    ).toString("base64");
    const signature = createHmac("sha256", this.config.imageProxy.secret)
      .update(`/${request}`)
      .digest("hex");
    return `${this.config.misc.imagesUrl}/${request}?${new URLSearchParams({ signature })}`;
  }
}
