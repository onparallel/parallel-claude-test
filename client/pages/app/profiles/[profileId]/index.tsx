import { gql, useMutation } from "@apollo/client";
import { Flex, HStack, MenuDivider, MenuItem, MenuList, Stack } from "@chakra-ui/react";
import {
  ArchiveIcon,
  BellIcon,
  BellOnIcon,
  BellSettingsIcon,
  DeleteIcon,
} from "@parallel/chakra/icons";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { WhenPermission } from "@parallel/components/common/WhenPermission";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { withPermission } from "@parallel/components/common/withPermission";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { ProfileForm } from "@parallel/components/profiles/ProfileForm";
import { ProfilePetitionsTable } from "@parallel/components/profiles/ProfilePetitionsTable";
import { ProfileRelationshipsTable } from "@parallel/components/profiles/ProfileRelationshipsTable";
import { ProfileSubscribers } from "@parallel/components/profiles/ProfileSubscribers";
import { useProfileSubscribersDialog } from "@parallel/components/profiles/dialogs/ProfileSubscribersDialog";
import {
  ProfileDetail_profileDocument,
  ProfileDetail_subscribeToProfileDocument,
  ProfileDetail_unsubscribeFromProfileDocument,
  ProfileDetail_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useCloseProfile } from "@parallel/utils/mutations/useCloseProfile";
import { useDeleteProfile } from "@parallel/utils/mutations/useDeleteProfile";
import { usePermanentlyDeleteProfile } from "@parallel/utils/mutations/usePermanentlyDeleteProfile";
import { useRecoverProfile } from "@parallel/utils/mutations/useRecoverProfile";
import { useReopenProfile } from "@parallel/utils/mutations/useReopenProfile";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { UnwrapPromise } from "@parallel/utils/types";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { withMetadata } from "@parallel/utils/withMetadata";
import { FormattedMessage, useIntl } from "react-intl";

type ProfileDetailProps = UnwrapPromise<ReturnType<typeof ProfileDetail.getInitialProps>>;

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

  const status = profile.status;
  const userCanSubscribeProfiles = useHasPermission("PROFILES:SUBSCRIBE_PROFILES");
  const userCanDeleteProfiles = useHasPermission("PROFILES:DELETE_PROFILES");
  const userCanCloseOpenProfiles = useHasPermission("PROFILES:CLOSE_PROFILES");
  const userCanDeletePermanently = useHasPermission("PROFILES:DELETE_PERMANENTLY_PROFILES");

  const navigate = useHandleNavigation();
  const deleteProfile = useDeleteProfile();
  const permanentlyDeleteProfile = usePermanentlyDeleteProfile();

  const handleDeleteProfile = async () => {
    try {
      if (profile.status === "DELETION_SCHEDULED") {
        await permanentlyDeleteProfile({
          profileIds: [profile.id],
          profileName: profile.name,
        });
        navigate("/app/profiles");
      } else {
        await deleteProfile({
          profileIds: [profile.id],
        });
      }
    } catch {}
  };

  const [subscribeToProfile] = useMutation(ProfileDetail_subscribeToProfileDocument);
  const [unsubscribeFromProfile] = useMutation(ProfileDetail_unsubscribeFromProfileDocument);
  const iAmSubscribed =
    status !== "OPEN" ? false : profile.subscribers.some(({ user }) => user.isMe);

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

  const closeProfile = useCloseProfile();
  const handleCloseProfileClick = async () => {
    try {
      await closeProfile({ profileIds: [profile.id], profileName: profile.name });
    } catch {}
  };

  const reopenProfile = useReopenProfile();
  const handleReopenProfileClick = async () => {
    try {
      await reopenProfile({ profileIds: [profile.id], profileName: profile.name });
    } catch {}
  };

  const recoverProfile = useRecoverProfile();
  const handleRecoverProfileClick = async () => {
    try {
      await recoverProfile({ profileIds: [profile.id], profileName: profile.name });
    } catch {}
  };

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
        <ProfileForm
          key={profile.id}
          profile={profile}
          onRefetch={async () => {
            await refetch();
          }}
          borderEnd="1px solid"
          borderColor="gray.200"
          maxWidth="container.xs"
          minWidth="container.3xs"
          onRecover={handleRecoverProfileClick}
        />
        <Flex
          direction="column"
          backgroundColor="gray.50"
          flex={2}
          maxHeight="full"
          minHeight={0}
          minWidth={0}
        >
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
            <ProfileSubscribers
              users={status === "OPEN" ? profile.subscribers.map(({ user }) => user) : []}
            />
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
              isDisabled={status !== "OPEN"}
            />
            <WhenPermission
              permission={[
                "PROFILES:SUBSCRIBE_PROFILES",
                "PROFILES:CLOSE_PROFILES",
                "PROFILES:DELETE_PROFILES",
                "PROFILES:DELETE_PERMANENTLY_PROFILES",
              ]}
              operator="OR"
            >
              <MoreOptionsMenuButton
                variant="outline"
                options={
                  <MenuList width="fit-content" minWidth="200px">
                    {status === "OPEN" ? (
                      <>
                        <MenuItem
                          icon={<BellSettingsIcon display="block" boxSize={4} />}
                          isDisabled={!userCanSubscribeProfiles}
                          onClick={handleSubscribersClick}
                        >
                          <FormattedMessage
                            id="component.more-options-menu-profile.manage-profile-subscriptions"
                            defaultMessage="Manage subscriptions"
                          />
                        </MenuItem>
                        <MenuItem
                          icon={<ArchiveIcon display="block" boxSize={4} />}
                          onClick={handleCloseProfileClick}
                          isDisabled={!userCanCloseOpenProfiles}
                        >
                          <FormattedMessage
                            id="component.more-options-menu-profile.close-profile"
                            defaultMessage="Close profile"
                          />
                        </MenuItem>
                      </>
                    ) : status === "CLOSED" ? (
                      <MenuItem
                        icon={<ArchiveIcon display="block" boxSize={4} />}
                        onClick={handleReopenProfileClick}
                        isDisabled={!userCanCloseOpenProfiles}
                      >
                        <FormattedMessage
                          id="component.more-options-menu-profile.reopen-profile"
                          defaultMessage="Reopen profile"
                        />
                      </MenuItem>
                    ) : status === "DELETION_SCHEDULED" ? (
                      <MenuItem
                        icon={<ArchiveIcon display="block" boxSize={4} />}
                        onClick={handleRecoverProfileClick}
                        isDisabled={!userCanCloseOpenProfiles}
                      >
                        <FormattedMessage
                          id="component.more-options-menu-profile.recover-profile"
                          defaultMessage="Recover profile"
                        />
                      </MenuItem>
                    ) : null}
                    <MenuDivider />
                    <MenuItem
                      color="red.500"
                      icon={<DeleteIcon display="block" boxSize={4} />}
                      onClick={handleDeleteProfile}
                      isDisabled={
                        (status !== "DELETION_SCHEDULED" && !userCanDeleteProfiles) ||
                        (status === "DELETION_SCHEDULED" && !userCanDeletePermanently)
                      }
                    >
                      {status === "DELETION_SCHEDULED" ? (
                        <FormattedMessage
                          id="component.more-options-menu-profile.delete-permanently"
                          defaultMessage="Delete permanently"
                        />
                      ) : (
                        <FormattedMessage
                          id="component.more-options-menu-profile.delete-profile"
                          defaultMessage="Delete profile"
                        />
                      )}
                    </MenuItem>
                  </MenuList>
                }
              />
            </WhenPermission>
          </HStack>
          <Stack spacing={6} padding={4} paddingBottom={24} flex={1} minHeight={0} overflow="auto">
            <Flex flex={1} direction="column" minHeight="305px">
              <ProfileRelationshipsTable profileId={profile.id} />
            </Flex>
            <Flex flex={1} direction="column" minHeight="305px">
              <ProfilePetitionsTable profileId={profile.id} />
            </Flex>
          </Stack>
        </Flex>
      </Flex>
    </AppLayout>
  );
}

const _fragments = {
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

  get Profile() {
    return gql`
      fragment ProfileDetail_Profile on Profile {
        id
        name
        status
        ...ProfileForm_Profile
        subscribers {
          ...ProfileDetail_ProfileSubscription
        }
      }
      ${ProfileForm.fragments.Profile}
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
  withPermission("PROFILES:LIST_PROFILES"),
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData,
)(ProfileDetail);
