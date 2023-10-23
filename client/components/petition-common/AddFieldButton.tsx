import { ButtonOptions, IconButton, ThemingProps } from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AddFieldPopoverProps } from "@parallel/components/petition-compose/AddFieldPopover";
import { memo } from "react";
import { useIntl } from "react-intl";
import { AddFieldPopover } from "../petition-compose/AddFieldPopover";

interface AddFieldButtonProps extends ButtonOptions, ThemingProps<"Button">, AddFieldPopoverProps {
  isFieldGroupChild?: boolean;
}

export const AddFieldButton = memo(
  chakraForwardRef<"button", AddFieldButtonProps>(function AddFieldButton({ ...props }, ref) {
    const intl = useIntl();
    return (
      <AddFieldPopover
        ref={ref as any}
        as={IconButton}
        label={intl.formatMessage({
          id: "component.add-field-button.label",
          defaultMessage: "Add field",
        })}
        icon={<AddIcon />}
        autoFocus={false}
        size="xs"
        variant="outline"
        rounded="full"
        backgroundColor="white"
        borderColor="gray.200"
        color="gray.500"
        _hover={{
          borderColor: "gray.300",
          color: "gray.800",
        }}
        _active={{
          backgroundColor: "gray.50",
        }}
        {...props}
      />
    );
  }),
);
