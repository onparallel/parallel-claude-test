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

export function ConfigureRemindersDialog({
  defaultConfig,
  enabled,
  ...props
}: {
  defaultConfig: Maybe<RemindersConfig>;
  enabled: boolean;
} & DialogProps<{
  remindersConfig: Maybe<RemindersConfig>;
}>) {
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
          enabled={reminderIsActive}
          onSwitched={setActive}
          marginTop={2}
        />
      }
      confirm={
        <Button
          variantColor="purple"
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
