import { Maybe } from "./types";

export type FileUploadAccepts = "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT";

export type FieldOptions = {
  HEADING: {
    hasPageBreak: boolean;
  };
  FILE_UPLOAD: {
    accepts: Maybe<FileUploadAccepts[]>;
  };
  TEXT: {
    multiline: boolean;
    placeholder: Maybe<string>;
  };
  SELECT: {
    values: string[];
    placeholder: Maybe<string>;
  };
};
