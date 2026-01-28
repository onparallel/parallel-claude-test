import { gql } from "@apollo/client";
import {
  useProfileNamePreview_PetitionFieldFragment,
  useProfileNamePreview_PetitionFieldReplyFragment,
  useProfileNamePreview_PetitionFragment,
  useProfileNamePreview_ProfileTypeFragment,
} from "@parallel/graphql/__types";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { UpdateProfileOnClose } from "@parallel/utils/fieldOptions";
import { useMemo } from "react";
import { flatMap, isNullish, pipe } from "remeda";
/**
 * Hook to calculate profile name preview from updateProfileOnClose configuration and reply children.
 * This hook combines values from FIELD, VARIABLE, or PETITION_METADATA sources (from updateProfileOnClose)
 * with values from reply children to build the complete profile name.
 */
export function useProfileNamePreview({
  profileType,
  updateProfileOnClose,
  petition,
  replies,
  fieldLogic,
}: {
  profileType?: useProfileNamePreview_ProfileTypeFragment | null;
  updateProfileOnClose?: UpdateProfileOnClose[] | null;
  petition: useProfileNamePreview_PetitionFragment;
  replies: useProfileNamePreview_PetitionFieldReplyFragment[];
  fieldLogic: FieldLogicResult[];
}): string | null {
  return useMemo(() => {
    if (!profileType || !profileType.fields || !profileType.profileNamePattern) return null;

    const mainReplyId = replies[0]?.id;
    // Get all fields from petition (including children)
    const allPetitionFields = pipe(
      petition.fields,
      flatMap((f) => [f, ...(f.children ?? [])]),
    );

    // Collect all children from all replies
    const allChildrenEntries: Array<{
      field: useProfileNamePreview_PetitionFieldFragment;
      replies: useProfileNamePreview_PetitionFieldReplyFragment[];
      parentId: string | null;
    }> = [];

    for (const reply of replies) {
      if (reply.children) {
        for (const {
          field: { id },
          replies: childrenReplies,
        } of reply.children) {
          const field = allPetitionFields.find((f) => f.id === id);
          if (field) {
            allChildrenEntries.push({
              field,
              replies: childrenReplies,
              parentId: field.parent?.id ?? null,
            });
          }
        }
      }
    }

    // Group by profileTypeField.id and resolve duplicates
    // If duplicate, prefer the one where parent.id === mainReplyId
    const repliesWithProfileFieldsMap = new Map<
      string,
      [
        useProfileNamePreview_PetitionFieldFragment,
        useProfileNamePreview_PetitionFieldReplyFragment[],
      ]
    >();

    for (const { field, replies: fieldReplies, parentId } of allChildrenEntries) {
      const profileTypeFieldId = (field as any).profileTypeField?.id;
      if (!profileTypeFieldId) continue;

      const existing = repliesWithProfileFieldsMap.get(profileTypeFieldId);
      if (!existing) {
        // First occurrence, add it
        repliesWithProfileFieldsMap.set(profileTypeFieldId, [field, fieldReplies]);
      } else {
        // Duplicate found, prefer the one where parent.id === mainReplyId
        if (parentId === mainReplyId) {
          repliesWithProfileFieldsMap.set(profileTypeFieldId, [field, fieldReplies]);
        }
        // Otherwise, keep the existing one
      }
    }

    const repliesWithProfileFields = Array.from(repliesWithProfileFieldsMap.values());

    // Get all profileTypeFields that are used in profile name
    const profileTypeFieldsUsedInName = profileType.fields.filter(
      (f) => f.isUsedInProfileName === true,
    );

    if (profileTypeFieldsUsedInName.length === 0) {
      return null;
    }

    // Build a map of profileTypeFieldId -> value
    const fieldValues = new Map<string, string>();

    // First, get values from updateProfileOnClose
    if (updateProfileOnClose && updateProfileOnClose.length > 0) {
      for (const update of updateProfileOnClose) {
        if (update.source.type === "ASK_USER") continue;

        const profileTypeField = profileType.fields.find((f) => f.id === update.profileTypeFieldId);
        if (!profileTypeField?.isUsedInProfileName) continue;

        let value: string | number | null = null;

        let petitionFieldForSelect: { type?: string; options?: any } | null = null;

        if (update.source.type === "FIELD") {
          const fieldId = update.source.fieldId;
          const petitionField = allPetitionFields.find((f) => f.id === fieldId);
          if (petitionField && petitionField.replies.length > 0) {
            value = petitionField.replies[0]?.content?.value ?? null;
            petitionFieldForSelect = {
              type: petitionField.type ?? undefined,
              options: petitionField.options ?? undefined,
            };
          }
        } else if (update.source.type === "VARIABLE") {
          const finalValue = fieldLogic[0]?.finalVariables?.[update.source.name];
          value = isNullish(finalValue) ? null : finalValue;
        } else if (update.source.type === "PETITION_METADATA") {
          value = (petition as { closedAt?: string | null }).closedAt ?? null;
        }

        if (!isNullish(value)) {
          // Handle SELECT field type: convert value to label if available
          let stringValue = String(value);
          // Use petition field options if available (for FIELD source), otherwise use profileTypeField options
          const selectOptions = petitionFieldForSelect?.options || profileTypeField.options;
          const isSelectField =
            petitionFieldForSelect?.type === "SELECT" || profileTypeField.type === "SELECT";
          if (isSelectField && selectOptions?.labels && selectOptions?.values) {
            // Try to find the value in the options (handle both string and number comparisons)
            const index = selectOptions.values.findIndex(
              (v: string | number) => String(v) === stringValue || v === value,
            );
            if (index >= 0 && selectOptions.labels[index]) {
              stringValue = selectOptions.labels[index];
            }
          }
          fieldValues.set(update.profileTypeFieldId, stringValue);
        }
      }
    }

    // Then, fill missing values from children
    for (const profileTypeField of profileTypeFieldsUsedInName) {
      if (fieldValues.has(profileTypeField.id)) continue;

      const childFieldWithProfileType = repliesWithProfileFields?.find(
        ([f]) => (f as any).profileTypeField?.id === profileTypeField.id,
      );

      if (childFieldWithProfileType) {
        const [field, fieldReplies] = childFieldWithProfileType;
        const replyValue = fieldReplies[0]?.content?.value;
        if (!isNullish(replyValue)) {
          let stringValue = String(replyValue);
          // Handle SELECT field type: convert value to label if available
          const fieldType = (field as any).type;
          const fieldOptions = (field as any).options;
          if (fieldType === "SELECT" && fieldOptions?.labels && fieldOptions?.values) {
            // Try to find the value in the options (handle both string and number comparisons)
            const index = fieldOptions.values.findIndex(
              (v: string | number) => String(v) === stringValue || v === replyValue,
            );
            if (index >= 0 && fieldOptions.labels[index]) {
              stringValue = fieldOptions.labels[index];
            }
          }
          fieldValues.set(profileTypeField.id, stringValue);
        }
      }
    }

    // Replace patterns in profile name
    let profileName = profileType.profileNamePattern;
    for (const [profileTypeFieldId, value] of Array.from(fieldValues.entries())) {
      const pattern = `{{ ${profileTypeFieldId} }}`;
      profileName = profileName.replaceAll(pattern, value);
    }

    // Clear any unreplaced patterns {{ }}
    const cleanProfileName = profileName.replace(/{{\s*[\w\d]+\s*}}/g, "");

    // Return null if no patterns were replaced
    if (
      profileName === profileType.profileNamePattern ||
      cleanProfileName === profileType.profileNamePattern.replace(/{{\s*[\w\d]+\s*}}/g, "")
    ) {
      return null;
    }

    return cleanProfileName;
  }, [profileType, updateProfileOnClose, petition, replies, fieldLogic]);
}

const _fragments = {
  ProfileType: gql`
    fragment useProfileNamePreview_ProfileType on ProfileType {
      id
      profileNamePattern
      fields {
        id
        isUsedInProfileName
        type
        options
      }
    }
  `,
  PetitionFieldReply: gql`
    fragment useProfileNamePreview_PetitionFieldReply on PetitionFieldReply {
      id
      content
      children {
        field {
          id
        }
        replies {
          id
          content
        }
      }
    }
  `,
  PetitionField: gql`
    fragment useProfileNamePreview_PetitionField on PetitionField {
      id
      type
      options
      parent {
        id
      }
      replies {
        ...useProfileNamePreview_PetitionFieldReply
      }
      profileTypeField {
        id
      }
    }
  `,
  Petition: gql`
    fragment useProfileNamePreview_Petition on Petition {
      id
      closedAt
      fields {
        ...useProfileNamePreview_PetitionField
        children {
          ...useProfileNamePreview_PetitionField
        }
      }
    }
  `,
};
