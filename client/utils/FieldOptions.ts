export type FileUploadAccepts = "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT";

export type FieldOptions = {
  HEADING: {
    hasPageBreak: boolean;
  };
  FILE_UPLOAD: {
    accepts: FileUploadAccepts[] | null;
  };
  TEXT: {
    multiline: boolean;
    placeholder: string | null;
  };
};
