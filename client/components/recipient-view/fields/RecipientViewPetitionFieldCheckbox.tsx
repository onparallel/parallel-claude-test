import { Checkbox, Flex, Stack, Text } from "@chakra-ui/react";
import { RadioButtonSelected } from "@parallel/chakra/icons";
import { CheckboxTypeLabel } from "@parallel/components/petition-common/CheckboxTypeLabel";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export type CheckboxValue = string[];

export interface RecipientViewPetitionFieldCheckboxProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onUpdateReply: (replyId: string, value: CheckboxValue) => void;
  onCreateReply: (value: CheckboxValue) => void;
}

const haveChanges = ({
  checked,
  choices,
  max,
}: {
  checked: string[];
  choices: string[];
  max: number;
}) => {
  return max === 1 ? checked[0] !== choices[0] : checked.length !== choices.length;
};

function CustomIcon() {
  return <RadioButtonSelected />;
}

export function RecipientViewPetitionFieldCheckbox({
  field,
  isDisabled,
  isInvalid,
  hasCommentsEnabled,
  onDownloadAttachment,
  onDeleteReply,
  onUpdateReply,
  onCreateReply,
  onCommentsButtonClick,
}: RecipientViewPetitionFieldCheckboxProps) {
  const { values, limit } = field.options;

  const { type = "UNLIMITED", max = 1 } = limit ?? {};

  const reply = field.replies.length > 0 ? field.replies[0] : undefined;
  const isRejected = reply?.status === "REJECTED" ?? false;
  const showRadio = max === 1 && type !== "UNLIMITED";

  const [checkedItems, setCheckedItems] = useState<string[]>(reply?.content?.choices ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async (value: string[]) => {
    setIsSaving(true);
    await onUpdateReply(reply!.id, value);
    setIsSaving(false);
  };

  const handleCreate = async (value: string[]) => {
    setIsSaving(true);
    await onCreateReply(value);
    setIsSaving(false);
  };

  const handleDelete = async () => {
    setIsSaving(true);
    await onDeleteReply(reply!.id);
    setIsSaving(false);
  };

  const handleChange = (option: string) => {
    const isSelected = checkedItems.includes(option);
    let newCheckedItems: string[];
    if (showRadio) {
      newCheckedItems = isSelected ? [] : [option];
    } else {
      // skip if maximum allowed options are selected
      if (type !== "UNLIMITED" && !isSelected && checkedItems.length >= max) {
        return;
      }
      newCheckedItems = isSelected
        ? checkedItems.filter((o) => o !== option)
        : [...checkedItems, option];
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
          choices: reply.content.choices,
          max: type === "UNLIMITED" ? values.length : max,
        })
      ) {
        handleUpdate(filteredChecked);
      }
    } else {
      handleCreate(filteredChecked);
    }
  };

  return (
    <RecipientViewPetitionFieldCard
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={false}
      onDownloadAttachment={onDownloadAttachment}
    >
      <Stack>
        <Flex flexWrap="wrap" alignItems="center">
          {field.type === "CHECKBOX" ? (
            <CheckboxTypeLabel fontSize="sm" marginRight={2} options={field.options} />
          ) : null}
          {!isSaving ? (
            <Text fontSize="sm" mr={2} color={isInvalid ? "red.600" : "gray.500"}>
              {checkedItems?.length ? (
                <>
                  {showRadio ? null : "("}
                  {type === "RADIO" || (max === 1 && type !== "UNLIMITED") ? (
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
                </>
              ) : null}
            </Text>
          ) : null}
          <Flex alignItems="center" boxSize={6}>
            <RecipientViewPetitionFieldReplyStatusIndicator
              isSaving={isSaving}
              reply={reply}
              showSavedIcon={false}
            />
          </Flex>
        </Flex>

        {values.map((option: string, index: number) => (
          <Checkbox
            key={index}
            isInvalid={isRejected}
            isDisabled={isDisabled || reply?.status === "APPROVED"}
            isChecked={checkedItems.includes(option)}
            onChange={(e) => {
              e.preventDefault();
              handleChange(option);
            }}
            {...(showRadio ? { icon: <CustomIcon />, variant: "radio" } : {})}
          >
            {option}
          </Checkbox>
        ))}
      </Stack>
    </RecipientViewPetitionFieldCard>
  );
}
