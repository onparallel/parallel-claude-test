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
import { ContactLink } from "../common/ContactLink";
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

  const optedOut = accesses.filter((access) => access.remindersOptOut);

  return (
    <ConfirmDialog
      size="xl"
      header={
        <FormattedMessage
          id="component.configure-reminder-settings-dialog.header"
          defaultMessage="Configure automatic reminders"
        />
      }
      body={
        <Stack spacing={4}>
          {optedOut.length ? (
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
                      id="component.configure-reminder-settings-dialog.opted-out-warning"
                      defaultMessage="The following contacts opted out from receiving reminders and any changes will not apply to them:"
                    />
                  </Text>
                  <UnorderedList paddingLeft={2}>
                    {optedOut.map((pa) => (
                      <ListItem key={pa.id}>
                        <ContactLink contact={pa.contact} />
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
            id="component.configure-reminder-settings-dialog.confirm"
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
