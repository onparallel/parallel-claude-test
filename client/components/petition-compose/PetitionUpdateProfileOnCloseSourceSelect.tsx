import { gql } from "@apollo/client";
import { chakraComponent } from "@parallel/chakra/utils";
import { Badge } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { Box, Flex, HStack, Text } from "@parallel/components/ui";
import {
  PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment,
  PetitionUpdateProfileOnCloseSourceSelect_PetitionFieldFragment,
  PetitionUpdateProfileOnCloseSourceSelect_ProfileTypeFieldFragment,
  PetitionVariableType,
  ProfileTypeFieldType,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex, useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { never } from "@parallel/utils/never";
import { UseReactSelectProps, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { UnwrapArray } from "@parallel/utils/types";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, {
  ActionMeta,
  CSSObjectWithLabel,
  GroupBase,
  OnChangeValue,
  OptionProps,
  SingleValue as SV,
  Props as SelectProps,
  SingleValueProps,
  components,
} from "react-select";
import { isNonNullish, isNullish } from "remeda";
import { PROFILE_TYPE_FIELD_TO_PETITION_FIELD_TYPE } from "./dialogs/ConfigureUpdateProfileOnCloseDialog";

type FieldOf<T extends PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment> = UnwrapArray<
  Exclude<T["fields"], null | undefined>
>;

type ChildOf<T extends FieldOf<PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment>> =
  UnwrapArray<Exclude<T["children"], null | undefined>>;

type AnyFieldOf<T extends PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment> =
  | FieldOf<T>
  | ChildOf<FieldOf<T>>;

export type PetitionMetadata = "CLOSED_AT";

export type PetitionUpdateProfileOnCloseSourceSelectOptionValue<
  T extends PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment,
> =
  | { type: "FIELD"; field: AnyFieldOf<T> }
  | { type: "VARIABLE_ENUM" | "VARIABLE_NUMBER"; name: string }
  | { type: "PETITION_METADATA"; name: PetitionMetadata }
  | { type: "ASK_USER" };

interface PetitionUpdateProfileOnCloseSourceSelectOption<
  T extends PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment,
> {
  value: PetitionUpdateProfileOnCloseSourceSelectOptionValue<T>;
  fieldIndex?: PetitionFieldIndex;
}

export interface PetitionUpdateProfileOnCloseSourceSelectProps<
  T extends PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment,
> extends UseReactSelectProps<
      PetitionUpdateProfileOnCloseSourceSelectOption<T>,
      false,
      GroupBase<PetitionUpdateProfileOnCloseSourceSelectOption<T>>
    >,
    Omit<
      SelectProps<
        PetitionUpdateProfileOnCloseSourceSelectOption<T>,
        false,
        GroupBase<PetitionUpdateProfileOnCloseSourceSelectOption<T>>
      >,
      "value" | "onChange" | "options" | "isMulti"
    > {
  value: PetitionUpdateProfileOnCloseSourceSelectOptionValue<T> | null;
  onChange: (
    value: PetitionUpdateProfileOnCloseSourceSelectOptionValue<T> | null,
    actionMeta: ActionMeta<any>,
  ) => void;
  petition: T;
  profileTypeField?: PetitionUpdateProfileOnCloseSourceSelect_ProfileTypeFieldFragment;
  parentFieldId: string;
}

export function PetitionUpdateProfileOnCloseSourceSelect<
  T extends PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment,
>({
  value,
  onChange,
  petition,
  profileTypeField,
  parentFieldId,
  ...props
}: PetitionUpdateProfileOnCloseSourceSelectProps<T>) {
  const intl = useIntl();
  const rsProps = useReactSelectProps<
    PetitionUpdateProfileOnCloseSourceSelectOption<T>,
    false,
    GroupBase<PetitionUpdateProfileOnCloseSourceSelectOption<T>>
  >({
    placeholder: intl.formatMessage({
      id: "component.petition-field-select.placeholder",
      defaultMessage: "Select a field",
    }),
    ...(props as any),
    components: {
      SingleValue,
      Option,
    },
    styles: {
      option: (styles: CSSObjectWithLabel) => ({
        ...styles,
        display: "flex",
        padding: "6px 8px",
      }),
    },
  });

  const allFieldsWithIndices = useAllFieldsWithIndices(petition);
  const { options, _value } = useMemo(() => {
    const fieldOptions: PetitionUpdateProfileOnCloseSourceSelectOption<T>[] =
      allFieldsWithIndices.flatMap(([field, fieldIndex]) => {
        return { value: { type: "FIELD" as const, field }, fieldIndex };
      });

    const filterFn = (option: PetitionUpdateProfileOnCloseSourceSelectOption<T>) => {
      if (option.value.type === "FIELD") {
        const fieldWithIndice = allFieldsWithIndices.find(
          ([f]) => option.value.type === "FIELD" && f.id === option.value.field.id,
        );
        if (isNullish(fieldWithIndice) || isNullish(profileTypeField)) {
          return false;
        }
        const [petitionField] = fieldWithIndice;
        return (
          isFieldCompatible(profileTypeField, petitionField) &&
          (isNullish(petitionField.parent) || petitionField.parent.id === parentFieldId)
        );
      } else {
        return (
          isNonNullish(profileTypeField) &&
          PROFILE_TYPE_FIELD_TO_PETITION_FIELD_TYPE[
            profileTypeField.type as ProfileTypeFieldType
          ].includes(option.value.type)
        );
      }
    };

    const filteredFieldOptions = fieldOptions.filter((opt) => filterFn(opt));

    const variableOptions: PetitionUpdateProfileOnCloseSourceSelectOption<T>[] = (
      petition.variables ?? []
    ).map((v: { name: string; type: string }) => ({
      value: {
        type: (v.type as PetitionVariableType) === "ENUM" ? "VARIABLE_ENUM" : "VARIABLE_NUMBER",
        name: v.name,
      },
    }));

    const filteredVariableOptions = variableOptions.filter((opt) => filterFn(opt));

    const metadataOptions: PetitionUpdateProfileOnCloseSourceSelectOption<T>[] = [
      {
        value: { type: "PETITION_METADATA", name: "CLOSED_AT" },
      },
    ];

    const filteredMetadataOptions = metadataOptions.filter((opt) => filterFn(opt));

    const askOption: PetitionUpdateProfileOnCloseSourceSelectOption<T>[] = [
      { value: { type: "ASK_USER" } },
    ];

    const filteredAskOption = askOption.filter((opt) => filterFn(opt));

    const groupedOptions: GroupBase<PetitionUpdateProfileOnCloseSourceSelectOption<T>>[] = [];

    if (filteredVariableOptions.length > 0) {
      groupedOptions.push({
        label: intl.formatMessage({
          id: "component.petition-field-and-variables-select.group-variables",
          defaultMessage: "Variables",
        }),
        options: filteredVariableOptions,
      });
    }

    if (filteredFieldOptions.length > 0) {
      groupedOptions.push({
        label: intl.formatMessage({
          id: "component.petition-field-and-variables-select.group-fields",
          defaultMessage: "Fields",
        }),
        options: filteredFieldOptions,
      });
    }

    if (filteredMetadataOptions.length > 0) {
      groupedOptions.push({
        label: intl.formatMessage({
          id: "component.petition-field-and-variables-select.group-metadata",
          defaultMessage: "Parallel metadata",
        }),
        options: filteredMetadataOptions,
      });
    }

    if (filteredAskOption.length > 0) {
      groupedOptions.push({
        label: intl.formatMessage({
          id: "component.petition-field-and-variables-select.group-others",
          defaultMessage: "Others",
        }),
        options: filteredAskOption,
      });
    }

    const _value = mapValue(
      value as PetitionUpdateProfileOnCloseSourceSelectOptionValue<T> | null,
      groupedOptions.flatMap((g) => g.options),
    );

    return { options: groupedOptions, _value };
  }, [petition.fields, profileTypeField, petition.variables, value, intl]);

  const handleChange = useCallback(
    (
      value: OnChangeValue<PetitionUpdateProfileOnCloseSourceSelectOption<T>, false>,
      actionMeta: ActionMeta<PetitionUpdateProfileOnCloseSourceSelectOption<T>>,
    ) => {
      onChange(
        ((value as SV<PetitionUpdateProfileOnCloseSourceSelectOption<T>>)?.value ??
          null) as PetitionUpdateProfileOnCloseSourceSelectOptionValue<T> | null,
        actionMeta as ActionMeta<PetitionUpdateProfileOnCloseSourceSelectOption<T>>,
      );
    },
    [onChange],
  );

  const getOptionLabel = useCallback(
    (
      option: PetitionUpdateProfileOnCloseSourceSelectOption<PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment>,
    ) => {
      if (option.value.type === "FIELD") {
        return option.value.field.title ?? "";
      } else if (option.value.type === "VARIABLE_ENUM" || option.value.type === "VARIABLE_NUMBER") {
        return option.value.name;
      } else if (option.value.type === "PETITION_METADATA") {
        return intl.formatMessage({
          id: "component.petition-field-and-variables-select.metadata-closed-at",
          defaultMessage: "Parallel close date",
        });
      } else if (option.value.type === "ASK_USER") {
        return intl.formatMessage({
          id: "component.petition-field-and-variables-select.ask-on-close",
          defaultMessage: "Ask on close",
        });
      } else {
        never();
      }
    },
    [intl],
  );

  const getOptionValue = useCallback(
    (
      option: PetitionUpdateProfileOnCloseSourceSelectOption<PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment>,
    ) => {
      if (option.value.type === "FIELD") {
        return `FIELD:${option.value.field.id}`;
      } else if (option.value.type === "VARIABLE_ENUM") {
        return `VARIABLE_ENUM:${option.value.name}`;
      } else if (option.value.type === "VARIABLE_NUMBER") {
        return `VARIABLE_NUMBER:${option.value.name}`;
      } else if (option.value.type === "PETITION_METADATA") {
        return `PETITION_METADATA:${option.value.name}`;
      } else if (option.value.type === "ASK_USER") {
        return "ASK_USER";
      } else {
        never();
      }
    },
    [],
  );

  return (
    <Select
      options={options}
      isMulti={false}
      value={_value}
      onChange={handleChange}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      {...props}
      {...rsProps}
    />
  );
}

const _fragments = {
  PetitionField: gql`
    fragment PetitionUpdateProfileOnCloseSourceSelect_PetitionField on PetitionField {
      id
      type
      title
      options
      multiple
      parent {
        id
      }
    }
  `,
  PetitionBase: gql`
    fragment PetitionUpdateProfileOnCloseSourceSelect_PetitionBase on PetitionBase {
      fields {
        id
        ...PetitionUpdateProfileOnCloseSourceSelect_PetitionField
        children {
          id
          ...PetitionUpdateProfileOnCloseSourceSelect_PetitionField
        }
      }
      variables {
        name
        type
      }
      ...useAllFieldsWithIndices_PetitionBase
    }
  `,
  ProfileTypeField: gql`
    fragment PetitionUpdateProfileOnCloseSourceSelect_ProfileTypeField on ProfileTypeField {
      id
      type
      options
    }
  `,
};

const PetitionUpdateProfileOnCloseSourceSelectItem = chakraComponent<
  "div",
  {
    option: PetitionUpdateProfileOnCloseSourceSelectOption<PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment>;
    highlight?: string;
    indent?: boolean;
  }
>(function PetitionUpdateProfileOnCloseSourceSelectItem({ ref, option, highlight }) {
  const intl = useIntl();
  const { value, fieldIndex } = option;

  if (value.type === "FIELD") {
    const { field } = value;
    const label = field.title ?? "";
    return (
      <HStack ref={ref} gap={2}>
        <PetitionFieldTypeIndicator type={field.type} fieldIndex={fieldIndex} isTooltipDisabled />
        <Box
          paddingEnd={1}
          flex="1"
          minWidth="0"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {label ? (
            <HighlightText as="span" search={highlight}>
              {label}
            </HighlightText>
          ) : (
            <Text as="span" textStyle="hint">
              <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
            </Text>
          )}
        </Box>
      </HStack>
    );
  } else if (value.type === "VARIABLE_ENUM" || value.type === "VARIABLE_NUMBER") {
    return (
      <Badge
        ref={ref}
        colorScheme={value.type === "VARIABLE_ENUM" ? "green" : "blue"}
        textTransform="none"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        top={0}
        height="auto"
        fontSize="sm"
      >
        <HighlightText as="span" alignSelf="center" search={highlight}>
          {value.name}
        </HighlightText>
      </Badge>
    );
  } else if (value.type === "PETITION_METADATA") {
    const label = intl.formatMessage({
      id: "component.petition-field-and-variables-select.metadata-closed-at",
      defaultMessage: "Parallel close date",
    });
    return (
      <HStack ref={ref} gap={2}>
        <PetitionFieldTypeIndicator type="DATE" isTooltipDisabled isFixedWidth={false} />
        <Box flex="1" minWidth="0" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
          <HighlightText as="span" search={highlight}>
            {label}
          </HighlightText>
        </Box>
      </HStack>
    );
  } else if (value.type === "ASK_USER") {
    const label = intl.formatMessage({
      id: "component.petition-field-and-variables-select.ask-on-close",
      defaultMessage: "Ask on close",
    });
    return (
      <Box
        ref={ref}
        flex="1"
        minWidth="0"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        fontWeight={500}
      >
        <HighlightText as="span" search={highlight}>
          {label}
        </HighlightText>
      </Box>
    );
  } else {
    never();
  }
});

function mapValue<
  T extends
    PetitionUpdateProfileOnCloseSourceSelectOption<PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment>,
>(
  value: PetitionUpdateProfileOnCloseSourceSelectOptionValue<PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment> | null,
  options: T[],
): T | null {
  if (!value) return null;

  return (
    options.find((o) => {
      if (value.type === "FIELD" && o.value.type === "FIELD") {
        return o.value.field.id === value.field.id;
      } else if (value.type === "VARIABLE_ENUM" && o.value.type === "VARIABLE_ENUM") {
        return o.value.name === value.name;
      } else if (value.type === "VARIABLE_NUMBER" && o.value.type === "VARIABLE_NUMBER") {
        return o.value.name === value.name;
      } else if (value.type === "PETITION_METADATA" && o.value.type === "PETITION_METADATA") {
        return o.value.name === value.name;
      } else if (value.type === "ASK_USER" && o.value.type === "ASK_USER") {
        return true;
      }
      return false;
    }) ?? null
  );
}

function SingleValue(
  props: SingleValueProps<
    PetitionUpdateProfileOnCloseSourceSelectOption<PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment>,
    false,
    GroupBase<
      PetitionUpdateProfileOnCloseSourceSelectOption<PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment>
    >
  >,
) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <PetitionUpdateProfileOnCloseSourceSelectItem
          option={props.data}
          highlight={props.selectProps.inputValue ?? ""}
        />
      </Flex>
    </components.SingleValue>
  );
}

function Option(
  props: OptionProps<
    PetitionUpdateProfileOnCloseSourceSelectOption<PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment>,
    false,
    GroupBase<
      PetitionUpdateProfileOnCloseSourceSelectOption<PetitionUpdateProfileOnCloseSourceSelect_PetitionBaseFragment>
    >
  >,
) {
  return (
    <components.Option {...props}>
      <PetitionUpdateProfileOnCloseSourceSelectItem
        option={props.data}
        highlight={props.selectProps.inputValue ?? ""}
        indent
      />
    </components.Option>
  );
}

export function isFieldCompatible(
  profileTypeField: PetitionUpdateProfileOnCloseSourceSelect_ProfileTypeFieldFragment,
  petitionField: PetitionUpdateProfileOnCloseSourceSelect_PetitionFieldFragment,
) {
  const acceptedTypes = isNonNullish(profileTypeField)
    ? PROFILE_TYPE_FIELD_TO_PETITION_FIELD_TYPE[profileTypeField.type as ProfileTypeFieldType]
    : [];

  const profileTypeFieldStandardList = profileTypeField?.options?.standardList ?? null;
  const petitionFieldStandardList = petitionField.options?.standardList ?? null;

  const hasSameFormat = isNonNullish(profileTypeField?.options?.format)
    ? isNonNullish(petitionField.options?.format) &&
      isNonNullish(profileTypeField?.options?.format) &&
      petitionField.options.format === profileTypeField.options.format
    : true;

  return (
    acceptedTypes.includes(petitionField.type) &&
    (petitionField.multiple === false || petitionField.type === "FILE_UPLOAD") &&
    profileTypeFieldStandardList === petitionFieldStandardList &&
    hasSameFormat
  );
}
