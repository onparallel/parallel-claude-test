import { gql, useMutation } from "@apollo/client";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Flex,
  Heading,
  HStack,
  IconButton,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { ArrowForwardIcon, CommentIcon, PaperclipIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  PetitionFieldReplyStatus,
  PetitionRepliesField_petitionFieldAttachmentDownloadLinkDocument,
  PetitionRepliesField_PetitionFieldFragment,
  PetitionRepliesField_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { forwardRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { FileAttachmentButton } from "../common/FileAttachmentButton";
import { InternalFieldBadge } from "../common/InternalFieldBadge";
import { Spacer } from "../common/Spacer";
import { RecipientViewCommentsBadge } from "../recipient-view/RecipientViewCommentsBadge";
import { PetitionRepliesFieldAction, PetitionRepliesFieldReply } from "./PetitionRepliesFieldReply";

export interface PetitionRepliesFieldProps extends BoxProps {
  petitionId: string;
  field: PetitionRepliesField_PetitionFieldFragment;
  fieldIndex: PetitionFieldIndex;
  isVisible: boolean;
  isActive: boolean;
  onAction: (
    action: PetitionRepliesFieldAction,
    reply: PetitionRepliesField_PetitionFieldReplyFragment
  ) => void;
  onToggleComments: () => void;
  onUpdateReplyStatus: (replyId: string, status: PetitionFieldReplyStatus) => void;
}

export const PetitionRepliesField = Object.assign(
  forwardRef<HTMLElement, PetitionRepliesFieldProps>(function PetitionRepliesField(
    {
      petitionId,
      field,
      fieldIndex,
      isVisible,
      isActive: isShowingComments,
      onAction,
      onToggleComments,
      onUpdateReplyStatus,
      ...props
    },
    ref
  ) {
    const intl = useIntl();
    const [petitionFieldAttachmentDownloadLink] = useMutation(
      PetitionRepliesField_petitionFieldAttachmentDownloadLinkDocument
    );
    const handleAttachmentClick = function (attachmentId: string) {
      openNewWindow(async () => {
        const { data } = await petitionFieldAttachmentDownloadLink({
          variables: { petitionId, fieldId: field.id, attachmentId },
        });
        const { url } = data!.petitionFieldAttachmentDownloadLink;
        return url!;
      });
    };

    const InternalFieldBadgeComp = field.isInternal ? (
      <InternalFieldBadge marginRight={2.5} marginBottom={0.5} />
    ) : null;

    return field.type === "HEADING" ? (
      <Stack
        ref={ref as any}
        spacing={1}
        paddingLeft={{ base: 4, md: 6 }}
        paddingRight={4}
        paddingY={2}
        as="section"
        {...props}
      >
        <Flex alignItems="center">
          <PetitionFieldTypeIndicator
            marginLeft="1px"
            type={field.type}
            fieldIndex={fieldIndex}
            hideIcon={true}
          />
          <HStack flex="1" minWidth="0" alignItems="center">
            {field.isInternal ? <InternalFieldBadge marginLeft={2} /> : null}
            {field.title ? (
              <Heading marginLeft={4} size="md" fontWeight={600} isTruncated>
                {field.title}
              </Heading>
            ) : (
              <Heading
                marginLeft={4}
                size="md"
                color="gray.500"
                fontWeight="normal"
                fontStyle="italic"
                isTruncated
              >
                <FormattedMessage id="generic.empty-heading" defaultMessage="Untitled heading" />
              </Heading>
            )}
          </HStack>
          {/* This Flex element makes the reviewed buttons to be aligned */}
          <Flex width="66px">
            <Spacer />
            <CommentsButton
              data-action="see-field-comments"
              isActive={isShowingComments}
              commentCount={field.comments.length}
              hasUnreadComments={field.comments.some((c) => c.isUnread)}
              onClick={onToggleComments}
            />
          </Flex>
        </Flex>
        {field.description ? (
          <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
            <BreakLines>{field.description}</BreakLines>
          </Text>
        ) : null}
        {field.attachments.length ? (
          <Box paddingY={1}>
            <PetitionRepliesFieldAttachments
              attachments={field.attachments}
              onAttachmentClick={handleAttachmentClick}
            />
          </Box>
        ) : null}
      </Stack>
    ) : (
      <Card
        ref={ref}
        layerStyle="highlightable"
        display="flex"
        backgroundColor={isVisible ? "white" : "gray.50"}
        flexDirection="column"
        position="relative"
        paddingY={4}
        paddingLeft={{ base: 4, md: 6 }}
        paddingRight={4}
        {...props}
      >
        <Flex flexWrap="wrap" justifyContent="space-between">
          <Flex
            width={{ base: "100%", lg: "auto" }}
            flex="1"
            position="relative"
            paddingLeft={{ base: 2, md: 0 }}
          >
            {!field.optional ? (
              <Tooltip
                placement="bottom"
                label={intl.formatMessage({
                  id: "generic.required-field",
                  defaultMessage: "Required field",
                })}
              >
                <Box
                  paddingLeft={{ base: 2.5, md: 0 }}
                  width={4}
                  height={4}
                  textAlign="center"
                  fontSize="xl"
                  color="red.600"
                  userSelect="none"
                  position="absolute"
                  left={0}
                  top={0}
                  transform="translate(-1.125rem, 50%)"
                >
                  <Box position="relative" bottom={2} pointerEvents="none">
                    *
                  </Box>
                </Box>
              </Tooltip>
            ) : null}
            <PetitionFieldTypeIndicator
              marginTop="2px"
              type={field.type}
              fieldIndex={fieldIndex}
              hideIcon={true}
            />
            <Box marginLeft={2} flex="1">
              {field.title ? (
                <Text as="h4" overflowWrap="anywhere" fontWeight={600}>
                  {InternalFieldBadgeComp}
                  {field.title}
                </Text>
              ) : (
                <Text as="h4" textStyle="hint" whiteSpace="nowrap">
                  {InternalFieldBadgeComp}
                  <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
                </Text>
              )}
            </Box>
          </Flex>
          <Flex width={{ base: "100%", lg: "auto" }}>
            <Spacer />

            {/* This Flex element makes the reviewed buttons to be aligned */}
            <Flex width="66px">
              <Spacer />
              <CommentsButton
                data-action="see-field-comments"
                isActive={isShowingComments}
                commentCount={field.comments.length}
                hasUnreadComments={field.comments.some((c) => c.isUnread)}
                onClick={onToggleComments}
              />
            </Flex>
          </Flex>
        </Flex>
        <Box marginBottom={2}>
          {field.description ? (
            <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
              <BreakLines>{field.description}</BreakLines>
            </Text>
          ) : (
            <Text fontSize="sm" textStyle="hint">
              <FormattedMessage id="generic.no-description" defaultMessage="No description" />
            </Text>
          )}
        </Box>
        {field.attachments.length ? (
          <Box marginBottom={2} paddingY={1}>
            <PetitionRepliesFieldAttachments
              attachments={field.attachments}
              onAttachmentClick={handleAttachmentClick}
            />
          </Box>
        ) : null}
        {field.replies.length ? (
          <>
            {field.type === "DYNAMIC_SELECT" ? (
              <Stack
                as="ol"
                listStyleType="none"
                direction="row"
                alignItems="center"
                fontSize="sm"
                divider={<ArrowForwardIcon border="none" />}
                marginBottom={2}
              >
                {(field.replies[0].content.columns as string[][])?.map(([label], index) => (
                  <Box key={index} as="li">
                    {label}
                  </Box>
                ))}
              </Stack>
            ) : null}
            <Stack spacing={4}>
              {field.replies.map((reply) => (
                <PetitionRepliesFieldReply
                  key={reply.id}
                  reply={reply}
                  onAction={(action) => onAction(action, reply)}
                  onUpdateStatus={(status) => onUpdateReplyStatus(reply.id, status)}
                />
              ))}
            </Stack>
          </>
        ) : isVisible ? (
          <Box paddingY={4}>
            <Text textStyle="hint" textAlign="center">
              <FormattedMessage
                id="component.petition-replies-field.no-replies"
                defaultMessage="There are no replies to this field yet"
              />
            </Text>
          </Box>
        ) : (
          <Box paddingY={4}>
            <Text textStyle="hint" textAlign="center">
              <FormattedMessage
                id="component.petition-replies-field.conditions-not-met"
                defaultMessage="Visibility conditions for this field are not met"
              />
            </Text>
          </Box>
        )}
      </Card>
    );
  }),
  {
    fragments: {
      PetitionField: gql`
        fragment PetitionRepliesField_PetitionField on PetitionField {
          id
          type
          title
          description
          optional
          isInternal
          replies {
            ...PetitionRepliesField_PetitionFieldReply
          }
          comments {
            id
            isUnread
            createdAt
          }
          attachments {
            id
            file {
              ...FileAttachmentButton_FileUpload
            }
          }
        }
        fragment PetitionRepliesField_PetitionFieldReply on PetitionFieldReply {
          id
          ...PetitionRepliesFieldReply_PetitionFieldReply
        }
        ${FileAttachmentButton.fragments.FileUpload}
        ${PetitionRepliesFieldReply.fragments.PetitionFieldReply}
      `,
    },
    mutations: [
      gql`
        mutation PetitionRepliesField_petitionFieldAttachmentDownloadLink(
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
    ],
  }
);

function PetitionRepliesFieldAttachments({
  attachments,
  onAttachmentClick,
}: {
  attachments: PetitionRepliesField_PetitionFieldFragment["attachments"];
  onAttachmentClick: (attachmentId: string) => void;
}) {
  return (
    <Accordion allowToggle margin={-1}>
      <AccordionItem border="none">
        <AccordionButton
          width="auto"
          color="gray.700"
          _hover={{ background: "transparent" }}
          padding="0"
          marginLeft={1}
        >
          <Stack direction="row" alignItems="center">
            <PaperclipIcon boxSize="14px" />
            <Box fontSize="sm">
              <FormattedMessage
                id="component.petition-replies-field.attachments"
                defaultMessage="{count, plural, =1 {1 file attached} other {# files attached}}"
                values={{ count: attachments.length }}
              />
            </Box>
            <AccordionIcon />
          </Stack>
        </AccordionButton>
        <AccordionPanel
          paddingTop={2}
          paddingX={1}
          paddingBottom={1}
          display="flex"
          flexWrap="wrap"
          gridGap={2}
        >
          {attachments.map((attachment) => (
            <FileAttachmentButton
              key={attachment.id}
              file={attachment.file}
              onClick={() => onAttachmentClick(attachment.id)}
            />
          ))}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

interface CommentsButtonProps extends ButtonProps {
  commentCount: number;
  hasUnreadComments: boolean;
  isActive: boolean;
}

const CommentsButton = chakraForwardRef<"button", CommentsButtonProps>(function CommentsButton(
  { commentCount, hasUnreadComments, isActive, ...props },
  ref
) {
  const intl = useIntl();
  const common = {
    "aria-pressed": isActive,
    size: "sm",
    variant: isActive ? "solid" : "ghost",
    colorScheme: isActive ? "purple" : "gray",
    padding: 2,
    ...props,
  } as const;
  return commentCount > 0 ? (
    <Button
      flexDirection="row-reverse"
      fontWeight="normal"
      alignItems="center"
      {...common}
      ref={ref}
    >
      <Stack display="inline-flex" direction="row-reverse" alignItems="flex-end">
        <CommentIcon fontSize="md" color={isActive ? "inherit" : "gray.700"} />
        <Text
          as="span"
          aria-label={intl.formatMessage(
            {
              id: "generic.comments-button-label",
              defaultMessage:
                "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
            },
            { commentCount }
          )}
        >
          {intl.formatNumber(commentCount)}
        </Text>
      </Stack>
      <RecipientViewCommentsBadge
        hasUnreadComments={hasUnreadComments}
        isReversedPurple={isActive}
        marginRight={2}
      />
    </Button>
  ) : (
    <IconButton
      icon={<CommentIcon fontSize="md" />}
      {...common}
      aria-label={intl.formatMessage(
        {
          id: "generic.comments-button-label",
          defaultMessage:
            "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
        },
        { commentCount }
      )}
      ref={ref}
    />
  );
});
