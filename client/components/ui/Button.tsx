/* eslint-disable no-restricted-imports */
import { ButtonProps, Button as ChakraButton } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";

// Docs: https://chakra-ui.com/docs/components/button

// v3 API only - no v2 compatibility
export interface ExtendedButtonProps
  extends Omit<ButtonProps, "colorScheme" | "isDisabled" | "isLoading" | "isActive"> {
  colorPalette?: string;
  disabled?: boolean;
  loading?: boolean;
  "data-active"?: boolean | "false" | "true"; // v3 uses data-active instead of isActive
}

export const Button = chakraComponent<"button", ExtendedButtonProps>(function Button({
  colorPalette,
  disabled,
  loading,
  "data-active": dataActive,
  ref,
  ...props
}) {
  return (
    <ChakraButton
      ref={ref}
      colorScheme={colorPalette}
      isDisabled={disabled}
      isLoading={loading}
      data-active={dataActive === "true" ? true : dataActive === "false" ? false : dataActive}
      isActive={dataActive === "true" ? true : dataActive === "false" ? false : dataActive}
      cursor="pointer" // Ensure pointer cursor for v3
      {...props}
    />
  );
});
