import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { HStack } from "@chakra-ui/react";
import { UserIcon } from "@parallel/chakra/icons";
import { CloseButton } from "@parallel/components/common/CloseButton";
import {
  AdverseMediaSearchInput_adverseMediaEntitySuggestDocument,
  AdverseMediaSearchTermInput,
} from "@parallel/graphql/__types";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomAsyncCreatableSelectProps } from "@parallel/utils/react-select/types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import {
  ComponentType,
  ForwardedRef,
  KeyboardEventHandler,
  MouseEvent,
  forwardRef,
  useCallback,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ActionMeta, GroupBase, MultiValue, MultiValueProps, SelectInstance } from "react-select";
import AsyncCreatableSelect from "react-select/async-creatable";
import { isNonNullish } from "remeda";
import { Text } from "@parallel/components/ui";

const MAX_TERMS_ALLOWED = 10;

interface Option {
  readonly label: string;
  readonly value: string;
  readonly _search: AdverseMediaSearchTermInput;
}

type OptionGroupBase = GroupBase<Option>;

export type AdverseMediaSearchInputProps = CustomAsyncCreatableSelectProps<
  Option,
  true,
  OptionGroupBase
>;

export type AdverseMediaSearchInputInstance = SelectInstance<Option, true, OptionGroupBase>;

function createOption(value: AdverseMediaSearchTermInput): Option {
  return {
    label: value.label ?? value.term ?? "",
    value: value.term ?? "",
    _search: value,
  };
}

const MultiValueComponent: ComponentType<MultiValueProps<Option, true, OptionGroupBase>> = ({
  data,
  removeProps,
  innerProps,
}) => {
  return (
    <HStack
      borderRadius="full"
      backgroundColor="gray.200"
      spacing={1}
      paddingX={2}
      paddingY={0.5}
      margin={0.5}
      {...innerProps}
    >
      {data._search.wikiDataId ? <UserIcon boxSize={4} /> : null}
      <Text fontSize="sm">{data.label}</Text>
      {isNonNullish(removeProps.onClick) ? (
        <CloseButton
          size="xs"
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            if (removeProps.onClick) {
              (removeProps.onClick as any)(e);
            }
          }}
        />
      ) : null}
    </HStack>
  );
};

export const AdverseMediaSearchInput = forwardRef(function AdverseMediaSearchInput(
  { value, onChange, placeholder, ...props }: AdverseMediaSearchInputProps,
  ref: ForwardedRef<AdverseMediaSearchInputInstance>,
) {
  const intl = useIntl();
  const apollo = useApolloClient();
  const [inputValue, setInputValue] = useState("");

  const loadOptions = async (search: string, entityIdsToOmit?: string[]): Promise<Option[]> => {
    if (search.length < 3) return [];

    const { data } = await apollo.query({
      query: AdverseMediaSearchInput_adverseMediaEntitySuggestDocument,
      variables: { searchTerm: search, excludeIds: entityIdsToOmit },
      fetchPolicy: "network-only",
    });

    return data!.adverseMediaEntitySuggest.map((item) =>
      createOption({
        label: item.name,
        entityId: item.id,
      }),
    );
  };

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (!inputValue || inputValue.length < 2) return;

    if ((value?.length || 0) >= MAX_TERMS_ALLOWED) return;

    switch (event.key) {
      case "Enter":
      case "Tab":
        const newOption = createOption({
          label: inputValue,
          term: inputValue,
        });
        onChange?.([...Array.from(value || []), newOption], {
          action: "create-option",
          option: newOption,
        });
        setInputValue("");
        event.preventDefault();
    }
  };

  const handleCreateOption = useCallback(
    async (inputValue: string) => {
      const newOption = createOption({
        label: inputValue,
        term: inputValue,
      });
      onChange?.([...Array.from(value || []), newOption], {
        action: "create-option",
        option: newOption,
      });
    },
    [onChange],
  );

  const reactSelectProps = useReactSelectProps<Option, true, OptionGroupBase>({
    ...props,
    components: {
      DropdownIndicator: null,
      MultiValue: MultiValueComponent,
    },
  });

  const loadOptionsForSelect = useDebouncedAsync(
    async (inputText: string): Promise<readonly Option[]> => {
      const entityIdsToOmit = value?.map((v) => v._search.entityId).filter(isNonNullish);
      return await loadOptions(inputText, entityIdsToOmit);
    },
    500,
    [],
  );

  const formatCreateLabel = (label: string) => {
    return (
      <Text as="span">
        <FormattedMessage
          id="component.adverse-media-search-input.create-term"
          defaultMessage="Search by text: <b>{label}</b>"
          values={{ label }}
        />
      </Text>
    );
  };

  return (
    <AsyncCreatableSelect<Option, true, OptionGroupBase>
      ref={ref}
      inputValue={inputValue}
      isMulti
      isClearable={false}
      onChange={(newValue: MultiValue<Option>, action: ActionMeta<Option>) => {
        // Convert readonly array to mutable array if needed
        const mutableValue = newValue ? Array.from(newValue) : [];
        onChange?.(mutableValue, action);
      }}
      onInputChange={(newValue) => setInputValue(newValue)}
      onKeyDown={handleKeyDown}
      placeholder={
        placeholder ??
        intl.formatMessage({
          id: "page.adverse-media-search.placeholder",
          defaultMessage: "Type something and press enter...",
        })
      }
      loadOptions={loadOptionsForSelect}
      onCreateOption={handleCreateOption}
      value={value}
      isOptionDisabled={() => value?.length >= MAX_TERMS_ALLOWED}
      isValidNewOption={(inputValue) => inputValue.length >= 2}
      formatCreateLabel={formatCreateLabel}
      {...reactSelectProps}
    />
  );
});

const _mutations = [
  gql`
    query AdverseMediaSearchInput_adverseMediaEntitySuggest(
      $searchTerm: String!
      $excludeIds: [String!]
    ) {
      adverseMediaEntitySuggest(searchTerm: $searchTerm, excludeIds: $excludeIds) {
        id
        name
      }
    }
  `,
];
