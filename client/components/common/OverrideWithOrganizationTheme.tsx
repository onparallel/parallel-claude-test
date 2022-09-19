import { gql } from "@apollo/client";
import { ChakraProvider, extendTheme, useTheme } from "@chakra-ui/react";
import { OverrideWithOrganizationTheme_OrganizationBrandThemeDataFragment } from "@parallel/graphql/__types";
import Color from "color";
import { ReactNode } from "react";

export function OverrideWithOrganizationTheme({
  children,
  cssVarsRoot,
  brandTheme: brand,
}: {
  children: ReactNode;
  cssVarsRoot?: string;
  brandTheme: OverrideWithOrganizationTheme_OrganizationBrandThemeDataFragment;
}) {
  const theme = useTheme();
  const customTheme = extendTheme({
    ...theme,
    fonts: {
      ...theme.fonts,
      body: brand.fontFamily ?? theme.fonts.body,
      heading: brand.fontFamily ?? theme.fonts.heading,
    },
    colors: {
      ...theme.colors,
      primary: /^#[a-f\d]{6}$/i.test(brand.color)
        ? generateOrganizationPalette(brand.color)
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
  OrganizationBrandThemeData: gql`
    fragment OverrideWithOrganizationTheme_OrganizationBrandThemeData on OrganizationBrandThemeData {
      color
      fontFamily
    }
  `,
};

export function generateOrganizationPalette(color: string) {
  const _color = new Color(color);
  const lightness = _color.hsl().round().lightness();

  const lightenOffset = (97 - lightness) / 5;
  const darkenOffset = lightness > 21 ? (lightness - 20) / 4 : 6;

  return {
    50: _color.lightness(99).hex().toString(),
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
