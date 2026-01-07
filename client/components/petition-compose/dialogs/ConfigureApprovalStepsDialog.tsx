import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  Center,
  Editable,
  EditableInput,
  EditablePreview,
  FormControl,
  Grid,
  HStack,
  Spinner,
  Stack,
  Text,
  useEditableControls,
} from "@chakra-ui/react";
import {
  ConditionIcon,
  DeleteIcon,
  EditSimpleIcon,
  PlusCircleIcon,
  ThumbsUpIcon,
} from "@parallel/chakra/icons";
import { ApprovalFlowConfigApproverSelect } from "@parallel/components/common/ApprovalFlowConfigApproverSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import {
  ApprovalFlowConfigInput,
  ConfigureApprovalStepsDialog_PetitionBaseFragment,
  ConfigureApprovalStepsDialog_petitionDocument,
} from "@parallel/graphql/__types";
import { Fragments } from "@parallel/utils/apollo/fragments";
import { PetitionFieldLogicCondition } from "@parallel/utils/fieldLogic/types";
import { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, omit } from "remeda";
import { PetitionVisibilityEditor } from "../logic/PetitionVisibilityEditor";

type ConfigureApprovalStepsDialogSteps = {
  LOADING: {
    petitionId: string;
  };
  STEP_1: {
    petition: ConfigureApprovalStepsDialog_PetitionBaseFragment;
  };
};

interface ConfigureApprovalStepsDialogFormData {
  approvals: ApprovalFlowConfigInput[];
}

function ConfigureApprovalStepsLoadingDialog({
  petitionId,
  onStep,
  ...props
}: WizardStepDialogProps<ConfigureApprovalStepsDialogSteps, "LOADING", ApprovalFlowConfigInput[]>) {
  const result = useQuery(ConfigureApprovalStepsDialog_petitionDocument, {
    variables: { petitionId },
  });

  useEffect(() => {
    if (result.dataState === "complete" && isNonNullish(result.data.petition)) {
      onStep("STEP_1", { petition: result.data.petition });
    }
  }, [result, onStep]);

  return (
    <ConfirmDialog
      size="3xl"
      hasCloseButton
      header={
        <HStack>
          <ThumbsUpIcon />
          <Text>
            <FormattedMessage
              id="component.configure-approval-steps-dialog.header"
              defaultMessage="Approval steps"
            />
          </Text>
        </HStack>
      }
      body={
        <Center padding={8} minHeight="200px">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="primary.500"
            size="xl"
          />
        </Center>
      }
      confirm={
        <Button colorScheme="primary" isDisabled>
          <FormattedMessage id="generic.save-changes" defaultMessage="Save changes" />
        </Button>
      }
      {...props}
    />
  );
}

function ConfigureApprovalStepsDialog({
  petition,
  onStep,
  ...props
}: WizardStepDialogProps<ConfigureApprovalStepsDialogSteps, "STEP_1", ApprovalFlowConfigInput[]>) {
  const intl = useIntl();
  const form = useForm<ConfigureApprovalStepsDialogFormData>({
    mode: "onSubmit",
    defaultValues: {
      approvals: petition.approvalFlowConfig?.map((v) => omit(v, ["__typename"])) ?? [],
    },
  });

  const { handleSubmit, control } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "approvals",
  });

  return (
    <ConfirmDialog
      size="3xl"
      hasCloseButton
      closeOnOverlayClick={false}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) => {
            props.onResolve(data.approvals);
          }),
        },
      }}
      header={
        <HStack>
          <ThumbsUpIcon />
          <Text>
            <FormattedMessage
              id="component.configure-approval-steps-dialog.header"
              defaultMessage="Approval steps"
            />
          </Text>
        </HStack>
      }
      body={
        <Stack>
          <Stack marginBottom={2}>
            <Text>
              <FormattedMessage
                id="component.configure-approval-steps-dialog.body"
                defaultMessage="An approval step is activated after completing the form. The parallel cannot be closed until all approval steps have been completed."
              />
            </Text>
            <Box>
              <HelpCenterLink articleId={10559069}>
                <FormattedMessage
                  id="component.configure-approval-steps-dialog.learn-more"
                  defaultMessage="More about approvals"
                />
              </HelpCenterLink>
            </Box>
          </Stack>

          <FormProvider {...form}>
            {isNonNullish(fields) && fields.length > 0 ? (
              <Stack>
                {fields.map(({ id }, index) => {
                  return (
                    <ApprovalCard
                      key={id}
                      index={index}
                      petition={petition}
                      onRemove={() => remove(index)}
                    />
                  );
                })}
              </Stack>
            ) : null}
          </FormProvider>

          {fields.length < 5 ? (
            <Box>
              <Button
                size="sm"
                fontSize="md"
                fontWeight={400}
                leftIcon={<PlusCircleIcon />}
                onClick={() =>
                  append({
                    name: intl.formatMessage(
                      {
                        id: "component.configure-approval-steps-dialog.approval-x",
                        defaultMessage: "Approval {index}",
                      },
                      { index: fields.length + 1 },
                    ),
                    type: "ANY",
                    values: [],
                  })
                }
              >
                <FormattedMessage
                  id="component.configure-approval-steps-dialog.add-approval-button"
                  defaultMessage="Add approval"
                />
              </Button>
            </Box>
          ) : null}
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.save-changes" defaultMessage="Save changes" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfigureApprovalStepsDialog() {
  return useWizardDialog(
    {
      LOADING: ConfigureApprovalStepsLoadingDialog,
      STEP_1: ConfigureApprovalStepsDialog,
    },
    "LOADING",
  );
}

useConfigureApprovalStepsDialog.fragments = {
  PetitionBase: gql`
    fragment ConfigureApprovalStepsDialog_PetitionBase on PetitionBase {
      id
      ...PetitionVisibilityEditor_PetitionBase
      approvalFlowConfig {
        ...Fragments_FullApprovalFlowConfig
      }
      fields {
        id
        ...PetitionVisibilityEditor_PetitionField
      }
      ...ApprovalFlowConfigApproverSelect_PetitionBase
    }
    ${Fragments.FullApprovalFlowConfig}
    ${PetitionVisibilityEditor.fragments.PetitionBase}
    ${PetitionVisibilityEditor.fragments.PetitionField}
    ${ApprovalFlowConfigApproverSelect.fragments.PetitionBase}
  `,
};

const _queries = [
  gql`
    query ConfigureApprovalStepsDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        ...ConfigureApprovalStepsDialog_PetitionBase
      }
    }
    ${useConfigureApprovalStepsDialog.fragments.PetitionBase}
  `,
];

interface ApprovalCardProps {
  index: number;
  petition: ConfigureApprovalStepsDialog_PetitionBaseFragment;
  onRemove: () => void;
}

function ApprovalCard({ index, petition, onRemove }: ApprovalCardProps) {
  const intl = useIntl();
  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<ConfigureApprovalStepsDialogFormData>();
  const _conditions = watch(`approvals.${index}.visibility`);

  const [hasVisibility, setHasVisibility] = useState(isNonNullish(_conditions));
  const handleAddCondition = (value: boolean) => {
    setHasVisibility(value);
    if (!value) {
      setValue(`approvals.${index}.visibility`, undefined);
    }
  };

  const typeOptions = useSimpleSelectOptions((intl) => {
    return [
      {
        value: "ANY",
        label: intl.formatMessage({
          id: "component.configure-approval-steps-dialog.any",
          defaultMessage: "Any of",
        }),
      },
      {
        value: "ALL",
        label: intl.formatMessage({
          id: "component.configure-approval-steps-dialog.all",
          defaultMessage: "All approve",
        }),
      },
    ];
  }, []);

  const validCondition = (c: PetitionFieldLogicCondition) => {
    return "fieldId" in c && isNonNullish(c.fieldId);
  };

  return (
    <Stack
      paddingX={4}
      paddingY={3}
      border="1px solid"
      borderRadius="md"
      borderColor="gray.200"
      backgroundColor="gray.50"
    >
      <Box>
        <FormControl isInvalid={errors.approvals?.[index]?.name ? true : false}>
          <Controller
            name={`approvals.${index}.name`}
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, value } }) => (
              <EditableName value={value} onChange={onChange} />
            )}
          />
        </FormControl>
      </Box>
      <Grid templateColumns="auto 1fr" gap={2}>
        <FormControl isInvalid={errors.approvals?.[index]?.type ? true : false}>
          <Controller
            name={`approvals.${index}.type`}
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, value } }) => (
              <SimpleSelect value={value} onChange={onChange} options={typeOptions} />
            )}
          />
        </FormControl>
        <FormControl isInvalid={errors.approvals?.[index]?.values ? true : false}>
          <Controller
            name={`approvals.${index}.values`}
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, value } }) => (
              <ApprovalFlowConfigApproverSelect
                petition={petition}
                onChange={(v) => onChange(v.map((u) => u.id))}
                value={value}
              />
            )}
          />
        </FormControl>
      </Grid>
      {hasVisibility ? (
        <FormControl>
          <Controller
            name={`approvals.${index}.visibility`}
            control={control}
            rules={{
              validate: (value) => {
                return isNonNullish(value) && value.conditions.every(validCondition);
              },
            }}
            render={({ field: { onChange, value } }) => {
              return (
                <PetitionVisibilityEditor
                  petition={petition}
                  value={value as any}
                  showErrors={errors.approvals?.[index]?.visibility ? true : false}
                  onChange={(v) => {
                    onChange(v as any);
                  }}
                  onRemove={() => {
                    handleAddCondition(false);
                  }}
                  visibilityOn="APPROVAL"
                />
              );
            }}
          />
        </FormControl>
      ) : null}
      <HStack flex="1" justify="flex-end">
        <IconButtonWithTooltip
          size="sm"
          variant="ghost"
          placement="bottom"
          color={hasVisibility ? "primary.500" : undefined}
          icon={<ConditionIcon />}
          label={
            hasVisibility
              ? intl.formatMessage({
                  id: "generic.remove-condition",
                  defaultMessage: "Remove condition",
                })
              : intl.formatMessage({
                  id: "generic.add-condition",
                  defaultMessage: "Add condition",
                })
          }
          onClick={() => handleAddCondition(!hasVisibility)}
        />
        <IconButtonWithTooltip
          size="sm"
          variant="ghost"
          placement="bottom"
          icon={<DeleteIcon />}
          label={intl.formatMessage({
            id: "component.configure-approval-steps-dialog.delete-approval",
            defaultMessage: "Delete approval",
          })}
          onClick={onRemove}
        />
      </HStack>
    </Stack>
  );
}

export function EditableName({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const intl = useIntl();
  const [name, setName] = useState(value);
  const [inputWidth, setInputWidth] = useState(0);
  const previewRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(value);
    setInputWidth(previewRef?.current?.offsetWidth ?? 0);
  }, [value]);

  return (
    <Editable
      value={name}
      onChange={setName}
      onSubmit={onChange}
      display="flex"
      alignItems="center"
      submitOnBlur
      height="36px"
    >
      {name ? (
        <EditablePreview
          paddingY={1}
          paddingX={1.5}
          ref={previewRef}
          borderRadius="md"
          borderWidth="2px"
          borderColor="transparent"
          transitionProperty="border"
          transitionDuration="normal"
          _hover={{
            borderColor: "gray.300",
          }}
          noOfLines={1}
          wordBreak="break-all"
          maxWidth={655}
        />
      ) : null}

      <EditableInput paddingY={1} paddingX={2} minWidth={255} width={inputWidth} />
      <EditableControls
        color={name?.length ? "gray.400" : "red.500"}
        _hover={{ backgroundColor: "gray.50", color: "gray.600" }}
        label={intl.formatMessage({
          id: "generic.edit-name",
          defaultMessage: "Edit name",
        })}
      />
    </Editable>
  );
}

const EditableControls = ({ ...props }) => {
  const { isEditing, getEditButtonProps } = useEditableControls();

  return isEditing ? null : (
    <IconButtonWithTooltip
      label={props.label}
      size="sm"
      background="gray.50"
      fontSize="md"
      icon={<EditSimpleIcon />}
      {...getEditButtonProps()}
      {...props}
    />
  );
};
