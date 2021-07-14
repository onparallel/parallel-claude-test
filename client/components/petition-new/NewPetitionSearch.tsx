import { Grid, GridProps } from "@chakra-ui/react";
import { useIntl } from "react-intl";
import { SearchInput } from "../common/SearchInput";

export interface NewPetitionSearchProps extends GridProps {
  search: string;
  handleSearchChange: (args: string) => void;
  children: any;
}

export const NewPetitionSearch = ({
  search,
  handleSearchChange,
  children,
  ...props
}: NewPetitionSearchProps) => {
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
      {children}
    </Grid>
  );
};
