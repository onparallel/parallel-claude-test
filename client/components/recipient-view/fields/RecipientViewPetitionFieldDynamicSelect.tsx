import { Box, Center, Flex, FormControl, FormLabel, List, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SimpleSelect, toSimpleSelectOption } from "@parallel/components/common/SimpleSelect";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { DynamicSelectOption, FieldOptions } from "@parallel/utils/petitionFields";
import { Maybe } from "@parallel/utils/types";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SelectInstance as _SelectInstance } from "react-select";
import { countBy } from "remeda";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
  RecipientViewPetitionFieldCard_PetitionFieldReplySelection,
  RecipientViewPetitionFieldCard_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export type DynamicSelectValue = [string, Maybe<string>][];

export interface RecipientViewPetitionFieldDynamicSelectProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (reply: string) => void;
  onUpdateReply: (replyId: string, value: DynamicSelectValue) => void;
  onCreateReply: (value: DynamicSelectValue) => Promise<string | undefined>;
}

type SelectInstance = _SelectInstance<{ label: string; value: string }, false, never>;

export function RecipientViewPetitionFieldDynamicSelect({
  field,
  isDisabled,
  isInvalid,
  onDownloadAttachment,
  onDeleteReply,
  onUpdateReply,
  onCreateReply,
  onCommentsButtonClick,
}: RecipientViewPetitionFieldDynamicSelectProps) {
  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const replyRefs = useMultipleRefs<RecipientViewPetitionFieldReplyDynamicSelectInstance>();

  const fieldOptions = field.options as FieldOptions["DYNAMIC_SELECT"];

  const handleUpdate = useMemoFactory(
    (replyId: string) => async (value: DynamicSelectValue) => {
      await onUpdateReply(replyId, value);
    },
    [onUpdateReply]
  );

  const handleDelete = useMemoFactory(
    (replyId: string) => async () => {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
      if (field.replies.length === 1) {
        setShowNewReply(true);
      }
    },
    [field.replies, onDeleteReply]
  );

  async function handleCreateReply(value: string) {
    const _value = fieldOptions.labels.map((label, i) => [
      label,
      i === 0 ? value : null,
    ]) as DynamicSelectValue;
    const replyId = await onCreateReply(_value);
    if (replyId) {
      setShowNewReply(false);
      setTimeout(() => {
        const instance = replyRefs[replyId].current!;
        instance.focus(1);
      });
    }
  }

  function handleAddNewReply() {
    setShowNewReply(true);
  }

  const showAddNewReply = !isDisabled && field.multiple;

  return (
    <RecipientViewPetitionFieldCard
      field={field}
      isInvalid={isInvalid}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={showAddNewReply}
      addNewReplyIsDisabled={
        showNewReply || completedFieldReplies(field).length !== field.replies.length
      }
      onAddNewReply={handleAddNewReply}
      onDownloadAttachment={onDownloadAttachment}
    >
      {field.replies.length ? (
        <List as={Stack} marginTop={1} spacing={8}>
          <AnimatePresence initial={false}>
            {field.replies.map((reply) => (
              <motion.li
                key={reply.id}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <RecipientViewPetitionFieldReplyDynamicSelect
                  ref={replyRefs[reply.id]}
                  field={field}
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id] || reply.isAnonymized}
                  onDelete={handleDelete(reply.id)}
                  onChange={handleUpdate(reply.id)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      {(showNewReply && field.multiple) || field.replies.length === 0 ? (
        <Box marginTop={field.replies.length ? 8 : 1}>
          <RecipientViewPetitionFieldReplyDynamicSelectLevel
            label={fieldOptions.labels[0]}
            field={field}
            level={0}
            onChange={handleCreateReply}
          />
        </Box>
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}
interface RecipientViewPetitionFieldReplyDynamicSelectProps {
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldCard_PetitionFieldReplySelection;
  isDisabled?: boolean;
  onChange: (content: [string, string | null][]) => Promise<void>;
  onDelete: () => void;
}

type RecipientViewPetitionFieldReplyDynamicSelectInstance = {
  focus: (level?: number) => void;
};

const RecipientViewPetitionFieldReplyDynamicSelect = forwardRef<
  RecipientViewPetitionFieldReplyDynamicSelectInstance,
  RecipientViewPetitionFieldReplyDynamicSelectProps
>(function RecipientViewPetitionFieldReplyDynamicSelect(
  { field, reply, isDisabled, onChange, onDelete },
  ref
) {
  const fieldOptions = field.options as FieldOptions["DYNAMIC_SELECT"];
  const refs = useMultipleRefs<SelectInstance>();
  useImperativeHandle(
    ref,
    () => ({
      focus(level?: number) {
        refs[level ?? 0].current?.focus();
      },
    }),
    []
  );

  async function handleChange(value: string, level: number) {
    const current = reply.content.value as [string, string][];
    if (current[level][1] === value) {
      return;
    }
    await onChange(
      current.map((p, i) => (i === level ? [p[0], value] : i >= level ? [p[0], null] : p))
    );
    if (level < fieldOptions.labels.length - 1) {
      setTimeout(() => {
        refs[level + 1].current?.focus();
      });
    }
  }

  const repliedLabelsCount =
    reply && !reply.isAnonymized
      ? countBy(reply.content.value as [string, string | null][], ([, value]) => value !== null)
      : 0;

  const options = (
    !reply.isAnonymized
      ? (reply?.content.value as string[][])
      : fieldOptions.labels.map((label) => [label, null])
  ) as [string, string | null][];

  return (
    <Stack>
      {options.slice(0, repliedLabelsCount + 1).map(([label], level) => (
        <RecipientViewPetitionFieldReplyDynamicSelectLevel
          key={level}
          ref={refs[level]}
          label={label}
          level={level}
          field={field}
          reply={reply}
          isDisabled={isDisabled}
          onChange={(value) => handleChange(value, level)}
          onDeleteReply={onDelete}
        />
      ))}
    </Stack>
  );
});

interface RecipientViewPetitionFieldReplyDynamicSelectLevelProps {
  label: string;
  level: number;
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  reply?: RecipientViewPetitionFieldCard_PetitionFieldReplySelection;
  isDisabled?: boolean;
  onChange: (value: string) => Promise<void>;
  onDeleteReply?: () => void;
}

const RecipientViewPetitionFieldReplyDynamicSelectLevel = forwardRef<
  SelectInstance,
  RecipientViewPetitionFieldReplyDynamicSelectLevelProps
>(function RecipientViewPetitionFieldReplyDynamicSelectLevel(
  {
    label,
    level,
    field,
    reply,
    isDisabled,
    onChange,
    onDeleteReply,
  }: RecipientViewPetitionFieldReplyDynamicSelectLevelProps,
  ref
) {
  const intl = useIntl();
  const fieldOptions = field.options as FieldOptions["DYNAMIC_SELECT"];
  const [optimistic, setOptimistic] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const options = useMemo(() => {
    let values: string[] | DynamicSelectOption[] = fieldOptions.values;

    const replies = (reply?.content.value as [string, string][]) ?? [];
    for (let i = 0; i < level; ++i) {
      values =
        (values as DynamicSelectOption[]).find(([label]) => label === replies[i][1])?.[1] ?? [];
    }
    return (
      Array.isArray(values[0])
        ? (values as DynamicSelectOption[]).map(([label]) => label)
        : (values as string[])
    ).map((value) => toSimpleSelectOption(value)!);
  }, [fieldOptions, reply?.content.value, level]);

  const id = `reply-${field.id}-${reply?.id ? `${reply.id}-${level}` : "new"}`;

  return (
    <FormControl id={id} isDisabled={isDisabled}>
      <FormLabel>{label}</FormLabel>
      <Flex alignItems="center">
        <Box flex="1" position="relative">
          <SimpleSelect
            ref={ref as any}
            id={id}
            isDisabled={
              (isDisabled ||
                reply?.status === "APPROVED" ||
                // if the user modified the labels on the field settings
                // and the recipient tries to update an option with outdated labels, backend will throw error.
                // so we disable the outdated selectors to avoid throwing error
                (reply && reply.content.value[level][0] !== field.options.labels[level])) ??
              false
            }
            isInvalid={reply?.status === "REJECTED"}
            value={
              optimistic
                ? toSimpleSelectOption(optimistic)
                : (reply && !reply.isAnonymized && reply.content.value[level][1]) ?? null
            }
            options={options}
            onChange={async (option) => {
              setIsSaving(true);
              if (option) {
                setOptimistic(option);
                await onChange(option);
                setOptimistic(null);
              }
              setIsSaving(false);
            }}
            placeholder={
              reply?.isAnonymized ? (
                <FormattedMessage
                  id="generic.reply-not-available"
                  defaultMessage="Reply not available"
                />
              ) : (
                <FormattedMessage id="generic.select-an-option" defaultMessage="Select an option" />
              )
            }
            styles={{
              menu: (styles) => ({ ...styles, zIndex: 100 }),
              valueContainer: (styles) => ({ ...styles, paddingRight: 32 }),
              placeholder: (base) => ({
                ...base,
                fontStyle: reply?.isAnonymized ? "italic" : "normal",
              }),
            }}
          />
          {reply && (
            <Center height="100%" position="absolute" right="42px" top={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} reply={reply} />
            </Center>
          )}
        </Box>
        {reply &&
          (level === 0 ? (
            <IconButtonWithTooltip
              marginLeft={2}
              isDisabled={isDisabled || !reply || reply.status === "APPROVED"}
              onClick={() => onDeleteReply?.()}
              variant="ghost"
              icon={<DeleteIcon />}
              size="md"
              placement="bottom"
              label={intl.formatMessage({
                id: "component.recipient-view-petition-field-reply.remove-reply-label",
                defaultMessage: "Remove reply",
              })}
            />
          ) : (
            <Box width="40px" marginLeft={2} />
          ))}
      </Flex>
    </FormControl>
  );
});
