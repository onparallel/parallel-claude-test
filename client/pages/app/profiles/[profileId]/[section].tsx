import { gql } from "@apollo/client";
import { Flex } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { withPermission } from "@parallel/components/common/withPermission";
import { ProfileLayout, ProfilesSection } from "@parallel/components/layout/ProfileLayout";
import { ProfileKeyProcesses } from "@parallel/components/profiles/ProfileKeyProcesses";
import { ProfilePetitionsTable } from "@parallel/components/profiles/ProfilePetitionsTable";
import { ProfileRelationshipsTable } from "@parallel/components/profiles/ProfileRelationshipsTable";
import {
  ProfileDetail_profileDocument,
  ProfileDetail_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
type ProfileDetailProps = UnwrapPromise<ReturnType<typeof ProfileDetail.getInitialProps>>;

function ProfileDetail({ profileId, section }: ProfileDetailProps) {
  const { data: queryObject } = useAssertQuery(ProfileDetail_userDocument);
  const {
    data: { profile },
    refetch,
  } = useAssertQuery(ProfileDetail_profileDocument, {
    variables: {
      profileId,
    },
  });

  return (
    <ProfileLayout
      currentTabKey={section}
      onRefetch={async () => await refetch()}
      profile={profile}
      queryObject={queryObject}
    >
      <Flex direction="column" gap={6}>
        {section === "parallels" ? (
          <ProfilePetitionsTable profileId={profile.id} />
        ) : (
          <>
            <ProfileKeyProcesses profile={profile} />
            <ProfileRelationshipsTable profileId={profile.id} />
          </>
        )}
      </Flex>
    </ProfileLayout>
  );
}

const _queries = [
  gql`
    query ProfileDetail_user {
      ...ProfileLayout_Query
    }
  `,
  gql`
    query ProfileDetail_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        id
        ...ProfileLayout_Profile
        ...ProfileKeyProcesses_Profile
      }
    }
  `,
];

ProfileDetail.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const profileId = query.profileId as string;

  const profileSections: ProfilesSection[] = ["general", "parallels"];
  const section = profileSections.includes(query.section as ProfilesSection)
    ? (query.section as ProfilesSection)
    : "general";

  await Promise.all([
    fetchQuery(ProfileDetail_userDocument),
    fetchQuery(ProfileDetail_profileDocument, { variables: { profileId } }),
  ]);

  return { profileId, section };
};

export default compose(
  withDialogs,
  withPermission("PROFILES:LIST_PROFILES"),
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData,
)(ProfileDetail);
