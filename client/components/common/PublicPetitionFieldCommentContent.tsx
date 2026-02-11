import { gql } from "@apollo/client";
import { Box, Link } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { PublicPetitionFieldCommentContent_PetitionFieldCommentFragment } from "@parallel/graphql/__types";
import { sanitizeHtml } from "@parallel/utils/sanitizeHtml";
import parse, { Element, HTMLReactParserOptions, domToReact } from "html-react-parser";
import { useMemo } from "react";

interface PublicPetitionFieldCommentContentProps {
  comment: PublicPetitionFieldCommentContent_PetitionFieldCommentFragment;
  useExcerpt?: boolean;
}

export const PublicPetitionFieldCommentContent = chakraComponent<
  "div",
  PublicPetitionFieldCommentContentProps
>(function CommentContent({ ref, comment, useExcerpt, ...props }) {
  const contentHtml = useExcerpt ? comment.excerptHtml : comment.contentHtml;
  const options: HTMLReactParserOptions = {
    replace(domNode) {
      if (domNode instanceof Element && domNode.name === "a") {
        return (
          <Link href={domNode.attribs.href} isExternal>
            {domToReact(domNode.children as any, options)}
          </Link>
        );
      }
    },
  };

  const memoizedHtml = useMemo(() => {
    return contentHtml
      ? parse(
          sanitizeHtml(contentHtml, {
            FORBID_TAGS: useExcerpt ? ["p", "a"] : [],
          }),
          options,
        )
      : null;
  }, [contentHtml]);

  return (
    <Box ref={ref} {...props}>
      {memoizedHtml}
    </Box>
  );
});

const _fragments = {
  PetitionFieldComment: gql`
    fragment PublicPetitionFieldCommentContent_PetitionFieldComment on PublicPetitionFieldComment {
      contentHtml
      excerptHtml
    }
  `,
};
