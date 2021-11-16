import { Button, ButtonProps } from "@chakra-ui/react";
import { CommentIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { useIntl } from "react-intl";
import { RecipientViewCommentsBadge } from "./RecipientViewCommentsBadge";

interface CommentsButtonProps extends ButtonProps {
  commentCount: number;
  hasUnreadComments: boolean;
}

export const CommentsButton = chakraForwardRef<"button", CommentsButtonProps>(
  function CommentsButton({ commentCount, hasUnreadComments, ...props }, ref) {
    const intl = useIntl();
    const common = {
      size: "sm",
      fontWeight: "normal",
      "aria-label": intl.formatMessage(
        {
          id: "generic.comments-button-label",
          defaultMessage:
            "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
        },
        { commentCount }
      ),
      ...props,
    } as const;

    return commentCount > 0 ? (
      <Button ref={ref} rightIcon={<CommentIcon fontSize="16px" />} {...common}>
        <RecipientViewCommentsBadge hasUnreadComments={hasUnreadComments} marginRight={2} />
        {intl.formatNumber(commentCount)}
      </Button>
    ) : (
      <ResponsiveButtonIcon
        icon={<CommentIcon fontSize="16px" />}
        ref={ref}
        breakpoint="sm"
        hideIconOnDesktop={true}
        label={intl.formatMessage({
          id: "recipient-view.doubts-button",
          defaultMessage: "Questions?",
        })}
        {...common}
      />
    );
  }
);
