import { isNonNullish } from "remeda";
import { ProfileTypeFieldOptions } from "../../services/ProfileTypeFieldService";
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

const FIELD_TYPE_MAP: Record<ProfileTypeFieldType, PetitionFieldType> = {
  TEXT: "TEXT",
  SHORT_TEXT: "SHORT_TEXT",
  SELECT: "SELECT",
  PHONE: "PHONE",
  NUMBER: "NUMBER",
  FILE: "FILE_UPLOAD",
  DATE: "DATE",
  BACKGROUND_CHECK: "BACKGROUND_CHECK",
  CHECKBOX: "CHECKBOX",
};

function mapPetitionFieldTypeToProfileTypeFieldType(type: PetitionFieldType): ProfileTypeFieldType {
  if (type === "FILE_UPLOAD") {
    return "FILE";
  }
  if (!ProfileTypeFieldTypeValues.includes(type)) {
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
    case "SHORT_TEXT": {
      defaultProperties.options.format = profileTypeField.options.format ?? null;
      break;
    }
    case "SELECT": {
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
    }
    case "CHECKBOX": {
      const options = profileTypeField.options as ProfileTypeFieldOptions["CHECKBOX"];
      defaultProperties.options.standardList = options.standardList ?? null;
      defaultProperties.options.values = isNonNullish(options.standardList)
        ? []
        : options.values.map((v) => v.value);
      defaultProperties.options.labels = isNonNullish(options.standardList)
        ? []
        : options.values.map(
            (v) => (v.label as any)[defaultLocale] ?? v.label["en"] ?? v.label["es"] ?? null,
          );
      defaultProperties.options.limit = {
        min: 1,
        max: 1,
        type: "UNLIMITED",
      };
      break;
    }
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
  a: Pick<ProfileFieldValue, "content" | "type">,
  b: { content: any },
) {
  if (a.type === "BACKGROUND_CHECK") {
    return (
      a.content?.query?.name === b.content?.query?.name &&
      a.content?.query?.date === b.content?.query?.date &&
      a.content?.query?.type === b.content?.query?.type &&
      a.content?.query?.country === b.content?.query?.country &&
      a.content?.entity?.id === b.content?.entity?.id
    );
  } else if (a.type === "CHECKBOX") {
    // contents are equal if both arrays contain exactly the same elements in any order
    return (
      a.content?.value.length === b.content?.value.length &&
      a.content?.value.every((v: string) => b.content?.value.includes(v))
    );
  } else {
    return a.content?.value === b.content?.value;
  }
}
