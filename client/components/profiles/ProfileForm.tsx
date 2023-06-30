import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { EyeOffIcon, LockClosedIcon } from "@parallel/chakra/icons";
import { Divider } from "@parallel/components/common/Divider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { useAutoConfirmDiscardChangesDialog } from "@parallel/components/organization/dialogs/ConfirmDiscardChangesDialog";
import { ProfileField } from "@parallel/components/profiles/fields/ProfileField";
import { ProfileFieldFileAction } from "@parallel/components/profiles/fields/ProfileFieldFileUpload";
import {
  ProfileForm_ProfileFieldPropertyFragment,
  ProfileForm_ProfileFragment,
  ProfileForm_createProfileFieldFileUploadLinkDocument,
  ProfileForm_deleteProfileFieldFileDocument,
  ProfileForm_profileFieldFileUploadCompleteDocument,
  ProfileForm_updateProfileFieldValueDocument,
  ProfileTypeFieldType,
  UpdateProfileFieldValueInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { discriminator } from "@parallel/utils/discriminator";
import { withError } from "@parallel/utils/promises/withError";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import pMap from "p-map";
import { useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, partition } from "remeda";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { chakraForwardRef } from "@parallel/chakra/utils";

export interface ProfileFormData {
  fields: ({ type: ProfileTypeFieldType } & UpdateProfileFieldValueInput)[];
}

interface ProfileFormProps {
  profile: ProfileForm_ProfileFragment;
  refetch: () => void;
}

export const ProfileForm = Object.assign(
  chakraForwardRef<"div", ProfileFormProps>(function ProfileForm(
    { profile, refetch, ...props },
    ref
  ) {
    const intl = useIntl();
    const showErrorDialog = useErrorDialog();
    const profileId = profile.id;

    const [properties, hiddenProperties] = partition(
      profile.properties,
      (property) => property.field.myPermission !== "HIDDEN"
    );

    const mapPropertiesToFields = (properties: ProfileForm_ProfileFieldPropertyFragment[]) => {
      return properties.map((prop) => {
        const { id: profileTypeFieldId, type, isExpirable } = prop.field;
        let content = {};
        let expiryDate = null;

        if (type === "FILE") {
          content = {
            value: [],
          };
          expiryDate = prop.files?.[0]?.expiryDate;
        } else {
          content = prop.value?.content ?? { value: "" };
          expiryDate = prop.value?.expiryDate;
        }

        return {
          type,
          profileTypeFieldId,
          content,
          expiryDate: expiryDate && isExpirable ? expiryDate : null,
        };
      });
    };

    const {
      register,
      formState,
      reset,
      control,
      setFocus,
      setError,
      clearErrors,
      handleSubmit,
      setValue,
    } = useForm<ProfileFormData>({
      defaultValues: {
        fields: mapPropertiesToFields(properties),
      },
    });

    useAutoConfirmDiscardChangesDialog(formState.isDirty);

    const { fields } = useFieldArray({ name: "fields", control });

    useEffectSkipFirst(() => {
      handleResetForm(properties);
    }, [profile]);

    const handleResetForm = (properties?: ProfileForm_ProfileFieldPropertyFragment[]) => {
      reset(properties ? { fields: mapPropertiesToFields(properties) } : undefined);
    };

    useTempQueryParam("field", async (fieldId) => {
      try {
        const index = fields.findIndex((f) => f.profileTypeFieldId === fieldId)!;
        setFocus(`fields.${index}.content.value`);
      } catch {
        // ignore FILE .focus() errors
      }
    });

    const [updateProfileFieldValue] = useMutation(ProfileForm_updateProfileFieldValueDocument);

    const [createProfileFieldFileUploadLink] = useMutation(
      ProfileForm_createProfileFieldFileUploadLinkDocument
    );
    const [profileFieldFileUploadComplete] = useMutation(
      ProfileForm_profileFieldFileUploadCompleteDocument
    );

    const [deleteProfileFieldFile] = useMutation(ProfileForm_deleteProfileFieldFileDocument);

    const editedFieldsCount = formState.dirtyFields.fields?.filter((f) => isDefined(f)).length;

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
            const editedFields = formData.fields.filter(
              (_, i) => formState.dirtyFields.fields?.[i]
            );

            const [fileFields, fields] = partition(editedFields, (field) => field.type === "FILE");

            if (fields.length) {
              await updateProfileFieldValue({
                variables: {
                  profileId: profile.id,
                  fields: fields.map(({ content, profileTypeFieldId, expiryDate }) => {
                    const prop = profile.properties?.find(
                      (prop) => prop.field.id === profileTypeFieldId
                    );

                    const useValueAsExpiryDate =
                      prop?.field.type === "DATE" && prop?.field.options?.useReplyAsExpiryDate;

                    return {
                      profileTypeFieldId,
                      content: content?.value ? content : null,
                      expiryDate:
                        content?.value && prop?.field.isExpirable
                          ? useValueAsExpiryDate
                            ? content?.value || null
                            : expiryDate || null
                          : undefined,
                    };
                  }),
                },
              });
            }

            await pMap(
              fileFields,
              async (fileField) => {
                const { profileTypeFieldId, content, expiryDate } = fileField;
                const events = content!.value as ProfileFieldFileAction[];
                const deleteFiles = events.filter(discriminator("type", "DELETE"));
                const addFiles = events.filter(discriminator("type", "ADD"));
                const updateExpiresAt = events.filter(discriminator("type", "UPDATE"));

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
                    }
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
              }
            );

            await refetch();
          } catch (e) {
            if (isApolloError(e, "MAX_FILES_EXCEEDED")) {
              await withError(
                showErrorDialog({
                  message: intl.formatMessage({
                    id: "component.profile-form.max-files-exceeded-error.message",
                    defaultMessage:
                      "You exceeded the maximum amount of files you can upload on the field.",
                  }),
                })
              );
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
          <OverflownText
            as="h2"
            fontSize="xl"
            fontWeight={400}
            textStyle={profile.name ? undefined : "hint"}
          >
            {profile.name ||
              intl.formatMessage({
                id: "generic.unnamed-profile",
                defaultMessage: "Unnamed profile",
              })}
          </OverflownText>
          <Box fontSize="sm" color="gray.600" lineHeight="18px">
            <LocalizableUserTextRender
              value={profile.profileType.name}
              default={intl.formatMessage({
                id: "generic.unnamed-profile-type",
                defaultMessage: "Unnamed profile type",
              })}
            />
          </Box>
        </Stack>
        {editedFieldsCount ? (
          <EditedFieldsAlert
            editedFieldsCount={editedFieldsCount}
            isSubmitting={formState.isSubmitting}
            hasErrors={Object.keys(formState.errors).length !== 0}
            onCancel={() => handleResetForm()}
          />
        ) : null}
        <Stack divider={<Divider />} padding={4} paddingBottom={24} spacing={4} overflow="auto">
          <Stack as="ul" width="100%">
            {properties.map(({ field, value, files }, i) => {
              const index = fields.findIndex((f) => f.profileTypeFieldId === field.id)!;

              return (
                <ProfileField
                  key={field.id}
                  profileId={profileId}
                  field={field}
                  value={value}
                  files={files}
                  index={index}
                  setValue={setValue}
                  control={control}
                  register={register}
                  setError={setError}
                  clearErrors={clearErrors}
                />
              );
            })}
          </Stack>
          {hiddenProperties.length ? (
            <Stack width="sm" spacing={4}>
              <HStack>
                <LockClosedIcon />
                <Heading as="h3" size="sm" fontWeight={600}>
                  <FormattedMessage
                    id="page.profile-details.hidden-properties"
                    defaultMessage="Hidden properties"
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
            ...ProfileField_ProfileTypeField
          }
          ${ProfileField.fragments.ProfileTypeField}
        `;
      },
      get ProfileFieldFile() {
        return gql`
          fragment ProfileForm_ProfileFieldFile on ProfileFieldFile {
            id
            ...ProfileField_ProfileFieldFile
          }
          ${ProfileField.fragments.ProfileFieldFile}
        `;
      },
      get ProfileFieldValue() {
        return gql`
          fragment ProfileForm_ProfileFieldValue on ProfileFieldValue {
            id
            content
            createdAt
            expiryDate
            ...ProfileField_ProfileFieldValue
          }
          ${ProfileField.fragments.ProfileFieldValue}
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
          }
          ${this.ProfileTypeField}
          ${this.ProfileFieldFile}
          ${this.ProfileFieldValue}
        `;
      },
      get Profile() {
        return gql`
          fragment ProfileForm_Profile on Profile {
            id
            name
            profileType {
              id
              name
            }
            properties {
              ...ProfileForm_ProfileFieldProperty
            }
          }
          ${this.ProfileFieldProperty}
        `;
      },
    },
  }
);

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
    <Alert overflow="visible">
      <AlertDescription
        flex="1"
        fontSize="sm"
        display="flex"
        position="sticky"
        top={0}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        {isSubmitting ? (
          <HStack>
            <Spinner
              thickness="3px"
              speed="0.65s"
              emptyColor="transparent"
              color="blue.500"
              width={4}
              height={4}
            />
            <Text>
              <FormattedMessage
                id="page.profile-details.saving-changes"
                defaultMessage="Saving {count, plural, =1 {# change} other{# changes}}..."
                values={{
                  count: editedFieldsCount,
                }}
              />
            </Text>
          </HStack>
        ) : (
          <FormattedMessage
            id="page.profile-details.n-fields-edited"
            defaultMessage="{count, plural, =1 {# property} other{# properties}} changed"
            values={{
              count: editedFieldsCount,
            }}
          />
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
      </AlertDescription>
    </Alert>
  );
}

const _mutations = [
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
