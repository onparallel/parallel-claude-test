import { gql } from "@apollo/client";
import { Box, Grid, Heading, Stack } from "@chakra-ui/react";
import { AppSumoLicenseAlert } from "@parallel/components/common/AppSumoLicenseAlert";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { UsageCard } from "@parallel/components/organization/UsageCard";
import { OrganizationUsage_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FormattedMessage, useIntl } from "react-intl";

function OrganizationUsage() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationUsage_userDocument);

  const { organization } = me;

  const { activeUserCount, license, usageDetails, petitionsPeriod, signaturesPeriod } =
    organization;

  return (
    <OrganizationSettingsLayout
      title={intl.formatMessage({
        id: "organization.usage.title",
        defaultMessage: "Usage",
      })}
      me={me}
      realMe={realMe}
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
    </OrganizationSettingsLayout>
  );
}

OrganizationUsage.queries = [
  gql`
    query OrganizationUsage_user {
      ...OrganizationSettingsLayout_Query
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
    ${OrganizationSettingsLayout.fragments.Query}
    ${AppSumoLicenseAlert.fragments.OrgLicense}
  `,
];

OrganizationUsage.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationUsage_userDocument);
};

export default compose(
  withDialogs,
  withPermission("ORG_SETTINGS", { orPath: "/app/organization" }),
  withApolloData,
)(OrganizationUsage);
