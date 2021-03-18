import { Box, Center, Flex, Text } from "@chakra-ui/react";
import { FilterIcon } from "@parallel/chakra/icons";
import { Divider } from "@parallel/components/common/Divider";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { PetitionFieldFilterType } from "@parallel/utils/filterPetitionFields";
import { FormattedMessage, useIntl } from "react-intl";

export function PetitionRepliesFilteredFields({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  fields: { SHOW_NOT_REPLIED, SHOW_NOT_VISIBLE },
}: {
  fields: Partial<Record<PetitionFieldFilterType, number>>;
}) {
  const intl = useIntl();
  return (
    <Center position="relative" role="separator">
      <Divider
        position="absolute"
        top="50%"
        width="100%"
        borderStyle="dashed"
      />
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
            <Text as="ul" fontSize="sm" listStyleType="none">
              {SHOW_NOT_REPLIED ? (
                <Text as="li">
                  <FormattedMessage
                    id="component.petition-replies-filtered-fields.no-replies"
                    defaultMessage="{count, plural, =1 {1 field} other {# fields}} don't have replies"
                    values={{
                      count: SHOW_NOT_REPLIED ?? 0,
                    }}
                  />
                </Text>
              ) : null}
              {SHOW_NOT_VISIBLE ? (
                <Text as="li">
                  <FormattedMessage
                    id="component.petition-replies-filtered-fields.non-activated"
                    defaultMessage="{count, plural, =1 {1 field} other {# fields}} are <x>not activated</x>"
                    values={{
                      count: SHOW_NOT_VISIBLE ?? 0,
                      x: (chunks: any[]) => (
                        <Box
                          as="span"
                          textDecoration="underline dotted"
                          title={intl.formatMessage({
                            id: "generic.non-activated-fields-explanation",
                            defaultMessage:
                              "Fields where visibility conditions are not met",
                          })}
                        >
                          {chunks}
                        </Box>
                      ),
                    }}
                  />
                </Text>
              ) : null}
            </Text>
          }
        >
          <Flex alignItems="center" cursor="help">
            <FilterIcon marginRight={1} />
            <FormattedMessage
              id="component.petition-contents.hidden-fields-divider"
              defaultMessage="{count, plural, =1 {1 hidden field} other {# hidden fields}}"
              values={{
                count: (SHOW_NOT_REPLIED ?? 0) + (SHOW_NOT_VISIBLE ?? 0),
              }}
            />
          </Flex>
        </SmallPopover>
      </Text>
    </Center>
  );
}
