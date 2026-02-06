import { gql } from "@apollo/client";
import {
  Box,
  Checkbox,
  FormControl,
  HStack,
  Input,
  ListItem,
  Stack,
  UnorderedList,
} from "@chakra-ui/react";
import { ThumbsUpIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { LocalFileAttachments } from "@parallel/components/common/LocalFileAttachments";
import { Button, Text } from "@parallel/components/ui";
import { useStartPetitionApprovalFlowDialog_PetitionApprovalRequestStepFragment } from "@parallel/graphql/__types";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface StartPetitionApprovalFlowDialogProps {
  step: useStartPetitionApprovalFlowDialog_PetitionApprovalRequestStepFragment;
}

interface StartPetitionApprovalFlowDialogData {
  message?: string | null;
  attachments?: File[];
}
export function StartPetitionApprovalFlowDialog({
  step,
  ...props
}: DialogProps<StartPetitionApprovalFlowDialogProps, StartPetitionApprovalFlowDialogData>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
    watch,
  } = useForm<{ includeInformation: boolean; message: string | null; attachments: File[] }>({
    mode: "onChange",
    defaultValues: {
      includeInformation: false,
      message: null,
      attachments: [],
    },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const includeInformation = watch("includeInformation");

  return (
    <ConfirmDialog
      size="xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            if (data.includeInformation) {
              props.onResolve({ message: data.message, attachments: data.attachments });
            } else {
              props.onResolve({});
            }
          }),
        },
      }}
      header={
        <HStack>
          <ThumbsUpIcon />
          <Text as="span">
            <FormattedMessage
              id="component.start-petition-approval-flow-dialog.header"
              defaultMessage="Request approval"
            />
          </Text>
        </HStack>
      }
      body={
        step.approvers.length === 0 ? (
          <Stack>
            <Text>
              <FormattedMessage
                id="component.start-petition-approval-flow-dialog.body-no-approvers"
                defaultMessage="There are no assigned approvers for this request. You can still start it, but it will not be sent to any user."
              />
            </Text>
          </Stack>
        ) : (
          <Stack>
            <Text>
              <FormattedMessage
                id="component.start-petition-approval-flow-dialog.body"
                defaultMessage="The request for approval with an access to this parallel will be sent to the following users:"
              />
            </Text>
            <UnorderedList paddingStart={3}>
              {step.approvers.map(({ user }, index) => {
                return user ? (
                  <ListItem key={index} fontWeight={500}>
                    {`${user.fullName} (${user.email})`}
                  </ListItem>
                ) : null;
              })}
            </UnorderedList>
            <FormControl>
              <Checkbox {...register("includeInformation")}>
                <FormattedMessage
                  id="component.start-petition-approval-flow-dialog.checkbox-include-information"
                  defaultMessage="Add additional information"
                />
              </Checkbox>
            </FormControl>
            {includeInformation ? (
              <>
                <FormControl isInvalid={!!errors.message}>
                  <GrowingTextarea
                    placeholder={intl.formatMessage({
                      id: "component.start-petition-approval-flow-dialog.message-placeholder",
                      defaultMessage: "Write a message to be included in the email",
                    })}
                    {...register("message", { required: true })}
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
                              id="component.start-petition-approval-flow-dialog.upload-documents"
                              defaultMessage="Upload documents"
                            />
                          </Button>
                        </Box>
                      </Stack>
                    )}
                  />
                </FormControl>
              </>
            ) : null}
          </Stack>
        )
      }
      confirm={
        step.approvers.length === 0 ? (
          <Button type="submit" colorPalette="primary">
            <FormattedMessage id="generic.send-anyway" defaultMessage="Send anyway" />
          </Button>
        ) : (
          <Button type="submit" colorPalette="primary">
            <FormattedMessage id="generic.send" defaultMessage="Send" />
          </Button>
        )
      }
      {...props}
    />
  );
}

export function useStartPetitionApprovalFlowDialog() {
  return useDialog(StartPetitionApprovalFlowDialog);
}

const _fragments = {
  User: gql`
    fragment useStartPetitionApprovalFlowDialog_User on User {
      id
      fullName
      email
    }
  `,
  PetitionApprovalRequestStep: gql`
    fragment useStartPetitionApprovalFlowDialog_PetitionApprovalRequestStep on PetitionApprovalRequestStep {
      id
      approvers {
        id
        user {
          id
          ...useStartPetitionApprovalFlowDialog_User
        }
      }
    }
  `,
};
