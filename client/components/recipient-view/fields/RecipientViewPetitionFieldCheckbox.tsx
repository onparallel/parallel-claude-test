import {
  Checkbox,
  RadioGroup,
  Radio,
  Stack,
  Text,
  Flex,
} from "@chakra-ui/react";
import { CheckboxTypeLabel } from "@parallel/components/petition-common/CheckboxTypeLabel";
import { useEffect, useState } from "react";
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

export function RecipientViewPetitionFieldCheckbox({
  petitionId,
  keycode,
  access,
  field,
  isDisabled,
  isInvalid,
  hasCommentsEnabled,
}: RecipientViewPetitionFieldCheckboxProps) {
  const { values, limit } = field.options;

  const { type = "UNLIMITED", max = 1 } = limit ?? {};

  const isRejected = field.replies[0]?.status === "REJECTED" ?? false;

  const [checkedItems, setCheckedItems] = useState(
    field.replies[0]?.content?.choices ?? ([] as string[])
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateCheckboxReply = useUpdateCheckboxReply();
  const handleUpdate = (replyId: string) => async (values: string[]) => {
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
  const handleCreate = (fieldId: string) => async (values: string[]) => {
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
  const handleDelete = async (replyId: string) => {
    setIsSaving(true);
    await deleteReply({ petitionId, fieldId: field.id, replyId, keycode });
    setIsSaving(false);
  };

  useEffect(() => {
    const filteredChecked = checkedItems.filter(
      (c: string) => values?.some((v: string) => v === c) ?? true
    );
    if (field.replies.length) {
      if (
        filteredChecked.length &&
        haveChanges({
          checked: filteredChecked,
          choices: field.replies[0].content.choices,
          max: type == "UNLIMITED" ? values.length : max,
        })
      ) {
        const update = handleUpdate(field.replies[0].id);
        update(filteredChecked);
      } else {
        handleDelete(field.replies[0].id);
      }
    } else {
      if (filteredChecked.length) {
        const create = handleCreate(field.id);
        create(filteredChecked);
      }
    }
  }, [checkedItems]);

  const handleRadioClick = (element) => {
    if (element.checked) {
      element.checked = false;
      delete element.nextSibling.dataset.checked;
    }
  };

  const showRadio = max === 1 && type !== "UNLIMITED";

  return (
    <RecipientViewPetitionFieldCard
      keycode={keycode}
      access={access}
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      showAddNewReply={false}
      onAddNewReply={() => {}}
    >
      <Stack>
        <Stack direction="row">
          <CheckboxTypeLabel fontSize="sm" field={field} />
          {!isSaving ? (
            <Text fontSize="sm" color="gray.500">
              {showRadio ? null : "("}
              <FormattedMessage
                id="component.recipient-view-petition-field-card.replies-submitted-unique"
                defaultMessage="{count, plural, =0 {No replies have been submitted yet} other {Reply submitted}}"
                values={{ count: field.replies.length }}
              />
              {showRadio ? null : ")"}
            </Text>
          ) : null}
          <Flex alignItems="center">
            <RecipientViewPetitionFieldReplyStatusIndicator
              isSaving={isSaving}
              reply={field.replies[0]}
              showSavedIcon={false}
            />
          </Flex>
        </Stack>

        {showRadio ? (
          <RadioGroup
            onClick={(e) => {
              if (e.target.className.includes("chakra-radio__label")) {
                handleRadioClick(e.target.previousSibling.previousSibling);
              }
              if (e.target.className.includes("chakra-radio__control")) {
                handleRadioClick(e.target.previousSibling);
              }
            }}
            onKeyPress={(e) => {
              if (e.code === "Space") {
                handleRadioClick(e.target);
              }
            }}
          >
            <Stack>
              {values.map((option, index) => {
                const id = `${option}-${index}`;
                return (
                  <Radio
                    key={index}
                    value={id}
                    isDisabled={isDisabled}
                    isInvalid={isRejected}
                  >
                    {option}
                  </Radio>
                );
              })}
            </Stack>
          </RadioGroup>
        ) : (
          values.map((option, index) => (
            <Checkbox
              key={index}
              isInvalid={isRejected}
              isDisabled={isDisabled}
              isChecked={checkedItems.includes(option)}
              onChange={(e) => {
                e.preventDefault();
                if (
                  e.target.checked &&
                  (type === "RANGE" || type === "EXACT")
                ) {
                  if (checkedItems.length === max) return;
                }
                setCheckedItems((checked) =>
                  e.target.checked
                    ? [...checked, option]
                    : checked.filter((o) => o !== option)
                );
              }}
            >
              {option}
            </Checkbox>
          ))
        )}
      </Stack>
    </RecipientViewPetitionFieldCard>
  );
}
