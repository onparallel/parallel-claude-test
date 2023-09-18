import { gql } from "@apollo/client";
import {
  CreatePetitionFieldReplyInput,
  PetitionFieldType,
  isReplyContentCompatible_PetitionFieldFragment,
  mapReplyContents_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { difference, isDefined } from "remeda";
import { isFileTypeField } from "./isFileTypeField";
import { FieldOptions } from "./petitionFields";

export const mapReplyContents = ({
  mapping: mapping,
  fields: fields,
  sourcePetitionFields: sourcePetitionFields,
}: {
  mapping: { [key: string]: string };
  fields: mapReplyContents_PetitionFieldFragment[];
  sourcePetitionFields: mapReplyContents_PetitionFieldFragment[];
}) => {
  let result = [] as CreatePetitionFieldReplyInput[];

  for (const [targetId, originId] of Object.entries(mapping)) {
    const targetField = fields.find((field) => field.id === targetId);
    const originField = sourcePetitionFields.find((field) => field.id === originId);

    if (isDefined(targetField) && isDefined(originField)) {
      const replies = targetField.multiple ? originField.replies : [originField.replies[0]];

      if (replies.length) {
        const mappedReplies = replies
          .filter((r) => isDefined(r) && !isDefined(r.content.error))
          .flatMap((reply) => {
            if (isFileTypeField(originField.type)) {
              return {
                id: targetField.id,
                content: { petitionFieldReplyId: reply.id },
              };
            }

            if (
              ["TEXT", "SHORT_TEXT", "SELECT"].includes(targetField.type) &&
              ["CHECKBOX"].includes(originField.type)
            ) {
              const values = targetField.multiple
                ? reply.content?.value
                : [reply.content?.value[0]];
              return values.map((value: string) => ({
                id: targetField.id,
                content: { value },
              }));
            }

            if (targetField.type === "DATE_TIME") {
              return {
                id: targetField.id,
                content: {
                  datetime: reply.content.datetime,
                  timezone: reply.content.timezone,
                },
              };
            }

            if (targetField.type === "NUMBER") {
              return {
                id: targetField.id,
                content: { value: reply.content?.value },
              };
            }

            if (targetField.type === "CHECKBOX") {
              return {
                id: targetField.id,
                content: {
                  value:
                    originField.type === "CHECKBOX"
                      ? reply.content?.value
                      : [String(reply.content?.value)],
                },
              };
            }

            return {
              id: targetField.id,
              content: { value: String(reply.content?.value) },
            };
          });

        result = result.concat(mappedReplies);
      }
    }
  }
  return result;
};

mapReplyContents.fragments = {
  get PetitionField() {
    return gql`
      fragment mapReplyContents_PetitionField on PetitionField {
        id
        type
        options
        multiple
        replies {
          id
          content
        }
      }
    `;
  },
};

export const isReplyContentCompatible = (
  target: isReplyContentCompatible_PetitionFieldFragment,
  origin: isReplyContentCompatible_PetitionFieldFragment,
) => {
  let isCompatible = false;
  const replies = target.multiple ? origin.replies : [origin.replies[0]];

  switch (target.type) {
    case "TEXT": {
      const compatibleFields = [
        "TEXT",
        "SHORT_TEXT",
        "SELECT",
        "NUMBER",
        "DATE",
        "PHONE",
        "CHECKBOX",
      ] as PetitionFieldType[];

      if (compatibleFields.includes(origin.type)) {
        isCompatible = true;
      }
      break;
    }
    case "SHORT_TEXT": {
      const compatibleFields = [
        "SHORT_TEXT",
        "SELECT",
        "NUMBER",
        "DATE",
        "PHONE",
        "CHECKBOX",
      ] as PetitionFieldType[];

      if (
        (origin.type === "SHORT_TEXT" && origin.options.format === target.options.format) ||
        (compatibleFields.includes(origin.type) && !target.options.format)
      ) {
        isCompatible = true;
      }
      break;
    }
    case "SELECT": {
      const compatibleFields = ["SELECT", "CHECKBOX"] as PetitionFieldType[];
      if (compatibleFields.includes(origin.type)) {
        isCompatible = replies.every((reply) => {
          if (!reply) return true;
          const replyValue = Array.isArray(reply.content.value)
            ? reply.content.value
            : [reply.content.value];
          return difference(replyValue, target.options.values).length === 0;
        });
      }
      break;
    }
    case "NUMBER": {
      const compatibleFields = ["NUMBER"] as PetitionFieldType[];
      const options = target.options as FieldOptions["NUMBER"];

      const hasCompatibleNumberFormat = (options: FieldOptions["NUMBER"], number: number) => {
        const { min, max } = options.range;

        // Check if the input is a valid number
        if (isNaN(number)) {
          return false;
        }

        // Check if the number is within the specified range
        if ((isDefined(min) && number < min) || (isDefined(max) && number > max)) {
          return false;
        }

        // Check the maximum number of decimal places
        const decimalPlaces = (number.toString().split(".")[1] || "").length;
        if (decimalPlaces > options.decimals) {
          return false;
        }

        return true;
      };

      if (
        compatibleFields.includes(origin.type) &&
        replies.every((reply) =>
          reply ? hasCompatibleNumberFormat(options, reply.content.value) : true,
        )
      ) {
        isCompatible = true;
      }
      break;
    }
    case "DATE": {
      const compatibleFields = ["DATE"] as PetitionFieldType[];
      if (compatibleFields.includes(origin.type)) {
        isCompatible = true;
      }
      break;
    }
    case "PHONE": {
      const compatibleFields = ["PHONE"] as PetitionFieldType[];
      if (compatibleFields.includes(origin.type)) {
        isCompatible = true;
      }
      break;
    }
    case "CHECKBOX": {
      const compatibleFields = ["SELECT", "CHECKBOX"] as PetitionFieldType[];
      if (compatibleFields.includes(origin.type)) {
        isCompatible = replies.every((reply) => {
          if (!reply) return true;
          const replyValue = Array.isArray(reply.content.value)
            ? reply.content.value
            : [reply.content.value];

          if (
            target.options.limit.type === "EXACT" &&
            replyValue.length !== target.options.limit.max
          ) {
            return false;
          }
          if (
            target.options.limit.type === "RANGE" &&
            (replyValue.length > target.options.limit.max ||
              replyValue.length < target.options.limit.min)
          ) {
            return false;
          }

          return difference(replyValue, target.options.values).length === 0;
        });
      }
      break;
    }
    case "DATE_TIME": {
      const compatibleFields = ["DATE_TIME"] as PetitionFieldType[];
      if (compatibleFields.includes(origin.type)) {
        isCompatible = true;
      }
      break;
    }
    case "FILE_UPLOAD": {
      const compatibleFields = [
        "FILE_UPLOAD",
        "ES_TAX_DOCUMENTS",
        "DOW_JONES_KYC",
      ] as PetitionFieldType[];
      if (compatibleFields.includes(origin.type)) {
        isCompatible = true;
      }
      break;
    }
    case "DOW_JONES_KYC":
    case "ES_TAX_DOCUMENTS":
    case "DYNAMIC_SELECT":
      break;
    default:
      break;
  }

  return isCompatible;
};

isReplyContentCompatible.fragments = {
  get PetitionField() {
    return gql`
      fragment isReplyContentCompatible_PetitionField on PetitionField {
        id
        type
        options
        multiple
        replies {
          id
          content
        }
      }
    `;
  },
};
