import { BackgroundCheckEntitySearchType, DocumentProcessingType } from "@parallel/graphql/__types";
import { Maybe } from "./types";

export type FileUploadAccepts = "PDF" | "IMAGE";

export type DynamicSelectOption = [string, string[] | DynamicSelectOption[]];

export interface FieldOptions {
  HEADING: {
    hasPageBreak: boolean;
    showNumbering?: boolean;
  };
  FILE_UPLOAD: {
    accepts: Maybe<FileUploadAccepts[]>;
    attachToPdf: boolean;
    maxFileSize?: Maybe<number>;
    documentProcessing?: Maybe<{
      integrationId: Maybe<string>;
      processDocumentAs: DocumentProcessingType;
    }>;
    processDocument?: boolean;
    replyOnlyFromProfile?: boolean;
  };
  SHORT_TEXT: {
    placeholder?: Maybe<string>;
    format: Maybe<string>;
    maxLength: Maybe<number>;
    replyOnlyFromProfile?: boolean;
  };
  TEXT: {
    placeholder?: Maybe<string>;
    maxLength: Maybe<number>;
    replyOnlyFromProfile?: boolean;
  };
  NUMBER: {
    placeholder?: Maybe<string>;
    range: {
      min: number | undefined;
      max: number | undefined;
    };
    decimals: number;
    prefix: Maybe<string>;
    suffix: Maybe<string>;
    replyOnlyFromProfile?: boolean;
  };
  PHONE: {
    placeholder?: Maybe<string>;
    replyOnlyFromProfile?: boolean;
  };
  SELECT: {
    values: string[];
    labels?: Maybe<string[]>;
    placeholder?: Maybe<string>;
    standardList?: Maybe<string>;
    replyOnlyFromProfile?: boolean;
  };
  DYNAMIC_SELECT: {
    values: DynamicSelectOption[];
    labels: string[];
    file?: {
      id: string;
      name: string;
      size: number;
      updatedAt: Date;
    };
  };
  CHECKBOX: {
    values: string[];
    labels?: string[];
    limit: {
      type: string;
      min: number;
      max: number;
    };
    standardList?: Maybe<string>;
    replyOnlyFromProfile?: boolean;
  };
  DATE: {
    replyOnlyFromProfile?: boolean;
  };
  DOW_JONES_KYC: {};
  BACKGROUND_CHECK: {
    integrationId?: string | null;
    autoSearchConfig?: {
      // name and date are globalIds pointing to SHORT_TEXT and DATE fields on the petition
      name: string[];
      date: string | null;
      type: BackgroundCheckEntitySearchType | null;
      country: string | null;
    } | null;
    replyOnlyFromProfile?: boolean;
  };
  FIELD_GROUP: {
    groupName?: Maybe<string>;
  };
  ES_TAX_DOCUMENTS: {
    attachToPdf: boolean;
  };
  ID_VERIFICATION: {
    attachToPdf: boolean;
    identityVerification: {
      type: "SIMPLE" | "EXTENDED";
      allowedDocuments: ("ID_CARD" | "PASSPORT" | "RESIDENCE_PERMIT" | "DRIVER_LICENSE")[];
    };
  };
  PROFILE_SEARCH: {};
}
