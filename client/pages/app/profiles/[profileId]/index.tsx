import { gql, useMutation } from "@apollo/client";
import { Flex, HStack, Stack } from "@chakra-ui/react";
import { BellIcon, BellOnIcon } from "@parallel/chakra/icons";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useConfirmDeassociateProfileDialog } from "@parallel/components/petition-activity/dialogs/ConfirmDeassociateProfileDialog";
import { FakeProfileTables } from "@parallel/components/profiles/FakeProfileTables";
import { MoreOptionsMenuProfile } from "@parallel/components/profiles/MoreOptionsMenuProfile";
import { ProfileForm } from "@parallel/components/profiles/ProfileForm";
import { ProfilePetitionsTable } from "@parallel/components/profiles/ProfilePetitionsTable";
import { ProfileSubscribers } from "@parallel/components/profiles/ProfileSubscribers";
import { useAssociatePetitionToProfileDialog } from "@parallel/components/profiles/dialogs/AssociatePetitionToProfileDialog";
import { useProfileSubscribersDialog } from "@parallel/components/profiles/dialogs/ProfileSubscribersDialog";
import {
  ProfileDetail_associateProfileToPetitionDocument,
  ProfileDetail_profileDocument,
  ProfileDetail_subscribeToProfileDocument,
  ProfileDetail_deassociateProfileFromPetitionDocument,
  ProfileDetail_unsubscribeFromProfileDocument,
  ProfileDetail_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useDeleteProfile } from "@parallel/utils/mutations/useDeleteProfile";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { isAtLeast } from "@parallel/utils/roles";
import { UnwrapPromise } from "@parallel/utils/types";
import { withMetadata } from "@parallel/utils/withMetadata";
import { useIntl } from "react-intl";

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

  const hasNormalRole = isAtLeast("NORMAL", me.role);
  const hasAdminRole = isAtLeast("ADMIN", me.role);

  const navigate = useHandleNavigation();
  const deleteProfile = useDeleteProfile();
  const handleDeleteProfile = async () => {
    try {
      await deleteProfile({ profileIds: [profile.id] });
      navigate("/app/profiles");
    } catch {}
  };

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

  const [associateProfileToPetition] = useMutation(
    ProfileDetail_associateProfileToPetitionDocument
  );
  const showAssociatePetitionToProfileDialog = useAssociatePetitionToProfileDialog();
  const handleAddPetition = async () => {
    try {
      const petitionId = await showAssociatePetitionToProfileDialog({
        excludePetitions: profile.petitions.map((p) => p.id),
      });

      await associateProfileToPetition({
        variables: { petitionId, profileId },
      });
    } catch {}
  };
  const showConfirmDeassociateProfileDialog = useConfirmDeassociateProfileDialog();
  const [deassociateProfileFromPetition] = useMutation(
    ProfileDetail_deassociateProfileFromPetitionDocument
  );
  const handleRemovePetition = async ({
    petitionId,
    petitionName,
  }: {
    petitionId: string;
    petitionName: string;
  }) => {
    try {
      await deassociateProfileFromPetition({
        variables: { petitionId, profileId },
      });
      await showConfirmDeassociateProfileDialog({
        petitionName,
        profileName: profile.name,
      });
      refetch();
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
          profile={profile}
          refetch={() => refetch()}
          borderRight="1px solid"
          borderColor="gray.200"
          maxWidth="container.xs"
          minWidth="container.3xs"
        />
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
            {hasNormalRole ? (
              <MoreOptionsMenuProfile
                canDelete={hasAdminRole}
                onDelete={handleDeleteProfile}
                onSubscribe={handleSubscribersClick}
              />
            ) : null}
          </HStack>
          <Stack spacing={6} padding={4} paddingBottom={24}>
            {process.env.NEXT_PUBLIC_ENVIRONMENT === "staging" ? (
              <FakeProfileTables me={me} />
            ) : null}
            <ProfilePetitionsTable
              petitions={profile.petitions}
              onAddPetition={handleAddPetition}
              onRemovePetition={handleRemovePetition}
            />
          </Stack>
        </Stack>
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
        ...ProfileForm_Profile
        subscribers {
          ...ProfileDetail_ProfileSubscription
        }
        petitions {
          ...ProfilePetitionsTable_Petition
        }
      }
      ${ProfileForm.fragments.Profile}
      ${this.ProfileSubscription}
      ${ProfilePetitionsTable.fragments.Petition}
    `;
  },
};

const _queries = [
  gql`
    query ProfileDetail_user {
      ...AppLayout_Query
      me {
        role
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
    mutation ProfileDetail_associateProfileToPetition($petitionId: GID!, $profileId: GID!) {
      associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
        profile {
          ...ProfileDetail_Profile
        }
      }
    }
    ${_fragments.Profile}
  `,
  gql`
    mutation ProfileDetail_deassociateProfileFromPetition($petitionId: GID!, $profileId: GID!) {
      deassociateProfileFromPetition(petitionId: $petitionId, profileId: $profileId)
    }
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
