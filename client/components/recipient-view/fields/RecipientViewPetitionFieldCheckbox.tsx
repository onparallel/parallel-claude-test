import { Checkbox, Flex, Stack, Text } from "@chakra-ui/react";
import { RadioButtonSelected } from "@parallel/chakra/icons";
import { CheckboxTypeLabel } from "@parallel/components/petition-common/CheckboxTypeLabel";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  useCreateCheckboxReply,
  useDeletePetitionReply,
  useUpdateCheckboxReply,
} from "./mutations";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export interface RecipientViewPetitionFieldCheckboxProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  petitionId: string;
  isDisabled: boolean;
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
  return max === 1
    ? checked[0] != choices[0]
    : checked.length != choices.length;
};

function CustomIcon() {
  return <RadioButtonSelected />;
}

export function RecipientViewPetitionFieldCheckbox({
  petitionId,
  keycode,
  access,
  field,
  isDisabled,
  isInvalid,
  hasCommentsEnabled,
  onDownloadAttachment,
}: RecipientViewPetitionFieldCheckboxProps) {
  const { values, limit } = field.options;

  const { type = "UNLIMITED", max = 1 } = limit ?? {};

  const isRejected = field.replies[0]?.status === "REJECTED" ?? false;
  const showRadio = max === 1 && type !== "UNLIMITED";
  const fieldId = field.id;
  const replyId = field.replies[0]?.id;

  const [checkedItems, setCheckedItems] = useState<string[]>(
    field.replies[0]?.content?.choices ?? []
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateCheckboxReply = useUpdateCheckboxReply();
  const handleUpdate = async (values: string[]) => {
    setIsSaving(true);
    await updateCheckboxReply({
      petitionId,
      replyId,
      keycode,
      values,
    });
    setIsSaving(false);
  };

  const createChekcboxReply = useCreateCheckboxReply();
  const handleCreate = async (values: string[]) => {
    setIsSaving(true);
    await createChekcboxReply({
      petitionId,
      fieldId,
      keycode,
      values,
    });
    setIsSaving(false);
  };

  const deleteReply = useDeletePetitionReply();
  const handleDelete = async () => {
    setIsSaving(true);
    await deleteReply({ petitionId, fieldId, replyId, keycode });
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

    if (!filteredChecked.length && field.replies.length) {
      handleDelete();
    } else if (field.replies.length) {
      if (
        haveChanges({
          checked: filteredChecked,
          choices: field.replies[0].content.choices,
          max: type == "UNLIMITED" ? values.length : max,
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
      keycode={keycode}
      access={access}
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      showAddNewReply={false}
      onDownloadAttachment={onDownloadAttachment}
    >
      <Stack>
        <Flex flexWrap="wrap" alignItems="center">
          {field.type === "CHECKBOX" ? (
            <CheckboxTypeLabel
              fontSize="sm"
              marginRight={2}
              options={field.options}
            />
          ) : null}
          {!isSaving ? (
            <Text
              fontSize="sm"
              mr={2}
              color={isInvalid ? "red.600" : "gray.500"}
            >
              {showRadio ? null : "("}
              {type === "RADIO" || (max === 1 && type !== "UNLIMITED") ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-card.replies-submitted-checkbox"
                  defaultMessage="{count, plural, =0 {No replies have been submitted yet} other {Reply submitted}}"
                  values={{ count: checkedItems.length }}
                />
              ) : type === "UNLIMITED" ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-card.replies-submitted-checkbox-count"
                  defaultMessage="{count, plural, =0 {No replies have been submitted yet} other {{count} submitted}}"
                  values={{ count: checkedItems.length }}
                />
              ) : type === "EXACT" ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-card.replies-submitted-checkbox-exact"
                  defaultMessage="{count, plural, =0 {No replies have been submitted yet} other {{count}/{total} submitted}}"
                  values={{ count: checkedItems.length, total: max }}
                />
              ) : (
                <FormattedMessage
                  id="component.recipient-view-petition-field-card.replies-submitted-checkbox-count"
                  defaultMessage="{count, plural, =0 {No replies have been submitted yet} other {{count} submitted}}"
                  values={{ count: checkedItems.length }}
                />
              )}
              {showRadio ? null : ")"}
            </Text>
          ) : null}
          <Flex alignItems="center" boxSize={6}>
            <RecipientViewPetitionFieldReplyStatusIndicator
              isSaving={isSaving}
              reply={field.replies[0]}
              showSavedIcon={false}
            />
          </Flex>
        </Flex>

        {values.map((option: string, index: number) => (
          <Checkbox
            key={index}
            isInvalid={isRejected}
            isDisabled={isDisabled}
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
