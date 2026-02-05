import { gql } from "@apollo/client";
import { Button, ButtonOptions, ThemingProps } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { TimelineSeeReplyButton_PetitionFieldFragment } from "@parallel/graphql/__types";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { Text } from "@parallel/components/ui";

interface TimelineSeeReplyButton extends ButtonOptions, ThemingProps<"Button"> {
  field?: TimelineSeeReplyButton_PetitionFieldFragment | null;
  replyId?: string;
}

export function TimelineSeeReplyButton({ field, replyId, ...props }: TimelineSeeReplyButton) {
  const buildUrlToSection = useBuildUrlToPetitionSection();
  const reply = field?.replies.find((r) => r.id === replyId);

  return isNonNullish(field) ? (
    reply !== undefined ? (
      <NakedLink
        href={
          reply!.parent?.id
            ? buildUrlToSection("replies", { parentReply: reply.parent.id })
            : buildUrlToSection("replies", { field: field.id })
        }
      >
        <Button
          as="a"
          className="no-print"
          size="sm"
          variant="outline"
          background="white"
          {...props}
        >
          <FormattedMessage id="component.timeline-see-reply-button.see" defaultMessage="See" />
        </Button>
      </NakedLink>
    ) : (
      <Text as="span" textStyle="hint">
        <FormattedMessage
          id="component.timeline-see-reply-button.reply-deleted"
          defaultMessage="Reply deleted"
        />
      </Text>
    )
  ) : null;
}

const _fragments = {
  PetitionField: gql`
    fragment TimelineSeeReplyButton_PetitionField on PetitionField {
      id
      replies {
        ...TimelineSeeReplyButton_PetitionFieldReply
      }
    }
  `,
  PetitionFieldReply: gql`
    fragment TimelineSeeReplyButton_PetitionFieldReply on PetitionFieldReply {
      id
      parent {
        id
      }
    }
  `,
};
