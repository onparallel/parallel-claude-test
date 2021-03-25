import {
  Button,
  Checkbox,
  Flex,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  Portal,
} from "@chakra-ui/react";
import { FilterIcon } from "@parallel/chakra/icons";
import {
  defaultFieldsFilter,
  PetitionFieldFilter,
  PetitionFieldFilterType,
} from "@parallel/utils/filterPetitionFields";
import { ValueProps } from "@parallel/utils/ValueProps";
import { ReactElement } from "react";
import { FormattedMessage } from "react-intl";

type PetitionRepliesFilterButtonProps = ValueProps<PetitionFieldFilter, false>;

export function PetitionRepliesFilterButton({
  value,
  onChange,
}: PetitionRepliesFilterButtonProps) {
  const handleChange = function (filter: PetitionFieldFilterType) {
    return (isChecked: boolean) => {
      onChange({ ...value, [filter]: isChecked });
    };
  };
  const isActive = (Object.keys(
    defaultFieldsFilter
  ) as PetitionFieldFilterType[]).some((t) => value[t]);
  return (
    <Menu closeOnSelect={false}>
      <MenuButton
        as={Button}
        size="sm"
        variant="outline"
        colorScheme={isActive ? "purple" : undefined}
        leftIcon={<FilterIcon />}
      >
        <FormattedMessage
          id="component.petition-replies-filter-button.text"
          defaultMessage="Filter"
        />
      </MenuButton>
      <Portal>
        <MenuList minWidth="160px">
          <CheckboxMenuItemOption
            value={value.SHOW_REPLIED}
            onChange={handleChange("SHOW_REPLIED")}
          >
            <FormattedMessage
              id="component.petition-replies-filter-button.show-with-replies"
              defaultMessage="With replies"
            />
          </CheckboxMenuItemOption>
          <CheckboxMenuItemOption
            value={value.SHOW_REVIEWED}
            onChange={handleChange("SHOW_REVIEWED")}
          >
            <FormattedMessage
              id="component.petition-replies-filter-button.show-reviewed"
              defaultMessage="Reviewed"
            />
          </CheckboxMenuItemOption>
          <CheckboxMenuItemOption
            value={value.SHOW_NOT_REVIEWED}
            onChange={handleChange("SHOW_NOT_REVIEWED")}
          >
            <FormattedMessage
              id="component.petition-replies-filter-button.show-not-reviewed"
              defaultMessage="Not reviewed"
            />
          </CheckboxMenuItemOption>
          <CheckboxMenuItemOption
            value={value.SHOW_WITH_COMMENTS}
            onChange={handleChange("SHOW_WITH_COMMENTS")}
          >
            <FormattedMessage
              id="component.petition-replies-filter-button.show-with-comments"
              defaultMessage="With comments"
            />
          </CheckboxMenuItemOption>
        </MenuList>
      </Portal>
    </Menu>
  );
}

interface CheckboxMenuItemOptionProps extends ValueProps<boolean, false> {
  children?: ReactElement;
}

function CheckboxMenuItemOption({
  children,
  value,
  onChange,
}: CheckboxMenuItemOptionProps) {
  return (
    <MenuItemOption
      icon={<></>}
      iconSpacing={0}
      isChecked={value}
      type="checkbox"
      onClick={() => onChange(!value)}
    >
      <Flex alignItems="center">
        <Checkbox
          role="presentation"
          pointerEvents="none"
          colorScheme="purple"
          isChecked={value}
          marginRight={2}
        />
        {children}
      </Flex>
    </MenuItemOption>
  );
}
