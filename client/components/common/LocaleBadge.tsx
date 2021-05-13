import { Badge, Tooltip } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionLocale } from "@parallel/graphql/__types";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";

export const LocaleBadge = chakraForwardRef<"abbr", { locale: PetitionLocale }>(
  function LocaleBadge({ locale, ...props }, ref) {
    const locales = useSupportedLocales();
    const localeLabel = locales.find(
      ({ key }) => key === locale
    )!.localizedLabel;
    return (
      <Tooltip label={localeLabel}>
        <Badge
          ref={ref}
          as="abbr"
          title={localeLabel}
          cursor="default"
          sx={{ "&[title]": { textDecoration: "none" } }}
          {...props}
        >
          {locale}
        </Badge>
      </Tooltip>
    );
  }
);
