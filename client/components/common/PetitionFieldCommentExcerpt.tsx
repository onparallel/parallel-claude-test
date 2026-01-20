import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldCommentExcerpt_PetitionFieldCommentFragment } from "@parallel/graphql/__types";
import { sanitizeHtml } from "@parallel/utils/sanitizeHtml";
import parse, { Element, HTMLReactParserOptions } from "html-react-parser";
import { useMemo } from "react";
import { Mention } from "./Mention";

interface PetitionFieldCommentExcerptProps {
  comment: PetitionFieldCommentExcerpt_PetitionFieldCommentFragment;
}

export const PetitionFieldCommentExcerpt = chakraForwardRef<
  "div",
  PetitionFieldCommentExcerptProps
>(function CommentContent({ comment, ...props }, ref) {
  const options: HTMLReactParserOptions = {
    replace(domNode) {
      if (domNode instanceof Element && domNode.name === "mention") {
        const mention = comment.mentions.find(
          (m) => m.mentionedId === domNode.attribs["data-mention-id"],
        )!;
        return <Mention mention={mention} />;
      }
    },
  };
  const memoizedHtml = useMemo(() => {
    return comment.excerptHtml
      ? parse(
          sanitizeHtml(comment.excerptHtml, {
            ADD_TAGS: ["mention"],
            ADD_ATTR: ["data-mention-id"],
            FORBID_TAGS: ["p", "a"],
          }),
          options,
        )
      : null;
  }, [comment.excerptHtml]);

  return (
    <Box ref={ref} {...props}>
      {memoizedHtml}
    </Box>
  );
});

const _fragments = {
  PetitionFieldComment: gql`
    fragment PetitionFieldCommentExcerpt_PetitionFieldComment on PetitionFieldComment {
      excerptHtml
      mentions {
        ... on PetitionFieldCommentUserMention {
          mentionedId
        }
        ... on PetitionFieldCommentUserGroupMention {
          mentionedId
        }
        ...Mention_PetitionFieldCommentMention
      }
    }
  `,
};
