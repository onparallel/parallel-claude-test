import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Center,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { AlertCircleFilledIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  IntegrationLinkCard,
  IntegrationLinkCardProps,
} from "@parallel/components/organization/IntegrationLinkCard";
import {
  IntegrationSwitchCard,
  IntegrationSwitchCardProps,
} from "@parallel/components/organization/IntegrationSwitchCard";
import {
  OrganizationIntegrations_createDowJonesFactivaIntegrationDocument,
  OrganizationIntegrations_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { isAtLeast } from "@parallel/utils/roles";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { useDeactivateDowJonesIntegrationDialog } from "./dialogs/DeactivateDowJonesIntegrationDialog";
import { useDowJonesIntegrationDialog } from "./dialogs/DowJonesIntegrationDialog";

function OrganizationIntegrations() {
  const intl = useIntl();
  const {
    data: { me, realMe },
    refetch,
  } = useAssertQuery(OrganizationIntegrations_userDocument);
  const sections = useOrganizationSections(me);

  const hasAdminRole = isAtLeast("ADMIN", me.role);

  const hasDownJones = me.organization.hasDowJones;
  const hasErrorDownJones = false;

  const [createDowJonesIntegration] = useMutation(
    OrganizationIntegrations_createDowJonesFactivaIntegrationDocument
  );

  const showDeactivateDowJonesIntegrationDialog = useDeactivateDowJonesIntegrationDialog();
  const showDowJonesIntegrationDialog = useDowJonesIntegrationDialog();
  const handleSwitchDownJones = async (isChecked: boolean) => {
    if (isChecked) {
      try {
        const data = await showDowJonesIntegrationDialog();
        await createDowJonesIntegration({
          variables: {
            ...data,
          },
        });
        refetch();
      } catch {}
    } else {
      try {
        await showDeactivateDowJonesIntegrationDialog();
        // TODO: Remove integration
      } catch {}
    }
  };

  const integrations = [
    {
      isDisabled: !hasAdminRole,
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
      href: "/app/organization/integrations/signature",
    },
    {
      isDisabled: !hasAdminRole,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/zapier.png`}
          alt="Zapier"
          maxWidth="100px"
        />
      ),
      title: "Zapier",
      body: intl.formatMessage({
        id: "organization.integrations.zapier-description",
        defaultMessage: "Automate your workflows using its +400 services.",
      }),
      href: "https://zapier.com/apps/parallel/integrations",
      isExternal: true,
    },
    {
      isDisabled: false,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/dow-jones.png`}
          alt="Dow Jones Factiva"
          maxWidth="124px"
        />
      ),
      badge: hasDownJones ? (
        hasErrorDownJones ? (
          <SmallPopover
            content={
              <Text fontSize="sm">
                <FormattedMessage
                  id="organization.integrations.dow-jones-error"
                  defaultMessage="The integration is not working properly. Please reconnect to your account."
                />
              </Text>
            }
            placement="bottom"
          >
            <AlertCircleFilledIcon color="yellow.500" />
          </SmallPopover>
        ) : (
          <Badge colorScheme="green">
            <FormattedMessage id="generic.activated" defaultMessage="Activated" />
          </Badge>
        )
      ) : null,
      title: intl.formatMessage({
        id: "organization.integrations.dow-jones-title",
        defaultMessage: "Dow Jones RiskCenter",
      }),
      body: intl.formatMessage({
        id: "organization.integrations.dow-jones-description",
        defaultMessage:
          "Run a background check of individuals and legal entities using its database.",
      }),
      onChange: handleSwitchDownJones,
      isChecked: hasDownJones,
    },
    {
      isDisabled: !me.hasDeveloperAccess || !hasAdminRole,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/parallel-api.png`}
          alt="Parallel API"
          maxWidth="124px"
        />
      ),
      title: intl.formatMessage({
        id: "organization.integrations.parallel-api-title",
        defaultMessage: "Parallel API",
      }),
      body: intl.formatMessage({
        id: "organization.integrations.parallel-api-description",
        defaultMessage: "Access our API to automate all your flows.",
      }),
      href: "/app/settings/developers",
    },
  ] as (IntegrationLinkCardProps | IntegrationSwitchCardProps)[];

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
        <Stack direction={{ base: "column", md: "row" }} flex="1" spacing={4}>
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
          <Center>
            <Button
              variant="outline"
              colorScheme="blue"
              backgroundColor="white"
              as="a"
              target="_blank"
              rel="noopener"
              href="https://roadmap.onparallel.com/feature-requests?category=integrations&selectedCategory=integrations"
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
          </Center>
        </Stack>
      </Alert>
      <Stack padding={4} spacing={5} maxWidth="container.sm" paddingBottom={16}>
        {integrations.map((integration, index) => {
          if (isDefined((integration as IntegrationSwitchCardProps).onChange)) {
            return <IntegrationSwitchCard key={index} {...integration} />;
          }

          if (isDefined((integration as IntegrationLinkCardProps).href)) {
            return (
              <IntegrationLinkCard key={index} {...(integration as IntegrationLinkCardProps)} />
            );
          }
        })}
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
        organization {
          id
          hasDowJones: hasIntegration(integration: DOW_JONES_KYC)
        }
      }
    }
    ${SettingsLayout.fragments.Query}
  `,
];

OrganizationIntegrations.mutations = [
  gql`
    mutation OrganizationIntegrations_createDowJonesFactivaIntegration(
      $clientId: String!
      $username: String!
      $password: String!
    ) {
      createDowJonesFactivaIntegration(
        clientId: $clientId
        username: $username
        password: $password
      ) {
        id
      }
    }
  `,
];

OrganizationIntegrations.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationIntegrations_userDocument);
};

export default compose(withDialogs, withApolloData)(OrganizationIntegrations);
