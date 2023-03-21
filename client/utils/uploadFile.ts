import { gql } from "@apollo/client";
import { uploadFile_AWSPresignedPostDataFragment } from "@parallel/graphql/__types";
import * as Sentry from "@sentry/nextjs";

interface UploadFileOptions {
  signal?: AbortSignal;
  onProgress?: (value: number) => void;
}

export function uploadFile(
  file: File,
  presignedPostData: uploadFile_AWSPresignedPostDataFragment,
  { signal, onProgress }: UploadFileOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
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
      const error = new UploadFileError("Error when uploading to AWS", request);
      Sentry.captureException(error, {
        extra: {
          status: request.status,
          presignedPostDataUrl: presignedPostData.url,
          presignedPostDataFields: JSON.stringify(presignedPostData.fields),
        },
      });
      reject(error);
    });
    request.addEventListener("abort", () => reject(new UploadFileError("Aborted", request)));
    signal?.addEventListener("abort", () => request.abort());
    setTimeout(() => request.send(formData));
  });
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
