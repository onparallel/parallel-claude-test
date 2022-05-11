import { gql } from "@apollo/client";
import { Box, Grid, Heading, Stack, Text } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { UpgradeAppSumoAlert } from "@parallel/components/common/UpgradeAppSumoAlert";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { UsageCard } from "@parallel/components/organization/UsageCard";
import { OrganizationUsage_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { getAppSumoTierFromPlanId } from "@parallel/utils/getAppSumoTierFromPlanId";

import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, useIntl } from "react-intl";

type AppSumoLicenseType = {
  plan_id: string;
  activation_email: string;
  invoice_item_uuid: string;
};

function OrganizationUsage() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationUsage_userDocument);

  const sections = useOrganizationSections(me);

  const { organization } = me;

  const {
    activeUserCount,
    appSumoLicense,
    usageLimits: {
      petitions,
      users,
      // signatures
    },
  } = organization;

  const appSumoPlanId = (appSumoLicense as AppSumoLicenseType).plan_id;
  const invoiceItemUuid = (appSumoLicense as AppSumoLicenseType).invoice_item_uuid;

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
        {appSumoPlanId ? (
          <Box maxWidth="container.lg">
            <UpgradeAppSumoAlert
              body={
                <Stack spacing={1.5}>
                  <Text fontWeight="bold">
                    <FormattedMessage
                      id="view.organization.current-appsumo-plan"
                      defaultMessage="Your current plan is {plan}"
                      values={{ plan: getAppSumoTierFromPlanId(appSumoPlanId) }}
                    />
                  </Text>
                  <Text>
                    {appSumoPlanId !== "parallel_tier4" ? (
                      <FormattedMessage
                        id="view.organization.upgrade-increase-limits"
                        defaultMessage="Upgrade your plan to increase your user and petition limits."
                      />
                    ) : (
                      <FormattedMessage
                        id="view.organization.contact-increate-limits"
                        defaultMessage="Contact with us to increase your user and petition limits."
                      />
                    )}
                  </Text>
                </Stack>
              }
              contactMessage={intl.formatMessage({
                id: "generic.upgrade-plan-support-message",
                defaultMessage:
                  "Hi, I would like to get more information about how to upgrade my plan.",
              })}
              isContactSupport={appSumoPlanId === "parallel_tier4"}
              invoiceItemUuid={invoiceItemUuid}
            />
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
          appSumoLicense
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
