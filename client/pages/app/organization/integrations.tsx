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
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
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

  const signaturitEnabled = false;

  const handleActivateSignaturit = () => {};

  const handleResetSignaturit = () => {};

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
      body: "Añade firma digital a tus peticiones.",
      button: signaturitEnabled ? (
        <Button variant="outline" olorScheme="gray" onClick={handleResetSignaturit}>
          <FormattedMessage id="generic.reset" defaultMessage="Reset" />
        </Button>
      ) : (
        <Button colorScheme="purple" isDisabled={false} onClick={handleActivateSignaturit}>
          <FormattedMessage id="generic.activate" defaultMessage="Activate" />
        </Button>
      ),
    },
    {
      isDisabled: false,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/zapier.png`}
          alt="Zapier logo"
          maxWidth="124px"
        />
      ),
      badge: null,
      title: "Zapier",
      body: "Automatiza tus flujos de trabajo utilizando sus +400 servicios.",
      button: null,
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

export default compose(withApolloData)(OrganizationIntegrations);
