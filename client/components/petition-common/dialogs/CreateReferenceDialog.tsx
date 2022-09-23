import { gql } from "@apollo/client";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  CreateReferenceDialog_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { PetitionFieldTypeIndicator } from "../PetitionFieldTypeIndicator";

type CreateReferenceDialogProps = {
  field: CreateReferenceDialog_PetitionFieldFragment;
  fieldIndex: PetitionFieldIndex;
  onFieldEdit?: (fieldId: string, data: UpdatePetitionFieldInput) => void;
};

export function useCreateReferenceDialog() {
  return useDialog(CreateReferenceDialog);
}

export function CreateReferenceDialog({
  field,
  fieldIndex,
  onFieldEdit,
  ...props
}: DialogProps<CreateReferenceDialogProps, string>) {
  const {
    handleSubmit,
    register,
    formState: { errors },
    setError,
  } = useForm<{ alias: string }>({
    mode: "onChange",
    defaultValues: {
      alias: "",
    },
  });

  const updateField = useCallback(
    async (fieldId, data) => {
      if (!onFieldEdit) return;
      try {
        await onFieldEdit(fieldId, data);
      } catch (error) {
        if (isApolloError(error, "ALIAS_ALREADY_EXISTS")) {
          setError("alias", {
            type: "ALIAS_ALREADY_EXISTS",
          });
        }
        throw error;
      }
    },
    [field.id]
  );

  const aliasRef = useRef<HTMLInputElement>(null);
  const aliasRefProps = useRegisterWithRef(aliasRef, register, "alias", {
    required: true,
    pattern: REFERENCE_REGEX,
  });

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      initialFocusRef={aliasRef}
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          try {
            await updateField(field.id, {
              options: {
                ...field.options,
              },
              alias: data.alias,
            });
            props.onResolve(data.alias);
          } catch {}
        }),
      }}
      {...props}
      header={
        <FormattedMessage
          id="component.create-reference-dialog.header"
          defaultMessage="Create reference"
        />
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.create-reference-dialog.body"
              defaultMessage="Add the reference to a field description where you want it to be replaced by the reply."
            />
          </Text>
          <HStack>
            <PetitionFieldTypeIndicator as="span" type={field.type} fieldIndex={fieldIndex} />
            {field.title ? (
              <Text> {field.title} </Text>
            ) : (
              <Text as="span" textStyle="hint">
                <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
              </Text>
            )}
          </HStack>
          <FormControl id="alias" isInvalid={!!errors.alias}>
            <FormLabel>
              <FormattedMessage
                id="component.create-reference-dialog.field-reference"
                defaultMessage="Field reference"
              />
            </FormLabel>
            <Input {...aliasRefProps} />
            <FormErrorMessage>
              {errors.alias?.type === "ALIAS_ALREADY_EXISTS" ? (
                <FormattedMessage
                  id="component.create-reference-dialog.reference-exists-error"
                  defaultMessage="This reference is already in use."
                />
              ) : (
                <FormattedMessage
                  id="component.create-reference-dialog.reference-invalid-error"
                  defaultMessage="Use only letters, numbers or _"
                />
              )}
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.done" defaultMessage="Done" />
        </Button>
      }
    />
  );
}

CreateReferenceDialog.fragments = {
  PetitionField: gql`
    fragment CreateReferenceDialog_PetitionField on PetitionField {
      id
      title
      type
      alias
      options
    }
  `,
};
