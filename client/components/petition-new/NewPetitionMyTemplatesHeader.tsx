import { Stack } from "@chakra-ui/react";
import { PetitionLocale } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { NewPetitionLanguageFilter } from "./NewPetitionLanguageFilter";
import { NewPetitionSearch } from "./NewPetitionSearch";

export const NewPetitionMyTemplatesHeader = ({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
}: {
  search: string;
  onSearchChange: (args: string) => void;
  locale: Maybe<PetitionLocale>;
  onLocaleChange: (args: Maybe<PetitionLocale>) => void;
}) => {
  return (
    <Stack>
      <NewPetitionSearch search={search} handleSearchChange={onSearchChange}>
        <NewPetitionLanguageFilter
          locale={locale}
          onFilterChange={onLocaleChange}
          backgroundColor="white"
        />
      </NewPetitionSearch>
    </Stack>
  );
};
