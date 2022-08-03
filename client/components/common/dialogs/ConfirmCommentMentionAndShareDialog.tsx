import { Button, Stack, Text } from "@chakra-ui/react";
import { FormattedList, FormattedMessage } from "react-intl";
import { ConfirmDialog } from "./ConfirmDialog";
import { DialogProps, useDialog } from "./DialogProvider";

interface ConfirmCommentMentionAndShareDialogProps {
  names: string[];
}

function ConfirmCommentMentionAndShareDialog({
  names,
  ...props
}: DialogProps<ConfirmCommentMentionAndShareDialogProps, boolean>) {
  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      header={
        <FormattedMessage
          id="component.confirm-comment-mention-and-share-dialog.header"
          defaultMessage="Users without access"
        />
      }
      body={
        <Stack>
          <FormattedMessage
            id="component.confirm-comment-mention-and-share-dialog.body"
            defaultMessage="{users} will not be able to see your note because they have no access to the parallel."
            values={{
              users: (
                <FormattedList
                  value={names.map((name, i) => (
                    <b style={{ display: "contents" }} key={i}>
                      {name}
                    </b>
                  ))}
                />
              ),
              count: names.length,
            }}
          />
          <Text>
            <FormattedMessage
              id="component.confirm-comment-mention-and-share-dialog.body-confirm"
              defaultMessage="Do you want to share the parallel so they can see your message?"
              values={{ count: names.length }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve(true)}>
          <FormattedMessage id="generic.yes-continue" defaultMessage="Yes, continue" />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onResolve(false)}>
          <FormattedMessage
            id="component.confirm-comment-mention-and-share-dialog.cancel"
            defaultMessage="No, add without sharing"
          />
        </Button>
      }
    />
  );
}

export function useConfirmCommentMentionAndShareDialog() {
  return useDialog(ConfirmCommentMentionAndShareDialog);
}
