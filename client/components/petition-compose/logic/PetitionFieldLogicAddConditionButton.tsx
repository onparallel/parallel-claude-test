import { Button, ButtonOptions, ThemingProps } from "@chakra-ui/react";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldLogicCondition } from "@parallel/utils/fieldLogic/types";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { usePetitionFieldLogicContext } from "./PetitionFieldLogicContext";

interface PetitionFieldLogicAddConditionButtonProps extends ButtonOptions, ThemingProps<"Button"> {
  conditions: PetitionFieldLogicCondition[];
  onAddCondition: (condition: PetitionFieldLogicCondition) => void;
}

export const PetitionFieldLogicAddConditionButton = chakraForwardRef<
  "button",
  PetitionFieldLogicAddConditionButtonProps
>(function PetitionFieldLogicAddConditionButton({ conditions, onAddCondition, ...props }, ref) {
  const { fieldsWithIndices } = usePetitionFieldLogicContext();
  return (
    <Button
      ref={ref}
      fontWeight="normal"
      size="sm"
      leftIcon={<PlusCircleIcon />}
      alignSelf="start"
      onClick={() => {
        const last = conditions[conditions.length - 1];
        const referencedField =
          "fieldId" in last ? fieldsWithIndices.find(([f]) => f.id === last.fieldId)![0] : null;
        if (
          isNonNullish(referencedField) &&
          "fieldId" in last &&
          ((referencedField.type === "CHECKBOX" && last.modifier !== "NUMBER_OF_REPLIES") ||
            (referencedField.type === "SELECT" &&
              ![
                "IS_ONE_OF",
                "NOT_IS_ONE_OF",
                "IS_IN_LIST",
                "NOT_IS_IN_LIST",
                "ANY_IS_IN_LIST",
                "ALL_IS_IN_LIST",
                "NONE_IS_IN_LIST",
              ].includes(last.operator) &&
              last.modifier !== "NUMBER_OF_REPLIES"))
        ) {
          // if the previous condition is of type SELECT or CHECKBOX try to get the next value
          const values = referencedField.options.values as string[];
          const index = Math.min(values.indexOf(last.value as string) + 1, values.length - 1);

          onAddCondition({
            ...last,
            value: values[index],
          });
        } else {
          onAddCondition({ ...last });
        }
      }}
      {...props}
    >
      <FormattedMessage
        id="component.petition-field-logic-add-condition-button.add-condition"
        defaultMessage="Add condition"
      />
    </Button>
  );
});
