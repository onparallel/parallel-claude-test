import { gql } from "@apollo/client";
import { Box, Link } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { PetitionFieldCommentContent_PetitionFieldCommentFragment } from "@parallel/graphql/__types";
import { sanitizeHtml } from "@parallel/utils/sanitizeHtml";
import parse, { Element, HTMLReactParserOptions, domToReact } from "html-react-parser";
import { useMemo } from "react";
import { Mention } from "./Mention";

interface PetitionFieldCommentContentProps {
  comment: PetitionFieldCommentContent_PetitionFieldCommentFragment;
}

export const PetitionFieldCommentContent = chakraComponent<
  "div",
  PetitionFieldCommentContentProps
>(function CommentContent({ ref, comment, ...props }) {
  const options: HTMLReactParserOptions = {
    replace(domNode) {
      if (domNode instanceof Element && domNode.name === "mention") {
        const mention = comment.mentions.find(
          (m) => m.mentionedId === domNode.attribs["data-mention-id"],
        )!;
        return <Mention mention={mention} />;
      } else if (domNode instanceof Element && domNode.name === "a") {
        return (
          <Link href={domNode.attribs.href} isExternal>
            {domToReact(domNode.children as any, options)}
          </Link>
        );
      }
    },
  };
  const memoizedHtml = useMemo(() => {
    return comment.contentHtml
      ? parse(
          sanitizeHtml(comment.contentHtml, {
            ADD_TAGS: ["mention", "a"],
            ADD_ATTR: ["data-mention-id"],
          }),
          options,
        )
      : null;
  }, [comment.contentHtml]);

  return (
    <Box ref={ref} {...props}>
      {memoizedHtml}
    </Box>
  );
});

const _fragments = {
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
  `,
};
