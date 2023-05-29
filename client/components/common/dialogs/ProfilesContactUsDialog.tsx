import { Badge, Button, HStack, Stack, Text } from "@chakra-ui/react";
import { ProfilesIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { ConfirmDialog } from "./ConfirmDialog";
import { DialogProps, useDialog } from "./DialogProvider";

function ProfilesContactUsDialog({ ...props }: DialogProps<{}>) {
  const { locale } = useIntl();
  return (
    <ConfirmDialog
      {...props}
      hasCloseButton
      closeOnEsc
      size="xl"
      header={
        <HStack>
          <ProfilesIcon />
          <Text>
            <FormattedMessage
              id="component.profiles-contact-us-dialog.header"
              defaultMessage="Profiles"
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
              id="component.profiles-contact-us-dialog.body-1"
              defaultMessage="Get the most out of your legal data management by creating customized databases."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.profiles-contact-us-dialog.body-2"
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
            id="component.profiles-contact-us-dialog.learn-more-button"
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
            id="component.profiles-contact-us-dialog.contact-us"
            defaultMessage="Contact us"
          />
        </Button>
      }
    />
  );
}

export function useProfilesContactUsDialog() {
  return useDialog(ProfilesContactUsDialog);
}
