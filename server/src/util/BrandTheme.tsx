import { Tone } from "../db/__types";

export interface BrandTheme {
  fontFamily: string | null;
  color: string;
  preferredTone: Tone;
}

export const defaultBrandTheme: BrandTheme = {
  fontFamily: null,
  color: "#6059f7",
  preferredTone: "INFORMAL",
};
