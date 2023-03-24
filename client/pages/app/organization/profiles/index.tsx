import { gql } from "@apollo/client";
import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { OrganizationProfiles_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FormattedMessage, useIntl } from "react-intl";

function OrganizationProfiles() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationProfiles_userDocument);

  return (
    <OrganizationSettingsLayout
      title={intl.formatMessage({
        id: "organization.profiles.title",
        defaultMessage: "Profiles",
      })}
      me={me}
      realMe={realMe}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.profiles.title" defaultMessage="Profiles" />
        </Heading>
      }
    >
      <Tabs variant="enclosed" isLazy lazyBehavior="unmount">
        <TabList paddingLeft={6} background="white" paddingTop={2}>
          <Tab
            fontWeight="500"
            _selected={{
              backgroundColor: "gray.50",
              borderColor: "gray.200",
              borderBottom: "1px solid",
              borderBottomColor: "transparent",
              color: "blue.600",
            }}
          >
            <FormattedMessage
              id="organization.profiles.profile-types"
              defaultMessage="Profile types"
            />
          </Tab>
          <Tab
            fontWeight="500"
            _selected={{
              backgroundColor: "gray.50",
              borderColor: "gray.200",
              borderBottom: "1px solid",
              borderBottomColor: "transparent",
              color: "blue.600",
            }}
          >
            <FormattedMessage
              id="organization.profiles.relationships"
              defaultMessage="Relationships"
            />
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel padding={0}></TabPanel>
          <TabPanel padding={0}></TabPanel>
        </TabPanels>
      </Tabs>
    </OrganizationSettingsLayout>
  );
}

OrganizationProfiles.queries = [
  gql`
    query OrganizationProfiles_user {
      ...OrganizationSettingsLayout_Query
    }
    ${OrganizationSettingsLayout.fragments.Query}
  `,
];

OrganizationProfiles.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationProfiles_userDocument);
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILES", "/app/organization"),
  withApolloData
)(OrganizationProfiles);
