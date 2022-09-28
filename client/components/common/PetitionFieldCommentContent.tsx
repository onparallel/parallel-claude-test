import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldCommentContent_PetitionFieldCommentFragment } from "@parallel/graphql/__types";
import { sanitizeHtml } from "@parallel/utils/sanitizeHtml";
import parse, { Element, HTMLReactParserOptions } from "html-react-parser";
import { useMemo } from "react";
import { Mention } from "./Mention";

interface PetitionFieldCommentContentProps {
  comment: PetitionFieldCommentContent_PetitionFieldCommentFragment;
}

export const PetitionFieldCommentContent = Object.assign(
  chakraForwardRef<"div", PetitionFieldCommentContentProps>(function CommentContent(
    { comment, ...props },
    ref
  ) {
    const options: HTMLReactParserOptions = {
      replace(domNode) {
        if (domNode instanceof Element && domNode.name === "mention") {
          const mention = comment.mentions.find(
            (m) => m.mentionedId === domNode.attribs["data-mention-id"]
          )!;
          return <Mention mention={mention} />;
        }
      },
    };
    const memoizedHtml = useMemo(() => {
      return comment.contentHtml
        ? parse(
            sanitizeHtml(comment.contentHtml, {
              ADD_TAGS: ["mention"],
              ADD_ATTR: ["data-mention-id"],
            }),
            options
          )
        : null;
    }, [comment.contentHtml]);

    return (
      <Box ref={ref} {...props}>
        {memoizedHtml}
      </Box>
    );
  }),
  {
    fragments: {
      PetitionFieldComment: gql`
        fragment PetitionFieldCommentContent_PetitionFieldComment on PetitionFieldComment {
          contentHtml
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
        ${Mention.fragments.PetitionFieldCommentMention}
      `,
    },
  }
);
