import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Divider, Flex, HStack, Heading, Stack, Text } from "@chakra-ui/react";
import { EyeOffIcon, LockClosedIcon } from "@parallel/chakra/icons";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileFormField } from "@parallel/components/profiles/form-fields/ProfileFormField";
import { ProfileFormFieldFileAction } from "@parallel/components/profiles/form-fields/ProfileFormFieldFileUpload";
import {
  PetitionFieldType,
  ProfileFormInner_ProfileFieldPropertyFragment,
  ProfileFormInner_copyFileReplyToProfileFieldFileDocument,
  ProfileFormInner_createProfileFieldFileUploadLinkDocument,
  ProfileFormInner_deleteProfileFieldFileDocument,
  ProfileFormInner_profileFieldFileUploadCompleteDocument,
  ProfileFormInner_updateProfileFieldValueDocument,
  ProfileForm_PetitionBaseFragment,
  ProfileTypeFieldType,
  UpdateProfileFieldValueInput,
  buildFormDefaultValue_ProfileFieldPropertyFragment,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { discriminator } from "@parallel/utils/discriminator";
import { useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { withError } from "@parallel/utils/promises/withError";
import { MaybePromise } from "@parallel/utils/types";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import pMap from "p-map";
import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { filter, fromEntries, isNonNullish, map, partition, pipe } from "remeda";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";

export interface ProfileFormInnerInstance {
  handleSubmit: (
    onValid: (data: ProfileFormInnerData) => Promise<void>,
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export interface ProfileFormInnerData {
  fields: Record<
    string,
    {
      content: UpdateProfileFieldValueInput["content"];
      expiryDate?: UpdateProfileFieldValueInput["expiryDate"];
    }
  >;
}

export interface ProfileFormInnerProps {
  profileId: string;
  properties: ProfileFormInner_ProfileFieldPropertyFragment[];
  hiddenProperties?: ProfileFormInner_ProfileFieldPropertyFragment[];
  petition?: ProfileForm_PetitionBaseFragment;
  petitionId?: string;
  onRefetch?: () => MaybePromise<void>;
  onSubmitSuccess?: () => void;
  showBaseStyles?: boolean;
  isDisabled?: boolean;
}

const SUGGESTIONS_TYPE_MAPPING: Record<ProfileTypeFieldType, PetitionFieldType[]> = {
  DATE: ["DATE"],
  FILE: ["FILE_UPLOAD", "ES_TAX_DOCUMENTS", "DOW_JONES_KYC", "ID_VERIFICATION"],
  NUMBER: ["NUMBER"],
  PHONE: ["PHONE"],
  SHORT_TEXT: ["SHORT_TEXT", "SELECT", "CHECKBOX", "PHONE", "NUMBER", "DATE", "DATE_TIME"],
  TEXT: ["SHORT_TEXT", "TEXT", "SELECT", "CHECKBOX", "PHONE", "NUMBER", "DATE", "DATE_TIME"],
  SELECT: ["SELECT", "CHECKBOX"],
  BACKGROUND_CHECK: ["BACKGROUND_CHECK"],
  CHECKBOX: ["SELECT", "CHECKBOX"],
  ADVERSE_MEDIA_SEARCH: ["ADVERSE_MEDIA_SEARCH"],
  USER_ASSIGNMENT: ["USER_ASSIGNMENT"],
};

function normalize(alias: string) {
  return alias.toLowerCase().replaceAll("_", "");
}

export function ProfileFormInner({
  profileId,
  properties,
  hiddenProperties,
  onRefetch,
  petition,
  petitionId,
  onSubmitSuccess,
  showBaseStyles,
  isDisabled = false,
  ...props
}: ProfileFormInnerProps) {
  const intl = useIntl();

  const fieldsWithIndices = useAllFieldsWithIndices(petition ?? { fields: [] });

  // with property.field.type === "BACKGROUND_CHECK" or "ADVERSE_MEDIA_SEARCH" we don't need to check for alias
  const propertiesWithSuggestedFields = useMemo(
    () =>
      properties.map(
        (property) =>
          [
            property,
            isNonNullish(property.field.alias) ||
            property.field.type === "BACKGROUND_CHECK" ||
            property.field.type === "ADVERSE_MEDIA_SEARCH"
              ? fieldsWithIndices.filter(
                  ([petitionField]) =>
                    SUGGESTIONS_TYPE_MAPPING[property.field.type].includes(petitionField.type) &&
                    (property.field.type === "BACKGROUND_CHECK" ||
                      property.field.type === "ADVERSE_MEDIA_SEARCH" ||
                      (isNonNullish(petitionField.alias) &&
                        (normalize(petitionField.alias).includes(
                          normalize(property.field.alias!),
                        ) ||
                          normalize(property.field.alias!).includes(
                            normalize(petitionField.alias),
                          )))),
                )
              : [],
          ] as const,
      ),
    [properties, fieldsWithIndices],
  );

  const userCanCreateProfiles = useHasPermission("PROFILES:CREATE_PROFILES");
  const isFormDisabled = !userCanCreateProfiles || isDisabled;

  return (
    <Flex direction="column" {...props}>
      <Stack divider={<Divider />} spacing={4}>
        {propertiesWithSuggestedFields.length ? (
          <Stack as="ul" width="100%">
            {propertiesWithSuggestedFields.map(([{ field, value, files }, suggestedFields]) => {
              return (
                <ProfileFormField
                  key={field.id}
                  profileId={profileId}
                  field={field}
                  value={value}
                  files={files}
                  fieldsWithIndices={suggestedFields}
                  isDisabled={field.myPermission === "READ" || isFormDisabled}
                  onRefetch={onRefetch}
                  petitionId={petitionId}
                  properties={properties}
                  showBaseStyles={showBaseStyles}
                />
              );
            })}
          </Stack>
        ) : null}
        {isNonNullish(hiddenProperties) && hiddenProperties.length ? (
          <Stack spacing={4}>
            <HStack>
              <LockClosedIcon />
              <Heading as="h3" size="sm" fontWeight={600}>
                <FormattedMessage
                  id="page.profile-details.restricted-properties"
                  defaultMessage="Restricted properties"
                />
              </Heading>
              <HelpPopover>
                <Text>
                  <FormattedMessage
                    id="page.profile-details.hidden-properties-description"
                    defaultMessage="Request permission to see these properties."
                  />
                </Text>
              </HelpPopover>
            </HStack>
            <Stack>
              {hiddenProperties.map(({ field: { id, name } }) => {
                return (
                  <HStack key={id} justify="space-between">
                    <Text>
                      <LocalizableUserTextRender
                        value={name}
                        default={intl.formatMessage({
                          id: "generic.unnamed-profile-type-field",
                          defaultMessage: "Unnamed property",
                        })}
                      />
                    </Text>
                    <EyeOffIcon />
                  </HStack>
                );
              })}
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </Flex>
  );
}

ProfileFormInner.fragments = {
  get ProfileTypeField() {
    return gql`
      fragment ProfileFormInner_ProfileTypeField on ProfileTypeField {
        id
        name
        position
        type
        myPermission
        alias
        ...ProfileFormField_ProfileTypeField
      }
      ${ProfileFormField.fragments.ProfileTypeField}
    `;
  },
  get ProfileFieldFile() {
    return gql`
      fragment ProfileFormInner_ProfileFieldFile on ProfileFieldFile {
        id
        ...ProfileFormField_ProfileFieldFile
      }
      ${ProfileFormField.fragments.ProfileFieldFile}
    `;
  },
  get ProfileFieldValue() {
    return gql`
      fragment ProfileFormInner_ProfileFieldValue on ProfileFieldValue {
        id
        content
        createdAt
        expiryDate
        ...ProfileFormField_ProfileFieldValue
      }
      ${ProfileFormField.fragments.ProfileFieldValue}
    `;
  },
  get ProfileFieldProperty() {
    return gql`
      fragment ProfileFormInner_ProfileFieldProperty on ProfileFieldProperty {
        field {
          ...ProfileFormInner_ProfileTypeField
        }
        files {
          ...ProfileFormInner_ProfileFieldFile
        }
        value {
          ...ProfileFormInner_ProfileFieldValue
        }
        ...ProfileFormField_ProfileFieldProperty
      }
      ${this.ProfileTypeField}
      ${this.ProfileFieldFile}
      ${this.ProfileFieldValue}
      ${ProfileFormField.fragments.ProfileFieldProperty}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment ProfileFormInner_PetitionBase on PetitionBase {
        fields {
          id
          alias
          ...ProfileFormField_PetitionField
          children {
            id
            alias
            ...ProfileFormField_PetitionField
          }
        }
        ...useAllFieldsWithIndices_PetitionBase
      }
      ${useAllFieldsWithIndices.fragments.PetitionBase}
      ${ProfileFormField.fragments.PetitionField}
    `;
  },
};

export function useProfileFormInnerSubmitHandler({
  properties,
  profileId,
  petitionId,
  form,
}: {
  properties: ProfileFormInner_ProfileFieldPropertyFragment[];
  profileId: string;
  petitionId?: string;
  form: UseFormReturn<ProfileFormInnerData>;
}) {
  const { formState, reset, setError, getValues } = form;

  const [updateProfileFieldValue] = useMutation(ProfileFormInner_updateProfileFieldValueDocument);

  const [createProfileFieldFileUploadLink] = useMutation(
    ProfileFormInner_createProfileFieldFileUploadLinkDocument,
  );
  const [profileFieldFileUploadComplete] = useMutation(
    ProfileFormInner_profileFieldFileUploadCompleteDocument,
  );

  const [copyFileReplyToProfileFieldFile] = useMutation(
    ProfileFormInner_copyFileReplyToProfileFieldFileDocument,
  );

  const [deleteProfileFieldFile] = useMutation(ProfileFormInner_deleteProfileFieldFileDocument);

  const showErrorDialog = useErrorDialog();

  const intl = useIntl();

  return async (formData: ProfileFormInnerData) => {
    const [editedPropertiesWithData, editedFilePropertiesWithData] = pipe(
      properties,
      filter((property) => isNonNullish(formState.dirtyFields.fields?.[property.field.id])),
      map((property) => [property, formData.fields[property.field.id]] as const),
      partition(([property, _]) => property.field.type !== "FILE"),
    );

    if (editedPropertiesWithData.length) {
      try {
        await updateProfileFieldValue({
          variables: {
            profileId,
            fields: editedPropertiesWithData
              .map(([property, { content, expiryDate }]) => {
                const type = property.field.type;
                const profileTypeFieldId = property.field.id;
                const useValueAsExpiryDate =
                  type === "DATE" && property.field.options?.useReplyAsExpiryDate;

                if (type === "BACKGROUND_CHECK" || type === "ADVERSE_MEDIA_SEARCH") {
                  if (
                    (property.value?.content?.search ||
                      property.value?.content?.entity ||
                      property.value?.content?.articles) &&
                    property.field.isExpirable
                  ) {
                    // BACKGROUND_CHECK and ADVERSE_MEDIA_SEARCH can only update expiryDate through this mutation
                    return {
                      profileTypeFieldId,
                      expiryDate: expiryDate || null,
                    };
                  }
                  return null;
                } else {
                  return {
                    profileTypeFieldId,
                    content: isNonNullish(content?.value) && content!.value !== "" ? content : null,
                    expiryDate:
                      content?.value && property.field.isExpirable
                        ? useValueAsExpiryDate
                          ? content?.value || null
                          : expiryDate || null
                        : undefined,
                  };
                }
              })
              .filter(isNonNullish),
          },
        });
      } catch (e) {
        if (isApolloError(e, "PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT")) {
          const { conflicts } = e.errors[0].extensions as {
            conflicts: { profileTypeFieldId: string; profileId: string }[];
          };
          for (const conflict of conflicts) {
            setError(
              `fields.${conflict.profileTypeFieldId}.content.value`,
              { type: "unique" },
              { shouldFocus: true },
            );
          }
          return;
        } else if (isApolloError(e, "INVALID_PROFILE_FIELD_VALUE")) {
          const aggregatedErrors =
            (e.errors[0].extensions!.aggregatedErrors as {
              profileTypeFieldId: string;
              code: string;
            }[]) ?? [];

          for (const err of aggregatedErrors) {
            setError(
              `fields.${err.profileTypeFieldId}.content.value`,
              { type: "validate" },
              { shouldFocus: true },
            );
          }
          return;
        } else {
          throw e;
        }
      }
    }
    try {
      await pMap(
        editedFilePropertiesWithData,
        async ([property, data]) => {
          const profileTypeFieldId = property.field.id;
          const events = data.content!.value as ProfileFormFieldFileAction[];
          const deleteFiles = events.filter(discriminator("type", "DELETE"));
          const addFiles = events.filter(discriminator("type", "ADD"));
          const updateExpiresAt = events.filter(discriminator("type", "UPDATE"));
          const copyFiles = events.filter(discriminator("type", "COPY"));
          const expiryDate = property.field.isExpirable ? data.expiryDate : undefined;

          if (updateExpiresAt.length && !addFiles.length) {
            await createProfileFieldFileUploadLink({
              variables: {
                profileId,
                profileTypeFieldId,
                data: [],
                expiryDate,
              },
            });
          }

          if (deleteFiles.length) {
            await deleteProfileFieldFile({
              variables: {
                profileId,
                profileTypeFieldId,
                profileFieldFileIds: deleteFiles.map(({ id }) => id),
              },
            });
          }

          if (copyFiles.length && isNonNullish(petitionId)) {
            await copyFileReplyToProfileFieldFile({
              variables: {
                profileId,
                profileTypeFieldId,
                petitionId,
                fileReplyIds: copyFiles.map(({ id }) => id),
                expiryDate,
              },
            });
          }
          if (addFiles.length) {
            const { data } = await createProfileFieldFileUploadLink({
              variables: {
                profileId,
                profileTypeFieldId,
                data: addFiles.map((event) => ({
                  filename: event.file.name,
                  size: event.file.size,
                  contentType: event.file.type,
                })),
                expiryDate,
              },
            });

            const { uploads } = data!.createProfileFieldFileUploadLink;

            await pMap(
              uploads,
              async ({ presignedPostData, file }, i) => {
                try {
                  const controller = new AbortController();
                  await uploadFile(addFiles[i].file, presignedPostData, {
                    signal: controller.signal,
                  });
                } catch (e) {
                  if (e instanceof UploadFileError && e.message === "Aborted") {
                    // handled when aborted
                  } else {
                    await deleteProfileFieldFile({
                      variables: {
                        profileId,
                        profileTypeFieldId,
                        profileFieldFileIds: [file.id],
                      },
                    });
                  }
                  return;
                }
              },
              {
                concurrency: 3,
              },
            );

            await profileFieldFileUploadComplete({
              variables: {
                profileId,
                profileTypeFieldId,
                profileFieldFileIds: uploads.map(({ file }) => file.id),
              },
            });
          }
        },
        { concurrency: 1 },
      );
      const currentValues = getValues();
      reset(currentValues, {
        keepDirty: false,
        keepDirtyValues: false,
      });
    } catch (e) {
      if (isApolloError(e, "MAX_FILES_EXCEEDED")) {
        await withError(
          showErrorDialog({
            message: intl.formatMessage({
              id: "component.profile-form.max-files-exceeded-error",
              defaultMessage:
                "You exceeded the maximum amount of files you can upload on the field.",
            }),
          }),
        );
      } else {
        throw e;
      }
    }
  };
}

const _mutations = [
  gql`
    mutation ProfileFormInner_copyFileReplyToProfileFieldFile(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $petitionId: GID!
      $fileReplyIds: [GID!]!
      $expiryDate: Date
    ) {
      copyFileReplyToProfileFieldFile(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        petitionId: $petitionId
        fileReplyIds: $fileReplyIds
        expiryDate: $expiryDate
      ) {
        ...ProfileFormInner_ProfileFieldFile
      }
    }
    ${ProfileFormInner.fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileFormInner_updateProfileFieldValue(
      $profileId: GID!
      $fields: [UpdateProfileFieldValueInput!]!
    ) {
      updateProfileFieldValue(profileId: $profileId, fields: $fields) {
        id
      }
    }
  `,
  gql`
    mutation ProfileFormInner_createProfileFieldFileUploadLink(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $data: [FileUploadInput!]!
      $expiryDate: Date
    ) {
      createProfileFieldFileUploadLink(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        data: $data
        expiryDate: $expiryDate
      ) {
        uploads {
          presignedPostData {
            ...uploadFile_AWSPresignedPostData
          }
          file {
            ...ProfileFormInner_ProfileFieldFile
          }
        }
        property {
          ...ProfileFormInner_ProfileFieldProperty
        }
      }
    }
    ${uploadFile.fragments.AWSPresignedPostData}
    ${ProfileFormInner.fragments.ProfileFieldProperty}
    ${ProfileFormInner.fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileFormInner_profileFieldFileUploadComplete(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $profileFieldFileIds: [GID!]!
    ) {
      profileFieldFileUploadComplete(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        profileFieldFileIds: $profileFieldFileIds
      ) {
        id
        ...ProfileFormInner_ProfileFieldFile
      }
    }
    ${ProfileFormInner.fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileFormInner_deleteProfileFieldFile(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $profileFieldFileIds: [GID!]!
    ) {
      deleteProfileFieldFile(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        profileFieldFileIds: $profileFieldFileIds
      )
    }
  `,
];

export function buildFormDefaultValue(
  properties: buildFormDefaultValue_ProfileFieldPropertyFragment[],
): ProfileFormInnerData {
  return {
    fields: fromEntries(
      properties.map(({ field: { id, type, isExpirable }, files, value }) => [
        id,
        {
          content:
            type === "FILE"
              ? { value: [] }
              : {
                  value:
                    value?.content?.value ??
                    (["SHORT_TEXT", "TEXT", "PHONE", "DATE"].includes(type) ? "" : null),
                },
          expiryDate: isExpirable
            ? ((type === "FILE" ? files?.[0]?.expiryDate : value?.expiryDate) ?? null)
            : undefined,
        },
      ]),
    ),
  };
}

buildFormDefaultValue.fragments = {
  ProfileFieldProperty: gql`
    fragment buildFormDefaultValue_ProfileFieldProperty on ProfileFieldProperty {
      field {
        id
        type
        isExpirable
      }
      files {
        id
        expiryDate
      }
      value {
        id
        content
        expiryDate
      }
    }
  `,
};
