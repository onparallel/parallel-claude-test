import { Box, Tooltip } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";

export type RecipientViewCommentsBadgeProps = ExtendChakra<{
  hasUnreadComments?: boolean;
  hasUnpublishedComments?: boolean;
}>;

export function RecipientViewCommentsBadge({
  hasUnreadComments,
  hasUnpublishedComments,
  ...props
}: RecipientViewCommentsBadgeProps) {
  const intl = useIntl();
  return hasUnreadComments || hasUnpublishedComments ? (
    <Box display="inline-block" {...props}>
      <Tooltip
        label={
          hasUnreadComments
            ? hasUnpublishedComments
              ? intl.formatMessage({
                  id: "recipient-view.unread-and-unpublished-comments",
                  defaultMessage: "There's unread and unpublished comments",
                })
              : intl.formatMessage({
                  id: "recipient-view.unread-comments",
                  defaultMessage: "There's unread comments",
                })
            : intl.formatMessage({
                id: "recipient-view.unpublished-comments",
                defaultMessage: "There's unpublished comments",
              })
        }
      >
        <Box
          width="4px"
          height="4px"
          {...(!hasUnreadComments
            ? { borderColor: "yellow.500" }
            : !hasUnpublishedComments
            ? { borderColor: "purple.500" }
            : {
                borderLeftColor: "yellow.500",
                borderTopColor: "yellow.500",
                borderRightColor: "purple.500",
                borderBottomColor: "purple.500",
              })}
          borderWidth="4px"
          transform="rotate(-45deg)"
          borderRadius="9999px"
        />
      </Tooltip>
    </Box>
  ) : null;
}
