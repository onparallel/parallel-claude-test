import { gql } from "@apollo/client";
import { Box, Grid, Heading } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { UsageCard } from "@parallel/components/organization/UsageCard";
import { OrganizationUsage_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, useIntl } from "react-intl";

function OrganizationUsage() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationUsage_userDocument);

  const sections = useOrganizationSections(me);

  const { organization } = me;

  const {
    activeUserCount,
    usageLimits: {
      petitions,
      users,
      // signatures
    },
  } = organization;

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.usage.title",
        defaultMessage: "Usage",
      })}
      basePath="/app/organization"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.usage.title" defaultMessage="Usage" />
        </Heading>
      }
    >
      <Box padding={8} width="100%">
        <Grid
          templateColumns={{
            lg: "repeat(3, 1fr)",
            xl: "repeat(4, 1fr)",
          }}
          gap={6}
        >
          <UsageCard
            title={intl.formatMessage({
              id: "page.usage.users",
              defaultMessage: "Users",
            })}
            usage={activeUserCount}
            limit={users.limit}
          />
          <UsageCard
            title={intl.formatMessage({
              id: "page.usage.petitions",
              defaultMessage: "Petitions",
            })}
            usage={petitions.used}
            limit={petitions.limit}
          />
          {/* <UsageCard
            title={intl.formatMessage({
              id: "page.usage.signatures",
              defaultMessage: "Signatures",
            })}
            usage={signatures.used}
            limit={signatures.limit}
          /> */}
        </Grid>
      </Box>
    </SettingsLayout>
  );
}

OrganizationUsage.queries = [
  gql`
    query OrganizationUsage_user {
      ...SettingsLayout_Query
      me {
        organization {
          id
          activeUserCount
          usageLimits {
            users {
              limit
            }
            petitions {
              used
              limit
            }
            signatures {
              used
              limit
            }
          }
        }
      }
    }
    ${SettingsLayout.fragments.Query}
  `,
];

OrganizationUsage.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationUsage_userDocument);
};

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(OrganizationUsage);
