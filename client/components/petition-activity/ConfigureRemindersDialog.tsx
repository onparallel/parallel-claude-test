import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Flex,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import {
  PetitionAccessTable_PetitionAccessFragment,
  RemindersConfig,
} from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionRemindersConfig } from "../petition-compose/PetitionRemindersConfig";

export type ConfigureRemindersDialogProps = {
  accesses: PetitionAccessTable_PetitionAccessFragment[];
  defaultRemindersConfig: Maybe<RemindersConfig>;
  remindersActive: boolean;
};

export function ConfigureRemindersDialog({
  accesses,
  defaultRemindersConfig,
  remindersActive,
  ...props
}: DialogProps<ConfigureRemindersDialogProps, Maybe<RemindersConfig>>) {
  const [remindersConfig, setRemindersConfig] = useState<
    Maybe<RemindersConfig>
  >(defaultRemindersConfig);

  const unsubscribedRemindersContacts = accesses.filter(
    (access) => access.remindersUnsubscribed
  );

  return (
    <ConfirmDialog
      size="xl"
      header={
        <FormattedMessage
          id="petition.reminder-settings-dialog.header"
          defaultMessage="Configure automatic reminders"
        />
      }
      body={
        <Stack spacing={4}>
          {unsubscribedRemindersContacts.length ? (
            <Alert
              status="warning"
              backgroundColor="orange.100"
              borderRadius="md"
            >
              <Flex alignItems="center" justifyContent="flex-start">
                <AlertIcon color="yellow.500" />
                <AlertDescription>
                  <Text>
                    <FormattedMessage
                      id="component.reminder-settings-dialog.unsubscribed-contacts-list"
                      defaultMessage="The following contacts are unsubscribed to reminders and the settings will not be applied to them:"
                    />
                  </Text>
                  <UnorderedList paddingLeft={2}>
                    {unsubscribedRemindersContacts.map((petitionAccess) => (
                      <ListItem key={petitionAccess!.id} s>
                        <Text as="span">
                          {petitionAccess?.contact?.fullName}
                        </Text>
                      </ListItem>
                    ))}
                  </UnorderedList>
                </AlertDescription>
              </Flex>
            </Alert>
          ) : null}
          <PetitionRemindersConfig
            id="petition-reminders"
            value={remindersConfig}
            defaultActive={remindersActive}
            onChange={setRemindersConfig}
            marginTop={2}
          />
        </Stack>
      }
      confirm={
        <Button
          colorScheme="purple"
          onClick={() => props.onResolve(remindersConfig)}
        >
          <FormattedMessage
            id="petition.reminder-settings-dialog.confirm"
            defaultMessage="Apply changes"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfigureRemindersDialog() {
  return useDialog(ConfigureRemindersDialog);
}
