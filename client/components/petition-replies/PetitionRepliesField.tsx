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
  Center,
  Flex,
  Grid,
  Heading,
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
import { withError } from "@parallel/utils/promises/withError";
import { forwardRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FieldDescription } from "../common/FieldDescription";
import { FileAttachmentButton } from "../common/FileAttachmentButton";
import { InternalFieldBadge } from "../common/InternalFieldBadge";
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
  isDisabled?: boolean;
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
      isDisabled,
      ...props
    },
    ref
  ) {
    const intl = useIntl();
    const [petitionFieldAttachmentDownloadLink] = useMutation(
      PetitionRepliesField_petitionFieldAttachmentDownloadLinkDocument
    );
    const handleAttachmentClick = async function (attachmentId: string) {
      await withError(
        openNewWindow(async () => {
          const { data } = await petitionFieldAttachmentDownloadLink({
            variables: { petitionId, fieldId: field.id, attachmentId },
          });
          const { url } = data!.petitionFieldAttachmentDownloadLink;
          return url!;
        })
      );
    };

    return field.type === "HEADING" ? (
      <Grid
        ref={ref as any}
        paddingLeft={{ base: 4, md: 6 }}
        paddingRight={4}
        paddingY={2}
        as="section"
        templateColumns="32px 10px 1fr 8px auto"
        gridTemplateAreas={`"index . heading . comments" ". . desc desc desc"`}
        {...props}
      >
        <Center gridArea="index">
          <PetitionFieldTypeIndicator
            as="span"
            type={field.type}
            fieldIndex={fieldIndex}
            hideIcon
          />
        </Center>
        <Flex gridArea="heading" alignItems="center" minWidth={0}>
          <Heading size="md" flex="1" isTruncated {...(field.title ? {} : { textStyle: "hint" })}>
            {field.isInternal ? (
              <InternalFieldBadge marginRight={1.5} position="relative" top="-2px" />
            ) : null}
            {field.title || (
              <FormattedMessage id="generic.empty-heading" defaultMessage="Untitled heading" />
            )}
          </Heading>
        </Flex>
        <Box gridArea="comments">
          <CommentsButton
            data-action="see-field-comments"
            isActive={isShowingComments}
            commentCount={field.comments.length}
            hasUnreadComments={field.comments.some((c) => c.isUnread)}
            onClick={onToggleComments}
          />
        </Box>
        <Box gridArea="desc">
          {field.description ? (
            <FieldDescription
              description={field.description}
              color="gray.600"
              fontSize="sm"
              overflowWrap="anywhere"
              marginTop={1.5}
            />
          ) : null}
          {field.attachments.length ? (
            <Box paddingY={1}>
              <PetitionRepliesFieldAttachments
                attachments={field.attachments}
                onAttachmentClick={handleAttachmentClick}
              />
            </Box>
          ) : null}
        </Box>
      </Grid>
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
        <Grid
          templateColumns="32px 10px 1fr 8px auto"
          gridTemplateAreas={`"index . heading . comments" ". . desc desc desc"`}
        >
          <Box position="relative" gridArea="index">
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
              as="span"
              marginTop="2px"
              type={field.type}
              fieldIndex={fieldIndex}
              hideIcon
            />
          </Box>
          <Flex gridArea="heading" alignItems="center">
            <Heading
              fontSize="md"
              as="h4"
              {...(field.title
                ? { overflowWrap: "anywhere", fontWeight: 600 }
                : { textStyle: "hint", whiteSpace: "nowrap" })}
            >
              {field.isInternal ? (
                <InternalFieldBadge marginRight={1.5} position="relative" top="-2px" />
              ) : null}
              {field.title || (
                <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
              )}
            </Heading>
          </Flex>
          <Box gridArea="comments">
            <CommentsButton
              data-action="see-field-comments"
              isActive={isShowingComments}
              commentCount={field.comments.length}
              hasUnreadComments={field.comments.some((c) => c.isUnread)}
              onClick={onToggleComments}
            />
          </Box>
          <Box gridArea="desc">
            {field.description ? (
              <FieldDescription
                description={field.description}
                marginTop={1}
                color="gray.600"
                fontSize="sm"
                overflowWrap="anywhere"
              />
            ) : null}
            {field.attachments.length ? (
              <Box marginTop={2} paddingY={1}>
                <PetitionRepliesFieldAttachments
                  attachments={field.attachments}
                  onAttachmentClick={handleAttachmentClick}
                />
              </Box>
            ) : null}
          </Box>
        </Grid>
        {field.replies.length ? (
          <Box marginTop={3}>
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
                {field.replies.length > 0 &&
                  (field.options.labels as string[]).map((label, index) => (
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
                  isDisabled={isDisabled}
                />
              ))}
            </Stack>
          </Box>
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
          options
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
    colorScheme: isActive ? "primary" : "gray",
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
