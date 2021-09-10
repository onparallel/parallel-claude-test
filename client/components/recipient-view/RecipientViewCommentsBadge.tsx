import { Box, BoxProps, Circle, Tooltip } from "@chakra-ui/react";
import { useIntl } from "react-intl";

export interface RecipientViewCommentsBadgeProps extends BoxProps {
  hasUnreadComments?: boolean;
  isReversedPurple?: boolean;
}

export function RecipientViewCommentsBadge({
  hasUnreadComments,
  isReversedPurple,
  boxSize,
  ...props
}: RecipientViewCommentsBadgeProps) {
  const intl = useIntl();
  const label = intl.formatMessage({
    id: "recipient-view.unread-comments",
    defaultMessage: "There's unread comments",
  });
  return hasUnreadComments ? (
    <Box display="inline-block" aria-label={label} role="img" {...props}>
      <Tooltip label={label}>
        <Circle
          boxSize={boxSize ?? 2}
          backgroundColor={isReversedPurple ? "white" : "purple.500"}
        />
      </Tooltip>
    </Box>
  ) : null;
}
