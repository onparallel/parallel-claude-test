import { fromGlobalId, isGlobalId } from "../../util/globalId";

interface BackgroundCheckPetitionParams {
  petitionId: string;
  fieldId: string;
  parentReplyId?: string;
}

type BackgroundCheckParams = BackgroundCheckPetitionParams;

type NumericParams<T> = {
  [K in keyof T]: number;
};

export function parseBackgroundCheckToken(token: string): NumericParams<BackgroundCheckParams> {
  const parsed = JSON.parse(Buffer.from(token, "base64").toString());
  if (isPetitionToken(parsed)) {
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
