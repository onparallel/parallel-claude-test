import { Stack } from "@chakra-ui/react";
import { NewPetitionLanguageFilter } from "./NewPetitionLanguageFilter";
import { NewPetitionSearch } from "./NewPetitionSearch";

export const NewPetitionMyTemplatesHeader = ({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
}) => {
  const filters = (
    <NewPetitionLanguageFilter
      value={locale}
      onFilterChange={onLocaleChange}
      backgroundColor="white"
    />
  );

  return (
    <Stack>
      <NewPetitionSearch
        search={search}
        handleSearchChange={onSearchChange}
        filtersElement={filters}
      />
    </Stack>
  );
};
