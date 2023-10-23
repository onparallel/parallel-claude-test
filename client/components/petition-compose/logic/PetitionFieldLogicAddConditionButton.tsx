import { Button } from "@chakra-ui/react";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldLogicCondition } from "@parallel/utils/fieldLogic/types";
import { FormattedMessage } from "react-intl";
import { usePetitionFieldLogicContext } from "./PetitionFieldLogicContext";

interface PetitionFieldLogicAddConditionButtonProps {
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
      leftIcon={<PlusCircleIcon position="relative" top="-1px" />}
      alignSelf="start"
      onClick={() => {
        const last = conditions[conditions.length - 1];
        const referencedField = fieldsWithIndices.find(([f]) => f.id === last.fieldId)![0];
        if (
          referencedField.type === "CHECKBOX" ||
          (referencedField.type === "SELECT" &&
            !["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(last.operator))
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
