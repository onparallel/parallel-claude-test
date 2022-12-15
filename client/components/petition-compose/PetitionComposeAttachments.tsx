import { DataProxy, gql, useMutation } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Box,
  BoxProps,
  Button,
  Center,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  AddIcon,
  BackCoverIcon,
  ChevronDownIcon,
  CoverIcon,
  DeleteIcon,
  DragHandleIcon,
  EyeIcon,
  PaperclipIcon,
} from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { FileSize } from "@parallel/components/common/FileSize";
import {
  PetitionAttachmentType,
  PetitionComposeAttachments_createPetitionAttachmentUploadLinkDocument,
  PetitionComposeAttachments_deletePetitionAttachmentDocument,
  PetitionComposeAttachments_petitionAttachmentDownloadLinkDocument,
  PetitionComposeAttachments_PetitionAttachmentFragment,
  PetitionComposeAttachments_PetitionAttachmentsListFragment,
  PetitionComposeAttachments_petitionAttachmentUploadCompleteDocument,
  PetitionComposeAttachments_PetitionBaseFragmentDoc,
  PetitionComposeAttachments_reorderPetitionAttachmentsDocument,
  PetitionComposeAttachments_updatePetitionAttachmentTypeDocument,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { uploadFile } from "@parallel/utils/uploadFile";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useIsAnimated } from "@parallel/utils/useIsAnimated";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { useIsMouseOver } from "@parallel/utils/useIsMouseOver";
import { fromEvent } from "file-selector";
import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DropEvent, FileRejection, useDropzone } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { noop, omit, sumBy, uniqBy, zip } from "remeda";
import { CloseableAlert } from "../common/CloseableAlert";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { Divider } from "../common/Divider";
import { FileName } from "../common/FileName";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { RestrictedFeaturePopover } from "../common/RestrictedFeaturePopover";
import { PetitionComposeDragActiveIndicator } from "./PetitionComposeDragActiveIndicator";

const MAX_FILE_SIZE = 1024 * 1024 * 50;
const TOTAL_MAX_FILES_SIZE = 1024 * 1024 * 10;

export interface PetitionComposeAttachmentsProps extends BoxProps {
  petitionId: string;
  isTemplate: boolean;
  attachmentsList: PetitionComposeAttachments_PetitionAttachmentsListFragment;
  hasDocumentFieldsWithAttachments: boolean;
  isReadOnly?: boolean;
}

export function PetitionComposeAttachments({
  petitionId,
  isTemplate,
  attachmentsList,
  hasDocumentFieldsWithAttachments,
  isReadOnly,
  ...props
}: PetitionComposeAttachmentsProps) {
  const intl = useIntl();

  const { COVER, ANNEX, BACK } = attachmentsList;

  const [cover, setCover] = useState(COVER);
  const [annex, setAnnex] = useState(ANNEX);
  const [back, setBack] = useState(BACK);

  const allAttachments = [...cover, ...annex, ...back];

  const totalMaxFilesSizeExceeded =
    sumBy(
      allAttachments.filter((item) => item.file.isComplete),
      (item) => item.file.size
    ) > TOTAL_MAX_FILES_SIZE;

  const uploads = useRef<Record<string, XMLHttpRequest>>({});
  const [attachmentUploadProgress, setAttachmentUploadProgress] = useState<Record<string, number>>(
    {}
  );

  const [createPetitionAttachmentUploadLink] = useMutation(
    PetitionComposeAttachments_createPetitionAttachmentUploadLinkDocument
  );
  const [petitionAttachmentUploadComplete] = useMutation(
    PetitionComposeAttachments_petitionAttachmentUploadCompleteDocument
  );

  const [deletePetitionAttachment] = useMutation(
    PetitionComposeAttachments_deletePetitionAttachmentDocument
  );

  const [petitionAttachmentDownloadLink] = useMutation(
    PetitionComposeAttachments_petitionAttachmentDownloadLinkDocument
  );

  const [reorderPetitionAttachments] = useMutation(
    PetitionComposeAttachments_reorderPetitionAttachmentsDocument
  );

  const [updatePetitionAttachmentType] = useMutation(
    PetitionComposeAttachments_updatePetitionAttachmentTypeDocument
  );

  useEffect(() => {
    setCover(COVER);
    setAnnex(ANNEX);
    setBack(BACK);
  }, [attachmentsList]);

  function updateAttachmentUploadingStatus(
    cache: DataProxy,
    attachment: PetitionComposeAttachments_PetitionAttachmentFragment
  ) {
    updateFragment(cache, {
      fragment: PetitionComposeAttachments_PetitionBaseFragmentDoc,
      fragmentName: "PetitionComposeAttachments_PetitionBase",
      id: petitionId,
      data: (data) => ({
        ...data!,
        attachmentsList: {
          ...data!.attachmentsList,
          ANNEX: uniqBy([...data!.attachmentsList.ANNEX, attachment], (obj) => obj.id),
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
      })
    );
  };

  const debouncedReorderPetitionAttachments = useDebouncedAsync(
    async (attachmentType: PetitionAttachmentType, attachmentIds: string[]) => {
      await reorderPetitionAttachments({
        variables: { petitionId, attachmentIds, attachmentType },
      });
    },
    600,
    []
  );

  const handleReorderAttachments = async (
    attachmentType: PetitionAttachmentType,
    attachmentIds: string[]
  ) => {
    try {
      await debouncedReorderPetitionAttachments(attachmentType, attachmentIds);
    } catch (e) {
      if (e === "DEBOUNCED") {
        return "DEBOUNCED";
      } else {
        throw e;
      }
    }
  };

  const handleChangeType = async (attachmentId: string, type: PetitionAttachmentType) => {
    await updatePetitionAttachmentType({
      variables: { petitionId, attachmentId, type },
    });
  };

  const showErrorDialog = useErrorDialog();
  const [draggedFiles, setDraggedFiles] = useState<(File | DataTransferItem)[]>([]);
  const { getRootProps, isDragActive, open } = useDropzone({
    accept: {
      "application/pdf": [],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: 10 - allAttachments.length,
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
            })
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
        })
      );
    },
    onDrop: async (files: File[], filesRejection: FileRejection[]) => {
      if (allAttachments.length + files.length + filesRejection.length > 10) {
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

      zip(files, data!.createPetitionAttachmentUploadLink).forEach(
        ([file, { presignedPostData, attachment }]) => {
          uploads.current[attachment.id] = uploadFile(file, presignedPostData, {
            onProgress(progress) {
              setAttachmentUploadProgress((progresses) => ({
                ...progresses,
                [attachment.id]: progress,
              }));
            },
            async onComplete() {
              delete uploads.current[attachment.id];
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
          });
        }
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

  return (
    <Card
      ref={_rootProps.ref}
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
              isDisabled={allAttachments.length > 9}
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
        {allAttachments.length > 0 ? (
          <>
            {cover.length ? (
              <Stack
                listStyleType="none"
                as={Reorder.Group}
                axis="y"
                values={cover}
                onReorder={setCover}
              >
                {cover.map((item, i, arr) => {
                  return (
                    <AttachmentItem
                      key={item.id}
                      item={item}
                      index={i}
                      isDraggable={arr.length > 1}
                      progress={attachmentUploadProgress[item.id]}
                      onRemove={handleRemoveAttachment}
                      onPreview={handleDownloadAttachment}
                      onChangeType={handleChangeType}
                      onReorder={() =>
                        handleReorderAttachments(
                          "COVER",
                          cover.map((item) => item.id)
                        )
                      }
                    />
                  );
                })}
              </Stack>
            ) : null}
            {cover.length && (annex.length || back.length) ? <Divider /> : null}
            {annex.length ? (
              <Stack
                listStyleType="none"
                as={Reorder.Group}
                axis="y"
                values={annex}
                onReorder={setAnnex}
              >
                {annex.map((item, i, arr) => {
                  return (
                    <AttachmentItem
                      key={item.id}
                      item={item}
                      index={i}
                      isDraggable={arr.length > 1}
                      progress={attachmentUploadProgress[item.id]}
                      onRemove={handleRemoveAttachment}
                      onPreview={handleDownloadAttachment}
                      onChangeType={handleChangeType}
                      onReorder={() =>
                        handleReorderAttachments(
                          "ANNEX",
                          annex.map((item) => item.id)
                        )
                      }
                    />
                  );
                })}
              </Stack>
            ) : null}
            {annex.length && back.length ? <Divider /> : null}
            {back.length ? (
              <Stack
                listStyleType="none"
                as={Reorder.Group}
                axis="y"
                values={back}
                onReorder={setBack}
              >
                {back.map((item, i, arr) => {
                  return (
                    <AttachmentItem
                      key={item.id}
                      item={item}
                      index={i}
                      isDraggable={arr.length > 1}
                      progress={attachmentUploadProgress[item.id]}
                      onRemove={handleRemoveAttachment}
                      onPreview={handleDownloadAttachment}
                      onChangeType={handleChangeType}
                      onReorder={() =>
                        handleReorderAttachments(
                          "BACK",
                          back.map((item) => item.id)
                        )
                      }
                    />
                  );
                })}
              </Stack>
            ) : null}
          </>
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
              <CloseableAlert status="warning" variant="subtle" rounded="md" marginTop={4}>
                <AlertIcon color="yellow.500" />
                <AlertDescription flex="1">
                  <Text>
                    <FormattedMessage
                      id="component.petition-compose-attachments.large-files-alert"
                      defaultMessage="<b>Heavy files.</b> Large files may cause problems when starting the signature. We recommend to compress the uploaded files and not to exceed {size}."
                      values={{ size: <FileSize value={TOTAL_MAX_FILES_SIZE} /> }}
                    />
                  </Text>
                </AlertDescription>
              </CloseableAlert>
            ) : null}
            {hasDocumentFieldsWithAttachments ? (
              <CloseableAlert status="info" variant="subtle" rounded="md" marginTop={4}>
                <AlertIcon />
                <AlertDescription flex="1">
                  <Text>
                    <FormattedMessage
                      id="component.petition-compose-attachments.petition-with-document-fields-alert"
                      defaultMessage="{type, select, TEMPLATE {This template} other {This parallel}} has document fields set up to attach your responses to the pdf. They will be included in the final document after the attachments."
                      values={{ type: isTemplate ? "TEMPLATE" : "PETITION" }}
                    />
                  </Text>
                </AlertDescription>
              </CloseableAlert>
            ) : null}
          </Box>
        ) : null}
      </Stack>
    </Card>
  );
}

PetitionComposeAttachments.fragments = {
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
      }
    `;
  },
  get PetitionAttachmentsList() {
    return gql`
      fragment PetitionComposeAttachments_PetitionAttachmentsList on PetitionAttachmentsList {
        COVER {
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
        attachmentsList {
          ...PetitionComposeAttachments_PetitionAttachmentsList
        }
      }
      ${this.PetitionAttachmentsList}
    `;
  },
};

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
];

interface AttachmentItemProps {
  item: PetitionComposeAttachments_PetitionAttachmentFragment;
  index: number;
  isDraggable: boolean;
  progress: number;
  onRemove: (id: string) => Promise<void>;
  onPreview: (id: string, preview: boolean) => void;
  onChangeType: (id: string, type: PetitionAttachmentType) => void;
  onReorder: () => void;
}

function AttachmentItem({
  item,
  index,
  isDraggable,
  progress,
  onRemove,
  onPreview,
  onChangeType,
  onReorder,
}: AttachmentItemProps) {
  const intl = useIntl();
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const isAnimated = useIsAnimated(y);
  const prevIndex = useRef(index);
  const prevType = useRef(item.type);

  const previewRef = useRef<HTMLButtonElement>(null);
  const isMouseOver = useIsMouseOver(previewRef);
  const isShiftDown = useIsGlobalKeyDown("Shift");

  const { type, file, isUploading, id } = item;
  const { filename, size, isComplete } = file;

  useEffect(() => {
    // update prevType and prevIndex if change the type of attachment to prevent unnecessary reorder.
    prevType.current = item.type;
    prevIndex.current = index;
  }, [item]);

  useEffect(() => {
    // if the index inside the same type changes we reorder the attachments.
    if (index !== prevIndex.current && item.type === prevType.current && isAnimated) {
      onReorder();
    }
    prevIndex.current = index;
  }, [index]);

  const menuIcon =
    type === "COVER" ? <CoverIcon /> : type === "ANNEX" ? <PaperclipIcon /> : <BackCoverIcon />;
  const buttonColor = type === "COVER" || type === "BACK" ? "tags.brown" : "tags.green";

  const uploadHasFailed = !isUploading && !isComplete;

  return (
    <Reorder.Item
      key={item.id}
      value={item}
      dragListener={false}
      dragControls={dragControls}
      style={{ y }}
    >
      <HStack
        paddingX={3}
        _hover={{
          backgroundColor: "gray.75",
          transitionProperty: "none",
        }}
        borderRadius="md"
        backgroundColor={isAnimated ? "gray.75" : undefined}
        shadow={isAnimated ? "short" : undefined}
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
        userSelect="none"
      >
        <Box
          className="drag-handle"
          position="absolute"
          left={1}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          cursor={isDraggable ? "grab" : "not-allowed"}
          color="gray.400"
          _hover={{
            color: isDraggable ? "gray.700" : "gray.400",
          }}
          aria-label={intl.formatMessage({
            id: "component.petition-compose-field.drag-to-sort-label",
            defaultMessage: "Drag to sort this parallel fields",
          })}
          onPointerDown={(event) => (isDraggable ? dragControls.start(event) : noop)}
        >
          <DragHandleIcon role="presentation" boxSize={3} />
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
              aria-label="Options"
              leftIcon={menuIcon}
              rightIcon={<ChevronDownIcon marginLeft={-2} />}
            />
          </Box>
          <Portal>
            <MenuList>
              <MenuItem icon={<CoverIcon />} onClick={() => onChangeType(id, "COVER")}>
                <FormattedMessage
                  id="component.petition-compose-attachments.cover"
                  defaultMessage="Cover"
                />
              </MenuItem>
              <MenuItem icon={<PaperclipIcon />} onClick={() => onChangeType(id, "ANNEX")}>
                <FormattedMessage
                  id="component.petition-compose-attachments.annex"
                  defaultMessage="Annex"
                />
              </MenuItem>
              <MenuItem icon={<BackCoverIcon />} onClick={() => onChangeType(id, "BACK")}>
                <FormattedMessage
                  id="component.petition-compose-attachments.back-cover"
                  defaultMessage="Back cover"
                />
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
        <HStack flex="1" minWidth="0px">
          {type === "COVER" ? (
            <Text as="span" fontSize="sm" fontWeight={500} whiteSpace="nowrap">
              <FormattedMessage
                id="component.petition-compose-attachments.prefix-cover"
                defaultMessage="Cover {index}:"
                values={{ index: index + 1 }}
              />{" "}
            </Text>
          ) : type === "BACK" ? (
            <Text as="span" fontSize="sm" fontWeight={500} whiteSpace="nowrap">
              <FormattedMessage
                id="component.petition-compose-attachments.prefix-back-cover"
                defaultMessage="Back cover {index}:"
                values={{
                  index: index + 1,
                }}
              />{" "}
            </Text>
          ) : (
            <Text as="span">{`${index + 1}.`}</Text>
          )}
          <FileName value={filename} fontSize="sm" fontWeight="400" />
          <Text as="span" marginX={2}>
            -
          </Text>
          <Text as="span" fontSize="sm" color="gray.500" marginLeft={1} whiteSpace="nowrap">
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
            ref={previewRef}
            size="sm"
            fontSize="md"
            icon={<EyeIcon />}
            label={intl.formatMessage({
              id: "component.petition-compose-attachments.preview",
              defaultMessage: "Preview file. ⇧ + click to download",
            })}
            variant="ghost"
            isDisabled={!isComplete}
            onClick={() => onPreview(id, isMouseOver && isShiftDown ? false : true)}
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
            onClick={() => onRemove(id)}
          />
        </HStack>
      </HStack>
    </Reorder.Item>
  );
}
