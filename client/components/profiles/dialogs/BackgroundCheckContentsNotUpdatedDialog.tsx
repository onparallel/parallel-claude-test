import { Text } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Stack } from "@parallel/components/ui";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";

export function BackgroundCheckContentsNotUpdatedDialog({ ...props }: DialogProps<{}>) {
  const focusRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      size="sm"
      initialFocusRef={focusRef}
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        <Stack direction="row" gap={2} align="center">
          <AlertCircleIcon role="presentation" />
          <Text>
            <FormattedMessage
              id="component.background-check-contents-not-updated-dialog.header"
              defaultMessage="No changes found"
            />
          </Text>
        </Stack>
      }
      body={
        <Stack gap={2}>
          <Text>
            <FormattedMessage
              id="component.background-check-contents-not-updated-dialog.message"
              defaultMessage="We have not updated the results as nothing has changed since the last search."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button
          ref={focusRef}
          colorPalette="primary"
          minWidth={24}
          onClick={() => props.onResolve()}
        >
          <FormattedMessage id="generic.ok" defaultMessage="OK" />
        </Button>
      }
      cancel={<></>}
      {...props}
    />
  );
}

export function useBackgroundCheckContentsNotUpdatedDialog() {
  return useDialog(BackgroundCheckContentsNotUpdatedDialog);
}
