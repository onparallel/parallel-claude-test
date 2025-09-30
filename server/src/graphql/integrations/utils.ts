import { fromGlobalId, isGlobalId } from "../../util/globalId";

export interface PetitionReplyParams {
  petitionId: string;
  fieldId: string;
  parentReplyId?: string;
}

export interface ProfileReplyParams {
  profileId: string;
  profileTypeFieldId: string;
  profileFieldValueId?: string;
}

type PetitionOrProfileReplyParams = PetitionReplyParams | ProfileReplyParams;

export type NumericParams<T> = {
  [K in keyof T]: number;
};

export function parseReplyToken(token: string): NumericParams<PetitionOrProfileReplyParams> {
  const parsed = JSON.parse(Buffer.from(token, "base64").toString());
  if (isPetitionToken(parsed) || isProfileToken(parsed)) {
    return toNumericIds(parsed);
  } else {
    throw new Error("Invalid token");
  }
}

function toNumericIds<T extends PetitionOrProfileReplyParams>(token: T): NumericParams<T> {
  return Object.fromEntries(
    Object.entries(token).map(([k, v]) => [k, v ? fromGlobalId(v).id : null]),
  ) as NumericParams<T>;
}

function isPetitionToken(token: any): token is PetitionReplyParams {
  return (
    typeof token.petitionId === "string" &&
    isGlobalId(token.petitionId, "Petition") &&
    typeof token.fieldId === "string" &&
    isGlobalId(token.fieldId, "PetitionField") &&
    (!token.parentReplyId ||
      (typeof token.parentReplyId === "string" &&
        isGlobalId(token.parentReplyId, "PetitionFieldReply")))
  );
}

function isProfileToken(token: any): token is ProfileReplyParams {
  return (
    typeof token.profileId === "string" &&
    isGlobalId(token.profileId, "Profile") &&
    typeof token.profileTypeFieldId === "string" &&
    isGlobalId(token.profileTypeFieldId, "ProfileTypeField") &&
    (!token.profileFieldValueId ||
      (typeof token.profileFieldValueId === "string" &&
        isGlobalId(token.profileFieldValueId, "ProfileFieldValue")))
  );
}
