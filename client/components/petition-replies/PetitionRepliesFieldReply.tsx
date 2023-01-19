import { gql } from "@apollo/client";
import { Box, Flex, Grid, GridItem, HStack, Stack, Text, VisuallyHidden } from "@chakra-ui/react";
import {
  BusinessIcon,
  CheckIcon,
  CloseIcon,
  EditSimpleIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import {
  PetitionFieldReplyStatus,
  PetitionFieldType,
  PetitionRepliesFieldReply_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { formatNumberWithPrefix } from "@parallel/utils/formatNumberWithPrefix";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { Fragment } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { UserOrContactReference } from "../petition-activity/UserOrContactReference";
import { DowJonesRiskLabel } from "../petition-common/DowJonesRiskLabel";
import { CopyOrDownloadReplyButton } from "./CopyOrDownloadReplyButton";

export interface PetitionRepliesFieldReplyProps {
  reply: PetitionRepliesFieldReply_PetitionFieldReplyFragment;
  onUpdateStatus: (status: PetitionFieldReplyStatus) => void;
  onAction: (action: PetitionRepliesFieldAction) => void;
  isDisabled?: boolean;
}

export type PetitionRepliesFieldAction = "DOWNLOAD_FILE" | "PREVIEW_FILE";

export function PetitionRepliesFieldReply({
  reply,
  onUpdateStatus,
  onAction,
  isDisabled,
}: PetitionRepliesFieldReplyProps) {
  const intl = useIntl();
  const type = reply.field!.type;

  const contents = isFileTypeField(type)
    ? [reply.content]
    : type === "NUMBER"
    ? [formatNumberWithPrefix(reply.content.value, reply.field!.options as FieldOptions["NUMBER"])]
    : type === "DATE"
    ? [intl.formatDate(reply.content.value as string, { ...FORMATS.L, timeZone: "UTC" })]
    : Array.isArray(reply.content.value)
    ? type === "DYNAMIC_SELECT"
      ? reply.content.value.map((v) => v[1])
      : reply.content.value
    : [reply.content.value];

  const buildUrlToSection = useBuildUrlToPetitionSection();
  const editReplyIconButton = (idSuffix = "") => {
    return (
      <NakedLink
        href={buildUrlToSection("preview", {
          field: reply.field!.id,
          reply: `${reply.field!.id}-${reply.id}${idSuffix}`,
        })}
      >
        <IconButtonWithTooltip
          as="a"
          opacity={0}
          className="edit-field-reply-button"
          variant="ghost"
          size="xs"
          icon={<EditSimpleIcon />}
          label={intl.formatMessage({
            id: "component.petition-replies-field.edit-field-reply",
            defaultMessage: "Edit reply",
          })}
        />
      </NakedLink>
    );
  };

  return (
    <HStack>
      <Grid
        flex="1"
        templateColumns="auto 1fr"
        columnGap={2}
        sx={{
          "&:focus-within, &:hover": {
            ".edit-field-reply-button": {
              opacity: 1,
            },
          },
        }}
      >
        {contents.map((content, i) => (
          <Fragment key={i}>
            <GridItem paddingBottom={1}>
              <CopyOrDownloadReplyButton reply={reply} content={content} onAction={onAction} />
            </GridItem>
            <GridItem
              borderLeft="2px solid"
              borderColor="gray.200"
              paddingBottom={1}
              paddingLeft={2}
            >
              <HStack alignItems={"center"} gridGap={2} spacing={0}>
                {reply.isAnonymized && !content.error ? (
                  <ReplyNotAvailable type={type} />
                ) : type === "ES_TAX_DOCUMENTS" && content.error ? (
                  <Text>{content.request.model.type}</Text>
                ) : isFileTypeField(type) && type !== "DOW_JONES_KYC" ? (
                  <Flex flexWrap="wrap" gap={2} alignItems="center" minHeight={6}>
                    <VisuallyHidden>
                      {intl.formatMessage({
                        id: "generic.file-name",
                        defaultMessage: "File name",
                      })}
                    </VisuallyHidden>
                    <Text as="span">
                      {content.filename}
                      {" - "}
                      <Text
                        as="span"
                        aria-label={intl.formatMessage({
                          id: "generic.file-size",
                          defaultMessage: "File size",
                        })}
                        fontSize="sm"
                        color="gray.500"
                      >
                        <FileSize value={content.size} />
                      </Text>
                      <Box display="inline-block" marginLeft={2}>
                        {editReplyIconButton()}
                      </Box>
                    </Text>
                  </Flex>
                ) : type === "DOW_JONES_KYC" ? (
                  <Stack spacing={1}>
                    <Flex flexWrap="wrap" gap={2} alignItems="center" minHeight={6}>
                      <VisuallyHidden>
                        {intl.formatMessage({
                          id: "generic.name",
                          defaultMessage: "Name",
                        })}
                      </VisuallyHidden>
                      <Text as="span">
                        <Text as="span" display="inline-block" marginRight={2}>
                          {content.entity.type === "Entity" ? <BusinessIcon /> : <UserIcon />}
                        </Text>
                        {content.entity.name}
                        {" - "}
                        <Text
                          as="span"
                          aria-label={intl.formatMessage({
                            id: "generic.file-size",
                            defaultMessage: "File size",
                          })}
                          fontSize="sm"
                          color="gray.500"
                        >
                          <FileSize value={content.size} />
                        </Text>
                        <Box display="inline-block" marginLeft={2}>
                          {editReplyIconButton()}
                        </Box>
                      </Text>
                    </Flex>
                    <Flex flexWrap="wrap" gap={2} alignItems="center">
                      {(content.entity.iconHints as string[] | undefined)?.map((hint, i) => (
                        <DowJonesRiskLabel key={i} risk={hint} />
                      ))}
                    </Flex>
                  </Stack>
                ) : (
                  <Box>
                    <BreakLines>{content}</BreakLines>
                    <Box display="inline-block" height={6} marginLeft={2} verticalAlign="baseline">
                      {editReplyIconButton(reply.field?.type === "DYNAMIC_SELECT" ? `-${i}` : "")}
                    </Box>
                  </Box>
                )}
              </HStack>
            </GridItem>
          </Fragment>
        ))}
        <GridItem
          gridColumn={2}
          fontSize="sm"
          borderLeft="2px solid"
          borderColor="gray.200"
          paddingLeft={2}
        >
          {isFileTypeField(type) &&
          (reply.content.uploadComplete === false || reply.content.error) ? (
            <Text color="red.500">
              <FormattedMessage
                id="petition-replies.petition-field-reply.file-upload.file-incomplete"
                defaultMessage="There was an error uploading the file. Please request a new upload."
              />
            </Text>
          ) : (
            <Text color="gray.500">
              {reply.updatedBy?.__typename === "User" && reply.updatedBy.isMe ? (
                <FormattedMessage id="generic.you" defaultMessage="You" />
              ) : (
                <UserOrContactReference userOrAccess={reply.updatedBy} isLink={false} />
              )}
              {", "}
              <DateTime as="span" value={reply.createdAt} format={FORMATS.LLL} />
            </Text>
          )}
        </GridItem>
      </Grid>
      <Stack direction="row" spacing={1} alignSelf="flex-start" data-section="approve-reject-reply">
        <IconButtonWithTooltip
          data-action="approve-reply"
          icon={<CheckIcon />}
          label={intl.formatMessage({
            id: "petition-replies.petition-field-reply.approve",
            defaultMessage: "Approve",
          })}
          size="xs"
          placement="bottom"
          colorScheme={reply.status === "APPROVED" ? "green" : "gray"}
          role="switch"
          aria-checked={reply.status === "APPROVED"}
          onClick={() => onUpdateStatus(reply.status === "APPROVED" ? "PENDING" : "APPROVED")}
          isDisabled={isDisabled || reply.isAnonymized}
        />
        <IconButtonWithTooltip
          data-action="reject-reply"
          icon={<CloseIcon />}
          label={intl.formatMessage({
            id: "petition-replies.petition-field-reply.reject",
            defaultMessage: "Reject",
          })}
          size="xs"
          placement="bottom"
          role="switch"
          colorScheme={reply.status === "REJECTED" ? "red" : "gray"}
          aria-checked={reply.status === "REJECTED"}
          onClick={() => onUpdateStatus(reply.status === "REJECTED" ? "PENDING" : "REJECTED")}
          isDisabled={isDisabled || reply.isAnonymized}
        />
      </Stack>
    </HStack>
  );
}

PetitionRepliesFieldReply.fragments = {
  PetitionFieldReply: gql`
    fragment PetitionRepliesFieldReply_PetitionFieldReply on PetitionFieldReply {
      id
      content
      status
      createdAt
      metadata
      field {
        id
        type
        options
      }
      updatedBy {
        ...UserOrContactReference_UserOrPetitionAccess
        ... on User {
          isMe
        }
      }
      isAnonymized
      ...CopyOrDownloadReplyButton_PetitionFieldReply
    }
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${CopyOrDownloadReplyButton.fragments.PetitionFieldReply}
  `,
};

function ReplyNotAvailable({ type }: { type?: PetitionFieldType }) {
  return (
    <Text textStyle="hint">
      {type && isFileTypeField(type) ? (
        <FormattedMessage
          id="generic.document-not-available"
          defaultMessage="Document not available"
        />
      ) : (
        <FormattedMessage id="generic.reply-not-available" defaultMessage="Reply not available" />
      )}
    </Text>
  );
}
