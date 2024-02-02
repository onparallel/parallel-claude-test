import { Button, HStack, Text } from "@chakra-ui/react";
import { ExclamationOutlineIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Link } from "@parallel/components/common/Link";
import { FormattedMessage } from "react-intl";

export function PreviewDowJonesPermissionDeniedDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      header={
        <HStack>
          <ExclamationOutlineIcon boxSize={5} />
          <Text>
            <FormattedMessage
              id="component.preview-dow-jones-permission-denied-dialog.title"
              defaultMessage="Permissions needed"
            />
          </Text>
        </HStack>
      }
      body={
        <Text>
          <FormattedMessage
            id="component.preview-dow-jones-permission-denied-dialog.description-1"
            defaultMessage="Authorization is required to search in Dow Jones. Please connect an account to be able to use this field from {integrations}."
            values={{
              integrations: (
                <Link href={`/app/organization/integrations`}>
                  <Text as="span">
                    <FormattedMessage
                      id="page.organization-integrations.title"
                      defaultMessage="Integrations"
                    />
                  </Text>
                </Link>
              ),
            }}
          />
        </Text>
      }
      cancel={<></>}
      confirm={
        <Button onClick={() => props.onResolve()} colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      {...props}
    />
  );
}

export function usePreviewDowJonesPermissionDeniedDialog() {
  return useDialog(PreviewDowJonesPermissionDeniedDialog);
}
