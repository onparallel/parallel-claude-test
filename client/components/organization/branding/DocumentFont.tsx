import { Global } from "@emotion/react";
import fonts from "../../../utils/fonts.json";

export function Fonts({ family }: { family: string }) {
  return (
    <Global
      styles={fonts
        .find((f) => f.family === family)!
        .fonts.map(
          (font) => /* css */ `
            @font-face {
              font-family: '${family}';
              font-style: ${font.fontStyle || "normal"};
              font-weight: ${font.fontWeight || 400};
              src: url('${process.env.NEXT_PUBLIC_ASSETS_URL}/static/fonts/pdf/${encodeURIComponent(
            family
          )}/${font.src}') format('truetype');
            }
          `
        )
        .join("\n")}
    />
  );
}
