import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { Center, Grid, Skeleton, Spinner } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, EditIcon, RepeatIcon, SaveIcon } from "@parallel/chakra/icons";
import { AlertPopover } from "@parallel/components/common/AlertPopover";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import {
  ProfileSelect,
  ProfileSelectRerenderProvider,
} from "@parallel/components/common/ProfileSelect";
import { RestrictedFeatureAlert } from "@parallel/components/common/RestrictedFeatureAlert";
import { useCreateProfileDialog } from "@parallel/components/profiles/dialogs/CreateProfileDialog";
import { Box, Button, HStack, Stack, Text } from "@parallel/components/ui";
import {
  ArchiveFieldGroupReplyIntoProfileConflictResolutionInput,
  ArchiveFieldGroupReplyIntoProfileExpirationInput,
  useArchiveRepliesIntoProfileDialog_archiveFieldGroupReplyIntoProfileDocument,
  useArchiveRepliesIntoProfileDialog_petitionDocument,
  useArchiveRepliesIntoProfileDialog_PetitionFieldFragment,
  useArchiveRepliesIntoProfileDialog_PetitionFieldReplyFragment,
  useArchiveRepliesIntoProfileDialog_PetitionFragment,
  useArchiveRepliesIntoProfileDialog_profileDocument,
  useArchiveRepliesIntoProfileDialog_ProfileFragment,
  useArchiveRepliesIntoProfileDialog_profileTypeDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { FieldOptions, UpdateProfileOnClose } from "@parallel/utils/fieldOptions";
import { groupFieldsWithProfileTypes } from "@parallel/utils/groupFieldsWithProfileTypes";
import { useReopenProfile } from "@parallel/utils/mutations/useReopenProfile";
import { useCheckUpdateProfile } from "@parallel/utils/useCheckUpdateProfile";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useProfileNamePreview } from "@parallel/utils/useProfileNamePreview";
import { useRerender } from "@parallel/utils/useRerender";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { flatMap, isNonNullish, isNullish, pipe, unique, uniqueBy, zip } from "remeda";
import { useConfigureExpirationsDateDialog } from "./ConfigureExpirationsDateDialog";
import { useConfirmCloseArchiveReplyIntoProfileDialog } from "./ConfirmCloseArchiveReplyIntoProfileDialog";
import { useResolveProfilePropertiesConflictsDialog } from "./ResolveProfilePropertiesConflictsDialog";
import { useRestrictedProfilePropertiesDialog } from "./RestrictedProfilePropertiesDialog";
import { useUniqueValueConflictDialog } from "./UniqueValueConflictDialog";
import { useUpdateProfileFieldValueOnClosePetitionDialog } from "./UpdateProfileFieldValueOnClosePetitionDialog";

type ArchiveRepliesIntoProfileDialogSteps = {
  LOADING: {
    petitionId: string;
    onRefetch: () => void;
  };
  REPLIES_TO_PROFILE: {
    petition: useArchiveRepliesIntoProfileDialog_PetitionFragment;
    onRefetch: () => void;
  };
};

// ================================
// LOADING PETITION STEP
// ================================

function ArchiveRepliesIntoProfileLoadingDialog({
  petitionId,
  onRefetch,
  onStep,
  ...props
}: WizardStepDialogProps<ArchiveRepliesIntoProfileDialogSteps, "LOADING", void>) {
  const { data, loading } = useQuery(useArchiveRepliesIntoProfileDialog_petitionDocument, {
    variables: { petitionId },
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (
      !loading &&
      isNonNullish(data) &&
      isNonNullish(data.petition) &&
      data.petition.__typename === "Petition"
    ) {
      onStep("REPLIES_TO_PROFILE", {
        petition: data.petition,
        onRefetch,
      });
    }
  }, [loading, data, onStep]);

  return (
    <ConfirmDialog
      size="4xl"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      header={<Skeleton height="24px" width="240px" />}
      body={
        <Center padding={8} minHeight="200px">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="primary.500"
            size="xl"
          />
        </Center>
      }
      confirm={<></>}
      cancel={
        <Button disabled>
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      {...props}
    />
  );
}

// ================================
// REPLIES TO PROFILE STEP
// ================================

function ArchiveRepliesIntoProfileRepliesToProfileDialog({
  petition,
  onRefetch,
  onStep,
  ...props
}: WizardStepDialogProps<ArchiveRepliesIntoProfileDialogSteps, "REPLIES_TO_PROFILE", void>) {
  const userCanCreateProfiles = useHasPermission("PROFILES:CREATE_PROFILES");

  const unsavedSelectedProfiles = useRef<string[]>([]);

  const fieldGroupsWithProfileTypes = zip(petition.fields, useFieldLogic(petition))
    .filter(
      ([field, { isVisible }]) =>
        isVisible &&
        field.type === "FIELD_GROUP" &&
        field.isLinkedToProfileType &&
        field.replies.length > 0,
    )
    .map(([field]) => field);

  // Get groups as array of arrays
  const groupedFieldsArrays = groupFieldsWithProfileTypes(fieldGroupsWithProfileTypes);

  const addUnsavedSelectedProfile = (profileId: string) => {
    unsavedSelectedProfiles.current = unique([...unsavedSelectedProfiles.current, profileId]);
  };

  const removeUnsavedSelectedProfile = (profileId: string) => {
    unsavedSelectedProfiles.current = unsavedSelectedProfiles.current.filter(
      (id) => id !== profileId,
    );
  };

  const showConfirmCloseArchiveReplyIntoProfileDialog =
    useConfirmCloseArchiveReplyIntoProfileDialog();

  const handleClose = async () => {
    try {
      if (unsavedSelectedProfiles.current.length > 0) {
        await showConfirmCloseArchiveReplyIntoProfileDialog();
      }
      props.onReject();
    } catch {}
  };

  return (
    <ConfirmDialog
      size="4xl"
      closeOnEsc={false}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      onEsc={handleClose}
      onCloseButtonClick={handleClose}
      header={
        <FormattedMessage
          id="component.associate-and-fill-profile-to-parallel-dialog.header"
          defaultMessage="Associate {count, plural, =1{profile} other{profiles}}"
          values={{ count: groupedFieldsArrays.length }}
        />
      }
      body={
        <Stack gap={4}>
          {userCanCreateProfiles ? null : (
            <RestrictedFeatureAlert>
              <FormattedMessage
                id="component.associate-and-fill-profile-to-parallel-dialog.cant-create-profiles"
                defaultMessage="You don't have permission to create or save the information in profiles."
              />
            </RestrictedFeatureAlert>
          )}
          <Text>
            <FormattedMessage
              id="component.associate-and-fill-profile-to-parallel-dialog.body"
              defaultMessage="Select in which profile you want to save the information of each group."
            />
          </Text>
          <ProfileSelectRerenderProvider>
            <Grid gap={2} templateColumns="2fr 3fr auto" alignItems="center">
              {groupedFieldsArrays.map((fields) => {
                // We have multiple fields ONLY when is a merged FIELD_GROUP with same profile type and group name
                const field = fields[0];

                return field.replies.map((reply, index) => {
                  return (
                    <ArchiveRepliesIntoProfileRow
                      key={field.id + index}
                      index={index}
                      petition={petition}
                      fields={fields}
                      replies={
                        fields.length > 1 ? fields.flatMap((field) => field.replies) : [reply]
                      }
                      onSelectProfile={addUnsavedSelectedProfile}
                      onSaveProfile={removeUnsavedSelectedProfile}
                      onRefetch={onRefetch}
                      isDisabled={!userCanCreateProfiles}
                    />
                  );
                });
              })}
            </Grid>
          </ProfileSelectRerenderProvider>
        </Stack>
      }
      confirm={<></>}
      cancel={
        <Button onClick={handleClose}>
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      {...props}
    />
  );
}

interface ArchiveRepliesIntoProfileRowProps {
  index: number;
  petition: useArchiveRepliesIntoProfileDialog_PetitionFragment;
  fields: useArchiveRepliesIntoProfileDialog_PetitionFieldFragment[];
  replies: useArchiveRepliesIntoProfileDialog_PetitionFieldReplyFragment[];
  onSelectProfile: (profileId: string) => void;
  onSaveProfile: (profileId: string) => void;
  onRefetch: () => void;
  isDisabled?: boolean;
}

function ArchiveRepliesIntoProfileRow({
  index,
  petition,
  fields,
  replies, // all replies from merged FIELD_GROUP
  onSelectProfile,
  onSaveProfile,
  onRefetch,
  isDisabled,
}: ArchiveRepliesIntoProfileRowProps) {
  const intl = useIntl();
  const [key, rerender] = useRerender();

  const fieldLogic = useFieldLogic(petition);

  const mergedOptions = {} as FieldOptions["FIELD_GROUP"];
  for (const field of fields) {
    const options = field.options as FieldOptions["FIELD_GROUP"];
    mergedOptions.groupName = options.groupName;
    mergedOptions.updateProfileOnClose = uniqueBy(
      [...(mergedOptions.updateProfileOnClose || []), ...(options.updateProfileOnClose || [])],
      (update) => update.profileTypeFieldId,
    );
  }

  const field = fields[0];
  const reply = replies[0];

  const { data, loading, refetch } = useQuery(useArchiveRepliesIntoProfileDialog_profileDocument, {
    variables: { profileId: reply.associatedProfile?.id ?? "" },
    skip: isNullish(reply.associatedProfile?.id),
    fetchPolicy: "cache-and-network",
  });
  const { data: profileTypeData } = useQuery(
    useArchiveRepliesIntoProfileDialog_profileTypeDocument,
    {
      variables: { profileTypeId: field.profileType?.id ?? "" },
      skip: isNullish(field.profileType?.id),
      fetchPolicy: "cache-and-network",
    },
  );

  const profile = data?.profile ?? null;
  const profileType = profileTypeData?.profileType ?? null;

  const allPetitionFields = pipe(
    petition.fields,
    flatMap((f) => [f, ...(f.children ?? [])]),
  );

  const savedProfile = useRef<useArchiveRepliesIntoProfileDialog_ProfileFragment | null>(
    profile ?? null,
  );

  const [state, setState] = useState<{
    selectedProfileId: string | null;
    isSaved: boolean;
    isEditing: boolean;
  }>({
    selectedProfileId: profile?.id ?? null,
    isSaved: isNonNullish(profile),
    isEditing: false,
  });

  useEffect(() => {
    if (
      !loading &&
      isNonNullish(data) &&
      isNonNullish(data.profile) &&
      state.selectedProfileId !== data.profile?.id
    ) {
      setState(() => ({
        selectedProfileId: data.profile?.id ?? null,
        isSaved: true,
        isEditing: false,
      }));

      savedProfile.current = data.profile;
    }
  }, [data, loading, refetch]);

  useEffect(() => {
    if (isNonNullish(state.selectedProfileId)) {
      if (
        !state.isSaved ||
        (state.isEditing && savedProfile.current?.id !== state.selectedProfileId)
      ) {
        onSelectProfile(reply.id);
      } else {
        onSaveProfile(reply.id);
      }
    }
  }, [state.selectedProfileId, state.isSaved, state.isEditing, savedProfile.current]);

  const profileName = useProfileNamePreview({
    profileType: profileType,
    updateProfileOnClose: mergedOptions.updateProfileOnClose,
    petition,
    replies,
    fieldLogic,
  });

  const showConfigureUpdateProfileOnCloseDialog = useUpdateProfileFieldValueOnClosePetitionDialog();
  // Called at the end of the archive process to update the profile on close if needed
  async function handleUpdateProfileOnClose({
    petitionFieldId,
    petitionId,
    profileId,
    options,
  }: {
    petitionFieldId: string;
    petitionId: string;
    profileId: string;
    options: FieldOptions["FIELD_GROUP"];
  }) {
    const profileTypeFieldIds =
      options.updateProfileOnClose
        ?.filter((update) => update?.source?.type === "ASK_USER")
        .map((update) => update.profileTypeFieldId) ?? [];

    if (profileTypeFieldIds.length === 0) return;

    try {
      await showConfigureUpdateProfileOnCloseDialog({
        petitionFieldId,
        petitionId,
        profileId,
        profileTypeFieldIds,
      });
    } catch {}
  }

  const reopenProfile = useReopenProfile();
  const showRestrictedProfilePropertiesDialog = useRestrictedProfilePropertiesDialog();
  const showUniqueValueConflictDialog = useUniqueValueConflictDialog();
  const showConfigureExpirationsDateDialog = useConfigureExpirationsDateDialog();
  const showCreateProfileDialog = useCreateProfileDialog();
  const showResolveProfilePropertiesConflictsDialog = useResolveProfilePropertiesConflictsDialog();

  const [archiveFieldGroupReplyIntoProfile] = useMutation(
    useArchiveRepliesIntoProfileDialog_archiveFieldGroupReplyIntoProfileDocument,
  );

  async function handleArchiveRepliesIntoProfile(profileId: string, ignoreFieldsInName?: boolean) {
    const { data } = await refetch({ profileId });
    const profile = data?.profile;
    if (!profile) {
      throw new Error("Profile not found");
    }
    let conflictResolutions = (
      ignoreFieldsInName
        ? (() => {
            const profileTypeFieldIdsToIgnore = [];

            // 1. Get from mergedOptions.updateProfileOnClose
            if (mergedOptions.updateProfileOnClose) {
              for (const update of mergedOptions.updateProfileOnClose) {
                const profileTypeField = profile.properties.find(
                  (p) => p.field.id === update.profileTypeFieldId,
                );
                if (
                  isNonNullish(profileTypeField) &&
                  profileTypeField.field.isUsedInProfileName === true
                ) {
                  profileTypeFieldIdsToIgnore.push(update.profileTypeFieldId);
                }
              }
            }

            // 2. Get from reply children
            for (const { field: _field } of replies.flatMap((r) => r.children ?? [])) {
              const field = allPetitionFields.find((f) => f.id === _field.id);
              if (
                isNonNullish(field?.profileTypeField) &&
                field?.profileTypeField.isUsedInProfileName === true
              ) {
                profileTypeFieldIdsToIgnore.push(field.profileTypeField.id);
              }
            }

            // 3. Convert to conflictResolutions
            return unique(profileTypeFieldIdsToIgnore).map((profileTypeFieldId) => ({
              action: "IGNORE" as const,
              profileTypeFieldId,
            }));
          })()
        : []
    ) as ArchiveFieldGroupReplyIntoProfileConflictResolutionInput[];

    try {
      if (profile.status === "CLOSED") {
        await reopenProfile({
          profileIds: [profile.id],
          profileName: <ProfileReference profile={profile} />,
          confirmText: intl.formatMessage({
            id: "component.confirm-close-archive-reply-into-profile-dialog.reopen-and-save-button",
            defaultMessage: "Reopen and save",
          }),
        });
      }

      const hasRestrictedInChildren = replies
        .flatMap((r) => r.children ?? [])
        .some(({ field: _field }) => {
          const field = allPetitionFields.find((f) => f.id === _field.id);
          return (
            isNonNullish(field?.profileTypeField) &&
            field?.profileTypeField.myPermission !== "WRITE"
          );
        });

      // Check restricted properties from mergedOptions.updateProfileOnClose
      const hasRestrictedInUpdateProfileOnClose = mergedOptions.updateProfileOnClose?.some(
        (update) => {
          if (update.source.type === "ASK_USER") return false;

          const profileTypeField = profile.properties.find(
            (p) => p.field.id === update.profileTypeFieldId,
          );

          return profileTypeField?.field.myPermission !== "WRITE";
        },
      );

      if (hasRestrictedInChildren || hasRestrictedInUpdateProfileOnClose) {
        await showRestrictedProfilePropertiesDialog();
      }

      const response = await archiveFieldGroupReplyIntoProfile({
        variables: {
          petitionId: petition.id,
          petitionFieldId: field.id,
          parentReplyId: reply.id,
          profileId,
          conflictResolutions,
          expirations: [],
        },
      });
      const newProfile = response.data?.archiveFieldGroupReplyIntoProfile.associatedProfile;

      setState({
        selectedProfileId: newProfile?.id ?? null,
        isSaved: true,
        isEditing: false,
      });
      savedProfile.current = newProfile ?? null;
      onRefetch();

      await handleUpdateProfileOnClose({
        profileId: profile.id,
        petitionFieldId: field.id,
        petitionId: petition.id,
        options: mergedOptions,
      });
    } catch (error) {
      if (isApolloError(error, "CONFLICT_RESOLUTION_REQUIRED_ERROR")) {
        try {
          const conflicts =
            (error.errors[0].extensions?.conflictResolutions as UpdateProfileOnClose[]) ?? [];
          const pendingExpirations =
            (error.errors[0].extensions?.expirations as UpdateProfileOnClose[]) ?? [];

          if (conflicts.length) {
            conflictResolutions = await showResolveProfilePropertiesConflictsDialog({
              parentReplyId: reply.id,
              parentFieldId: field.id,
              petitionId: petition.id,
              profileId: profile!.id,
              conflicts,
            });
          }

          // Filter out the profileTypeFields that have been resolved to ignore
          const filteredPendingExpirations = pendingExpirations.filter((e) => {
            return conflictResolutions.some(
              ({ action, profileTypeFieldId }) =>
                profileTypeFieldId === e.profileTypeFieldId && action === "IGNORE",
            )
              ? false
              : true;
          });
          let response;
          try {
            let expirations = [] as ArchiveFieldGroupReplyIntoProfileExpirationInput[];
            if (filteredPendingExpirations.length) {
              expirations = await showConfigureExpirationsDateDialog({
                profileId: profile!.id,
                pendingExpirations: filteredPendingExpirations,
              });
            }
            response = await archiveFieldGroupReplyIntoProfile({
              variables: {
                petitionId: petition.id,
                petitionFieldId: field.id,
                parentReplyId: reply.id,
                profileId: profile!.id,
                conflictResolutions,
                expirations,
              },
            });
          } catch (error) {
            if (isApolloError(error, "PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT")) {
              const conflicts =
                (error.errors[0].extensions?.conflicts as {
                  profileTypeFieldName: LocalizableUserText;
                  profileTypeFieldId: string;
                }[]) ?? [];

              const fields = profile.properties
                .map((p) => p.field)
                .filter((f) => conflicts.some((c) => c.profileTypeFieldId === f.id));
              await showUniqueValueConflictDialog.ignoringDialogErrors({
                fields,
              });
            }
            return;
          }
          const newProfile = response.data?.archiveFieldGroupReplyIntoProfile.associatedProfile;
          setState(() => ({
            selectedProfileId: newProfile?.id ?? null,
            isSaved: true,
            isEditing: false,
          }));
          savedProfile.current = newProfile ?? null;
          onRefetch();
          rerender(); // rerender the profile select to show the new profile name
        } catch (e) {
          if (isDialogError(e) && e.reason === "CREATE_NEW_PROFILE") {
            try {
              const { profile } = await showCreateProfileDialog({
                profileTypeId: field.profileType!.id,
                profileFieldValues: profileFieldValues,
              });
              await handleArchiveRepliesIntoProfile(profile as any, true);
              setState((current) => ({
                ...current,
                selectedProfile: profile ?? null,
              }));
              onRefetch();
            } catch {}
          }
        }
      } else if (isApolloError(error, "PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT")) {
        const conflicts =
          (error.errors[0].extensions?.conflicts as {
            profileTypeFieldName: LocalizableUserText;
            profileTypeFieldId: string;
          }[]) ?? [];

        const fields = profile.properties
          .map((p) => p.field)
          .filter((f) => conflicts.some((c) => c.profileTypeFieldId === f.id));

        await showUniqueValueConflictDialog.ignoringDialogErrors({
          fields,
        });
      }

      if (
        isApolloError(error, "PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT") ||
        isApolloError(error, "CONFLICT_RESOLUTION_REQUIRED_ERROR")
      ) {
        await handleUpdateProfileOnClose({
          profileId: profile.id,
          petitionFieldId: field.id,
          petitionId: petition.id,
          options: mergedOptions,
        });
      }
    }
  }

  const needUpdateProfile = useCheckUpdateProfile({
    parentReplyId: reply.id,
    profile: savedProfile.current,
    updateProfileOnClose: mergedOptions.updateProfileOnClose,
    petition,
    replies,
    fieldLogic,
  });

  // Helper function to get profile field values from updateProfileOnClose and reply children
  function getProfileFieldValues(): Record<string, any> {
    const reply = replies[0];

    // Get all petition fields (including children)
    const allPetitionFields = pipe(
      petition.fields,
      flatMap((f) => [f, ...(f.children ?? [])]),
    );

    // Get all profileTypeFieldIds to collect values for
    const profileTypeFieldIdsToCollect = new Set<string>();

    // 1. From updateProfileOnClose
    if (mergedOptions.updateProfileOnClose) {
      for (const update of mergedOptions.updateProfileOnClose) {
        if (update.source.type === "ASK_USER") continue;
        profileTypeFieldIdsToCollect.add(update.profileTypeFieldId);
      }
    }

    // 2. From reply children (that are not in updateProfileOnClose)
    if (reply.children) {
      for (const { field: _childField } of reply.children) {
        const childField = allPetitionFields.find((f) => f.id === _childField.id);
        if (
          isNonNullish(childField?.profileTypeField) &&
          !profileTypeFieldIdsToCollect.has(childField.profileTypeField.id)
        ) {
          profileTypeFieldIdsToCollect.add(childField.profileTypeField.id);
        }
      }
    }

    const fieldValues: Record<string, any> = {};

    // Collect values for each profileTypeFieldId
    for (const profileTypeFieldId of Array.from(profileTypeFieldIdsToCollect)) {
      let value: any = null;

      // Try to get from updateProfileOnClose first
      const updateFromConfig = mergedOptions.updateProfileOnClose?.find(
        (u) => u.profileTypeFieldId === profileTypeFieldId && u.source.type !== "ASK_USER",
      );

      if (updateFromConfig) {
        // Get value from updateProfileOnClose
        if (updateFromConfig.source.type === "FIELD") {
          const fieldId = updateFromConfig.source.fieldId;
          const childField = reply?.children?.find((c) => c.field.id === fieldId);

          if (childField && childField.replies.length > 0) {
            value = childField.replies[0]?.content?.value;
          } else {
            const petitionField = allPetitionFields.find((f) => f.id === fieldId);
            if (petitionField && petitionField.replies.length > 0) {
              value = petitionField.replies[0]?.content?.value;
            }
          }
        } else if (updateFromConfig.source.type === "VARIABLE") {
          const finalValue = fieldLogic[0]?.finalVariables?.[updateFromConfig.source.name];
          value = isNullish(finalValue) ? null : finalValue;
        } else if (updateFromConfig.source.type === "PETITION_METADATA") {
          value = (petition as { closedAt?: string | null }).closedAt ?? null;
        }
      } else {
        // Get from reply children
        const childField = allPetitionFields.find(
          (f) => f.profileTypeField?.id === profileTypeFieldId,
        );

        if (isNonNullish(childField) && childField.replies.length > 0) {
          value = childField.replies[0]?.content?.value;
        }
      }

      if (!isNullish(value)) {
        fieldValues[profileTypeFieldId] = value;
      }
    }

    return fieldValues;
  }

  const profileFieldValues = getProfileFieldValues();

  return (
    <>
      <Box noOfLines={2}>
        <Text as="span" fontWeight={600} marginEnd={2}>
          {`${
            field.options.groupName ??
            intl.formatMessage({
              id: "generic.group-name-fallback-reply",
              defaultMessage: "Reply",
            })
          }${field.replies.length > 1 ? ` ${index + 1}` : ""}`}
        </Text>
        <Text
          as="span"
          color="gray.600"
          fontSize="sm"
          fontStyle={profileName === null ? "italic" : undefined}
        >
          {"<"}
          {profileName ?? (
            <FormattedMessage id="generic.unnamed-profile" defaultMessage="Unnamed profile" />
          )}
          {">"}
        </Text>
      </Box>
      <HStack alignItems="top">
        <Box width="100%">
          <ProfileSelect
            key={key}
            value={state.selectedProfileId ?? null}
            onChange={async (profile, meta) => {
              setState((current) => ({
                ...current,
                selectedProfileId: profile?.id ?? null,
              }));

              if (isNonNullish(profile) && meta.action === "create-option") {
                await handleArchiveRepliesIntoProfile(profile.id, true);
              }
            }}
            defaultOptions
            canCreateProfiles
            defaultCreateProfileName={profileName || ""}
            defaultCreateProfileFieldValues={profileFieldValues}
            createOptionPosition="first"
            profileTypeId={field?.profileType?.id}
            isDisabled={(!state.isEditing && state.isSaved) || isDisabled}
          />
        </Box>
        {state.isSaved ? (
          state.isEditing ? (
            <IconButtonWithTooltip
              size="md"
              label={intl.formatMessage({ id: "generic.cancel", defaultMessage: "Cancel" })}
              icon={<CloseIcon boxSize={3} />}
              onClick={(e) => {
                e.stopPropagation();
                setState((current) => ({
                  ...current,
                  selectedProfileId: savedProfile.current?.id ?? null,
                  isEditing: false,
                }));
              }}
              isDisabled={isDisabled}
            />
          ) : (
            <IconButtonWithTooltip
              size="md"
              label={intl.formatMessage({ id: "generic.edit", defaultMessage: "Edit" })}
              icon={<EditIcon />}
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setState({ ...state, isEditing: true });
              }}
              isDisabled={isDisabled}
            />
          )
        ) : null}
      </HStack>
      {needUpdateProfile && !state.isEditing ? (
        <HStack gap={0}>
          <Button
            colorPalette="primary"
            leftIcon={<RepeatIcon />}
            onClick={async () => {
              await handleArchiveRepliesIntoProfile(state.selectedProfileId!);
            }}
            disabled={isDisabled}
          >
            <FormattedMessage id="generic.update" defaultMessage="Update" />
          </Button>
          <AlertPopover boxSize={4}>
            <Text>
              <FormattedMessage
                id="component.associate-and-fill-profile-to-parallel-dialog.need-update-profile-warning"
                defaultMessage="The information has been saved but some of the answers in this parallel differ from the values saved in the profile."
              />
            </Text>
          </AlertPopover>
        </HStack>
      ) : state.isSaved && !state.isEditing ? (
        <HStack paddingX={4} justifyContent="center">
          <CheckIcon color="green.500" />
          <Box>
            <FormattedMessage id="generic.saved" defaultMessage="Saved" />
          </Box>
        </HStack>
      ) : (
        <Button
          colorPalette="primary"
          leftIcon={<SaveIcon />}
          onClick={async () => await handleArchiveRepliesIntoProfile(state.selectedProfileId!)}
          disabled={
            state.selectedProfileId === null ||
            savedProfile.current?.id === state.selectedProfileId ||
            isDisabled
          }
        >
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      )}
    </>
  );
}

export function useArchiveRepliesIntoProfileDialog() {
  return useWizardDialog(
    {
      LOADING: ArchiveRepliesIntoProfileLoadingDialog,
      REPLIES_TO_PROFILE: ArchiveRepliesIntoProfileRepliesToProfileDialog,
    },
    "LOADING",
  );
}

useArchiveRepliesIntoProfileDialog.fragments = {
  get ProfileFieldProperty() {
    return gql`
      fragment useArchiveRepliesIntoProfileDialog_ProfileFieldProperty on ProfileFieldProperty {
        field {
          id
          name
          type
          myPermission
          isUsedInProfileName
        }
      }
    `;
  },
  get Profile() {
    return gql`
      fragment useArchiveRepliesIntoProfileDialog_Profile on Profile {
        id
        properties {
          ...useArchiveRepliesIntoProfileDialog_ProfileFieldProperty
        }
        ...ProfileSelect_Profile
        ...ProfileReference_Profile
        ...useCheckUpdateProfile_Profile
      }
      ${ProfileSelect.fragments.Profile}
      ${ProfileReference.fragments.Profile}
      ${this.ProfileFieldProperty}
      ${useCheckUpdateProfile.fragments.Profile}
    `;
  },
  get PetitionFieldReplyInner() {
    return gql`
      fragment useArchiveRepliesIntoProfileDialog_PetitionFieldReplyInner on PetitionFieldReply {
        id
        content
        associatedProfile {
          id
        }
        ...useCheckUpdateProfile_PetitionFieldReply
      }
      ${useCheckUpdateProfile.fragments.PetitionFieldReply}
      ${this.Profile}
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment useArchiveRepliesIntoProfileDialog_PetitionFieldReply on PetitionFieldReply {
        id
        children {
          field {
            id
          }
          replies {
            id
            ...useArchiveRepliesIntoProfileDialog_PetitionFieldReplyInner
          }
        }
        ...useArchiveRepliesIntoProfileDialog_PetitionFieldReplyInner
      }
      ${this.PetitionFieldReplyInner}
    `;
  },
  get ProfileType() {
    return gql`
      fragment useArchiveRepliesIntoProfileDialog_ProfileType on ProfileType {
        id
        ...useProfileNamePreview_ProfileType
      }
      ${useProfileNamePreview.fragments.ProfileType}
    `;
  },
  get PetitionFieldInner() {
    return gql`
      fragment useArchiveRepliesIntoProfileDialog_PetitionFieldInner on PetitionField {
        id
        title
        type
        options
        isLinkedToProfileType
        profileType {
          id
        }
        profileTypeField {
          id
          myPermission
          isUsedInProfileName
        }
        replies {
          id
          ...useArchiveRepliesIntoProfileDialog_PetitionFieldReply
          associatedProfile {
            id
          }
        }
      }
      ${this.PetitionFieldReply}
    `;
  },
  get PetitionField() {
    return gql`
      fragment useArchiveRepliesIntoProfileDialog_PetitionField on PetitionField {
        id
        ...groupFieldsWithProfileTypes_PetitionField
        ...useArchiveRepliesIntoProfileDialog_PetitionFieldInner
        children {
          ...useArchiveRepliesIntoProfileDialog_PetitionFieldInner
        }
      }
      ${groupFieldsWithProfileTypes.fragments.PetitionField}
      ${this.PetitionFieldInner}
    `;
  },
  get Petition() {
    return gql`
      fragment useArchiveRepliesIntoProfileDialog_Petition on Petition {
        id
        closedAt
        fields {
          ...useArchiveRepliesIntoProfileDialog_PetitionField
        }
        ...useFieldLogic_PetitionBase
        ...useProfileNamePreview_Petition
        ...useCheckUpdateProfile_Petition
      }
      ${this.PetitionField}
      ${useFieldLogic.fragments.PetitionBase}
      ${useProfileNamePreview.fragments.Petition}
      ${useCheckUpdateProfile.fragments.Petition}
    `;
  },
};

const _queries = [
  gql`
    query useArchiveRepliesIntoProfileDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...useArchiveRepliesIntoProfileDialog_Petition
      }
    }
    ${useArchiveRepliesIntoProfileDialog.fragments.Petition}
  `,
  gql`
    query useArchiveRepliesIntoProfileDialog_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        ...useArchiveRepliesIntoProfileDialog_Profile
      }
    }
    ${useArchiveRepliesIntoProfileDialog.fragments.Profile}
  `,
  gql`
    query useArchiveRepliesIntoProfileDialog_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        ...useArchiveRepliesIntoProfileDialog_ProfileType
      }
    }
    ${useArchiveRepliesIntoProfileDialog.fragments.ProfileType}
  `,
];

const _mutations = [
  gql`
    mutation useArchiveRepliesIntoProfileDialog_archiveFieldGroupReplyIntoProfile(
      $petitionId: GID!
      $petitionFieldId: GID!
      $parentReplyId: GID!
      $profileId: GID!
      $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
      $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
    ) {
      archiveFieldGroupReplyIntoProfile(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        parentReplyId: $parentReplyId
        profileId: $profileId
        conflictResolutions: $conflictResolutions
        expirations: $expirations
      ) {
        id
        associatedProfile {
          ...useArchiveRepliesIntoProfileDialog_Profile
        }
      }
    }
    ${useArchiveRepliesIntoProfileDialog.fragments.Profile}
  `,
];
