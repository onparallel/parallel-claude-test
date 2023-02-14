import { gql } from "@apollo/client";
import { Button, ButtonProps, Text } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { TimelineSeeReplyButton_PetitionFieldFragment } from "@parallel/graphql/__types";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";

interface TimelineSeeReplyButton extends ButtonProps {
  field?: TimelineSeeReplyButton_PetitionFieldFragment | null;
  replyId?: string;
}

export function TimelineSeeReplyButton({ field, replyId, ...props }: TimelineSeeReplyButton) {
  const buildUrlToSection = useBuildUrlToPetitionSection();
  const hasReply = field?.replies.some((r) => r.id === replyId) ?? false;

  return isDefined(field) ? (
    hasReply ? (
      <NakedLink href={buildUrlToSection("replies", { field: field.id })}>
        <Button as="a" size="sm" variant="outline" background="white" {...props}>
          <FormattedMessage id="timeline.see" defaultMessage="See" />
        </Button>
      </NakedLink>
    ) : (
      <Text as="span" textStyle="hint">
        <FormattedMessage id="timeline.reply-deleted" defaultMessage="Reply deleted" />
      </Text>
    )
  ) : null;
}

TimelineSeeReplyButton.fragments = {
  PetitionField: gql`
    fragment TimelineSeeReplyButton_PetitionField on PetitionField {
      id
      replies {
        id
      }
    }
  `,
  PetitionFieldReply: gql`
    fragment TimelineSeeReplyButton_PetitionFieldReply on PetitionFieldReply {
      id
    }
  `,
};
