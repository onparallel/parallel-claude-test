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
  StackProps,
  Text,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { NormalLink } from "@parallel/components/common/Link";
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
      showButton: false,
      route: "",
    },
    {
      isDisabled: !me.hasApiTokens,
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
      showButton: me.hasApiTokens,
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

interface IntegrationProps extends StackProps {
  logo: ReactNode | null;
  title: string;
  body: string;
  badge: ReactNode | null;
  isDisabled: boolean;
  showButton: boolean;
  route: string;
}

function Integration({
  logo,
  title,
  body,
  badge,
  isDisabled,
  showButton,
  route,
  ...props
}: IntegrationProps) {
  const content = (
    <HStack
      position="relative"
      width="100%"
      backgroundColor="white"
      rounded="lg"
      shadow="short"
      paddingX={6}
      paddingY={4}
      border="1px solid"
      borderColor={isDisabled ? "gray.100" : "gray.200"}
      cursor={isDisabled ? "not-allowed" : "pointer"}
      transition="all 0.3s ease"
      sx={{
        " > * ": {
          opacity: isDisabled ? 0.4 : 1,
        },
        _hover: isDisabled
          ? {}
          : {
              boxShadow: "long",
              backgroundColor: "gray.50",
            },
      }}
      {...props}
    >
      <Stack direction={{ base: "column", md: "row" }} flex="1" spacing={6}>
        <Center>{logo}</Center>
        <Stack flex="1" paddingRight={10}>
          <HStack>
            <Text fontSize="xl" as="b">
              {title}
            </Text>
            {badge}
          </HStack>
          <Text color="gray.600">{body}</Text>
        </Stack>
      </Stack>
      {showButton ? (
        <Center position="absolute" right="0" paddingRight={5}>
          <ChevronRightIcon boxSize={8} />
        </Center>
      ) : null}
    </HStack>
  );
  if (isDisabled) {
    return content;
  }
  return (
    <NormalLink rounded="lg" href={route} color="inherit" _hover={{ color: "inherit" }}>
      {content}
    </NormalLink>
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
        hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
        hasApiTokens: hasFeatureFlag(featureFlag: API_TOKENS)
        ...SettingsLayout_User
      }
    }
    ${SettingsLayout.fragments.User}
  `);
};

export default compose(withDialogs, withApolloData)(OrganizationIntegrations);
