import { gql } from "@apollo/client";
import { uploadFile_AWSPresignedPostDataFragment } from "@parallel/graphql/__types";
import * as Sentry from "@sentry/nextjs";
import { retry, StopRetryError } from "./promises/retry";

interface UploadFileOptions {
  signal?: AbortSignal;
  onProgress?: (value: number) => void;
}

export function uploadFile(
  file: File,
  presignedPostData: uploadFile_AWSPresignedPostDataFragment,
  { signal, onProgress }: UploadFileOptions = {}
): Promise<void> {
  try {
    return retry(
      async () => {
        return await new Promise((resolve, reject) => {
          const formData = new FormData();
          Object.keys(presignedPostData.fields).forEach((key) => {
            formData.append(key, presignedPostData.fields[key]);
          });

          formData.append("Content-Type", file.type);
          formData.append("file", file);

          const request = new XMLHttpRequest();
          request.open("POST", presignedPostData.url);

          request.upload.addEventListener("progress", (e) => onProgress?.(e.loaded / e.total));
          request.addEventListener("load", async () => {
            if (request.status >= 200 && request.status < 300) {
              resolve();
            } else {
              const error = new UploadFileError(request.responseText, request);
              Sentry.captureException(error);
              reject(error);
            }
          });
          request.addEventListener("error", () => {
            reject(new UploadFileError("Error when uploading to AWS", request));
          });
          request.addEventListener("abort", () => {
            reject(new StopRetryError(new UploadFileError("Aborted", request)));
          });
          signal?.addEventListener("abort", () => request.abort());
          setTimeout(() => request.send(formData));
        });
      },
      { maxRetries: 3, signal, delay: 1_000 }
    );
  } catch (e) {
    if (e instanceof UploadFileError && e.message === "Error when uploading to AWS") {
      Sentry.captureException(e, {
        extra: {
          status: e.cause.status,
          presignedPostDataUrl: presignedPostData.url,
          presignedPostDataFields: JSON.stringify(presignedPostData.fields),
        },
      });
    }
    throw e;
  }
}

export class UploadFileError extends Error {
  constructor(message: string, public override cause: XMLHttpRequest) {
    super(message);
  }
}

uploadFile.fragments = {
  AWSPresignedPostData: gql`
    fragment uploadFile_AWSPresignedPostData on AWSPresignedPostData {
      url
      fields
    }
  `,
};
