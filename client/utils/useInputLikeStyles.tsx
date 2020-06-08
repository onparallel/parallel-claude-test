import { PseudoBoxProps, useColorMode, useTheme } from "@chakra-ui/core";
import { css } from "@emotion/core";
import { useMemo } from "react";
import { get } from "styled-system";
export function useInputLikeStyles() {
  const theme = useTheme();
  const { colorMode } = useColorMode();
  return useMemo(() => {
    const focusBorderColor = "blue.500";
    const errorBorderColor = "red.500";
    const bg = { light: "white", dark: "whiteAlpha.100" };
    const borderColor = { light: "inherit", dark: "whiteAlpha.50" };
    const hoverColor = { light: "gray.300", dark: "whiteAlpha.200" };

    /**
     * styled-system's get takes 3 args
     * - object or array to read from
     * - key to get
     * - fallback value
     */
    const _focusBorderColor = get(
      theme.colors,
      focusBorderColor,
      focusBorderColor // If color doesn't exist in theme, use it's raw value
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _errorBorderColor = get(
      theme.colors,
      errorBorderColor,
      errorBorderColor
    );

    return {
      rounded: "md",
      border: "1px",
      borderColor: borderColor[colorMode],
      bg: bg[colorMode],
      _hover: {
        borderColor: hoverColor[colorMode],
      },
      _focusWithin: {
        borderColor: _focusBorderColor,
        boxShadow: `0 0 0 1px ${_focusBorderColor}`,
      },
      _disabled: {
        borderColor: borderColor[colorMode],
        bg: bg[colorMode],
        opacity: 0.4,
        cursor: "not-allowed",
      },
      css: css`
        &[aria-invalid="true"],
        &[aria-invalid="true"]:focus-within {
          border-color: ${_errorBorderColor};
          box-shadow: 0 0 0 1px ${_errorBorderColor};
        }
      `,
    } as PseudoBoxProps;
  }, []);
}
