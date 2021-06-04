import { Checkbox, RadioGroup, Radio, Stack, Text } from "@chakra-ui/react";
import { CheckboxTypeLabel } from "@parallel/components/petition-common/CheckboxTypeLabel";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useCreateCheckboxReply, useUpdateCheckboxReply } from "./mutations";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";

export interface RecipientViewPetitionFieldCheckboxProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  petitionId: string;
  isDisabled: boolean;
}

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

  const [checkedItems, setCheckedItems] = useState(
    field.replies[0]?.content?.options ?? ([] as string[])
  );

  const updateCheckboxReply = useUpdateCheckboxReply();
  const handleUpdate = (replyId: string) => async (values: string[]) => {
    await updateCheckboxReply({
      petitionId,
      replyId,
      keycode,
      values,
    });
  };

  const createChekcboxReply = useCreateCheckboxReply();
  const handleCreate = (fieldId: string) => async (values: string[]) => {
    await createChekcboxReply({
      petitionId,
      fieldId,
      keycode,
      values,
    });
  };

  useEffect(() => {
    if (field.replies.length) {
      if (checkedItems.length) {
        const update = handleUpdate(field.replies[0].id);
        update(checkedItems);
      } else {
        // delete reply
      }
    } else {
      if (checkedItems.length) {
        const create = handleCreate(field.id);
        create(checkedItems);
      }
    }
  }, [checkedItems]);

  const handleRadioClick = (element) => {
    console.log(element.checked);
    if (element.checked) {
      element.checked = false;
      delete element.nextSibling.dataset.checked;
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
      onAddNewReply={() => {}}
    >
      <Stack>
        <Stack direction="row">
          <CheckboxTypeLabel fontSize="sm" field={field} />
          <Text fontSize="sm" color="gray.500">
            <FormattedMessage
              id="component.recipient-view-petition-field-card.replies-submitted"
              defaultMessage="{count, plural, =0 {No replies have been submitted yet} =1 {1 reply submitted} other {# replies submitted}}"
              values={{ count: 0 }}
            />
          </Text>
        </Stack>

        {max === 1 && type !== "UNLIMITED" ? (
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
                  <Radio key={index} value={id}>
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
