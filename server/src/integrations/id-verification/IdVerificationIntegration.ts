import { Maybe } from "../../util/types";

export type IdentityVerificationSessionRequestMetadata = {
  integrationId: string;
  petitionId: string;
  orgId: string;
  fieldId: string;
  parentReplyId?: Maybe<string>;
} & ({ userId: string } | { accessId: string });

export type IdentityVerificationDocumentType =
  | "ID_CARD"
  | "PASSPORT"
  | "RESIDENCE_PERMIT"
  | "DRIVER_LICENSE";

export type IdentityVerificationRequestType = "SIMPLE" | "EXTENDED";

export interface CreateIdentityVerificationSessionRequest {
  type: IdentityVerificationRequestType;
  allowedDocuments: IdentityVerificationDocumentType[];
}

export interface CreateIdentityVerificationSessionResponse {
  id: string;
  url: string;
}

export interface IdentityVerificationSessionResponse {
  id: string;
  metadata: IdentityVerificationSessionRequestMetadata;
  identityVerification: Maybe<{
    id: Maybe<string>;
    state: "ok" | "ko";
    request: CreateIdentityVerificationSessionRequest;
    koReason: Maybe<string>;
    koSubreason: Maybe<string>;
  }>;
}

export interface IdentityVerificationSessionSummaryResponse {
  id: string;
  createdAt: string;
  firstName: Maybe<string>;
  surname: Maybe<string>;
  birthDate: Maybe<string>;
  nationality: Maybe<string>;
  birthPlace: Maybe<string>;
  documents: Maybe<IdentityVerificationDocument[]>;
  selfie: Maybe<SelfieDocument>;
}
export interface IdentityVerificationDocumentInfo {
  id: string;
  sessionId: string;
  extension: string;
  name: string;
  contentType: string;
  createdAt: string;
}

export interface IdentityVerificationDocument {
  type: IdentityVerificationDocumentType;
  dataDocument: Maybe<IdentityVerificationDocumentInfo>;
  imagesDocument: Maybe<IdentityVerificationDocumentInfo>;
  idNumber: Maybe<string>;
  firstName: Maybe<string>;
  surname: Maybe<string>;
  birthDate: Maybe<string>;
  birthPlace: Maybe<string>;
  nationality: Maybe<string>;
  issueDate: Maybe<string>;
  expirationDate: Maybe<string>;
  issuingCountry: Maybe<string>;
  unexpiredDocument: Maybe<number>;
  matchesExpectedDocument: Maybe<number>;
  faceFrontSide: Maybe<number>;
  uncompromisedDocument: Maybe<number>;
  notShownScreen: Maybe<number>;
  coherentDates: Maybe<number>;
  checkedMRZ: Maybe<number>;
  createdAt: string;
}

export interface SelfieDocument {
  pictureDocument: Maybe<IdentityVerificationDocumentInfo>;
  videoDocument: Maybe<IdentityVerificationDocumentInfo>;
  createdAt: string;
  liveness: Maybe<number>;
  onlyOneFace: Maybe<number>;
}

export interface IIdVerificationIntegration {
  fetchSession(
    integrationId: number,
    sessionId: string,
  ): Promise<IdentityVerificationSessionResponse>;
  fetchSessionSummary(
    integrationId: number,
    identityVerificationId: string,
  ): Promise<IdentityVerificationSessionSummaryResponse>;
  fetchBinaryDocumentContents(integrationId: number, documentId: string): Promise<Buffer>;
  createSession(
    metadata: IdentityVerificationSessionRequestMetadata,
    request: CreateIdentityVerificationSessionRequest,
  ): Promise<CreateIdentityVerificationSessionResponse>;
}
