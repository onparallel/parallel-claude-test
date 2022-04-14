import { Badge, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionLocale } from "@parallel/graphql/__types";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { SmallPopover } from "./SmallPopover";

export const LocaleBadge = chakraForwardRef<"abbr", { locale: PetitionLocale }>(
  function LocaleBadge({ locale, ...props }, ref) {
    const locales = useSupportedLocales();
    const localeLabel = locales.find(({ key }) => key === locale)!.localizedLabel;
    return (
      <SmallPopover content={<Text fontSize="sm">{localeLabel}</Text>} width="auto">
        <Badge
          ref={ref}
          as="abbr"
          title={localeLabel}
          fontWeight="normal"
          cursor="default"
          sx={{ "&[title]": { textDecoration: "none" } }}
          {...props}
        >
          {locale}
        </Badge>
      </SmallPopover>
    );
  }
);
