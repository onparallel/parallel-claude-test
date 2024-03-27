import { fromGlobalId, isGlobalId } from "../../util/globalId";

export interface BackgroundCheckPetitionParams {
  petitionId: string;
  fieldId: string;
  parentReplyId?: string;
}

export interface BackgroundCheckProfileParams {
  profileId: string;
  profileTypeFieldId: string;
}

type BackgroundCheckParams = BackgroundCheckPetitionParams | BackgroundCheckProfileParams;

export type NumericParams<T> = {
  [K in keyof T]: number;
};

export function parseBackgroundCheckToken(token: string): NumericParams<BackgroundCheckParams> {
  const parsed = JSON.parse(Buffer.from(token, "base64").toString());
  if (isPetitionToken(parsed) || isProfileToken(parsed)) {
    return toNumericIds(parsed);
  } else {
    throw new Error("Invalid token");
  }
}

function toNumericIds<T extends BackgroundCheckParams>(token: T): NumericParams<T> {
  return Object.fromEntries(
    Object.entries(token).map(([k, v]) => [k, fromGlobalId(v).id]),
  ) as NumericParams<T>;
}

function isPetitionToken(token: any): token is BackgroundCheckPetitionParams {
  return (
    typeof token.petitionId === "string" &&
    isGlobalId(token.petitionId, "Petition") &&
    typeof token.fieldId === "string" &&
    isGlobalId(token.fieldId, "PetitionField") &&
    (typeof token.parentReplyId === "undefined" ||
      (typeof token.parentReplyId === "string" &&
        isGlobalId(token.parentReplyId, "PetitionFieldReply")))
  );
}

function isProfileToken(token: any): token is BackgroundCheckProfileParams {
  return (
    typeof token.profileId === "string" &&
    isGlobalId(token.profileId, "Profile") &&
    typeof token.profileTypeFieldId === "string" &&
    isGlobalId(token.profileTypeFieldId, "ProfileTypeField")
  );
}
