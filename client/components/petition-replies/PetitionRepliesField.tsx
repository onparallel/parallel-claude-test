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
  ButtonOptions,
  Center,
  Grid,
  HStack,
  Heading,
  IconButton,
  Stack,
  StackProps,
  Text,
  ThemingProps,
  Tooltip,
} from "@chakra-ui/react";
import {
  ArrowForwardIcon,
  CommentIcon,
  EditSimpleIcon,
  PaperclipIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  PetitionFieldReplyStatus,
  PetitionRepliesField_PetitionFieldFragment,
  PetitionRepliesField_PetitionFieldReplyFragment,
  PetitionRepliesField_PetitionFragment,
  PetitionRepliesField_petitionFieldAttachmentDownloadLinkDocument,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/useFieldLogic";
import { PetitionFieldFilter, filterPetitionFields } from "@parallel/utils/filterPetitionFields";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { LiquidPetitionVariableProvider } from "@parallel/utils/liquid/LiquidPetitionVariableProvider";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { forwardRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import { FieldDescription } from "../common/FieldDescription";
import { FileAttachmentButton } from "../common/FileAttachmentButton";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { InternalFieldBadge } from "../common/InternalFieldBadge";
import { NakedLink } from "../common/Link";
import { RecipientViewCommentsBadge } from "../recipient-view/RecipientViewCommentsBadge";
import { PetitionRepliesFieldAction, PetitionRepliesFieldReply } from "./PetitionRepliesFieldReply";
import { PetitionRepliesFilteredFields } from "./PetitionRepliesFilteredFields";

export interface PetitionRepliesFieldProps extends Omit<BoxProps, "filter"> {
  petition: PetitionRepliesField_PetitionFragment;
  field: PetitionRepliesField_PetitionFieldFragment;
  fieldIndex: PetitionFieldIndex;
  childrenFieldIndices: string[] | undefined;
  isActive: boolean;
  filter: PetitionFieldFilter;
  fieldLogic: FieldLogicResult;
  onAction: (
    action: PetitionRepliesFieldAction,
    reply: PetitionRepliesField_PetitionFieldReplyFragment,
  ) => void;
  onToggleComments: () => void;
  onUpdateReplyStatus: (fieldId: string, replyId: string, status: PetitionFieldReplyStatus) => void;
  isDisabled?: boolean;
}

export const PetitionRepliesField = Object.assign(
  forwardRef<HTMLElement, PetitionRepliesFieldProps>(function PetitionRepliesField(
    {
      petition,
      field,
      fieldIndex,
      childrenFieldIndices,
      isActive: isShowingComments,
      filter,
      fieldLogic,
      onAction,
      onToggleComments,
      onUpdateReplyStatus,
      isDisabled,
      ...props
    },
    ref,
  ) {
    const intl = useIntl();
    const [petitionFieldAttachmentDownloadLink] = useMutation(
      PetitionRepliesField_petitionFieldAttachmentDownloadLinkDocument,
    );
    const handleAttachmentClick = (fieldId: string) => async (attachmentId: string) => {
      await withError(
        openNewWindow(async () => {
          const { data } = await petitionFieldAttachmentDownloadLink({
            variables: { petitionId: petition.id, fieldId, attachmentId },
          });
          const { url } = data!.petitionFieldAttachmentDownloadLink;
          return url!;
        }),
      );
    };

    const buildUrlToSection = useBuildUrlToPetitionSection();

    const goToComposeButton = (
      <NakedLink href={buildUrlToSection("compose", { field: field.id })}>
        <IconButtonWithTooltip
          as="a"
          opacity={0}
          className="edit-field-button"
          size="xs"
          variant="ghost"
          icon={<EditSimpleIcon />}
          label={intl.formatMessage({
            id: "component.petition-replies-field.edit-field",
            defaultMessage: "Edit field",
          })}
        />
      </NakedLink>
    );

    return field.type === "HEADING" ? (
      <Grid
        ref={ref as any}
        paddingStart={{ base: 4, md: 6 }}
        paddingEnd={4}
        paddingY={2}
        as="section"
        templateColumns="32px 10px 1fr 8px auto"
        gridTemplateAreas={`"index . heading . comments" ". . desc desc desc"`}
        {...props}
        sx={{
          "&:focus-within, &:hover": {
            ".edit-field-button": {
              opacity: 1,
            },
          },
        }}
      >
        <Box gridArea="comments">
          <CommentsButton
            data-action="see-field-comments"
            isActive={isShowingComments}
            commentCount={field.commentCount}
            hasUnreadComments={field.unreadCommentCount > 0}
            onClick={onToggleComments}
          />
        </Box>
        <Center gridArea="index">
          <PetitionFieldTypeIndicator
            as="span"
            type={field.type}
            fieldIndex={fieldIndex}
            hideIcon
          />
        </Center>
        <HStack gridArea="heading" alignItems="center" minWidth={0}>
          <Heading
            size="md"
            noOfLines={1}
            wordBreak="break-all"
            {...(field.title ? {} : { textStyle: "hint" })}
          >
            {field.isInternal ? (
              <InternalFieldBadge marginEnd={1.5} position="relative" top="-2px" />
            ) : null}
            {field.title || (
              <FormattedMessage id="generic.empty-heading" defaultMessage="Untitled heading" />
            )}
          </Heading>
          {goToComposeButton}
        </HStack>

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
                onAttachmentClick={handleAttachmentClick(field.id)}
              />
            </Box>
          ) : null}
        </Box>
      </Grid>
    ) : field.type === "FIELD_GROUP" ? (
      <Box
        display="flex"
        position="relative"
        flexDirection="column"
        as="section"
        ref={ref as any}
        {...props}
      >
        <Grid
          paddingStart={{ base: 4, md: 6 }}
          paddingEnd={4}
          paddingY={2}
          templateColumns="32px 10px 1fr 8px auto"
          gridTemplateAreas={`"index . heading . comments" ". . desc desc desc"`}
          sx={{
            "&:focus-within, &:hover": {
              ".edit-field-button": {
                opacity: 1,
              },
            },
          }}
        >
          <Box gridArea="comments">
            <CommentsButton
              data-action="see-field-comments"
              isActive={isShowingComments}
              commentCount={field.commentCount}
              hasUnreadComments={field.unreadCommentCount > 0}
              onClick={onToggleComments}
            />
          </Box>
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
                  paddingStart={{ base: 2.5, md: 0 }}
                  width={4}
                  height={4}
                  textAlign="center"
                  fontSize="xl"
                  color="red.600"
                  userSelect="none"
                  position="absolute"
                  insetStart={0}
                  top={0}
                  transform={{
                    base: "translate(-1.25rem, 50%)",
                    md: "translate(-1.125rem, 50%)",
                  }}
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
          <HStack gridArea="heading" alignItems="center">
            <Heading
              fontSize="md"
              as="h4"
              {...(field.title
                ? { overflowWrap: "anywhere", fontWeight: 600 }
                : { textStyle: "hint", whiteSpace: "nowrap" })}
            >
              {field.isInternal ? (
                <InternalFieldBadge marginEnd={1.5} position="relative" top="-2px" />
              ) : null}
              {field.title || (
                <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
              )}
            </Heading>
            {goToComposeButton}
          </HStack>

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
                  onAttachmentClick={handleAttachmentClick(field.id)}
                />
              </Box>
            ) : null}
          </Box>
        </Grid>
        <Stack paddingStart={10} spacing={3}>
          {field.replies.length > 0 ? (
            field.replies.map((reply, index) => {
              return (
                <Card
                  id={`reply-${reply.id}`}
                  key={reply.id}
                  padding={4}
                  paddingStart={6}
                  as={Stack}
                  layerStyle="highlightable"
                >
                  <HStack spacing={3}>
                    <Text>
                      {`${
                        field.options.groupName ??
                        intl.formatMessage({
                          id: "generic.group-name-fallback-reply",
                          defaultMessage: "Reply",
                        })
                      }${field.multiple || field.replies.length > 1 ? ` ${index + 1}` : ""}`}
                    </Text>
                  </HStack>
                  <Stack spacing={3}>
                    {filterPetitionFields(
                      zip(
                        reply.children!.map(({ field, replies }) => ({
                          ...field,
                          childReplies: replies,
                        })),
                        childrenFieldIndices!,
                      ),
                      fieldLogic.groupChildrenLogic![index],
                    ).map((x) => {
                      return x.type === "FIELD" ? (
                        <LiquidPetitionVariableProvider key={x.field.id} logic={x.fieldLogic}>
                          <Stack key={x.field.id}>
                            <Box>
                              <Box position="relative">
                                {x.field.optional ? null : (
                                  <Tooltip
                                    placement="bottom"
                                    label={intl.formatMessage({
                                      id: "generic.required-field",
                                      defaultMessage: "Required field",
                                    })}
                                  >
                                    <Box
                                      paddingStart={{ base: 2.5, md: 0 }}
                                      width={4}
                                      height={4}
                                      textAlign="center"
                                      fontSize="xl"
                                      color="red.600"
                                      userSelect="none"
                                      position="absolute"
                                      insetStart={0}
                                      top={0}
                                      transform={{
                                        base: "translate(-1.25rem, 25%)",
                                        md: "translate(-1rem, 25%)",
                                      }}
                                    >
                                      <Box position="relative" bottom={2} pointerEvents="none">
                                        *
                                      </Box>
                                    </Box>
                                  </Tooltip>
                                )}
                                <Heading
                                  fontSize="md"
                                  as="h4"
                                  {...(x.field.title
                                    ? { overflowWrap: "anywhere", fontWeight: 500 }
                                    : { textStyle: "hint", whiteSpace: "nowrap" })}
                                >
                                  {x.field.title || (
                                    <FormattedMessage
                                      id="generic.untitled-field"
                                      defaultMessage="Untitled field"
                                    />
                                  )}
                                </Heading>
                              </Box>
                              <Box>
                                {x.field.description ? (
                                  <FieldDescription
                                    description={x.field.description}
                                    marginTop={1}
                                    color="gray.600"
                                    fontSize="sm"
                                    overflowWrap="anywhere"
                                  />
                                ) : null}
                                {x.field.attachments.length ? (
                                  <Box marginTop={2} paddingY={1}>
                                    <PetitionRepliesFieldAttachments
                                      attachments={x.field.attachments}
                                      onAttachmentClick={handleAttachmentClick(x.field.id)}
                                    />
                                  </Box>
                                ) : null}
                              </Box>
                            </Box>
                            {x.field.type === "HEADING" ? null : (
                              <Stack spacing={4}>
                                {x.field.childReplies.length ? (
                                  x.field.childReplies.map((reply) => (
                                    <PetitionRepliesFieldReply
                                      petition={petition}
                                      key={reply.id}
                                      reply={reply}
                                      onAction={(action) => onAction(action, reply)}
                                      onUpdateStatus={(status) =>
                                        onUpdateReplyStatus(x.field.id, reply.id, status)
                                      }
                                      isDisabled={isDisabled}
                                    />
                                  ))
                                ) : (
                                  <NoRepliesHintWithButton
                                    paddingTop={3}
                                    paddingBottom={3}
                                    href={buildUrlToSection("preview", {
                                      field: x.field.id,
                                      parentReply: reply.id,
                                    })}
                                  />
                                )}
                              </Stack>
                            )}
                          </Stack>
                        </LiquidPetitionVariableProvider>
                      ) : (
                        <PetitionRepliesFilteredFields key={index} count={x.count} />
                      );
                    })}
                  </Stack>
                </Card>
              );
            })
          ) : (
            <NoRepliesHintWithButton
              paddingY={4}
              href={buildUrlToSection("preview", {
                field: field.id,
              })}
            />
          )}
        </Stack>
      </Box>
    ) : (
      <Card
        ref={ref}
        layerStyle="highlightable"
        display="flex"
        backgroundColor="white"
        flexDirection="column"
        position="relative"
        paddingY={4}
        paddingStart={{ base: 4, md: 6 }}
        paddingEnd={4}
        {...props}
      >
        <Grid
          templateColumns="32px 10px 1fr 8px auto"
          gridTemplateAreas={`"index . heading . comments" ". . desc desc desc"`}
          sx={{
            "&:focus-within, &:hover": {
              ".edit-field-button": {
                opacity: 1,
              },
            },
          }}
        >
          <Box gridArea="comments">
            <CommentsButton
              data-action="see-field-comments"
              isActive={isShowingComments}
              commentCount={field.commentCount}
              hasUnreadComments={field.unreadCommentCount > 0}
              onClick={onToggleComments}
            />
          </Box>
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
                  paddingStart={{ base: 2.5, md: 0 }}
                  width={4}
                  height={4}
                  textAlign="center"
                  fontSize="xl"
                  color="red.600"
                  userSelect="none"
                  position="absolute"
                  insetStart={0}
                  top={0}
                  transform={{
                    base: "translate(-1.25rem, 50%)",
                    md: "translate(-1.125rem, 50%)",
                  }}
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
          <HStack gridArea="heading" alignItems="center">
            <Heading
              fontSize="md"
              as="h4"
              {...(field.title
                ? { overflowWrap: "anywhere", fontWeight: 600 }
                : { textStyle: "hint", whiteSpace: "nowrap" })}
            >
              {field.isInternal ? (
                <InternalFieldBadge marginEnd={1.5} position="relative" top="-2px" />
              ) : null}
              {field.title || (
                <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
              )}
            </Heading>
            {goToComposeButton}
          </HStack>

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
                  onAttachmentClick={handleAttachmentClick(field.id)}
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
                  petition={petition}
                  reply={reply}
                  onAction={(action) => onAction(action, reply)}
                  onUpdateStatus={(status) => onUpdateReplyStatus(field.id, reply.id, status)}
                  isDisabled={isDisabled}
                />
              ))}
            </Stack>
          </Box>
        ) : (
          <NoRepliesHintWithButton
            paddingY={4}
            href={buildUrlToSection("preview", {
              field: field.id,
            })}
          />
        )}
      </Card>
    );
  }),
  {
    fragments: {
      Petition: gql`
        fragment PetitionRepliesField_Petition on Petition {
          id
          ...PetitionRepliesFieldReply_Petition
        }
        ${PetitionRepliesFieldReply.fragments.Petition}
      `,
      PetitionField: gql`
        fragment PetitionRepliesField_PetitionField on PetitionField {
          id
          type
          title
          multiple
          description
          optional
          options
          isInternal
          replies {
            ...PetitionRepliesField_PetitionFieldReply
          }
          commentCount
          unreadCommentCount
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
          children {
            field {
              id
              type
              title
              description
              optional
              options
              isInternal
              commentCount
              unreadCommentCount
              attachments {
                id
                file {
                  ...FileAttachmentButton_FileUpload
                }
              }
              ...filterPetitionFields_PetitionField
            }
            replies {
              ...PetitionRepliesFieldReply_PetitionFieldReply
            }
          }
        }
        ${FileAttachmentButton.fragments.FileUpload}
        ${PetitionRepliesFieldReply.fragments.PetitionFieldReply}
        ${filterPetitionFields.fragments.PetitionField}
      `,
    },
  },
);

const _mutations = gql`
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
`;

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
          marginStart={1}
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

interface CommentsButtonProps extends ButtonOptions, ThemingProps<"Button"> {
  commentCount: number;
  hasUnreadComments: boolean;
  isActive: boolean;
}

const CommentsButton = chakraForwardRef<"button", CommentsButtonProps>(function CommentsButton(
  { commentCount, hasUnreadComments, isActive, ...props },
  ref,
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
            { commentCount },
          )}
        >
          {intl.formatNumber(commentCount)}
        </Text>
      </Stack>
      <RecipientViewCommentsBadge
        hasUnreadComments={hasUnreadComments}
        isReversedPurple={isActive}
        marginEnd={2}
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
        { commentCount },
      )}
      ref={ref}
    />
  );
});

const NoRepliesHintWithButton = chakraForwardRef<"div", StackProps & { href: string }>(
  function NoRepliesHintWithButton({ href, ...rest }, ref) {
    const intl = useIntl();
    return (
      <HStack
        ref={ref}
        {...rest}
        sx={{
          "&:focus-within, &:hover": {
            ".edit-field-reply-button": {
              opacity: 1,
            },
          },
        }}
      >
        <Text textStyle="hint">
          <FormattedMessage
            id="component.petition-replies-field.no-replies"
            defaultMessage="There are no replies to this field yet"
          />
        </Text>
        <NakedLink href={href}>
          <IconButtonWithTooltip
            as="a"
            opacity={0}
            className="edit-field-reply-button"
            variant="ghost"
            size="xs"
            icon={<EditSimpleIcon />}
            label={intl.formatMessage({
              id: "component.petition-replies-field.add-field-reply",
              defaultMessage: "Add reply",
            })}
          />
        </NakedLink>
      </HStack>
    );
  },
);
