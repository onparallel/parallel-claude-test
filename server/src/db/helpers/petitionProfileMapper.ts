import { isNonNullish } from "remeda";
import {
  ContactLocale,
  CreatePetitionField,
  PetitionFieldReply,
  PetitionFieldType,
  ProfileFieldValue,
  ProfileTypeField,
  ProfileTypeFieldType,
  ProfileTypeFieldTypeValues,
} from "../__types";
import { defaultFieldProperties } from "./fieldOptions";
import { ProfileTypeFieldOptions } from "./profileTypeFieldOptions";

const FIELD_TYPE_MAP: Record<ProfileTypeFieldType, PetitionFieldType> = {
  TEXT: "TEXT",
  SHORT_TEXT: "SHORT_TEXT",
  SELECT: "SELECT",
  PHONE: "PHONE",
  NUMBER: "NUMBER",
  FILE: "FILE_UPLOAD",
  DATE: "DATE",
  BACKGROUND_CHECK: "BACKGROUND_CHECK",
};

function mapPetitionFieldTypeToProfileTypeFieldType(type: PetitionFieldType): ProfileTypeFieldType {
  if (type === "FILE_UPLOAD") {
    return "FILE";
  }
  if (!ProfileTypeFieldTypeValues.includes(type as any)) {
    throw new Error(`Can't convert type ${type} to ProfileTypeFieldType`);
  }

  return type as ProfileTypeFieldType;
}

export function mapProfileTypeFieldToPetitionField(
  profileTypeField: ProfileTypeField,
  defaultLocale: ContactLocale,
): Omit<CreatePetitionField, "petition_id" | "position" | "parent_petition_field_id"> {
  const type = FIELD_TYPE_MAP[profileTypeField.type];

  const defaultProperties = defaultFieldProperties(type);

  switch (profileTypeField.type) {
    case "SHORT_TEXT":
      defaultProperties.options.format = profileTypeField.options.format ?? null;
      break;
    case "SELECT":
      const options = profileTypeField.options as ProfileTypeFieldOptions["SELECT"];
      defaultProperties.options.standardList = options.standardList ?? null;
      defaultProperties.options.values = isNonNullish(options.standardList)
        ? []
        : options.values.map((v) => v.value);
      defaultProperties.options.labels = isNonNullish(options.standardList)
        ? []
        : options.values.map(
            (v) => (v.label as any)[defaultLocale] ?? v.label["en"] ?? v.label["es"] ?? null,
          );
      break;
    default:
      break;
  }

  return {
    profile_type_field_id: profileTypeField.id,
    type,
    title:
      profileTypeField.name[defaultLocale] ??
      profileTypeField.name["en"] ??
      profileTypeField.name["es"] ??
      null,
    ...defaultProperties,
  };
}

export function mapPetitionFieldReplyToProfileFieldValue(
  reply: Pick<PetitionFieldReply, "type" | "content">,
): Pick<ProfileFieldValue, "type" | "content"> {
  return {
    type: mapPetitionFieldTypeToProfileTypeFieldType(reply.type),
    content: reply.content,
  };
}

export function contentsAreEqual(
  value: Pick<ProfileFieldValue, "content" | "type">,
  reply: Pick<PetitionFieldReply, "content">,
) {
  if (value.type === "BACKGROUND_CHECK") {
    return (
      value.content.query?.name === reply.content.query?.name &&
      value.content.query?.date === reply.content.query?.date &&
      value.content.query?.type === reply.content.query?.type &&
      value.content.entity?.id === reply.content.entity?.id
    );
  } else {
    return value.content.value === reply.content.value;
  }
}
