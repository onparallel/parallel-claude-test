import { gql } from "@apollo/client";
import { uploadFile_AWSPresignedPostDataFragment } from "@parallel/graphql/__types";

export function uploadFile(
  file: File,
  presignedPostData: uploadFile_AWSPresignedPostDataFragment,
  {
    onComplete,
    onProgress,
  }: {
    onComplete?: () => void;
    onProgress?: (progress: number) => void;
  } = {}
) {
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
    onComplete?.();
  });
  setTimeout(() => {
    request.send(formData);
  });
  return request;
}

uploadFile.fragments = {
  AWSPresignedPostData: gql`
    fragment uploadFile_AWSPresignedPostData on AWSPresignedPostData {
      url
      fields
    }
  `,
};
