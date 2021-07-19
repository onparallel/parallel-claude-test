import { Box, Button, Flex, Stack, StackProps, Text } from "@chakra-ui/react";
import { PetitionLocale } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NewPetitionLanguageFilter } from "./NewPetitionLanguageFilter";
import { NewPetitionSearch } from "./NewPetitionSearch";

export interface NewPetitionPublicTemplatesHeaderProps extends StackProps {
  search: string;
  onSearchChange: (args: string) => void;
  locale: Maybe<PetitionLocale>;
  onLocaleChange: (args: Maybe<PetitionLocale>) => void;
}

export const NewPetitionPublicTemplatesHeader = ({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
  ...props
}: NewPetitionPublicTemplatesHeaderProps) => {
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

  return (
    <Stack {...props}>
      <NewPetitionSearch search={search} handleSearchChange={onSearchChange}>
        <NewPetitionLanguageFilter
          locale={locale}
          onLocaleChange={onLocaleChange}
          backgroundColor="white"
        />
      </NewPetitionSearch>
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
