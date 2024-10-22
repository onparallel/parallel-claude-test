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
import { withMetadata } from "@parallel/utils/withMetadata";
type ProfileDetailProps = UnwrapPromise<ReturnType<typeof ProfileDetail.getInitialProps>>;

function ProfileDetail({ profileId, section }: ProfileDetailProps) {
  const { data: queryObject } = useAssertQuery(ProfileDetail_userDocument);
  const { me } = queryObject;
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
            {me.hasKeyProcessesFeature ? <ProfileKeyProcesses profile={profile} /> : null}
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
      metadata {
        country
        browserName
      }
      me {
        id
        hasKeyProcessesFeature: hasFeatureFlag(featureFlag: KEY_PROCESSES)
      }
    }
    ${ProfileLayout.fragments.Query}
  `,
  gql`
    query ProfileDetail_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        id
        ...ProfileLayout_Profile
        ...ProfileKeyProcesses_Profile
      }
    }
    ${ProfileLayout.fragments.Profile}
    ${ProfileKeyProcesses.fragments.Profile}
  `,
];

ProfileDetail.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const profileId = query.profileId as string;

  const profileSections: ProfilesSection[] = ["general", "parallels"];
  const section = profileSections.includes(query.section as ProfilesSection)
    ? (query.section as ProfilesSection)
    : "general";

  const [
    {
      data: { metadata },
    },
  ] = await Promise.all([
    fetchQuery(ProfileDetail_userDocument),
    fetchQuery(ProfileDetail_profileDocument, { variables: { profileId } }),
  ]);

  return { profileId, metadata, section };
};

export default compose(
  withDialogs,
  withMetadata,
  withPermission("PROFILES:LIST_PROFILES"),
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData,
)(ProfileDetail);
