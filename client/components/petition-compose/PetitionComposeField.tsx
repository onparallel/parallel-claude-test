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
  Stack,
  Switch,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  CalculatorIcon,
  ChevronRightIcon,
  ConditionIcon,
  CopyIcon,
  DeleteIcon,
  DragHandleIcon,
  PaperclipIcon,
  SettingsIcon,
  UnlinkIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionComposeFieldAttachment_PetitionFieldAttachmentFragmentDoc,
  PetitionComposeField_PetitionBaseFragment,
  PetitionComposeField_PetitionFieldFragment,
  PetitionComposeField_UserFragment,
  PetitionComposeField_createPetitionFieldAttachmentUploadLinkDocument,
  PetitionComposeField_deletePetitionFieldAttachmentDocument,
  PetitionComposeField_petitionFieldAttachmentDownloadLinkDocument,
  PetitionComposeField_petitionFieldAttachmentUploadCompleteDocument,
  PetitionField,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { generateCssStripe } from "@parallel/utils/css";
import { PetitionFieldIndex, letters } from "@parallel/utils/fieldIndices";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { memoWithFragments } from "@parallel/utils/memoWithFragments";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { getMinMaxCheckboxLimit, usePetitionFieldTypeColor } from "@parallel/utils/petitionFields";
import { withError } from "@parallel/utils/promises/withError";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import useMergedRef from "@react-hook/merged-ref";
import { fromEvent } from "file-selector";
import pMap from "p-map";
import { RefObject, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { XYCoord, useDrag, useDrop } from "react-dnd";
import { useDropzone } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, omit, sumBy, takeWhile } from "remeda";
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
import { PetitionFieldVisibilityEditor } from "./logic/PetitionFieldVisibilityEditor";

import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  HStack,
  Heading,
} from "@chakra-ui/react";
import { ChevronFilledIcon } from "@parallel/chakra/icons";
import { useConstant } from "@parallel/utils/useConstant";
import { MultipleRefObject } from "@parallel/utils/useMultipleRefs";
import usePrevious from "@react-hook/previous";
import { NativeTypes } from "react-dnd-html5-backend";
import { HelpCenterLink } from "../common/HelpCenterLink";
import { HelpPopover } from "../common/HelpPopover";
import { RestrictedPetitionFieldAlert } from "../petition-common/RestrictedPetitionFieldAlert";
import { PetitionComposeFieldGroupChildren } from "./PetitionComposeFieldGroupChildren";
import { PetitionFieldMathEditor } from "./logic/PetitionFieldMathEditor";

export interface PetitionComposeFieldProps {
  user: PetitionComposeField_UserFragment;
  petition: PetitionComposeField_PetitionBaseFragment;
  field: PetitionComposeField_PetitionFieldFragment;
  fieldIndex: PetitionFieldIndex;
  childrenFieldIndices?: string[] | undefined;
  fieldRefs?: MultipleRefObject<PetitionComposeFieldRef>;
  index: number;
  isActive: boolean;
  activeChildFieldId?: string | null;
  showError: boolean;
  onMove: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
  onCloneField: () => void;
  onSettingsClick: () => void;
  onTypeIndicatorClick: () => void;
  onFieldVisibilityClick: () => void;
  onFieldCalculationsClick: (removeMath?: boolean) => void;
  onDeleteClick: () => void;
  onFocusNextField: () => void;
  onFocusPrevField: () => void;
  onAddField: (type?: PetitionFieldType, position?: number, parentFieldId?: string) => void;
  fieldProps?: (
    fieldId: string,
  ) => Pick<
    PetitionComposeFieldProps,
    | "onCloneField"
    | "onSettingsClick"
    | "onTypeIndicatorClick"
    | "onDeleteClick"
    | "onFieldEdit"
    | "onFieldVisibilityClick"
    | "onFieldCalculationsClick"
    | "onFocusPrevField"
    | "onFocusNextField"
    | "onAddField"
  >;
  onUpdateFieldPositions: (fieldIds: string[], parentFieldId?: string) => void;
  onUnlinkField: (parentFieldId: string, childrenFieldIds: string[]) => void;
  onLinkField?: (parentFieldId: string, childrenFieldIds: string[]) => void;
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
    user,
    petition,
    field,
    fieldIndex,
    index,
    childrenFieldIndices,
    fieldRefs,
    isActive,
    activeChildFieldId,
    showError,
    onMove,
    onFocus,
    onCloneField,
    onSettingsClick,
    onTypeIndicatorClick,
    onDeleteClick,
    onFieldEdit,
    onFieldVisibilityClick,
    onFieldCalculationsClick,
    onFocusNextField,
    onFocusPrevField,
    onAddField,
    fieldProps,
    onUpdateFieldPositions,
    onLinkField,
    onUnlinkField,
    isReadOnly,
    ...props
  },
  ref,
) {
  const intl = useIntl();
  const isChildren = field.parent?.id !== undefined;
  const { elementRef, dragRef, previewRef, isDragging, isOverCurrent } = useDragAndDrop(
    field.id,
    index,
    onMove,
    field.isFixed ? "FIXED_FIELD" : isChildren ? "CHILDREN_FIELD" : "FIELD",
    field.type,
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

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
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
      event?.stopPropagation();
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

  const { sx, ...restProps } = props;

  const [isVisible, setIsVisible] = useState(
    petition.fields.length < 40 || index < 20 ? true : false,
  );
  // approximate height for lazy loading
  const height = useConstant(() => approximateFieldHeight(field));
  useEffect(() => {
    if (!isVisible) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        {
          root: document.getElementById("petition-layout-body"),
          rootMargin: "2000px 0px",
        },
      );
      const target = elementRef.current!;
      observer.observe(target);
      return () => observer.unobserve(target);
    }
  }, []);

  return (
    <Box
      ref={rootRef}
      id={`field-${field.id}`}
      data-section="compose-field"
      data-testid="compose-field"
      sx={{
        ...(isDragging && generateCssStripe({ size: "1rem", color: "gray.50" })),
        "> *": {
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.125s ease-in",
        },
      }}
      borderTop={index === 0 ? undefined : "1px solid"}
      borderColor="gray.200"
      aria-current={isActive ? "true" : "false"}
      position="relative"
      onFocus={onFocus}
      {...dropzoneRootProps}
      {...restProps}
    >
      {isVisible ? (
        <Box>
          <input type="file" {...getInputProps()} />
          {isDragActive && isOverCurrent ? (
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
            className={isChildren ? "petition-compose-field-children" : "petition-compose-field"}
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
              _active: {
                backgroundColor: "primary.50",
                ".field-actions": {
                  display: "flex",
                },
              },
              _hover: {
                "[draggable]": {
                  opacity: 1,
                },
                ".petition-compose-field-children [draggable]": {
                  opacity: 0,
                },
                backgroundColor: "gray.50",
                ".field-actions": {
                  display: "flex",
                },
                _active: {
                  backgroundColor: "primary.50",
                },
              },
              ...(sx ?? {}),
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
            <Stack spacing={1} flex="1">
              <Box position="relative">
                <PetitionComposeFieldInner
                  ref={ref}
                  flex="1"
                  paddingStart={3}
                  paddingTop={2}
                  paddingBottom={10}
                  paddingEnd={4}
                  user={user}
                  petition={petition}
                  field={field}
                  index={index}
                  fieldIndex={fieldIndex}
                  showError={showError}
                  attachmentUploadProgress={attachmentUploadProgress}
                  onFieldEdit={onFieldEdit}
                  onFocusNextField={onFocusNextField}
                  onFocusPrevField={onFocusPrevField}
                  onAddField={onAddField}
                  onRemoveAttachment={handleRemoveAttachment}
                  onDownloadAttachment={handleDownloadAttachment}
                  onTypeIndicatorClick={onTypeIndicatorClick}
                  onCloneField={onCloneField}
                  onDeleteClick={onDeleteClick}
                  onFieldVisibilityClick={onFieldVisibilityClick}
                  onFieldCalculationsClick={onFieldCalculationsClick}
                  onSettingsClick={onSettingsClick}
                  isReadOnly={isReadOnly}
                  fieldProps={fieldProps}
                  onUpdateFieldPositions={onUpdateFieldPositions}
                />
                <PetitionComposeFieldActions
                  field={field}
                  isActive={isActive}
                  canChangeVisibility={
                    isChildren ? canChangeVisibility && index > 0 : canChangeVisibility
                  }
                  onCloneField={onCloneField}
                  onSettingsClick={onSettingsClick}
                  onDeleteClick={onDeleteClick}
                  onVisibilityClick={onFieldVisibilityClick}
                  onFieldCalculationsClick={onFieldCalculationsClick}
                  onAttachmentClick={open}
                  className={isChildren ? "field-actions-children" : "field-actions"}
                  position="absolute"
                  bottom={0}
                  insetEnd={2}
                  onUnlinkField={onUnlinkField}
                  isReadOnly={isReadOnly}
                />
              </Box>

              {field.type === "FIELD_GROUP" ? (
                <PetitionComposeFieldGroupChildren
                  isReadOnly={isReadOnly}
                  showError={showError}
                  field={field}
                  user={user}
                  childrenFieldIndices={childrenFieldIndices!}
                  fieldRefs={fieldRefs!}
                  petition={petition}
                  activeChildFieldId={activeChildFieldId}
                  fieldProps={fieldProps}
                  onAddField={onAddField}
                  onUpdateFieldPositions={onUpdateFieldPositions}
                  onLinkField={onLinkField}
                  onUnlinkField={onUnlinkField}
                />
              ) : null}
            </Stack>
          </Box>
        </Box>
      ) : (
        <Box height={`${height}px`} />
      )}
    </Box>
  );
});

function approximateFieldHeight(
  field: Pick<PetitionField, "type" | "description" | "options" | "visibility"> & {
    attachments: any[];
    children?:
      | (Pick<PetitionField, "type" | "description" | "options" | "visibility"> & {
          attachments: any[];
        })[]
      | null;
  },
): number {
  return (
    8 +
    // title
    24 +
    4 +
    // description
    (1 + 19 * approxTextareaLines(field.description ?? "")) +
    (field.attachments.length > 0 ? 8 + 32 : 0) +
    // descriptive text
    (field.type === "CHECKBOX" ? 4 + 18 : 0) +
    // values max at 200px
    (field.type === "CHECKBOX" || field.type === "SELECT"
      ? 4 + Math.min(200, Math.max(1, (field.options.values ?? []).length) * 21)
      : 0) +
    (field.type === "DYNAMIC_SELECT"
      ? 8 + 21 + (field.options.file ? 4 + 24 + (field.options.labels.length - 1) * (4 + 24) : 0)
      : 0) +
    // visibility
    (field.visibility ? 4 + 37 : 0) +
    40 +
    // FIELD_GROUP
    (field.type === "FIELD_GROUP"
      ? 4 +
        (field.children!.length > 0 ? 1 + sumBy(field.children!, approximateFieldHeight) + 48 : 136)
      : 0)
  );
}

function approxTextareaLines(text: string) {
  let lines = 1;
  let current = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n" || ++current > 112) {
      lines++;
      current = 0;
    }
  }
  return lines;
}

interface PetitionComposeFieldInnerProps
  extends Pick<
    PetitionComposeFieldProps,
    | "user"
    | "field"
    | "fieldIndex"
    | "petition"
    | "showError"
    | "onTypeIndicatorClick"
    | "onFieldEdit"
    | "onFocusNextField"
    | "onFocusPrevField"
    | "onAddField"
    | "onCloneField"
    | "onSettingsClick"
    | "onDeleteClick"
    | "onFieldVisibilityClick"
    | "onFieldCalculationsClick"
    | "fieldProps"
    | "onUpdateFieldPositions"
  > {
  attachmentUploadProgress: Record<string, number>;
  onRemoveAttachment: (attachmentId: string) => void;
  onDownloadAttachment: (attachmentId: string) => void;
  index: number;
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
    user,
    field,
    fieldIndex,
    petition,
    showError,
    attachmentUploadProgress,
    onFieldEdit,
    onTypeIndicatorClick,
    onFocusNextField,
    onFocusPrevField,
    onAddField,
    onDownloadAttachment,
    onRemoveAttachment,
    onCloneField,
    onSettingsClick,
    onDeleteClick,
    onFieldVisibilityClick,
    fieldProps,
    onUpdateFieldPositions,
    onFieldCalculationsClick,
    index,
    isReadOnly,
    ...props
  },
  ref,
) {
  const intl = useIntl();
  const isChildren = field.parent?.id !== undefined;
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
          } else {
            focusDescription(true);
          }
        },
      }) as PetitionComposeFieldRef,
    [field.id, field.type, (field.description ?? "").length > 0],
  );

  const letter = letters();
  const previousVisibility = usePrevious(field.visibility);
  const showRestrictedPetitionFieldAlert =
    field.type === "BACKGROUND_CHECK" && !user.hasBackgroundCheck;

  return (
    <Stack spacing={1} ref={elementRef} {...props}>
      <Stack direction="row" spacing={2.5} alignItems="center">
        <PetitionFieldTypeIndicator
          type={field.type}
          fieldIndex={fieldIndex}
          as="button"
          onClick={onTypeIndicatorClick}
        />
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
                  focusDescription(true);
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
            className={isChildren ? "field-actions-children" : "field-actions"}
            display="flex"
            alignItems="center"
            width="auto"
            height="24px"
            isDisabled={isReadOnly}
          >
            <FormLabel htmlFor={`field-required-${field.id}`} fontWeight="normal" marginBottom="0">
              <FormattedMessage
                id="component.petition-compose-field.required-label"
                defaultMessage="Required"
              />
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
              isDisabled={isReadOnly || index === 0}
            />
          </FormControl>
        )}
      </Stack>
      <Stack paddingStart={14}>
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
                <Stack as="ol" spacing={1} marginTop={1}>
                  {((field.options.labels ?? []) as string[]).map((label, index) => (
                    <HStack as="li" key={index} alignItems="center">
                      <Center
                        height="20px"
                        minWidth="26px"
                        fontSize="xs"
                        paddingX={1}
                        borderRadius="sm"
                        border="1px solid"
                        borderColor={color}
                      >
                        {`${fieldIndex}${letter.next().value}`}
                      </Center>
                      <Text as="span">{label}</Text>
                    </HStack>
                  ))}
                </Stack>
              </>
            ) : (
              <Text color={showError ? "red.500" : "gray.600"} fontSize="sm">
                <FormattedMessage
                  id="component.petition-compose-field.dynamic-select-not-configured"
                  defaultMessage="Click on field settings to configure this field"
                />
                <Text as="span" marginStart={1} position="relative" top="-1px">
                  (<SettingsIcon />)
                </Text>
              </Text>
            )}
          </Box>
        ) : null}
      </Stack>

      {showRestrictedPetitionFieldAlert ? (
        <RestrictedPetitionFieldAlert fieldType={field.type} />
      ) : null}

      {field.visibility ? (
        <Box paddingTop={1}>
          <PetitionComposeFieldVisibilityAccordion isOpen={previousVisibility === null}>
            <PetitionFieldVisibilityEditor
              field={field}
              petition={petition}
              showErrors={showError}
              onVisibilityEdit={(visibility) => onFieldEdit({ visibility })}
              isReadOnly={isReadOnly}
            />
          </PetitionComposeFieldVisibilityAccordion>
        </Box>
      ) : null}
      {field.math ? (
        <Box paddingTop={1}>
          <PetitionComposeFieldVariablesAccordion
            isOpen={false}
            onEditClick={onFieldCalculationsClick}
            isReadOnly={isReadOnly}
          >
            <PetitionFieldMathEditor
              field={field}
              petition={petition}
              showErrors={showError}
              onMathChange={(visibility) => {}}
              isReadOnly={true}
            />
          </PetitionComposeFieldVariablesAccordion>
        </Box>
      ) : null}
    </Stack>
  );
});

interface PetitionComposeFieldActionsProps
  extends Pick<
    PetitionComposeFieldProps,
    | "field"
    | "onCloneField"
    | "onSettingsClick"
    | "onDeleteClick"
    | "onUnlinkField"
    | "onFieldCalculationsClick"
  > {
  isActive: boolean;
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
      onFieldCalculationsClick,
      onAttachmentClick,
      onCloneField,
      onSettingsClick,
      onDeleteClick,
      onUnlinkField,
      isReadOnly,
      isActive,
      ...props
    },
    ref,
  ) {
    const intl = useIntl();
    const isChildren = field.parent?.id !== undefined;
    const hasCondition = field.visibility;
    const hasMath = field.math;
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
                {isChildren ? (
                  <FormattedMessage
                    id="component.petition-compose-field.conditions-not-available-first-field-group"
                    defaultMessage="You cannot set conditions for the first field in a group. Reorder the fields or add a new one before it to set conditions between them."
                  />
                ) : (
                  <FormattedMessage
                    id="component.petition-compose-field.conditions-not-enough-fields"
                    defaultMessage="You can only add conditions based on previous fields. Add more fields to be able to set conditions between them."
                  />
                )}
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
        {hasMath ? (
          <ConfimationPopover
            description={
              <FormattedMessage
                id="component.petition-compose-field.confirm-remove-math"
                defaultMessage="Do you want to remove all the calculations?"
              />
            }
            confirm={
              <Button onClick={() => onFieldCalculationsClick(true)} size="sm" colorScheme="red">
                <FormattedMessage id="generic.remove" defaultMessage="Remove" />
              </Button>
            }
          >
            <IconButtonWithTooltip
              isDisabled={isReadOnly}
              icon={<CalculatorIcon />}
              size="sm"
              variant="ghost"
              placement="bottom"
              color="primary.500"
              label={intl.formatMessage({
                id: "component.petition-compose-field.remove-calculations",
                defaultMessage: "Remove calculations",
              })}
              onClick={onSettingsClick}
            />
          </ConfimationPopover>
        ) : (
          <IconButtonWithTooltip
            isDisabled={isReadOnly}
            icon={<CalculatorIcon />}
            size="sm"
            variant="ghost"
            placement="bottom"
            color="gray.600"
            label={intl.formatMessage({
              id: "component.petition-compose-field.add-calculation",
              defaultMessage: "Add calculation",
            })}
            onClick={() => onFieldCalculationsClick()}
          />
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
        {isChildren ? (
          <ConfimationPopover
            description={
              <FormattedMessage
                id="component.petition-compose-field.unlink-question"
                defaultMessage="Do you want to remove this field from the group?"
              />
            }
            confirm={
              <Button
                onClick={() => onUnlinkField(field.parent!.id, [field.id])}
                size="sm"
                colorScheme="red"
              >
                <FormattedMessage
                  id="component.petition-compose-field.unlink-button"
                  defaultMessage="Remove from group"
                />
              </Button>
            }
          >
            <IconButtonWithTooltip
              icon={<UnlinkIcon boxSize={4} />}
              onClick={onSettingsClick}
              isDisabled={isReadOnly}
              size="sm"
              variant="ghost"
              placement="bottom"
              color="gray.600"
              label={intl.formatMessage({
                id: "component.petition-compose-field.unlink-button",
                defaultMessage: "Remove from group",
              })}
            />
          </ConfimationPopover>
        ) : (
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
        )}
      </Stack>
    );
  },
);

const fragments = {
  get User() {
    return gql`
      fragment PetitionComposeField_User on User {
        id
        hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
        ...PetitionComposeFieldGroupChildren_User
      }
      ${PetitionComposeFieldGroupChildren.fragments.User}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment PetitionComposeField_PetitionBase on PetitionBase {
        id
        fields {
          isReadOnly
        }
        ...PetitionFieldVisibilityEditor_PetitionBase
      }
      ${PetitionFieldVisibilityEditor.fragments.PetitionBase}
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
        math
        children {
          type
          description
          options
          visibility
          attachments {
            id
          }
        }
        attachments {
          ...PetitionComposeField_PetitionFieldAttachment
        }
        parent {
          id
        }
        ...PetitionFieldOptionsListEditor_PetitionField
        ...PetitionComposeFieldGroupChildren_PetitionField
        ...PetitionFieldVisibilityEditor_PetitionField
      }
      ${this.PetitionFieldAttachment}
      ${PetitionFieldOptionsListEditor.fragments.PetitionField}
      ${PetitionFieldVisibilityEditor.fragments.PetitionField}
      ${PetitionComposeFieldGroupChildren.fragments.PetitionField}
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
            petition {
              id
              lastChangeAt
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
        petition {
          id
          lastChangeAt
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
  fieldType: PetitionFieldType;
  files?: any;
}

function useDragAndDrop(
  id: string,
  index: number,
  onMove?: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void,
  type = "FIELD",
  fieldType?: PetitionFieldType,
) {
  const elementRef = useRef<HTMLDivElement>(null);

  const acceptedType = type === "CHILDREN_FIELD" ? "CHILDREN_FIELD" : "FIELD";

  const [{ isOverCurrent }, drop] = useDrop<DragItem, unknown, any>({
    accept: [acceptedType, NativeTypes.FILE],
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
    hover(item, monitor) {
      // if is dragging files over do nothing
      if (isDefined(item.files)) return;

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
      // If the target is a field group, only move when the cursor is above 25px or below 25px
      const hasReachedBottom =
        fieldType === "FIELD_GROUP"
          ? hoverClientY < hoverBoundingRect.bottom - hoverBoundingRect.top - 25
          : hoverClientY < hoverMiddleY;
      const hasReachedTop =
        fieldType === "FIELD_GROUP" ? hoverClientY > 25 : hoverClientY > hoverMiddleY;

      // Dragging downwards
      if (dragIndex < hoverIndex && hasReachedBottom) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hasReachedTop) {
        return;
      }

      if (type === acceptedType) {
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
    type: acceptedType,
    item: { type, id, index, fieldType },
    canDrag: () => type === acceptedType,
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
  return { elementRef, dragRef, previewRef, isDragging, isOverCurrent };
}

interface PetitionComposeFieldVisibilityAccordionProps {
  isOpen: boolean;
}

const PetitionComposeFieldVisibilityAccordion = chakraForwardRef<
  "div",
  PetitionComposeFieldVisibilityAccordionProps
>(function PetitionComposeFieldVisibilityAccordion({ isOpen, children }, ref) {
  return (
    <Accordion
      defaultIndex={isOpen ? [0] : undefined}
      allowToggle
      reduceMotion
      borderRadius="md"
      backgroundColor="gray.100"
      border="none"
      ref={ref}
    >
      <AccordionItem border="none">
        {({ isExpanded }) => {
          return (
            <>
              <Heading>
                <AccordionButton borderRadius="md" paddingY={3}>
                  <HStack as="span" flex="1" textAlign="left" fontSize="sm" spacing={1}>
                    <ChevronFilledIcon
                      color="gray.500"
                      fontSize="xs"
                      transform={isExpanded ? "rotate(90deg)" : undefined}
                      marginEnd={2}
                    />
                    <ConditionIcon />
                    <FormattedMessage
                      id="component.petition-compose-field.visibility-title"
                      defaultMessage="Visibility conditions"
                    />
                    <HelpPopover marginStart={1}>
                      <Text fontSize="sm">
                        <FormattedMessage
                          id="component.petition-compose-field.visibility-help"
                          defaultMessage="This field will only be shown or hidden when the conditions are met."
                        />
                      </Text>
                      <Text fontSize="sm">
                        <HelpCenterLink articleId={6076369}>
                          <FormattedMessage id="generic.learn-more" defaultMessage="Learn more" />
                        </HelpCenterLink>
                      </Text>
                    </HelpPopover>
                  </HStack>
                </AccordionButton>
              </Heading>
              <AccordionPanel padding={0}>{isExpanded ? children : null}</AccordionPanel>
            </>
          );
        }}
      </AccordionItem>
    </Accordion>
  );
});

interface PetitionComposeFieldVariablesAccordionProps {
  isOpen: boolean;
  isReadOnly?: boolean;
  onEditClick: () => void;
}

const PetitionComposeFieldVariablesAccordion = chakraForwardRef<
  "div",
  PetitionComposeFieldVariablesAccordionProps
>(function PetitionComposeFieldVariablesAccordion(
  { isOpen, onEditClick, isReadOnly, children },
  ref,
) {
  return (
    <Accordion
      defaultIndex={isOpen ? [0] : undefined}
      allowToggle
      reduceMotion
      borderRadius="md"
      backgroundColor="purple.75"
      border="none"
      ref={ref}
    >
      <AccordionItem border="none">
        {({ isExpanded }) => {
          return (
            <>
              <Heading position="relative">
                <AccordionButton borderRadius="md" backgroundColor="purple.75" paddingY={3}>
                  <HStack as="span" flex="1" textAlign="left" fontSize="sm" spacing={1}>
                    <ChevronFilledIcon
                      color="gray.500"
                      fontSize="xs"
                      transform={isExpanded ? "rotate(90deg)" : undefined}
                      marginEnd={2}
                    />
                    <CalculatorIcon />
                    <FormattedMessage
                      id="component.petition-compose-field.calculations-title"
                      defaultMessage="Calculations"
                    />
                    <HelpPopover marginStart={1}>
                      <Text fontSize="sm">
                        <FormattedMessage
                          id="component.petition-compose-field.calculations-help"
                          defaultMessage="This field will perform calculations when the conditions are met."
                        />
                      </Text>
                      <Text fontSize="sm">
                        <HelpCenterLink articleId={8574972}>
                          <FormattedMessage id="generic.learn-more" defaultMessage="Learn more" />
                        </HelpCenterLink>
                      </Text>
                    </HelpPopover>
                  </HStack>
                </AccordionButton>
                {!isReadOnly ? (
                  <Flex position="absolute" insetEnd={3} top={1}>
                    <Button
                      background="white"
                      size="sm"
                      fontSize="md"
                      fontWeight={400}
                      onClick={() => onEditClick()}
                    >
                      <FormattedMessage id="generic.edit" defaultMessage="Edit" />
                    </Button>
                  </Flex>
                ) : null}
              </Heading>
              <AccordionPanel paddingY={0} paddingX={3} paddingBottom={2}>
                {isExpanded ? children : null}
              </AccordionPanel>
            </>
          );
        }}
      </AccordionItem>
    </Accordion>
  );
});
