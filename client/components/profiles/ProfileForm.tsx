import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ExternalLinkIcon, EyeOffIcon, LockClosedIcon, SearchIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Divider } from "@parallel/components/common/Divider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
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
  UpdateProfileFieldValueInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { FORMATS } from "@parallel/utils/dates";
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
import { useCallback, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { fromEntries, isNonNullish, partition } from "remeda";
import { isDialogError } from "../common/dialogs/DialogProvider";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Link } from "../common/Link";
import { ProfileReference } from "../common/ProfileReference";
import { RestrictedFeatureAlert } from "../common/RestrictedFeatureAlert";
import { Spacer } from "../common/Spacer";
import { useImportFromExternalSourceDialog } from "./dialogs/ImportFromExternalSourceDialog";

export interface ProfileFormData {
  fields: Record<string, { type: ProfileTypeFieldType } & UpdateProfileFieldValueInput>;
}

interface ProfileFormProps {
  profile: ProfileForm_ProfileFragment;
  overlapsIntercomBadge?: boolean;
  petition?: ProfileForm_PetitionBaseFragment;
  petitionId?: string;
  onRecover?: () => void;
  onRefetch: () => MaybePromise<void>;
  includeLinkToProfile?: boolean;
  omitProfileTabNavigation?: boolean;
}

function buildFormDefaultValue(properties: ProfileForm_ProfileFieldPropertyFragment[]) {
  return {
    fields: fromEntries(
      properties.map(({ field: { id, type, isExpirable }, files, value }) => [
        id,
        {
          type,
          profileTypeFieldId: id,
          content: type === "FILE" ? { value: [] } : (value?.content ?? { value: null }),
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
};

function normalize(alias: string) {
  return alias.toLowerCase().replaceAll("_", "");
}

export const ProfileForm = Object.assign(
  chakraForwardRef<"div", ProfileFormProps>(function ProfileForm(
    {
      profile,
      onRefetch,
      overlapsIntercomBadge,
      petition,
      petitionId,
      onRecover,
      includeLinkToProfile,
      ...props
    },
    ref,
  ) {
    const intl = useIntl();
    const showErrorDialog = useErrorDialog();
    const router = useRouter();
    const queryProfileId = router.query.profileId;
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

    const checkPath = useCallback(
      (path: string) => {
        if (queryProfileId === profileId && path.includes(profileId)) {
          return false;
        }
        return formState.isDirty;
      },
      [formState.isDirty, queryProfileId, profileId],
    );

    useAutoConfirmDiscardChangesDialog(checkPath);

    useTempQueryParam("field", async (fieldId) => {
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

    const editedFieldsCount = formState.dirtyFields.fields
      ? Object.values(formState.dirtyFields.fields).filter((f) => isNonNullish(f)).length
      : 0;

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

    const showSelectProfileExternalSourceDialog = useImportFromExternalSourceDialog();
    const toast = useToast();
    async function handleCheckExternalSourcesClick() {
      try {
        await showSelectProfileExternalSourceDialog({
          profileType: profile.profileType,
          profileId: profile.id,
        });
        toast({
          title: intl.formatMessage({
            id: "component.profile-form.success-toast-header",
            defaultMessage: "Information imported successfully",
          }),
          description: intl.formatMessage({
            id: "component.profile-form.success-toast-description",
            defaultMessage:
              "The profile has been updated with the information from the external source",
          }),
          status: "success",
          isClosable: true,
        });
      } catch (e) {
        if (!isDialogError(e)) {
          throw e;
        }
      }
    }

    const userCanCreateProfiles = useHasPermission("PROFILES:CREATE_PROFILES");
    const isFormDisabled = !userCanCreateProfiles || profile.status !== "OPEN";
    return (
      <Flex
        ref={ref}
        direction="column"
        as="form"
        height="100%"
        flex={1}
        {...props}
        onSubmit={handleSubmit(async (formData) => {
          try {
            const editedFields = Object.entries(formData.fields)
              .filter(([fieldId, _]) => formState.dirtyFields.fields?.[fieldId])
              .map(([_, field]) => field);

            const [fileFields, fields] = partition(editedFields, (field) => field.type === "FILE");

            if (fields.length) {
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
            }

            await pMap(
              fileFields,
              async (fileField) => {
                const { profileTypeFieldId, content, expiryDate: _expiryDate } = fileField;
                const prop = profile.properties?.find(
                  (prop) => prop.field.id === profileTypeFieldId,
                );
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
              {
                concurrency: 1,
              },
            );

            const currentValues = getValues();
            reset(currentValues, {
              keepDirty: false,
              keepDirtyValues: false,
            });
            await onRefetch();
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
            } else if (isApolloError(e, "INVALID_PROFILE_FIELD_VALUE")) {
              const aggregatedErrors =
                (e.graphQLErrors[0].extensions!.aggregatedErrors as {
                  profileTypeFieldId: string;
                  code: string;
                }[]) ?? [];

              for (const err of aggregatedErrors) {
                setError(`fields.${err.profileTypeFieldId}.content.value`, { type: "validate" });
              }
            } else {
              throw e;
            }
          }
        })}
      >
        <Stack
          spacing={0}
          paddingX={4}
          paddingY={2}
          borderBottom="1px solid"
          borderColor="gray.200"
          minHeight="65px"
          justifyContent="center"
        >
          <HStack alignItems="center">
            <OverflownText as="h2" fontSize="xl" fontWeight={400}>
              <ProfileReference profile={profile} />
            </OverflownText>
            {profile.status === "CLOSED" ? (
              <Badge>
                <FormattedMessage
                  id="component.profile-form.closed-status"
                  defaultMessage="Closed"
                />
              </Badge>
            ) : profile.status === "DELETION_SCHEDULED" ? (
              <Badge colorScheme="red">
                <FormattedMessage
                  id="component.profile-form.deleted-status"
                  defaultMessage="Deleted"
                />
              </Badge>
            ) : null}
            {includeLinkToProfile ? (
              <Link href={`/app/profiles/${profile.id}/general`} display="flex">
                <ExternalLinkIcon fontSize="lg" />
              </Link>
            ) : null}
            <Spacer />
            {profile.profileType.standardType === "INDIVIDUAL" ||
            profile.profileType.standardType === "LEGAL_ENTITY" ? (
              <IconButtonWithTooltip
                isDisabled={isFormDisabled}
                onClick={handleCheckExternalSourcesClick}
                icon={<SearchIcon />}
                size="sm"
                label={intl.formatMessage({
                  id: "component.profile-form.check-external-sources-tooltip",
                  defaultMessage: "Check external data sources",
                })}
              />
            ) : null}
          </HStack>
          <HStack
            divider={<Divider isVertical height={3.5} color="gray.500" />}
            fontSize="sm"
            color="gray.600"
            lineHeight="18px"
          >
            <OverflownText>
              <LocalizableUserTextRender
                value={profile.profileType.name}
                default={intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                })}
              />
            </OverflownText>
            <Box whiteSpace="nowrap">
              <FormattedMessage
                id="component.profile-form.associated-profiles-count"
                defaultMessage="{count, plural, =1 {# association} other {# associations}}"
                values={{ count: profile.relationships.length }}
              />
            </Box>
            <Box whiteSpace="nowrap">
              <FormattedMessage
                id="generic.petition-count"
                defaultMessage="{count, plural, =1 {# parallel} other {# parallels}}"
                values={{ count: profile.petitionsTotalCount.totalCount }}
              />
            </Box>
          </HStack>
        </Stack>
        {profile.status === "DELETION_SCHEDULED" ? (
          <ProfileDeletedAlert
            onRecoverClick={onRecover}
            permanentDeletionAt={profile.permanentDeletionAt!}
          />
        ) : null}
        {!userCanCreateProfiles && profile.status === "OPEN" ? (
          <RestrictedFeatureAlert rounded="none">
            <FormattedMessage
              id="component.profile-form.cant-edit-profiles"
              defaultMessage="You don't have permission to edit profiles."
            />
          </RestrictedFeatureAlert>
        ) : null}
        {editedFieldsCount ? (
          <EditedFieldsAlert
            editedFieldsCount={editedFieldsCount}
            isSubmitting={formState.isSubmitting}
            hasErrors={Object.keys(formState.errors).length !== 0}
            onCancel={() => reset(buildFormDefaultValue(properties))}
          />
        ) : null}
        <Stack
          divider={<Divider />}
          padding={4}
          paddingBottom={overlapsIntercomBadge ? 24 : 4}
          spacing={4}
          overflow="auto"
        >
          <FormProvider {...form}>
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
                  />
                );
              })}
            </Stack>
          </FormProvider>
          {hiddenProperties.length ? (
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
          fragment ProfileForm_ProfileTypeField on ProfileTypeField {
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
          fragment ProfileForm_ProfileFieldFile on ProfileFieldFile {
            id
            ...ProfileFormField_ProfileFieldFile
          }
          ${ProfileFormField.fragments.ProfileFieldFile}
        `;
      },
      get ProfileFieldValue() {
        return gql`
          fragment ProfileForm_ProfileFieldValue on ProfileFieldValue {
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
          fragment ProfileForm_ProfileFieldProperty on ProfileFieldProperty {
            field {
              ...ProfileForm_ProfileTypeField
            }
            files {
              ...ProfileForm_ProfileFieldFile
            }
            value {
              ...ProfileForm_ProfileFieldValue
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
          fragment ProfileForm_Profile on Profile {
            id
            status
            ...ProfileReference_Profile
            profileType {
              id
              name
              standardType
              ...useImportFromExternalSourceDialog_ProfileType
            }
            properties {
              ...ProfileForm_ProfileFieldProperty
            }
            petitionsTotalCount: associatedPetitions {
              totalCount
            }
            relationships {
              id
            }
            permanentDeletionAt
          }
          ${ProfileReference.fragments.Profile}
          ${this.ProfileFieldProperty}
          ${useImportFromExternalSourceDialog.fragments.ProfileType}
        `;
      },
      get PetitionBase() {
        return gql`
          fragment ProfileForm_PetitionBase on PetitionBase {
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

function ProfileDeletedAlert({
  permanentDeletionAt,
  onRecoverClick,
}: {
  permanentDeletionAt: string;
  onRecoverClick?: () => void;
}) {
  const intl = useIntl();

  const userCanRecoverProfile = useHasPermission("PROFILES:CLOSE_PROFILES");
  return (
    <Alert status="error">
      <AlertIcon />
      <HStack>
        <AlertDescription fontSize="sm">
          <FormattedMessage
            id="component.profile-form.recover-profile-alert"
            defaultMessage="This profile will be permanently deleted on {date}."
            values={{
              date: intl.formatDate(permanentDeletionAt, FORMATS.LL),
            }}
          />
        </AlertDescription>
        {userCanRecoverProfile ? (
          <Center>
            <Button backgroundColor="white" onClick={onRecoverClick} fontWeight={500}>
              <FormattedMessage
                id="component.profile-form.recover-button"
                defaultMessage="Recover"
              />
            </Button>
          </Center>
        ) : null}
      </HStack>
    </Alert>
  );
}

function EditedFieldsAlert({
  isSubmitting,
  hasErrors,
  editedFieldsCount,
  onCancel,
}: {
  isSubmitting: boolean;
  hasErrors: boolean;
  editedFieldsCount: number;
  onCancel: () => void;
}) {
  return (
    <Alert>
      <HStack flex={1}>
        {isSubmitting ? (
          <AlertDescription flex={1} fontSize="sm">
            <HStack>
              <Spinner
                thickness="3px"
                speed="0.65s"
                emptyColor="transparent"
                color="blue.500"
                width={4}
                height={4}
              />
              <Box flex={1}>
                <FormattedMessage
                  id="page.profile-details.saving-changes"
                  defaultMessage="Saving {count, plural, =1 {# change} other{# changes}}..."
                  values={{
                    count: editedFieldsCount,
                  }}
                />
              </Box>
            </HStack>
          </AlertDescription>
        ) : (
          <AlertDescription flex={1} fontSize="sm">
            <FormattedMessage
              id="page.profile-details.n-fields-edited"
              defaultMessage="{count, plural, =1 {# property} other{# properties}} changed"
              values={{
                count: editedFieldsCount,
              }}
            />
          </AlertDescription>
        )}
        <HStack>
          {isSubmitting ? null : (
            <Button size="sm" bgColor="white" onClick={onCancel}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          )}
          <Button
            size="sm"
            colorScheme="purple"
            type="submit"
            isDisabled={isSubmitting || hasErrors}
          >
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          </Button>
        </HStack>
      </HStack>
    </Alert>
  );
}

const _mutations = [
  gql`
    mutation ProfileForm_copyFileReplyToProfileFieldFile(
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
        ...ProfileForm_ProfileFieldFile
      }
    }
    ${ProfileForm.fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileForm_updateProfileFieldValue(
      $profileId: GID!
      $fields: [UpdateProfileFieldValueInput!]!
    ) {
      updateProfileFieldValue(profileId: $profileId, fields: $fields) {
        ...ProfileForm_Profile
      }
    }
    ${ProfileForm.fragments.Profile}
  `,
  gql`
    mutation ProfileForm_createProfileFieldFileUploadLink(
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
            ...ProfileForm_ProfileFieldFile
          }
        }
        property {
          ...ProfileForm_ProfileFieldProperty
        }
      }
    }
    ${uploadFile.fragments.AWSPresignedPostData}
    ${ProfileForm.fragments.ProfileFieldProperty}
    ${ProfileForm.fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileForm_profileFieldFileUploadComplete(
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
        ...ProfileForm_ProfileFieldFile
      }
    }
    ${ProfileForm.fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileForm_deleteProfileFieldFile(
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
