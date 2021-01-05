import {
  Box,
  BoxProps,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  Input,
  List,
  ListItem,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment,
  RecipientViewPetitionField_PublicPetitionFieldFragment,
  useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation,
} from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { useCreateSimpleReply, useDeletePetitionReply } from "./mutations";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplySavingIndicator } from "./RecipientViewPetitionFieldReplySavingIndicator";

export interface RecipientViewPetitionFieldTextProps
  extends Omit<RecipientViewPetitionFieldCardProps, "children"> {
  keycode: string;
  isDisabled: boolean;
}

export const RecipientViewPetitionFieldText = chakraForwardRef<
  "section",
  RecipientViewPetitionFieldTextProps
>(function RecipientViewPetitionFieldText(
  {
    keycode,
    access,
    field,
    isDisabled,
    isInvalid,
    hasCommentsEnabled,
    ...props
  },
  ref
) {
  const deletePetitionReply = useDeletePetitionReply();
  const createSimpleReply = useCreateSimpleReply();
  return (
    <RecipientViewPetitionFieldCard
      ref={ref}
      keycode={keycode}
      access={access}
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      {...props}
    >
      {field.replies.length ? (
        <List as={Stack} marginTop={1}>
          {field.replies.map((reply) => (
            <ListItem key={reply.id}>
              <RecipientViewPetitionFieldReplyText
                keycode={keycode}
                reply={reply}
                options={field.options as FieldOptions["TEXT"]}
                onRemove={() =>
                  deletePetitionReply({
                    keycode,
                    fieldId: field.id,
                    replyId: reply.id,
                  })
                }
              />
            </ListItem>
          ))}
        </List>
      ) : null}
      <Box marginTop={2}>
        <TextReplyForm
          canReply={!isDisabled}
          field={field}
          onCreateReply={(content) =>
            createSimpleReply({
              keycode,
              fieldId: field.id,
              content,
            })
          }
        />
      </Box>
    </RecipientViewPetitionFieldCard>
  );
});

interface RecipientViewPetitionFieldReplyTextProps {
  keycode: string;
  options: FieldOptions["TEXT"];
  reply: RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
  onRemove: () => void;
}

export function RecipientViewPetitionFieldReplyText({
  keycode,
  options,
  reply,
  onRemove,
}: RecipientViewPetitionFieldReplyTextProps) {
  const intl = useIntl();
  const [
    updateReply,
    { loading: isUpdating },
  ] = useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation();
  const [value, setValue] = useState(reply.content.text);
  const debouncedUpdateReply = useDebouncedCallback(
    async (value: string) =>
      await updateReply({
        variables: { keycode, replyId: reply.id, reply: value },
      }),
    1000,
    [updateReply, keycode, reply.id]
  );
  const props = {
    paddingRight: 10,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(event.target.value);
      debouncedUpdateReply(event.target.value);
    },
    onBlur: () => debouncedUpdateReply.immediateIfPending(value),
    placeholder:
      options.placeholder ??
      intl.formatMessage({
        id: "component.recipient-view-petition-field-reply.text-placeholder",
        defaultMessage: "Enter your answer",
      }),
  };
  return (
    <Stack direction="row">
      <Flex flex="1" position="relative">
        {options.multiline ? (
          <GrowingTextarea {...props} />
        ) : (
          <Input {...props} />
        )}
        <Center boxSize={10} position="absolute" right={0} bottom={0}>
          <RecipientViewPetitionFieldReplySavingIndicator
            isSaving={isUpdating}
            reply={reply}
          />
        </Center>
      </Flex>
      <IconButtonWithTooltip
        onClick={onRemove}
        variant="ghost"
        icon={<DeleteIcon />}
        size="md"
        placement="bottom"
        label={intl.formatMessage({
          id:
            "component.recipient-view-petition-field-reply.remove-reply-label",
          defaultMessage: "Remove reply",
        })}
      />
    </Stack>
  );
}

interface TextReplyFormProps extends BoxProps {
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  canReply: boolean;
  onCreateReply: (content: string) => void;
}

function TextReplyForm({
  field,
  canReply,
  onCreateReply,
  ...props
}: TextReplyFormProps) {
  const intl = useIntl();
  const { placeholder, multiline } = field.options as FieldOptions["TEXT"];
  const { handleSubmit, register, reset, errors } = useForm<{
    content: string;
  }>({ mode: "onSubmit" });
  const disabled = !field.multiple && field.replies.length > 0;
  return (
    <Flex
      as="form"
      flexDirection={{ base: "column", sm: "row" }}
      onSubmit={handleSubmit(({ content }) => {
        onCreateReply(content);
        setTimeout(() => reset({ content: "" }));
      })}
      {...props}
    >
      <FormControl flex="1" isInvalid={!!errors.content} isDisabled={disabled}>
        {multiline ? (
          <Textarea
            isDisabled={!canReply}
            name="content"
            ref={register({
              required: true,
              validate: (val) => val.trim().length > 0,
            })}
            placeholder={
              placeholder ??
              intl.formatMessage({
                id: "recipient-view.text-placeholder",
                defaultMessage: "Enter your answer",
              })
            }
          />
        ) : (
          <Input
            name="content"
            isDisabled={!canReply}
            ref={register({
              required: true,
              validate: (val) => val.trim().length > 0,
            })}
            placeholder={
              placeholder ??
              intl.formatMessage({
                id: "recipient-view.text-placeholder",
                defaultMessage: "Enter your answer",
              })
            }
          />
        )}
        {errors.content && (
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.required-field-error"
              defaultMessage="A value is required"
            />
          </FormErrorMessage>
        )}
      </FormControl>
      <Button
        type="submit"
        variant="outline"
        isDisabled={disabled || !canReply}
        marginTop={{ base: 2, sm: 0 }}
        marginLeft={{ base: 0, sm: 4 }}
      >
        <FormattedMessage id="generic.save" defaultMessage="Save" />
      </Button>
    </Flex>
  );
}
