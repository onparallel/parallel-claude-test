import { Badge, Button, HStack, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "./ConfirmDialog";
import { DialogProps, useDialog } from "./DialogProvider";
import { FormattedMessage, useIntl } from "react-intl";
import { TimeAlarmIcon } from "@parallel/chakra/icons";

function AlertsContactUsDialog({ ...props }: DialogProps<{}>) {
  const { locale } = useIntl();
  return (
    <ConfirmDialog
      {...props}
      hasCloseButton
      closeOnEsc
      size="xl"
      header={
        <HStack>
          <TimeAlarmIcon />
          <Text>
            <FormattedMessage
              id="component.alerts-contact-us-dialog.header"
              defaultMessage="Alerts"
            />
          </Text>
          <Badge colorScheme="blue" textTransform="uppercase">
            <FormattedMessage id="generic.new" defaultMessage="New" />
          </Badge>
        </HStack>
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.alerts-contact-us-dialog.body-1"
              defaultMessage="Program alerts on your profiles for deadline reviews."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.alerts-contact-us-dialog.body-2"
              defaultMessage="Contact us to activate it in your organization."
            />
          </Text>
        </Stack>
      }
      alternative={
        <Button
          variant="link"
          as="a"
          href={`https://www.onparallel.com/${locale}/profiles`}
          rel="noopener"
          target="_blank"
        >
          <FormattedMessage
            id="component.alerts-contact-us-dialog.learn-more-button"
            defaultMessage="Learn more"
          />
        </Button>
      }
      cancel={<></>}
      confirm={
        <Button
          colorScheme="primary"
          as="a"
          href={`https://meetings.hubspot.com/alex-romera/parallel-profiles`}
          rel="noopener"
          target="_blank"
        >
          <FormattedMessage
            id="component.alerts-contact-us-dialog.contact-us"
            defaultMessage="Contact us"
          />
        </Button>
      }
    />
  );
}

export function useAlertsContactUsDialog() {
  return useDialog(AlertsContactUsDialog);
}
