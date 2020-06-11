import {
  Box,
  BoxProps,
  Button,
  Checkbox,
  Flex,
  PseudoBoxProps,
  Stack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { PetitionRepliesField_PetitionFieldFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { UnwrapArray } from "@parallel/utils/types";
import { gql } from "apollo-boost";
import { Fragment, MouseEvent, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Spacer } from "../common/Spacer";

export type PetitionRepliesFieldAction = {
  type: "DOWNLOAD_FILE" | "PREVIEW_FILE";
  reply: UnwrapArray<PetitionRepliesField_PetitionFieldFragment["replies"]>;
};

export type PetitionRepliesFieldProps = BoxProps & {
  field: PetitionRepliesField_PetitionFieldFragment;
  index: number;
  selected: boolean;
  onToggle: (event: MouseEvent) => void;
  onAction: (action: PetitionRepliesFieldAction) => void;
  onValidateToggle: () => void;
};

export function PetitionRepliesField({
  field,
  index,
  selected,
  onToggle,
  onAction,
  onValidateToggle,
  ...props
}: PetitionRepliesFieldProps) {
  const intl = useIntl();
  const labels = {
    filesize: intl.formatMessage({
      id: "generic.file-size",
      defaultMessage: "File size",
    }),
    filename: intl.formatMessage({
      id: "generic.file-name",
      defaultMessage: "File name",
    }),
    download: intl.formatMessage({
      id: "petition.petition-field.reply-file-download",
      defaultMessage: "Download file",
    }),
    preview: intl.formatMessage({
      id: "petition.petition-field.reply-file-preview",
      defaultMessage: "Preview file",
    }),
  };
  return (
    <Card
      display="flex"
      position="relative"
      backgroundColor={selected ? "purple.50" : "white"}
      {...props}
    >
      <Flex alignItems="center" marginLeft={4}>
        <Checkbox
          variantColor="purple"
          isChecked={selected}
          isReadOnly
          onClick={onToggle}
        />
      </Flex>
      <Flex flex="1" flexDirection="column" padding={4}>
        <Flex alignItems="center">
          <PetitionFieldTypeIndicator
            type={field.type}
            index={index}
            as="div"
          />
          <Box marginLeft={4}>
            {field.title ? (
              <Text as="h4">{field.title}</Text>
            ) : (
              <Text as="h4" color="gray.400" fontStyle="italic">
                <FormattedMessage
                  id="generic.untitled-field"
                  defaultMessage="Untitled field"
                />
              </Text>
            )}
          </Box>
          <Spacer />
          <Box>
            <Button
              size="sm"
              variant={field.validated ? "solid" : "ghost"}
              onClick={onValidateToggle}
            >
              <Checkbox
                isChecked={field.validated}
                isReadOnly
                size="md"
                pointerEvents="none"
                marginRight={2}
              />
              <FormattedMessage
                id="petition.petition-field.validate-button"
                defaultMessage="Reviewed"
              ></FormattedMessage>
            </Button>
          </Box>
        </Flex>
        <Box marginBottom={2}>
          {field.description ? (
            <Text color="gray.600" fontSize="sm">
              {field.description?.split("\n").map((line, index) => (
                <Fragment key={index}>
                  {line}
                  <br />
                </Fragment>
              ))}
            </Text>
          ) : (
            <Text color="gray.400" fontSize="sm" fontStyle="italic">
              <FormattedMessage
                id="generic.no-description"
                defaultMessage="No description"
              />
            </Text>
          )}
        </Box>
        {field.replies.length ? (
          field.type === "TEXT" ? (
            <Stack spacing={4}>
              {field.replies.map((reply) => (
                <PetitionRepliesFieldReply
                  key={reply.id}
                  reply={reply}
                  actions={
                    <CopyToClipboardButton
                      size="xs"
                      text={reply.content.text}
                    />
                  }
                >
                  {(reply.content.text as string)
                    .split(/\n/)
                    .map((line, index) => (
                      <Fragment key={index}>
                        {line}
                        <br />
                      </Fragment>
                    ))}
                </PetitionRepliesFieldReply>
              ))}
            </Stack>
          ) : field.type === "FILE_UPLOAD" ? (
            <Stack spacing={4}>
              {field.replies.map((reply) => (
                <PetitionRepliesFieldReply
                  key={reply.id}
                  reply={reply}
                  actions={[
                    <IconButtonWithTooltip
                      key="1"
                      size="xs"
                      icon="download"
                      label={labels.download}
                      onClick={() => onAction({ type: "DOWNLOAD_FILE", reply })}
                    />,
                    ...(isPreviewable(reply.content.contentType)
                      ? [
                          <IconButtonWithTooltip
                            key="2"
                            size="xs"
                            icon="view"
                            label={labels.preview}
                            onClick={() =>
                              onAction({ type: "PREVIEW_FILE", reply })
                            }
                          />,
                        ]
                      : []),
                  ]}
                >
                  <Box display="inling-flex">
                    <VisuallyHidden>{labels.filename}</VisuallyHidden>
                    <Text as="span">{reply.content.filename}</Text>
                    <Text as="span" marginX={2}>
                      -
                    </Text>
                    <Text
                      as="span"
                      aria-label={labels.filesize}
                      fontSize="sm"
                      color="gray.400"
                    >
                      <FileSize value={reply.content.size} />
                    </Text>
                  </Box>
                </PetitionRepliesFieldReply>
              ))}
            </Stack>
          ) : null
        ) : (
          <Box paddingY={4}>
            <Text color="gray.400" fontStyle="italic" textAlign="center">
              <FormattedMessage
                id="petition.petition-field.no-replies"
                defaultMessage="There are no replies to this field yet"
              />
            </Text>
          </Box>
        )}
      </Flex>
    </Card>
  );
}

function isPreviewable(contentType: string) {
  return contentType === "application/pdf" || contentType.startsWith("image/");
}

function PetitionRepliesFieldReply({
  actions,
  children,
  reply,
  ...props
}: {
  actions: ReactNode;
  reply: UnwrapArray<PetitionRepliesField_PetitionFieldFragment["replies"]>;
} & PseudoBoxProps) {
  return (
    <Flex {...props}>
      <Stack
        spacing={1}
        paddingRight={2}
        borderRight="2px solid"
        borderColor="gray.200"
      >
        {actions}
      </Stack>
      <Flex
        flexDirection="column"
        justifyContent="center"
        flex="1"
        marginLeft={2}
      >
        {children}
        <Box fontSize="sm">
          <DateTime
            as="span"
            color="gray.400"
            value={reply.createdAt}
            format={FORMATS.LLL}
          />
        </Box>
      </Flex>
    </Flex>
  );
}

PetitionRepliesField.fragments = {
  PetitionField: gql`
    fragment PetitionRepliesField_PetitionField on PetitionField {
      id
      type
      title
      description
      validated
      replies {
        id
        content
        createdAt
      }
    }
  `,
};
