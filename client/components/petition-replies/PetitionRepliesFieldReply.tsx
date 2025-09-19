import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Flex,
  Grid,
  GridItem,
  HStack,
  Stack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import {
  BusinessIcon,
  CheckIcon,
  CloseIcon,
  EditSimpleIcon,
  EyeIcon,
  LockClosedIcon,
  ShortSearchIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import {
  PetitionFieldReplyStatus,
  PetitionFieldType,
  PetitionRepliesFieldReply_PetitionFieldFragment,
  PetitionRepliesFieldReply_PetitionFieldReplyFragment,
  PetitionRepliesFieldReply_PetitionFragment,
} from "@parallel/graphql/__types";
import { FORMATS, prettifyTimezone } from "@parallel/utils/dates";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { getReplyContents } from "@parallel/utils/getReplyContents";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import { Fragment } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { FalsePositivesBadge } from "../common/BackgroundCheckBadges";
import { BreakLines } from "../common/BreakLines";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { HelpPopover } from "../common/HelpPopover";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { LocalizableUserTextRender } from "../common/LocalizableUserTextRender";
import { UserOrContactReference } from "../common/UserOrContactReference";
import { BackgroundCheckRiskLabel } from "../petition-common/BackgroundCheckRiskLabel";
import { DowJonesRiskLabel } from "../petition-common/DowJonesRiskLabel";
import { EsTaxDocumentsContentErrorMessage } from "../petition-common/EsTaxDocumentsContentErrorMessage";
import { CopyOrDownloadReplyButton } from "./CopyOrDownloadReplyButton";
import { PetitionRepliesFieldAdverseMediaSearch } from "./field-replies/PetitionRepliesFieldAdverseMediaSearch";
import { PetitionRepliesFieldFilePassword } from "./field-replies/PetitionRepliesFieldFilePassword";
import { PetitionRepliesFieldFileSchema } from "./field-replies/PetitionRepliesFieldFileSchema";
import { PetitionRepliesFieldFileUploadPayslipReply } from "./field-replies/PetitionRepliesFieldFileUploadPayslipReply";
import { PetitionRepliesFieldIdVerificationReply } from "./field-replies/PetitionRepliesFieldIdVerificationReply";
import { PetitionRepliesPopoverField } from "./PetitionRepliesPopoverField";

export interface PetitionRepliesFieldReplyProps {
  petition: PetitionRepliesFieldReply_PetitionFragment;
  petitionField: PetitionRepliesFieldReply_PetitionFieldFragment;
  reply: PetitionRepliesFieldReply_PetitionFieldReplyFragment;
  fieldLogic: FieldLogicResult;
  onUpdateStatus: (status: PetitionFieldReplyStatus) => void;
  onAction: (
    action: PetitionRepliesFieldAction,
    reply: PetitionRepliesFieldReply_PetitionFieldReplyFragment,
  ) => void;
  isDisabled?: boolean;
}

export type PetitionRepliesFieldAction =
  | "DOWNLOAD_FILE"
  | "PREVIEW_FILE"
  | "VIEW_DETAILS"
  | "VIEW_RESULTS"
  | "VIEW_ARTICLES";

export function PetitionRepliesFieldReply({
  petition,
  petitionField,
  reply,
  fieldLogic,
  onUpdateStatus,
  onAction,
  isDisabled,
}: PetitionRepliesFieldReplyProps) {
  const intl = useIntl();

  const type = petitionField.type;

  const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const countryNames = useLoadCountryNames(intl.locale);

  const buildUrlToSection = useBuildUrlToPetitionSection();
  const editReplyIconButton = (idSuffix = "") => {
    return (
      <HStack>
        <Box display={{ base: "block", lg: "none" }}>
          <NakedLink
            href={buildUrlToSection("preview", {
              field: petitionField.id,
              ...(reply.parent ? { parentReply: reply.parent.id } : {}),
              ...(idSuffix ? { sufix: idSuffix } : {}),
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
        </Box>
        <Box display={{ base: "none", lg: "block" }}>
          <PetitionRepliesPopoverField
            petitionFieldId={petitionField.id}
            petitionId={petition.id}
            parentReplyId={reply.parent ? reply.parent.id : undefined}
            fieldLogic={fieldLogic}
          >
            <IconButtonWithTooltip
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
          </PetitionRepliesPopoverField>
        </Box>
      </HStack>
    );
  };

  const handleAction = async (action: PetitionRepliesFieldAction) => {
    onAction(action, reply);
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
        {isNonNullish(petitionField) &&
          getReplyContents({ intl, reply, petitionField }).map((content, i) => (
            <Fragment key={i}>
              <GridItem paddingBottom={1}>
                <CopyOrDownloadReplyButton
                  reply={reply}
                  isDisabled={reply.isAnonymized || !!petition.permanentDeletionAt}
                  petitionFieldType={petitionField.type}
                  content={content}
                  onAction={handleAction}
                />
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
                          .filter(isNonNullish)
                          .join("_")
                      )}
                    </Text>
                  ) : type === "ID_VERIFICATION" ||
                    (type === "ES_TAX_DOCUMENTS" &&
                      ["identity-verification", "identity-verification-selfie"].includes(
                        reply.content.type,
                      )) ? (
                    <PetitionRepliesFieldIdVerificationReply reply={reply} />
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
                              {[
                                entityTypeLabel,
                                content?.query?.name,
                                content?.query?.date,
                                content?.query?.country && countryNames.countries
                                  ? countryNames.countries[content?.query?.country]
                                  : content?.query?.country,
                                content?.query?.birthCountry && countryNames.countries
                                  ? countryNames.countries[content?.query?.birthCountry]
                                  : content?.query?.birthCountry,
                              ]
                                .filter(isNonNullish)
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
                            {content?.search &&
                            content?.search?.totalCount > 0 &&
                            content?.search?.falsePositivesCount === content?.search?.totalCount ? (
                              <FalsePositivesBadge />
                            ) : null}
                          </>
                        )}
                        <Box display="inline-block" marginStart={1}>
                          {editReplyIconButton()}
                        </Box>
                      </Flex>
                    </Stack>
                  ) : type === "PROFILE_SEARCH" ? (
                    <Stack spacing={content?.value.length === 0 ? 0.5 : 3}>
                      <Flex flexWrap="wrap" gap={2} alignItems="baseline" minHeight={6}>
                        <VisuallyHidden>
                          {intl.formatMessage({
                            id: "generic.search",
                            defaultMessage: "Search",
                          })}
                        </VisuallyHidden>
                        <ShortSearchIcon alignSelf="center" />
                        <Text as="span">{content?.search}</Text>
                        <Text as="span" color="gray.500" fontSize="sm">
                          {`(${intl.formatMessage(
                            {
                              id: "generic.n-results",
                              defaultMessage:
                                "{count, plural,=0{No results} =1 {1 result} other {# results}}",
                            },
                            {
                              count: content?.totalResults ?? 0,
                            },
                          )})`}
                        </Text>
                        <Box display="inline-block" marginStart={1}>
                          {editReplyIconButton()}
                        </Box>
                      </Flex>
                      {content?.value.length === 0 ? (
                        <Box>
                          <Badge colorScheme="green" variant="outline">
                            {content?.totalResults > 0 ? (
                              <FormattedMessage
                                id="component.petition-replies-field-reply.profile-search-no-relevant-results"
                                defaultMessage="No relevant results"
                              />
                            ) : (
                              <FormattedMessage
                                id="component.petition-replies-field-reply.profile-search-no-results"
                                defaultMessage="No results"
                              />
                            )}
                          </Badge>
                        </Box>
                      ) : (
                        content?.value.map((profile: any, index: number) =>
                          isNonNullish(profile) ? (
                            <Stack key={profile.id} paddingStart={1}>
                              <HStack>
                                <IconButtonWithTooltip
                                  as="a"
                                  href={`/app/profiles/${profile.id}/general`}
                                  icon={<EyeIcon />}
                                  size="xs"
                                  label={intl.formatMessage({
                                    id: "generic.view-profile",
                                    defaultMessage: "View profile",
                                  })}
                                />
                                <Text as="span">
                                  <LocalizableUserTextRender
                                    value={profile.name}
                                    default={
                                      <Text textStyle="hint" as="span">
                                        <FormattedMessage
                                          id="generic.unnamed-profile"
                                          defaultMessage="Unnamed profile"
                                        />
                                      </Text>
                                    }
                                  />
                                </Text>
                              </HStack>

                              <Stack spacing={0.5} paddingStart={3}>
                                {profile.fields.map((field: any) => (
                                  <Text key={field.id} as="span" fontWeight={500}>
                                    <LocalizableUserTextRender
                                      value={field.name}
                                      default={
                                        <Text textStyle="hint" as="span">
                                          <FormattedMessage
                                            id="generic.unnamed-profile-type-field"
                                            defaultMessage="Unnamed property"
                                          />
                                        </Text>
                                      }
                                    />
                                    :
                                    {isNonNullish(field.value) && field.value.length ? (
                                      <Text as="span" fontWeight={400} marginStart={1}>
                                        {field.value}
                                      </Text>
                                    ) : (
                                      <Text
                                        as="span"
                                        fontWeight={400}
                                        textStyle="hint"
                                        marginStart={1}
                                      >
                                        <FormattedMessage
                                          id="generic.profile-property-no-value"
                                          defaultMessage="No value"
                                        />
                                      </Text>
                                    )}
                                  </Text>
                                ))}
                              </Stack>
                            </Stack>
                          ) : (
                            <Text textStyle="hint" as="span" key={index}>
                              <FormattedMessage
                                id="generic.deleted-profile"
                                defaultMessage="Deleted profile"
                              />
                            </Text>
                          ),
                        )
                      )}
                    </Stack>
                  ) : type === "ADVERSE_MEDIA_SEARCH" ? (
                    <PetitionRepliesFieldAdverseMediaSearch reply={reply} />
                  ) : isFileTypeField(type) ? (
                    <Stack flex="1">
                      <Flex flexWrap="wrap" gap={1.5} alignItems="center" minHeight={6}>
                        {isNonNullish(content.password) ? <LockClosedIcon /> : null}
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
                      {isNonNullish(content.password) ? (
                        <PetitionRepliesFieldFilePassword password={content.password} />
                      ) : null}
                      {type === "FILE_UPLOAD" &&
                      isNonNullish(reply.metadata) &&
                      reply.metadata.type === "PAYSLIP" ? (
                        <PetitionRepliesFieldFileUploadPayslipReply
                          metadata={reply.metadata as any}
                        />
                      ) : null}

                      {type === "FILE_UPLOAD" &&
                      reply.metadata.inferred_data_schema &&
                      reply.metadata.inferred_data ? (
                        <PetitionRepliesFieldFileSchema
                          data={reply.metadata.inferred_data}
                          schema={reply.metadata.inferred_data_schema}
                        />
                      ) : null}
                    </Stack>
                  ) : (
                    <HStack>
                      {["SELECT", "CHECKBOX"].includes(type) &&
                      isNonNullish(
                        (petitionField!.options as FieldOptions["SELECT" | "CHECKBOX"]).labels,
                      ) ? (
                        <Text as="span">
                          {content}{" "}
                          <Text as="span" textStyle="hint">
                            {
                              (petitionField!.options as FieldOptions["SELECT" | "CHECKBOX"])
                                .values[
                                (
                                  petitionField!.options as FieldOptions["SELECT" | "CHECKBOX"]
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
                      {petitionField?.type === "DATE_TIME" &&
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
                      <Box
                        display="inline-block"
                        height={6}
                        marginStart={2}
                        verticalAlign="baseline"
                      >
                        {editReplyIconButton(
                          petitionField?.type === "DYNAMIC_SELECT" ? `-${i}` : "",
                        )}
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
            ) : ["ES_TAX_DOCUMENTS", "ID_VERIFICATION"].includes(type) && reply.content.error ? (
              <EsTaxDocumentsContentErrorMessage
                type={reply.content.type}
                error={reply.content.error}
              />
            ) : null
          ) : ["ES_TAX_DOCUMENTS", "ID_VERIFICATION"].includes(type) &&
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
      {petitionField?.requireApproval && petition.isReviewFlowEnabled ? (
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
              id: "generic.approve",
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
              id: "generic.reject",
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
      isReviewFlowEnabled
      permanentDeletionAt
    }
    ${getReplyContents.fragments.PetitionField}
  `,
  PetitionField: gql`
    fragment PetitionRepliesFieldReply_PetitionField on PetitionField {
      id
      type
      requireApproval
      ...getReplyContents_PetitionField
    }
    ${getReplyContents.fragments.PetitionField}
  `,
  PetitionFieldReply: gql`
    fragment PetitionRepliesFieldReply_PetitionFieldReply on PetitionFieldReply {
      id
      content
      status
      field {
        id
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
