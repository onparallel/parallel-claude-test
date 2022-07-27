import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PublicPetitionFieldCommentContent_PetitionFieldCommentFragment } from "@parallel/graphql/__types";
import { sanitizeHtml } from "@parallel/utils/sanitizeHtml";
import parse, { Element, HTMLReactParserOptions } from "html-react-parser";
import { useMemo } from "react";
import { Mention } from "./Mention";

interface PublicPetitionFieldCommentContentProps {
  comment: PublicPetitionFieldCommentContent_PetitionFieldCommentFragment;
}

export const PublicPetitionFieldCommentContent = Object.assign(
  chakraForwardRef<"div", PublicPetitionFieldCommentContentProps>(function CommentContent(
    { comment, ...props },
    ref
  ) {
    const options: HTMLReactParserOptions = {
      replace(domNode) {
        if (domNode instanceof Element && domNode.name === "mention") {
          return <Box>{"mention"}</Box>;
        }
      },
    };
    const memoizedHtml = useMemo(() => {
      return parse(
        sanitizeHtml(comment.contentHtml, {
          ADD_TAGS: ["mention"],
          ADD_ATTR: ["data-mention-id"],
        }),
        options
      );
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
        fragment PublicPetitionFieldCommentContent_PetitionFieldComment on PublicPetitionFieldComment {
          contentHtml
        }
        ${Mention.fragments.PetitionFieldCommentMention}
      `,
    },
  }
);
