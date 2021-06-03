import { DataProxy, gql } from "@apollo/client";
import {
  Box,
  Center,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  List,
  ListItem,
  Stack,
  Switch,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { getColor } from "@chakra-ui/theme-tools";
import {
  ConditionIcon,
  CopyIcon,
  DeleteIcon,
  DragHandleIcon,
  PaperclipIcon,
  SettingsIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionComposeField_PetitionFieldFragment,
  PetitionComposeField_updateFieldAttachments_PetitionFieldFragment,
  PetitionFieldVisibilityEditor_PetitionFieldFragment,
  UpdatePetitionFieldInput,
  usePetitionComposeField_createPetitionFieldAttachmentUploadLinkMutation,
  usePetitionComposeField_petitionFieldAttachmentUploadCompleteMutation,
  usePetitionComposeField_removePetitionFieldAttachmentMutation,
  usePetitionComposeField_petitionFieldAttachmentDownloadLinkMutation,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { generateCssStripe } from "@parallel/utils/css";
import { letters, PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { usePetitionFieldTypeColor } from "@parallel/utils/petitionFields";
import { withError } from "@parallel/utils/promises/withError";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { uploadFile } from "@parallel/utils/uploadFile";
import useMergedRef from "@react-hook/merged-ref";
import {
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useDrag, useDrop, XYCoord } from "react-dnd";
import { useDropzone } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";
import { useErrorDialog } from "../common/ErrorDialog";
import { FileSize } from "../common/FileSize";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SmallPopover } from "../common/SmallPopover";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";
import { PetitionComposeFieldAttachment } from "./PetitionComposeFieldAttachment";
import { PetitionFieldVisibilityEditor } from "./PetitionFieldVisibilityEditor";
import {
  SelectTypeFieldOptions,
  SelectTypeFieldOptionsRef,
} from "./SelectTypeFieldOptions";

export interface PetitionComposeFieldProps {
  petitionId: string;
  field: PetitionComposeField_PetitionFieldFragment;
  fields: PetitionFieldVisibilityEditor_PetitionFieldFragment[];
  fieldIndex: PetitionFieldIndex;
  index: number;
  isActive: boolean;
  showError: boolean;
  onMove: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
  onCloneField: () => void;
  onSettingsClick: () => void;
  onFieldVisibilityClick: () => void;
  onDeleteClick: () => void;
  onFocusNextField: () => void;
  onFocusPrevField: () => void;
  onAddField: () => void;
}

export type PetitionComposeFieldRef = {
  focusFromPrevious: () => void;
  focusFromNext: () => void;
};

const _PetitionComposeField = chakraForwardRef<
  "div",
  PetitionComposeFieldProps,
  PetitionComposeFieldRef
>(function PetitionComposeField(
  {
    petitionId,
    field,
    fields,
    fieldIndex,
    index,
    isActive,
    showError,
    onMove,
    onFocus,
    onCloneField,
    onSettingsClick,
    onDeleteClick,
    onFieldEdit,
    onFieldVisibilityClick,
    onFocusNextField,
    onFocusPrevField,
    onAddField,
    ...props
  },
  ref
) {
  const intl = useIntl();
  const { elementRef, dragRef, previewRef, isDragging } = useDragAndDrop(
    field.id,
    index,
    onMove,
    field.isFixed ? "FIXED_FIELD" : "FIELD"
  );
  const canChangeVisibility =
    fields
      .slice(
        0,
        fields.findIndex((f) => f.id === field.id)
      )
      .filter((f) => !f.isReadOnly).length > 0;

  const uploads = useRef<Record<string, XMLHttpRequest>>({});
  const [attachmentUploadProgress, setAttachmentUploadProgress] = useState<
    Record<string, number>
  >({});
  const [createPetitionFieldAttachmentUploadLink] =
    usePetitionComposeField_createPetitionFieldAttachmentUploadLinkMutation();
  const [petitionFieldAttachmentUploadComplete] =
    usePetitionComposeField_petitionFieldAttachmentUploadCompleteMutation();
  const [removePetitionFieldAttachment] =
    usePetitionComposeField_removePetitionFieldAttachmentMutation();
  const [petitionFieldAttachmentDownloadLink] =
    usePetitionComposeField_petitionFieldAttachmentDownloadLinkMutation();

  const handleRemoveAttachment = async function (attachmentId: string) {
    uploads.current[attachmentId]?.abort();
    delete uploads.current[attachmentId];
    await removePetitionFieldAttachment({
      variables: { petitionId, fieldId: field.id, attachmentId },
      optimisticResponse: {
        removePetitionFieldAttachment: "SUCCESS",
      },
      update(cache, { data }) {
        updateFieldAttachments(cache, field.id, (attachments) =>
          attachments.filter((a) => a.id !== attachmentId)
        );
      },
    });
  };

  const handleDownloadAttachment = function (attachmentId: string) {
    openNewWindow(async () => {
      const { data } = await petitionFieldAttachmentDownloadLink({
        variables: { petitionId, fieldId: field.id, attachmentId },
      });
      const { url } = data!.petitionFieldAttachmentDownloadLink;
      return url!;
    });
  };

  const showErrorDialog = useErrorDialog();
  const maxAttachmentSize = 100 * 1024 * 1024;
  const { getRootProps, getInputProps, isDragActive, open, draggedFiles } =
    useDropzone({
      maxSize: maxAttachmentSize,
      onDropRejected: async () => {
        await withError(
          showErrorDialog({
            header: (
              <FormattedMessage
                id="component.petition-compose-field.invalid-attachment-header"
                defaultMessage="Invalid attachment"
              />
            ),
            message: (
              <FormattedMessage
                id="component.petition-compose-field.invalid-attachment-message"
                defaultMessage="Only attachments of up to {size} are allowed."
                values={{ size: <FileSize value={maxAttachmentSize} /> }}
              />
            ),
          })
        );
      },
      onDrop: async (files: File[]) => {
        if (field.attachments.length + files.length > 10) {
          return;
        }
        await Promise.all(
          files.map(async (file) => {
            const { data } = await createPetitionFieldAttachmentUploadLink({
              variables: {
                petitionId: petitionId,
                fieldId: field.id,
                data: {
                  filename: file.name,
                  size: file.size,
                  contentType: file.type,
                },
              },
              update(cache, { data }) {
                const { attachment } =
                  data!.createPetitionFieldAttachmentUploadLink;
                updateFieldAttachments(cache, field.id, (attachments) => [
                  ...attachments,
                  attachment,
                ]);
              },
            });
            const { attachment, presignedPostData } =
              data!.createPetitionFieldAttachmentUploadLink;
            uploads.current[attachment.id] = uploadFile(
              file,
              presignedPostData,
              {
                onProgress(progress) {
                  setAttachmentUploadProgress((progresses) => ({
                    ...progresses,
                    [attachment.id]: progress,
                  }));
                },
                async onComplete() {
                  delete uploads.current[field.id];
                  await petitionFieldAttachmentUploadComplete({
                    variables: {
                      petitionId: petitionId,
                      fieldId: field.id,
                      attachmentId: attachment.id,
                    },
                  });
                },
              }
            );
          })
        );
      },
    });

  const _rootProps = getRootProps();
  const dropzoneRootProps = omit(_rootProps, [
    "onBlur",
    "onClick",
    "onFocus",
    "onKeyDown",
    "ref",
    "tabIndex",
  ]);
  const rootRef = useMergedRef(_rootProps.ref, elementRef);

  return (
    <Box
      ref={rootRef}
      borderY="1px solid"
      borderColor="gray.200"
      marginY="-1px"
      aria-current={isActive ? "true" : "false"}
      position="relative"
      sx={{
        ...(isDragging &&
          generateCssStripe({ size: "1rem", color: "gray.50" })),
      }}
      onFocus={onFocus}
      {...dropzoneRootProps}
      {...props}
    >
      <input type="file" {...getInputProps()} />
      {isDragActive ? (
        <PetitionComposeFieldDragActiveIndicator
          field={field}
          draggedFiles={draggedFiles}
        />
      ) : null}
      <Box
        ref={previewRef}
        display="flex"
        flexDirection="row"
        opacity={isDragging ? 0 : 1}
        backgroundColor={isActive ? "purple.50" : "white"}
        sx={{
          "[draggable]": {
            opacity: 0,
            transition: "opacity 150ms",
          },
          ".field-actions": {
            display: "none",
          },
          "&:hover [draggable]": {
            opacity: 1,
          },
          "&:hover, &:focus-within": {
            backgroundColor: isActive ? "purple.50" : "gray.50",
            ".field-actions": {
              display: "flex",
            },
          },
        }}
      >
        {field.isFixed ? (
          <Box width="32px" />
        ) : (
          <Box
            ref={dragRef}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            padding={2}
            width="32px"
            cursor={field.isFixed ? "unset" : "grab"}
            color="gray.400"
            _hover={{
              color: "gray.700",
            }}
            aria-label={intl.formatMessage({
              id: "component.petition-compose-field.drag-to-sort-label",
              defaultMessage: "Drag to sort this petition fields",
            })}
          >
            <DragHandleIcon role="presentation" />
          </Box>
        )}
        {field.optional ? null : (
          <Box marginX={-2} position="relative">
            <Tooltip
              placement="top"
              label={intl.formatMessage({
                id: "generic.required-field",
                defaultMessage: "Required field",
              })}
            >
              <Box
                width={4}
                height={4}
                textAlign="center"
                marginTop="13px"
                fontSize="xl"
                color="red.600"
                userSelect="none"
              >
                <Box position="relative" bottom="4px" pointerEvents="none">
                  *
                </Box>
              </Box>
            </Tooltip>
          </Box>
        )}
        <Box marginLeft={3}>
          <PetitionFieldTypeIndicator
            type={field.type}
            fieldIndex={fieldIndex}
            as={field.isFixed ? "div" : "button"}
            onClick={field.isFixed ? undefined : onSettingsClick}
            marginTop="10px"
            alignSelf="flex-start"
          />
        </Box>
        <PetitionComposeFieldInner
          ref={ref}
          flex="1"
          paddingLeft={4}
          paddingTop={2}
          paddingBottom={10}
          paddingRight={4}
          field={field}
          fieldIndex={fieldIndex}
          fields={fields}
          showError={showError}
          attachmentUploadProgress={attachmentUploadProgress}
          onFieldEdit={onFieldEdit}
          onFocusNextField={onFocusNextField}
          onFocusPrevField={onFocusPrevField}
          onAddField={onAddField}
          onRemoveAttachment={handleRemoveAttachment}
          onDownloadAttachment={handleDownloadAttachment}
        />
        <PetitionComposeFieldActions
          field={field}
          canChangeVisibility={canChangeVisibility}
          onCloneField={onCloneField}
          onSettingsClick={onSettingsClick}
          onDeleteClick={onDeleteClick}
          onVisibilityClick={onFieldVisibilityClick}
          onAttachmentClick={open}
          className="field-actions"
          position="absolute"
          bottom={0}
          right={2}
        />
      </Box>
    </Box>
  );
});

interface PetitionComposeFieldInnerProps
  extends Pick<
    PetitionComposeFieldProps,
    | "field"
    | "fieldIndex"
    | "fields"
    | "showError"
    | "onFieldEdit"
    | "onFocusNextField"
    | "onFocusPrevField"
    | "onAddField"
  > {
  attachmentUploadProgress: Record<string, number>;
  onRemoveAttachment: (attachmentId: string) => void;
  onDownloadAttachment: (attachmentId: string) => void;
}

// This component was extracted so the whole PetitionComposeField doesn't rerender
// when the fieldIndex changes
const _PetitionComposeFieldInner = chakraForwardRef<
  "div",
  PetitionComposeFieldInnerProps,
  PetitionComposeFieldRef
>(function PetitionComposeFieldInner(
  {
    field,
    fieldIndex,
    fields,
    showError,
    attachmentUploadProgress,
    onFieldEdit,
    onFocusNextField,
    onFocusPrevField,
    onAddField,
    onDownloadAttachment,
    onRemoveAttachment,
    ...props
  },
  ref
) {
  const intl = useIntl();
  const [title, setTitle] = useState(field.title);
  const titleRef = useRef<HTMLInputElement>(null);
  const focusTitle = useCallback((atStart?: boolean) => {
    const input = titleRef.current!;
    input.focus();
    if (atStart) {
      input.setSelectionRange(0, 0);
    }
  }, []);
  const color = usePetitionFieldTypeColor(field.type);

  const [description, setDescription] = useState(field.description);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const focusDescription = useCallback((atStart?: boolean) => {
    const textarea = descriptionRef.current!;
    textarea.focus();
    if (atStart) {
      textarea.selectionStart = textarea.selectionEnd = 0;
    }
  }, []);

  const selectFieldOptionsRef = useRef<SelectTypeFieldOptionsRef>(null);
  const focusSelectOptions = useCallback((atStart?: boolean) => {
    selectFieldOptionsRef.current?.focus(atStart ? "START" : undefined);
  }, []);

  useImperativeHandle(
    ref,
    () =>
      ({
        focusFromPrevious: () => focusTitle(true),
        focusFromNext: () => {
          if (field.type === "SELECT") {
            focusSelectOptions(true);
          } else if (field.description) {
            focusDescription(true);
          } else {
            focusTitle(true);
          }
        },
      } as PetitionComposeFieldRef),
    [field]
  );

  const letter = letters();

  return (
    <Box {...props}>
      <Stack direction="row" marginBottom={1}>
        <Box flex={1}>
          <Input
            id={`field-title-${field.id}`}
            ref={titleRef}
            aria-label={intl.formatMessage({
              id: "component.petition-compose-field.field-title-label",
              defaultMessage: "Field title",
            })}
            isTruncated
            placeholder={
              field.type === "HEADING"
                ? intl.formatMessage({
                    id: "component.petition-compose-field.heading-title-placeholder",
                    defaultMessage:
                      "Enter an introductory title for this section...",
                  })
                : field.type === "FILE_UPLOAD"
                ? intl.formatMessage({
                    id: "component.petition-compose-field.file-upload-title-placeholder",
                    defaultMessage: "Describe the file(s) that you need...",
                  })
                : intl.formatMessage({
                    id: "component.petition-compose-field.generic-title-placeholder",
                    defaultMessage: "Ask for the information that you need...",
                  })
            }
            value={title ?? ""}
            width="100%"
            maxLength={500}
            border="none"
            padding={0}
            height={6}
            _placeholder={
              showError && !title ? { color: "red.500" } : undefined
            }
            _focus={{ boxShadow: "none" }}
            onChange={(event) => setTitle(event.target.value ?? null)}
            onBlur={() => {
              const trimmed = title?.trim() ?? null;
              setNativeValue(titleRef.current!, trimmed ?? "");
              titleRef.current!.selectionStart =
                titleRef.current!.selectionEnd = 0;
              if (field.title !== trimmed) {
                onFieldEdit({ title: trimmed });
              }
            }}
            onKeyDown={(event) => {
              switch (event.key) {
                case "ArrowDown":
                  event.preventDefault();
                  if (field.description) {
                    focusDescription(true);
                  } else if (field.type === "SELECT") {
                    focusSelectOptions(true);
                  } else {
                    onFocusNextField();
                  }
                  break;
                case "ArrowUp":
                  event.preventDefault();
                  onFocusPrevField();
                  break;
              }
            }}
            onKeyUp={(event) => {
              switch (event.key) {
                case "Enter":
                  onAddField();
                  break;
              }
            }}
          />
        </Box>
        {field.isReadOnly ? null : (
          <FormControl
            className="field-actions"
            display="flex"
            alignItems="center"
            width="auto"
            height="24px"
          >
            <FormLabel
              htmlFor={`field-required-${field.id}`}
              fontWeight="normal"
              marginBottom="0"
            >
              <FormattedMessage
                id="petition.required-label"
                defaultMessage="Required"
              />
            </FormLabel>
            <Switch
              id={`field-required-${field.id}`}
              height="20px"
              isChecked={!field.optional}
              onChange={(event) =>
                onFieldEdit({ optional: !event.target.checked })
              }
            />
          </FormControl>
        )}
      </Stack>
      <GrowingTextarea
        ref={descriptionRef}
        id={`field-description-${field.id}`}
        className={"field-description"}
        placeholder={intl.formatMessage({
          id: "component.petition-compose-field.field-description-placeholder",
          defaultMessage: "Add a description...",
        })}
        aria-label={intl.formatMessage({
          id: "component.petition-compose-field.field-description-label",
          defaultMessage: "Field description",
        })}
        fontSize="sm"
        background="transparent"
        value={description ?? ""}
        maxLength={4000}
        border="none"
        height="20px"
        padding={0}
        minHeight={0}
        rows={1}
        _focus={{
          boxShadow: "none",
        }}
        onChange={(event) => setDescription(event.target.value ?? null)}
        onBlur={() => {
          const trimmed = description?.trim() ?? null;
          setNativeValue(descriptionRef.current!, trimmed ?? "");
          if (field.description !== trimmed) {
            onFieldEdit({ description: trimmed });
          }
        }}
        onKeyDown={(event) => {
          const textarea = event.target as HTMLTextAreaElement;
          const totalLines = (textarea.value.match(/\n/g) ?? []).length + 1;
          const beforeCursor = textarea.value.substr(
            0,
            textarea.selectionStart
          );
          const currentLine = (beforeCursor.match(/\n/g) ?? []).length;
          switch (event.key) {
            case "ArrowDown":
              if (currentLine === totalLines - 1) {
                if (field.type === "SELECT") {
                  event.preventDefault();
                  focusSelectOptions(true);
                } else {
                  onFocusNextField();
                }
              }
              break;
            case "ArrowUp":
              if (currentLine === 0) {
                focusTitle();
              }
              break;
          }
        }}
      />
      <Flex flexWrap="wrap" margin={-1} marginTop={0}>
        {field.attachments.map((attachment) => (
          <PetitionComposeFieldAttachment
            key={attachment.id}
            attachment={attachment}
            progress={attachmentUploadProgress[attachment.id]}
            onDownload={() => onDownloadAttachment(attachment.id)}
            onRemove={() => onRemoveAttachment(attachment.id)}
            margin={1}
          />
        ))}
      </Flex>
      {field.type === "SELECT" ? (
        <Box marginTop={1}>
          <SelectTypeFieldOptions
            ref={selectFieldOptionsRef}
            field={field}
            onFieldEdit={onFieldEdit}
            showError={showError}
            onFocusNextField={onFocusNextField}
            onFocusDescription={focusDescription}
          />
        </Box>
      ) : field.type === "DYNAMIC_SELECT" ? (
        <Box marginTop={1} paddingLeft={2}>
          {field.options.labels?.length ? (
            <>
              <Text as="h6" fontSize="sm">
                <FormattedMessage
                  id="component.petition-compose-field.dynamic-select-labels-header"
                  defaultMessage="Uploaded lists:"
                />
              </Text>
              <List as={Stack} spacing={1} marginTop={1}>
                {((field.options.labels ?? []) as string[]).map(
                  (label, index) => (
                    <ListItem
                      key={index}
                      as={Stack}
                      direction="row"
                      alignItems="center"
                    >
                      <Center
                        height="20px"
                        width="26px"
                        fontSize="xs"
                        borderRadius="sm"
                        border="1px solid"
                        borderColor={color}
                      >
                        {fieldIndex}
                        {letter.next().value}
                      </Center>
                      <Text as="span">{label}</Text>
                    </ListItem>
                  )
                )}
              </List>
            </>
          ) : (
            <Text color={showError ? "red.500" : "gray.600"} fontSize="sm">
              <FormattedMessage
                id="component.petition-compose-field.dynamic-select-not-configured"
                defaultMessage="Click on field settings to configure this field"
              />
              <Text as="span" marginLeft={1} position="relative" top="-1px">
                (<SettingsIcon />)
              </Text>
            </Text>
          )}
        </Box>
      ) : null}
      {field.visibility ? (
        <Box
          marginTop={2}
          marginBottom={
            field.visibility && field.visibility.conditions.length < 5 ? -5 : 0
          }
        >
          <PetitionFieldVisibilityEditor
            showError={showError}
            fieldId={field.id}
            visibility={field.visibility as any}
            fields={fields}
            onVisibilityEdit={(visibility) => onFieldEdit({ visibility })}
          />
        </Box>
      ) : null}
    </Box>
  );
});

interface PetitionComposeFieldActionsProps
  extends Pick<
    PetitionComposeFieldProps,
    "field" | "onCloneField" | "onSettingsClick" | "onDeleteClick"
  > {
  canChangeVisibility: boolean;
  onVisibilityClick: () => void;
  onAttachmentClick: () => void;
}

const _PetitionComposeFieldActions = chakraForwardRef<
  "div",
  PetitionComposeFieldActionsProps
>(function PetitionComposeFieldActions(
  {
    field,
    canChangeVisibility,
    onVisibilityClick,
    onAttachmentClick,
    onCloneField,
    onSettingsClick,
    onDeleteClick,
    ...props
  },
  ref
) {
  const intl = useIntl();
  const hasCondition = field.visibility;
  return (
    <Stack ref={ref} direction="row" padding={1} {...props}>
      {canChangeVisibility || field.isFixed ? (
        <IconButtonWithTooltip
          icon={<ConditionIcon />}
          isDisabled={
            field.type === "HEADING" &&
            (field.isFixed || field.options.hasPageBreak)
          }
          size="sm"
          variant="ghost"
          placement="bottom"
          color={hasCondition ? "purple.500" : "gray.600"}
          label={
            hasCondition
              ? intl.formatMessage({
                  id: "component.petition-compose-field.remove-condition",
                  defaultMessage: "Remove condition",
                })
              : intl.formatMessage({
                  id: "component.petition-compose-field.add-condition",
                  defaultMessage: "Add condition",
                })
          }
          onClick={onVisibilityClick}
        />
      ) : (
        <SmallPopover
          placement="top"
          closeDelay={0}
          content={
            <Text fontSize="sm">
              <FormattedMessage
                id="component.petition-compose-field.conditions-not-enough-fields"
                defaultMessage="You can only add conditions based on previous fields. Add more fields to be able to set conditions between them."
              />
            </Text>
          }
        >
          <IconButton
            size="sm"
            // fake disabled look so popover still works
            opacity={0.4}
            cursor="not-allowed"
            backgroundColor="transparent"
            _hover={{ backgroundColor: "transparent" }}
            _active={{ backgroundColor: "transparent" }}
            as="div"
            icon={<ConditionIcon />}
            aria-label={intl.formatMessage({
              id: "component.petition-compose-field.add-condition",
              defaultMessage: "Add condition",
            })}
          />
        </SmallPopover>
      )}
      <IconButtonWithTooltip
        icon={<PaperclipIcon />}
        size="sm"
        variant="ghost"
        placement="bottom"
        color="gray.600"
        label={intl.formatMessage({
          id: "component.petition-compose-field.add-attachment",
          defaultMessage: "Add attachment",
        })}
        onClick={onAttachmentClick}
      />
      <IconButtonWithTooltip
        icon={<CopyIcon />}
        size="sm"
        variant="ghost"
        placement="bottom"
        color="gray.600"
        label={intl.formatMessage({
          id: "component.petition-compose-field.field-clone",
          defaultMessage: "Clone field",
        })}
        onClick={onCloneField}
      />
      <IconButtonWithTooltip
        className="field-settings-button"
        icon={<SettingsIcon />}
        isDisabled={field.isFixed}
        size="sm"
        variant="ghost"
        placement="bottom"
        color="gray.600"
        label={intl.formatMessage({
          id: "component.petition-compose-field.field-settings",
          defaultMessage: "Field settings",
        })}
        onClick={onSettingsClick}
      />
      <IconButtonWithTooltip
        icon={<DeleteIcon />}
        isDisabled={field.isFixed}
        size="sm"
        variant="ghost"
        placement="bottom"
        color="gray.600"
        label={intl.formatMessage({
          id: "component.petition-compose-field.field-delete",
          defaultMessage: "Delete field",
        })}
        onClick={onDeleteClick}
      />
    </Stack>
  );
});

const fragments = {
  get PetitionField() {
    return gql`
      fragment PetitionComposeField_PetitionField on PetitionField {
        id
        type
        title
        description
        optional
        multiple
        isFixed
        isReadOnly
        visibility
        attachments {
          ...PetitionComposeField_PetitionFieldAttachment
        }
        ...SelectTypeFieldOptions_PetitionField
        ...PetitionFieldVisibilityEditor_PetitionField
      }
      ${this.PetitionFieldAttachment}
      ${SelectTypeFieldOptions.fragments.PetitionField}
      ${PetitionFieldVisibilityEditor.fragments.PetitionField}
    `;
  },
  get PetitionFieldAttachment() {
    return gql`
      fragment PetitionComposeField_PetitionFieldAttachment on PetitionFieldAttachment {
        ...PetitionComposeFieldAttachment_PetitionFieldAttachment
      }
      ${PetitionComposeFieldAttachment.fragments.PetitionFieldAttachment}
    `;
  },
};

const _mutations = [
  gql`
    mutation PetitionComposeField_createPetitionFieldAttachmentUploadLink(
      $petitionId: GID!
      $fieldId: GID!
      $data: FileUploadInput!
    ) {
      createPetitionFieldAttachmentUploadLink(
        petitionId: $petitionId
        fieldId: $fieldId
        data: $data
      ) {
        presignedPostData {
          ...uploadFile_AWSPresignedPostData
        }
        attachment {
          ...PetitionComposeField_PetitionFieldAttachment
        }
      }
    }
    ${uploadFile.fragments.AWSPresignedPostData}
    ${fragments.PetitionFieldAttachment}
  `,
  gql`
    mutation PetitionComposeField_petitionFieldAttachmentUploadComplete(
      $petitionId: GID!
      $fieldId: GID!
      $attachmentId: GID!
    ) {
      petitionFieldAttachmentUploadComplete(
        petitionId: $petitionId
        fieldId: $fieldId
        attachmentId: $attachmentId
      ) {
        ...PetitionComposeField_PetitionFieldAttachment
      }
    }
    ${fragments.PetitionFieldAttachment}
  `,
  gql`
    mutation PetitionComposeField_removePetitionFieldAttachment(
      $petitionId: GID!
      $fieldId: GID!
      $attachmentId: GID!
    ) {
      removePetitionFieldAttachment(
        petitionId: $petitionId
        fieldId: $fieldId
        attachmentId: $attachmentId
      )
    }
  `,
  gql`
    mutation PetitionComposeField_petitionFieldAttachmentDownloadLink(
      $petitionId: GID!
      $fieldId: GID!
      $attachmentId: GID!
    ) {
      petitionFieldAttachmentDownloadLink(
        petitionId: $petitionId
        fieldId: $fieldId
        attachmentId: $attachmentId
      ) {
        url
      }
    }
  `,
];

const comparePetitionComposeFieldProps = compareWithFragments<any>({
  field: fragments.PetitionField,
  fields: PetitionFieldVisibilityEditor.fragments.PetitionField,
} as any);

const PetitionComposeFieldActions = memo(
  _PetitionComposeFieldActions,
  comparePetitionComposeFieldProps
) as typeof _PetitionComposeFieldActions;

const PetitionComposeFieldInner = memo(
  _PetitionComposeFieldInner,
  comparePetitionComposeFieldProps
) as typeof _PetitionComposeFieldInner;

export const PetitionComposeField = Object.assign(
  memo(
    _PetitionComposeField,
    comparePetitionComposeFieldProps
  ) as typeof _PetitionComposeField,
  { fragments }
);

interface PetitionComposeFieldDragActiveIndicatorProps {
  field: PetitionComposeField_PetitionFieldFragment;
  draggedFiles: File[];
}

function PetitionComposeFieldDragActiveIndicator({
  field,
  draggedFiles,
}: PetitionComposeFieldDragActiveIndicatorProps) {
  const isOverMaxAttachments =
    field.attachments.length + draggedFiles.length > 10;
  return (
    <Center
      position="absolute"
      left={0}
      top={0}
      width="100%"
      height="100%"
      zIndex={1}
      backgroundColor="whiteAlpha.700"
    >
      <Box
        position="absolute"
        left={0}
        top={0}
        width="100%"
        height="100%"
        opacity={0.2}
        sx={{
          backgroundImage: ((theme: any) => {
            const c = isOverMaxAttachments
              ? getColor(theme, "red.100")
              : getColor(theme, "gray.100");
            return `linear-gradient(135deg, ${c} 25%, white 25%, white 50%, ${c} 50%, ${c} 75%, white 75%, white)`;
          }) as any,
          backgroundSize: `3rem 3rem`,
          backgroundPosition: "top left",
        }}
      />
      <Box
        position="absolute"
        left={2}
        top={2}
        right={2}
        bottom={2}
        border="2px dashed"
        borderRadius="md"
        borderColor={isOverMaxAttachments ? "red.300" : "gray.300"}
      />
      <Box
        padding={2}
        borderRadius="lg"
        color={isOverMaxAttachments ? "red.500" : "gray.500"}
        backgroundColor="white"
        fontWeight="bold"
        zIndex={1}
      >
        {isOverMaxAttachments ? (
          <FormattedMessage
            id="component.petition-compose-field.over-max-attachments"
            defaultMessage="A maximum of {count, plural, =1 {one attachment} other {# attachments}} can be added to a field"
            values={{ count: 10 }}
          />
        ) : (
          <FormattedMessage
            id="component.petition-compose-field.drop-files-to-attach"
            defaultMessage="Drop here your files to attach them to this field"
          />
        )}
      </Box>
    </Center>
  );
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

function useDragAndDrop(
  id: string,
  index: number,
  onMove?: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void,
  type = "FIELD"
) {
  const elementRef = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<DragItem, unknown, any>({
    accept: "FIELD",
    hover(item, monitor) {
      if (!elementRef.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = elementRef.current!.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      if (type === "FIELD") {
        // Time to actually perform the action
        onMove?.(dragIndex, hoverIndex);

        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        item.index = hoverIndex;
      }
    },
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    type: "FIELD",
    item: { type, id, index },
    canDrag: () => type === "FIELD",
    collect: (monitor: any) => {
      return {
        isDragging: monitor.isDragging(),
      };
    },
    end: (dropResult, monitor) => {
      const { index: hoverIndex } = monitor.getItem();
      onMove?.(index, hoverIndex, true);
    },
  });

  drop(elementRef);
  return { elementRef, dragRef, previewRef, isDragging };
}

function updateFieldAttachments(
  proxy: DataProxy,
  fieldId: string,
  updateFn: (
    cached: PetitionComposeField_updateFieldAttachments_PetitionFieldFragment["attachments"]
  ) => PetitionComposeField_updateFieldAttachments_PetitionFieldFragment["attachments"]
) {
  updateFragment<PetitionComposeField_updateFieldAttachments_PetitionFieldFragment>(
    proxy,
    {
      id: fieldId,
      fragmentName: "PetitionComposeField_updateFieldAttachments_PetitionField",
      fragment: gql`
        fragment PetitionComposeField_updateFieldAttachments_PetitionField on PetitionField {
          attachments {
            ...PetitionComposeField_PetitionFieldAttachment
          }
        }
        ${fragments.PetitionFieldAttachment}
      `,
      data: (cached) => ({
        ...cached,
        attachments: updateFn(cached!.attachments),
      }),
    }
  );
}
