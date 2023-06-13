import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Stack,
  Text,
  useCounter,
} from "@chakra-ui/react";
import { MapFieldsTable } from "@parallel/components/common/MapFieldsTable";
import { PetitionSelect, PetitionSelectInstance } from "@parallel/components/common/PetitionSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  ImportRepliesDialog_createPetitionFieldRepliesDocument,
  ImportRepliesDialog_petitionDocument,
} from "@parallel/graphql/__types";
import { mapReplyContents } from "@parallel/utils/petitionFieldsReplies";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

export function ImportRepliesDialog({ petitionId, ...props }: DialogProps<{ petitionId: string }>) {
  const {
    valueAsNumber: currentStep,
    increment: nextStep,
    decrement: prevStep,
  } = useCounter({ min: 0, max: 1, defaultValue: 0 });

  const {
    handleSubmit,
    register,
    control,
    watch,
    resetField,
    formState: { errors },
    setError,
  } = useForm<{
    sourcePetitionId: null | string;
    mapping: Record<string, string>;
    overwriteExisting: boolean;
  }>({
    defaultValues: {
      sourcePetitionId: null,
      mapping: {},
      overwriteExisting: false,
    },
  });

  const overwriteExisting = watch("overwriteExisting");

  const [getSelectedPetition, { data: selectedPetitionData }] = useLazyQuery(
    ImportRepliesDialog_petitionDocument
  );

  const { data: petitionData } = useQuery(ImportRepliesDialog_petitionDocument, {
    variables: { petitionId },
  });

  const petitionSelectorRef = useRef<PetitionSelectInstance<false>>(null);

  const [createPetitionFieldReplies, { loading: isSubmitting }] = useMutation(
    ImportRepliesDialog_createPetitionFieldRepliesDocument
  );

  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      size={currentStep === 0 ? "xl" : "6xl"}
      initialFocusRef={petitionSelectorRef}
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          if (currentStep === 0) {
            if (data.sourcePetitionId) {
              await getSelectedPetition({
                variables: {
                  petitionId: data.sourcePetitionId,
                },
              });
              nextStep();
            }
          } else {
            const mappedFields = mapReplyContents({
              value: data.mapping,
              target: petitionData?.petition?.fields ?? [],
              origin: selectedPetitionData?.petition?.fields ?? [],
            });
            if (mappedFields.length) {
              await createPetitionFieldReplies({
                variables: {
                  petitionId,
                  fields: mappedFields,
                  overwriteExisting: data.overwriteExisting,
                },
              });

              props.onResolve();
            } else {
              setError("mapping", { type: "invalid" });
            }
          }
        }),
      }}
      header={
        <Flex alignItems="baseline">
          <FormattedMessage
            id="component.import-replies-dialog.title"
            defaultMessage="Import replies"
          />
          <Text marginLeft={2} color="gray.600" fontSize="md" fontWeight="400">
            {currentStep + 1}/2
          </Text>
        </Flex>
      }
      body={
        currentStep === 0 ? (
          <FormControl isInvalid={!!errors.sourcePetitionId}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.import-replies-dialog.source-petition-label"
                defaultMessage="Select the parallel to import the replies from"
              />
            </FormLabel>
            <Box width="100%">
              <Controller
                name="sourcePetitionId"
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <PetitionSelect
                    ref={petitionSelectorRef}
                    value={value}
                    defaultOptions
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(petitions) => {
                      onChange(petitions?.id ?? null);
                      resetField("mapping");
                    }}
                    onBlur={onBlur}
                  />
                )}
              />
            </Box>
            <FormErrorMessage>
              <FormattedMessage
                id="component.import-replies-dialog.select-petition-error"
                defaultMessage="Please, select a parallel to continue"
              />
            </FormErrorMessage>
          </FormControl>
        ) : (
          <Stack>
            <Text>
              <FormattedMessage
                id="component.import-replies-dialog.mapping-despcription"
                defaultMessage="Map each field of the current parallel to the corresponding field from the source"
              />
            </Text>
            <FormControl isInvalid={!!errors.mapping}>
              <Controller
                name="mapping"
                control={control}
                rules={{ validate: (value) => Object.keys(value).length > 0 }}
                render={({ field: { value, onChange } }) => {
                  return (
                    <MapFieldsTable
                      fields={petitionData?.petition?.fields ?? []}
                      sourcePetitionFields={selectedPetitionData?.petition?.fields ?? []}
                      overwriteExisting={overwriteExisting}
                      value={value}
                      onChange={onChange}
                      maxHeight="400px"
                      isDisabled={isSubmitting}
                    />
                  );
                }}
              />
            </FormControl>
            <FormControl isDisabled={isSubmitting}>
              <Checkbox {...register("overwriteExisting")}>
                <FormattedMessage
                  id="component.import-replies-dialog.checkbox-overwrite-replies"
                  defaultMessage="Overwrite existing replies"
                />
              </Checkbox>
            </FormControl>
          </Stack>
        )
      }
      alternative={
        !!errors.mapping && currentStep === 1 ? (
          <Text color="red.600" aria-live="polite">
            <FormattedMessage
              id="component.import-replies-dialog.select-replies-import-error"
              defaultMessage="Please, select at least one reply to import"
            />
          </Text>
        ) : null
      }
      confirm={
        <Button colorScheme="primary" type="submit" isLoading={isSubmitting}>
          {currentStep === 0 ? (
            <FormattedMessage
              id="component.import-replies-dialog.next-button"
              defaultMessage="Next"
            />
          ) : (
            <FormattedMessage
              id="component.import-replies-dialog.limport-button"
              defaultMessage="Import"
            />
          )}
        </Button>
      }
      cancel={
        <Button
          onClick={() => {
            if (currentStep === 1) {
              prevStep();
            } else {
              props.onReject("CLOSE");
            }
          }}
          isDisabled={isSubmitting}
        >
          {currentStep === 0 ? (
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          ) : (
            <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
          )}
        </Button>
      }
      {...props}
    />
  );
}

const _queries = [
  gql`
    query ImportRepliesDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        fields {
          ...MapFieldsTable_PetitionField
          ...mapReplyContents_PetitionField
        }
      }
    }
    ${mapReplyContents.fragments.PetitionField}
    ${MapFieldsTable.fragments.PetitionField}
  `,
];

const _mutations = [
  gql`
    mutation ImportRepliesDialog_createPetitionFieldReplies(
      $petitionId: GID!
      $fields: [CreatePetitionFieldReplyInput!]!
      $overwriteExisting: Boolean
    ) {
      createPetitionFieldReplies(
        petitionId: $petitionId
        fields: $fields
        overwriteExisting: $overwriteExisting
      ) {
        id
      }
    }
  `,
];

export function useImportRepliesDialog() {
  return useDialog(ImportRepliesDialog);
}
