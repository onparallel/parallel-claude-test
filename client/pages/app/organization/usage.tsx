import { gql } from "@apollo/client";
import { Box, Grid, Heading, Stack } from "@chakra-ui/react";
import { AppSumoLicenseAlert } from "@parallel/components/common/AppSumoLicenseAlert";
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

  const { activeUserCount, license, usageDetails, petitionsPeriod, signaturesPeriod } =
    organization;

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
      <Stack padding={8} width="100%" spacing={8}>
        {license && license.source === "APPSUMO" ? (
          <Box maxWidth="container.lg">
            <AppSumoLicenseAlert license={license} />
          </Box>
        ) : null}
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
            limit={usageDetails.USER_LIMIT}
            isUnlimited={license?.name === "APPSUMO4"}
          />
          <UsageCard
            title={intl.formatMessage({
              id: "page.usage.parallels",
              defaultMessage: "Parallels",
            })}
            usage={petitionsPeriod?.used ?? 0}
            limit={petitionsPeriod?.limit ?? 0}
          />
          {signaturesPeriod ? (
            <UsageCard
              title={intl.formatMessage({
                id: "page.usage.signatures",
                defaultMessage: "eSignatures",
              })}
              usage={signaturesPeriod.used}
              limit={signaturesPeriod.limit}
            />
          ) : null}
        </Grid>
      </Stack>
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
          license {
            source
            ...AppSumoLicenseAlert_OrgLicense
          }
          usageDetails
          petitionsPeriod: currentUsagePeriod(limitName: PETITION_SEND) {
            id
            limit
            used
          }
          signaturesPeriod: currentUsagePeriod(limitName: SIGNATURIT_SHARED_APIKEY) {
            id
            limit
            used
          }
        }
      }
    }
    ${SettingsLayout.fragments.Query}
    ${AppSumoLicenseAlert.fragments.OrgLicense}
  `,
];

OrganizationUsage.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationUsage_userDocument);
};

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(OrganizationUsage);
