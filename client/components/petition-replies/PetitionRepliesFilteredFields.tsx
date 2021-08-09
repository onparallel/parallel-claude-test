import { Center, Flex, Text } from "@chakra-ui/react";
import { EyeOffIcon } from "@parallel/chakra/icons";
import { Divider } from "@parallel/components/common/Divider";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { FormattedMessage } from "react-intl";

export function PetitionRepliesFilteredFields({ count }: { count: number }) {
  return (
    <Center position="relative" role="separator">
      <Divider position="absolute" top="50%" width="100%" borderStyle="dashed" />
      <Text
        as="div"
        backgroundColor="gray.50"
        paddingX={1}
        fontSize="xs"
        color="gray.500"
        zIndex="1"
      >
        <SmallPopover
          content={
            <Text fontSize="sm">
              <FormattedMessage
                id="component.petition-replies-filtered-fields.hidden-fields-explanation"
                defaultMessage="Fields not shown to the recipient because the visibility conditions are not met."
              />
            </Text>
          }
        >
          <Flex alignItems="center">
            <EyeOffIcon marginRight={1} />
            <FormattedMessage
              id="component.petition-replies-filtered-fields.hidden-fields-divider"
              defaultMessage="{count, plural, =1 {1 field is} other {# fields are}} not applicable"
              values={{ count }}
            />
          </Flex>
        </SmallPopover>
      </Text>
    </Center>
  );
}
