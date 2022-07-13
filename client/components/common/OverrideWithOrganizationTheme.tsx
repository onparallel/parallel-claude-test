import { ChakraProvider, extendTheme, useTheme } from "@chakra-ui/react";
import { ReactNode } from "react";
import Color from "color";
import { gql } from "@apollo/client";

export interface OrganizationBrandTheme {
  fontFamily?: string;
  color?: string;
}

export function OverrideWithOrganizationTheme({
  children,
  cssVarsRoot,
  brandTheme: brand,
}: {
  children: ReactNode;
  cssVarsRoot?: string;
  brandTheme?: OrganizationBrandTheme | null;
}) {
  const theme = useTheme();
  const customTheme = extendTheme({
    ...theme,
    fonts: {
      ...theme.fonts,
      body: brand?.fontFamily ?? theme.fonts.body,
      heading: brand?.fontFamily ?? theme.fonts.heading,
    },
    colors: {
      ...theme.colors,
      primary:
        brand?.color && /^#[a-f\d]{6}$/i.test(brand?.color)
          ? generateOrganizationPallete(brand.color)
          : theme.colors.primary,
    },
  });

  return (
    <ChakraProvider theme={customTheme} cssVarsRoot={cssVarsRoot}>
      {children}
    </ChakraProvider>
  );
}

OverrideWithOrganizationTheme.fragments = {
  Organization: gql`
    fragment OverrideWithOrganizationTheme_Organization on Organization {
      id
      brandTheme
    }
  `,
  PublicOrganization: gql`
    fragment OverrideWithOrganizationTheme_PublicOrganization on PublicOrganization {
      id
      brandTheme
    }
  `,
};

export function generateOrganizationPallete(color: string) {
  const _color = new Color(color);
  const lightness = _color.hsl().round().lightness();

  const lightenOffset = (97 - lightness) / 5;
  const darkenOffset = lightness > 21 ? (lightness - 20) / 4 : 6;

  return {
    50: _color.lightness(97).hex().toString(),
    100: _color
      .lightness(lightness + lightenOffset * 4)
      .hex()
      .toString(),
    200: _color
      .lightness(lightness + lightenOffset * 3)
      .hex()
      .toString(),
    300: _color
      .lightness(lightness + lightenOffset * 2)
      .hex()
      .toString(),
    400: _color
      .lightness(lightness + lightenOffset)
      .hex()
      .toString(),
    500: color,
    600: _color
      .lightness(lightness - darkenOffset)
      .hex()
      .toString(),
    700: _color
      .lightness(lightness - darkenOffset * 2)
      .hex()
      .toString(),
    800: _color
      .lightness(lightness - darkenOffset * 3)
      .hex()
      .toString(),
    900: _color.lightness(20).hex().toString(),
  };
}
