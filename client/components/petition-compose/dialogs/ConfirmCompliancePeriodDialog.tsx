import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmCompliancePeriodDialog({
  months,
  ...props
}: DialogProps<{ months: number }>) {
  return (
    <ConfirmDialog
      size="xl"
      header={
        <FormattedMessage
          id="component.confirm-compliance-period-dialog.header"
          defaultMessage="Confirm data retention period"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-compliance-period-dialog.body"
              defaultMessage="This petition has been closed more than <b>{months, plural, =1{# month} other{# months}} ago</b>. If you confirm this changes, the petition will be anonymized in the next 24 hours and all sensitive information will be deleted. You will not lose access to the petition."
              values={{ months }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="generic.confirm-continue"
              defaultMessage="Are you sure you want to continue?"
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.yes-continue" defaultMessage="Yes, continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmCompliancePeriodDialog() {
  return useDialog(ConfirmCompliancePeriodDialog);
}
