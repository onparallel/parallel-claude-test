import { gql } from "@apollo/client";
import { Alert, AlertIcon, Button, HStack, Stack, Text } from "@chakra-ui/react";
import { AppSumoLicenseAlert_OrgLicenseFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { SupportButton } from "./SupportButton";

interface AppSumoLicenseAlertProps {
  license: AppSumoLicenseAlert_OrgLicenseFragment;
}

export function AppSumoLicenseAlert({ license }: AppSumoLicenseAlertProps) {
  const intl = useIntl();
  const planName = {
    APPSUMO1: "AppSumo Tier 1",
    APPSUMO2: "AppSumo Tier 2",
    APPSUMO3: "AppSumo Tier 3",
    APPSUMO4: "AppSumo Tier 4",
  }[license.name];
  return (
    <Alert status="info" rounded="md">
      <AlertIcon />
      <HStack spacing={4} width="100%">
        <Stack flex="1">
          <Text fontWeight="bold">
            <FormattedMessage
              id="component.appsumo-license-alert.current-plan"
              defaultMessage="Your current plan is {plan}"
              values={{ plan: planName }}
            />
          </Text>
          <Text>
            {license.name === "APPSUMO4" ? (
              <FormattedMessage
                id="component.appsumo-license-alert.contact-text-max-license"
                defaultMessage="Contact with us to increase your user and parallel limits."
              />
            ) : (
              <FormattedMessage
                id="component.appsumo-license-alert.upgrade-text"
                defaultMessage="Upgrade your plan to increase your user and parallel limits."
              />
            )}
          </Text>
        </Stack>
        {license.name === "APPSUMO4" ? (
          <SupportButton
            variant="outline"
            colorScheme="blue"
            backgroundColor="white"
            message={intl.formatMessage({
              id: "generic.upgrade-plan-support-message",
              defaultMessage:
                "Hi, I would like to get more information about how to upgrade my plan.",
            })}
          >
            <FormattedMessage id="generic.contact" defaultMessage="Contact" />
          </SupportButton>
        ) : (
          <Button
            as="a"
            href={`https://appsumo.com/account/redemption/${license.externalId}#change-plan`}
            rel="noopener"
            target="_blank"
            variant="outline"
            colorScheme="blue"
            backgroundColor="white"
          >
            <FormattedMessage id="generic.upgrade" defaultMessage="Upgrade" />
          </Button>
        )}
      </HStack>
    </Alert>
  );
}

AppSumoLicenseAlert.fragments = {
  OrgLicense: gql`
    fragment AppSumoLicenseAlert_OrgLicense on OrgLicense {
      name
      externalId
    }
  `,
};
