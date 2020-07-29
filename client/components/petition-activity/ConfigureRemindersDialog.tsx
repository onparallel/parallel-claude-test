import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";
import { PetitionRemindersConfig } from "../petition-compose/PetitionRemindersConfig";
import { useState } from "react";
import { RemindersConfig, Maybe } from "@parallel/graphql/__types";

export type ConfigureRemindersDialogProps = {
  defaultConfig: Maybe<RemindersConfig>;
  enabled: boolean;
};

export type ConfigureRemindersDialogResult = {
  remindersConfig: Maybe<RemindersConfig>;
};

export function ConfigureRemindersDialog({
  defaultConfig,
  enabled,
  ...props
}: DialogProps<ConfigureRemindersDialogProps, ConfigureRemindersDialogResult>) {
  const [reminderIsActive, setActive] = useState<boolean>(enabled);
  const [remindersConfig, setConfig] = useState<Maybe<RemindersConfig>>(
    defaultConfig
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
        <PetitionRemindersConfig
          id="petition-reminders"
          value={remindersConfig}
          onChange={setConfig}
          isEnabled={reminderIsActive}
          onSwitched={setActive}
          marginTop={2}
        />
      }
      confirm={
        <Button
          colorScheme="purple"
          onClick={() =>
            props.onResolve({
              remindersConfig: reminderIsActive ? remindersConfig : null,
            })
          }
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
