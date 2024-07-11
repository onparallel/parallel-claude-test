import { Box, Checkbox, HStack, Stack, Text } from "@chakra-ui/react";
import { RadioButtonSelected } from "@parallel/chakra/icons";
import { CheckboxTypeLabel } from "@parallel/components/petition-common/CheckboxTypeLabel";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { ChangeEvent, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { zip } from "remeda";

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
  return max === 1 ? checked[0] !== value[0] : checked.length !== value.length;
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
}: RecipientViewPetitionFieldCheckboxProps) {
  const options = field.options as FieldOptions["CHECKBOX"];

  const { type = "UNLIMITED", max = 1 } = options.limit ?? {};

  const reply = field.replies.length > 0 ? field.replies[0] : undefined;
  const isRejected = reply?.status === "REJECTED" ?? false;
  const showRadio = max === 1 && type !== "UNLIMITED";
  const [hasAlreadyRepliedError, setHasAlreadyRepliedError] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>(reply?.content?.value ?? []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (haveChanges({ checked: checkedItems, value: reply?.content?.value ?? [], max: max })) {
      setCheckedItems(reply?.content?.value ?? []);
    }
    if (hasAlreadyRepliedError) {
      setHasAlreadyRepliedError(false);
    }
  }, [reply]);

  const handleUpdate = async (value: string[]) => {
    setIsSaving(true);
    try {
      await onUpdateReply(reply!.id, { value });
    } catch (e) {
      onError(e);
    }
    setIsSaving(false);
  };

  const handleCreate = async (value: string[]) => {
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
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await onDeleteReply(reply!.id);
    } catch (e) {
      onError(e);
    }
    setIsSaving(false);
  };

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
    const filteredChecked = newCheckedItems.filter((c) => options.values.includes(c));

    if (!filteredChecked.length && reply) {
      handleDelete();
    } else if (reply) {
      if (
        haveChanges({
          checked: filteredChecked,
          value: reply.content.value,
          max: type === "UNLIMITED" ? options.values.length : max,
        })
      ) {
        handleUpdate(filteredChecked);
      }
    } else {
      handleCreate(filteredChecked);
    }
  };

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={false}
      onDownloadAttachment={onDownloadAttachment}
    >
      <Stack
        id={`reply-${field.id}${reply?.parent ? `-${reply!.parent.id}` : ""}${
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
          {!isSaving && checkedItems?.length ? (
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
                  values={{ count: checkedItems.length, total: max }}
                />
              ) : (
                <FormattedMessage
                  id="component.recipient-view-petition-field-card.replies-submitted-checkbox-count"
                  defaultMessage="{count} submitted"
                  values={{ count: checkedItems.length }}
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

        {zip(options.values, options.labels ?? options.values).map(([value, label], index) => (
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
        ))}
      </Stack>
    </RecipientViewPetitionFieldLayout>
  );
}
