import {
  Button,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { ValueProps } from "@parallel/utils/ValueProps";

export type RecipientPortalStatusFilterValue = "ALL" | "PENDING" | "COMPLETED";

interface RecipientPortalStatusFilterProps extends ValueProps<RecipientPortalStatusFilterValue> {}

export const RecipientPortalStatusFilter = chakraForwardRef<
  "button",
  RecipientPortalStatusFilterProps
>(function RecipientPortalStatusFilter({ value, onChange, ...props }, ref) {
  const options = useSimpleSelectOptions(
    (intl) => [
      {
        value: "ALL",
        label: intl.formatMessage({
          id: "component.recipient-portal-petition-status-filter.all-processes",
          defaultMessage: "All processes",
        }),
      },
      {
        value: "PENDING",
        label: intl.formatMessage({
          id: "component.recipient-portal-petition-status-filter.pending-processes",
          defaultMessage: "Pending processes",
        }),
      },
      {
        value: "COMPLETED",
        label: intl.formatMessage({
          id: "component.recipient-portal-petition-status-filter.completed-processes",
          defaultMessage: "Completed processes",
        }),
      },
    ],
    [],
  );

  return (
    <Menu matchWidth={true}>
      <MenuButton
        ref={ref}
        as={Button}
        variant="outline"
        rightIcon={<ChevronDownIcon />}
        backgroundColor="white"
        fontWeight={400}
        {...props}
      >
        {options.find((opt) => opt.value === value)?.label ?? options[0].label}
      </MenuButton>
      <Portal>
        <MenuList>
          <MenuOptionGroup
            value={value ?? "ALL"}
            onChange={(value) => onChange(value as RecipientPortalStatusFilterValue)}
          >
            {options.map((option) => (
              <MenuItemOption key={option.value} value={option.value}>
                {option.label}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Portal>
    </Menu>
  );
});
