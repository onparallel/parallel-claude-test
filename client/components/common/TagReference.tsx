import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { TagReference_TagFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage } from "react-intl";
import { Tag } from "./Tag";

export function TagReference({ tag }: { tag?: Maybe<TagReference_TagFragment> }) {
  return tag ? (
    <Tag display="inline-flex" tag={tag} />
  ) : (
    <Box
      as="em"
      borderRadius="full"
      height="24px"
      paddingX={2}
      display="inline-flex"
      alignItems="center"
      backgroundColor="gray.200"
      fontSize="sm"
    >
      <FormattedMessage id="generic.deleted-tag" defaultMessage="Deleted tag" />
    </Box>
  );
}

const _fragments = {
  Tag: gql`
    fragment TagReference_Tag on Tag {
      ...Tag_Tag
    }
  `,
};
