import { ButtonOptions, ThemingProps } from "@chakra-ui/react";
import { Button } from "@parallel/components/ui";
import { CommentIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { RecipientViewCommentsBadge } from "./RecipientViewCommentsBadge";

interface CommentsButtonProps extends ButtonOptions, ThemingProps<"Button"> {
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
        { commentCount },
      ),
      ...props,
    } as const;

    return commentCount > 0 ? (
      <Button ref={ref} rightIcon={<CommentIcon fontSize="16px" />} {...common}>
        <RecipientViewCommentsBadge hasUnreadComments={hasUnreadComments} marginEnd={2} />
        {intl.formatNumber(commentCount)}
      </Button>
    ) : (
      <IconButtonWithTooltip
        icon={<CommentIcon fontSize="16px" />}
        ref={ref}
        placement="bottom"
        label={intl.formatMessage({
          id: "generic.add-comment",
          defaultMessage: "Add comment",
        })}
        {...common}
      />
    );
  },
);
