import { Box, Checkbox, HStack, Stack } from "@chakra-ui/react";
import { DeleteIcon, RadioButtonSelected } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import {
  MultiCheckboxSimpleSelect,
  MultiCheckboxSimpleSelectInstance,
  MultiCheckboxSimpleSelectProps,
} from "@parallel/components/common/MultiCheckboxSimpleSelect";
import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { useTone } from "@parallel/components/common/ToneProvider";
import { CheckboxTypeLabel } from "@parallel/components/petition-common/CheckboxTypeLabel";
import { Text } from "@parallel/components/ui";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { OptimizedMenuList } from "@parallel/utils/react-select/OptimizedMenuList";
import { ChangeEvent, RefAttributes, useCallback, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  components,
  createFilter,
  MultiValueProps,
  MultiValueRemoveProps,
  PlaceholderProps,
  ValueContainerProps,
} from "react-select";
import { filter, isIncludedIn, isNonNullish, isNot, zip } from "remeda";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

type SelectOptionValue = {
  label: LocalizableUserText;
  value: string;
};
export interface RecipientViewPetitionFieldCheckboxProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  isInvalid?: boolean;
  onDeleteReply: (replyId: string) => void;
  onUpdateReply: (replyId: string, content: { value: string[] }) => Promise<void>;
  onCreateReply: (content: { value: string[] }) => Promise<string | undefined>;
  onError: (error: any) => void;
  parentReplyId?: string;
}

const haveChanges = ({
  checked,
  value,
  max,
}: {
  checked: string[];
  value: string[];
  max: number;
}) => {
  if (max === 1) return checked[0] !== value[0];

  if (checked.length !== value.length) return true;

  return checked.some((item) => !value.includes(item));
};

function CustomIcon() {
  return <RadioButtonSelected />;
}

export function RecipientViewPetitionFieldCheckbox({
  field,
  isDisabled,
  isInvalid,
  onDownloadAttachment,
  onDeleteReply,
  onUpdateReply,
  onCreateReply,
  onCommentsButtonClick,
  onError,
  parentReplyId,
}: RecipientViewPetitionFieldCheckboxProps) {
  const intl = useIntl();
  const tone = useTone();

  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  const {
    values,
    labels,
    standardList,
    limit: { type = "UNLIMITED", max = 1 } = {},
  } = field.options as FieldOptions["CHECKBOX"];
  const showMultiSelect = isNonNullish(standardList) || values.length > 15;
  const reply = filteredReplies.length > 0 ? filteredReplies[0] : undefined;
  const isRejected = reply?.status === "REJECTED" || false;
  const showRadio = max === 1 && type !== "UNLIMITED";
  const [hasAlreadyRepliedError, setHasAlreadyRepliedError] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>(reply?.content?.value ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const options = useSimpleSelectOptions(
    () =>
      zip(values, labels ?? values).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  useEffect(() => {
    if (haveChanges({ checked: checkedItems, value: reply?.content?.value ?? [], max: max })) {
      setCheckedItems(reply?.content?.value ?? []);
    }
    if (hasAlreadyRepliedError) {
      setHasAlreadyRepliedError(false);
    }
  }, [reply, max, hasAlreadyRepliedError]);

  const handleUpdate = useCallback(
    async (value: string[]) => {
      setIsSaving(true);
      try {
        await onUpdateReply(reply!.id, { value });
      } catch (e) {
        onError(e);
      }
      setIsSaving(false);
    },
    [reply, onUpdateReply, onError],
  );

  const handleCreate = useCallback(
    async (value: string[]) => {
      setIsSaving(true);
      try {
        await onCreateReply({ value });
      } catch (e) {
        if (isApolloError(e, "FIELD_ALREADY_REPLIED_ERROR")) {
          setHasAlreadyRepliedError(true);
        }
        onError(e);
      }
      setIsSaving(false);
    },
    [onCreateReply, onError],
  );

  const handleDelete = useCallback(async () => {
    setIsSaving(true);
    try {
      await onDeleteReply(reply!.id);
    } catch (e) {
      onError(e);
    }
    setIsSaving(false);
  }, [reply, onDeleteReply, onError]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.value;
    const isSelected = checkedItems.includes(value);
    let newCheckedItems: string[];
    if (showRadio) {
      newCheckedItems = isSelected ? [] : [value];
    } else {
      // skip if maximum allowed options are selected
      if (type !== "UNLIMITED" && !isSelected && checkedItems.length >= max) {
        return;
      }
      newCheckedItems = isSelected
        ? checkedItems.filter((o) => o !== value)
        : [...checkedItems, value];
    }
    setCheckedItems(newCheckedItems);
    // make sure we only submit existing options
    const filteredChecked = newCheckedItems.filter((c) => values.includes(c));

    if (!filteredChecked.length && reply) {
      handleDelete();
    } else if (reply) {
      if (
        haveChanges({
          checked: filteredChecked,
          value: reply.content.value,
          max: type === "UNLIMITED" ? values.length : max,
        })
      ) {
        handleUpdate(filteredChecked);
      }
    } else {
      handleCreate(filteredChecked);
    }
  };

  const checkedItemsLength = (reply?.content?.value ?? []).length;

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={false}
      onDownloadAttachment={onDownloadAttachment}
    >
      <Stack
        id={`reply-${field.id}${reply?.parent ? `-${reply.parent.id}` : ""}${
          reply?.id ? `-${reply.id}` : ""
        }`}
      >
        <HStack wrap="wrap" color="gray.600" fontSize="sm" gridGap={2} spacing={0}>
          <CheckboxTypeLabel as="span" options={field.options} />
          {reply?.isAnonymized ? (
            <Text>
              {"("}
              <FormattedMessage
                id="generic.reply-not-available"
                defaultMessage="Reply not available"
              />

              {")"}
            </Text>
          ) : null}
          {!isSaving && checkedItemsLength > 0 ? (
            <Box as="span" color={isInvalid || hasAlreadyRepliedError ? "red.600" : "gray.600"}>
              {showRadio ? null : "("}
              {hasAlreadyRepliedError ? (
                <FormattedMessage
                  id="generic.reply-not-submitted"
                  defaultMessage="Reply not sent"
                />
              ) : type === "RADIO" || (max === 1 && type !== "UNLIMITED") ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-card.replies-submitted-checkbox"
                  defaultMessage="Reply submitted"
                />
              ) : type === "EXACT" ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-card.replies-submitted-checkbox-exact"
                  defaultMessage="{count}/{total} submitted"
                  values={{ count: checkedItemsLength, total: max }}
                />
              ) : (
                <FormattedMessage
                  id="component.recipient-view-petition-field-card.replies-submitted-checkbox-count"
                  defaultMessage="{count} submitted"
                  values={{ count: checkedItemsLength }}
                />
              )}

              {showRadio ? null : ")"}
            </Box>
          ) : null}
          <RecipientViewPetitionFieldReplyStatusIndicator
            isSaving={isSaving}
            reply={reply}
            showSavedIcon={false}
          />
        </HStack>
        {showMultiSelect ? (
          <HStack align="start">
            <Box flex="1">
              <PetitionFieldCheckboxMultiSelect
                maxItems={type === "UNLIMITED" ? undefined : max}
                isDisabled={isDisabled || reply?.status === "APPROVED" || reply?.isAnonymized}
                isInvalid={isRejected || isInvalid || hasAlreadyRepliedError}
                value={checkedItems}
                options={options}
                onChange={(values) => setCheckedItems(values)}
                onBlur={async () => {
                  if (!checkedItems.length && isNonNullish(reply?.id)) {
                    await handleDelete();
                    return;
                  }

                  if (isNonNullish(reply) && isNonNullish(reply?.content?.value)) {
                    if (
                      checkedItems.length !== reply.content.value.length ||
                      filter(checkedItems, isNot(isIncludedIn(reply.content.value))).length
                    ) {
                      await handleUpdate(checkedItems);
                    }
                  } else if (checkedItems.length > 0) {
                    await handleCreate(checkedItems);
                  }
                }}
                placeholder={intl.formatMessage(
                  {
                    id: "component.recipient-view-petition-field-checkbox.select-placeholder",
                    defaultMessage: "Select an option",
                  },
                  { tone },
                )}
              />
            </Box>

            {isNonNullish(reply) ? (
              <IconButtonWithTooltip
                disabled={isDisabled || reply.status === "APPROVED"}
                onClick={() => handleDelete()}
                variant="ghost"
                icon={<DeleteIcon />}
                size="md"
                placement="bottom"
                label={intl.formatMessage({
                  id: "component.recipient-view-petition-field-reply.remove-reply-label",
                  defaultMessage: "Remove reply",
                })}
              />
            ) : null}
          </HStack>
        ) : (
          options.map(({ value, label }, index) => (
            <Checkbox
              key={index}
              data-value={value}
              isInvalid={isRejected || isInvalid || hasAlreadyRepliedError}
              isDisabled={isDisabled || reply?.status === "APPROVED" || reply?.isAnonymized}
              isChecked={checkedItems.includes(value)}
              value={value}
              onChange={handleChange}
              {...(showRadio ? { icon: <CustomIcon />, variant: "radio" } : {})}
              colorScheme="blue"
            >
              {label}
            </Checkbox>
          ))
        )}
      </Stack>
    </RecipientViewPetitionFieldLayout>
  );
}

interface PetitionFieldCheckboxStandardListProps extends MultiCheckboxSimpleSelectProps {}

function PetitionFieldCheckboxMultiSelect(
  props: PetitionFieldCheckboxStandardListProps & RefAttributes<MultiCheckboxSimpleSelectInstance>,
) {
  return (
    <MultiCheckboxSimpleSelect
      {...props}
      isClearable={false}
      filterOption={createFilter({
        // this improves search performance on long lists
        ignoreAccents: props.options!.length > 1000 ? false : true,
      })}
      components={
        {
          ValueContainer,
          MultiValueRemove,
          MultiValue,
          Placeholder,
          ...(props.options!.length > 100 ? { MenuList: OptimizedMenuList as any } : {}),
        } as any
      }
      styles={{
        control: (baseStyles) => ({
          ...baseStyles,
          ":focus-within": {
            "[data-rs='multi-value']": { backgroundColor: "#e2e8f0" },
            "[data-rs='multi-value-remove']": { display: "flex" },
            "[data-rs='value-container'] > :last-child": {
              height: "auto",
              position: "relative",
            },
            "[data-rs='value-container'] > :last-child > input": {
              height: "auto",
            },
            "[data-rs='placeholder']": {
              display: "none",
            },
          },
        }),
        valueContainer: (baseStyles) => ({
          ...baseStyles,
          paddingInlineStart: "10px",
          paddingInlineEnd: "16px",
          paddingBlock: "2px",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          alignItems: "flex-start",
        }),
        multiValue: (baseStyles) => ({
          ...baseStyles,
          backgroundColor: "transparent",
        }),
        multiValueRemove: (baseStyles) => ({
          ...baseStyles,
          display: "none",
        }),
        multiValueLabel: (baseStyles) => ({
          ...baseStyles,
          fontSize: "16px",
          whiteSpace: "wrap",
        }),
        placeholder: (baseStyles) => ({
          ...baseStyles,
          ":focus-within": {
            display: "none",
          },
          overflow: "hidden",
          flex: 1,
          display: "flex",
          alignItems: "center",
        }),
        input: (baseStyles) => ({
          ...baseStyles,
          height: "auto",
          position: "absolute",
          "> input": {
            height: "auto",
          },
        }),
      }}
      checkboxColorScheme="blue"
    />
  );
}

function Placeholder(props: PlaceholderProps<SelectOptionValue, true, never>) {
  return (
    <components.Placeholder
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "placeholder" } }}
    />
  );
}

function ValueContainer(props: ValueContainerProps<SelectOptionValue, true, never>) {
  return (
    <components.ValueContainer
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "value-container" } }}
    />
  );
}

function MultiValue(props: MultiValueProps<SelectOptionValue, true, never>) {
  return (
    <components.MultiValue
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "multi-value" } }}
    />
  );
}

function MultiValueRemove(props: MultiValueRemoveProps<SelectOptionValue, true, never>) {
  return (
    <components.MultiValueRemove
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "multi-value-remove" } }}
    />
  );
}
