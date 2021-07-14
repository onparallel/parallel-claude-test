import { Box, BoxProps, Button, Flex, Select, Text } from "@chakra-ui/react";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { Spacer } from "@parallel/components/common/Spacer";
import { PetitionLocale } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { ChangeEvent, Ref, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NewPetitionContainer } from "./NewPetitionContainer";

export interface NewPetitionHeader extends BoxProps {
  inputRef: Ref<HTMLInputElement>;
  search: string;
  locale: Maybe<PetitionLocale>;
  onSearchChange: (search: string) => void;
  onLocaleChange: (locale: Maybe<PetitionLocale>) => void;
}

export function NewPetitionHeader({
  inputRef,
  search,
  locale,
  onSearchChange,
  onLocaleChange,
  ...props
}: NewPetitionHeader) {
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
  const locales = useSupportedLocales();
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onSearchChange(event.target.value);
    },
    [onSearchChange]
  );
  const handleLocaleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onLocaleChange((event.target.value || null) as Maybe<PetitionLocale>);
    },
    [onLocaleChange]
  );
  const handleAddSuggestion = useMemoFactory(
    (suggestion: string) => () => onSearchChange(suggestion),
    [onSearchChange]
  );
  return (
    <NewPetitionContainer {...props}>
      <SearchInput
        ref={inputRef}
        placeholder={intl.formatMessage({
          id: "new-petition.search-placeholder",
          defaultMessage: "What are you looking for?",
        })}
        value={search}
        onChange={handleSearchChange}
        backgroundColor="white"
      />
      <Flex marginTop={2} fontSize="sm">
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
              onClick={handleAddSuggestion(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </Flex>
        <Spacer />
        <Select
          flexShrink={0}
          aria-label={intl.formatMessage({
            id: "new-petition.select-label",
            defaultMessage: "Language filter",
          })}
          variant="unstyled"
          size="sm"
          width="auto"
          textAlign="right"
          height={5}
          value={locale ?? ""}
          onChange={handleLocaleChange}
        >
          <option value="">
            {intl.formatMessage({
              id: "generic.all-languages",
              defaultMessage: "All languages",
            })}
          </option>
          {locales.map(({ key, localizedLabel }) => (
            <option key={key} value={key}>
              {localizedLabel}
            </option>
          ))}
        </Select>
      </Flex>
    </NewPetitionContainer>
  );
}
