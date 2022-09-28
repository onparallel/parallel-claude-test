import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PublicPetitionFieldCommentContent_PetitionFieldCommentFragment } from "@parallel/graphql/__types";
import { sanitizeHtml } from "@parallel/utils/sanitizeHtml";
import parse from "html-react-parser";
import { useMemo } from "react";

interface PublicPetitionFieldCommentContentProps {
  comment: PublicPetitionFieldCommentContent_PetitionFieldCommentFragment;
}

export const PublicPetitionFieldCommentContent = Object.assign(
  chakraForwardRef<"div", PublicPetitionFieldCommentContentProps>(function CommentContent(
    { comment, ...props },
    ref
  ) {
    const memoizedHtml = useMemo(() => {
      return comment.contentHtml ? parse(sanitizeHtml(comment.contentHtml)) : null;
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
      `,
    },
  }
);
