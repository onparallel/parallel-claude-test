import { css, keyframes } from "@emotion/core";

/**
 * Generates a background image of diagonal lines
 */
export function generateCssStripe({
  size = "1rem",
  color = "rgba(255, 255, 255, 1)",
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

export function animatedStripe({ size = "1rem" }) {
  return css`
    animation: ${keyframes`
      from { background-position: 0 0}
      to { background-position: ${size} 0 }
    `} 1s linear infinite;
  `;
}
