import { Badge, Flex, Text } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectProps,
} from "@parallel/components/common/SimpleSelect";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import { FormattedMessage, useIntl } from "react-intl";
import { CSSObjectWithLabel, OptionProps, SingleValueProps, components } from "react-select";
import CreatableSelect from "react-select/creatable";

interface PetitionVariableSelectProps extends SimpleSelectProps<string> {
  onCreateVariable?: (name: string) => void;
}

export function PetitionVariableSelect({
  onCreateVariable,
  ...props
}: PetitionVariableSelectProps) {
  const intl = useIntl();
  return (
    <SimpleSelect
      as={onCreateVariable ? (CreatableSelect as any) : undefined}
      placeholder={intl.formatMessage({
        id: "component.petition-variable-select.placeholder",
        defaultMessage: "Select a variable",
      })}
      components={{ SingleValue, Option }}
      styles={{
        option: (styles: CSSObjectWithLabel) => ({
          ...styles,
          display: "flex",
          padding: "6px 8px",
        }),
      }}
      {...props}
      {...(onCreateVariable
        ? { isValidNewOption, formatCreateLabel, onCreateOption: onCreateVariable }
        : {})}
    />
  );
}

const isValidNewOption = (value: string, _: any, options: readonly any[]) => {
  return value === "" || REFERENCE_REGEX.test(value);
};

function PetitionVariableSelectItem({
  option,
  highlight,
}: {
  option: SimpleOption;
  highlight?: string;
}) {
  return (
    <Badge
      colorScheme="blue"
      fontSize="sm"
      textTransform="none"
      whiteSpace="nowrap"
      overflow="hidden"
      textOverflow="ellipsis"
    >
      <HighlightText as="span" search={highlight}>
        {option.label}
      </HighlightText>
    </Badge>
  );
}

function SingleValue(props: SingleValueProps<SimpleOption>) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <PetitionVariableSelectItem
          option={props.data}
          highlight={props.selectProps.inputValue ?? ""}
        />
      </Flex>
    </components.SingleValue>
  );
}

const formatCreateLabel = (label: string) => {
  return (
    <Text as="span">
      {label ? (
        <FormattedMessage
          id="component.petition-variable-select.create-new-variable"
          defaultMessage="Create variable: <b>{name}</b>"
          values={{
            name: label,
            b: (chunks: any) => (
              <Badge
                colorScheme="blue"
                fontSize="sm"
                textTransform="none"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                verticalAlign="bottom"
              >
                {chunks}
              </Badge>
            ),
          }}
        />
      ) : (
        <FormattedMessage
          id="component.petition-variable-select.create-new-variable-empty"
          defaultMessage="Create new variable"
        />
      )}
    </Text>
  );
};

function Option({ children, ...props }: OptionProps<SimpleOption>) {
  if ((props.data as any).__isNew__) {
    return (
      <components.Option
        {...props}
        innerProps={{ ...props.innerProps, "data-testid": "create-variable-option" } as any}
      >
        {children} {/* from formatCreateLabel */}
      </components.Option>
    );
  } else {
    return (
      <components.Option {...props}>
        <PetitionVariableSelectItem
          option={props.data}
          highlight={props.selectProps.inputValue ?? ""}
        />
      </components.Option>
    );
  }
}
