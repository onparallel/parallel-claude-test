import { gql, useMutation, useQuery } from "@apollo/client";
import { Box, Button, FormControl, Grid, HStack, Stack, Text } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, EditIcon, RepeatIcon, SaveIcon } from "@parallel/chakra/icons";
import { AlertPopover } from "@parallel/components/common/AlertPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import {
  ProfileSelect,
  ProfileSelectInstance,
  ProfileSelectRerenderProvider,
  ProfileSelectSelection,
} from "@parallel/components/common/ProfileSelect";
import { RestrictedFeatureAlert } from "@parallel/components/common/RestrictedFeatureAlert";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  DialogProps,
  isDialogError,
  useDialog,
} from "@parallel/components/common/dialogs/DialogProvider";
import { useCreateProfileDialog } from "@parallel/components/profiles/dialogs/CreateProfileDialog";
import {
  AdverseMediaArticle,
  AdverseMediaSearchTermInput,
  ArchiveFieldGroupReplyIntoProfileConflictResolutionInput,
  ArchiveFieldGroupReplyIntoProfileExpirationInput,
  useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldFragment,
  useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReplyFragment,
  useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReplyInnerFragment,
  useArchiveFieldGroupReplyIntoProfileDialog_PetitionFragment,
  useArchiveFieldGroupReplyIntoProfileDialog_archiveFieldGroupReplyIntoProfileDocument,
  useArchiveFieldGroupReplyIntoProfileDialog_petitionDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { getProfileNamePreview } from "@parallel/utils/getProfileNamePreview";
import { useReopenProfile } from "@parallel/utils/mutations/useReopenProfile";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { difference, isNonNullish, isNullish, sort, unique, zip } from "remeda";
import { useConfigureExpirationsDateDialog } from "./ConfigureExpirationsDateDialog";
import { useResolveProfilePropertiesConflictsDialog } from "./ResolveProfilePropertiesConflictsDialog";

interface ArchiveFieldGroupReplyIntoProfileDialogProps {
  petitionId: string;
  onRefetch: () => void;
}

function ArchiveFieldGroupReplyIntoProfileDialog({
  petitionId,
  onRefetch,
  ...props
}: DialogProps<ArchiveFieldGroupReplyIntoProfileDialogProps>) {
  const { data, loading } = useQuery(useArchiveFieldGroupReplyIntoProfileDialog_petitionDocument, {
    variables: { id: petitionId },
  });
  const petition = data?.petition;

  const showConfirmCloseArchiveReplyIntoProfileDialog =
    useConfirmCloseArchiveReplyIntoProfileDialog();

  const unsavedSelectedProfiles = useRef<string[]>([]);

  const userCanCreateProfiles = useHasPermission("PROFILES:CREATE_PROFILES");

  return (
    <ConfirmDialog
      size="4xl"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      {...props}
      header={
        petition && petition.__typename === "Petition" ? <DialogHeader petition={petition} /> : null
      }
      body={
        <Stack spacing={4}>
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
          {!loading && isNonNullish(petition) && petition.__typename === "Petition" ? (
            <ArchiveFieldGroupReplyIntoProfileGrid
              petition={petition}
              onSelectProfile={(profileId) => {
                unsavedSelectedProfiles.current = unique([
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
              isDisabled={!userCanCreateProfiles}
            />
          ) : (
            <></>
          )}
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

function ArchiveFieldGroupReplyIntoProfileGrid({
  petition,
  onRefetch,
  onSelectProfile,
  onSaveProfile,
  isDisabled,
}: {
  petition: useArchiveFieldGroupReplyIntoProfileDialog_PetitionFragment;
  onRefetch: () => void;
  onSelectProfile: (profileId: string) => void;
  onSaveProfile: (profileId: string) => void;
  isDisabled?: boolean;
}) {
  const fieldGroupsWithProfileTypes = zip(petition.fields, useFieldLogic(petition))
    .filter(
      ([field, { isVisible }]) =>
        isVisible &&
        field.type === "FIELD_GROUP" &&
        field.isLinkedToProfileType &&
        field.replies.length > 0,
    )
    .map(([field]) => field);

  return (
    <ProfileSelectRerenderProvider>
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
                onSelectProfile={onSelectProfile}
                onSaveProfile={onSaveProfile}
                onRefetch={onRefetch}
                isDisabled={isDisabled}
              />
            );
          });
        })}
      </Grid>
    </ProfileSelectRerenderProvider>
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
  isDisabled?: boolean;
}

function ArchiveFieldGroupReplyIntoProfileRow({
  petitionId,
  field,
  reply,
  index,
  onSelectProfile,
  onSaveProfile,
  onRefetch,
  isDisabled,
}: ArchiveFieldGroupReplyIntoProfileRowProps) {
  const intl = useIntl();

  const profile = reply.associatedProfile ?? null;
  const repliesWithProfileFields = reply.children
    ?.filter(({ field }) => isNonNullish(field.profileTypeField))
    .map(({ field, replies }) => [field, replies]) as [
    useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldFragment,
    useArchiveFieldGroupReplyIntoProfileDialog_PetitionFieldReplyInnerFragment[],
  ][];

  const profileName = getProfileNamePreview({
    profileType: field.profileType!,
    fieldsWithProfileTypeFields: repliesWithProfileFields,
  });

  const [selectedProfile, setSelectedProfile] = useState<ProfileSelectSelection | null>(profile);
  const [isSaved, setIsSaved] = useState(isNonNullish(profile));
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
    if (isNonNullish(selectedProfile)) {
      if (!isSaved || (isEditing && savedProfile.current?.id !== selectedProfile.id)) {
        onSelectProfile(reply.id);
      } else {
        onSaveProfile(reply.id);
      }
    }
  }, [selectedProfile?.id, isSaved, isEditing, savedProfile.current?.id]);

  const showRestrictedProfilePropertiesDialog = useRestrictedProfilePropertiesDialog();
  const showCreateProfileDialog = useCreateProfileDialog();
  async function archiveProfile(profile: ProfileSelectSelection, ignoreFieldsInName?: boolean) {
    let conflictResolutions = (
      ignoreFieldsInName
        ? reply.children
            ?.filter(
              ({ field }) =>
                isNonNullish(field.profileTypeField) && field.profileTypeField.isUsedInProfileName,
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
          profileName: <ProfileReference profile={profile} />,
          confirmText: intl.formatMessage({
            id: "component.confirm-close-archive-reply-into-profile-dialog.reopen-and-save-button",
            defaultMessage: "Reopen and save",
          }),
        });
      }

      if (
        reply.children?.some(({ field }) => {
          return (
            isNonNullish(field.profileTypeField) && field.profileTypeField.myPermission !== "WRITE"
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

          if (conflicts.length) {
            const conflictingPetitionFieldWithReplies =
              repliesWithProfileFields!.filter(([field]) =>
                conflicts.includes(field.profileTypeField!.id),
              ) ?? [];
            conflictResolutions = await showResolveProfilePropertiesConflictsDialog({
              petitionId,
              profileId: profile!.id,
              profileName: <ProfileReference profile={profile} />,
              conflictingPetitionFieldWithReplies,
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
              profileName: <ProfileReference profile={profile} />,
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
        } catch (e) {
          if (isDialogError(e) && e.reason === "CREATE_NEW_PROFILE") {
            try {
              const { profile } = await showCreateProfileDialog({
                profileTypeId: field.profileType!.id,
                profileFieldValues: Object.fromEntries(
                  repliesWithProfileFields.map(([field, replies]) => [
                    field.profileTypeField!.id,
                    replies?.[0]?.content?.value,
                  ]),
                ),
              });
              await archiveProfile(profile as any, true);
              setSelectedProfile(profile as any);
            } catch {}
          }
        }
      }
    }
  }

  const needUpdateProfile =
    isNonNullish(profile) &&
    repliesWithProfileFields.some(([f, replies]) => {
      const profileField = profile.properties
        .filter(({ field }) => field.myPermission === "WRITE")
        .find(({ field }) => {
          return field.id === f.profileTypeField?.id;
        });

      if (isNonNullish(profileField)) {
        if (f.type === "BACKGROUND_CHECK") {
          const fieldContent = replies?.[0]?.content;
          const profileFieldContent = profileField.value?.content;

          const { date = "", name = "", type = "", country = "" } = fieldContent?.query ?? {};
          const {
            date: profileDate = "",
            name: profileName = "",
            type: profileType = "",
            country: profileCountry = "",
          } = profileFieldContent?.query ?? {};

          return (
            fieldContent?.entity?.id !== profileFieldContent?.entity?.id ||
            `${date}-${name}-${type}-${country}` !==
              `${profileDate}-${profileName}-${profileType}-${profileCountry}`
          );
        }

        if (f.type === "ADVERSE_MEDIA_SEARCH") {
          const fieldContent = replies?.[0]?.content;
          const profileFieldContent = profileField.value?.content;

          const fieldSearch =
            fieldContent?.search
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
            fieldContent?.articles?.items?.map(
              ({ id, classification }: AdverseMediaArticle) => `${id}-${classification}`,
            ) || [];

          const profileIdsWithClassification =
            profileFieldContent?.articles?.items?.map(
              ({ id, classification }: AdverseMediaArticle) => `${id}-${classification}`,
            ) || [];

          return (
            fieldSearch.length !== profileSearch.length ||
            fieldIdsWithClassification.length !== profileIdsWithClassification.length ||
            difference.multiset(fieldSearch, profileSearch).length > 0 ||
            difference.multiset(fieldIdsWithClassification, profileIdsWithClassification).length > 0
          );
        }

        if (f.type === "FILE_UPLOAD") {
          const petitionFilesToString = replies.map((reply) => {
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

          return (
            petitionFilesToString.length !== profileFilesToString.length ||
            difference.multiset(petitionFilesToString, profileFilesToString).length > 0
          );
        }

        if (f.type === "CHECKBOX") {
          const replyValue = sort<string>(replies?.[0]?.content.value ?? [], (a, b) =>
            a.localeCompare(b),
          );
          const profileValue = sort<string>(profileField.value?.content?.value ?? [], (a, b) =>
            a.localeCompare(b),
          );
          return (
            replyValue.length !== profileValue.length ||
            replyValue.join(",") !== profileValue.join(",")
          );
        }

        // Check if the value of the profile field is different from the reply only for simple text values like text, number, date, etc.
        return replies?.[0]?.content?.value !== profileField.value?.content?.value;
      }
    });

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
              if (isNonNullish(profile) && meta.action === "create-option") {
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
            isDisabled={(!isEditing && isSaved) || isDisabled}
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
                setIsEditing(true);
              }}
              isDisabled={isDisabled}
            />
          )
        ) : null}
      </HStack>
      {needUpdateProfile && !isEditing ? (
        <HStack spacing={0}>
          <Button
            colorScheme="primary"
            leftIcon={<RepeatIcon />}
            onClick={() => {
              archiveProfile(selectedProfile!);
            }}
            isDisabled={isDisabled}
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
      ) : isSaved && !isEditing ? (
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
          isDisabled={savedProfile.current?.id === selectedProfile?.id || isDisabled}
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
      properties {
        field {
          id
          type
          myPermission
        }
        value {
          id
          content
        }
        files {
          id
          file {
            size
            filename
            contentType
          }
        }
      }
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
        id
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
          id
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
        id
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

const _queries = [
  gql`
    query useArchiveFieldGroupReplyIntoProfileDialog_petition($id: GID!) {
      petition(id: $id) {
        ...useArchiveFieldGroupReplyIntoProfileDialog_Petition
      }
    }
    ${useArchiveFieldGroupReplyIntoProfileDialog.fragments.Petition}
  `,
];

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

function DialogHeader({
  petition,
}: {
  petition: useArchiveFieldGroupReplyIntoProfileDialog_PetitionFragment;
}) {
  const fieldLogic = useFieldLogic(petition);

  const repliesFieldGroupsWithProfileTypes = zip(petition.fields, fieldLogic)
    .filter(
      ([field, { isVisible }]) =>
        isVisible &&
        field.type === "FIELD_GROUP" &&
        field.isLinkedToProfileType &&
        field.replies.length > 0,
    )
    .flatMap(([f]) => f.replies);

  const groupsWithProfileTypesCount = repliesFieldGroupsWithProfileTypes.length;

  return (
    <FormattedMessage
      id="component.associate-and-fill-profile-to-parallel-dialog.header"
      defaultMessage="Associate {count, plural, =1{profile} other{profiles}}"
      values={{ count: groupsWithProfileTypesCount }}
    />
  );
}
