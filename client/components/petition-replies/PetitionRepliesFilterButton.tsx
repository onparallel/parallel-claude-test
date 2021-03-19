import {
  Box,
  Button,
  Checkbox,
  Flex,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  Portal,
  Text,
} from "@chakra-ui/react";
import { FilterIcon } from "@parallel/chakra/icons";
import { PetitionFieldFilter } from "@parallel/utils/filterPetitionFields";
import { ValueProps } from "@parallel/utils/ValueProps";
import { FormattedMessage, useIntl } from "react-intl";

type PetitionRepliesFilterButtonProps = ValueProps<PetitionFieldFilter, false>;

export function PetitionRepliesFilterButton({
  value,
  onChange,
}: PetitionRepliesFilterButtonProps) {
  const intl = useIntl();
  return (
    <Menu closeOnSelect={false}>
      <MenuButton
        as={Button}
        size="sm"
        variant="outline"
        leftIcon={<FilterIcon />}
      >
        <FormattedMessage
          id="component.petition-replies-filter-button.text"
          defaultMessage="Filter"
        />
      </MenuButton>
      <Portal>
        <MenuList minWidth="160px">
          <MenuItemOption
            icon={<></>}
            iconSpacing={0}
            isChecked={value.SHOW_NOT_REPLIED}
            type="checkbox"
            onClick={() =>
              onChange({ ...value, SHOW_NOT_REPLIED: !value.SHOW_NOT_REPLIED })
            }
          >
            <Flex alignItems="center">
              <Checkbox
                role="presentation"
                pointerEvents="none"
                colorScheme="purple"
                isChecked={value.SHOW_NOT_REPLIED}
                marginRight={2}
              />
              <FormattedMessage
                id="component.petition-replies-filter-button.show-no-replies"
                defaultMessage="Show fields without replies"
              />
            </Flex>
          </MenuItemOption>
          <MenuItemOption
            icon={<></>}
            iconSpacing={0}
            isChecked={value.SHOW_NOT_VISIBLE}
            type="checkbox"
            onClick={() =>
              onChange({ ...value, SHOW_NOT_VISIBLE: !value.SHOW_NOT_VISIBLE })
            }
          >
            <Flex alignItems="center">
              <Checkbox
                role="presentation"
                pointerEvents="none"
                colorScheme="purple"
                isChecked={value.SHOW_NOT_VISIBLE}
                marginRight={2}
              />
              <Text as="span">
                <FormattedMessage
                  id="component.petition-replies-filter-button.show-not-visibible"
                  defaultMessage="Show <x>non-activated</x> fields"
                  values={{
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
            </Flex>
          </MenuItemOption>
        </MenuList>
      </Portal>
    </Menu>
  );
}
