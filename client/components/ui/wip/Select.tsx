import {
  // eslint-disable-next-line no-restricted-imports
  Select as ChakraSelect,
  SelectProps,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { RefAttributes } from "react";

// Docs: https://chakra-ui.com/docs/components/select

// v3 API only - no v2 compatibility
export interface ExtendedSelectProps
  extends Omit<SelectProps, "isInvalid" | "isDisabled" | "isReadOnly" | "colorScheme"> {
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  colorPalette?: string;
}

// Apply default props from components.tsx
export function Select({
  invalid,
  disabled,
  readOnly,
  colorPalette,
  icon = <ChevronDownIcon fontSize="16px" />,
  ref,
  ...props
}: ExtendedSelectProps & RefAttributes<HTMLSelectElement>) {
  return (
    <ChakraSelect
      ref={ref}
      isInvalid={invalid}
      isDisabled={disabled}
      isReadOnly={readOnly}
      colorScheme={colorPalette}
      icon={icon}
      {...props}
    />
  );
}
