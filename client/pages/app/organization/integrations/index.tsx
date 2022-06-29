import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Heading,
  Image,
  Stack,
} from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { IntegrationCard } from "@parallel/components/organization/IntegrationCard";
import { OrganizationIntegrations_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { isAtLeast } from "@parallel/utils/roles";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, useIntl } from "react-intl";

function OrganizationIntegrations() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(OrganizationIntegrations_userDocument);
  const sections = useOrganizationSections(me);

  const hasAdminRole = isAtLeast("ADMIN", me.role);

  const integrations = [
    {
      isDisabled: !hasAdminRole || false,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/signaturit.png`}
          alt="Signaturit"
          maxWidth="124px"
        />
      ),
      badge: me.hasPetitionSignature ? (
        <Badge colorScheme="green">
          <FormattedMessage id="generic.activated" defaultMessage="Activated" />
        </Badge>
      ) : (
        <Badge colorScheme="yellow">
          <FormattedMessage id="generic.test-mode" defaultMessage="Test mode" />
        </Badge>
      ),
      title: "Signaturit",
      body: intl.formatMessage({
        id: "organization.integrations.signaturit-description",
        defaultMessage: "Add digital signature to your parallels.",
      }),
      showButton: true,
      route: "/app/organization/integrations/signature",
    },
    {
      isDisabled: !hasAdminRole || false,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/zapier.png`}
          alt="Zapier"
          maxWidth="124px"
        />
      ),
      badge: null,
      title: "Zapier",
      body: intl.formatMessage({
        id: "organization.integrations.zapier-description",
        defaultMessage: "Automate your workflows using its +400 services.",
      }),
      showButton: true,
      route: "https://zapier.com/apps/parallel/integrations",
      isExternal: true,
    },
    {
      isDisabled: !me.hasDeveloperAccess,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/parallel-api.png`}
          alt="Parallel API"
          maxWidth="124px"
        />
      ),
      badge: null,
      title: intl.formatMessage({
        id: "organization.integrations.parallel-api-title",
        defaultMessage: "Parallel API",
      }),
      body: intl.formatMessage({
        id: "organization.integrations.parallel-api-description",
        defaultMessage: "Access our API to automate all your flows.",
      }),
      showButton: me.hasDeveloperAccess,
      route: "/app/settings/developers",
    },
  ];

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.integrations.title",
        defaultMessage: "Integrations",
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
          <FormattedMessage id="organization.integrations.title" defaultMessage="Integrations" />
        </Heading>
      }
    >
      <Alert status="info" paddingX={6}>
        <AlertIcon />
        <Stack
          direction={{ base: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ base: "flex-start", md: "center" }}
          flex="1"
          spacing={4}
        >
          <Box>
            <AlertTitle>
              <FormattedMessage
                id="organization.integrations.alert-title"
                defaultMessage="Can't find the integration you need?"
              />
            </AlertTitle>
            <AlertDescription>
              <FormattedMessage
                id="organization.integrations.alert-description"
                defaultMessage="Let us know! Tell us which applications you would like to connect Parallel with so we can consider them."
              />
            </AlertDescription>
          </Box>
          <Box>
            <Button
              variant="outline"
              colorScheme="blue"
              backgroundColor="white"
              as="a"
              target="_blank"
              rel="noopener"
              href="https://roadmap.onparallel.com/feature-requests?category=integrations"
              aria-label={intl.formatMessage({
                id: "organization.integrations.alert-button",
                defaultMessage: "Suggest integration",
              })}
            >
              <FormattedMessage
                id="organization.integrations.alert-button"
                defaultMessage="Suggest integration"
              />
            </Button>
          </Box>
        </Stack>
      </Alert>
      <Stack padding={4} spacing={5} maxWidth="container.sm" paddingBottom={16}>
        {integrations.map((integration, index) => (
          <IntegrationCard key={index} {...integration} />
        ))}
        {!hasAdminRole ? <OnlyAdminsAlert /> : null}
      </Stack>
    </SettingsLayout>
  );
}

OrganizationIntegrations.queries = [
  gql`
    query OrganizationIntegrations_user {
      ...SettingsLayout_Query
      me {
        id
        role
        hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
        hasDeveloperAccess: hasFeatureFlag(featureFlag: DEVELOPER_ACCESS)
      }
    }
    ${SettingsLayout.fragments.Query}
  `,
];

OrganizationIntegrations.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationIntegrations_userDocument);
};

export default compose(withDialogs, withApolloData)(OrganizationIntegrations);
