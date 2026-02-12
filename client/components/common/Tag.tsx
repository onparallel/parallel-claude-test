import { gql } from "@apollo/client";
import { Center } from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { Tag_TagFragment } from "@parallel/graphql/__types";
import { Box } from "@parallel/components/ui";
import { useIntl } from "react-intl";
import { OverflownText } from "./OverflownText";

export interface TagProps {
  tag: Tag_TagFragment;
  isRemovable?: boolean;
  onRemove?: (event: any) => void;
}

export const Tag = chakraComponent<"div", TagProps>(function Tag({
  ref,
  tag,
  isRemovable,
  onRemove,
  ...props
}) {
  const intl = useIntl();
  return (
    <Box
      ref={ref}
      borderRadius="full"
      height="24px"
      paddingX={2}
      paddingEnd={isRemovable ? 0 : undefined}
      display="flex"
      alignItems="center"
      backgroundColor={tag.color}
      fontSize="sm"
      {...props}
    >
      <OverflownText lineHeight="24px" color="gray.900">
        {tag.name}
      </OverflownText>
      {isRemovable ? (
        <Center
          as="button"
          aria-label={intl.formatMessage(
            {
              id: "component.tag.remove-tag",
              defaultMessage: 'Remove tag "{tag}"',
            },
            { tag: tag.name },
          )}
          alignSelf="stretch"
          paddingEnd={2}
          paddingStart={1}
          color="gray.600"
          _hover={{ color: "gray.900" }}
          onClick={onRemove}
        >
          <CloseIcon fontSize="9px" />
        </Center>
      ) : null}
    </Box>
  );
});

const _fragments = {
  Tag: gql`
    fragment Tag_Tag on Tag {
      name
      color
    }
  `,
};
