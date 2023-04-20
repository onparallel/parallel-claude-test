import { gql } from "@apollo/client";
import { Box, Heading, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { EyeOffIcon, LockClosedIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { Divider } from "@parallel/components/common/Divider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { MoreOptionsMenuProfile } from "@parallel/components/profiles/MoreOptionsMenuProfile";
import {
  ProfileDetail_profileDocument,
  ProfileDetail_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useDeleteProfile } from "@parallel/utils/mutations/useDeleteProfile";
import { UnwrapPromise } from "@parallel/utils/types";
import { FormattedMessage, useIntl } from "react-intl";
import { partition } from "remeda";

type ProfileDetailProps = UnwrapPromise<ReturnType<typeof ProfileDetail.getInitialProps>>;

function ProfileDetail({ profileId }: ProfileDetailProps) {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQuery(ProfileDetail_userDocument);

  const {
    data: { profile },
  } = useAssertQuery(ProfileDetail_profileDocument, {
    variables: {
      profileId,
    },
  });

  console.log(profile);

  const [properties, hiddenProperties] = partition(
    profile.properties,
    (property) => property.field.myPermission !== "HIDDEN"
  );

  const deleteProfile = useDeleteProfile();
  const handleDeleteProfile = async () => {
    try {
      deleteProfile({ id: profile.id });
    } catch {}
  };

  const handleCloneProfile = async () => {
    try {
      //TODO duplicate profile
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
      <HStack padding={4} justify="space-between" paddingX={4}>
        <Heading as="h2" size="md" fontWeight={400}>
          {profile.name}
        </Heading>
        <MoreOptionsMenuProfile onDelete={handleDeleteProfile} onClone={handleCloneProfile} />
      </HStack>
      <Divider />
      <Stack divider={<Divider />} padding={4} spacing={4}>
        <Stack spacing={4} width="sm">
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
          <Stack as="ul">
            {properties.map(({ field: { id, name, type }, files, value }, i) => {
              return (
                <Stack as="li" key={id}>
                  <Text fontSize="sm" fontWeight={400} color="gray.600">
                    <LocalizableUserTextRender
                      value={name}
                      default={intl.formatMessage({
                        id: "generic.unnamed-profile-type-field",
                        defaultMessage: "Unnamed property",
                      })}
                    />
                  </Text>
                  <Box paddingLeft={2}>
                    <Input value={""} isReadOnly variant={"unstyled"} />
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Stack>
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
      </Stack>
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
      }
    `;
  },
  get ProfileFieldFile() {
    return gql`
      fragment ProfileDetail_ProfileFieldFile on ProfileFieldFile {
        id
        file {
          filename
          contentType
          isComplete
          size
        }
      }
    `;
  },
  get ProfileFieldValue() {
    return gql`
      fragment ProfileDetail_ProfileFieldValue on ProfileFieldValue {
        id
        field {
          id
        }
        content
        createdAt
      }
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

ProfileDetail.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const profileId = query.profileId as string;

  await Promise.all([
    fetchQuery(ProfileDetail_profileDocument, { variables: { profileId } }),
    fetchQuery(ProfileDetail_userDocument),
  ]);

  return { profileId };
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData
)(ProfileDetail);
