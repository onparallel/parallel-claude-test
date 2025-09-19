import { DataProxy, gql, useMutation } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  HStack,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import {
  AddIcon,
  BackCoverIcon,
  ChevronDownIcon,
  ConditionIcon,
  DeleteIcon,
  DownloadIcon,
  DragHandleIcon,
  EyeIcon,
  FrontCoverIcon,
  PaperclipIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { FileSize } from "@parallel/components/common/FileSize";
import {
  PetitionAttachmentType,
  PetitionComposeAttachments_createPetitionAttachmentUploadLinkDocument,
  PetitionComposeAttachments_deletePetitionAttachmentDocument,
  PetitionComposeAttachments_petitionAttachmentDownloadLinkDocument,
  PetitionComposeAttachments_PetitionAttachmentFragment,
  PetitionComposeAttachments_petitionAttachmentUploadCompleteDocument,
  PetitionComposeAttachments_PetitionBaseFragment,
  PetitionComposeAttachments_PetitionBaseFragmentDoc,
  PetitionComposeAttachments_reorderPetitionAttachmentsDocument,
  PetitionComposeAttachments_updatePetitionAttachmentTypeDocument,
  PetitionComposeAttachments_updatePetitionAttachmentVisibilityDocument,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { PetitionFieldVisibility } from "@parallel/utils/fieldLogic/types";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { uploadFile, UploadFileError } from "@parallel/utils/uploadFile";
import { useHasRemovePreviewFiles } from "@parallel/utils/useHasRemovePreviewFiles";
import { useIsAnimated } from "@parallel/utils/useIsAnimated";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { useIsMouseOver } from "@parallel/utils/useIsMouseOver";
import useMergedRef from "@react-hook/merged-ref";
import { fromEvent } from "file-selector";
import { MotionConfig, Reorder, useDragControls, useMotionValue } from "framer-motion";
import pMap from "p-map";
import { useEffect, useRef, useState } from "react";
import { DropEvent, FileRejection, useDropzone } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, omit, sumBy, uniqueBy, zip } from "remeda";
import { noop } from "ts-essentials";
import { CloseableAlert } from "../common/CloseableAlert";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { Divider } from "../common/Divider";
import { FileName } from "../common/FileName";
import { HelpCenterLink } from "../common/HelpCenterLink";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { RestrictedFeaturePopover } from "../common/RestrictedFeaturePopover";
import { PetitionComposeVisibilityAccordion } from "../petition-common/PetitionComposeVisibilityAccordion";
import { PetitionVisibilityEditor } from "./logic/PetitionVisibilityEditor";
import { PetitionComposeDragActiveIndicator } from "./PetitionComposeDragActiveIndicator";

const MAX_FILE_SIZE = 1024 * 1024 * 50;
const TOTAL_MAX_FILES_SIZE = 1024 * 1024 * 10;

export interface PetitionComposeAttachmentsProps {
  petition: PetitionComposeAttachments_PetitionBaseFragment;
  isReadOnly?: boolean;
}

export const PetitionComposeAttachments = Object.assign(
  chakraForwardRef<"div", PetitionComposeAttachmentsProps>(function PetitionComposeAttachments(
    { petition, isReadOnly, ...props },
    ref,
  ) {
    const intl = useIntl();

    const petitionId = petition.id;
    const attachmentsList = petition.attachmentsList;
    const isTemplate = petition?.__typename === "PetitionTemplate";
    const hasDocumentFieldsWithAttachments = petition.fields.some(
      (field) => isFileTypeField(field.type) && field.options.attachToPdf,
    );
    const { FRONT, ANNEX, BACK } = attachmentsList;

    const [front, setFront] = useState(FRONT);
    const [annex, setAnnex] = useState(ANNEX);
    const [back, setBack] = useState(BACK);

    const allAttachments = [...front, ...annex, ...back];

    const totalMaxFilesSizeExceeded =
      sumBy(
        allAttachments.filter((item) => item.file.isComplete),
        (item) => item.file.size,
      ) > TOTAL_MAX_FILES_SIZE;

    const uploads = useRef<Record<string, AbortController>>({});
    const [attachmentUploadProgress, setAttachmentUploadProgress] = useState<
      Record<string, number>
    >({});

    const [createPetitionAttachmentUploadLink] = useMutation(
      PetitionComposeAttachments_createPetitionAttachmentUploadLinkDocument,
    );
    const [petitionAttachmentUploadComplete] = useMutation(
      PetitionComposeAttachments_petitionAttachmentUploadCompleteDocument,
    );

    const [deletePetitionAttachment] = useMutation(
      PetitionComposeAttachments_deletePetitionAttachmentDocument,
    );

    const [petitionAttachmentDownloadLink] = useMutation(
      PetitionComposeAttachments_petitionAttachmentDownloadLinkDocument,
    );

    const [reorderPetitionAttachments] = useMutation(
      PetitionComposeAttachments_reorderPetitionAttachmentsDocument,
    );

    const [updatePetitionAttachmentType] = useMutation(
      PetitionComposeAttachments_updatePetitionAttachmentTypeDocument,
    );

    useEffect(() => {
      setFront(FRONT);
      setAnnex(ANNEX);
      setBack(BACK);
    }, [attachmentsList]);

    function updateAttachmentUploadingStatus(
      cache: DataProxy,
      attachment: PetitionComposeAttachments_PetitionAttachmentFragment,
    ) {
      updateFragment(cache, {
        fragment: PetitionComposeAttachments_PetitionBaseFragmentDoc,
        fragmentName: "PetitionComposeAttachments_PetitionBase",
        id: petitionId,
        data: (data) => ({
          ...data!,
          attachmentsList: {
            ...data!.attachmentsList,
            ANNEX: uniqueBy([...data!.attachmentsList.ANNEX, attachment], (obj) => obj.id),
          },
        }),
      });
    }

    const handleRemoveAttachment = async function (attachmentId: string) {
      uploads.current[attachmentId]?.abort();
      delete uploads.current[attachmentId];
      await deletePetitionAttachment({
        variables: { petitionId, attachmentId },
      });
    };

    const handleDownloadAttachment = async function (attachmentId: string, preview: boolean) {
      await withError(
        openNewWindow(async () => {
          const { data } = await petitionAttachmentDownloadLink({
            variables: { petitionId, attachmentId, preview },
          });
          const { url } = data!.petitionAttachmentDownloadLink;
          return url!;
        }),
      );
    };

    const handleReorderAttachments = async (
      attachmentType: PetitionAttachmentType,
      attachmentIds: string[],
    ) => {
      await reorderPetitionAttachments({
        variables: { petitionId, attachmentIds, attachmentType },
      });
    };

    const handleChangeType = async (
      attachmentId: string,
      fromType: PetitionAttachmentType,
      toType: PetitionAttachmentType,
    ) => {
      if (fromType !== toType) {
        await updatePetitionAttachmentType({
          variables: { petitionId, attachmentId, type: toType },
        });
      }
    };

    const [updatePetitionAttachmentVisibility] = useMutation(
      PetitionComposeAttachments_updatePetitionAttachmentVisibilityDocument,
    );

    const handleVisibilityChange = async (
      attachmentId: string,
      visibility: PetitionFieldVisibility | null,
    ) => {
      await updatePetitionAttachmentVisibility({
        variables: { petitionId, attachmentId, visibility },
      });
    };

    const showErrorDialog = useErrorDialog();
    const [draggedFiles, setDraggedFiles] = useState<(File | DataTransferItem)[]>([]);
    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
      accept: {
        "application/pdf": [],
      },
      maxSize: MAX_FILE_SIZE,
      maxFiles: 10 - allAttachments.length,
      disabled: isReadOnly,
      onDropRejected: async (files: FileRejection[], event: DropEvent) => {
        if (allAttachments.length + files.length > 10) {
          // on drop event already shows a message on the dropzone, if its not type="drop" means the
          // file is coming from the "Add attachment" button which doesn't provide any feedback
          if (event?.type !== "drop") {
            await withError(
              showErrorDialog({
                header: (
                  <FormattedMessage
                    id="component.petition-compose-attachments.too-many-attachments-header"
                    defaultMessage="Too many attachments"
                  />
                ),
                message: (
                  <FormattedMessage
                    id="component.petition-compose-attachments.too-many-attachments"
                    defaultMessage="A maximum of {count, plural, =1 {one attachment} other {# attachments}} can be added"
                    values={{ count: 10 }}
                  />
                ),
              }),
            );
          }

          return;
        }
        await withError(
          showErrorDialog({
            header: (
              <FormattedMessage
                id="component.petition-compose-attachments.invalid-attachment-header"
                defaultMessage="Invalid attachment"
              />
            ),
            message: (
              <FormattedMessage
                id="component.petition-compose-attachments.invalid-attachment-message"
                defaultMessage="Only PDF attachments up to {size} are allowed."
                values={{ size: <FileSize value={MAX_FILE_SIZE} /> }}
              />
            ),
          }),
        );
      },
      onDrop: async (files: File[], filesRejection: FileRejection[]) => {
        if (allAttachments.length + files.length + filesRejection.length > 10) {
          return;
        }
        if (files.length === 0) {
          return;
        }
        const { data } = await createPetitionAttachmentUploadLink({
          variables: {
            petitionId,
            type: "ANNEX",
            data: files.map((file) => ({
              filename: file.name,
              contentType: file.type,
              size: file.size,
            })),
          },
          update: async (cache, { data }) => {
            data!.createPetitionAttachmentUploadLink.forEach(({ attachment }) => {
              updateAttachmentUploadingStatus(cache, {
                ...attachment,
                isUploading: true,
              });
            });
          },
        });
        await pMap(
          zip(files, data!.createPetitionAttachmentUploadLink),
          async ([file, { presignedPostData, attachment }]) => {
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
                await deletePetitionAttachment({
                  variables: { petitionId, attachmentId: attachment.id },
                });
              }
              return;
            } finally {
              delete uploads.current[attachment.id];
            }
            await petitionAttachmentUploadComplete({
              variables: {
                petitionId: petitionId,
                attachmentId: attachment.id,
              },
              update: async (cache) => {
                updateAttachmentUploadingStatus(cache, { ...attachment, isUploading: false });
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
    const rootRef = useMergedRef(_rootProps.ref, ref);

    return (
      <Card
        ref={rootRef}
        id="petition-template-attachments"
        position="relative"
        {...dropzoneRootProps}
        {...props}
      >
        {isDragActive ? (
          <PetitionComposeDragActiveIndicator
            showErrorMessage={allAttachments.length + draggedFiles.length > 10}
            message={
              <FormattedMessage
                id="component.petition-compose-attachments.drop-files-to-attach"
                defaultMessage="Drop here your files to attach"
              />
            }
            errorMessage={
              <FormattedMessage
                id="component.petition-compose-attachments.too-many-attachments"
                defaultMessage="A maximum of {count, plural, =1 {one attachment} other {# attachments}} can be added"
                values={{ count: 10 }}
              />
            }
          />
        ) : null}
        <CardHeader
          rightAction={
            <RestrictedFeaturePopover
              isRestricted={allAttachments.length > 9}
              borderRadius="xl"
              content={
                <Text>
                  <FormattedMessage
                    id="component.petition-compose-attachments.files-limit-reached"
                    defaultMessage="The limit of {limit} attachments has been reached."
                    values={{ limit: 10 }}
                  />
                </Text>
              }
            >
              <IconButtonWithTooltip
                icon={<AddIcon />}
                label={intl.formatMessage({
                  id: "component.petition-compose-attachments.add-attachment",
                  defaultMessage: "Add attachment",
                })}
                onClick={open}
                isDisabled={allAttachments.length > 9 || isReadOnly}
              />
            </RestrictedFeaturePopover>
          }
        >
          <FormattedMessage
            id="component.petition-compose-attachments.header"
            defaultMessage="Document attachments"
          />
        </CardHeader>
        <Stack paddingY={4} paddingX={2}>
          <input type="file" {...getInputProps()} />
          {allAttachments.length > 0 ? (
            <MotionConfig reducedMotion="always">
              <Stack spacing={2} divider={<Divider />}>
                {[
                  ["FRONT", front, setFront] as const,
                  ["ANNEX", annex, setAnnex] as const,
                  ["BACK", back, setBack] as const,
                ].map(([position, list, setList]) =>
                  list.length > 0 ? (
                    <Stack
                      key={position}
                      listStyleType="none"
                      as={Reorder.Group}
                      axis="y"
                      values={list}
                      onReorder={setList as any}
                    >
                      {list.map((item, i) => {
                        return (
                          <AttachmentItem
                            key={item.id}
                            item={item}
                            index={i}
                            progress={attachmentUploadProgress[item.id]}
                            isDraggable={list.length > 1}
                            isDisabled={isReadOnly}
                            petition={petition}
                            visibility={item.visibility as any}
                            onRemove={handleRemoveAttachment}
                            onPreview={handleDownloadAttachment}
                            onChangeType={handleChangeType}
                            onDragEnd={() =>
                              handleReorderAttachments(
                                position,
                                list.map((item) => item.id),
                              )
                            }
                            onVisibilityChange={async (id, visibility) => {
                              await handleVisibilityChange(id, visibility);
                            }}
                          />
                        );
                      })}
                    </Stack>
                  ) : null,
                )}
              </Stack>
            </MotionConfig>
          ) : (
            <Text width="100%" textAlign="center" color="gray.500">
              <FormattedMessage
                id="component.petition-compose-attachments.no-attachments-uploaded"
                defaultMessage="No attachments have been uploaded yet"
              />
            </Text>
          )}
          {totalMaxFilesSizeExceeded || hasDocumentFieldsWithAttachments ? (
            <Box>
              {totalMaxFilesSizeExceeded ? (
                <CloseableAlert status="warning" rounded="md" marginTop={4}>
                  <AlertIcon />
                  <AlertDescription flex={1}>
                    <FormattedMessage
                      id="component.petition-compose-attachments.large-files-alert"
                      defaultMessage="<b>Heavy files.</b> Large files may cause problems when starting the signature. We recommend to compress the uploaded files and not to exceed {size}."
                      values={{ size: <FileSize value={TOTAL_MAX_FILES_SIZE} /> }}
                    />
                  </AlertDescription>
                </CloseableAlert>
              ) : null}
              {hasDocumentFieldsWithAttachments ? (
                <CloseableAlert status="info" rounded="md" marginTop={4}>
                  <AlertIcon />
                  <AlertDescription flex={1}>
                    <FormattedMessage
                      id="component.petition-compose-attachments.petition-with-document-fields-alert"
                      defaultMessage="{type, select, TEMPLATE {This template} other {This parallel}} has document fields set up to attach your responses to the pdf. They will be included in the final document after the attachments."
                      values={{ type: isTemplate ? "TEMPLATE" : "PETITION" }}
                    />
                  </AlertDescription>
                </CloseableAlert>
              ) : null}
            </Box>
          ) : null}
        </Stack>
      </Card>
    );
  }),
  {
    fragments: {
      get PetitionAttachment() {
        return gql`
          fragment PetitionComposeAttachments_PetitionAttachment on PetitionAttachment {
            id
            type
            file {
              filename
              size
              isComplete
            }
            isUploading @client
            visibility
          }
        `;
      },
      get PetitionAttachmentsList() {
        return gql`
          fragment PetitionComposeAttachments_PetitionAttachmentsList on PetitionAttachmentsList {
            FRONT {
              ...PetitionComposeAttachments_PetitionAttachment
            }
            ANNEX {
              ...PetitionComposeAttachments_PetitionAttachment
            }
            BACK {
              ...PetitionComposeAttachments_PetitionAttachment
            }
          }
          ${this.PetitionAttachment}
        `;
      },
      get PetitionBase() {
        return gql`
          fragment PetitionComposeAttachments_PetitionBase on PetitionBase {
            id
            fields {
              id
              type
              isReadOnly
              options
              visibility
              ...PetitionVisibilityEditor_PetitionField
              children {
                id
                type
                visibility
                ...PetitionVisibilityEditor_PetitionField
              }
            }
            attachmentsList {
              ...PetitionComposeAttachments_PetitionAttachmentsList
            }
            lastChangeAt
            ...PetitionVisibilityEditor_PetitionBase
          }
          ${this.PetitionAttachmentsList}
          ${PetitionVisibilityEditor.fragments.PetitionBase}
          ${PetitionVisibilityEditor.fragments.PetitionField}
        `;
      },
    },
  },
);

const _mutations = [
  gql`
    mutation PetitionComposeAttachments_reorderPetitionAttachments(
      $petitionId: GID!
      $attachmentType: PetitionAttachmentType!
      $attachmentIds: [GID!]!
    ) {
      reorderPetitionAttachments(
        petitionId: $petitionId
        attachmentType: $attachmentType
        attachmentIds: $attachmentIds
      ) {
        ...PetitionComposeAttachments_PetitionBase
      }
    }
    ${PetitionComposeAttachments.fragments.PetitionBase}
  `,
  gql`
    mutation PetitionComposeAttachments_createPetitionAttachmentUploadLink(
      $petitionId: GID!
      $data: [FileUploadInput!]!
      $type: PetitionAttachmentType!
    ) {
      createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data, type: $type) {
        presignedPostData {
          ...uploadFile_AWSPresignedPostData
        }
        attachment {
          ...PetitionComposeAttachments_PetitionAttachment
          petition {
            id
            lastChangeAt
          }
        }
      }
    }
    ${uploadFile.fragments.AWSPresignedPostData}
    ${PetitionComposeAttachments.fragments.PetitionAttachment}
  `,
  gql`
    mutation PetitionComposeAttachments_updatePetitionAttachmentType(
      $petitionId: GID!
      $attachmentId: GID!
      $type: PetitionAttachmentType!
    ) {
      updatePetitionAttachmentType(
        petitionId: $petitionId
        attachmentId: $attachmentId
        type: $type
      ) {
        ...PetitionComposeAttachments_PetitionAttachment
        petition {
          ...PetitionComposeAttachments_PetitionBase
        }
      }
    }
    ${PetitionComposeAttachments.fragments.PetitionAttachment}
    ${PetitionComposeAttachments.fragments.PetitionBase}
  `,
  gql`
    mutation PetitionComposeAttachments_petitionAttachmentUploadComplete(
      $petitionId: GID!
      $attachmentId: GID!
    ) {
      petitionAttachmentUploadComplete(petitionId: $petitionId, attachmentId: $attachmentId) {
        ...PetitionComposeAttachments_PetitionAttachment
        petition {
          ...PetitionComposeAttachments_PetitionBase
        }
      }
    }
    ${PetitionComposeAttachments.fragments.PetitionAttachment}
    ${PetitionComposeAttachments.fragments.PetitionBase}
  `,
  gql`
    mutation PetitionComposeAttachments_deletePetitionAttachment(
      $petitionId: GID!
      $attachmentId: GID!
    ) {
      deletePetitionAttachment(petitionId: $petitionId, attachmentId: $attachmentId) {
        ...PetitionComposeAttachments_PetitionBase
      }
    }
    ${PetitionComposeAttachments.fragments.PetitionBase}
  `,
  gql`
    mutation PetitionComposeAttachments_petitionAttachmentDownloadLink(
      $petitionId: GID!
      $attachmentId: GID!
      $preview: Boolean
    ) {
      petitionAttachmentDownloadLink(
        petitionId: $petitionId
        attachmentId: $attachmentId
        preview: $preview
      ) {
        url
      }
    }
  `,
  gql`
    mutation PetitionComposeAttachments_updatePetitionAttachmentVisibility(
      $petitionId: GID!
      $attachmentId: GID!
      $visibility: JSONObject
    ) {
      updatePetitionAttachmentVisibility(
        petitionId: $petitionId
        attachmentId: $attachmentId
        visibility: $visibility
      ) {
        id
        visibility
      }
    }
  `,
];

interface AttachmentItemProps {
  item: PetitionComposeAttachments_PetitionAttachmentFragment;
  index: number;
  progress: number;
  isDraggable: boolean;
  isDisabled?: boolean;
  petition: PetitionComposeAttachments_PetitionBaseFragment;
  visibility?: PetitionFieldVisibility | null;
  isEditingVisibility?: boolean;
  onRemove: (id: string) => Promise<void>;
  onPreview: (id: string, preview: boolean) => void;
  onChangeType: (
    id: string,
    fromType: PetitionAttachmentType,
    toType: PetitionAttachmentType,
  ) => void;
  onDragEnd: () => void;
  onVisibilityChange: (id: string, visibility: PetitionFieldVisibility | null) => void;
}

const AttachmentItem = chakraForwardRef<"div", AttachmentItemProps>(function AttachmentItem(
  {
    item,
    index,
    progress,
    isDraggable,
    isDisabled,
    petition,
    visibility,
    onRemove,
    onPreview,
    onChangeType,
    onDragEnd,
    onVisibilityChange,
    ...props
  },
  ref,
) {
  const intl = useIntl();
  const userHasRemovePreviewFiles = useHasRemovePreviewFiles();
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const isAnimated = useIsAnimated(y);

  const previewRef = useRef<HTMLButtonElement>(null);
  const isMouseOver = useIsMouseOver(previewRef);
  const isShiftDown = useIsGlobalKeyDown("Shift");

  const [hasVisibilityConditions, setHasVisibilityConditions] = useState(isNonNullish(visibility));

  useEffect(() => {
    setHasVisibilityConditions(isNonNullish(visibility));
  }, [visibility]);

  const { type, file, isUploading, id } = item;
  const { filename, size, isComplete } = file;

  const menuIcon =
    type === "FRONT" ? (
      <FrontCoverIcon />
    ) : type === "ANNEX" ? (
      <PaperclipIcon />
    ) : (
      <BackCoverIcon />
    );
  const buttonColor = type === "FRONT" || type === "BACK" ? "tags.brown" : "tags.green";

  const uploadHasFailed = !isUploading && !isComplete;

  const menuButtonLabel =
    type === "FRONT"
      ? intl.formatMessage({
          id: "component.petition-compose-attachments.cover",
          defaultMessage: "Cover",
        })
      : type === "ANNEX"
        ? intl.formatMessage({
            id: "component.petition-compose-attachments.annex",
            defaultMessage: "Annex",
          })
        : intl.formatMessage({
            id: "component.petition-compose-attachments.back-cover",
            defaultMessage: "Back cover",
          });

  // only allow visibility changes when there at least one field where conditions can be applied
  const canChangeVisibility = petition.fields.filter((f) => !f.isReadOnly).length > 0;

  return (
    <Reorder.Item
      key={item.id}
      value={item}
      dragListener={false}
      dragControls={dragControls}
      style={{ y }}
      onDragEnd={onDragEnd}
    >
      <Stack
        shadow={isAnimated ? "short" : undefined}
        spacing={0}
        backgroundColor="white"
        _hover={{ backgroundColor: "gray.50" }}
        borderRadius="md"
      >
        <HStack
          ref={ref}
          paddingStart={5}
          paddingEnd={3}
          transitionProperty="all"
          transitionDuration="320ms"
          sx={{
            ".drag-handle": {
              opacity: isAnimated ? 1 : 0,
              transition: "opacity 150ms",
            },
            "&:hover .drag-handle": {
              opacity: 1,
            },
          }}
          position="relative"
          userSelect={isDisabled ? undefined : "none"}
          {...props}
        >
          <Box
            className="drag-handle"
            position="absolute"
            insetStart={1}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            cursor={isDraggable && !isDisabled ? "grab" : "not-allowed"}
            color="gray.400"
            _hover={{
              color: isDraggable && !isDisabled ? "gray.700" : "gray.400",
            }}
            aria-label={intl.formatMessage({
              id: "component.petition-compose-attachments.drag-to-sort-label",
              defaultMessage: "Drag to sort this attachment",
            })}
            onPointerDown={(event) =>
              isDraggable && !isDisabled ? dragControls.start(event) : noop
            }
          >
            <DragHandleIcon role="presentation" pointerEvents="none" boxSize={3} />
          </Box>
          <Menu>
            <Box>
              <MenuButton
                as={Button}
                backgroundColor={buttonColor}
                _hover={{
                  backgroundColor: buttonColor,
                }}
                _active={{
                  backgroundColor: buttonColor,
                }}
                size="xs"
                aria-label={menuButtonLabel}
                leftIcon={menuIcon}
                rightIcon={<ChevronDownIcon marginStart={-2} />}
                isDisabled={isDisabled}
              />
            </Box>
            <Portal>
              <MenuList>
                <MenuItem
                  icon={<FrontCoverIcon />}
                  onClick={() => onChangeType(id, item.type, "FRONT")}
                >
                  <FormattedMessage
                    id="component.petition-compose-attachments.cover"
                    defaultMessage="Cover"
                  />
                </MenuItem>
                <MenuItem
                  icon={<PaperclipIcon />}
                  onClick={() => onChangeType(id, item.type, "ANNEX")}
                >
                  <FormattedMessage
                    id="component.petition-compose-attachments.annex"
                    defaultMessage="Annex"
                  />
                </MenuItem>
                <MenuItem
                  icon={<BackCoverIcon />}
                  onClick={() => onChangeType(id, item.type, "BACK")}
                >
                  <FormattedMessage
                    id="component.petition-compose-attachments.back-cover"
                    defaultMessage="Back cover"
                  />
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
          <HStack flex="1" minWidth="0px">
            <Text as="span" fontSize="sm" fontWeight={500} whiteSpace="nowrap">
              {type === "FRONT" ? (
                <FormattedMessage
                  id="component.petition-compose-attachments.prefix-cover"
                  defaultMessage="Cover {index}:"
                  values={{ index: index + 1 }}
                />
              ) : type === "BACK" ? (
                <FormattedMessage
                  id="component.petition-compose-attachments.prefix-back-cover"
                  defaultMessage="Back cover {index}:"
                  values={{ index: index + 1 }}
                />
              ) : (
                <FormattedMessage
                  id="component.petition-compose-attachments.prefix-annex"
                  defaultMessage="Annex {index}:"
                  values={{ index: index + 1 }}
                />
              )}
            </Text>
            <FileName value={filename} fontSize="sm" fontWeight="400" />
            <Text as="span" marginX={2}>
              -
            </Text>
            <Text as="span" fontSize="sm" color="gray.500" marginStart={1} whiteSpace="nowrap">
              <FileSize value={size} />
            </Text>
            {!isComplete && progress ? (
              <Progress
                flex="1"
                borderRadius="full"
                minWidth="40px"
                isIndeterminate={progress === 1}
                value={progress * 100}
                size="sm"
                colorScheme="green"
              />
            ) : uploadHasFailed ? (
              <Text color="red.600" fontSize="sm">
                <FormattedMessage
                  id="component.petition-compose-attachments.file-incomplete"
                  defaultMessage="There was an error uploading the file. Please try again."
                />
              </Text>
            ) : null}
          </HStack>

          <HStack>
            <IconButtonWithTooltip
              icon={<ConditionIcon />}
              label={
                hasVisibilityConditions
                  ? intl.formatMessage({
                      id: "generic.remove-condition",
                      defaultMessage: "Remove condition",
                    })
                  : intl.formatMessage({
                      id: "generic.add-condition",
                      defaultMessage: "Add condition",
                    })
              }
              onClick={() => {
                setHasVisibilityConditions((prev) => !prev);
                if (hasVisibilityConditions) {
                  onVisibilityChange(id, null);
                }
              }}
              isDisabled={isDisabled || !canChangeVisibility}
              color={hasVisibilityConditions ? "primary.500" : "gray.600"}
              size="sm"
              variant="ghost"
            />
            <IconButtonWithTooltip
              ref={previewRef}
              size="sm"
              fontSize="md"
              icon={userHasRemovePreviewFiles ? <DownloadIcon /> : <EyeIcon />}
              label={
                userHasRemovePreviewFiles
                  ? intl.formatMessage({
                      id: "generic.download-file",
                      defaultMessage: "Download file",
                    })
                  : intl.formatMessage({
                      id: "component.petition-compose-attachments.preview",
                      defaultMessage: "Preview file. ⇧ + click to download",
                    })
              }
              variant="ghost"
              isDisabled={!isComplete}
              onClick={() =>
                onPreview(
                  id,
                  userHasRemovePreviewFiles ? false : isMouseOver && isShiftDown ? false : true,
                )
              }
            />
            <IconButtonWithTooltip
              size="sm"
              fontSize="md"
              icon={<DeleteIcon />}
              label={intl.formatMessage({
                id: "component.petition-compose-attachments.remove",
                defaultMessage: "Remove attachment",
              })}
              variant="ghost"
              isDisabled={isDisabled}
              onClick={() => onRemove(id)}
            />
          </HStack>
        </HStack>
        {hasVisibilityConditions ? (
          <Box paddingX={5} paddingY={1}>
            <PetitionComposeVisibilityAccordion
              isOpen={false}
              popoverContent={
                <>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.petition-compose-attachments.visibility-popover"
                      defaultMessage="This attachment will only be shown or hidden when the conditions are met."
                    />
                  </Text>
                  <Text fontSize="sm">
                    <HelpCenterLink articleId={6076369}>
                      <FormattedMessage id="generic.learn-more" defaultMessage="Learn more" />
                    </HelpCenterLink>
                  </Text>
                </>
              }
            >
              <PetitionVisibilityEditor
                petition={petition}
                value={visibility as any}
                onChange={(newVisibility) => onVisibilityChange(id, newVisibility)}
                showErrors={false}
                isReadOnly={isDisabled}
                visibilityOn="ATTACHMENT"
              />
            </PetitionComposeVisibilityAccordion>
          </Box>
        ) : null}
      </Stack>
    </Reorder.Item>
  );
});
