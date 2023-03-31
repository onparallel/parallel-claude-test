import { gql } from "@apollo/client";
import { Box, Heading, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { EyeOffIcon, LockClosedIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { Divider } from "@parallel/components/common/Divider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { MoreOptionsMenuProfile } from "@parallel/components/profiles/MoreOptionsMenuProfile";
import { ProfileDetail_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useDeleteProfile } from "@parallel/utils/mutations/useDeleteProfile";
import { FormattedMessage, useIntl } from "react-intl";

function ProfileDetail() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQuery(ProfileDetail_userDocument);

  const data = {
    id: 2131541,
    profileName: "Binford Ltd.",
    type: "persona jurídica",
    fields: [
      {
        title: "Company name",
        type: "SHORT_TEXT",
        value: "Binford Ltd.",
      },
      {
        title: "Phone number",
        type: "PHONE",
        value: "",
      },
      {
        title: "Type",
        type: "SHORT_TEXT",
        value: "",
      },
      {
        title: "City",
        type: "SHORT_TEXT",
        value: "Madrid",
      },
      {
        title: "Postal code",
        type: "SHORT_TEXT",
        value: "497881",
      },
      {
        title: "Number of employees",
        type: "NUMBER",
        value: "40",
      },
      {
        title: "Annual revenue",
        type: "SHORT_TEXT",
        value: "",
      },
    ],
    hiddenFields: [
      { id: "1231", name: "Industry" },
      { id: "21312", name: "Annual revenue" },
    ],
  };

  const deleteProfile = useDeleteProfile();
  const handleDeleteProfile = async () => {
    try {
      deleteProfile({ id: "someid" });
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
          {data.profileName}
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
                type: data.type,
              }}
            />
          </Heading>
          <Stack as="ul">
            {data.fields.map(({ title, value }, i) => {
              return (
                <Stack as="li" key={i}>
                  <Text fontSize="sm" fontWeight={400} color="gray.600">
                    {title}
                  </Text>
                  <Box paddingLeft={2}>
                    <Input value={value} isReadOnly variant={"unstyled"} />
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
            {data.hiddenFields.map(({ id, name }) => {
              return (
                <HStack key={id} justify="space-between">
                  <Text>{name}</Text>
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

const _queries = [
  gql`
    query ProfileDetail_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
];

ProfileDetail.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(ProfileDetail_userDocument);
  return {};
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData
)(ProfileDetail);
