import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { PublicPetitionFieldCommentExcerpt_PetitionFieldCommentFragment } from "@parallel/graphql/__types";
import { sanitizeHtml } from "@parallel/utils/sanitizeHtml";
import parse from "html-react-parser";
import { useMemo } from "react";

interface PublicPetitionFieldCommentExcerptProps {
  comment: PublicPetitionFieldCommentExcerpt_PetitionFieldCommentFragment;
}

export const PublicPetitionFieldCommentExcerpt = chakraComponent<
  "div",
  PublicPetitionFieldCommentExcerptProps
>(function CommentContent({ ref, comment, ...props }) {
  const memoizedHtml = useMemo(() => {
    return comment.excerptHtml
      ? parse(
          sanitizeHtml(comment.excerptHtml, {
            FORBID_TAGS: ["p", "a"],
          }),
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
    fragment PublicPetitionFieldCommentExcerpt_PetitionFieldComment on PublicPetitionFieldComment {
      excerptHtml
    }
  `,
};
