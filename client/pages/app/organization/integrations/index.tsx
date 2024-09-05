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
  Switch,
  Text,
} from "@chakra-ui/react";
import { AlertCircleFilledIcon } from "@parallel/chakra/icons";
import { RestrictedFeatureAlert } from "@parallel/components/common/RestrictedFeatureAlert";
import { RestrictedFeaturePopover } from "@parallel/components/common/RestrictedFeaturePopover";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import {
  IntegrationLinkCard,
  IntegrationLinkCardProps,
} from "@parallel/components/organization/IntegrationLinkCard";
import {
  IntegrationSwitchCard,
  IntegrationSwitchCardProps,
} from "@parallel/components/organization/IntegrationSwitchCard";
import {
  OrganizationIntegrations_deleteDowJonesKycIntegrationDocument,
  OrganizationIntegrations_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { untranslated } from "@parallel/utils/untranslated";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, noop } from "remeda";
import { useDeactivateDowJonesIntegrationDialog } from "../../../../components/organization/integrations/dialogs/DeactivateDowJonesIntegrationDialog";
import { useDowJonesIntegrationDialog } from "../../../../components/organization/integrations/dialogs/DowJonesIntegrationDialog";

function OrganizationIntegrations() {
  const intl = useIntl();
  const {
    data: { me, realMe },
    refetch,
  } = useAssertQuery(OrganizationIntegrations_userDocument);

  const userCanEditIntegrations = useHasPermission("INTEGRATIONS:CRUD_INTEGRATIONS");
  const userHasApiAccess = useHasPermission("INTEGRATIONS:CRUD_API");

  const hasDownJones = me.organization.hasDowJones;
  const hasIdVerification = me.organization.hasIdVerification;
  const hasEInforma = me.organization.hasEInforma;

  const hasErrorDownJones = me.organization.integrations.items[0]?.invalidCredentials;

  const [deleteDowJonesKycIntegration] = useMutation(
    OrganizationIntegrations_deleteDowJonesKycIntegrationDocument,
  );

  const showDeactivateDowJonesIntegrationDialog = useDeactivateDowJonesIntegrationDialog();
  const showDowJonesIntegrationDialog = useDowJonesIntegrationDialog();
  const handleSwitchDownJones = async (isChecked: boolean) => {
    if (isChecked) {
      try {
        await showDowJonesIntegrationDialog();
        refetch();
      } catch {}
    } else {
      try {
        await showDeactivateDowJonesIntegrationDialog();
        await deleteDowJonesKycIntegration();
      } catch {}
    }
  };

  const integrations = [
    {
      isDisabled: !userCanEditIntegrations || !me.hasPetitionSignature,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/logos/signaturit.png`}
          alt={untranslated("Signaturit")}
          maxWidth="124px"
        />
      ),
      badge: me.organization.signatureIntegrations.items.some(
        (i) => i.__typename === "SignatureOrgIntegration" && i.environment === "PRODUCTION",
      ) ? (
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
        id: "page.organization-integrations.signaturit-description",
        defaultMessage: "Add digital signature to your parallels.",
      }),
      href: "/app/organization/integrations/signature",
    },
    {
      isDisabled: !userCanEditIntegrations || !me.hasPetitionSignature,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/logos/docusign.png`}
          alt={untranslated("DocuSign")}
          maxWidth="124px"
        />
      ),
      badge: me.organization.hasDocuSign ? (
        <Badge colorScheme="green">
          <FormattedMessage id="generic.activated" defaultMessage="Activated" />
        </Badge>
      ) : null,
      title: "DocuSign",
      body: intl.formatMessage({
        id: "page.organization-integrations.docusign-description",
        defaultMessage: "Add digital signature to your parallels.",
      }),
      href: "/app/organization/integrations/signature",
    },
    {
      isDisabled: !userCanEditIntegrations,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/logos/zapier.png`}
          alt={untranslated("Zapier")}
          maxWidth="100px"
        />
      ),
      title: "Zapier",
      body: intl.formatMessage({
        id: "page.organization-integrations.zapier-description",
        defaultMessage: "Automate your workflows using its +400 services.",
      }),
      href: "https://zapier.com/apps/parallel/integrations",
      isExternal: true,
    },
    {
      isDisabled: false,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/logos/open-sanctions.png`}
          alt={untranslated("OpenSanctions")}
          maxWidth="124px"
        />
      ),
      title: intl.formatMessage({
        id: "page.organization-integrations.open-sanctions-title",
        defaultMessage: "OpenSanctions",
      }),
      body: intl.formatMessage({
        id: "page.organization-integrations.open-sanctions-description",
        defaultMessage:
          "Run a background check of individuals and legal entities using its database.",
      }),
      switchButton: (
        <RestrictedFeaturePopover
          isRestricted={!me.hasBackgroundCheck}
          borderRadius="md"
          content={
            <Text>
              <FormattedMessage
                id="page.organization-integrations.open-sanctions-disabled-message"
                defaultMessage="Contact us to activate this integration and successfully meet the requirements of AML (Anti-Money Laundering). <a>Contact us</a>"
                values={{
                  a: (chunks: any) => (
                    <SupportButton
                      variant="link"
                      fontSize="sm"
                      message={intl.formatMessage({
                        id: "page.organization-integrations.open-sanctions-contact-message",
                        defaultMessage:
                          "Hi, I would like more information about OpenSanctions integration.",
                      })}
                    >
                      {chunks}
                    </SupportButton>
                  ),
                }}
              />
            </Text>
          }
        >
          <Switch isChecked={me.hasBackgroundCheck} isDisabled={true} onChange={() => {}} />
        </RestrictedFeaturePopover>
      ),
    },
    {
      isDisabled: !userCanEditIntegrations || !me.hasDowJonesFeature,
      disabledMessage: (
        <Text>
          <FormattedMessage
            id="page.organization-integrations.disabled-message"
            defaultMessage="This is an Enterprise feature. <a>Contact</a> with our support team for more information."
            values={{
              a: (chunks: any) => (
                <SupportButton
                  variant="link"
                  fontSize="sm"
                  message={intl.formatMessage({
                    id: "page.organization-integrations.dow-jones-contact-message",
                    defaultMessage:
                      "Hi, I would like more information about Dow Jones integration.",
                  })}
                >
                  {chunks}
                </SupportButton>
              ),
            }}
          />
        </Text>
      ),
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/logos/dow-jones.png`}
          alt="Dow Jones"
          maxWidth="124px"
        />
      ),
      badge: hasDownJones ? (
        hasErrorDownJones ? (
          <SmallPopover
            content={
              <Text fontSize="sm">
                <FormattedMessage
                  id="page.organization-integrations.dow-jones-error"
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
        id: "page.organization-integrations.dow-jones-title",
        defaultMessage: "Dow Jones RiskCenter",
      }),
      body: intl.formatMessage({
        id: "page.organization-integrations.dow-jones-description",
        defaultMessage:
          "Run a background check of individuals and legal entities using its database.",
      }),
      onChange: handleSwitchDownJones,
      isChecked: hasDownJones,
    },
    {
      isDisabled: true,
      disabledMessage: (
        <Text>
          <FormattedMessage
            id="page.organization-integrations.disabled-message"
            defaultMessage="This is an Enterprise feature. <a>Contact</a> with our support team for more information."
            values={{
              a: (chunks: any) => (
                <SupportButton
                  variant="link"
                  fontSize="sm"
                  message={intl.formatMessage({
                    id: "component.import-from-external-source-dialog.missing-integration-message",
                    defaultMessage:
                      "Hi, I would like more information about checking external data sources.",
                  })}
                >
                  {chunks}
                </SupportButton>
              ),
            }}
          />
        </Text>
      ),
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/logos/einforma.png`}
          alt={untranslated("eInforma")}
          maxWidth="124px"
        />
      ),
      title: untranslated("eInforma"),
      body: intl.formatMessage({
        id: "page.organization-integrations.einforma-description",
        defaultMessage: "Check official information on companies and freelancers in Spain.",
      }),
      onChange: noop,
      isChecked: hasEInforma,
    },
    {
      isDisabled: true,

      disabledMessage: (
        <Text>
          <FormattedMessage
            id="page.organization-integrations.disabled-message"
            defaultMessage="This is an Enterprise feature. <a>Contact</a> with our support team for more information."
            values={{
              a: (chunks: any) => (
                <SupportButton
                  variant="link"
                  fontSize="sm"
                  message={intl.formatMessage({
                    id: "page.organization-integrations.id-verification-contact-message",
                    defaultMessage:
                      "Hi, I would like more information about ID Verification integration.",
                  })}
                >
                  {chunks}
                </SupportButton>
              ),
            }}
          />
        </Text>
      ),
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/logos/bankflip.png`}
          alt={untranslated("ID Verification")}
          maxWidth="124px"
        />
      ),
      title: intl.formatMessage({
        id: "generic.petition-field-type-id-verification",
        defaultMessage: "ID Verification",
      }),
      body: intl.formatMessage({
        id: "page.organization-integrations.id-verification-description",
        defaultMessage:
          "Allows the verification of a person's identity using official identity documents.",
      }),
      onChange: noop,
      isChecked: hasIdVerification,
    },
    {
      isDisabled: (!userCanEditIntegrations && !userHasApiAccess) || !userHasApiAccess,
      logo: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/logos/parallel-api.png`}
          alt={intl.formatMessage({
            id: "page.organization-integrations.parallel-api-title",
            defaultMessage: "Parallel API",
          })}
          maxWidth="124px"
        />
      ),
      title: intl.formatMessage({
        id: "page.organization-integrations.parallel-api-title",
        defaultMessage: "Parallel API",
      }),
      body: intl.formatMessage({
        id: "page.organization-integrations.parallel-api-description",
        defaultMessage: "Access our API to automate all your flows.",
      }),
      href: "/app/settings/developers",
    },
  ] as (IntegrationLinkCardProps | IntegrationSwitchCardProps)[];

  return (
    <OrganizationSettingsLayout
      title={intl.formatMessage({
        id: "page.organization-integrations.title",
        defaultMessage: "Integrations",
      })}
      me={me}
      realMe={realMe}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage
            id="page.organization-integrations.title"
            defaultMessage="Integrations"
          />
        </Heading>
      }
    >
      <Box>
        <Alert status="info" paddingX={6}>
          <AlertIcon />
          <Stack
            direction={{ base: "column", md: "row" }}
            flex="1"
            justifyContent="space-between"
            spacing={4}
          >
            <Box>
              <AlertTitle>
                <FormattedMessage
                  id="page.organization-integrations.alert-title"
                  defaultMessage="Can't find the integration you need?"
                />
              </AlertTitle>
              <AlertDescription>
                <FormattedMessage
                  id="page.organization-integrations.alert-description"
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
                  id: "page.organization-integrations.alert-button",
                  defaultMessage: "Suggest integration",
                })}
              >
                <FormattedMessage
                  id="page.organization-integrations.alert-button"
                  defaultMessage="Suggest integration"
                />
              </Button>
            </Center>
          </Stack>
        </Alert>
      </Box>
      <Stack padding={4} spacing={5} maxWidth="container.sm" paddingBottom={16}>
        {integrations.map((integration, index) => {
          if (
            isNonNullish((integration as IntegrationSwitchCardProps).onChange) ||
            isNonNullish((integration as IntegrationSwitchCardProps).switchButton)
          ) {
            return <IntegrationSwitchCard key={index} {...integration} />;
          }

          if (isNonNullish((integration as IntegrationLinkCardProps).href)) {
            return (
              <IntegrationLinkCard key={index} {...(integration as IntegrationLinkCardProps)} />
            );
          }
        })}
        {!userCanEditIntegrations ? <RestrictedFeatureAlert /> : null}
      </Stack>
    </OrganizationSettingsLayout>
  );
}

OrganizationIntegrations.queries = [
  gql`
    query OrganizationIntegrations_user {
      ...OrganizationSettingsLayout_Query
      me {
        id
        hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
        hasDowJonesFeature: hasFeatureFlag(featureFlag: DOW_JONES_KYC)
        hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
        organization {
          id
          hasIdVerification: hasIntegration(integration: ID_VERIFICATION)
          hasDowJones: hasIntegration(integration: DOW_JONES_KYC)
          hasEInforma: hasIntegration(integration: PROFILE_EXTERNAL_SOURCE, provider: "EINFORMA")
          hasDocuSign: hasIntegration(integration: SIGNATURE, provider: "DOCUSIGN")
          integrations(type: DOW_JONES_KYC, limit: 1, offset: 0) {
            items {
              id
              invalidCredentials
            }
          }
          signatureIntegrations: integrations(type: SIGNATURE, limit: 20, offset: 0) {
            items {
              ... on SignatureOrgIntegration {
                id
                environment
              }
            }
            totalCount
          }
        }
      }
    }
    ${OrganizationSettingsLayout.fragments.Query}
  `,
];

OrganizationIntegrations.mutations = [
  gql`
    mutation OrganizationIntegrations_deleteDowJonesKycIntegration {
      deleteDowJonesKycIntegration {
        id
        hasDowJones: hasIntegration(integration: DOW_JONES_KYC)
      }
    }
  `,
];

OrganizationIntegrations.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationIntegrations_userDocument);
};

export default compose(withDialogs, withApolloData)(OrganizationIntegrations);
