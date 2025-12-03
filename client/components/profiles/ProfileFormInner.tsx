import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Divider, Flex, HStack, Heading, Stack, Text } from "@chakra-ui/react";
import { EyeOffIcon, LockClosedIcon } from "@parallel/chakra/icons";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { useAutoConfirmDiscardChangesDialog } from "@parallel/components/organization/dialogs/ConfirmDiscardChangesDialog";
import { ProfileFormField } from "@parallel/components/profiles/form-fields/ProfileFormField";
import { ProfileFormFieldFileAction } from "@parallel/components/profiles/form-fields/ProfileFormFieldFileUpload";
import {
  PetitionFieldType,
  ProfileForm_PetitionBaseFragment,
  ProfileForm_ProfileFieldPropertyFragment,
  ProfileForm_ProfileFragment,
  ProfileForm_copyFileReplyToProfileFieldFileDocument,
  ProfileForm_createProfileFieldFileUploadLinkDocument,
  ProfileForm_deleteProfileFieldFileDocument,
  ProfileForm_profileFieldFileUploadCompleteDocument,
  ProfileForm_updateProfileFieldValueDocument,
  ProfileTypeFieldType,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { discriminator } from "@parallel/utils/discriminator";
import { useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { withError } from "@parallel/utils/promises/withError";
import { MaybePromise } from "@parallel/utils/types";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { useRouter } from "next/router";
import pMap from "p-map";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo } from "react";
import { FormProvider, FormState, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { fromEntries, isNonNullish, partition } from "remeda";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { ProfileFormData } from "./ProfileForm";

export interface ProfileFormInnerInstance {
  handleSubmit: (
    onValid: (data: ProfileFormData) => Promise<void>,
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  formState: FormState<ProfileFormData>;
  reset: () => void;
}

export interface ProfileFormInnerProps {
  profile: ProfileForm_ProfileFragment;
  petition?: ProfileForm_PetitionBaseFragment;
  petitionId?: string;
  onRefetch?: () => MaybePromise<void>;
  filterProperties?: (property: ProfileForm_ProfileFieldPropertyFragment) => boolean;
  showHiddenProperties?: boolean;
  onSubmitSuccess?: () => void;
  enableRouterHooks?: boolean;
  onFormStateChange?: (formState: FormState<ProfileFormData>) => void;
  showBaseStyles?: boolean;
}

function buildFormDefaultValue(properties: ProfileForm_ProfileFieldPropertyFragment[]) {
  return {
    fields: fromEntries(
      properties.map(({ field: { id, type, isExpirable }, files, value }) => [
        id,
        {
          type,
          profileTypeFieldId: id,
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
            : null,
        },
      ]),
    ),
  };
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

export const ProfileFormInner = Object.assign(
  forwardRef<ProfileFormInnerInstance, ProfileFormInnerProps>(function ProfileFormInner(
    {
      profile,
      onRefetch,
      petition,
      petitionId,
      filterProperties = () => true,
      showHiddenProperties = true,
      onSubmitSuccess,
      enableRouterHooks = true,
      onFormStateChange,
      showBaseStyles,
      ...props
    },
    ref,
  ) {
    const intl = useIntl();
    const showErrorDialog = useErrorDialog();
    const router = useRouter();
    const queryProfileId = enableRouterHooks ? router?.query.profileId : undefined;
    const profileId = profile.id;

    const [properties, hiddenProperties] = useMemo(
      () => partition(profile.properties, (property) => property.field.myPermission !== "HIDDEN"),
      [profile.properties],
    );

    const form = useForm<ProfileFormData>({
      defaultValues: buildFormDefaultValue(properties),
    });

    const { formState, reset, setFocus, setError, handleSubmit, getValues } = form;

    useEffectSkipFirst(() => {
      reset(buildFormDefaultValue(properties), { keepDirty: true, keepDirtyValues: true });
    }, [properties]);

    useEffect(() => {
      onFormStateChange?.(formState);
    }, [formState.errors, formState.dirtyFields, formState.isSubmitting]);

    const checkPath = useCallback(
      (path: string) => {
        if (!enableRouterHooks) {
          return false;
        }
        if (queryProfileId === profileId && path.includes(profileId)) {
          return false;
        }
        return formState.isDirty;
      },
      [formState.isDirty, queryProfileId, profileId, enableRouterHooks],
    );

    useAutoConfirmDiscardChangesDialog(checkPath);

    useTempQueryParam("field", async (fieldId) => {
      if (!enableRouterHooks) {
        return false;
      }
      try {
        setFocus(`fields.${fieldId}.content.value`);
      } catch {
        // ignore FILE .focus() errors
      }
    });

    const [updateProfileFieldValue] = useMutation(ProfileForm_updateProfileFieldValueDocument);

    const [createProfileFieldFileUploadLink] = useMutation(
      ProfileForm_createProfileFieldFileUploadLinkDocument,
    );
    const [profileFieldFileUploadComplete] = useMutation(
      ProfileForm_profileFieldFileUploadCompleteDocument,
    );

    const [copyFileReplyToProfileFieldFile] = useMutation(
      ProfileForm_copyFileReplyToProfileFieldFileDocument,
    );

    const [deleteProfileFieldFile] = useMutation(ProfileForm_deleteProfileFieldFileDocument);

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
    const isFormDisabled = !userCanCreateProfiles || profile.status !== "OPEN";

    const submitHandler = useCallback(
      async (formData: ProfileFormData) => {
        const editedFields = Object.entries(formData.fields)
          .filter(([fieldId, _]) => formState.dirtyFields.fields?.[fieldId])
          .map(([_, field]) => field);

        const [fileFields, fields] = partition(editedFields, (field) => field.type === "FILE");

        if (fields.length) {
          try {
            await updateProfileFieldValue({
              variables: {
                profileId: profile.id,
                fields: fields
                  .map(({ type, content, profileTypeFieldId, expiryDate }) => {
                    const prop = profile.properties?.find(
                      (prop) => prop.field.id === profileTypeFieldId,
                    );

                    const useValueAsExpiryDate =
                      prop?.field.type === "DATE" && prop?.field.options?.useReplyAsExpiryDate;

                    if (type === "BACKGROUND_CHECK" || type === "ADVERSE_MEDIA_SEARCH") {
                      if (
                        (content?.search || content?.entity || content?.articles) &&
                        prop?.field.isExpirable
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
                        content:
                          isNonNullish(content?.value) && content!.value !== "" ? content : null,
                        expiryDate:
                          content?.value && prop?.field.isExpirable
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
            fileFields,
            async (fileField) => {
              const { profileTypeFieldId, content, expiryDate: _expiryDate } = fileField;
              const prop = profile.properties?.find((prop) => prop.field.id === profileTypeFieldId);
              const events = content!.value as ProfileFormFieldFileAction[];
              const deleteFiles = events.filter(discriminator("type", "DELETE"));
              const addFiles = events.filter(discriminator("type", "ADD"));
              const updateExpiresAt = events.filter(discriminator("type", "UPDATE"));
              const copyFiles = events.filter(discriminator("type", "COPY"));

              const expiryDate = prop?.field.isExpirable ? _expiryDate : undefined;

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

              return { ...fileField, content: { value: [] } };
            },
            { concurrency: 1 },
          );
          const currentValues = getValues();
          reset(currentValues, {
            keepDirty: false,
            keepDirtyValues: false,
          });
          await onRefetch?.();
          onSubmitSuccess?.();
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
      },
      [
        formState.dirtyFields.fields,
        profile,
        updateProfileFieldValue,
        setError,
        createProfileFieldFileUploadLink,
        deleteProfileFieldFile,
        copyFileReplyToProfileFieldFile,
        profileFieldFileUploadComplete,
        petitionId,
        profileId,
        getValues,
        reset,
        onRefetch,
        onSubmitSuccess,
        showErrorDialog,
        intl,
      ],
    );

    useImperativeHandle(
      ref,
      () => ({
        handleSubmit: (onValid: (data: ProfileFormData) => Promise<void>) => {
          return handleSubmit(async (formData) => {
            await submitHandler(formData);
            await onValid(formData);
          });
        },
        formState,
        reset: () => {
          reset(buildFormDefaultValue(properties));
        },
      }),
      [handleSubmit, submitHandler, formState, reset, properties],
    );

    return (
      <Flex direction="column" {...props}>
        <Stack divider={<Divider />} spacing={4}>
          <FormProvider {...form}>
            <Stack as="ul" width="100%">
              {propertiesWithSuggestedFields
                .filter(([property]) => filterProperties(property))
                .map(([{ field, value, files }, suggestedFields]) => {
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
          </FormProvider>
          {showHiddenProperties && hiddenProperties.length ? (
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
  }),
  {
    fragments: {
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
      get Profile() {
        return gql`
          fragment ProfileFormInner_Profile on Profile {
            id
            status
            profileType {
              id
              name
              standardType
            }
            properties {
              ...ProfileFormInner_ProfileFieldProperty
            }
            relationships {
              id
            }
            petitionsTotalCount: associatedPetitions {
              totalCount
            }
            permanentDeletionAt
          }
          ${this.ProfileFieldProperty}
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
    },
  },
);
