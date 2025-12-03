import { gql } from "@apollo/client";
import {
  useCheckUpdateProfile_PetitionFieldReplyFragment,
  useCheckUpdateProfile_PetitionFragment,
  useCheckUpdateProfile_ProfileFragment,
} from "@parallel/graphql/__types";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { UpdateProfileOnClose } from "@parallel/utils/fieldOptions";
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
 */
export function useCheckUpdateProfile({
  parentReplyId,
  profile,
  updateProfileOnClose,
  replies,
  petition,
  fieldLogic,
}: {
  parentReplyId: string;
  profile?: useCheckUpdateProfile_ProfileFragment | null;
  updateProfileOnClose?: UpdateProfileOnClose[] | null;
  replies: useCheckUpdateProfile_PetitionFieldReplyFragment[];
  petition: useCheckUpdateProfile_PetitionFragment;
  fieldLogic: FieldLogicResult[];
}): boolean {
  return useMemo(() => {
    if (!profile) return false;
    const profileType = profile.profileType;
    const reply = replies[0];

    // Get all petition fields (including children)
    const allPetitionFields = pipe(
      petition.fields,
      flatMap((f) => [f, ...(f.children ?? [])]),
    );

    // Get all profileTypeFieldIds to check
    const profileTypeFieldIdsToCheck = new Set<string>();

    // 1. From updateProfileOnClose
    if (updateProfileOnClose) {
      for (const update of updateProfileOnClose) {
        if (update.source.type === "ASK_USER") continue;
        profileTypeFieldIdsToCheck.add(update.profileTypeFieldId);
      }
    }

    // 2. From reply children (that are not in updateProfileOnClose)
    if (reply.children) {
      for (const { field: _childField } of reply.children) {
        const childField = allPetitionFields.find((f) => f.id === _childField.id);
        if (
          isNonNullish(childField?.profileTypeField) &&
          !profileTypeFieldIdsToCheck.has(childField.profileTypeField.id)
        ) {
          profileTypeFieldIdsToCheck.add(childField.profileTypeField.id);
        }
      }
    }

    // Check each profileTypeFieldId
    for (const profileTypeFieldId of Array.from(profileTypeFieldIdsToCheck)) {
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
          const childField = reply?.children?.find((c) => c.field.id === fieldId);

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
        // Get from reply children
        const childField = allPetitionFields.find(
          (f) => f.profileTypeField?.id === profileTypeFieldId,
        );

        const childFieldReplies = childField?.replies.filter((r) => r.parent?.id === parentReplyId);

        if (childField && isNonNullish(childFieldReplies) && childFieldReplies.length > 0) {
          petitionValue = childFieldReplies[0]?.content;
          petitionFieldType = childField.type;
          petitionReplies = childFieldReplies;
        }
      }

      if (!petitionValue || !petitionFieldType) continue;

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
          return true;
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
          return true;
        }
      } else if (petitionFieldType === "FILE_UPLOAD") {
        const petitionFilesToString = petitionReplies.map((reply) => {
          const { filename, size, contentType } = reply.content;
          return `${filename}-${size}-${contentType})`;
        });
        const profileFilesToString =
          profileField?.files
            ?.map((file) => {
              if (isNullish(file) || isNullish(file.file)) return null;
              const { filename, size, contentType } = file.file;
              return `${filename}-${size}-${contentType})`;
            })
            .filter(isNonNullish) ?? [];

        if (
          petitionFilesToString.length !== profileFilesToString.length ||
          difference.multiset(petitionFilesToString, profileFilesToString).length > 0
        ) {
          return true;
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
          return true;
        }
      } else {
        // Simple value comparison for text, number, date, etc.
        // For VARIABLE and PETITION_METADATA, the value is wrapped in { value: ... }
        const petitionValueToCompare =
          petitionValue?.value !== undefined ? petitionValue.value : petitionValue;
        if (petitionValueToCompare !== profileFieldContent?.value) {
          return true;
        }
      }
    }

    return false;
  }, [profile, updateProfileOnClose, replies, petition, fieldLogic, parentReplyId]);
}

useCheckUpdateProfile.fragments = {
  get ProfileType() {
    return gql`
      fragment useCheckUpdateProfile_ProfileType on ProfileType {
        id
        fields {
          id
          type
        }
      }
    `;
  },
  get ProfileFieldFile() {
    return gql`
      fragment useCheckUpdateProfile_ProfileFieldFile on ProfileFieldFile {
        file {
          filename
          size
          contentType
        }
      }
    `;
  },
  get ProfileFieldValue() {
    return gql`
      fragment useCheckUpdateProfile_ProfileFieldValue on ProfileFieldValue {
        content
      }
    `;
  },
  get ProfileFieldProperty() {
    return gql`
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
      ${this.ProfileFieldValue}
      ${this.ProfileFieldFile}
    `;
  },
  get Profile() {
    return gql`
      fragment useCheckUpdateProfile_Profile on Profile {
        id
        properties {
          ...useCheckUpdateProfile_ProfileFieldProperty
        }
        profileType {
          ...useCheckUpdateProfile_ProfileType
        }
      }
      ${this.ProfileFieldProperty}
      ${this.ProfileType}
    `;
  },

  get PetitionFieldReply() {
    return gql`
      fragment useCheckUpdateProfile_PetitionFieldReply on PetitionFieldReply {
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
            content
            parent {
              id
            }
          }
        }
      }
    `;
  },
  get PetitionField() {
    return gql`
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
      ${this.PetitionFieldReply}
    `;
  },
  get Petition() {
    return gql`
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
      ${this.PetitionField}
    `;
  },
};
