import { gql } from "@apollo/client";
import {
  CreatePetitionFieldReplyInput,
  PetitionFieldType,
  isReplyContentCompatible_PetitionFieldFragment,
  mapReplyContents_PetitionFieldDataFragment,
} from "@parallel/graphql/__types";
import { difference, groupBy, isDefined } from "remeda";
import { isFileTypeField } from "./isFileTypeField";
import { FieldOptions } from "./petitionFields";

interface CreatePetitionFieldReplyInputWithParent extends CreatePetitionFieldReplyInput {
  replyParentId?: string;
  targetFieldId?: string;
}

export const mapReplyContents = ({
  mapping,
  fields,
  sourcePetitionFields,
  overwriteExisting,
}: {
  mapping: { [key: string]: string };
  fields: mapReplyContents_PetitionFieldDataFragment[];
  sourcePetitionFields: mapReplyContents_PetitionFieldDataFragment[];
  overwriteExisting: boolean;
}) => {
  let fieldsReplyInput = [] as CreatePetitionFieldReplyInputWithParent[];
  let childrenReplyInput = [] as CreatePetitionFieldReplyInputWithParent[];

  for (const [targetId, originId] of Object.entries(mapping)) {
    const targetField = fields.find((field) => field.id === targetId);
    const originField = sourcePetitionFields.find((field) => field.id === originId);

    if (isDefined(targetField) && isDefined(originField)) {
      const originIsChild = originField.parent?.id;

      //if origin is child whe need to get all replies to groupBy parent (field group) and then map to target
      const replies =
        targetField.multiple || originIsChild ? originField.replies : [originField.replies[0]];

      const emptyReplyIds =
        targetField.type === "FIELD_GROUP" && !overwriteExisting
          ? (targetField?.replies
              .filter((reply) => reply.children?.every((child) => child.replies.length === 0))
              .map((reply) => reply.id) ?? [])
          : [];

      const groupedReplies = groupBy(replies ?? [], (r) => r?.parent?.id ?? "");

      if (replies.length) {
        const mappedReplies = Object.values(groupedReplies).flatMap((replies) => {
          return replies
            .filter((r) => isDefined(r) && !isDefined(r.content.error))
            .flatMap((reply, index) => {
              if (originIsChild && originField.multiple && !targetField.multiple && index > 0) {
                return null;
              }

              const common = {
                replyParentId: reply.parent?.id,
                targetFieldId: targetField.parent?.id,
              };

              if (isFileTypeField(originField.type)) {
                return {
                  id: targetField.id,
                  content: { petitionFieldReplyId: reply.id },
                  ...common,
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
                  ...common,
                }));
              }

              if (targetField.type === "DATE_TIME") {
                return {
                  id: targetField.id,
                  content: {
                    datetime: reply.content.datetime,
                    timezone: reply.content.timezone,
                  },
                  ...common,
                };
              }

              if (targetField.type === "NUMBER") {
                return {
                  id: targetField.id,
                  content: { value: reply.content?.value },
                  ...common,
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
                  ...common,
                };
              }

              if (targetField.type === "FIELD_GROUP") {
                if (index >= replies.length - emptyReplyIds.length) return null;
                return { id: targetField.id, content: {} };
              }

              return {
                id: targetField.id,
                content: { value: String(reply.content?.value) },
                ...common,
              };
            });
        });

        if (originIsChild) {
          childrenReplyInput = childrenReplyInput.concat(mappedReplies.filter(isDefined));
        } else {
          fieldsReplyInput = fieldsReplyInput.concat(mappedReplies.filter(isDefined));
        }
      }
    }
  }

  return {
    fields: fieldsReplyInput,
    children: childrenReplyInput,
  };
};

mapReplyContents.fragments = {
  get PetitionField() {
    return gql`
      fragment mapReplyContents_PetitionField on PetitionField {
        ...mapReplyContents_PetitionFieldData
        children {
          ...mapReplyContents_PetitionFieldData
        }
      }
      fragment mapReplyContents_PetitionFieldData on PetitionField {
        id
        type
        options
        multiple
        replies {
          id
          content
          parent {
            id
          }
          children {
            field {
              id
            }
            replies {
              id
            }
          }
        }
        parent {
          id
          replies {
            id
          }
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

  // if is a child field we need to treat like if it was multiple, we asume that origin is also child
  const replies = target.multiple || target.isChild ? origin.replies : [origin.replies[0]];

  switch (target.type) {
    case "FIELD_GROUP": {
      const compatibleFields = ["FIELD_GROUP"] as PetitionFieldType[];
      if (compatibleFields.includes(origin.type)) {
        isCompatible = true;
      }
      break;
    }
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
        "ID_VERIFICATION",
      ] as PetitionFieldType[];
      if (compatibleFields.includes(origin.type)) {
        isCompatible = true;
      }
      break;
    }
    case "DOW_JONES_KYC":
    case "ES_TAX_DOCUMENTS":
    case "DYNAMIC_SELECT":
    case "ID_VERIFICATION":
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
        isChild
      }
    `;
  },
};
