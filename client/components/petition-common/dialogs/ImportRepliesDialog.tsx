import { ApolloLink, gql } from "@apollo/client";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  MapFieldsTable,
  excludedFieldsOrigin,
  excludedFieldsTarget,
} from "@parallel/components/common/MapFieldsTable";
import { PetitionSelect, PetitionSelectInstance } from "@parallel/components/common/PetitionSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  WizardStepDialogProps,
  useWizardDialog,
} from "@parallel/components/common/dialogs/WizardDialog";
import {
  CreatePetitionFieldReplyInput,
  ImportRepliesDialog_PetitionFragment,
  ImportRepliesDialog_createPetitionFieldRepliesDocument,
  ImportRepliesDialog_createPetitionFieldRepliesMutation,
  ImportRepliesDialog_petitionDocument,
} from "@parallel/graphql/__types";
import { isReplyContentCompatible, mapReplyContents } from "@parallel/utils/petitionFieldsReplies";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { groupBy, isNonNullish, isNullish, pick } from "remeda";

type ImportRepliesDialogSteps = {
  LOADING: {
    petitionId: string;
  };
  SELECT_SOURCE: {
    petition: ImportRepliesDialog_PetitionFragment;
    sourcePetitionId?: string;
  };
  MAPPING: {
    petition: ImportRepliesDialog_PetitionFragment;
    sourcePetition: ImportRepliesDialog_PetitionFragment;
  };
};

// ================================
// LOADING PETITION STEP
// ================================

function ImportRepliesLoadingDialog({
  petitionId,
  onStep,
  ...props
}: WizardStepDialogProps<ImportRepliesDialogSteps, "LOADING", void>) {
  const intl = useIntl();
  const { data, loading } = useQuery(ImportRepliesDialog_petitionDocument, {
    variables: { petitionId },
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (
      !loading &&
      isNonNullish(data) &&
      isNonNullish(data.petition) &&
      data.petition.__typename === "Petition"
    ) {
      onStep("SELECT_SOURCE", {
        petition: data.petition,
      });
    }
  }, [loading, data, onStep]);

  return (
    <ConfirmDialog
      size="xl"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      header={
        <Flex alignItems="baseline">
          <FormattedMessage
            id="component.import-replies-dialog.title"
            defaultMessage="Import replies"
          />
          <Text marginStart={2} color="gray.600" fontSize="md" fontWeight="400">
            1/2
          </Text>
        </Flex>
      }
      body={
        <FormControl isDisabled>
          <FormLabel fontWeight={400}>
            <FormattedMessage
              id="component.import-replies-dialog.source-petition-label"
              defaultMessage="Select the parallel to import the replies from"
            />
          </FormLabel>
          <Input
            placeholder={intl.formatMessage(
              {
                id: "component.petition-select.placeholder-petition",
                defaultMessage: "Select {isMulti, select, true{parallels} other {a parallel}}",
              },
              {
                isMulti: false,
              },
            )}
          />
        </FormControl>
      }
      confirm={
        <Button colorScheme="primary" isDisabled>
          <FormattedMessage
            id="component.import-replies-dialog.next-button"
            defaultMessage="Next"
          />
        </Button>
      }
      cancel={
        <Button disabled>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      {...props}
    />
  );
}

// ================================
// SELECT SOURCE STEP
// ================================

function ImportRepliesSelectSourceDialog({
  petition,
  sourcePetitionId,
  onStep,
  ...props
}: WizardStepDialogProps<ImportRepliesDialogSteps, "SELECT_SOURCE", void>) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<{
    sourcePetitionId: null | string;
  }>({
    defaultValues: {
      sourcePetitionId: sourcePetitionId ?? null,
    },
  });

  const [getSelectedPetition, { loading: isLoadingSource }] = useLazyQuery(
    ImportRepliesDialog_petitionDocument,
    {
      fetchPolicy: "cache-and-network",
    },
  );

  const petitionSelectorRef = useRef<PetitionSelectInstance<false>>(null);

  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      size="xl"
      initialFocusRef={petitionSelectorRef}
      hasCloseButton
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            if (data.sourcePetitionId) {
              const res = await getSelectedPetition({
                variables: {
                  petitionId: data.sourcePetitionId,
                },
              });
              if (
                isNonNullish(res?.data?.petition) &&
                res.data.petition.__typename === "Petition"
              ) {
                onStep(
                  "MAPPING",
                  {
                    petition,
                    sourcePetition: res.data.petition,
                  },
                  {
                    sourcePetitionId: data.sourcePetitionId,
                  },
                );
              }
            }
          }),
        },
      }}
      header={
        <Flex alignItems="baseline">
          <FormattedMessage
            id="component.import-replies-dialog.title"
            defaultMessage="Import replies"
          />
          <Text marginStart={2} color="gray.600" fontSize="md" fontWeight="400">
            1/2
          </Text>
        </Flex>
      }
      body={
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
                  }}
                  onBlur={onBlur}
                  excludePetitions={[petition.id]}
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
      }
      confirm={
        <Button colorScheme="primary" type="submit" isLoading={isLoadingSource}>
          <FormattedMessage
            id="component.import-replies-dialog.next-button"
            defaultMessage="Next"
          />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onReject("CLOSE")} isDisabled={isLoadingSource}>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      {...props}
    />
  );
}

// ================================
// MAPPING STEP
// ================================

function ImportRepliesMappingDialog({
  petition,
  sourcePetition,
  onStep,
  ...props
}: WizardStepDialogProps<ImportRepliesDialogSteps, "MAPPING", void>) {
  const {
    handleSubmit,
    register,
    control,
    watch,
    formState: { errors },
    setError,
    setValue,
  } = useForm<{
    mapping: Record<string, string>;
    overwriteExisting: boolean;
  }>({
    defaultValues: {
      mapping: {},
      overwriteExisting: false,
    },
  });

  const [invalidGroups, setInvalidGroups] = useState<string[] | null>(null);

  const overwriteExisting = watch("overwriteExisting");

  const [createPetitionFieldReplies, { loading: isSubmitting }] = useMutation(
    ImportRepliesDialog_createPetitionFieldRepliesDocument,
  );

  const petitionFields = petition.fields;
  const sourcePetitionFields = sourcePetition.fields;

  const allFields = useMemo(
    () => petitionFields.flatMap((f) => [f, ...(f.children ?? [])]),
    [petitionFields],
  );

  const allSourcePetitionFields = useMemo(
    () =>
      sourcePetitionFields
        .flatMap((f) => [f, ...(f.children ?? [])])
        .map((f) => ({
          ...f,
          replies: ["ES_TAX_DOCUMENTS", "ID_VERIFICATION"].includes(f.type)
            ? f.replies.filter((r) => isNullish(r.content.error))
            : f.replies,
        })),
    [sourcePetitionFields],
  );

  useEffect(() => {
    const mapping = {} as Record<string, string>;

    const filteredFields = allFields.filter(
      (f) =>
        !excludedFieldsTarget.includes(f.type) &&
        mapping[f.id] === undefined &&
        !f.options.replyOnlyFromProfile,
    );
    const filteredSourceFields = allSourcePetitionFields.filter(
      (f) => !excludedFieldsOrigin.includes(f.type),
    );

    for (const field of filteredFields) {
      const replyIsApproved = field.replies.length === 1 && field.replies[0].status === "APPROVED";

      // Need to check the children's answers to know if the group has an answer, as by default it will always have an empty one.
      const isFieldGroupReplied =
        field.type === "FIELD_GROUP" &&
        !field.multiple &&
        field.replies.some((r) => r.children?.some((ch) => ch.replies.length > 0));

      // We check if the parent is matched, if not we do not try to match the children. We assume that the parent will be matched before the children.
      // TODO: Improve the logic to not rely on assumptions
      const isParentFieldReplied = field.parent?.id !== undefined && !(field.parent.id in mapping);

      const isFieldReplied =
        isParentFieldReplied ||
        isFieldGroupReplied ||
        (field.replies.length > 0 &&
          !field.multiple &&
          field.parent?.id === undefined &&
          field.type !== "FIELD_GROUP") ||
        replyIsApproved;

      if (!isFieldReplied || overwriteExisting) {
        const matchingField =
          filteredSourceFields.find(
            (f) =>
              (isNonNullish(field.alias) && field.alias === f.alias) ||
              (isNonNullish(field.fromPetitionFieldId) &&
                field.fromPetitionFieldId === f.fromPetitionFieldId),
          ) ?? null;

        if (
          matchingField &&
          isReplyContentCompatible(field, matchingField) &&
          isNonNullish(field.parent) === isNonNullish(matchingField.parent)
        ) {
          mapping[field.id] = matchingField.id;
          if (field.parent && matchingField.parent) {
            mapping[field.parent.id] = matchingField.parent.id;
          }
        }
      }
    }
    setValue("mapping", mapping);
  }, [allFields, allSourcePetitionFields, overwriteExisting, setValue]);

  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      size="6xl"
      hasCloseButton
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            const mappedFields = mapReplyContents({
              mapping: data.mapping,
              fields: allFields,
              sourcePetitionFields: allSourcePetitionFields,
              overwriteExisting: data.overwriteExisting,
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
                null as ApolloLink.Result<ImportRepliesDialog_createPetitionFieldRepliesMutation> | null;

              if (mappedFields.fields.length) {
                res = await createPetitionFieldReplies({
                  variables: {
                    petitionId: petition.id,
                    fields: mappedFields.fields.map((data) => pick(data, ["id", "content"])),
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
                    field?.replies.filter((reply) =>
                      reply.children?.every((child) => child.replies.length === 0),
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
                    petitionId: petition.id,
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
          }),
        },
      }}
      header={
        <Flex alignItems="baseline">
          <FormattedMessage
            id="component.import-replies-dialog.title"
            defaultMessage="Import replies"
          />
          <Text marginStart={2} color="gray.600" fontSize="md" fontWeight="400">
            2/2
          </Text>
        </Flex>
      }
      body={
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
                    petition={petition}
                    sourcePetition={sourcePetition}
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
      }
      alternative={
        isNonNullish(errors.mapping) || invalidGroups ? (
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
                        defaultMessage="Group of fields"
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
          <FormattedMessage id="generic.import" defaultMessage="Import" />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onBack()} isDisabled={isSubmitting}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
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
  get Petition() {
    return gql`
      fragment ImportRepliesDialog_Petition on Petition {
        id
        ...MapFieldsTable_PetitionBase
        fields {
          id
          ...mapReplyContents_PetitionField
          ...ImportRepliesDialog_PetitionField
        }
      }
      ${mapReplyContents.fragments.PetitionField}
      ${MapFieldsTable.fragments.PetitionBase}
      ${this.PetitionField}
    `;
  },
};

const _queries = [
  gql`
    query ImportRepliesDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        ...ImportRepliesDialog_Petition
      }
    }
    ${_fragments.Petition}
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
  return useWizardDialog(
    {
      LOADING: ImportRepliesLoadingDialog,
      SELECT_SOURCE: ImportRepliesSelectSourceDialog,
      MAPPING: ImportRepliesMappingDialog,
    },
    "LOADING",
  );
}
