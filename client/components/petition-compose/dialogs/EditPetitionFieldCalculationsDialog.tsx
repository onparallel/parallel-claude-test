import { gql } from "@apollo/client";
import { useFragment } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CalculatorIcon } from "@parallel/chakra/icons";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  useEditPetitionFieldCalculationsDialog_PetitionBaseFragment,
  useEditPetitionFieldCalculationsDialog_PetitionBaseFragmentDoc,
  useEditPetitionFieldCalculationsDialog_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { PetitionFieldMath } from "@parallel/utils/fieldLogic/types";
import { withError } from "@parallel/utils/promises/withError";
import { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { isNullish, pick } from "remeda";
import { assert } from "ts-essentials";
import { PetitionFieldMathEditor } from "../logic/PetitionFieldMathEditor";
import { useCreateOrUpdatePetitionVariableDialog } from "./CreateOrUpdatePetitionVariableDialog";

interface EditPetitionFieldCalculationsDialogProps {
  field: useEditPetitionFieldCalculationsDialog_PetitionFieldFragment;
  petition: useEditPetitionFieldCalculationsDialog_PetitionBaseFragment;
  isReadOnly?: boolean;
}

function EditPetitionFieldCalculationsDialog({
  field,
  petition: _petition,
  isReadOnly,
  ...props
}: DialogProps<
  EditPetitionFieldCalculationsDialogProps,
  { math: PetitionFieldMath | null | undefined }
>) {
  // get updated values of the petition from cache
  const result = useFragment({
    fragment: useEditPetitionFieldCalculationsDialog_PetitionBaseFragmentDoc,
    fragmentName: "useEditPetitionFieldCalculationsDialog_PetitionBase",
    from: pick(_petition, ["__typename", "id"]),
  });
  assert(result.complete);
  const petition = result.data;
  const math = useRef(field.math as PetitionFieldMath | null | undefined);
  const [showErrors, setShowErrors] = useState(false);

  const showCreateOrEditVariableDialog = useCreateOrUpdatePetitionVariableDialog();
  const handleAddNewVariable = async (defaultName?: string) => {
    const variable = await showCreateOrEditVariableDialog({
      petitionId: petition.id,
      defaultName,
    });
    return variable.name;
  };

  return (
    <ConfirmDialog
      size="3xl"
      hasCloseButton={false}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      header={
        <HStack>
          <Center background="purple.75" width={8} height={8} borderRadius="md">
            <CalculatorIcon boxSize={4} />
          </Center>
          <Text>
            <FormattedMessage
              id="component.edit-petition-field-calculations-dialog.title"
              defaultMessage="Calculations"
            />
          </Text>
        </HStack>
      }
      body={
        <Stack>
          {petition.variables.length === 0 ? (
            <Alert status="warning" rounded="md">
              <HStack>
                <AlertDescription flex="1">
                  <FormattedMessage
                    id="component.edit-petition-field-calculations-dialog.variables-warning"
                    defaultMessage="You need to add at least one variable to be able to perform calculations."
                  />
                </AlertDescription>
                <Button
                  variant="outline"
                  backgroundColor="white"
                  size="sm"
                  onClick={() => withError(handleAddNewVariable)}
                >
                  <FormattedMessage
                    id="component.edit-petition-field-calculations-dialog.create-variable-button"
                    defaultMessage="Create variable"
                  />
                </Button>
              </HStack>
            </Alert>
          ) : null}
          <Text>
            <FormattedMessage
              id="component.edit-petition-field-calculations-dialog.body-description"
              defaultMessage="Make calculations based on the replies."
            />
          </Text>
          <Flex>
            <HelpCenterLink articleId={8574972} display="flex" alignItems="center">
              <FormattedMessage
                id="component.edit-petition-field-calculations-dialog.help-center-link"
                defaultMessage="More about calculations"
              />
            </HelpCenterLink>
          </Flex>
          <Box paddingTop={1}>
            <PetitionFieldMathEditor
              field={field}
              petition={petition}
              showErrors={showErrors}
              onMathChange={(_math) => {
                math.current = _math;
              }}
              isReadOnly={isReadOnly}
              onCreateVariable={handleAddNewVariable}
            />
          </Box>
        </Stack>
      }
      confirm={
        <Button
          colorScheme="primary"
          onClick={() => {
            if (
              !math.current ||
              (math.current.length &&
                math.current.some(
                  (calc) =>
                    calc.operations.some((o) => !o.variable) ||
                    calc.conditions.some((c) => {
                      return (
                        ("fieldId" in c && !c.fieldId) ||
                        ("variableName" in c && !c.variableName) ||
                        (!("fieldId" in c) && !("variableName" in c)) ||
                        isNullish(c.value)
                      );
                    }),
                ))
            ) {
              setShowErrors(true);
            } else {
              props.onResolve({ math: math.current });
            }
          }}
        >
          <FormattedMessage id="generic.save-changes" defaultMessage="Save changes" />
        </Button>
      }
      {...props}
    />
  );
}

useEditPetitionFieldCalculationsDialog.fragments = {
  PetitionField: gql`
    fragment useEditPetitionFieldCalculationsDialog_PetitionField on PetitionField {
      id
      ...PetitionFieldMathEditor_PetitionField
    }
    ${PetitionFieldMathEditor.fragments.PetitionField}
  `,
  PetitionBase: gql`
    fragment useEditPetitionFieldCalculationsDialog_PetitionBase on PetitionBase {
      id
      variables {
        name
      }
      ...PetitionFieldMathEditor_PetitionBase
    }
    ${PetitionFieldMathEditor.fragments.PetitionBase}
  `,
};

export function useEditPetitionFieldCalculationsDialog() {
  return useDialog(EditPetitionFieldCalculationsDialog);
}
