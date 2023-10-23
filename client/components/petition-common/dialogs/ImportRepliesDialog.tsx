import { FetchResult, gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
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
import {
  MapFieldsTable,
  excludedFieldsOrigin,
  excludedFieldsTarget,
} from "@parallel/components/common/MapFieldsTable";
import { PetitionSelect, PetitionSelectInstance } from "@parallel/components/common/PetitionSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  CreatePetitionFieldReplyInput,
  ImportRepliesDialog_createPetitionFieldRepliesDocument,
  ImportRepliesDialog_createPetitionFieldRepliesMutation,
  ImportRepliesDialog_petitionDocument,
  ImportRepliesDialog_petitionQuery,
} from "@parallel/graphql/__types";
import { isReplyContentCompatible, mapReplyContents } from "@parallel/utils/petitionFieldsReplies";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { groupBy, isDefined } from "remeda";

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
    setValue,
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

  const [invalidGroups, setInvalidGroups] = useState<string[] | null>(null);

  const overwriteExisting = watch("overwriteExisting");

  const [getSelectedPetition, { data: selectedPetitionData }] = useLazyQuery(
    ImportRepliesDialog_petitionDocument,
  );

  const { data: petitionData } = useQuery(ImportRepliesDialog_petitionDocument, {
    variables: { petitionId },
  });

  const petitionSelectorRef = useRef<PetitionSelectInstance<false>>(null);

  const [createPetitionFieldReplies, { loading: isSubmitting }] = useMutation(
    ImportRepliesDialog_createPetitionFieldRepliesDocument,
  );

  const petitionFields = petitionData?.petition?.fields ?? [];

  const allFields = useMemo(
    () => petitionFields.flatMap((f) => [f, ...(f.children ?? [])]),
    [petitionData?.petition?.fields],
  );

  const allSelectedPetitionFields = useMemo(
    () =>
      (selectedPetitionData?.petition?.fields ?? [])
        .flatMap((f) => [f, ...(f.children ?? [])])
        .map((f) => ({
          ...f,
          replies:
            f.type === "ES_TAX_DOCUMENTS"
              ? f.replies.filter((r) => !isDefined(r.content.error))
              : f.replies,
        })),
    [selectedPetitionData?.petition?.fields],
  );

  const selectedPetitionFields = (selectedPetitionData?.petition?.fields ?? []).map((f) => ({
    ...f,
    replies:
      f.type === "ES_TAX_DOCUMENTS"
        ? f.replies.filter((r) => !isDefined(r.content.error))
        : f.replies,
  }));

  const setInitialMapping = (
    sourcePetition: ImportRepliesDialog_petitionQuery | undefined | null,
  ) => {
    const mapping = {} as Record<string, string>;

    const sourcePetitionFields = (sourcePetition?.petition?.fields ?? [])
      .flatMap((f) => [f, ...(f.children ?? [])])
      .map((f) => ({
        ...f,
        replies:
          f.type === "ES_TAX_DOCUMENTS"
            ? f.replies.filter((r) => !isDefined(r.content.error))
            : f.replies,
      }));

    const filteredFields = allFields.filter(
      (f) => !excludedFieldsTarget.includes(f.type) && mapping[f.id] === undefined,
    );
    const filteredSourceFields = sourcePetitionFields.filter(
      (f) => !excludedFieldsOrigin.includes(f.type),
    );

    for (const field of filteredFields) {
      const replyIsApproved = field.replies.length === 1 && field.replies[0].status === "APPROVED";
      const isFieldReplied =
        (field.replies.length > 0 &&
          !field.multiple &&
          field.parent?.id === undefined &&
          field.type !== "FIELD_GROUP") ||
        replyIsApproved;
      if (!isFieldReplied) {
        const matchingField =
          (isDefined(field.alias) &&
            filteredSourceFields.find((f) => {
              return field.alias === f.alias && isReplyContentCompatible(field, f);
            })) ||
          (isDefined(field.fromPetitionFieldId) &&
            filteredSourceFields.find((f) => {
              return (
                field.fromPetitionFieldId === f.fromPetitionFieldId &&
                isReplyContentCompatible(field, f)
              );
            })) ||
          null;
        if (isDefined(matchingField)) {
          mapping[field.id] = matchingField.id;
        }
      }
    }
    setValue("mapping", mapping);
  };

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
              const res = await getSelectedPetition({
                variables: {
                  petitionId: data.sourcePetitionId,
                },
              });

              setInitialMapping(res.data);
              nextStep();
            }
          } else {
            const mappedFields = mapReplyContents({
              mapping: data.mapping,
              fields: allFields,
              sourcePetitionFields: allSelectedPetitionFields,
            });

            const fieldGroups = mappedFields.fields.filter(
              (f) => Object.keys(f.content).length === 0,
            );

            const groupsWithoutChildren = fieldGroups.length
              ? fieldGroups
                  .filter(({ id }) => !mappedFields.children.some((ch) => ch.targetFieldId === id))
                  .map((r) => r.id)
              : [];

            if (
              (mappedFields.fields.length || mappedFields.children.length) &&
              groupsWithoutChildren.length === 0
            ) {
              let res =
                null as FetchResult<ImportRepliesDialog_createPetitionFieldRepliesMutation> | null;

              if (mappedFields.fields.length) {
                res = await createPetitionFieldReplies({
                  variables: {
                    petitionId,
                    fields: mappedFields.fields,
                    overwriteExisting: data.overwriteExisting,
                  },
                });
              }

              let childrenFields = [] as CreatePetitionFieldReplyInput[];

              Object.entries(groupBy(mappedFields.children, (ch) => ch.targetFieldId)).forEach(
                ([targetFieldId, childrenReplyInput]) => {
                  const field =
                    res?.data?.createPetitionFieldReplies.filter(
                      (r) => r.field?.id === targetFieldId,
                    )[0]?.field ?? petitionFields.find((f) => f.id === targetFieldId);

                  const replies =
                    field?.replies.filter(
                      (reply) => reply.children?.every((child) => child.replies.length === 0),
                    ) ?? [];

                  childrenFields = childrenFields.concat(
                    Object.values(groupBy(childrenReplyInput, (ch) => ch.replyParentId)).flatMap(
                      (petitionFieldReplies, index) => {
                        return petitionFieldReplies.map((reply) => {
                          return {
                            id: reply.id,
                            content: reply.content,
                            parentReplyId: replies?.[index]?.id,
                          };
                        });
                      },
                    ),
                  );
                },
              );

              if (childrenFields.length) {
                await createPetitionFieldReplies({
                  variables: {
                    petitionId,
                    fields: childrenFields,
                    overwriteExisting: data.overwriteExisting,
                  },
                });
              }

              props.onResolve();
            } else {
              if (groupsWithoutChildren.length) {
                setInvalidGroups(groupsWithoutChildren);
              } else {
                setError("mapping", {
                  type: "no_replies",
                });
              }
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
                    excludePetitions={[petitionId]}
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
          <Stack spacing={4}>
            <Text>
              <FormattedMessage
                id="component.import-replies-dialog.mapping-despcription"
                defaultMessage="Map each field of the current parallel to the corresponding field from the source"
              />
            </Text>
            <FormControl isDisabled={isSubmitting}>
              <Checkbox {...register("overwriteExisting")}>
                <FormattedMessage
                  id="component.import-replies-dialog.checkbox-overwrite-replies"
                  defaultMessage="Overwrite existing replies"
                />
              </Checkbox>
            </FormControl>
            <FormControl isInvalid={!!errors.mapping}>
              <Controller
                name="mapping"
                control={control}
                rules={{ validate: (value) => Object.keys(value).length > 0 }}
                render={({ field: { value, onChange } }) => {
                  return (
                    <MapFieldsTable
                      fields={petitionData?.petition?.fields ?? []}
                      sourcePetitionFields={selectedPetitionFields}
                      overwriteExisting={overwriteExisting}
                      value={value}
                      onChange={(props) => {
                        setInvalidGroups(null);
                        onChange(props);
                      }}
                      maxHeight="400px"
                      isDisabled={isSubmitting}
                      invalidGroups={invalidGroups}
                    />
                  );
                }}
              />
            </FormControl>
          </Stack>
        )
      }
      alternative={
        (isDefined(errors.mapping) || invalidGroups) && currentStep === 1 ? (
          <Text color="red.600" aria-live="polite">
            {invalidGroups ? (
              <FormattedMessage
                id="component.import-replies-dialog.select-replies-import-error-group"
                defaultMessage="Please, select at least one reply to import in each {groupLabel}"
                values={{
                  groupLabel: (
                    <Text as="span" textTransform="lowercase">
                      <FormattedMessage
                        id="generic.petition-field-type-field-group"
                        defaultMessage="Questions group"
                      />
                    </Text>
                  ),
                }}
              />
            ) : (
              <FormattedMessage
                id="component.import-replies-dialog.select-replies-import-error"
                defaultMessage="Please, select at least one reply to import"
              />
            )}
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

const _fragments = {
  get PetitionField() {
    return gql`
      fragment ImportRepliesDialog_PetitionField on PetitionField {
        id
        replies {
          id
          children {
            field {
              id
            }
            replies {
              id
            }
          }
        }
      }
    `;
  },
};

const _queries = [
  gql`
    query ImportRepliesDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        fields {
          ...MapFieldsTable_PetitionField
          ...mapReplyContents_PetitionField
          ...ImportRepliesDialog_PetitionField
        }
      }
    }
    ${mapReplyContents.fragments.PetitionField}
    ${MapFieldsTable.fragments.PetitionField}
    ${_fragments.PetitionField}
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
        field {
          ...ImportRepliesDialog_PetitionField
        }
      }
    }
    ${_fragments.PetitionField}
  `,
];

export function useImportRepliesDialog() {
  return useDialog(ImportRepliesDialog);
}
