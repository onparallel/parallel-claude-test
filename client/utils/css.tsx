import { css } from "@emotion/core";

/**
 * Generates a background image of diagonal lines
 */
export function generateCssStripe({
  size = "1rem",
  color = "rgba(255, 255, 255, 1)"
}) {
  return css`
    background-image: linear-gradient(
      135deg,
      ${color} 25%,
      transparent 25%,
      transparent 50%,
      ${color} 50%,
      ${color} 75%,
      transparent 75%,
      transparent
    );
    background-size: ${size} ${size};
    background-position: left;
  `;
}
