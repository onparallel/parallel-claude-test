import { gql } from "@apollo/client";
import {
  Box,
  Center,
  Flex,
  Input,
  Progress,
  Spinner,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { CloudOkIcon, DeleteIcon, DownloadIcon } from "@parallel/chakra/icons";
import {
  RecipientViewPetitionFieldReply_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldReply_PublicPetitionFieldReplyFragment,
  useRecipientViewPetitionFieldReply_publicFileUploadReplyDownloadLinkMutation,
  useRecipientViewPetitionFieldReply_publicUpdateSimpleReplyMutation,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useReactSelectProps } from "@parallel/utils/useReactSelectProps";
import {
  ChangeEvent,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { FormattedDate, useIntl } from "react-intl";
import Select from "react-select";
import { DateTime } from "../common/DateTime";
import { FileName } from "../common/FileName";
import { FileSize } from "../common/FileSize";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { useFailureGeneratingLinkDialog } from "../petition-replies/FailureGeneratingLinkDialog";

interface RecipientViewPetitionFieldReplyProps {
  keycode: string;
  field: RecipientViewPetitionFieldReply_PublicPetitionFieldFragment;
  reply?: RecipientViewPetitionFieldReply_PublicPetitionFieldReplyFragment;
  onRemove: () => void;
}

export function RecipientViewPetitionFieldReply({
  keycode,
  field,
  reply,
  onRemove,
}: RecipientViewPetitionFieldReplyProps) {
  switch (field.type) {
    case "TEXT":
      return (
        <RecipientViewPetitionFieldReplyText
          keycode={keycode}
          options={field.options as FieldOptions["TEXT"]}
          reply={reply}
          onRemove={onRemove}
        />
      );
    case "SELECT":
      return (
        <RecipientViewPetitionFieldReplySelect
          keycode={keycode}
          options={field.options as FieldOptions["SELECT"]}
          reply={reply!}
          onRemove={onRemove}
        />
      );
    case "FILE_UPLOAD":
      return (
        <RecipientViewPetitionFieldReplyFileUpload
          keycode={keycode}
          options={field.options as FieldOptions["FILE_UPLOAD"]}
          reply={reply!}
          onRemove={onRemove}
        />
      );
    default:
      return null;
  }
}

interface RecipientViewPetitionFieldReplyTextProps {
  keycode: string;
  options: FieldOptions["TEXT"];
  reply?: RecipientViewPetitionFieldReply_PublicPetitionFieldReplyFragment;
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
  ] = useRecipientViewPetitionFieldReply_publicUpdateSimpleReplyMutation();
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

function toSelectOption(value: string) {
  return { value, label: value };
}

interface RecipientViewPetitionFieldReplySelectProps {
  keycode: string;
  options: FieldOptions["SELECT"];
  reply: RecipientViewPetitionFieldReply_PublicPetitionFieldReplyFragment;
  onRemove: () => void;
}

// This context is used to pass some properties to react-select subcomponents
const RecipientViewPetitionFieldReplySelectContext = createContext<{
  isUpdating: boolean;
  reply: RecipientViewPetitionFieldReply_PublicPetitionFieldReplyFragment;
}>(null as any);

export function RecipientViewPetitionFieldReplySelect({
  keycode,
  options,
  reply,
  onRemove,
}: RecipientViewPetitionFieldReplySelectProps) {
  const intl = useIntl();
  const [
    updateReply,
    { loading: isUpdating },
  ] = useRecipientViewPetitionFieldReply_publicUpdateSimpleReplyMutation();
  const [value, setValue] = useState(toSelectOption(reply.content.text));

  const _reactSelectProps = useReactSelectProps({
    id: `petition-field-reply-select-${reply.id}`,
    isDisabled: false,
  });

  const reactSelectProps = useMemo(
    () =>
      ({
        ..._reactSelectProps,
        styles: {
          ..._reactSelectProps.styles,
          menu: (styles) => ({
            ...styles,
            zIndex: 100,
          }),
        },
        components: {
          ..._reactSelectProps.components,
          ValueContainer: (props) => {
            const { children, getStyles } = props;
            const { reply, isUpdating } = useContext(
              RecipientViewPetitionFieldReplySelectContext
            );
            return (
              <Box
                sx={{ ...getStyles("valueContainer", props), paddingRight: 8 }}
                position="relative"
              >
                {children}
                <Center
                  width={8}
                  paddingLeft={3}
                  paddingRight={1}
                  height="100%"
                  position="absolute"
                  right={0}
                  top={0}
                >
                  <RecipientViewPetitionFieldReplySavingIndicator
                    isSaving={isUpdating}
                    reply={reply}
                  />
                </Center>
              </Box>
            );
          },
        },
      } as typeof _reactSelectProps),
    [_reactSelectProps]
  );

  const values = useMemo(() => options.values.map(toSelectOption), [
    options.values,
  ]);

  const contextValue = useMemo(() => ({ reply, isUpdating }), [
    reply,
    isUpdating,
  ]);

  return (
    <Stack direction="row">
      <Box flex="1" position="relative">
        <RecipientViewPetitionFieldReplySelectContext.Provider
          value={contextValue}
        >
          <Select
            value={value}
            options={values}
            onChange={(value) => {
              setValue(value as any);
              updateReply({
                variables: {
                  keycode,
                  replyId: reply.id,
                  reply: value!.value,
                },
              });
            }}
            placeholder={
              options.placeholder ??
              intl.formatMessage({
                id:
                  "component.recipient-view-petition-field-reply.select-placeholder",
                defaultMessage: "Select an option",
              })
            }
            {...reactSelectProps}
          />
        </RecipientViewPetitionFieldReplySelectContext.Provider>
      </Box>
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

function RecipientViewPetitionFieldReplySavingIndicator({
  reply,
  isSaving,
}: {
  reply?: RecipientViewPetitionFieldReply_PublicPetitionFieldReplyFragment;
  isSaving: boolean;
}) {
  const intl = useIntl();
  return isSaving ? (
    <Tooltip
      label={intl.formatMessage({
        id: "generic.saving-changes",
        defaultMessage: "Saving...",
      })}
    >
      <Spinner size="xs" thickness="1.5px" />
    </Tooltip>
  ) : reply ? (
    <Tooltip
      label={intl.formatMessage(
        {
          id: "component.recipient-view-petition-field-reply.reply-saved-on",
          defaultMessage: "Reply saved on {date}",
        },
        { date: intl.formatDate(reply.updatedAt, FORMATS.LLL) }
      )}
    >
      <CloudOkIcon color="green.600" />
    </Tooltip>
  ) : null;
}

interface RecipientViewPetitionFieldReplyFileUploadProps {
  keycode: string;
  options: FieldOptions["FILE_UPLOAD"];
  reply: RecipientViewPetitionFieldReply_PublicPetitionFieldReplyFragment;
  onRemove: () => void;
}

export function RecipientViewPetitionFieldReplyFileUpload({
  keycode,
  reply,
  onRemove,
}: RecipientViewPetitionFieldReplyFileUploadProps) {
  const intl = useIntl();
  const [
    downloadFileUploadReply,
  ] = useRecipientViewPetitionFieldReply_publicFileUploadReplyDownloadLinkMutation();
  const showFailure = useFailureGeneratingLinkDialog();
  async function handleDownloadClick() {
    const _window = window.open(undefined, "_blank")!;
    const { data } = await downloadFileUploadReply({
      variables: {
        keycode,
        replyId: reply.id,
        preview: false,
      },
    });
    const { url, result } = data!.publicFileUploadReplyDownloadLink;
    if (result === "SUCCESS") {
      _window.location.href = url!;
    } else {
      _window.close();
      try {
        await showFailure({ filename: reply.content.filename });
      } catch {}
    }
  }
  return (
    <Stack direction="row" alignItems="center">
      <Center
        boxSize={10}
        borderRadius="md"
        border="1px solid"
        borderColor="gray.300"
        color="gray.600"
        boxShadow="sm"
        fontSize="xs"
        fontWeight="bold"
        textTransform="uppercase"
      >
        {reply.content.extension || null}
      </Center>
      <Box flex="1" overflow="hidden" paddingBottom="2px">
        <Flex minWidth={0} whiteSpace="nowrap" alignItems="baseline">
          <FileName value={reply.content?.filename} />
          <Text as="span" marginX={2}>
            -
          </Text>
          <Text as="span" fontSize="xs" color="gray.500">
            <FileSize value={reply.content?.size} />
          </Text>
        </Flex>
        {reply.content!.progress !== undefined ? (
          <Center height="18px">
            <Progress
              borderRadius="sm"
              width="100%"
              isIndeterminate={reply.content!.progress === 1}
              value={reply.content!.progress * 100}
              size="xs"
              colorScheme="green"
            />
          </Center>
        ) : (
          <Text fontSize="xs">
            <DateTime
              value={reply.createdAt}
              format={FORMATS.LL}
              useRelativeTime
            />
          </Text>
        )}
      </Box>
      <IconButtonWithTooltip
        onClick={handleDownloadClick}
        variant="ghost"
        icon={<DownloadIcon />}
        size="md"
        placement="bottom"
        label={intl.formatMessage({
          id: "component.recipient-view-petition-field-reply.download-label",
          defaultMessage: "Download file",
        })}
      />
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

RecipientViewPetitionFieldReply.fragments = {
  PublicPetitionField: gql`
    fragment RecipientViewPetitionFieldReply_PublicPetitionField on PublicPetitionField {
      id
      type
      options
    }
  `,
  PublicPetitionFieldReply: gql`
    fragment RecipientViewPetitionFieldReply_PublicPetitionFieldReply on PublicPetitionFieldReply {
      id
      status
      content
      createdAt
      updatedAt
    }
  `,
};

RecipientViewPetitionFieldReply.mutations = [
  gql`
    mutation RecipientViewPetitionFieldReply_publicUpdateSimpleReply(
      $keycode: ID!
      $replyId: GID!
      $reply: String!
    ) {
      publicUpdateSimpleReply(
        keycode: $keycode
        replyId: $replyId
        reply: $reply
      ) {
        id
        content
        updatedAt
      }
    }
  `,
  gql`
    mutation RecipientViewPetitionFieldReply_publicFileUploadReplyDownloadLink(
      $keycode: ID!
      $replyId: GID!
      $preview: Boolean
    ) {
      publicFileUploadReplyDownloadLink(
        keycode: $keycode
        replyId: $replyId
        preview: $preview
      ) {
        result
        url
      }
    }
  `,
];
