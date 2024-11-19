import { SystemStyleObject } from "@chakra-ui/react";
import { getColor } from "@chakra-ui/theme-tools";
import { keyframes } from "@emotion/react";
import type { Theme } from "@parallel/chakra/theme/theme";

/**
 * Generates a background image of diagonal lines
 */
export function generateCssStripe({
  size = "1rem",
  color = "transparent",
  secondaryColor = "transparent",
  isAnimated = false,
}): SystemStyleObject {
  return {
    backgroundImage: ((theme: Theme) => {
      const _primary = getColor(theme, color);
      const _secondary = getColor(theme, secondaryColor);
      return `linear-gradient(
        135deg,
        ${_primary} 25%,
        ${_secondary} 25%,
        ${_secondary} 50%,
        ${_primary} 50%,
        ${_primary} 75%,
        ${_secondary} 75%,
        ${_secondary}
      )`;
    }) as any,
    backgroundSize: `${size} ${size}`,
    backgroundPosition: "left",
    animation: isAnimated
      ? `${keyframes`
      from { background-position: 0 0}
      to { background-position: ${size} 0 }
    `} 1s linear infinite`
      : "none",
  };
}
