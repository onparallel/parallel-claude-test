import { Box, Center, Flex, FormControl, FormLabel, List, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SimpleSelect, toSimpleSelectOption } from "@parallel/components/common/SimpleSelect";
import { Text } from "@parallel/components/ui";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { DynamicSelectOption, FieldOptions } from "@parallel/utils/fieldOptions";
import { Maybe } from "@parallel/utils/types";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import { RefAttributes, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SelectInstance as _SelectInstance } from "react-select";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
  RecipientViewPetitionFieldLayout_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";
export type DynamicSelectValue = [string, Maybe<string>][];

export interface RecipientViewPetitionFieldDynamicSelectProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (reply: string) => void;
  onUpdateReply: (replyId: string, content: { value: DynamicSelectValue }) => Promise<void>;
  onCreateReply: (content: { value: DynamicSelectValue }) => Promise<string | undefined>;
  onError: (error: any) => void;
  isInvalid?: boolean;
  parentReplyId?: string;
}

type SelectInstance = _SelectInstance<{ label: string; value: string }, false, never>;

export function RecipientViewPetitionFieldDynamicSelect({
  field,
  isDisabled,
  onDownloadAttachment,
  onDeleteReply,
  onUpdateReply,
  onCreateReply,
  onCommentsButtonClick,
  onError,
  isInvalid,
  parentReplyId,
}: RecipientViewPetitionFieldDynamicSelectProps) {
  const fieldReplies = completedFieldReplies(field);

  const filteredCompletedFieldReplies = parentReplyId
    ? field.replies.filter(
        (r) => r.parent?.id === parentReplyId && fieldReplies.some((fr) => fr.id === r.id),
      )
    : fieldReplies;

  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  const [showNewReply, setShowNewReply] = useState(filteredReplies.length === 0);
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const replyRefs = useMultipleRefs<RecipientViewPetitionFieldReplyDynamicSelectInstance>();
  const [hasAlreadyRepliedError, setHasAlreadyRepliedError] = useState(false);

  const fieldOptions = field.options as FieldOptions["DYNAMIC_SELECT"];

  useEffect(() => {
    if (hasAlreadyRepliedError) {
      setHasAlreadyRepliedError(false);
    }
  }, [filteredReplies]);

  const handleUpdate = useMemoFactory(
    (replyId: string) => async (value: DynamicSelectValue) => {
      await onUpdateReply(replyId, { value });
    },
    [onUpdateReply],
  );

  const handleDelete = useMemoFactory(
    (replyId: string) => async () => {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
      if (filteredReplies.length === 1) {
        setShowNewReply(true);
      }
    },
    [filteredReplies, onDeleteReply],
  );

  async function handleCreateReply(value: string) {
    const _value = fieldOptions.labels.map((label, i) => [
      label,
      i === 0 ? value : null,
    ]) as DynamicSelectValue;
    try {
      const replyId = await onCreateReply({ value: _value });
      if (replyId) {
        setShowNewReply(false);
        setTimeout(() => {
          replyRefs[replyId].current?.focus(1);
        });
      }
    } catch (e) {
      if (isApolloError(e, "FIELD_ALREADY_REPLIED_ERROR")) {
        setHasAlreadyRepliedError(true);
      }
      onError(e);
    }
  }

  function handleAddNewReply() {
    setShowNewReply(true);
  }

  const showAddNewReply = !isDisabled && field.multiple;

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={showAddNewReply}
      addNewReplyIsDisabled={
        showNewReply || filteredCompletedFieldReplies.length !== filteredReplies.length
      }
      onAddNewReply={handleAddNewReply}
      onDownloadAttachment={onDownloadAttachment}
    >
      {filteredCompletedFieldReplies.length ? (
        <Text fontSize="sm" color="gray.600">
          <FormattedMessage
            id="component.recipient-view-petition-field-card.replies-submitted"
            defaultMessage="{count, plural, =1 {1 reply submitted} other {# replies submitted}}"
            values={{ count: filteredCompletedFieldReplies.length }}
          />
        </Text>
      ) : hasAlreadyRepliedError ? (
        <Text fontSize="sm" color="red.500">
          <FormattedMessage id="generic.reply-not-submitted" defaultMessage="Reply not sent" />
        </Text>
      ) : null}
      {filteredReplies.length ? (
        <List as={Stack} marginTop={1} spacing={8}>
          <AnimatePresence initial={false}>
            {filteredReplies.map((reply) => (
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
      {(showNewReply && field.multiple) || filteredReplies.length === 0 ? (
        <Box marginTop={filteredReplies.length ? 8 : 1}>
          <RecipientViewPetitionFieldReplyDynamicSelectLevel
            label={fieldOptions.labels[0]}
            field={field}
            level={0}
            onChange={handleCreateReply}
            isDisabled={isDisabled}
            isInvalid={isInvalid || hasAlreadyRepliedError}
            parentReplyId={parentReplyId}
          />
        </Box>
      ) : null}
    </RecipientViewPetitionFieldLayout>
  );
}
interface RecipientViewPetitionFieldReplyDynamicSelectProps {
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled?: boolean;
  onChange: (content: [string, string | null][]) => Promise<void>;
  onDelete: () => void;
}

interface RecipientViewPetitionFieldReplyDynamicSelectInstance {
  focus: (level?: number) => void;
}

function RecipientViewPetitionFieldReplyDynamicSelect({
  ref,
  field,
  reply,
  isDisabled,
  onChange,
  onDelete,
}: RecipientViewPetitionFieldReplyDynamicSelectProps &
  RefAttributes<RecipientViewPetitionFieldReplyDynamicSelectInstance>) {
  const fieldOptions = field.options as FieldOptions["DYNAMIC_SELECT"];
  const refs = useMultipleRefs<SelectInstance>();
  useImperativeHandle(
    ref,
    () => ({
      focus(level?: number) {
        refs[level ?? 0].current?.focus();
      },
    }),
    [],
  );

  async function handleChange(value: string, level: number) {
    const current = reply.content.value as [string, string][];
    if (current[level][1] === value) {
      return;
    }
    await onChange(
      current.map((p, i) => (i === level ? [p[0], value] : i >= level ? [p[0], null] : p)),
    );
    if (level < fieldOptions.labels.length - 1) {
      setTimeout(() => {
        refs[level + 1].current?.focus();
      });
    }
  }

  const repliedLabelsCount =
    reply && !reply.isAnonymized
      ? (reply.content.value as [string, string | null][]).filter(([, value]) => value !== null)
          .length
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
}

interface RecipientViewPetitionFieldReplyDynamicSelectLevelProps {
  label: string;
  level: number;
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  reply?: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled?: boolean;
  onChange: (value: string) => Promise<void>;
  onDeleteReply?: () => void;
  isInvalid?: boolean;
  parentReplyId?: string;
}

function RecipientViewPetitionFieldReplyDynamicSelectLevel({
  ref,
  label,
  level,
  field,
  reply,
  isDisabled,
  onChange,
  onDeleteReply,
  isInvalid,
  parentReplyId,
}: RecipientViewPetitionFieldReplyDynamicSelectLevelProps & RefAttributes<SelectInstance>) {
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

  const id = `reply-${field.id}${
    parentReplyId ? `-${parentReplyId}` : reply?.parent ? `-${reply.parent.id}` : ""
  }-${reply?.id ? `${reply.id}-${level}` : "new"}`;

  return (
    <FormControl id={id} isDisabled={isDisabled}>
      <FormLabel>{label}</FormLabel>
      <Flex alignItems="center">
        <Box flex="1" position="relative" minWidth="0">
          <SimpleSelect
            ref={ref as any}
            isDisabled={
              (isDisabled ||
                reply?.status === "APPROVED" ||
                // if the user modified the labels on the field settings
                // and the recipient tries to update an option with outdated labels, backend will throw error.
                // so we disable the outdated selectors to avoid throwing error
                (reply && reply.content.value[level][0] !== field.options.labels[level])) ??
              false
            }
            isInvalid={reply?.status === "REJECTED" || isInvalid}
            value={
              optimistic
                ? toSimpleSelectOption(optimistic)
                : ((reply && !reply.isAnonymized && reply.content.value[level][1]) ?? null)
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
              valueContainer: (styles) => ({ ...styles, paddingInlineEnd: 32 }),
              placeholder: (base) => ({
                ...base,
                fontStyle: reply?.isAnonymized ? "italic" : "normal",
              }),
            }}
          />

          {reply && (
            <Center height="100%" position="absolute" insetEnd="42px" top={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} reply={reply} />
            </Center>
          )}
        </Box>
        {reply &&
          (level === 0 ? (
            <IconButtonWithTooltip
              marginStart={2}
              disabled={isDisabled || !reply || reply.status === "APPROVED"}
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
            <Box width="40px" marginStart={2} />
          ))}
      </Flex>
    </FormControl>
  );
}
