import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Flex,
  HStack,
  MenuDivider,
  MenuItem,
  MenuList,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
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
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { ProfileForm } from "@parallel/components/profiles/ProfileForm";
import { ProfileSubscribers } from "@parallel/components/profiles/ProfileSubscribers";
import { useProfileSubscribersDialog } from "@parallel/components/profiles/dialogs/ProfileSubscribersDialog";
import {
  ProfileLayout_ProfileFragment,
  ProfileLayout_QueryFragment,
  ProfileLayout_subscribeToProfileDocument,
  ProfileLayout_unsubscribeFromProfileDocument,
} from "@parallel/graphql/__types";
import { ReactNode, useMemo } from "react";

import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { useCloseProfile } from "@parallel/utils/mutations/useCloseProfile";
import { useDeleteProfile } from "@parallel/utils/mutations/useDeleteProfile";
import { usePermanentlyDeleteProfile } from "@parallel/utils/mutations/usePermanentlyDeleteProfile";
import { useRecoverProfile } from "@parallel/utils/mutations/useRecoverProfile";
import { useReopenProfile } from "@parallel/utils/mutations/useReopenProfile";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";

export type ProfilesSection = "general" | "parallels";

interface ProfileLayoutProps {
  queryObject: ProfileLayout_QueryFragment;
  profile: ProfileLayout_ProfileFragment;
  currentTabKey: ProfilesSection;
  onRefetch: () => void;
  children: ReactNode;
}

export function ProfileLayout({
  queryObject,
  profile,
  onRefetch,
  currentTabKey,
  children,
}: ProfileLayoutProps) {
  const intl = useIntl();

  const { me } = queryObject;

  const status = profile.status;
  const profileId = profile.id;
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
          profileName: <ProfileReference profile={profile} showNameEvenIfDeleted />,
        });
        navigate("/app/profiles");
      } else {
        await deleteProfile({
          profileIds: [profile.id],
        });
      }
    } catch {}
  };

  const tabs = useMemo(
    () => [
      {
        key: "general" as const,
        title: intl.formatMessage({
          id: "page.profile-details.general",
          defaultMessage: "General",
        }),
        href: `/app/profiles/${profileId}/general`,
      },
      {
        key: "parallels" as const,
        title: intl.formatMessage({
          id: "page.profile-details.parallels",
          defaultMessage: "Parallels",
        }),
        href: `/app/profiles/${profileId}/parallels`,
      },
    ],
    [intl.locale, profileId],
  );

  const [subscribeToProfile] = useMutation(ProfileLayout_subscribeToProfileDocument);
  const [unsubscribeFromProfile] = useMutation(ProfileLayout_unsubscribeFromProfileDocument);
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

  const moreOptionsButtonRef = useRef<HTMLButtonElement>(null);

  const showSubscribersDialog = useProfileSubscribersDialog();

  const handleSubscribersClick = async () => {
    try {
      await showSubscribersDialog({
        profileIds: [profile.id],
        me,
        users: profile.subscribers.map(({ user }) => user),
        isSubscribed: profile.subscribers.some(({ user }) => user.isMe),
        modalProps: { finalFocusRef: moreOptionsButtonRef },
      });
    } catch {}
  };

  const closeProfile = useCloseProfile();
  const handleCloseProfileClick = async () => {
    try {
      await closeProfile({
        profileIds: [profile.id],
        profileName: <ProfileReference profile={profile} />,
      });
    } catch {}
  };

  const reopenProfile = useReopenProfile();
  const handleReopenProfileClick = async () => {
    try {
      await reopenProfile({
        profileIds: [profile.id],
        profileName: <ProfileReference profile={profile} />,
      });
    } catch {}
  };

  const recoverProfile = useRecoverProfile();
  const handleRecoverProfileClick = async () => {
    try {
      await recoverProfile({
        profileIds: [profile.id],
        profileName: <ProfileReference profile={profile} showNameEvenIfDeleted />,
      });
    } catch {}
  };

  const handleTabChange = (tabIndex: number) => {
    navigate(
      tabIndex === 0
        ? `/app/profiles/${profileId}/general`
        : `/app/profiles/${profileId}/parallels`,
    );
  };

  const buttonTabProps = {
    height: "fit-content",
    alignSelf: "end",
    fontWeight: 500,
    _selected: {
      backgroundColor: "gray.50",
      borderColor: "gray.200",
      borderBottom: "1px solid transparent",
      color: "blue.600",
    },
  };

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  return (
    <AppLayout
      title={intl.formatMessage({
        id: "component.profile-layout.title",
        defaultMessage: "Profile details",
      })}
      queryObject={queryObject}
      background="white"
    >
      <Flex minHeight="100%" direction="row">
        <ProfileForm
          key={profile.id}
          profile={profile}
          onRefetch={onRefetch}
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
          <Tabs
            zIndex={10}
            variant="enclosed"
            overflow="hidden"
            index={currentTabKey === "parallels" ? 1 : 0}
            onChange={handleTabChange}
            {...extendFlexColumn}
          >
            <HStack
              spacing={0}
              backgroundColor="white"
              minHeight="64px"
              borderBottom="1px solid"
              borderColor="gray.200"
            >
              <TabList paddingStart={4} background="white" height="65px">
                {tabs.map(({ href, key, title }) => {
                  return (
                    <NakedLink key={key} href={href!}>
                      <Tab {...buttonTabProps}>{title}</Tab>
                    </NakedLink>
                  );
                })}
              </TabList>
              <HStack
                paddingX={4}
                justifyContent="flex-end"
                alignItems="center"
                minWidth="0"
                flex="1"
              >
                <ProfileSubscribers
                  users={status === "OPEN" ? profile.subscribers.map(({ user }) => user) : []}
                />
                <ResponsiveButtonIcon
                  breakpoint="xl"
                  icon={iAmSubscribed ? <BellOnIcon boxSize={5} /> : <BellIcon boxSize={5} />}
                  colorScheme={iAmSubscribed ? undefined : "primary"}
                  label={
                    iAmSubscribed
                      ? intl.formatMessage({
                          id: "component.profile-layout.unsubscribe",
                          defaultMessage: "Unsubscribe",
                        })
                      : intl.formatMessage({
                          id: "component.profile-layout.subscribe",
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
                    ref={moreOptionsButtonRef}
                    variant="outline"
                    backgroundColor="white"
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
                                id="component.profile-layout.manage-profile-subscriptions"
                                defaultMessage="Manage subscriptions"
                              />
                            </MenuItem>
                            <MenuItem
                              icon={<ArchiveIcon display="block" boxSize={4} />}
                              onClick={handleCloseProfileClick}
                              isDisabled={!userCanCloseOpenProfiles}
                            >
                              <FormattedMessage
                                id="component.profile-layout.close-profile"
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
                              id="component.profile-layout.reopen-profile"
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
                              id="component.profile-layout.recover-profile"
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
                              id="component.profile-layout.delete-permanently"
                              defaultMessage="Delete permanently"
                            />
                          ) : (
                            <FormattedMessage
                              id="component.profile-layout.delete-profile"
                              defaultMessage="Delete profile"
                            />
                          )}
                        </MenuItem>
                      </MenuList>
                    }
                  />
                </WhenPermission>
              </HStack>
            </HStack>
            <TabPanels {...extendFlexColumn}>
              {tabs.map((t) => (
                <TabPanel
                  key={t.key}
                  {...extendFlexColumn}
                  padding={4}
                  paddingBottom={24}
                  overflow="auto"
                >
                  {t.key === currentTabKey ? children : null}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Flex>
      </Flex>
    </AppLayout>
  );
}

const _fragments = {
  Query: gql`
    fragment ProfileLayout_Query on Query {
      ...AppLayout_Query
      me {
        ...ProfileSubscribers_User
      }
    }
  `,
  ProfileSubscription: gql`
    fragment ProfileLayout_ProfileSubscription on ProfileSubscription {
      id
      user {
        id
        isMe
        ...ProfileSubscribers_User
        ...useProfileSubscribersDialog_User
      }
    }
  `,
  Profile: gql`
    fragment ProfileLayout_Profile on Profile {
      id
      localizableName
      status
      ...ProfileForm_Profile
      ...ProfileReference_Profile
      subscribers {
        ...ProfileLayout_ProfileSubscription
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation ProfileLayout_subscribeToProfile($profileIds: [GID!]!, $userIds: [GID!]!) {
      subscribeToProfile(profileIds: $profileIds, userIds: $userIds) {
        ...ProfileLayout_Profile
      }
    }
  `,
  gql`
    mutation ProfileLayout_unsubscribeFromProfile($profileIds: [GID!]!, $userIds: [GID!]!) {
      unsubscribeFromProfile(profileIds: $profileIds, userIds: $userIds) {
        ...ProfileLayout_Profile
      }
    }
  `,
];
