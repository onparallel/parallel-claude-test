import { DataProxy, gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
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
import {
  ChevronRightIcon,
  ConditionIcon,
  CopyIcon,
  DeleteIcon,
  DragHandleIcon,
  PaperclipIcon,
  SettingsIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionComposeFieldAttachment_PetitionFieldAttachmentFragmentDoc,
  PetitionComposeField_PetitionBaseFragment,
  PetitionComposeField_PetitionFieldFragment,
  PetitionComposeField_createPetitionFieldAttachmentUploadLinkDocument,
  PetitionComposeField_deletePetitionFieldAttachmentDocument,
  PetitionComposeField_petitionFieldAttachmentDownloadLinkDocument,
  PetitionComposeField_petitionFieldAttachmentUploadCompleteDocument,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { memoWithFragments } from "@parallel/utils/memoWithFragments";
import { generateCssStripe } from "@parallel/utils/css";
import { PetitionFieldIndex, letters } from "@parallel/utils/fieldIndices";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { getMinMaxCheckboxLimit, usePetitionFieldTypeColor } from "@parallel/utils/petitionFields";
import { withError } from "@parallel/utils/promises/withError";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import useMergedRef from "@react-hook/merged-ref";
import { fromEvent } from "file-selector";
import pMap from "p-map";
import { RefObject, useCallback, useImperativeHandle, useRef, useState } from "react";
import { XYCoord, useDrag, useDrop } from "react-dnd";
import { useDropzone } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { omit, takeWhile } from "remeda";
import { ConfimationPopover } from "../common/ConfirmationPopover";
import { FileSize } from "../common/FileSize";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { InternalFieldBadge } from "../common/InternalFieldBadge";
import { NakedLink } from "../common/Link";
import { SmallPopover } from "../common/SmallPopover";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { CheckboxTypeLabel } from "../petition-common/CheckboxTypeLabel";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";
import { PetitionComposeDragActiveIndicator } from "./PetitionComposeDragActiveIndicator";
import { PetitionComposeFieldAttachment } from "./PetitionComposeFieldAttachment";
import {
  PetitionFieldOptionsListEditor,
  PetitionFieldOptionsListEditorRef,
} from "./PetitionFieldOptionsListEditor";
import { PetitionFieldVisibilityEditor } from "./PetitionFieldVisibilityEditor";

export interface PetitionComposeFieldProps {
  petition: PetitionComposeField_PetitionBaseFragment;
  field: PetitionComposeField_PetitionFieldFragment;
  fieldIndex: PetitionFieldIndex;
  index: number;
  isActive: boolean;
  showError: boolean;
  onMove: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
  onCloneField: () => void;
  onSettingsClick: () => void;
  onTypeIndicatorClick: () => void;
  onFieldVisibilityClick: () => void;
  onDeleteClick: () => void;
  onFocusNextField: () => void;
  onFocusPrevField: () => void;
  onAddField: () => void;
  isReadOnly?: boolean;
}

export interface PetitionComposeFieldRef {
  elementRef: RefObject<HTMLDivElement>;
  focusFromPrevious: () => void;
  focusFromNext: () => void;
}

const _PetitionComposeField = chakraForwardRef<
  "div",
  PetitionComposeFieldProps,
  PetitionComposeFieldRef
>(function PetitionComposeField(
  {
    petition,
    field,
    fieldIndex,
    index,
    isActive,
    showError,
    onMove,
    onFocus,
    onCloneField,
    onSettingsClick,
    onTypeIndicatorClick,
    onDeleteClick,
    onFieldEdit,
    onFieldVisibilityClick,
    onFocusNextField,
    onFocusPrevField,
    onAddField,
    isReadOnly,
    ...props
  },
  ref,
) {
  const intl = useIntl();
  const { elementRef, dragRef, previewRef, isDragging } = useDragAndDrop(
    field.id,
    index,
    onMove,
    field.isFixed ? "FIXED_FIELD" : "FIELD",
  );

  const canChangeVisibility =
    takeWhile(petition.fields, (f) => f.id !== field.id).filter((f) => !f.isReadOnly).length > 0;

  const uploads = useRef<Record<string, AbortController>>({});
  const [attachmentUploadProgress, setAttachmentUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [createPetitionFieldAttachmentUploadLink] = useMutation(
    PetitionComposeField_createPetitionFieldAttachmentUploadLinkDocument,
  );
  const [petitionFieldAttachmentUploadComplete] = useMutation(
    PetitionComposeField_petitionFieldAttachmentUploadCompleteDocument,
  );
  const [deletePetitionFieldAttachment] = useMutation(
    PetitionComposeField_deletePetitionFieldAttachmentDocument,
  );
  const [petitionFieldAttachmentDownloadLink] = useMutation(
    PetitionComposeField_petitionFieldAttachmentDownloadLinkDocument,
  );

  const handleRemoveAttachment = async function (attachmentId: string) {
    uploads.current[attachmentId]?.abort();
    await deletePetitionFieldAttachment({
      variables: { petitionId: petition.id, fieldId: field.id, attachmentId },
    });
  };

  const handleDownloadAttachment = async function (attachmentId: string) {
    await withError(
      openNewWindow(async () => {
        const { data } = await petitionFieldAttachmentDownloadLink({
          variables: { petitionId: petition.id, fieldId: field.id, attachmentId },
        });
        const { url } = data!.petitionFieldAttachmentDownloadLink;
        return url!;
      }),
    );
  };

  function updateAttachmentUploadingStatus(cache: DataProxy, id: string, isUploading: boolean) {
    updateFragment(cache, {
      fragment: PetitionComposeFieldAttachment_PetitionFieldAttachmentFragmentDoc,
      fragmentName: "PetitionComposeFieldAttachment_PetitionFieldAttachment",
      id,
      data: (data) => ({ ...data!, isUploading }),
    });
  }

  const showErrorDialog = useErrorDialog();
  const maxAttachmentSize = 100 * 1024 * 1024;
  const [draggedFiles, setDraggedFiles] = useState<(File | DataTransferItem)[]>([]);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
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
        }),
      );
    },
    onDrop: async (files: File[], _, event) => {
      if (field.attachments.length + files.length > 10) {
        // on drop event already shows a message on the dropzone, type="change" means the
        // file is coming from the "Add attachment" button which doesn't provide any feedback
        if (event.type === "change") {
          await withError(
            showErrorDialog({
              header: (
                <FormattedMessage
                  id="component.petition-compose-field.too-many-attachments-header"
                  defaultMessage="Too many attachments"
                />
              ),
              message: (
                <FormattedMessage
                  id="component.petition-compose-field.too-many-attachments"
                  defaultMessage="A maximum of {count, plural, =1 {one attachment} other {# attachments}} can be added to a field"
                  values={{ count: 10 }}
                />
              ),
            }),
          );
        }
        return;
      }
      await pMap(
        files,
        async (file) => {
          const { data } = await createPetitionFieldAttachmentUploadLink({
            variables: {
              petitionId: petition.id,
              fieldId: field.id,
              data: { filename: file.name, size: file.size, contentType: file.type },
            },
            update: async (cache, { data }) => {
              updateAttachmentUploadingStatus(
                cache,
                data!.createPetitionFieldAttachmentUploadLink.attachment.id,
                true,
              );
            },
          });
          const { attachment, presignedPostData } = data!.createPetitionFieldAttachmentUploadLink;
          const controller = new AbortController();
          uploads.current[attachment.id] = controller;
          try {
            await uploadFile(file, presignedPostData, {
              signal: controller.signal,
              onProgress(progress) {
                setAttachmentUploadProgress((progresses) => ({
                  ...progresses,
                  [attachment.id]: progress,
                }));
              },
            });
          } catch (e) {
            if (e instanceof UploadFileError && e.message === "Aborted") {
              // handled when aborted
            } else {
              await deletePetitionFieldAttachment({
                variables: {
                  petitionId: petition.id,
                  fieldId: field.id,
                  attachmentId: attachment.id,
                },
              });
            }
            return;
          } finally {
            delete uploads.current[attachment.id];
          }
          await petitionFieldAttachmentUploadComplete({
            variables: {
              petitionId: petition.id,
              fieldId: field.id,
              attachmentId: attachment.id,
            },
            update: async (cache) => {
              updateAttachmentUploadingStatus(cache, attachment.id, false);
            },
          });
        },
        { concurrency: 3 },
      );
    },
    onDragEnter: async (e) => {
      const files = await fromEvent(e);
      setDraggedFiles(files);
    },
    onDragLeave: async (e) => {
      setDraggedFiles([]);
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
    "role",
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
        ...(isDragging && generateCssStripe({ size: "1rem", color: "gray.50" })),
      }}
      onFocus={onFocus}
      {...dropzoneRootProps}
      {...props}
    >
      <input type="file" {...getInputProps()} />
      {isDragActive ? (
        <PetitionComposeDragActiveIndicator
          showErrorMessage={field.attachments.length + draggedFiles.length > 10}
          message={
            <FormattedMessage
              id="component.petition-compose-field.drop-files-to-attach"
              defaultMessage="Drop here your files to attach them to this field"
            />
          }
          errorMessage={
            <FormattedMessage
              id="component.petition-compose-field.too-many-attachments"
              defaultMessage="A maximum of {count, plural, =1 {one attachment} other {# attachments}} can be added to a field"
              values={{ count: 10 }}
            />
          }
        />
      ) : null}
      <Box
        ref={previewRef}
        display="flex"
        flexDirection="row"
        opacity={isDragging ? 0 : 1}
        data-active={isActive ? true : undefined}
        backgroundColor="white"
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
          _active: {
            backgroundColor: "primary.50",
            ".field-actions": {
              display: "flex",
            },
          },
          _hover: {
            backgroundColor: "gray.50",
            ".field-actions": {
              display: "flex",
            },
            _active: {
              backgroundColor: "primary.50",
            },
          },
        }}
      >
        {field.isFixed || isReadOnly ? (
          <Box width="32px" />
        ) : (
          <Box
            ref={dragRef}
            data-testid="compose-field-drag-handle"
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
              defaultMessage: "Drag to sort this parallel fields",
            })}
          >
            <DragHandleIcon role="presentation" />
          </Box>
        )}
        {field.optional ? null : (
          <Box marginX={-2} position="relative">
            <Tooltip
              placement="bottom"
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
            as="button"
            onClick={onTypeIndicatorClick}
            marginTop="10px"
            alignSelf="flex-start"
          />
        </Box>
        <PetitionComposeFieldInner
          ref={ref}
          flex="1"
          paddingLeft={3}
          paddingTop={2}
          paddingBottom={10}
          paddingRight={4}
          petition={petition}
          field={field}
          fieldIndex={fieldIndex}
          showError={showError}
          attachmentUploadProgress={attachmentUploadProgress}
          onFieldEdit={onFieldEdit}
          onFocusNextField={onFocusNextField}
          onFocusPrevField={onFocusPrevField}
          onAddField={onAddField}
          onRemoveAttachment={handleRemoveAttachment}
          onDownloadAttachment={handleDownloadAttachment}
          isReadOnly={isReadOnly}
        />
        <PetitionComposeFieldActions
          field={field}
          isActive={isActive}
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
          isReadOnly={isReadOnly}
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
    | "petition"
    | "showError"
    | "onFieldEdit"
    | "onFocusNextField"
    | "onFocusPrevField"
    | "onAddField"
  > {
  attachmentUploadProgress: Record<string, number>;
  onRemoveAttachment: (attachmentId: string) => void;
  onDownloadAttachment: (attachmentId: string) => void;
  isReadOnly?: boolean;
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
    petition,
    showError,
    attachmentUploadProgress,
    onFieldEdit,
    onFocusNextField,
    onFocusPrevField,
    onAddField,
    onDownloadAttachment,
    onRemoveAttachment,
    isReadOnly,
    ...props
  },
  ref,
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

  const fieldOptionsRef = useRef<PetitionFieldOptionsListEditorRef>(null);
  const focusFieldOptions = useCallback((atStart?: boolean) => {
    fieldOptionsRef.current?.focus(atStart ? "START" : undefined);
  }, []);

  const elementRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(
    ref,
    () =>
      ({
        elementRef,
        focusFromPrevious: () => focusTitle(true),
        focusFromNext: () => {
          if (field.type === "SELECT" || field.type === "CHECKBOX") {
            focusFieldOptions(true);
          } else if (field.description) {
            focusDescription(true);
          } else {
            focusTitle(true);
          }
        },
      }) as PetitionComposeFieldRef,
    [field],
  );

  const letter = letters();

  return (
    <Stack ref={elementRef} spacing={1} {...props}>
      <Stack direction="row" spacing={2} alignItems="center">
        {field.isInternal ? <InternalFieldBadge /> : null}
        <Box flex={1}>
          <Input
            id={`field-title-${field.id}`}
            data-testid="compose-field-title"
            ref={titleRef}
            aria-label={intl.formatMessage({
              id: "component.petition-compose-field.field-title-label",
              defaultMessage: "Field title",
            })}
            noOfLines={1}
            placeholder={
              field.type === "HEADING"
                ? intl.formatMessage({
                    id: "component.petition-compose-field.heading-title-placeholder",
                    defaultMessage: "Add a title for this text block...",
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
              showError && !title && field.type !== "HEADING" ? { color: "red.500" } : undefined
            }
            _focus={{ boxShadow: "none" }}
            onChange={(event) => setTitle(event.target.value ?? null)}
            onBlur={() => {
              const trimmed = title?.trim() ?? null;
              setNativeValue(titleRef.current!, trimmed ?? "");
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
                  } else if (field.type === "SELECT" || field.type === "CHECKBOX") {
                    focusFieldOptions(true);
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
            isDisabled={isReadOnly}
          />
        </Box>
        {field.isReadOnly ? null : (
          <FormControl
            className="field-actions"
            display="flex"
            alignItems="center"
            width="auto"
            height="24px"
            isDisabled={isReadOnly}
          >
            <FormLabel htmlFor={`field-required-${field.id}`} fontWeight="normal" marginBottom="0">
              <FormattedMessage id="petition.required-label" defaultMessage="Required" />
            </FormLabel>
            <Switch
              data-testid="compose-field-required"
              id={`field-required-${field.id}`}
              height="20px"
              isChecked={!field.optional}
              onChange={(event) => {
                if (field.type === "CHECKBOX") {
                  const [min, max] = getMinMaxCheckboxLimit({
                    min: field.options.limit.min || 0,
                    max: field.options.limit.max || 1,
                    valuesLength: field.options.values.length || 1,
                    optional: !event.target.checked,
                  });

                  onFieldEdit({
                    optional: !event.target.checked,
                    options: {
                      ...field.options,
                      limit: {
                        ...field.options.limit,
                        min,
                        max,
                      },
                    },
                  });
                } else {
                  onFieldEdit({ optional: !event.target.checked });
                }
              }}
              isDisabled={isReadOnly}
            />
          </FormControl>
        )}
      </Stack>
      {!description && isReadOnly ? null : (
        <GrowingTextarea
          ref={descriptionRef}
          id={`field-description-${field.id}`}
          data-testid="compose-field-description"
          className={"field-description"}
          placeholder={
            field.type === "HEADING"
              ? intl.formatMessage({
                  id: "component.petition-compose-field.heading-description-placeholder",
                  defaultMessage: "Enter the text that you need...",
                })
              : intl.formatMessage({
                  id: "component.petition-compose-field.field-description-placeholder",
                  defaultMessage: "Add a description...",
                })
          }
          aria-label={intl.formatMessage({
            id: "component.petition-compose-field.field-description-label",
            defaultMessage: "Field description",
          })}
          fontSize="sm"
          background="transparent"
          value={description ?? ""}
          maxLength={10000}
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
            const beforeCursor = textarea.value.substr(0, textarea.selectionStart);
            const currentLine = (beforeCursor.match(/\n/g) ?? []).length;
            switch (event.key) {
              case "ArrowDown":
                if (currentLine === totalLines - 1) {
                  if (field.type === "SELECT") {
                    event.preventDefault();
                    focusFieldOptions(true);
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
          isDisabled={isReadOnly}
        />
      )}
      {field.attachments.length ? (
        <Box>
          <Flex flexWrap="wrap" gridGap={2}>
            {field.attachments.map((attachment) => (
              <PetitionComposeFieldAttachment
                key={attachment.id}
                attachment={attachment}
                isDisabled={isReadOnly}
                progress={attachmentUploadProgress[attachment.id]}
                onDownload={() => onDownloadAttachment(attachment.id)}
                onRemove={() => onRemoveAttachment(attachment.id)}
              />
            ))}
          </Flex>
        </Box>
      ) : null}
      {field.type === "CHECKBOX" ? (
        <CheckboxTypeLabel
          options={field.options}
          fontSize="xs"
          color={isReadOnly ? undefined : "gray.600"}
          textStyle={isReadOnly ? "muted" : undefined}
        />
      ) : null}
      {field.type === "SELECT" || field.type === "CHECKBOX" ? (
        <PetitionFieldOptionsListEditor
          ref={fieldOptionsRef}
          id={`field-options-list-${field.id}`}
          data-testid="compose-field-options"
          field={field}
          onFieldEdit={onFieldEdit}
          showError={showError}
          onFocusNextField={onFocusNextField}
          onFocusDescription={focusDescription}
          isReadOnly={isReadOnly}
        />
      ) : field.type === "DYNAMIC_SELECT" ? (
        <Box textStyle={isReadOnly ? "muted" : undefined}>
          {field.options.labels?.length ? (
            <>
              <Text as="h6" fontSize="sm">
                <FormattedMessage
                  id="component.petition-compose-field.dynamic-select-labels-header"
                  defaultMessage="Uploaded lists:"
                />
              </Text>
              <List as={Stack} spacing={1} marginTop={1}>
                {((field.options.labels ?? []) as string[]).map((label, index) => (
                  <ListItem key={index} as={Stack} direction="row" alignItems="center">
                    <Center
                      height="20px"
                      width="26px"
                      fontSize="xs"
                      borderRadius="sm"
                      border="1px solid"
                      borderColor={color}
                    >
                      {`${fieldIndex}${letter.next().value}`}
                    </Center>
                    <Text as="span">{label}</Text>
                  </ListItem>
                ))}
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
          paddingTop={1}
          marginBottom={field.visibility && field.visibility.conditions.length < 5 ? -5 : 0}
        >
          <PetitionFieldVisibilityEditor
            showError={showError}
            fieldId={field.id}
            visibility={field.visibility as any}
            fields={petition.fields}
            onVisibilityEdit={(visibility) => onFieldEdit({ visibility })}
            isReadOnly={isReadOnly}
          />
        </Box>
      ) : null}
    </Stack>
  );
});

interface PetitionComposeFieldActionsProps
  extends Pick<
    PetitionComposeFieldProps,
    "field" | "isActive" | "onCloneField" | "onSettingsClick" | "onDeleteClick"
  > {
  canChangeVisibility: boolean;
  onVisibilityClick: () => void;
  onAttachmentClick: () => void;
  isReadOnly?: boolean;
}

const _PetitionComposeFieldActions = chakraForwardRef<"div", PetitionComposeFieldActionsProps>(
  function PetitionComposeFieldActions(
    {
      field,
      canChangeVisibility,
      onVisibilityClick,
      onAttachmentClick,
      onCloneField,
      onSettingsClick,
      onDeleteClick,
      isReadOnly,
      isActive,
      ...props
    },
    ref,
  ) {
    const intl = useIntl();
    const hasCondition = field.visibility;
    const buildUrlToSection = useBuildUrlToPetitionSection();
    return (
      <Stack ref={ref} direction="row" padding={1} {...props}>
        {canChangeVisibility || field.isFixed ? (
          <IconButtonWithTooltip
            data-action="add-field-condition"
            icon={<ConditionIcon />}
            isDisabled={
              (field.type === "HEADING" && (field.isFixed || field.options.hasPageBreak)) ||
              isReadOnly
            }
            size="sm"
            variant="ghost"
            placement="bottom"
            color={hasCondition ? "primary.500" : "gray.600"}
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
          isDisabled={isReadOnly}
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
          isDisabled={isReadOnly}
        />
        <IconButtonWithTooltip
          data-action="show-field-settings"
          data-testid="compose-field-settings-button"
          className="field-settings-button"
          icon={<SettingsIcon />}
          size="sm"
          variant="ghost"
          placement="bottom"
          color="gray.600"
          label={intl.formatMessage({
            id: "component.petition-compose-field.field-settings",
            defaultMessage: "Field settings",
          })}
          aria-controls={`compose-petition-field-settings-${field.id}`}
          aria-expanded={isActive}
          onClick={onSettingsClick}
        />
        <ConfimationPopover
          description={
            <FormattedMessage
              id="component.petition-compose-field.confirm-delete"
              defaultMessage="Do you want to delete this field?"
            />
          }
          confirm={
            <Button onClick={onDeleteClick} size="sm" colorScheme="red">
              <FormattedMessage id="generic.delete" defaultMessage="Delete" />
            </Button>
          }
        >
          <IconButtonWithTooltip
            icon={<DeleteIcon />}
            onClick={onSettingsClick}
            isDisabled={field.isFixed || isReadOnly}
            size="sm"
            variant="ghost"
            placement="bottom"
            color="gray.600"
            label={intl.formatMessage({
              id: "component.petition-compose-field.field-delete",
              defaultMessage: "Delete field",
            })}
          />
        </ConfimationPopover>
        <NakedLink href={buildUrlToSection("preview", { field: field.id })}>
          <IconButtonWithTooltip
            as="a"
            icon={<ChevronRightIcon boxSize={6} />}
            size="sm"
            variant="ghost"
            placement="bottom"
            color="gray.600"
            label={intl.formatMessage({
              id: "component.petition-compose-field.field-preview",
              defaultMessage: "Preview",
            })}
          />
        </NakedLink>
      </Stack>
    );
  },
);

const fragments = {
  get PetitionBase() {
    return gql`
      fragment PetitionComposeField_PetitionBase on PetitionBase {
        id
        fields {
          isReadOnly
          ...PetitionFieldVisibilityEditor_PetitionField
        }
      }
      ${PetitionFieldVisibilityEditor.fragments.PetitionField}
    `;
  },
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
        isInternal
        isReadOnly
        visibility
        attachments {
          ...PetitionComposeField_PetitionFieldAttachment
        }
        ...PetitionFieldOptionsListEditor_PetitionField
      }
      ${this.PetitionFieldAttachment}
      ${PetitionFieldOptionsListEditor.fragments.PetitionField}
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
          field {
            id
            attachments {
              id
            }
          }
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
    mutation PetitionComposeField_deletePetitionFieldAttachment(
      $petitionId: GID!
      $fieldId: GID!
      $attachmentId: GID!
    ) {
      deletePetitionFieldAttachment(
        petitionId: $petitionId
        fieldId: $fieldId
        attachmentId: $attachmentId
      ) {
        id
        attachments {
          id
        }
      }
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

const PetitionComposeFieldActions = memoWithFragments(_PetitionComposeFieldActions, {
  field: fragments.PetitionField,
});

const PetitionComposeFieldInner = memoWithFragments(_PetitionComposeFieldInner, {
  field: fragments.PetitionField,
  petition: fragments.PetitionBase,
});

export const PetitionComposeField = Object.assign(
  memoWithFragments(_PetitionComposeField, {
    field: fragments.PetitionField,
    petition: fragments.PetitionBase,
  }),
  { fragments },
);

interface DragItem {
  index: number;
  id: string;
  type: string;
}

function useDragAndDrop(
  id: string,
  index: number,
  onMove?: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void,
  type = "FIELD",
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
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

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
