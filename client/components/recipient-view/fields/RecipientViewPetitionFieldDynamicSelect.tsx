import {
  Box,
  Center,
  Flex,
  Heading,
  List,
  Stack,
  StackProps,
} from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  RecipientViewPetitionFieldCard_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useFieldSelectReactSelectProps } from "@parallel/utils/react-select/hooks";
import { toSelectOption } from "@parallel/utils/react-select/toSelectOption";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
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
}: RecipientViewPetitionFieldDynamicSelectProps) {
  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);

  function handleReplyDeleted() {
    if (field.replies.length === 1) {
      setShowNewReply(true);
    }
  }

  function handleReplyUpdated() {
    setShowNewReply(false);
  }

  function handleReplyCreated() {
    setShowNewReply(false);
  }

  function handleAddNewReply() {
    setShowNewReply(true);
  }

  const showAddNewReply =
    !isDisabled &&
    !showNewReply &&
    field.multiple &&
    field.replies.every(
      (reply) => reply.content.columns.length === field.options.labels.length
    );

  return (
    <RecipientViewPetitionFieldCard
      keycode={keycode}
      access={access}
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      showAddNewReply={showAddNewReply}
      onAddNewReply={handleAddNewReply}
    >
      {field.replies.length ? (
        <List as={Stack} marginTop={1}>
          <AnimatePresence initial={false}>
            {field.replies.map((reply) => (
              <motion.li
                key={reply.id}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <RecipientViewPetitionFieldReplyDynamicSelect
                  petitionId={petitionId}
                  keycode={keycode}
                  field={field}
                  reply={reply}
                  isDisabled={isDisabled}
                  onReplyDeleted={handleReplyDeleted}
                  onReplyUpdated={handleReplyUpdated}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      {(showNewReply && field.multiple) || field.replies.length === 0 ? (
        <RecipientViewPetitionFieldReplyDynamicSelect
          marginTop={2}
          petitionId={petitionId}
          keycode={keycode}
          field={field}
          onReplyCreated={handleReplyCreated}
        />
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}
interface RecipientViewPetitionFieldReplyDynamicSelectProps extends StackProps {
  petitionId: string;
  keycode: string;
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
  reply?: RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
  isDisabled?: boolean;
  onUpdate?: (level: number) => void;
  onReplyDeleted?: () => void;
  onReplyUpdated?: () => void;
  onReplyCreated?: () => void;
}
function RecipientViewPetitionFieldReplyDynamicSelect({
  petitionId,
  keycode,
  field,
  reply,
  isDisabled,
  onReplyDeleted,
  onReplyUpdated,
  onReplyCreated,
  ...props
}: RecipientViewPetitionFieldReplyDynamicSelectProps) {
  const fieldOptions = field.options as FieldOptions["DYNAMIC_SELECT"];
  const refs = useMultipleRefs<SelectInstance>();
  const createDynamicSelectReply = useCreateDynamicSelectReply();
  const updateDynamicSelectReply = useUpdateDynamicSelectReply();
  const deleteReply = useDeletePetitionReply();

  // focus selector input when the new ref is available
  useEffect(() => {
    const length = Object.keys(refs).length;
    refs[length - 1].current?.focus();
  }, [Object.keys(refs).length]);

  async function handleSubmitValue(value: string, level: number) {
    if (!reply) {
      await createDynamicSelectReply({
        petitionId,
        fieldId: field.id,
        keycode,
        content: [fieldOptions.labels[level], value],
      });
      onReplyCreated?.();
    } else {
      if (reply.content.columns[level]?.[1] !== value) {
        const label = fieldOptions.labels[level];
        const updatedReply = (reply.content.columns as string[][])
          .slice(0, level)
          .concat([[label, value]]);
        await updateDynamicSelectReply({
          petitionId,
          replyId: reply.id,
          keycode,
          content: updatedReply,
        });
        onReplyUpdated?.();
        refs[level + 1].current?.focus();
      }
    }
  }

  async function handleDeleteReply() {
    await deleteReply({
      petitionId,
      keycode,
      fieldId: field.id,
      replyId: reply!.id,
    });
    onReplyDeleted?.();
  }

  return (
    <Stack {...props}>
      {fieldOptions.labels
        .slice(0, (reply?.content.columns.length ?? 0) + 1)
        .map((label, level) => (
          <RecipientViewPetitionFieldReplyDynamicSelectLevel
            key={level}
            ref={refs[level]}
            label={label}
            level={level}
            field={field}
            reply={reply}
            isDisabled={isDisabled}
            onValueSubmitted={(value) => handleSubmitValue(value, level)}
            onDeleteReply={handleDeleteReply}
          />
        ))}
    </Stack>
  );
}

interface RecipientViewPetitionFieldReplyDynamicSelectLevelProps {
  label: string;
  level: number;
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
  reply?: RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
  isDisabled?: boolean;
  onValueSubmitted: (value: string) => Promise<void>;
  onDeleteReply: () => void;
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
    onValueSubmitted,
    onDeleteReply,
  }: RecipientViewPetitionFieldReplyDynamicSelectLevelProps,
  ref
) {
  const intl = useIntl();

  const reactSelectProps = useFieldSelectReactSelectProps(
    useMemo(
      () => ({
        id: `reply-${field.id}-${reply ? `${reply.id}-${level}` : "new"}`,
        isDisabled: isDisabled || reply?.status === "APPROVED",
        isInvalid: reply?.status === "REJECTED",
      }),
      [isDisabled, reply?.status]
    )
  );

  const [isSaving, setIsSaving] = useState(false);

  const [value, setValue] = useState<{ label: string; value: string } | null>(
    toSelectOption(
      ((reply?.content.columns[level] as string[]) ?? [])[1] ?? null
    )
  );

  useEffect(() => {
    setValue(
      toSelectOption(
        ((reply?.content.columns[level] as string[]) ?? [])[1] ?? null
      )
    );
  }, [reply?.content.columns.length]);

  const selectOptions = useMemo(() => {
    let options = field.options.values;

    ((reply?.content.columns as string[][]) ?? [])
      .slice(0, level)
      .forEach((replied) => {
        options =
          options.find((value: any) => value[0] === replied[1])?.[1] ?? [];
      });
    return options.map(
      (value: any) =>
        toSelectOption(typeof value === "string" ? value : value[0])!
    );
  }, [reply?.content.columns]);

  async function handleOptionChange(
    option: { value: string; label: string } | null
  ) {
    setIsSaving(true);
    setValue(option);
    if (option) {
      await onValueSubmitted(option.value);
    }
    setIsSaving(false);
  }
  return (
    <Stack spacing={0} marginTop={4}>
      <Heading fontSize="md">{label}</Heading>
      <Flex alignItems="center">
        <Box flex="1" position="relative" marginY={2}>
          <Select
            {...reactSelectProps}
            ref={ref}
            value={value}
            options={selectOptions}
            onChange={handleOptionChange}
            placeholder={
              <FormattedMessage
                id="component.recipient-view-petition-field-reply.select-placeholder"
                defaultMessage="Select an option"
              />
            }
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
              onClick={() => onDeleteReply()}
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
          ) : (
            <Box width="40px" marginLeft={2} />
          ))}
      </Flex>
    </Stack>
  );
});
