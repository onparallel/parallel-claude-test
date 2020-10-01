import { Badge, Tooltip } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { PetitionLocale } from "@parallel/graphql/__types";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";

export function LocaleBadge({
  locale,
  ...props
}: ExtendChakra<{ locale: PetitionLocale }>) {
  const locales = useSupportedLocales();
  const localeLabel = locales.find(({ key }) => key === locale)!.localizedLabel;
  return (
    <Tooltip label={localeLabel}>
      <Badge as="abbr" aria-label={localeLabel} cursor="default" {...props}>
        {locale}
      </Badge>
    </Tooltip>
  );
}
