import { gql } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Badge,
  Button,
  Center,
  Heading,
  HStack,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { IntegrationCard } from "@parallel/components/organization/IntegrationCard";
import { OrganizationIntegrations_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, useIntl } from "react-intl";

function OrganizationIntegrations() {
  const intl = useIntl();
  const {
    data: { me },
  } = useAssertQuery(OrganizationIntegrations_userDocument);
  const sections = useOrganizationSections(me);

  const integrations = [
    {
      isDisabled: false,
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
        defaultMessage: "Add digital signature to your requests.",
      }),
      showButton: true,
      route: "/app/organization/integrations/signature",
    },
    {
      isDisabled: true,
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
      showButton: false,
      route: "",
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
      user={me}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.integrations.title" defaultMessage="Integrations" />
        </Heading>
      }
    >
      <Stack padding={4} spacing={5} maxWidth="container.sm" w="100%">
        {integrations.map((integration, index) => (
          <IntegrationCard key={index} {...integration} />
        ))}
        <Alert status="info" rounded="md">
          <AlertIcon />
          <HStack spacing={8}>
            <Text flex="1">
              <FormattedMessage
                id="page.integrations.upgrade-plan-alert"
                defaultMessage="Upgrade your plan to access integrations. Contact our support team support team for more information."
              />
            </Text>
            <Center>
              <Button
                as="a"
                variant="outline"
                backgroundColor="white"
                colorScheme="blue"
                href="mailto:support@onparallel.com"
              >
                <FormattedMessage id="generic.contact" defaultMessage="Contact" />
              </Button>
            </Center>
          </HStack>
        </Alert>
      </Stack>
    </SettingsLayout>
  );
}

OrganizationIntegrations.queries = [
  gql`
    query OrganizationIntegrations_user {
      me {
        id
        hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
        hasDeveloperAccess: hasFeatureFlag(featureFlag: DEVELOPER_ACCESS)
        ...SettingsLayout_User
      }
    }
    ${SettingsLayout.fragments.User}
  `,
];

OrganizationIntegrations.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationIntegrations_userDocument);
};

export default compose(
  withDialogs,
  withAdminOrganizationRole,
  withApolloData
)(OrganizationIntegrations);
