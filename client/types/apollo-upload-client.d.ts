declare module "apollo-upload-client/UploadHttpLink.mjs" {
  import { ApolloLink } from "@apollo/client";

  export interface UploadHttpLinkOptions {
    uri?: string;
    useGETForQueries?: boolean;
    isExtractableFile?: (value: any) => boolean;
    FormData?: typeof FormData;
    formDataAppendFile?: (form: FormData, index: string, file: any) => void;
    print?: any;
    fetch?: typeof fetch;
    fetchOptions?: RequestInit;
    credentials?: RequestCredentials;
    headers?: Record<string, string>;
    includeExtensions?: boolean;
    includeUnusedVariables?: boolean;
  }

  export default class UploadHttpLink extends ApolloLink {
    constructor(options?: UploadHttpLinkOptions);
  }
}

declare module "apollo-upload-client/isExtractableFile.mjs" {
  export default function isExtractableFile(value: any): boolean;
}

declare module "apollo-upload-client/formDataAppendFile.mjs" {
  export default function formDataAppendFile(form: FormData, index: string, file: any): void;
}
