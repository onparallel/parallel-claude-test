import { Button, Menu, MenuButton, MenuList, Portal } from "@chakra-ui/react";
import { FilterIcon } from "@parallel/chakra/icons";
import {
  defaultFieldsFilter,
  PetitionFieldFilter,
  PetitionFieldFilterType,
} from "@parallel/utils/filterPetitionFields";
import { ValueProps } from "@parallel/utils/ValueProps";
import { FormattedMessage } from "react-intl";
import { CheckboxMenuItemOption } from "@parallel/components/common/CheckboxMenuItemOptionProps";

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
