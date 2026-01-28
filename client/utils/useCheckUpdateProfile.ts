import { gql } from "@apollo/client";
import {
  useCheckUpdateProfile_PetitionFieldReplyFragment,
  useCheckUpdateProfile_PetitionFragment,
  useCheckUpdateProfile_ProfileFragment,
} from "@parallel/graphql/__types";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { UpdateProfileOnClose } from "@parallel/utils/fieldOptions";
import { format } from "date-fns";
import { useMemo } from "react";
import { difference, flatMap, isNonNullish, isNullish, pipe, sort } from "remeda";

type AdverseMediaSearchTermInput = {
  term?: string | null;
  entityId?: string | null;
  wikiDataId?: string | null;
};

type AdverseMediaArticle = {
  id: string;
  classification: string;
};

/**
 * Hook to check if a profile needs to be updated by comparing petition values
 * (from updateProfileOnClose or reply children) with current profile values.
 * Priority: updateProfileOnClose -> reply children
 * parentReplyId is used to filter the children replies to match the parent
 */
export function useCheckUpdateProfile({
  parentReplyId,
  parentAssociatedAt,
  profile,
  updateProfileOnClose,
  replies,
  petition,
  fieldLogic,
}: {
  parentReplyId: string;
  parentAssociatedAt?: string | null;
  profile?: useCheckUpdateProfile_ProfileFragment | null;
  updateProfileOnClose?: UpdateProfileOnClose[] | null;
  replies: useCheckUpdateProfile_PetitionFieldReplyFragment[];
  petition: useCheckUpdateProfile_PetitionFragment;
  fieldLogic: FieldLogicResult[];
}): { hasConflicts: boolean; needUpdate: boolean } {
  return useMemo(() => {
    if (!profile) return { hasConflicts: false, needUpdate: false };
    const profileType = profile.profileType;
    const mainReply = replies[0];

    const parentAssociatedAtMs = parentAssociatedAt ? Date.parse(parentAssociatedAt) : NaN;
    const canComputeNeedUpdate = !isNaN(parentAssociatedAtMs);

    // Get all petition fields (including children)
    const allPetitionFields = pipe(
      petition.fields,
      flatMap((f) => [f, ...(f.children ?? [])]),
    );

    // Get all profileTypeFieldIds to check
    const profileTypeFieldIdsToCheck = new Map<string, string>();

    // 1. From updateProfileOnClose
    if (updateProfileOnClose) {
      for (const update of updateProfileOnClose) {
        if (update.source.type === "ASK_USER") continue;
        profileTypeFieldIdsToCheck.set(update.profileTypeFieldId, update.source.type);
      }
    }

    // 2. From reply children (that are not in updateProfileOnClose)
    for (const reply of replies) {
      if (reply.children) {
        for (const { field: _childField } of reply.children) {
          const childField = allPetitionFields.find((f) => f.id === _childField.id);
          if (
            isNonNullish(childField?.profileTypeField) &&
            !profileTypeFieldIdsToCheck.has(childField.profileTypeField.id)
          ) {
            profileTypeFieldIdsToCheck.set(childField.profileTypeField.id, reply.id);
          }
        }
      }
    }

    let hasConflicts = false;
    let needUpdate = false;

    // Check each profileTypeFieldId
    for (const [profileTypeFieldId, _] of Array.from(profileTypeFieldIdsToCheck)) {
      const profileField = profile.properties
        .filter(({ field }) => field.myPermission === "WRITE")
        .find(({ field }) => field.id === profileTypeFieldId);

      if (!profileField) continue;

      // Get petition value, field type, and replies
      let petitionValue: any = null;
      let petitionFieldType: string | undefined = undefined;
      let petitionReplies: any[] = [];

      // Try to get from updateProfileOnClose first
      const updateFromConfig = updateProfileOnClose?.find(
        (u) => u.profileTypeFieldId === profileTypeFieldId && u.source.type !== "ASK_USER",
      );

      if (updateFromConfig) {
        // Get value from updateProfileOnClose
        if (updateFromConfig.source.type === "FIELD") {
          const fieldId = updateFromConfig.source.fieldId;
          const map = updateFromConfig.source.map;
          const childField = mainReply?.children?.find((c) => c.field.id === fieldId);

          if (childField && childField.replies.length > 0) {
            const replyContent = childField.replies[0]?.content;
            petitionValue =
              map && isNonNullish(replyContent?.value)
                ? { value: map[replyContent.value] }
                : replyContent;
            petitionFieldType = (childField.field as any).type;
            petitionReplies = childField.replies;
          } else {
            const petitionField = allPetitionFields.find((f) => f.id === fieldId);
            if (petitionField && petitionField.replies.length > 0) {
              const replyContent = petitionField.replies[0]?.content;
              petitionValue =
                map && isNonNullish(replyContent?.value)
                  ? { value: map[replyContent.value] }
                  : replyContent;
              petitionFieldType = petitionField.type;
              petitionReplies = petitionField.replies;
            }
          }
        } else if (updateFromConfig.source.type === "VARIABLE") {
          const map = updateFromConfig.source.map;
          const variableValue = fieldLogic[0]?.finalVariables?.[updateFromConfig.source.name];
          const finalValue =
            map && isNonNullish(variableValue) ? map[variableValue] : variableValue;

          petitionValue = isNullish(finalValue) ? null : { value: finalValue };
          petitionFieldType = profileType.fields.find((f) => f.id === profileTypeFieldId)?.type;
        } else if (updateFromConfig.source.type === "PETITION_METADATA") {
          const closedAt = (petition as { closedAt?: string | null }).closedAt;
          petitionValue = isNullish(closedAt) ? null : { value: closedAt };
          petitionFieldType = profileType.fields.find((f) => f.id === profileTypeFieldId)?.type;
        }
      } else {
        // Get from reply children (merged group: multiple replies = multiple FIELD_GROUPs as one)
        // Consider all petition fields with this profileTypeFieldId; if field appears in several
        // groups, prefer the value from the reply where parent.id === parentReplyId.
        const childFieldsWithProfileType = allPetitionFields.filter(
          (f) => f.profileTypeField?.id === profileTypeFieldId,
        );

        let chosenChildField: (typeof allPetitionFields)[number] | undefined;
        let chosenReplies: typeof petitionReplies = [];

        for (const childField of childFieldsWithProfileType) {
          const repliesWithParent = (childField.replies ?? []).filter(
            (r) => r.parent?.id === parentReplyId,
          );
          if (repliesWithParent.length > 0) {
            chosenChildField = childField;
            chosenReplies = repliesWithParent;
            break;
          }
        }
        if (!chosenChildField) {
          for (const childField of childFieldsWithProfileType) {
            if ((childField.replies?.length ?? 0) > 0) {
              chosenChildField = childField;
              chosenReplies = childField.replies ?? [];
              break;
            }
          }
        }
        if (chosenChildField && chosenReplies.length > 0) {
          petitionValue = chosenReplies[0]?.content;
          petitionFieldType = chosenChildField.type;
          petitionReplies = chosenReplies;
        }
      }

      if (!petitionValue || !petitionFieldType) continue;

      if (!needUpdate && canComputeNeedUpdate && petitionReplies.length > 0) {
        const repliesScopedToParent =
          petitionReplies?.filter((r) => r?.parent?.id === parentReplyId) ?? [];
        const repliesToCheckForNeedUpdate =
          repliesScopedToParent.length > 0 ? repliesScopedToParent : petitionReplies;

        const petitionRepliesUpdatedAtMs = repliesToCheckForNeedUpdate
          .map((r) => Date.parse(r.updatedAt))
          .filter((t) => !isNaN(t));

        if (petitionRepliesUpdatedAtMs.some((t) => t > parentAssociatedAtMs)) {
          needUpdate = true;
        }
      }

      const profileFieldContent = profileField.value?.content;

      // Compare based on field type
      if (petitionFieldType === "BACKGROUND_CHECK") {
        const {
          date = "",
          name = "",
          type = "",
          country = "",
          birthCountry = "",
        } = petitionValue?.query ?? {};
        const {
          date: profileDate = "",
          name: profileName = "",
          type: profileType = "",
          country: profileCountry = "",
          birthCountry: profileBirthCountry = "",
        } = profileFieldContent?.query ?? {};

        if (
          petitionValue?.entity?.id !== profileFieldContent?.entity?.id ||
          `${date}-${name}-${type}-${country}-${birthCountry}` !==
            `${profileDate}-${profileName}-${profileType}-${profileCountry}-${profileBirthCountry}` ||
          petitionValue?.search?.falsePositivesCount !==
            profileFieldContent?.search?.falsePositivesCount ||
          petitionValue?.search?.totalCount !== profileFieldContent?.search?.totalCount
        ) {
          hasConflicts = true;
        }
      } else if (petitionFieldType === "ADVERSE_MEDIA_SEARCH") {
        const fieldSearch =
          petitionValue?.search
            ?.map(
              (search: AdverseMediaSearchTermInput) =>
                search.term || search.entityId || search.wikiDataId,
            )
            .filter(isNonNullish) ?? [];

        const profileSearch =
          profileFieldContent?.search
            ?.map(
              (search: AdverseMediaSearchTermInput) =>
                search.term || search.entityId || search.wikiDataId,
            )
            .filter(isNonNullish) ?? [];

        const fieldIdsWithClassification =
          petitionValue?.articles?.items?.map(
            ({ id, classification }: AdverseMediaArticle) => `${id}-${classification}`,
          ) || [];

        const profileIdsWithClassification =
          profileFieldContent?.articles?.items?.map(
            ({ id, classification }: AdverseMediaArticle) => `${id}-${classification}`,
          ) || [];

        if (
          fieldSearch.length !== profileSearch.length ||
          fieldIdsWithClassification.length !== profileIdsWithClassification.length ||
          difference.multiset(fieldSearch, profileSearch).length > 0 ||
          difference.multiset(fieldIdsWithClassification, profileIdsWithClassification).length > 0
        ) {
          hasConflicts = true;
        }
      } else if (petitionFieldType === "FILE_UPLOAD") {
        const petitionFilesToString = petitionReplies.map((reply) => {
          const { filename, size, contentType } = reply.content;
          return `${filename}-${size}-${contentType}`;
        });
        const profileFilesToString =
          profileField?.files
            ?.map((file) => {
              if (isNullish(file) || isNullish(file.file)) return null;
              const { filename, size, contentType } = file.file;
              return `${filename}-${size}-${contentType}`;
            })
            .filter(isNonNullish) ?? [];

        if (
          petitionFilesToString.length !== profileFilesToString.length ||
          difference.multiset(petitionFilesToString, profileFilesToString).length > 0
        ) {
          hasConflicts = true;
        }
      } else if (petitionFieldType === "CHECKBOX") {
        const replyValue = sort<string>(petitionValue?.value ?? [], (a, b) => a.localeCompare(b));
        const profileValue = sort<string>(profileFieldContent?.value ?? [], (a, b) =>
          a.localeCompare(b),
        );

        if (
          replyValue.length !== profileValue.length ||
          replyValue.join(",") !== profileValue.join(",")
        ) {
          hasConflicts = true;
        }
      } else if (petitionFieldType === "DATE") {
        const normalizeDate = (dateValue: string | null | undefined): string | null => {
          if (!dateValue) return null;
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return null;
          return format(date, "yyyy-MM-dd");
        };

        const petitionDate = normalizeDate(petitionValue?.value);
        const profileDate = normalizeDate(profileFieldContent?.value);

        if (petitionDate !== profileDate) {
          hasConflicts = true;
        }
      } else {
        // Simple value comparison for text, number, date, etc.
        // For VARIABLE and PETITION_METADATA, the value is wrapped in { value: ... }
        const petitionValueToCompare =
          petitionValue?.value !== undefined ? petitionValue.value : petitionValue;
        if (petitionValueToCompare !== profileFieldContent?.value) {
          hasConflicts = true;
        }
      }

      if (hasConflicts && needUpdate) break;
    }

    return { hasConflicts, needUpdate };
  }, [profile, updateProfileOnClose, replies, petition, fieldLogic, parentReplyId]);
}

const _fragments = {
  ProfileType: gql`
    fragment useCheckUpdateProfile_ProfileType on ProfileType {
      id
      fields {
        id
        type
      }
    }
  `,
  ProfileFieldFile: gql`
    fragment useCheckUpdateProfile_ProfileFieldFile on ProfileFieldFile {
      file {
        filename
        size
        contentType
      }
    }
  `,
  ProfileFieldValue: gql`
    fragment useCheckUpdateProfile_ProfileFieldValue on ProfileFieldValue {
      content
    }
  `,
  ProfileFieldProperty: gql`
    fragment useCheckUpdateProfile_ProfileFieldProperty on ProfileFieldProperty {
      field {
        id
        myPermission
        type
      }
      value {
        ...useCheckUpdateProfile_ProfileFieldValue
      }
      files {
        ...useCheckUpdateProfile_ProfileFieldFile
      }
    }
  `,
  Profile: gql`
    fragment useCheckUpdateProfile_Profile on Profile {
      id
      properties {
        ...useCheckUpdateProfile_ProfileFieldProperty
      }
      profileType {
        ...useCheckUpdateProfile_ProfileType
      }
    }
  `,

  PetitionFieldReply: gql`
    fragment useCheckUpdateProfile_PetitionFieldReply on PetitionFieldReply {
      id
      content
      updatedAt
      parent {
        id
      }
      children {
        field {
          id
        }
        replies {
          id
          content
          updatedAt
          parent {
            id
          }
        }
      }
      associatedAt
    }
  `,
  PetitionField: gql`
    fragment useCheckUpdateProfile_PetitionField on PetitionField {
      id
      type
      replies {
        ...useCheckUpdateProfile_PetitionFieldReply
      }
      profileTypeField {
        id
      }
    }
  `,
  Petition: gql`
    fragment useCheckUpdateProfile_Petition on Petition {
      id
      closedAt
      fields {
        ...useCheckUpdateProfile_PetitionField
        children {
          ...useCheckUpdateProfile_PetitionField
        }
      }
    }
  `,
};
