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
  const palette = /^#[a-f\d]{6}$/i.test(brand.color)
    ? generateOrganizationPalette(brand.color)
    : theme.colors.primary;
  const customTheme = extendTheme({
    ...theme,
    fonts: {
      ...theme.fonts,
      body: brand.fontFamily ?? theme.fonts.body,
      heading: brand.fontFamily ?? theme.fonts.heading,
    },
    colors: { ...theme.colors, primary: palette },
  });

  return (
    <ChakraProvider theme={customTheme} cssVarsRoot={cssVarsRoot}>
      {children}
    </ChakraProvider>
  );
}

const _fragments = {
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
  return Object.fromEntries(
    [
      [50, 99],
      [100, 97],
      [200, lightness + ((97 - lightness) / 4) * 3],
      [300, lightness + ((97 - lightness) / 4) * 2],
      [400, lightness + ((97 - lightness) / 4) * 1],
      [500, lightness],
      [600, lightness - ((lightness - 15) / 4) * 1],
      [700, lightness - ((lightness - 15) / 4) * 2],
      [800, lightness - ((lightness - 15) / 4) * 3],
      [900, 15],
    ].map(([color, lightness]) => [color, _color.lightness(lightness).hex().toString()]),
  );
}
