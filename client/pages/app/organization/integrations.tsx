import { gql } from "@apollo/client";
import {
  Center,
  Heading,
  HStack,
  Stack,
  Text,
  Button,
  StackProps,
  Image,
  Badge,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useAddSignaturitAPIKeyDialog } from "@parallel/components/organization/AddSignaturitAPIKeyDialog";
import { useResetSignaturitTokenDialog } from "@parallel/components/organization/ResetSignaturitTokenDialog";
import {
  OrganizationIntegrationsQuery,
  useOrganizationIntegrationsQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function OrganizationIntegrations() {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(useOrganizationIntegrationsQuery());
  const sections = useOrganizationSections(me);

  const addSignaturitAPIKey = useAddSignaturitAPIKeyDialog();
  const resetSignaturit = useResetSignaturitTokenDialog();

  const signaturitEnabled = false;

  const handleActivateSignaturit = async () => {
    try {
      await addSignaturitAPIKey({});
    } catch {}
  };

  const handleResetSignaturit = async () => {
    try {
      await resetSignaturit({});
    } catch {}
  };

  const integrations = [
    {
      isDisabled: false,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/signaturit.png`}
          alt="Signaturit logo"
          maxWidth="124px"
        />
      ),
      badge: signaturitEnabled ? (
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
      button: signaturitEnabled ? (
        <Button variant="outline" onClick={handleResetSignaturit}>
          <FormattedMessage id="generic.reset" defaultMessage="Reset" />
        </Button>
      ) : (
        <Button colorScheme="purple" isDisabled={false} onClick={handleActivateSignaturit}>
          <FormattedMessage id="generic.activate" defaultMessage="Activate" />
        </Button>
      ),
    },
    {
      isDisabled: true,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/zapier.png`}
          alt="Zapier logo"
          maxWidth="124px"
        />
      ),
      badge: null,
      title: "Zapier",
      body: intl.formatMessage({
        id: "organization.integrations.zapier-description",
        defaultMessage: "Automate your workflows using its +400 services.",
      }),
      button: null,
    },
    {
      isDisabled: false,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/parallel-api.png`}
          alt="Zapier logo"
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
      button: (
        <Button colorScheme="purple">
          <FormattedMessage
            id="organization.integrations.parallel-api-button"
            defaultMessage="API Key"
          />
        </Button>
      ),
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
      <Stack padding={4} spacing={4} maxWidth="container.sm" w="100%">
        {integrations.map((integration, index) => (
          <Integration key={index} {...integration} />
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
              <Button variant="outline" backgroundColor="white" colorScheme="blue">
                <FormattedMessage id="generic.contact" defaultMessage="Contact" />
              </Button>
            </Center>
          </HStack>
        </Alert>
      </Stack>
    </SettingsLayout>
  );
}

interface IntegrationProps extends StackProps {
  logo: ReactNode | null;
  title: string;
  body: string;
  badge: ReactNode | null;
  button: ReactNode | null;
  isDisabled: boolean;
}

function Integration({ logo, title, body, badge, button, isDisabled, ...props }: IntegrationProps) {
  return (
    <Stack
      direction={{ base: "column", md: "row" }}
      width="100%"
      backgroundColor="white"
      rounded="lg"
      shadow="short"
      paddingX={6}
      paddingY={4}
      spacing={6}
      border="1px solid"
      borderColor={isDisabled ? "gray.100" : "gray.200"}
      sx={{
        " > * ": {
          opacity: isDisabled ? 0.4 : 1,
        },
      }}
      {...props}
    >
      <Center>{logo}</Center>
      <Stack flex="1">
        <HStack>
          <Text fontSize="xl" as="b">
            {title}
          </Text>{" "}
          {badge}
        </HStack>
        <Text color="gray.600">{body}</Text>
      </Stack>
      <Center>{button}</Center>
    </Stack>
  );
}

OrganizationIntegrations.getInitialProps = async ({
  fetchQuery,
  ...context
}: WithApolloDataContext) => {
  await fetchQuery<OrganizationIntegrationsQuery>(gql`
    query OrganizationIntegrations {
      me {
        id
        ...SettingsLayout_User
      }
    }
    ${SettingsLayout.fragments.User}
  `);
};

export default compose(withDialogs, withApolloData)(OrganizationIntegrations);
