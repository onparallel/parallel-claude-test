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
  PetitionRepliesFieldReply_PetitionFragment,
} from "@parallel/graphql/__types";
import { FORMATS, prettifyTimezone } from "@parallel/utils/dates";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { getReplyContents } from "@parallel/utils/getReplyContents";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useWindowEvent } from "@parallel/utils/useWindowEvent";
import { Fragment, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { BreakLines } from "../common/BreakLines";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { HelpPopover } from "../common/HelpPopover";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { UserOrContactReference } from "../common/UserOrContactReference";
import { BackgroundCheckRiskLabel } from "../petition-common/BackgroundCheckRiskLabel";
import { DowJonesRiskLabel } from "../petition-common/DowJonesRiskLabel";
import { EsTaxDocumentsContentErrorMessage } from "../petition-common/EsTaxDocumentsContentErrorMessage";
import { CopyOrDownloadReplyButton } from "./CopyOrDownloadReplyButton";

export interface PetitionRepliesFieldReplyProps {
  petition: PetitionRepliesFieldReply_PetitionFragment;
  reply: PetitionRepliesFieldReply_PetitionFieldReplyFragment;
  onUpdateStatus: (status: PetitionFieldReplyStatus) => void;
  onAction: (action: PetitionRepliesFieldAction) => void;
  isDisabled?: boolean;
}

export type PetitionRepliesFieldAction =
  | "DOWNLOAD_FILE"
  | "PREVIEW_FILE"
  | "VIEW_DETAILS"
  | "VIEW_RESULTS";

export function PetitionRepliesFieldReply({
  petition,
  reply,
  onUpdateStatus,
  onAction,
  isDisabled,
}: PetitionRepliesFieldReplyProps) {
  const intl = useIntl();
  const type = reply.field!.type;
  const parentReplyId = reply.parent?.id;

  const browserTabRef = useRef<Window>();
  const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const tokenBase64 = btoa(
    JSON.stringify({
      fieldId: reply.field!.id,
      petitionId: petition.id,
      ...(parentReplyId ? { parentReplyId } : {}),
    }),
  );

  const buildUrlToSection = useBuildUrlToPetitionSection();
  const editReplyIconButton = (idSuffix = "") => {
    return (
      <NakedLink
        href={buildUrlToSection("preview", {
          field: reply.field!.id,
          reply: `${reply.field!.id}${reply.parent ? `-${reply.parent.id}` : ""}-${
            reply.id
          }${idSuffix}`,
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

  useWindowEvent(
    "message",
    async (e) => {
      const browserTab = browserTabRef.current;
      if (!isDefined(browserTab) || e.source !== browserTab) {
        return;
      }
      if (e.data.event === "update-info") {
        const token = e.data.token;
        if (token !== tokenBase64) {
          return;
        }

        browserTab.postMessage(
          {
            event: "info-updated",
            entityIds: [reply.content?.entity?.id].filter(isDefined),
          },
          browserTab.origin,
        );
      }
    },
    [tokenBase64],
  );

  const handleAction = async (action: PetitionRepliesFieldAction) => {
    if (action === "VIEW_DETAILS" || action === "VIEW_RESULTS") {
      const { name, date, type } = reply.content?.query ?? {};

      let url = `/${intl.locale}/app/background-check/`;

      const petitionStatus = petition.__typename === "Petition" && petition.status;

      const isReadOnly = isDisabled || reply.status === "APPROVED" || petitionStatus === "CLOSED";

      if (action === "VIEW_RESULTS") {
        url += `/results`;
      } else {
        url += `/${reply.content?.entity?.id}`;
      }
      const urlParams = new URLSearchParams({
        token: tokenBase64,
        ...(name ? { name } : {}),
        ...(date ? { date } : {}),
        ...(type ? { type } : {}),
        ...(isReadOnly ? { readonly: "true" } : {}),
      });
      try {
        browserTabRef.current = await openNewWindow(`${url}?${urlParams.toString()}`);
      } catch {}
    } else {
      onAction(action);
    }
  };

  const entityTypeLabel = getEntityTypeLabel(intl, reply.content?.query?.type);

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
        {getReplyContents({ intl, reply, petitionField: reply.field! }).map((content, i) => (
          <Fragment key={i}>
            <GridItem paddingBottom={1}>
              <CopyOrDownloadReplyButton reply={reply} content={content} onAction={handleAction} />
            </GridItem>
            <GridItem
              borderStart="2px solid"
              borderColor="gray.200"
              paddingBottom={1}
              paddingStart={2}
            >
              <HStack alignItems={"center"} gridGap={2} spacing={0}>
                {reply.isAnonymized ? (
                  <ReplyNotAvailable type={type} />
                ) : type === "ES_TAX_DOCUMENTS" && content.error ? (
                  <Text>
                    {content.type === "identity-verification" ? (
                      <FormattedMessage
                        id="component.petition-replies-field-reply.es-tax-documents-identity-verification-error-header"
                        defaultMessage="Identity Verification"
                      />
                    ) : (
                      [content.request.model.type, content.request.model.year]
                        .filter(isDefined)
                        .join("_")
                    )}
                  </Text>
                ) : isFileTypeField(type) && type !== "DOW_JONES_KYC" ? (
                  <Flex flexWrap="wrap" gap={2} alignItems="center" minHeight={6}>
                    <VisuallyHidden>
                      {intl.formatMessage({
                        id: "generic.file-name",
                        defaultMessage: "File name",
                      })}
                    </VisuallyHidden>
                    <Text as="span" wordBreak="break-all">
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
                      <Box display="inline-block" marginStart={2}>
                        {editReplyIconButton()}
                      </Box>
                    </Text>
                  </Flex>
                ) : type === "BACKGROUND_CHECK" ? (
                  <Stack spacing={1}>
                    <Flex flexWrap="wrap" gap={2} alignItems="center" minHeight={6}>
                      {content?.entity ? (
                        <>
                          <VisuallyHidden>
                            {intl.formatMessage({
                              id: "generic.name",
                              defaultMessage: "Name",
                            })}
                          </VisuallyHidden>
                          <HStack>
                            {content.entity.type === "Person" ? <UserIcon /> : <BusinessIcon />}
                            <Text as="span">{content.entity.name}</Text>
                          </HStack>
                          {(content.entity.properties.topics as string[] | undefined)?.map(
                            (hint, i) => <BackgroundCheckRiskLabel key={i} risk={hint} />,
                          )}
                        </>
                      ) : (
                        <>
                          <VisuallyHidden>
                            {intl.formatMessage({
                              id: "generic.search",
                              defaultMessage: "Search",
                            })}
                          </VisuallyHidden>
                          <Text as="span">
                            {[entityTypeLabel, content?.query?.name, content?.query?.date]
                              .filter(isDefined)
                              .join(" | ")}
                          </Text>
                          <Text as="span" color="gray.500" fontSize="sm">
                            {`(${intl.formatMessage(
                              {
                                id: "generic.n-results",
                                defaultMessage:
                                  "{count, plural,=0{No results} =1 {1 result} other {# results}}",
                              },
                              {
                                count: content?.search?.totalCount ?? 0,
                              },
                            )})`}
                          </Text>
                        </>
                      )}
                      <Box display="inline-block" marginStart={1}>
                        {editReplyIconButton()}
                      </Box>
                    </Flex>
                  </Stack>
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
                        <Text as="span" display="inline-block" marginEnd={2}>
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
                        <Box display="inline-block" marginStart={2}>
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
                  <HStack>
                    {["SELECT", "CHECKBOX"].includes(type) &&
                    isDefined(
                      (reply.field!.options as FieldOptions["SELECT" | "CHECKBOX"]).labels,
                    ) ? (
                      <Text as="span">
                        {content}{" "}
                        <Text as="span" textStyle="hint">
                          {
                            (reply.field!.options as FieldOptions["SELECT" | "CHECKBOX"]).values[
                              (
                                reply.field!.options as FieldOptions["SELECT" | "CHECKBOX"]
                              ).values.indexOf(
                                type === "SELECT" ? reply.content.value : reply.content.value[i],
                              )
                            ]
                          }
                        </Text>
                      </Text>
                    ) : (
                      <BreakLines>{content}</BreakLines>
                    )}{" "}
                    {reply.field?.type === "DATE_TIME" &&
                    currentTimezone !== reply.content.timezone ? (
                      <HelpPopover>
                        <Text>
                          {`${intl.formatDate(reply.content.value as string, {
                            ...FORMATS["L+LT"],
                            timeZone: currentTimezone,
                          })} (${prettifyTimezone(currentTimezone)})`}
                        </Text>
                      </HelpPopover>
                    ) : null}
                    <Box display="inline-block" height={6} marginStart={2} verticalAlign="baseline">
                      {editReplyIconButton(reply.field?.type === "DYNAMIC_SELECT" ? `-${i}` : "")}
                    </Box>
                  </HStack>
                )}
              </HStack>
            </GridItem>
          </Fragment>
        ))}
        <GridItem
          gridColumn={2}
          fontSize="sm"
          borderStart="2px solid"
          borderColor="gray.200"
          paddingStart={2}
        >
          {isFileTypeField(type) &&
          (reply.content.uploadComplete === false || reply.content.error) ? (
            reply.content.uploadComplete === false ? (
              <Text color="red.500">
                <FormattedMessage
                  id="component.petition-replies-field-reply.file-incomplete"
                  defaultMessage="There was an error uploading the file. Please request a new upload."
                />
              </Text>
            ) : type === "ES_TAX_DOCUMENTS" && reply.content.error ? (
              <EsTaxDocumentsContentErrorMessage
                type={reply.content.type}
                error={reply.content.error}
              />
            ) : null
          ) : type === "ES_TAX_DOCUMENTS" &&
            reply.content.warning === "manual_review_required" &&
            reply.status === "PENDING" ? (
            <Text fontSize="xs" color="yellow.500">
              <FormattedMessage
                id="component.petition-replies-field-reply.manual-review-required"
                defaultMessage="We could not verify automatically that this is a valid document."
              />
            </Text>
          ) : (
            <HStack
              wrap={"wrap"}
              spacing={0}
              gap={{ base: 1.5, lg: 2 }}
              lineHeight="1.2"
              divider={<Text as="span">{"·"}</Text>}
            >
              <Text color="gray.500">
                <UserOrContactReference
                  userOrAccess={reply.repliedBy}
                  userUseYou
                  contactAsLink={false}
                />
                {", "}
                <DateTime as="span" value={reply.repliedAt!} format={FORMATS.LLL} />
              </Text>
              {reply.lastReviewedAt && reply.lastReviewedBy && reply.status !== "PENDING" ? (
                <HStack>
                  {reply.status === "APPROVED" ? (
                    <CheckIcon color="gray.600" boxSize={3.5} />
                  ) : (
                    <CloseIcon color="gray.600" boxSize={3} />
                  )}
                  <Text color="gray.500">
                    <UserOrContactReference
                      userOrAccess={reply.lastReviewedBy}
                      userUseYou
                      contactAsLink={false}
                    />
                    {", "}
                    <DateTime as="span" value={reply.lastReviewedAt} format={FORMATS.LLL} />
                  </Text>
                </HStack>
              ) : null}
            </HStack>
          )}
        </GridItem>
      </Grid>
      {reply.field?.requireApproval && petition.isReviewFlowEnabled ? (
        <Stack
          direction="row"
          spacing={1}
          alignSelf="flex-start"
          data-section="approve-reject-reply"
        >
          <IconButtonWithTooltip
            data-action="approve-reply"
            icon={<CheckIcon />}
            label={intl.formatMessage({
              id: "component.petition-replies-field-reply.approve",
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
              id: "component.petition-replies-field-reply.reject",
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
      ) : null}
    </HStack>
  );
}

PetitionRepliesFieldReply.fragments = {
  Petition: gql`
    fragment PetitionRepliesFieldReply_Petition on Petition {
      id
      ... on Petition {
        status
      }
      isReviewFlowEnabled
    }
  `,
  PetitionFieldReply: gql`
    fragment PetitionRepliesFieldReply_PetitionFieldReply on PetitionFieldReply {
      id
      content
      status
      metadata
      field {
        id
        type
        requireApproval
        ...getReplyContents_PetitionField
      }
      parent {
        id
      }
      repliedAt
      repliedBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      lastReviewedBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      lastReviewedAt
      isAnonymized
      ...CopyOrDownloadReplyButton_PetitionFieldReply
      ...getReplyContents_PetitionFieldReply
    }
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${CopyOrDownloadReplyButton.fragments.PetitionFieldReply}
    ${getReplyContents.fragments.PetitionFieldReply}
    ${getReplyContents.fragments.PetitionField}
  `,
};

export function ReplyNotAvailable({ type }: { type?: PetitionFieldType }) {
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
