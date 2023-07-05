import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowDiagonalRightIcon } from "@parallel/chakra/icons";
import { PetitionSelect, PetitionSelectInstance } from "@parallel/components/common/PetitionSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface AssociatePetitionToProfileDialogProps {
  excludePetitions?: string[];
}

interface AssociatePetitionToProfileDialogData {
  petitionId: string | null;
}

function AssociatePetitionToProfileDialog({
  excludePetitions,
  ...props
}: DialogProps<AssociatePetitionToProfileDialogProps, string>) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssociatePetitionToProfileDialogData>({
    defaultValues: { petitionId: null },
  });

  const selectRef = useRef<PetitionSelectInstance<false>>(null);

  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      initialFocusRef={selectRef}
      content={
        {
          as: "form",
          onSubmit: handleSubmit(({ petitionId }) => props.onResolve(petitionId!)),
        } as any
      }
      {...props}
      header={
        <HStack>
          <ArrowDiagonalRightIcon />
          <Text as="span">
            <FormattedMessage
              id="component.associate-petition-to-profile-dialog.header"
              defaultMessage="Associate parallel"
            />
          </Text>
        </HStack>
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.petitionId}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.associate-petition-to-profile-dialog.parallel-label"
                defaultMessage="Parallel"
              />
            </FormLabel>
            <Controller
              name="petitionId"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <PetitionSelect
                  ref={selectRef}
                  defaultOptions
                  excludePetitions={excludePetitions}
                  permissionTypes={["OWNER", "WRITE"]}
                  value={value}
                  onChange={(v) => {
                    onChange(v?.id ?? null);
                  }}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.associate-petition-to-profile-dialog.parallel-error"
                defaultMessage="Please, select a parallel"
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage
            id="component.associate-petition-to-profile-dialog.associate"
            defaultMessage="Associate"
          />
        </Button>
      }
    />
  );
}

export function useAssociatePetitionToProfileDialog() {
  return useDialog(AssociatePetitionToProfileDialog);
}
