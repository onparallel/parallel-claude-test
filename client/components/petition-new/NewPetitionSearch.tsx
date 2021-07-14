import { Grid } from "@chakra-ui/react";
import { useIntl } from "react-intl";
import { SearchInput } from "../common/SearchInput";

export const NewPetitionSearch = ({
  search,
  handleSearchChange,
  filtersElement,
  ...props
}) => {
  const intl = useIntl();

  return (
    <Grid templateColumns="1fr auto" gap={2} {...props}>
      <SearchInput
        value={search ?? ""}
        onChange={(event) => handleSearchChange(event?.target.value)}
        backgroundColor="white"
        placeholder={intl.formatMessage({
          id: "new-petition.search-placeholder",
          defaultMessage: "What are you looking for?",
        })}
      />
      {filtersElement}
    </Grid>
  );
};
