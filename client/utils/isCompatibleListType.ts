import { StandardListDefinitionListType } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";

export function isCompatibleListType(
  type: StandardListDefinitionListType,
  standardList: string | undefined | null,
) {
  const typesMap: Record<string, StandardListDefinitionListType | null> = {
    COUNTRIES: "COUNTRIES",
    EU_COUNTRIES: "COUNTRIES",
    NON_EU_COUNTRIES: "COUNTRIES",
    CURRENCIES: null,
    NACE: null,
    CNAE: null,
    CNAE_2009: null,
    CNAE_2025: null,
  };

  return isNonNullish(standardList) && type === typesMap[standardList];
}
