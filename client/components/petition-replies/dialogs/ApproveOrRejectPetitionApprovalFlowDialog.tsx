import {
  ButtonGroup,
  FormControl,
  Input,
  layoutPropNames,
  Radio,
  RadioGroup,
  RadioProps,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import { ThumbsDownIcon, ThumbsUpIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { LocalFileAttachments } from "@parallel/components/common/LocalFileAttachments";
import { Box, Button, HStack, Stack, Text } from "@parallel/components/ui";
import { PetitionApprovalRequestStepRejectionType } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, pick } from "remeda";
import { assert } from "ts-essentials";

export type ApproveOrRejectAction = "APPROVE" | "REJECT";

interface ApproveOrRejectPetitionApprovalFlowDialogProps {
  stepName: string;
  action: ApproveOrRejectAction;
}

interface ApproveOrRejectPetitionApprovalFlowDialogData {
  message: string;
  action: ApproveOrRejectAction;
  attachments: File[];
  rejectionType: PetitionApprovalRequestStepRejectionType;
}

export function ApproveOrRejectPetitionApprovalFlowDialog({
  action,
  stepName,
  ...props
}: DialogProps<
  ApproveOrRejectPetitionApprovalFlowDialogProps,
  ApproveOrRejectPetitionApprovalFlowDialogData
>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    watch,
  } = useForm<{
    action: ApproveOrRejectAction;
    message: string | null;
    attachments: File[];
    rejectionType: PetitionApprovalRequestStepRejectionType;
  }>({
    mode: "onChange",
    defaultValues: {
      action,
      message: null,
      attachments: [],
      rejectionType: "TEMPORARY",
    },
  });

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const radioRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const _action = watch("action");

  const textAreaRegisterProps = useRegisterWithRef(textAreaRef, register, "message", {
    required: true,
  });

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={action === "APPROVE" ? textAreaRef : radioRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            assert(isNonNullish(data.message), "Approval message is required");
            assert(isNonNullish(data.action), "Approval action is required");

            props.onResolve({
              action: data.action,
              message: data.message,
              attachments: data.attachments,
              rejectionType: data.rejectionType,
            });
          }),
        },
      }}
      header={<Text>{stepName}</Text>}
      body={
        <Stack>
          <FormControl isInvalid={!!errors.action}>
            <Controller
              name="action"
              control={control}
              render={({ field: { value, onChange } }) => (
                <ApproveOrRejectRadio value={value} onChange={onChange} />
              )}
            />
          </FormControl>
          {_action === "REJECT" ? (
            <FormControl isInvalid={!!errors.rejectionType}>
              <Controller
                name="rejectionType"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <RadioGroup
                    as={HStack}
                    gap={4}
                    onChange={(value) =>
                      onChange(value as PetitionApprovalRequestStepRejectionType)
                    }
                    value={value}
                  >
                    <Radio ref={radioRef} value="TEMPORARY">
                      <Text>
                        <FormattedMessage
                          id="component.approve-or-reject-petition-approval-flow-dialog.request-changes"
                          defaultMessage="Request changes"
                        />
                      </Text>
                    </Radio>
                    <Radio value="DEFINITIVE">
                      <HStack gap={0}>
                        <Text>
                          <FormattedMessage
                            id="component.approve-or-reject-petition-approval-flow-dialog.final-rejection"
                            defaultMessage="Final rejection"
                          />
                        </Text>
                        <HelpPopover>
                          <FormattedMessage
                            id="component.approve-or-reject-petition-approval-flow-dialog.final-rejection-help"
                            defaultMessage="With the final rejection, no further progress can be made in the process."
                          />
                        </HelpPopover>
                      </HStack>
                    </Radio>
                  </RadioGroup>
                )}
              />
            </FormControl>
          ) : null}

          <FormControl isInvalid={!!errors.message}>
            <GrowingTextarea
              placeholder={intl.formatMessage({
                id: "component.approve-or-reject-petition-approval-flow-dialog.message-placeholder",
                defaultMessage: "Write a message with your assessment",
              })}
              {...textAreaRegisterProps}
            />
          </FormControl>
          <FormControl isInvalid={!!errors.attachments}>
            <Controller
              name="attachments"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Stack>
                  {value?.length ? (
                    <LocalFileAttachments
                      files={value}
                      onRemoveFile={(file) => onChange(value.filter((f) => f !== file))}
                    />
                  ) : null}

                  <Box>
                    <Input
                      ref={fileInputRef}
                      id="file-input"
                      type="file"
                      multiple
                      hidden
                      accept="application/pdf"
                      onChange={(event) => {
                        const files = event.target.files;
                        if (files) {
                          onChange([...(value ?? []), ...Array.from(files)]);
                          //Reset the input value to allow uploading the same file again if removed
                          event.target.value = "";
                          event.target.files = null;
                        }
                      }}
                    />

                    <Button
                      size="sm"
                      fontSize="md"
                      fontWeight={500}
                      onClick={() => fileInputRef?.current?.click()}
                    >
                      <FormattedMessage
                        id="component.approve-or-reject-petition-approval-flow-dialog.upload-documents"
                        defaultMessage="Upload documents"
                      />
                    </Button>
                  </Box>
                </Stack>
              )}
            />
          </FormControl>
          <Text>
            <FormattedMessage
              id="component.approve-or-reject-petition-approval-flow-dialog.cannot-undo"
              defaultMessage="Once confirmed, the action cannot be undone."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button type="submit" colorPalette="primary">
          <FormattedMessage
            id="component.approve-or-reject-petition-approval-flow-dialog.confirm-submit"
            defaultMessage="Confirm and submit"
          />
        </Button>
      }
      {...props}
    />
  );
}
interface ApproveOrRejectRadioProps {
  onChange: (value: string) => void;
  value: ApproveOrRejectAction;
}

export const ApproveOrRejectRadio = chakraComponent<"div", ApproveOrRejectRadioProps>(
  function ApproveOrRejectRadio({ ref, onChange, value, ...props }) {
    const { getRootProps, getRadioProps } = useRadioGroup({
      name: "action",
      value,
      onChange,
    });

    return (
      <HStack ref={ref} {...props} paddingBottom={2}>
        <ButtonGroup variant="outline" {...getRootProps()}>
          <ApprovalRadioButton
            isReject={false}
            {...(getRadioProps({ value: "APPROVE" }) as RadioProps)}
          >
            <FormattedMessage id="generic.approve" defaultMessage="Approve" />
          </ApprovalRadioButton>
          <ApprovalRadioButton
            isReject={true}
            {...(getRadioProps({ value: "REJECT" }) as RadioProps)}
          >
            <FormattedMessage id="generic.reject" defaultMessage="Reject" />
          </ApprovalRadioButton>
        </ButtonGroup>
      </HStack>
    );
  },
);

interface ApprovalRadioButtonProps extends RadioProps {
  isReject: boolean;
}

export function ApprovalRadioButton({ isReject, ...props }: ApprovalRadioButtonProps) {
  const rootProps = pick(props, layoutPropNames as any);
  const { getInputProps, getRadioProps } = useRadio(props);

  const inputProps = getInputProps();
  const radioProps = getRadioProps();

  return (
    <Button
      leftIcon={isReject ? <ThumbsDownIcon /> : <ThumbsUpIcon />}
      as="label"
      variant="solid"
      htmlFor={inputProps.id}
      cursor="pointer"
      colorPalette={inputProps.checked ? (isReject ? "red" : "green") : undefined}
      {...radioProps}
      {...(rootProps as any)}
    >
      <input {...inputProps} />
      {props.children}
    </Button>
  );
}

export function useApproveOrRejectPetitionApprovalFlowDialog() {
  return useDialog(ApproveOrRejectPetitionApprovalFlowDialog);
}
