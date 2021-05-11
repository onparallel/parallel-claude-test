import { Box, BoxProps, Tooltip } from "@chakra-ui/react";
import { If } from "@parallel/utils/conditions";
import { useIntl } from "react-intl";

export interface RecipientViewCommentsBadgeProps extends BoxProps {
  hasUnreadComments?: boolean;
  isReversedPurple?: boolean;
}

export function RecipientViewCommentsBadge({
  hasUnreadComments,
  isReversedPurple,
  ...props
}: RecipientViewCommentsBadgeProps) {
  const intl = useIntl();
  const label = intl.formatMessage({
    id: "recipient-view.unread-comments",
    defaultMessage: "There's unread comments",
  });
  return (
    <If condition={hasUnreadComments}>
      <Box display="inline-block" aria-label={label} role="img" {...props}>
        <Tooltip label={label}>
          <Box
            width="4px"
            height="4px"
            borderColor={isReversedPurple ? "white" : "purple.500"}
            borderWidth="4px"
            transform="rotate(-45deg)"
            borderRadius="9999px"
          />
        </Tooltip>
      </Box>
    </If>
  );
}
