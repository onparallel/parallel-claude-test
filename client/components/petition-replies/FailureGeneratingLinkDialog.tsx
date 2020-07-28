import { Text } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";

export type FailureGeneratingLinkDialogProps = {
  filename: string;
};

export function FailureGeneratingLinkDialog({
  filename,
  ...props
}: DialogProps<FailureGeneratingLinkDialogProps>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.replies.download-file-error-dialog.header"
          defaultMessage="Error downloading {filename}"
          values={{
            filename,
          }}
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="petition.replies.download-file-error-dialog.body"
            defaultMessage="There was a problem generating the link for {filename}. This usually means that the upload from the user failed."
            values={{
              filename,
            }}
          />
        </Text>
      }
      confirm={<></>}
      {...props}
    />
  );
}

export function useFailureGeneratingLinkDialog() {
  return useDialog(FailureGeneratingLinkDialog);
}
