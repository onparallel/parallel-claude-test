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
import { BellIcon, BellOnIcon, EyeOffIcon, LockClosedIcon } from "@parallel/chakra/icons";
import { Divider } from "@parallel/components/common/Divider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useAutoConfirmDiscardChangesDialog } from "@parallel/components/organization/dialogs/ConfirmDiscardChangesDialog";
import { FakeProfileTables } from "@parallel/components/profiles/FakeProfileTables";
import { MoreOptionsMenuProfile } from "@parallel/components/profiles/MoreOptionsMenuProfile";
import { ProfileSubscribers } from "@parallel/components/profiles/ProfileSubscribers";
import { useProfileSubscribersDialog } from "@parallel/components/profiles/dialogs/ProfileSubscribersDialog";
import { ProfileField } from "@parallel/components/profiles/fields/ProfileField";
import { ProfileFieldFileAction } from "@parallel/components/profiles/fields/ProfileFieldFileUpload";
import {
  ProfileDetail_ProfileFieldPropertyFragment,
  ProfileDetail_createProfileFieldFileUploadLinkDocument,
  ProfileDetail_deleteProfileFieldFileDocument,
  ProfileDetail_profileDocument,
  ProfileDetail_profileFieldFileUploadCompleteDocument,
  ProfileDetail_subscribeToProfileDocument,
  ProfileDetail_unsubscribeFromProfileDocument,
  ProfileDetail_updateProfileFieldValueDocument,
  ProfileDetail_userDocument,
  ProfileTypeFieldType,
  UpdateProfileFieldValueInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { discriminator } from "@parallel/utils/discriminator";
import { useDeleteProfile } from "@parallel/utils/mutations/useDeleteProfile";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { withMetadata } from "@parallel/utils/withMetadata";
import pMap from "p-map";
import { useFieldArray, useForm } from "react-hook-form";
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
  } = useForm<ProfilesFormData>({
    defaultValues: {
      fields: mapPropertiesToFields(properties),
    },
  });

  useAutoConfirmDiscardChangesDialog(formState.isDirty);

  const { fields } = useFieldArray({ name: "fields", control });

  useEffectSkipFirst(() => {
    handleResetForm(properties);
  }, [profile]);

  const handleResetForm = (properties?: ProfileDetail_ProfileFieldPropertyFragment[]) => {
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

  const [updateProfileFieldValue] = useMutation(ProfileDetail_updateProfileFieldValueDocument);

  const [createProfileFieldFileUploadLink] = useMutation(
    ProfileDetail_createProfileFieldFileUploadLinkDocument
  );
  const [profileFieldFileUploadComplete] = useMutation(
    ProfileDetail_profileFieldFileUploadCompleteDocument
  );

  const [deleteProfileFieldFile] = useMutation(ProfileDetail_deleteProfileFieldFileDocument);

  const editedFieldsCount = formState.dirtyFields.fields?.filter((f) => isDefined(f)).length;

  const [subscribeToProfile] = useMutation(ProfileDetail_subscribeToProfileDocument);
  const [unsubscribeFromProfile] = useMutation(ProfileDetail_unsubscribeFromProfileDocument);
  const iAmSubscribed = profile.subscribers.some(({ user }) => user.isMe);

  const handleMySubscription = async () => {
    if (iAmSubscribed) {
      await unsubscribeFromProfile({
        variables: {
          profileIds: [profile.id],
          userIds: [me.id],
        },
      });
    } else {
      await subscribeToProfile({
        variables: {
          profileIds: [profile.id],
          userIds: [me.id],
        },
      });
    }
  };

  const showSubscribersDialog = useProfileSubscribersDialog();

  const handleSubscribersClick = async () => {
    try {
      await showSubscribersDialog({
        profileIds: [profile.id],
        me,
        users: profile.subscribers.map(({ user }) => user),
        isSubscribed: profile.subscribers.some(({ user }) => user.isMe),
      });
    } catch {}
  };

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
          onSubmit={handleSubmit(async (formData) => {
            try {
              const editedFields = formData.fields.filter(
                (_, i) => formState.dirtyFields.fields?.[i]
              );

              const [fileFields, fields] = partition(
                editedFields,
                (field) => field.type === "FILE"
              );

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
          <Stack divider={<Divider />} padding={4} spacing={4} overflow="auto">
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
        <Stack spacing={0} backgroundColor="gray.50" flex={2} height="full" overflow="auto">
          <HStack
            backgroundColor="white"
            paddingX={4}
            minHeight="65px"
            justifyContent="flex-end"
            alignItems="center"
            minWidth="0"
            borderBottom="1px solid"
            borderColor="gray.200"
          >
            <ProfileSubscribers users={profile.subscribers.map(({ user }) => user)} />
            <ResponsiveButtonIcon
              icon={iAmSubscribed ? <BellOnIcon boxSize={5} /> : <BellIcon boxSize={5} />}
              colorScheme={iAmSubscribed ? undefined : "primary"}
              label={
                iAmSubscribed
                  ? intl.formatMessage({
                      id: "page.profile-details.unsubscribe",
                      defaultMessage: "Unsubscribe",
                    })
                  : intl.formatMessage({
                      id: "page.profile-details.subscribe",
                      defaultMessage: "Subscribe",
                    })
              }
              onClick={handleMySubscription}
            />
            <MoreOptionsMenuProfile
              onDelete={handleDeleteProfile}
              onSubscribe={handleSubscribersClick}
            />
          </HStack>

          <FakeProfileTables me={me} />
        </Stack>
      </Flex>
    </AppLayout>
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
  get ProfileSubscription() {
    return gql`
      fragment ProfileDetail_ProfileSubscription on ProfileSubscription {
        id
        user {
          id
          isMe
          ...ProfileSubscribers_User
          ...useProfileSubscribersDialog_User
        }
      }
      ${ProfileSubscribers.fragments.User}
      ${useProfileSubscribersDialog.fragments.User}
    `;
  },
  get ProfileFieldValue() {
    return gql`
      fragment ProfileDetail_ProfileFieldValue on ProfileFieldValue {
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
        subscribers {
          ...ProfileDetail_ProfileSubscription
        }
        createdAt
        updatedAt
      }
      ${this.ProfileFieldProperty}
      ${this.ProfileSubscription}
    `;
  },
};

const _queries = [
  gql`
    query ProfileDetail_user {
      ...AppLayout_Query
      me {
        ...ProfileSubscribers_User
      }
      metadata {
        country
        browserName
      }
    }
    ${AppLayout.fragments.Query}
    ${ProfileSubscribers.fragments.User}
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
    mutation ProfileDetail_subscribeToProfile($profileIds: [GID!]!, $userIds: [GID!]!) {
      subscribeToProfile(profileIds: $profileIds, userIds: $userIds) {
        ...ProfileDetail_Profile
      }
    }
    ${_fragments.Profile}
  `,
  gql`
    mutation ProfileDetail_unsubscribeFromProfile($profileIds: [GID!]!, $userIds: [GID!]!) {
      unsubscribeFromProfile(profileIds: $profileIds, userIds: $userIds) {
        ...ProfileDetail_Profile
      }
    }
    ${_fragments.Profile}
  `,
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
  withDialogs,
  withMetadata,
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData
)(ProfileDetail);
