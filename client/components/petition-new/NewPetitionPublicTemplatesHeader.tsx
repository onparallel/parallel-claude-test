import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NewPetitionLanguageFilter } from "./NewPetitionLanguageFilter";
import { NewPetitionSearch } from "./NewPetitionSearch";

export const NewPetitionPublicTemplatesHeader = ({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
}) => {
  const intl = useIntl();
  const suggestions = useMemo(
    () => [
      intl.formatMessage({
        id: "new-petition.suggestion-kyc",
        defaultMessage: "KYC",
      }),
      intl.formatMessage({
        id: "new-petition.suggestion-corporate",
        defaultMessage: "corporate",
      }),
      intl.formatMessage({
        id: "new-petition.suggestion-due",
        defaultMessage: "due diligence",
      }),
      intl.formatMessage({
        id: "new-petition.suggestion-sales",
        defaultMessage: "sales",
      }),
      intl.formatMessage({
        id: "new-petition.suggestion-tax",
        defaultMessage: "tax",
      }),
    ],
    [intl.locale]
  );

  const filters = (
    <NewPetitionLanguageFilter
      value={locale}
      onFilterChange={onLocaleChange}
      backgroundColor="white"
    />
  );

  return (
    <Stack spacing={4}>
      <NewPetitionSearch
        search={search}
        handleSearchChange={onSearchChange}
        filtersElement={filters}
      />
      <Flex flexWrap="wrap" paddingLeft={2}>
        <Box marginRight={2} marginLeft={2}>
          <Text as="strong">
            <FormattedMessage
              id="new-petition.suggested-searches"
              defaultMessage="Suggested searches:"
            />
          </Text>
        </Box>
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="link"
            marginX={2}
            size="sm"
            onClick={() => onSearchChange?.(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </Flex>
    </Stack>
  );
};
