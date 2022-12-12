import {
  Box,
  BoxProps,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
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
import { UpdatePetitionInput } from "@parallel/graphql/__types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useIsAnimated } from "@parallel/utils/useIsAnimated";
import { fromEvent } from "file-selector";
import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import { nanoid } from "nanoid";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";
import { Divider } from "../common/Divider";
import { FileName } from "../common/FileName";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PetitionComposeDragActiveIndicator } from "./PetitionComposeDragActiveIndicator";

type AttachmentType = "COVER" | "ANNEX" | "BACK";

const covers = [
  {
    type: "COVER" as AttachmentType,
    id: nanoid(),
    size: 2313,
    name: "First cover",
    url: "",
  },
];

const annexs = [
  {
    type: "ANNEX" as AttachmentType,
    id: nanoid(),
    size: 21312451,
    name: "First annex",
    url: "",
  },
  {
    type: "ANNEX" as AttachmentType,
    id: nanoid(),
    size: 21312451,
    name: "Second annex",
    url: "",
  },
  {
    type: "ANNEX" as AttachmentType,
    id: nanoid(),
    size: 2132451,
    name: "Third annex",
    url: "",
  },
];

const backCovers = [
  {
    type: "BACK" as AttachmentType,
    id: nanoid(),
    size: 12312451,
    name: "First back cover",
    url: "",
  },
];

export interface PetitionTemplateAttachmentsProps extends BoxProps {
  petitionId: string;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
  isReadOnly?: boolean;
}

export function PetitionTemplateAttachments({
  petitionId,
  onUpdatePetition,
  isReadOnly,
  ...props
}: PetitionTemplateAttachmentsProps) {
  const intl = useIntl();

  const [cover, setCover] = useState(covers);
  const [annex, setAnnex] = useState(annexs);
  const [back, setBack] = useState(backCovers);

  const updatePetition = useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]);

  const hasAttachments = cover.length > 0 || annex.length > 0 || back.length > 0;

  const maxAttachmentSize = 100 * 1024 * 1024;
  const [draggedFiles, setDraggedFiles] = useState<(File | DataTransferItem)[]>([]);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    maxSize: maxAttachmentSize,
    onDropRejected: async () => {},
    onDrop: async (files: File[], _, event) => {},
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

  const handleRemove = async (id: string) => {};

  const handlePreview = (id: string) => {};

  const handleChangeType = (id: string, type: AttachmentType) => {};

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
          isOverMaxAttachments={draggedFiles.length > 10}
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
      <CardHeader
        rightAction={
          <IconButtonWithTooltip
            icon={<AddIcon />}
            label={intl.formatMessage({
              id: "component.petition-template-attachments.add-attachment",
              defaultMessage: "Add attachment",
            })}
            onClick={open}
          />
        }
      >
        <FormattedMessage
          id="component.petition-template-attachments.header"
          defaultMessage="Document attachments"
        />
      </CardHeader>
      <Box padding={4}>
        {hasAttachments ? (
          <Stack listStyleType="none">
            <Stack
              listStyleType="none"
              as={Reorder.Group}
              axis="y"
              values={cover}
              onReorder={setCover}
            >
              {cover.map((item) => {
                return (
                  <AttachmentItem
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onPreview={handlePreview}
                    onChangeType={handleChangeType}
                  />
                );
              })}
            </Stack>
            {annex.length ? <Divider /> : null}
            <Stack
              listStyleType="none"
              as={Reorder.Group}
              axis="y"
              values={annex}
              onReorder={setAnnex}
            >
              {annex.map((item) => {
                return (
                  <AttachmentItem
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onPreview={handlePreview}
                    onChangeType={handleChangeType}
                  />
                );
              })}
            </Stack>
            {back.length ? <Divider /> : null}
            <Stack
              listStyleType="none"
              as={Reorder.Group}
              axis="y"
              values={back}
              onReorder={setBack}
            >
              {back.map((item) => {
                return (
                  <AttachmentItem
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onPreview={handlePreview}
                    onChangeType={handleChangeType}
                  />
                );
              })}
            </Stack>
          </Stack>
        ) : (
          <Text width="100%" textAlign="center" color="gray.500">
            <FormattedMessage
              id="component.petition-template-attachments.no-attachments-uploaded"
              defaultMessage="No attachments have been uploaded yet"
            />
          </Text>
        )}
      </Box>
    </Card>
  );
}

type AttachmentItemType = {
  id: string;
  name: string;
  size: number;
  url: string;
  type: AttachmentType;
};

interface AttachmentItemProps {
  item: AttachmentItemType;
  onRemove: (id: string) => Promise<void>;
  onPreview: (id: string) => void;
  onChangeType: (id: string, type: AttachmentType) => void;
}

function AttachmentItem({ item, onRemove, onPreview, onChangeType }: AttachmentItemProps) {
  const intl = useIntl();
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const isAnimated = useIsAnimated(y);
  const { type, url, size, name, id } = item;

  const menuIcon =
    type === "COVER" ? <CoverIcon /> : type === "ANNEX" ? <PaperclipIcon /> : <BackCoverIcon />;

  return (
    <Reorder.Item
      key={item.id}
      value={item}
      dragListener={false}
      dragControls={dragControls}
      style={{ y }}
    >
      <HStack
        paddingX={2}
        _hover={{
          backgroundColor: "gray.75",
          transitionProperty: "none",
        }}
        borderRadius="md"
        backgroundColor={isAnimated ? "gray.75" : undefined}
        shadow={isAnimated ? "short" : undefined}
        transitionProperty="all"
        transitionDuration="320ms"
      >
        <DragHandleIcon
          boxSize={3}
          color="gray.400"
          onPointerDown={(event) => dragControls.start(event)}
          cursor="pointer"
        />
        <Menu>
          <MenuButton
            as={Button}
            backgroundColor={type === "COVER" || type === "BACK" ? "tags.brown" : "tags.green"}
            _hover={{
              backgroundColor: type === "COVER" || type === "BACK" ? "tags.brown" : "tags.green",
            }}
            _active={{
              backgroundColor: type === "COVER" || type === "BACK" ? "tags.brown" : "tags.green",
            }}
            size="xs"
            aria-label="Options"
            leftIcon={menuIcon}
            rightIcon={<ChevronDownIcon />}
          />
          <Portal>
            <MenuList>
              <MenuItem icon={<CoverIcon />} onClick={() => onChangeType(id, "COVER")}>
                <FormattedMessage
                  id="component.petition-template-attachments.cover"
                  defaultMessage="Cover"
                />
              </MenuItem>
              <MenuItem icon={<PaperclipIcon />} onClick={() => onChangeType(id, "ANNEX")}>
                <FormattedMessage
                  id="component.petition-template-attachments.annex"
                  defaultMessage="Annex"
                />
              </MenuItem>
              <MenuItem icon={<BackCoverIcon />} onClick={() => onChangeType(id, "BACK")}>
                <FormattedMessage
                  id="component.petition-template-attachments.back-cover"
                  defaultMessage="Back cover"
                />
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
        <HStack flex="1">
          <FileName as="div" value={name} fontSize="sm" fontWeight="500" maxWidth="200px" />
          <Text as="span" marginX={2}>
            -
          </Text>
          <Text as="span" fontSize="sm" color="gray.500" marginLeft={1} whiteSpace="nowrap">
            <FileSize value={size} />
          </Text>
        </HStack>

        <HStack>
          <IconButtonWithTooltip
            size="sm"
            fontSize="md"
            icon={<EyeIcon />}
            label={intl.formatMessage({
              id: "component.petition-template-attachments.preview",
              defaultMessage: "Preview file. ⇧ + click to download",
            })}
            variant="ghost"
            onClick={() => onPreview(id)}
          />
          <IconButtonWithTooltip
            size="sm"
            fontSize="md"
            icon={<DeleteIcon />}
            label={intl.formatMessage({
              id: "component.petition-template-attachments.remove",
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
