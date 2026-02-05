import {
  // eslint-disable-next-line no-restricted-imports
  Select as ChakraSelect,
  SelectProps,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { forwardRef } from "react";

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
export const Select = forwardRef<HTMLSelectElement, ExtendedSelectProps>(
  (
    {
      invalid,
      disabled,
      readOnly,
      colorPalette,
      icon = <ChevronDownIcon fontSize="16px" />,
      ...props
    },
    ref,
  ) => {
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
  },
);

Select.displayName = "Select";
