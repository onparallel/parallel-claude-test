import { Center, Flex, Input, List, ListItem, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment } from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import {
  ChangeEvent,
  forwardRef,
  KeyboardEvent,
  useRef,
  useState,
} from "react";
import { useIntl } from "react-intl";
import { pick } from "remeda";
import {
  useCreateSimpleReply,
  useDeletePetitionReply,
  useUpdateSimpleReply,
} from "./mutations";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

type AnyInputElement = HTMLInputElement | HTMLTextAreaElement;

export interface RecipientViewPetitionFieldTextProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  petitionId: string;
  isDisabled: boolean;
}

export const RecipientViewPetitionFieldText = chakraForwardRef<
  "section",
  RecipientViewPetitionFieldTextProps
>(function RecipientViewPetitionFieldText(
  {
    petitionId,
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
  const intl = useIntl();

  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const newReplyRef = useRef<AnyInputElement>(null);
  const replyRefs = useMultipleRefs<AnyInputElement>();

  const options = field.options as FieldOptions["TEXT"];

  const updateSimpleReply = useUpdateSimpleReply();
  const handleUpdate = useMemoFactory(
    (replyId: string) => async (content: string) => {
      await updateSimpleReply({ petitionId, replyId, keycode, content });
    },
    [keycode, updateSimpleReply]
  );
  const deleteReply = useDeletePetitionReply();
  const handleDelete = useMemoFactory(
    (replyId: string) => async (focusPrev?: boolean) => {
      await deleteReply({ petitionId, fieldId: field.id, replyId, keycode });
      if (focusPrev) {
        const index = field.replies.findIndex((r) => r.id === replyId);
        if (index > 0) {
          const prevId = field.replies[index - 1].id;
          replyRefs[prevId].current!.focus();
        }
      }
      if (field.replies.length === 1) {
        handleAddNewReply();
      }
    },
    [keycode, field.id, field.replies, deleteReply]
  );

  const createSimpleReply = useCreateSimpleReply();
  const debouncedOnChange = useDebouncedCallback(
    async (content: string) => {
      if (!content) {
        return;
      }
      setIsSaving(true);
      try {
        const reply = await createSimpleReply({
          petitionId,
          keycode,
          fieldId: field.id,
          content,
        });
        if (reply) {
          const selection = pick(newReplyRef.current!, [
            "selectionStart",
            "selectionEnd",
          ]);
          setShowNewReply(false);
          setValue("");
          setTimeout(() => {
            const newReplyElement = replyRefs[reply.id].current!;
            if (newReplyElement) {
              Object.assign(newReplyElement, selection);
              newReplyElement.focus();
            }
          });
        }
      } catch {}
      setIsSaving(false);
    },
    1000,
    [keycode, field.id, createSimpleReply]
  );

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => newReplyRef.current!.focus());
  }

  const inputProps = {
    id: `reply-${field.id}-new`,
    ref: newReplyRef as any,
    paddingRight: 10,
    isDisabled: isDisabled,
    value,
    onKeyDown: async (event: KeyboardEvent) => {
      switch (event.key) {
        case "Enter": {
          if (field.multiple && event.metaKey) {
            await debouncedOnChange.immediate(value);
            handleAddNewReply();
          }
          break;
        }
        case "Backspace": {
          if (value === "") {
            if (field.replies.length > 0) {
              event.preventDefault();
              setShowNewReply(false);
              const lastReplyId = field.replies[field.replies.length - 1].id;
              replyRefs[lastReplyId].current!.focus();
            }
          }
          break;
        }
      }
    },
    onBlur: () => {
      if (!value && field.replies.length > 0) {
        setShowNewReply(false);
      }
    },
    onChange: (event: ChangeEvent<AnyInputElement>) => {
      setValue(event.target.value);
      debouncedOnChange(event.target.value);
    },
    placeholder:
      options.placeholder ??
      intl.formatMessage({
        id: "component.recipient-view-petition-field-reply.text-placeholder",
        defaultMessage: "Enter your answer",
      }),
  };
  return (
    <RecipientViewPetitionFieldCard
      ref={ref}
      keycode={keycode}
      access={access}
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      showAddNewReply={!isDisabled && !showNewReply && field.multiple}
      onAddNewReply={handleAddNewReply}
      {...props}
    >
      {field.replies.length ? (
        <List as={Stack} marginTop={2}>
          {field.replies.map((reply) => (
            <ListItem key={reply.id}>
              <RecipientViewPetitionFieldReplyText
                ref={replyRefs[reply.id]}
                field={field}
                reply={reply}
                isDisabled={isDisabled}
                onUpdate={handleUpdate(reply.id)}
                onDelete={handleDelete(reply.id)}
                onAddNewReply={handleAddNewReply}
              />
            </ListItem>
          ))}
        </List>
      ) : null}
      {showNewReply ? (
        <Flex flex="1" position="relative" marginTop={2}>
          {field.options.multiline ? (
            <GrowingTextarea {...inputProps} />
          ) : (
            <Input {...inputProps} />
          )}
          <Center boxSize={10} position="absolute" right={0} bottom={0}>
            <RecipientViewPetitionFieldReplyStatusIndicator
              isSaving={isSaving}
            />
          </Center>
        </Flex>
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
});

interface RecipientViewPetitionFieldReplyTextProps {
  field: RecipientViewPetitionFieldTextProps["field"];
  reply: RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
  isDisabled: boolean;
  onUpdate: (content: string) => Promise<void>;
  onDelete: (focusPrev?: boolean) => void;
  onAddNewReply: () => void;
}

export const RecipientViewPetitionFieldReplyText = forwardRef<
  AnyInputElement,
  RecipientViewPetitionFieldReplyTextProps
>(function RecipientViewPetitionFieldReplyText(
  { field, reply, isDisabled, onUpdate, onDelete, onAddNewReply },
  ref
) {
  const intl = useIntl();
  const [value, setValue] = useState(reply.content.text ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const options = field.options as FieldOptions["TEXT"];
  const debouncedUpdateReply = useDebouncedCallback(
    async (value: string) => {
      setIsSaving(true);
      try {
        await onUpdate(value.trim());
      } catch {}
      setIsSaving(false);
    },
    1000,
    [onUpdate]
  );
  const props = {
    id: `reply-${field.id}-${reply.id}`,
    ref: ref as any,
    paddingRight: 10,
    value,
    isDisabled: isDisabled || reply.status === "APPROVED",
    isInvalid: reply.status === "REJECTED",
    onKeyDown: async (event: KeyboardEvent) => {
      switch (event.key) {
        case "Enter": {
          if (field.multiple && event.metaKey) {
            await debouncedUpdateReply.immediate(value);
            onAddNewReply();
          }
          break;
        }
        case "Backspace": {
          if (value === "") {
            event.preventDefault();
            debouncedUpdateReply.clear();
            onDelete(true);
          }
          break;
        }
      }
    },
    onBlur: async () => {
      await debouncedUpdateReply.immediateIfPending(value);
    },
    onChange: (event: ChangeEvent<AnyInputElement>) => {
      setValue(event.target.value);
      debouncedUpdateReply(event.target.value);
    },
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
          <RecipientViewPetitionFieldReplyStatusIndicator
            isSaving={isSaving}
            reply={reply}
          />
        </Center>
      </Flex>
      <IconButtonWithTooltip
        isDisabled={isDisabled || reply.status === "APPROVED"}
        onClick={() => onDelete()}
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
});
