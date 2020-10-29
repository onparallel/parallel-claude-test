import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { RemindersConfig } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionRemindersConfig } from "../petition-compose/PetitionRemindersConfig";

export type ConfigureRemindersDialogProps = {
  defaultRemindersConfig: Maybe<RemindersConfig>;
  enabled: boolean;
};

export type ConfigureRemindersDialogResult = {
  remindersConfig: Maybe<RemindersConfig>;
};

export function ConfigureRemindersDialog({
  defaultRemindersConfig,
  enabled,
  ...props
}: DialogProps<ConfigureRemindersDialogProps, ConfigureRemindersDialogResult>) {
  const [remindersConfig, setRemindersConfig] = useState<
    Maybe<RemindersConfig>
  >(defaultRemindersConfig);

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
          onChange={setRemindersConfig}
          marginTop={2}
        />
      }
      confirm={
        <Button
          colorScheme="purple"
          onClick={() => props.onResolve({ remindersConfig })}
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
