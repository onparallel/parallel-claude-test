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
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useAutoConfirmDiscardChangesDialog } from "@parallel/components/organization/dialogs/ConfirmDiscardChangesDialog";
import { MoreOptionsMenuProfile } from "@parallel/components/profiles/MoreOptionsMenuProfile";
import { ProfileField } from "@parallel/components/profiles/fields/ProfileField";
import { ProfileFieldFileValue } from "@parallel/components/profiles/fields/ProfileFieldFileUpload";
import {
  ProfileDetail_ProfileFieldPropertyFragment,
  ProfileDetail_createProfileFieldFileUploadLinkDocument,
  ProfileDetail_deleteProfileFieldFileDocument,
  ProfileDetail_profileDocument,
  ProfileDetail_profileFieldFileUploadCompleteDocument,
  ProfileDetail_updateProfileFieldValueDocument,
  ProfileDetail_userDocument,
  ProfileTypeFieldType,
  UpdateProfileFieldValueInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useDeleteProfile } from "@parallel/utils/mutations/useDeleteProfile";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { withMetadata } from "@parallel/utils/withMetadata";
import pMap from "p-map";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, partition } from "remeda";

type ProfileDetailProps = UnwrapPromise<ReturnType<typeof ProfileDetail.getInitialProps>>;

export interface ProfilesFormData {
  fields: ({ type: ProfileTypeFieldType } & UpdateProfileFieldValueInput)[];
}

function ProfileDetail({ profileId }: ProfileDetailProps) {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQuery(ProfileDetail_userDocument);

  const {
    data: { profile },
    refetch,
  } = useAssertQuery(ProfileDetail_profileDocument, {
    variables: {
      profileId,
    },
  });

  const [properties, hiddenProperties] = partition(
    profile.properties,
    (property) => property.field.myPermission !== "HIDDEN"
  );

  const navigate = useHandleNavigation();
  const deleteProfile = useDeleteProfile();
  const handleDeleteProfile = async () => {
    try {
      await deleteProfile({ profileIds: [profile.id] });
      navigate("/app/profiles");
    } catch {}
  };

  const mapPropertiesToFields = (properties: ProfileDetail_ProfileFieldPropertyFragment[]) => {
    return properties.map((prop) => {
      const { id: profileTypeFieldId, type } = prop.field;
      let content = {};

      if (type === "FILE") {
        content = {
          value: [],
        };
      } else {
        content = prop.value?.content ?? {};
      }

      return {
        type,
        profileTypeFieldId,
        content,
      };
    });
  };

  const form = useForm<ProfilesFormData>({
    defaultValues: {
      fields: mapPropertiesToFields(properties),
    },
  });

  const { formState, reset, control, setFocus } = form;

  useAutoConfirmDiscardChangesDialog(formState.isDirty);

  const { fields } = useFieldArray({ name: "fields", control });

  const handleResetForm = (properties?: ProfileDetail_ProfileFieldPropertyFragment[]) => {
    reset(properties ? { fields: mapPropertiesToFields(properties) } : undefined);
  };

  useTempQueryParam("field", async (fieldId) => {
    const index = fields.findIndex((f) => f.profileTypeFieldId === fieldId)!;
    setFocus(`fields.${index}.content.value`);
  });

  const [updateProfileFieldValue] = useMutation(ProfileDetail_updateProfileFieldValueDocument);

  const [createProfileFieldFileUploadLink] = useMutation(
    ProfileDetail_createProfileFieldFileUploadLinkDocument
  );
  const [profileFieldFileUploadComplete] = useMutation(
    ProfileDetail_profileFieldFileUploadCompleteDocument
  );

  const [deleteProfileFieldFile] = useMutation(ProfileDetail_deleteProfileFieldFileDocument);

  const editedFieldsCount = formState.dirtyFields.fields?.filter((f) => isDefined(f)).length;

  const showErrorDialog = useErrorDialog();
  return (
    <AppLayout
      title={intl.formatMessage({
        id: "page.profile-details.title",
        defaultMessage: "Profile details",
      })}
      me={me}
      realMe={realMe}
      background="white"
    >
      <Flex minHeight="100%" direction="row">
        <Flex
          direction="column"
          as="form"
          height="100%"
          borderRight="1px solid"
          borderColor="gray.200"
          flex={1}
          maxWidth="container.xs"
          minWidth="container.3xs"
          onSubmit={form.handleSubmit(async (formData) => {
            try {
              const editedFields = formData.fields.filter(
                (_, i) => formState.dirtyFields.fields?.[i]?.content
              );

              const [fileFields, fields] = partition(
                editedFields,
                (field) => field.type === "FILE"
              );

              if (fields.length) {
                await updateProfileFieldValue({
                  variables: {
                    profileId: profile.id,
                    fields: fields.map(({ content, profileTypeFieldId }) => {
                      return {
                        profileTypeFieldId,
                        content: content?.value ? content : null,
                      };
                    }),
                  },
                });
              }

              await pMap(
                fileFields,
                async (fileField) => {
                  const { profileTypeFieldId, content } = fileField;
                  const events = content!.value as ProfileFieldFileValue[];

                  const [addFiles, deleteFiles] = partition(
                    events,
                    (event) => event.type === "ADD"
                  );

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
                          filename: event.file!.name,
                          size: event.file!.size,
                          contentType: event.file!.type,
                        })),
                      },
                    });

                    const { uploads } = data!.createProfileFieldFileUploadLink;

                    await pMap(
                      uploads,
                      async ({ presignedPostData, file }, i) => {
                        try {
                          const controller = new AbortController();
                          await uploadFile(addFiles[i].file!, presignedPostData, {
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

              const { data } = await refetch();

              const properties = (data?.profile?.properties.filter(
                (property) => property.field.myPermission !== "HIDDEN"
              ) ?? []) as ProfileDetail_ProfileFieldPropertyFragment[];

              handleResetForm(properties);
            } catch (e) {
              if (isApolloError(e, "MAX_FILES_EXCEEDED")) {
                await withError(
                  showErrorDialog({
                    message: intl.formatMessage({
                      id: "profilespage.profile-details.max-files-exceeded-error.message",
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
          <HStack
            padding={4}
            justify="space-between"
            minHeight="64px"
            borderBottom="1px solid"
            borderColor="gray.200"
          >
            <Heading
              as="h2"
              size="md"
              fontWeight={400}
              textStyle={profile.name ? undefined : "hint"}
            >
              {profile.name ||
                intl.formatMessage({
                  id: "generic.unnamed-profile",
                  defaultMessage: "Unnamed profile",
                })}
            </Heading>
          </HStack>
          {editedFieldsCount ? (
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
                {formState.isSubmitting ? (
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
                  {formState.isSubmitting ? null : (
                    <Button size="sm" bgColor="white" onClick={() => handleResetForm()}>
                      <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    colorScheme="purple"
                    type="submit"
                    isDisabled={
                      formState.isSubmitting || Object.keys(formState.errors).length !== 0
                    }
                  >
                    <FormattedMessage id="generic.save" defaultMessage="Save" />
                  </Button>
                </HStack>
              </AlertDescription>
            </Alert>
          ) : null}
          <Stack divider={<Divider />} padding={4} spacing={4} overflow="auto">
            <Stack spacing={4} width="100%">
              <Heading as="h3" size="sm" fontWeight={600} marginBottom={2}>
                <FormattedMessage
                  id="page.profile-details.about-this-profile-type"
                  defaultMessage="About this {type}"
                  values={{
                    type: (
                      <LocalizableUserTextRender
                        value={profile.profileType.name}
                        default={intl.formatMessage({
                          id: "generic.unnamed-profile-type",
                          defaultMessage: "Unnamed profile type",
                        })}
                      />
                    ),
                  }}
                />
              </Heading>
              <FormProvider {...form}>
                <Stack as="ul">
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
                        isDirty={!!formState.dirtyFields?.fields?.at(index)}
                        isInvalid={!!formState.errors.fields?.[index]}
                      />
                    );
                  })}
                </Stack>
              </FormProvider>
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
        <Stack spacing={0} backgroundColor="gray.50" flex={2} height="full">
          <Flex
            backgroundColor="white"
            paddingX={4}
            height={16}
            justifyContent="flex-end"
            alignItems="center"
            minWidth="0"
            borderBottom="1px solid"
            borderColor="gray.200"
          >
            <MoreOptionsMenuProfile onDelete={handleDeleteProfile} />
          </Flex>
          <Box></Box>
        </Stack>
      </Flex>
    </AppLayout>
  );
}

const _fragments = {
  get ProfileTypeField() {
    return gql`
      fragment ProfileDetail_ProfileTypeField on ProfileTypeField {
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
      fragment ProfileDetail_ProfileFieldFile on ProfileFieldFile {
        id
        ...ProfileField_ProfileFieldFile
      }
      ${ProfileField.fragments.ProfileFieldFile}
    `;
  },
  get ProfileFieldValue() {
    return gql`
      fragment ProfileDetail_ProfileFieldValue on ProfileFieldValue {
        id
        content
        createdAt
        ...ProfileField_ProfileFieldValue
      }
      ${ProfileField.fragments.ProfileFieldValue}
    `;
  },
  get ProfileFieldProperty() {
    return gql`
      fragment ProfileDetail_ProfileFieldProperty on ProfileFieldProperty {
        field {
          ...ProfileDetail_ProfileTypeField
        }
        files {
          ...ProfileDetail_ProfileFieldFile
        }
        value {
          ...ProfileDetail_ProfileFieldValue
        }
      }
      ${this.ProfileTypeField}
      ${this.ProfileFieldFile}
      ${this.ProfileFieldValue}
    `;
  },
  get Profile() {
    return gql`
      fragment ProfileDetail_Profile on Profile {
        id
        name
        profileType {
          id
          name
        }
        properties {
          ...ProfileDetail_ProfileFieldProperty
        }
        createdAt
        updatedAt
      }
      ${this.ProfileFieldProperty}
    `;
  },
};

const _queries = [
  gql`
    query ProfileDetail_user {
      ...AppLayout_Query
      metadata {
        country
        browserName
      }
    }
    ${AppLayout.fragments.Query}
  `,
  gql`
    query ProfileDetail_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        ...ProfileDetail_Profile
      }
    }
    ${_fragments.Profile}
  `,
];

const _mutations = [
  gql`
    mutation ProfileDetail_updateProfileFieldValue(
      $profileId: GID!
      $fields: [UpdateProfileFieldValueInput!]!
    ) {
      updateProfileFieldValue(profileId: $profileId, fields: $fields) {
        ...ProfileDetail_Profile
      }
    }
    ${_fragments.Profile}
  `,
  gql`
    mutation ProfileDetail_createProfileFieldFileUploadLink(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $data: [FileUploadInput!]!
      $expiresAt: DateTime
    ) {
      createProfileFieldFileUploadLink(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        data: $data
        expiresAt: $expiresAt
      ) {
        uploads {
          presignedPostData {
            ...uploadFile_AWSPresignedPostData
          }
          file {
            ...ProfileDetail_ProfileFieldFile
          }
        }
        property {
          ...ProfileDetail_ProfileFieldProperty
        }
      }
    }
    ${uploadFile.fragments.AWSPresignedPostData}
    ${_fragments.ProfileFieldProperty}
    ${_fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileDetail_profileFieldFileUploadComplete(
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
        ...ProfileDetail_ProfileFieldFile
      }
    }
    ${_fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileDetail_deleteProfileFieldFile(
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
    ${_fragments.ProfileFieldFile}
  `,
];

ProfileDetail.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const profileId = query.profileId as string;

  const [
    {
      data: { metadata },
    },
  ] = await Promise.all([
    fetchQuery(ProfileDetail_userDocument),
    fetchQuery(ProfileDetail_profileDocument, { variables: { profileId } }),
  ]);

  return { profileId, metadata };
};

export default compose(
  withMetadata,
  withDialogs,
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData
)(ProfileDetail);
