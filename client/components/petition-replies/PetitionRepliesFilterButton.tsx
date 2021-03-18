import {
  Box,
  Button,
  Checkbox,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
} from "@chakra-ui/react";
import { FilterIcon } from "@parallel/chakra/icons";
import { PetitionFieldFilter } from "@parallel/utils/filterPetitionFields";
import { ValueProps } from "@parallel/utils/ValueProps";
import { FormattedMessage, useIntl } from "react-intl";

type PetitionRepliesFilterButton = ValueProps<PetitionFieldFilter, false>;

export function PetitionRepliesFilterButton({
  value,
  onChange,
}: PetitionRepliesFilterButton) {
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
          <MenuItem
            onClick={(e) =>
              onChange({ ...value, SHOW_NOT_REPLIED: !value.SHOW_NOT_REPLIED })
            }
          >
            <Checkbox
              colorScheme="purple"
              isChecked={value.SHOW_NOT_REPLIED}
              marginRight={2}
            />
            <FormattedMessage
              id="component.petition-replies-filter-button.show-no-replies"
              defaultMessage="Show fields without replies"
            />
          </MenuItem>
          <MenuItem
            onClick={(e) =>
              onChange({ ...value, SHOW_NOT_VISIBLE: !value.SHOW_NOT_VISIBLE })
            }
          >
            <Checkbox
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
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
}
