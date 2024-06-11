import { gql, useMutation } from "@apollo/client";
import { Box, Button, FormControl, Grid, HStack, Stack, Text } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, EditIcon, SaveIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  ProfileSelect,
  ProfileSelectInstance,
  ProfileSelectSelection,
} from "@parallel/components/common/ProfileSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  ArchiveFieldGroupReplyIntoProfileConflictResolutionInput,
  ArchiveFieldGroupReplyIntoProfileExpirationInput,
  useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldFragment,
  useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReplyFragment,
  useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReplyInnerFragment,
  useArchiveFieldGroupReplyIntoProfileDialog_PetitionFragment,
  useArchiveFieldGroupReplyIntoProfileDialog_archiveFieldGroupReplyIntoProfileDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { getProfileNamePreview } from "@parallel/utils/getProfileNamePreview";
import { useReopenProfile } from "@parallel/utils/mutations/useReopenProfile";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, uniq, zip } from "remeda";
import { useConfigureExpirationsDateDialog } from "./ConfigureExpirationsDateDialog";
import { useResolveProfilePropertiesConflictsDialog } from "./ResolveProfilePropertiesConflictsDialog";

interface ArchiveFieldGroupReplyIntoProfileDialogProps {
  petition: useArchiveFieldGroupReplyIntoProfileDialog_PetitionFragment;
  onRefetch: () => void;
}

function ArchiveFieldGroupReplyIntoProfileDialog({
  petition,
  onRefetch,
  ...props
}: DialogProps<ArchiveFieldGroupReplyIntoProfileDialogProps>) {
  const fieldGroupsWithProfileTypes = zip(petition.fields, useFieldLogic(petition))
    .filter(
      ([field, { isVisible }]) =>
        isVisible &&
        field.type === "FIELD_GROUP" &&
        field.isLinkedToProfileType &&
        field.replies.length > 0,
    )
    .map(([field]) => field);

  const fieldGroupsWithProfileTypesTotal = fieldGroupsWithProfileTypes.flatMap(
    (f) => f.replies,
  ).length;

  const unsavedSelectedProfiles = useRef<string[]>([]);

  const showConfirmCloseArchiveReplyIntoProfileDialog =
    useConfirmCloseArchiveReplyIntoProfileDialog();

  return (
    <ConfirmDialog
      size="4xl"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      {...props}
      header={
        <FormattedMessage
          id="component.associate-and-fill-profile-to-parallel-dialog.header"
          defaultMessage="Associate {count, plural, =1{profile} other{profiles}}"
          values={{ count: fieldGroupsWithProfileTypesTotal }}
        />
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.associate-and-fill-profile-to-parallel-dialog.body"
              defaultMessage="Select in which profile you want to save the information of each group."
            />
          </Text>
          <Grid gap={2} templateColumns="2fr 3fr auto" alignItems="center">
            {fieldGroupsWithProfileTypes.map((field) => {
              return field.replies.map((reply, index) => {
                return (
                  <ArchiveFieldGroupReplyIntoProfileRow
                    key={field.id + index}
                    petitionId={petition.id}
                    field={field}
                    reply={reply}
                    index={index}
                    onSelectProfile={(profileId) => {
                      unsavedSelectedProfiles.current = uniq([
                        ...unsavedSelectedProfiles.current,
                        profileId,
                      ]);
                    }}
                    onSaveProfile={(profileId) => {
                      unsavedSelectedProfiles.current = unsavedSelectedProfiles.current.filter(
                        (id) => id !== profileId,
                      );
                    }}
                    onRefetch={onRefetch}
                  />
                );
              });
            })}
          </Grid>
        </Stack>
      }
      cancel={
        <Button
          onClick={async () => {
            try {
              if (unsavedSelectedProfiles.current.length > 0) {
                await showConfirmCloseArchiveReplyIntoProfileDialog();
              }
              props.onReject();
            } catch {}
          }}
        >
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      confirm={<></>}
    />
  );
}

interface ArchiveFieldGroupReplyIntoProfileRowProps {
  petitionId: string;
  field: useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldFragment;
  reply: useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReplyFragment;
  index: number;
  onSelectProfile: (profileId: string) => void;
  onSaveProfile: (profileId: string) => void;
  onRefetch: () => void;
}

function ArchiveFieldGroupReplyIntoProfileRow({
  petitionId,
  field,
  reply,
  index,
  onSelectProfile,
  onSaveProfile,
  onRefetch,
}: ArchiveFieldGroupReplyIntoProfileRowProps) {
  const intl = useIntl();

  const profile = reply.associatedProfile ?? null;
  const repliesWithProfileFields = reply.children
    ?.filter(({ field }) => isDefined(field.profileTypeField))
    .map(({ field, replies }) => [field, replies]) as [
    useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldFragment,
    useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReplyInnerFragment[],
  ][];

  const profileName = getProfileNamePreview({
    profileType: field.profileType!,
    fieldsWithProfileTypeFields: repliesWithProfileFields,
  });

  const [selectedProfile, setSelectedProfile] = useState<ProfileSelectSelection | null>(profile);
  const [isSaved, setIsSaved] = useState(isDefined(profile));
  const [isEditing, setIsEditing] = useState(false);

  const savedProfile = useRef<ProfileSelectSelection | null>(profile);
  const profileSelectRef = useRef<ProfileSelectInstance<false>>(null);

  const showResolveProfilePropertiesConflictsDialog = useResolveProfilePropertiesConflictsDialog();
  const showConfigureExpirationsDateDialog = useConfigureExpirationsDateDialog();
  const [archiveFieldGroupReplyIntoProfile] = useMutation(
    useArchiveFieldGroupReplyIntoProfileDialog_archiveFieldGroupReplyIntoProfileDocument,
  );
  const reopenProfile = useReopenProfile();

  useEffect(() => {
    if (isDefined(selectedProfile)) {
      if (!isSaved || (isEditing && savedProfile.current?.id !== selectedProfile.id)) {
        onSelectProfile(reply.id);
      } else {
        onSaveProfile(reply.id);
      }
    }
  }, [selectedProfile?.id, isSaved, isEditing, savedProfile.current?.id]);

  const showRestrictedProfilePropertiesDialog = useRestrictedProfilePropertiesDialog();

  async function archiveProfile(profile: ProfileSelectSelection, ignoreFieldsInName?: boolean) {
    let conflictResolutions = (
      ignoreFieldsInName
        ? reply.children
            ?.filter(
              ({ field }) =>
                isDefined(field.profileTypeField) && field.profileTypeField.isUsedInProfileName,
            )
            .map(({ field }) => ({
              action: "IGNORE",
              profileTypeFieldId: field.profileTypeField!.id,
            }))
        : []
    ) as ArchiveFieldGroupReplyIntoProfileConflictResolutionInput[];

    try {
      if (profile.status === "CLOSED") {
        await reopenProfile({
          profileIds: [profile.id],
          profileName: profile.name,
          confirmText: intl.formatMessage({
            id: "component.confirm-close-archive-reply-into-profile-dialog.reopen-and-save-button",
            defaultMessage: "Reopen and save",
          }),
        });
      }

      if (
        reply.children?.some(({ field }) => {
          return (
            isDefined(field.profileTypeField) && field.profileTypeField.myPermission !== "WRITE"
          );
        })
      ) {
        await showRestrictedProfilePropertiesDialog();
      }

      await archiveFieldGroupReplyIntoProfile({
        variables: {
          petitionId,
          petitionFieldId: field.id,
          parentReplyId: reply.id,
          profileId: profile?.id,
          conflictResolutions,
          expirations: [],
        },
      });
      setIsSaved(true);
      setIsEditing(false);
      onRefetch();
      savedProfile.current = profile;
    } catch (error: any) {
      if (isApolloError(error, "CONFLICT_RESOLUTION_REQUIRED_ERROR")) {
        try {
          const conflicts =
            (error.graphQLErrors[0].extensions?.conflictResolutions as string[]) ?? [];
          const pendingExpirations =
            (error.graphQLErrors[0].extensions?.expirations as string[]) ?? [];

          let expirations = [] as ArchiveFieldGroupReplyIntoProfileExpirationInput[];

          const profileName = profile!.name;

          if (conflicts.length) {
            const profileTypeFieldsWithReplies =
              repliesWithProfileFields!.filter(([field]) =>
                conflicts.includes(field.profileTypeField!.id),
              ) ?? [];
            conflictResolutions = await showResolveProfilePropertiesConflictsDialog({
              petitionId,
              profileId: profile!.id,
              profileName,
              profileTypeFieldsWithReplies,
            });
          }

          // Filter out the profileTypeFields that have been resolved to ignore
          const filteredPendingExpirations = pendingExpirations.filter((id) => {
            return conflictResolutions.some(
              ({ action, profileTypeFieldId }) => profileTypeFieldId === id && action === "IGNORE",
            )
              ? false
              : true;
          });

          if (filteredPendingExpirations.length) {
            const profileTypeFieldsWithReplies =
              repliesWithProfileFields!.filter(([field, _]) =>
                filteredPendingExpirations.includes(field.profileTypeField!.id),
              ) ?? [];

            expirations = await showConfigureExpirationsDateDialog({
              petitionId,
              profileName,
              profileTypeFieldsWithReplies,
            });
          }

          await archiveFieldGroupReplyIntoProfile({
            variables: {
              petitionId,
              petitionFieldId: field.id,
              parentReplyId: reply.id,
              profileId: profile!.id,
              conflictResolutions,
              expirations,
            },
          });

          setIsSaved(true);
          setIsEditing(false);
          onRefetch();
          savedProfile.current = profile;
        } catch {}
      }
    }
  }

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
        <FormControl>
          <ProfileSelect
            ref={profileSelectRef}
            value={selectedProfile}
            onChange={(profile, meta) => {
              setSelectedProfile(profile);
              if (isDefined(profile) && meta.action === "create-option") {
                archiveProfile(profile, true);
              }
            }}
            defaultOptions
            canCreateProfiles
            defaultCreateProfileName={profileName || ""}
            defaultCreateProfileFieldValues={Object.fromEntries(
              repliesWithProfileFields.map(([field, replies]) => [
                field.profileTypeField!.id,
                replies?.[0]?.content?.value,
              ]),
            )}
            createOptionPosition="first"
            profileTypeId={field?.profileType?.id}
            isDisabled={!isEditing && isSaved}
          />
        </FormControl>
        {isSaved ? (
          isEditing ? (
            <IconButtonWithTooltip
              size="md"
              label={intl.formatMessage({ id: "generic.cancel", defaultMessage: "Cancel" })}
              icon={<CloseIcon boxSize={3} />}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
                setSelectedProfile(savedProfile.current);
              }}
            />
          ) : (
            <IconButtonWithTooltip
              size="md"
              label={intl.formatMessage({ id: "generic.edit", defaultMessage: "Edit" })}
              icon={<EditIcon />}
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            />
          )
        ) : null}
      </HStack>
      {isSaved && !isEditing ? (
        <HStack paddingX={4} justifyContent="center">
          <CheckIcon color="green.500" />
          <Box>
            <FormattedMessage id="generic.saved" defaultMessage="Saved" />
          </Box>
        </HStack>
      ) : (
        <Button
          colorScheme="primary"
          leftIcon={<SaveIcon />}
          onClick={() => archiveProfile(selectedProfile!)}
          isDisabled={savedProfile.current?.id === selectedProfile?.id}
        >
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      )}
    </>
  );
}

useArchiveFieldGroupReplyIntoProfileDialog.fragments = {
  Profile: gql`
    fragment useArchiveFieldGroupReplyIntoProfileDialog_Profile on Profile {
      id
      ...ProfileSelect_Profile
    }
    ${ProfileSelect.fragments.Profile}
  `,
  PetitionFieldInner: gql`
    fragment useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldInner on PetitionField {
      id
      type
      options
      multiple
      isLinkedToProfileType
      isLinkedToProfileTypeField
      profileType {
        id
        ...getProfileNamePreview_ProfileType
      }
      profileTypeField {
        id
      }
      replies {
        ...useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReply
      }
      ...getProfileNamePreview_PetitionField
    }
    ${getProfileNamePreview.fragments.ProfileType}
    ${getProfileNamePreview.fragments.PetitionField}
  `,
  PetitionField: gql`
    fragment useArchiveFieldGroupReplyIntoProfileDialog_PetitionField on PetitionField {
      ...useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldInner
      ...useConfigureExpirationsDateDialog_PetitionField
      ...useResolveProfilePropertiesConflictsDialog_PetitionField
      children {
        ...useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldInner
        ...useConfigureExpirationsDateDialog_PetitionField
        ...useResolveProfilePropertiesConflictsDialog_PetitionField
      }
    }
    ${ProfileSelect.fragments.Profile}
    ${useConfigureExpirationsDateDialog.fragments.PetitionField}
    ${useResolveProfilePropertiesConflictsDialog.fragments.PetitionField}
  `,
  PetitionFieldReplyInner: gql`
    fragment useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReplyInner on PetitionFieldReply {
      id
      content
      associatedProfile {
        ...useArchiveFieldGroupReplyIntoProfileDialog_Profile
      }
      ...getProfileNamePreview_PetitionFieldReply
    }
    ${getProfileNamePreview.fragments.PetitionFieldReply}
  `,
  PetitionFieldReply: gql`
    fragment useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReply on PetitionFieldReply {
      ...useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReplyInner
      ...useResolveProfilePropertiesConflictsDialog_PetitionFieldReply
      ...useConfigureExpirationsDateDialog_PetitionFieldReply
      children {
        field {
          id
          profileTypeField {
            id
            name
            isExpirable
            expiryAlertAheadTime
            options
            isUsedInProfileName
            myPermission
          }
          ...getProfileNamePreview_PetitionField
        }
        replies {
          ...useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReplyInner
          ...useResolveProfilePropertiesConflictsDialog_PetitionFieldReply
          ...useConfigureExpirationsDateDialog_PetitionFieldReply
        }
      }
    }
    ${getProfileNamePreview.fragments.PetitionField}
    ${useConfigureExpirationsDateDialog.fragments.PetitionFieldReply}
    ${useResolveProfilePropertiesConflictsDialog.fragments.PetitionFieldReply}
  `,
  Petition: gql`
    fragment useArchiveFieldGroupReplyIntoProfileDialog_Petition on Petition {
      id
      fields {
        ...useArchiveFieldGroupReplyIntoProfileDialog_PetitionField
      }
      ...useFieldLogic_PetitionBase
    }
    ${useFieldLogic.fragments.PetitionBase}
  `,
};

export function useArchiveFieldGroupReplyIntoProfileDialog() {
  return useDialog(ArchiveFieldGroupReplyIntoProfileDialog);
}

const _mutations = [
  gql`
    mutation useArchiveFieldGroupReplyIntoProfileDialog_archiveFieldGroupReplyIntoProfile(
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
        ...useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReply
      }
    }
    ${useArchiveFieldGroupReplyIntoProfileDialog.fragments.PetitionFieldReply}
  `,
];

function ConfirmCloseArchiveReplyIntoProfileDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      {...props}
      header={
        <FormattedMessage
          id="component.confirm-close-archive-reply-into-profile-dialog.header"
          defaultMessage="Unsaved information"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-close-archive-reply-into-profile-dialog.body"
          defaultMessage="You have selected profiles without saving. If you don't save now you can go back from the Associate profiles button. Do you want to continue without saving?"
        />
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}
export function useConfirmCloseArchiveReplyIntoProfileDialog() {
  return useDialog(ConfirmCloseArchiveReplyIntoProfileDialog);
}

function RestrictedProfilePropertiesDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      {...props}
      header={
        <FormattedMessage
          id="component.restricted-profile-properties-dialog.header"
          defaultMessage="Properties without permissions"
        />
      }
      body={
        <FormattedMessage
          id="component.restricted-profile-properties-dialog.body"
          defaultMessage="There are some properties that do not have write permissions, so the information will neither be saved nor updated. Do you want to continue?"
        />
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}
export function useRestrictedProfilePropertiesDialog() {
  return useDialog(RestrictedProfilePropertiesDialog);
}
