import { Button, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { UserGroupReference } from "@parallel/components/petition-activity/UserGroupReference";
import { UserReference } from "@parallel/components/petition-activity/UserReference";
import { usePetitionCommentsMutations_getUsersOrGroupsQuery } from "@parallel/graphql/__types";
import { partitionOnTypename } from "@parallel/utils/apollo/typename";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { ConfirmDialog } from "./ConfirmDialog";
import { DialogProps, useDialog } from "./DialogProvider";

interface ConfirmCommentMentionAndShareDialogProps {
  usersAndGroups: usePetitionCommentsMutations_getUsersOrGroupsQuery["getUsersOrGroups"];
  isNote?: Maybe<boolean>;
}

function ConfirmCommentMentionAndShareDialog({
  usersAndGroups,
  isNote,
  ...props
}: DialogProps<ConfirmCommentMentionAndShareDialogProps, boolean>) {
  const intl = useIntl();
  const [users, groups] = partitionOnTypename(usersAndGroups, "User");
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
            defaultMessage="The following {entries} won't be able to see your {isNote, select, true{note} other{comment}} because the parallel is not shared with them:"
            values={{
              isNote,
              entries: intl.formatList(
                [
                  users.length > 0
                    ? intl
                        .formatMessage({ id: "generic.users", defaultMessage: "Users" })
                        .toLowerCase()
                    : null,
                  groups.length > 0
                    ? intl
                        .formatMessage({ id: "generic.groups", defaultMessage: "Teams" })
                        .toLowerCase()
                    : null,
                ].filter(isDefined),
                { type: "conjunction" }
              ),
            }}
          />
          <UnorderedList paddingLeft={2}>
            {[...users, ...groups].map((t, i) => (
              <ListItem key={i}>
                {t.__typename === "User" ? (
                  <UserReference user={t} />
                ) : (
                  <UserGroupReference userGroup={t} />
                )}
              </ListItem>
            ))}
          </UnorderedList>

          <Text>
            <FormattedMessage
              id="component.confirm-comment-mention-and-share-dialog.body-confirm"
              defaultMessage="Do you want to share the parallel with them so the message can be read?"
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve(true)}>
          <FormattedMessage
            id="component.confirm-comment-mention-and-share-dialog.confirm"
            defaultMessage="Yes, share parallel"
          />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onResolve(false)}>
          <FormattedMessage
            id="component.confirm-comment-mention-and-share-dialog.cancel"
            defaultMessage="No, continue without sharing"
          />
        </Button>
      }
    />
  );
}

export function useConfirmCommentMentionAndShareDialog() {
  return useDialog(ConfirmCommentMentionAndShareDialog);
}
