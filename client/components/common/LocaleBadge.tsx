import { Badge } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { PetitionLocale } from "@parallel/graphql/__types";
import { useSupportedPetitionLocales } from "@parallel/utils/locales";
import { SmallPopover } from "./SmallPopover";
import { Text } from "@parallel/components/ui";

export const LocaleBadge = chakraComponent<"abbr", { locale: PetitionLocale }>(
  function LocaleBadge({ ref, locale, ...props }) {
    const locales = useSupportedPetitionLocales();
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
  },
);
