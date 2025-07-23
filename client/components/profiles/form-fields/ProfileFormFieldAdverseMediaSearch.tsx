import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  HStack,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  MediaIcon,
  RepeatIcon,
  RepeatOffIcon,
  SearchIcon,
  ShortSearchIcon,
} from "@parallel/chakra/icons";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { RestrictedPetitionFieldAlert } from "@parallel/components/petition-common/alerts/RestrictedPetitionFieldAlert";
import { useConfirmDeleteAdverseMediaSearchDialog } from "@parallel/components/petition-preview/dialogs/ConfirmDeleteAdverseMediaSearchDialog";
import {
  AdverseMediaArticle,
  AdverseMediaSearchTermInput,
  ProfileFormField_PetitionFieldFragment,
  ProfileFormFieldAdverseMediaSearch_copyReplyContentToProfileFieldValueDocument,
  ProfileFormFieldAdverseMediaSearch_updateProfileFieldValueDocument,
  ProfileFormFieldAdverseMediaSearch_updateProfileFieldValueMonitoringStatusDocument,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { useManagedWindow } from "@parallel/utils/hooks/useManagedWindow";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { unMaybeArray } from "@parallel/utils/types";
import { useHasAdverseMediaSearch } from "@parallel/utils/useHasAdverseMediaSearch";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { useConfirmUpdateAdverseMediaDialog } from "../dialogs/ConfirmUpdateAdverseMediaDialog";
import { ProfileFieldSuggestion } from "../ProfileFieldSuggestion";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  checkIfMonitoringIsActive,
  getSearchFrequency,
  MonitoringInfo,
  SearchProgressComponent,
} from "./ProfileFormFieldCommon";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldAdverseMediaSearchProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
  onRefreshField: () => void;
  profileId: string;
  fieldsWithIndices: [ProfileFormField_PetitionFieldFragment, PetitionFieldIndex][];
  petitionId?: string;
}

export function ProfileFormFieldAdverseMediaSearch({
  field,
  isDisabled,
  expiryDate,
  showExpiryDateDialog,
  onRefreshField,
  profileId,
  fieldsWithIndices,
  petitionId,
  properties,
  ...props
}: ProfileFormFieldAdverseMediaSearchProps) {
  const intl = useIntl();
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const contentButtonRef = useRef<HTMLButtonElement>(null);

  const tokenBase64 = btoa(
    JSON.stringify({
      profileTypeFieldId: field.id,
      profileId,
    }),
  );

  const { state, openWindow, closeWindow } = useManagedWindow({
    onRefreshField,
  });

  const content = props.value?.content;
  const hasReply = isNonNullish(content);

  useEffect(() => {
    if (!showSuggestions && !hasReply) {
      setShowSuggestions(true);
    }
    if (showSuggestions && hasReply) {
      setShowSuggestions(false);
    }
  }, [hasReply]);

  const hasAdverseMediaSearchFeatureFlag = useHasAdverseMediaSearch();

  useEffect(() => {
    if (router.query.profileTypeField === field.id) {
      contentButtonRef.current?.focus();
    }
  }, [router.query.profileTypeField]);

  const handleStart = () =>
    openWindow(
      `/${intl.locale}/app/adverse-media?${new URLSearchParams({
        token: tokenBase64,
        ...(isDisabled ? { readonly: "true" } : {}),
      }).toString()}`,
    );

  const { monitoring } = field.options as ProfileTypeFieldOptions<"ADVERSE_MEDIA_SEARCH">;

  const hasMonitoring = isNonNullish(monitoring);
  const hasActivationCondition = isNonNullish(monitoring?.activationCondition);

  const isMonitoringActive = hasActivationCondition
    ? checkIfMonitoringIsActive(monitoring, properties)
    : hasMonitoring;

  const monitoringFrequency = hasMonitoring ? getSearchFrequency(monitoring, properties) : null;

  const [updateProfileFieldValueMonitoringStatus] = useMutation(
    ProfileFormFieldAdverseMediaSearch_updateProfileFieldValueMonitoringStatusDocument,
  );

  const handleUpdateMonitoringStatus = async (enabled: boolean) => {
    try {
      await updateProfileFieldValueMonitoringStatus({
        variables: {
          profileId,
          profileTypeFieldId: field.id,
          enabled,
        },
      });
    } catch {}
  };

  const [updateProfileFieldValue] = useMutation(
    ProfileFormFieldAdverseMediaSearch_updateProfileFieldValueDocument,
  );
  const showConfirmDeleteAdverseMediaSearchDialog = useConfirmDeleteAdverseMediaSearchDialog();

  const handleRemove = async () => {
    try {
      await showConfirmDeleteAdverseMediaSearchDialog();
      await updateProfileFieldValue({
        variables: {
          profileId,
          fields: [
            {
              profileTypeFieldId: field.id,
              content: null,
            },
          ],
        },
      });
      closeWindow();
      onRefreshField();
    } catch {}
  };

  const handleOpenContent = async () => {
    const searchParams = new URLSearchParams({
      token: tokenBase64,
      hasReply: "true",
      ...(isDisabled ? { readonly: "true" } : {}),
    });

    const url = `/${intl.locale}/app/adverse-media?${searchParams.toString()}`;

    await openWindow(url);
  };

  const createdAt = content?.articles?.createdAt;

  const savedArticles = content?.articles?.items.filter(
    (article: AdverseMediaArticle) => article.classification === "RELEVANT",
  );

  const dismissedArticles = content?.articles?.items.filter(
    (article: AdverseMediaArticle) =>
      article.classification === "DISMISSED" || article.classification === "IRRELEVANT",
  );

  const [copyReplyContentToProfileFieldValue] = useMutation(
    ProfileFormFieldAdverseMediaSearch_copyReplyContentToProfileFieldValueDocument,
  );

  const showConfirmUpdateAdverseMediaDialog = useConfirmUpdateAdverseMediaDialog();

  const handleSuggestionClick = async (replyId: string) => {
    try {
      if (!petitionId) return;

      if (hasReply) {
        await showConfirmUpdateAdverseMediaDialog({
          hasMonitoring,
        });
      }
      await copyReplyContentToProfileFieldValue({
        variables: {
          profileId,
          profileTypeFieldId: field.id,
          petitionId,
          replyId,
        },
      });
      onRefreshField();
      setShowSuggestions(false);
    } catch {}
  };

  const suggestions = fieldsWithIndices.flatMap(([petitionField, fieldIndex]) => {
    return petitionField.replies
      .filter((reply) => {
        if (reply.isAnonymized) {
          return false;
        }
        return isNonNullish(reply.content.articles) && isNonNullish(reply.content.search);
      })
      .flatMap((reply) => {
        return unMaybeArray({
          text: intl.formatList(
            reply.content?.search
              ?.map((search: AdverseMediaSearchTermInput) => search.label || search.term)
              .filter(isNonNullish) ?? [],
            { type: "disjunction" },
          ),
          value: reply.content?.search
            ?.map((search: AdverseMediaSearchTermInput) => search.label || search.term)
            .join("-"),
          icon: <SearchIcon mr={1} role="presentation" />,
        })
          .filter(({ value }) => {
            // remove current values
            return (
              value !==
              content?.search
                ?.map((search: AdverseMediaSearchTermInput) => search.label || search.term)
                .join("-")
            );
          })
          .map(({ text, icon }, i) => {
            return (
              <ProfileFieldSuggestion
                key={`${reply.id}-${i}`}
                petitionField={petitionField}
                petitionFieldIndex={fieldIndex}
                onClick={() => {
                  handleSuggestionClick(reply.id);
                }}
                icon={icon}
                maxWidth="190px"
              >
                {text}
              </ProfileFieldSuggestion>
            );
          });
      });
  });

  return (
    <ProfileFormFieldInputGroup
      field={field}
      expiryDate={expiryDate}
      isDisabled={isDisabled}
      showSuggestionsButton={suggestions.length > 0 && hasReply && !isDisabled}
      areSuggestionsVisible={showSuggestions && !isDisabled}
      onToggleSuggestions={() => setShowSuggestions((v) => !v)}
    >
      <Stack flex="1">
        {isNonNullish(content) ? (
          <Stack border="1px solid" borderColor="gray.200" borderRadius="md" padding={2}>
            <HStack alignItems="flex-start">
              <MediaIcon marginTop={2} />
              <Stack flex="1" spacing={1}>
                <HStack justifyContent="space-between" minHeight="32px">
                  <Button
                    ref={contentButtonRef}
                    variant="link"
                    fontWeight={500}
                    whiteSpace="pre-wrap"
                    textAlign="left"
                    onClick={handleOpenContent}
                    isDisabled={!hasAdverseMediaSearchFeatureFlag}
                  >
                    {intl.formatList(
                      content?.search
                        ?.map((search: AdverseMediaSearchTermInput) => search.label || search.term)
                        .filter(isNonNullish) ?? [],
                      { type: "disjunction" },
                    )}
                  </Button>

                  {isDisabled ? null : (
                    <MoreOptionsMenuButton
                      variant="outline"
                      size="sm"
                      isDisabled={isDisabled}
                      options={
                        <MenuList minWidth="160px">
                          {hasMonitoring && isMonitoringActive ? (
                            <>
                              {props.value?.hasActiveMonitoring ? (
                                <MenuItem
                                  onClick={() => handleUpdateMonitoringStatus(false)}
                                  icon={<RepeatOffIcon boxSize={4} display="block" />}
                                >
                                  <FormattedMessage
                                    id="component.profile-form-field-adverse-media-search.stop-monitoring"
                                    defaultMessage="Stop monitoring"
                                  />
                                </MenuItem>
                              ) : (
                                <MenuItem
                                  onClick={() => handleUpdateMonitoringStatus(true)}
                                  icon={<RepeatIcon boxSize={4} display="block" />}
                                >
                                  <FormattedMessage
                                    id="component.profile-form-field-adverse-media-search.start-monitoring"
                                    defaultMessage="Enable monitoring"
                                  />
                                </MenuItem>
                              )}
                              <MenuDivider />
                            </>
                          ) : null}
                          <MenuItem onClick={handleRemove} color="red.500">
                            <FormattedMessage
                              id="component.profile-form-field-adverse-media-search.remove-adverse-media-search"
                              defaultMessage="Discard search and articles"
                            />
                          </MenuItem>
                        </MenuList>
                      }
                    />
                  )}
                </HStack>

                {isMonitoringActive &&
                props.value?.hasActiveMonitoring &&
                props.value?.hasPendingReview ? (
                  <HStack>
                    <Text fontSize="sm" fontWeight={500} color="purple.500">
                      <FormattedMessage
                        id="component.profile-form-field-adverse-media-search.monitoring-active"
                        defaultMessage="There is news not reviewed"
                      />
                    </Text>
                    <Badge colorScheme="purple">
                      <FormattedMessage id="generic.new" defaultMessage="New" />
                    </Badge>
                  </HStack>
                ) : null}
                {savedArticles?.length > 0 ? (
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="generic.saved-articles"
                      defaultMessage="{count, plural, =1 {# saved article} other {# saved articles}}"
                      values={{ count: savedArticles.length }}
                    />
                  </Text>
                ) : null}
                {dismissedArticles?.length > 0 ? (
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="generic.dismissed-articles"
                      defaultMessage="{count, plural, =1 {# dismissed article} other {# dismissed articles}}"
                      values={{ count: dismissedArticles.length }}
                    />
                  </Text>
                ) : null}
                {props.value?.hasDraft ? (
                  <Box>
                    <Badge colorScheme="blue">
                      <FormattedMessage
                        id="component.profile-form-field-adverse-media-search.draft"
                        defaultMessage="There are changes not saved"
                      />
                    </Badge>
                  </Box>
                ) : null}
              </Stack>
            </HStack>

            <MonitoringInfo
              isMonitoringActive={isMonitoringActive}
              hasActiveMonitoring={props.value?.hasActiveMonitoring}
              hasDraft={props.value?.hasDraft}
              monitoringFrequency={monitoringFrequency}
              createdAt={createdAt}
            />
          </Stack>
        ) : (
          <Stack width="100%" spacing={3}>
            <Box>
              <Button
                size="sm"
                fontSize="md"
                isDisabled={isDisabled || !hasAdverseMediaSearchFeatureFlag || state === "FETCHING"}
                onClick={() => handleStart()}
                leftIcon={<ShortSearchIcon />}
                fontWeight={500}
              >
                <FormattedMessage
                  id="component.profile-form-field-adverse-media-search.run-adverse-media-search"
                  defaultMessage="Run adverse media search"
                />
              </Button>
            </Box>
            {state === "FETCHING" ? (
              <SearchProgressComponent
                onCancelClick={() => closeWindow()}
                loadingMessage={intl.formatMessage({
                  id: "component.profile-form-field-adverse-media-search.wait-perform-search",
                  defaultMessage: "Please wait while we run the adverse media search...",
                })}
              />
            ) : null}
            {!hasAdverseMediaSearchFeatureFlag ? (
              <RestrictedPetitionFieldAlert fieldType="ADVERSE_MEDIA_SEARCH" />
            ) : null}
          </Stack>
        )}
        {showSuggestions && suggestions.length && !isDisabled ? (
          <HStack wrap="wrap" paddingX={2} width="100%">
            {suggestions}
          </HStack>
        ) : null}
      </Stack>
    </ProfileFormFieldInputGroup>
  );
}

const _mutations = [
  gql`
    mutation ProfileFormFieldAdverseMediaSearch_updateProfileFieldValue(
      $profileId: GID!
      $fields: [UpdateProfileFieldValueInput!]!
    ) {
      updateProfileFieldValue(profileId: $profileId, fields: $fields) {
        id
      }
    }
  `,
  gql`
    mutation ProfileFormFieldAdverseMediaSearch_updateProfileFieldValueMonitoringStatus(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $enabled: Boolean!
    ) {
      updateProfileFieldValueMonitoringStatus(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        enabled: $enabled
      ) {
        id
        properties {
          value {
            id
            hasActiveMonitoring
          }
          field {
            id
          }
        }
      }
    }
  `,
  gql`
    mutation ProfileFormFieldAdverseMediaSearch_copyReplyContentToProfileFieldValue(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $petitionId: GID!
      $replyId: GID!
      $expiryDate: Date
    ) {
      copyReplyContentToProfileFieldValue(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        petitionId: $petitionId
        replyId: $replyId
        expiryDate: $expiryDate
      ) {
        id
      }
    }
  `,
];
