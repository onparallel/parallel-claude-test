import {
  Box,
  Center,
  Flex,
  FormControl,
  FormLabel,
  List,
  Stack,
} from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  RecipientViewPetitionFieldCard_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import {
  DynamicSelectOption,
  FieldOptions,
} from "@parallel/utils/petitionFields";
import { useFieldSelectReactSelectProps } from "@parallel/utils/react-select/hooks";
import { toSelectOption } from "@parallel/utils/react-select/toSelectOption";
import { OptionType } from "@parallel/utils/react-select/types";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { countBy } from "remeda";
import {
  useCreateDynamicSelectReply,
  useDeletePetitionReply,
  useUpdateDynamicSelectReply,
} from "./mutations";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export interface RecipientViewPetitionFieldDynamicSelectProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  petitionId: string;
  isDisabled: boolean;
}

type SelectInstance = Select<{ label: string; value: string }, false, never>;

export function RecipientViewPetitionFieldDynamicSelect({
  petitionId,
  keycode,
  access,
  field,
  isDisabled,
  isInvalid,
  hasCommentsEnabled,
  onDownloadAttachment,
}: RecipientViewPetitionFieldDynamicSelectProps) {
  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);
  const [isDeletingReply, setIsDeletingReply] = useState<
    Record<string, boolean>
  >({});
  const newReplyRef = useRef<SelectInstance>(null);
  const replyRefs =
    useMultipleRefs<RecipientViewPetitionFieldReplyDynamicSelectInstance>();

  const fieldOptions = field.options as FieldOptions["DYNAMIC_SELECT"];

  const updateDynamicSelectReply = useUpdateDynamicSelectReply();
  const handleUpdate = useMemoFactory(
    (replyId: string) => async (value: [string, string | null][]) => {
      await updateDynamicSelectReply({ petitionId, replyId, keycode, value });
    },
    [petitionId, keycode, updateDynamicSelectReply]
  );

  const deleteReply = useDeletePetitionReply();
  const handleDelete = useMemoFactory(
    (replyId: string) => async () => {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await deleteReply({ petitionId, fieldId: field.id, replyId, keycode });
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
      if (field.replies.length === 1) {
        setShowNewReply(true);
      }
    },
    [keycode, field.id, field.replies, deleteReply]
  );

  const createDynamicSelectReply = useCreateDynamicSelectReply();
  async function handleCreateReply(value: string) {
    const reply = await createDynamicSelectReply({
      petitionId,
      keycode,
      fieldId: field.id,
      value: fieldOptions.labels.map((label, i) => [
        label,
        i === 0 ? value : null,
      ]),
    });
    if (reply) {
      setShowNewReply(false);
      setTimeout(() => {
        const instance = replyRefs[reply.id].current!;
        instance.focus(1);
      });
    }
  }

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => newReplyRef.current?.focus());
  }

  const showAddNewReply =
    !isDisabled &&
    !showNewReply &&
    field.multiple &&
    field.options.labels.length &&
    field.replies.length > 0 &&
    completedFieldReplies(field).length === field.replies.length;
  return (
    <RecipientViewPetitionFieldCard
      keycode={keycode}
      access={access}
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      showAddNewReply={showAddNewReply}
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
                  isDisabled={isDisabled || isDeletingReply[reply.id]}
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
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
  reply: RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
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
    const current = reply.content.columns as [string, string][];
    if (current[level][1] === value) {
      return;
    }
    await onChange(
      current.map((p, i) =>
        i === level ? [p[0], value] : i >= level ? [p[0], null] : p
      )
    );
    if (level < fieldOptions.labels.length - 1) {
      setTimeout(() => {
        refs[level + 1].current?.focus();
      });
    }
  }

  const repliedLabelsCount = reply
    ? countBy(
        reply.content.columns as [string, string | null][],
        ([, value]) => value !== null
      )
    : 0;

  const options =
    (reply?.content.columns as string[][]) ??
    fieldOptions.labels.map((label) => [label, null]);

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
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
  reply?: RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
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

  const reactSelectProps = useFieldSelectReactSelectProps(
    useMemo(
      () => ({
        id: `reply-${field.id}-${reply?.id ? `${reply.id}-${level}` : "new"}`,
        isDisabled: isDisabled || reply?.status === "APPROVED",
        isInvalid: reply?.status === "REJECTED",
      }),
      [reply?.id, reply?.status, isDisabled]
    )
  );

  const [isSaving, setIsSaving] = useState(false);

  const { options, value } = useMemo(() => {
    let values: string[] | DynamicSelectOption[] = fieldOptions.values;

    const replies = (reply?.content.columns as [string, string][]) ?? [];
    for (let i = 0; i < level; ++i) {
      values =
        (values as DynamicSelectOption[]).find(
          ([label]) => label === replies[i][1]
        )?.[1] ?? [];
    }
    return {
      options: (Array.isArray(values[0])
        ? (values as DynamicSelectOption[]).map(([label]) => label)
        : (values as string[])
      ).map((value) => toSelectOption(value)!),
      value: reply
        ? toSelectOption(
            (reply.content.columns as [string, string | null][])[level][1] ??
              null
          )
        : toSelectOption(null),
    };
  }, [fieldOptions, reply?.content.columns, level]);

  async function handleOptionChange(option: OptionType | null) {
    setIsSaving(true);
    if (option) {
      setOptimistic(option.value);
      await onChange(option.value);
      setOptimistic(null);
    }
    setIsSaving(false);
  }

  // if the user modified the labels on the field settings
  // and the recipient tries to update an option with outdated labels, backend will throw error.
  // so we disable the outdated selectors to avoid throwing error
  const labelsAreOutdated =
    (reply &&
      reply.content.columns[level][0] !== field.options.labels[level]) ??
    false;

  return (
    <FormControl id={reactSelectProps.inputId} isDisabled={labelsAreOutdated}>
      <FormLabel>{label}</FormLabel>
      <Flex alignItems="center">
        <Box flex="1" position="relative">
          <Select
            {...reactSelectProps}
            ref={ref}
            value={optimistic ? toSelectOption(optimistic) : value}
            options={options}
            onChange={handleOptionChange}
            placeholder={
              <FormattedMessage
                id="generic.select-an-option"
                defaultMessage="Select an option"
              />
            }
            isDisabled={labelsAreOutdated}
          />
          {reply && value && (
            <Center height="100%" position="absolute" right="42px" top={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator
                isSaving={isSaving}
                reply={reply}
              />
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
