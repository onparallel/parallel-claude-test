import { IconButton, IconButtonProps, useColorMode } from "@chakra-ui/core";
import { forwardRef, Ref } from "react";
import { useIntl } from "react-intl";

export type ToggleColorModeButtonProps = Omit<
  IconButtonProps,
  "aria-label" | "icon" | "onClick"
>;

export const ToggleColorModeButton = forwardRef(
  (props: ToggleColorModeButtonProps, ref: Ref<typeof IconButton>) => {
    const { colorMode, toggleColorMode } = useColorMode();
    const intl = useIntl();
    return (
      <IconButton
        ref={ref}
        aria-label={
          colorMode === "dark"
            ? intl.formatMessage({
                id: "component.toggle-color-mode-button.toggle-dark",
                defaultMessage: "Toggle dark mode",
              })
            : intl.formatMessage({
                id: "component.toggle-color-mode-button.toggle-light",
                defaultMessage: "Toggle light mode",
              })
        }
        icon={colorMode === "dark" ? "sun" : "moon"}
        onClick={toggleColorMode}
        {...props}
      ></IconButton>
    );
  }
);
