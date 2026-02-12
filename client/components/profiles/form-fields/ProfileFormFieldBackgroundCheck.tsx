import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { MenuDivider, MenuItem, MenuList } from "@chakra-ui/react";
import { BusinessIcon, SearchIcon, ShortSearchIcon, UserIcon } from "@parallel/chakra/icons";
import {
  FalsePositivesBadge,
  PendingResolutionBadge,
  PendingReviewBadge,
} from "@parallel/components/common/BackgroundCheckBadges";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { BackgroundCheckRiskLabel } from "@parallel/components/petition-common/BackgroundCheckRiskLabel";
import { RestrictedPetitionFieldAlert } from "@parallel/components/petition-common/alerts/RestrictedPetitionFieldAlert";
import { Box, Button, Flex, HStack, Stack, Text } from "@parallel/components/ui";
import {
  ProfileFormFieldBackgroundCheck_copyReplyContentToProfileFieldValueDocument,
  ProfileFormFieldBackgroundCheck_updateProfileFieldValueDocument,
  ProfileFormField_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { useManagedWindow } from "@parallel/utils/hooks/useManagedWindow";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useBackgroundCheckProfileDownloadTask } from "@parallel/utils/tasks/useBackgroundCheckProfileDownloadTask";
import { unMaybeArray } from "@parallel/utils/types";
import { useHasBackgroundCheck } from "@parallel/utils/useHasBackgroundCheck";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { ProfileFieldSuggestion } from "../ProfileFieldSuggestion";
import { useConfirmModifyBackgroundCheckSearch } from "../dialogs/ConfirmModifyBackgroundCheckSearchDialog";
import { useConfirmRemoveEntityDialog } from "../dialogs/ConfirmRemoveEntityDialog";
import { useConfirmUpdateEntityDialog } from "../dialogs/ConfirmUpdateEntityDialog";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  MonitoringInfo,
  SearchProgressComponent,
  checkIfMonitoringIsActive,
  getSearchFrequency,
} from "./ProfileFormFieldCommon";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldBackgroundCheckProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
  onRefreshField: () => void;
  profileId: string;
  fieldsWithIndices: [ProfileFormField_PetitionFieldFragment, PetitionFieldIndex][];
  petitionId?: string;
}

export function ProfileFormFieldBackgroundCheck({
  field,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  onRefreshField,
  profileId,
  fieldsWithIndices,
  petitionId,
  properties,
  ...props
}: ProfileFormFieldBackgroundCheckProps) {
  const intl = useIntl();
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const entityButtonRef = useRef<HTMLButtonElement>(null);

  const tokenBase64 = btoa(
    JSON.stringify({
      profileTypeFieldId: field.id,
      profileId,
    }),
  );

  const { state, openWindow, closeWindow } = useManagedWindow({
    onRefreshField,
  });

  const hasReply = isNonNullish(props.value?.content);

  useEffect(() => {
    if (showSuggestions && hasReply) {
      setShowSuggestions(false);
    }
    if (!showSuggestions && !hasReply) {
      setShowSuggestions(true);
    }
  }, [hasReply]);

  const hasBackgroundCheck = useHasBackgroundCheck();
  const countryNames = useLoadCountryNames(intl.locale);

  const { entity, query, search } = props.value?.content ?? {};

  const isSearch = isNullish(entity) && isNonNullish(query);

  const savedOn = isSearch ? search?.createdAt : entity?.createdAt;

  const entityTypeLabel = getEntityTypeLabel(intl, query?.type);

  const countryName =
    query?.country && isNonNullish(countryNames.countries)
      ? countryNames.countries[query?.country.toUpperCase()]
      : query?.country;

  const birthCountryName =
    query?.birthCountry && isNonNullish(countryNames.countries)
      ? countryNames.countries[query?.birthCountry.toUpperCase()]
      : query?.birthCountry;

  const entityOrSearchName =
    entity?.name ??
    [entityTypeLabel, query?.name, query?.date, countryName, birthCountryName]
      .filter(isNonNullish)
      .join(" | ");

  useEffect(() => {
    if (router.query.profileTypeField === field.id) {
      entityButtonRef.current?.focus();
    }
  }, [router.query.profileTypeField]);

  const { monitoring } = field.options as ProfileTypeFieldOptions<"BACKGROUND_CHECK">;

  const hasActivationCondition = isNonNullish(monitoring?.activationCondition);
  const hasMonitoring = isNonNullish(monitoring);

  const isMonitoringActive = hasActivationCondition
    ? checkIfMonitoringIsActive(monitoring, properties)
    : hasMonitoring;

  const monitoringFrequency = hasMonitoring ? getSearchFrequency(monitoring, properties) : null;

  const showConfirmRemoveEntityDialog = useConfirmRemoveEntityDialog();
  const [updateProfileFieldValue] = useMutation(
    ProfileFormFieldBackgroundCheck_updateProfileFieldValueDocument,
  );

  const handleRemove = async () => {
    try {
      await showConfirmRemoveEntityDialog({ hasMonitoring });

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

  const showConfirmModifySearchDialog = useConfirmModifyBackgroundCheckSearch();
  const handleModifySearch = async () => {
    try {
      if (props.value?.hasStoredValue) {
        await showConfirmModifySearchDialog({ hasMonitoring });
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
        onRefreshField();
      }

      let url = `/${intl.locale}/app/background-check`;

      const { date, name, type, country, birthCountry } = query ?? {};

      const searchParams = new URLSearchParams({
        token: tokenBase64,
        ...(name ? { name } : {}),
        ...(date ? { date } : {}),
        ...(type ? { type } : {}),
        ...(country ? { country } : {}),
        ...(birthCountry ? { birthCountry } : {}),
      });

      url += `?${searchParams.toString()}`;

      await openWindow(url);
    } catch {}
  };

  const handleOpenSearchOrEntity = async () => {
    try {
      let url = `/${intl.locale}/app/background-check`;

      const { name, date, type, country, birthCountry } = query ?? {};
      const urlParams = new URLSearchParams({
        token: tokenBase64,
        ...(name ? { name } : {}),
        ...(date ? { date } : {}),
        ...(type ? { type } : {}),
        ...(country ? { country } : {}),
        ...(birthCountry ? { birthCountry } : {}),
        ...(isDisabled ? { readonly: "true" } : {}),
      });

      if (entity) {
        // Go to details
        url += `/${entity.id}?${urlParams}`;
      } else if (isSearch) {
        // Go to results because is a search
        url += `/results?${urlParams}`;
      }

      await openWindow(url);
    } catch {}
  };

  const downloadBackgroundCheckProfilePdf = useBackgroundCheckProfileDownloadTask();
  const handlePreviewPDF = async () => {
    try {
      await downloadBackgroundCheckProfilePdf({
        token: tokenBase64,
        entityId: entity.id,
      });
    } catch {}
  };

  const handleStart = () =>
    openWindow(
      `/${intl.locale}/app/background-check?${new URLSearchParams({
        token: tokenBase64,
      }).toString()}`,
    );

  const handleCancelClick = () => closeWindow();

  const [copyReplyContentToProfileFieldValue] = useMutation(
    ProfileFormFieldBackgroundCheck_copyReplyContentToProfileFieldValueDocument,
  );

  const showConfirmUpdateEntityDialog = useConfirmUpdateEntityDialog();

  const handleSuggestionClick = async (replyId: string) => {
    try {
      if (!petitionId) return;

      if (hasReply) {
        await showConfirmUpdateEntityDialog({
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
        return isNonNullish(reply.content.entity) || isNonNullish(reply.content.query);
      })
      .flatMap((reply) => {
        return unMaybeArray({
          text: reply.content.entity
            ? reply.content.entity.name
            : [
                getEntityTypeLabel(intl, reply.content.query.type),
                reply.content.query.name,
                reply.content.query.date,
                reply.content.query.country && countryNames.countries
                  ? countryNames.countries[reply.content.query.country]
                  : reply.content.query.country,
                reply.content.query.birthCountry && countryNames.countries
                  ? countryNames.countries[reply.content.query.birthCountry]
                  : reply.content.query.birthCountry,
              ]
                .filter(isNonNullish)
                .join(" | "),
          value:
            reply.content.entity?.id ??
            [
              reply.content.query.type,
              reply.content.query.name,
              reply.content.query.date,
              reply.content.query.country,
              reply.content.query.birthCountry,
            ]
              .filter(isNonNullish)
              .join("-"),
          icon: reply.content.entity ? (
            reply.content.entity.type === "Person" ? (
              <UserIcon mr={1} role="presentation" />
            ) : reply.content.entity.type === "Company" ? (
              <BusinessIcon mr={1} role="presentation" />
            ) : null
          ) : (
            <SearchIcon mr={1} role="presentation" />
          ),
        })
          .filter(({ value }) => {
            // remove current values
            if (isSearch) {
              return (
                value !==
                [query?.type, query?.name, query?.date, query?.country]
                  .filter(isNonNullish)
                  .join("-")
              );
            }
            return value !== entity?.id;
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
        {isNonNullish(props.value?.content) ? (
          <Stack border="1px solid" borderColor="gray.200" borderRadius="md" padding={2}>
            <HStack alignItems="flex-start">
              <Flex paddingTop={1}>
                {isSearch ? (
                  <SearchIcon />
                ) : entity?.type === "Person" ? (
                  <UserIcon />
                ) : (
                  <BusinessIcon />
                )}
              </Flex>
              <Stack flex="1">
                <HStack
                  wrap="wrap"
                  flex="1"
                  lineHeight={1.5}
                  gap={isSearch ? 1 : 2}
                  paddingTop={0.5}
                >
                  <Button
                    ref={entityButtonRef}
                    variant="link"
                    fontWeight={500}
                    whiteSpace="pre-wrap"
                    textAlign="left"
                    onClick={handleOpenSearchOrEntity}
                    disabled={!hasBackgroundCheck}
                  >
                    {entityOrSearchName}
                  </Button>
                  {isSearch ? (
                    <Text color="gray.500" fontSize="sm">
                      (
                      <FormattedMessage
                        id="generic.x-results"
                        defaultMessage="{count, plural, =0 {No results} =1 {1 result} other {# results}}"
                        values={{
                          count: search?.totalCount ?? 0,
                        }}
                      />
                      )
                    </Text>
                  ) : (
                    <HStack wrap="wrap">
                      {(entity?.properties?.topics as string[] | undefined)?.map((topic, i) => (
                        <BackgroundCheckRiskLabel key={i} risk={topic} />
                      ))}
                    </HStack>
                  )}
                </HStack>
                <HStack>
                  {isSearch &&
                  search?.totalCount > 0 &&
                  search?.falsePositivesCount === search?.totalCount ? (
                    <FalsePositivesBadge />
                  ) : props.value?.isDraft ? (
                    <PendingResolutionBadge />
                  ) : null}
                  {props.value.hasPendingReview ? <PendingReviewBadge /> : null}
                </HStack>
              </Stack>
              {(isSearch && !isDisabled) || !isSearch ? (
                <MoreOptionsMenuButton
                  variant="outline"
                  size="sm"
                  options={
                    <MenuList minWidth="160px">
                      {isSearch ? (
                        <MenuItem onClick={handleModifySearch}>
                          <FormattedMessage
                            id="component.profile-field-background-check.modify-search"
                            defaultMessage="Modify search"
                          />
                        </MenuItem>
                      ) : (
                        <MenuItem onClick={handlePreviewPDF}>
                          <FormattedMessage
                            id="component.profile-field-background-check.preview-pdf"
                            defaultMessage="Preview PDF"
                          />
                        </MenuItem>
                      )}

                      {!isDisabled ? (
                        <>
                          <MenuDivider />
                          <MenuItem onClick={handleRemove} color="red.500">
                            {isSearch ? (
                              <FormattedMessage
                                id="component.profile-field-background-check.remove-search"
                                defaultMessage="Remove search"
                              />
                            ) : (
                              <FormattedMessage
                                id="component.profile-field-background-check.remove-entity"
                                defaultMessage="Remove entity"
                              />
                            )}
                          </MenuItem>
                        </>
                      ) : null}
                    </MenuList>
                  }
                />
              ) : null}
            </HStack>

            <MonitoringInfo
              isMonitoringActive={isMonitoringActive}
              monitoringFrequency={monitoringFrequency}
              createdAt={savedOn}
            />
          </Stack>
        ) : (
          <Stack width="100%" gap={3}>
            <Box>
              <Button
                size="sm"
                fontSize="md"
                disabled={isDisabled || !hasBackgroundCheck || state === "FETCHING"}
                onClick={handleStart}
                leftIcon={<ShortSearchIcon />}
                fontWeight={500}
              >
                <FormattedMessage
                  id="component.profile-field-background-check.run-background-check"
                  defaultMessage="Run background check"
                />
              </Button>
            </Box>
            {state === "FETCHING" ? (
              <SearchProgressComponent
                onCancelClick={handleCancelClick}
                loadingMessage={intl.formatMessage({
                  id: "component.profile-field-background-check.wait-perform-search",
                  defaultMessage: "Please wait while we run the background check...",
                })}
              />
            ) : null}
            {!hasBackgroundCheck ? (
              <RestrictedPetitionFieldAlert fieldType="BACKGROUND_CHECK" />
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
    mutation ProfileFormFieldBackgroundCheck_updateProfileFieldValue(
      $profileId: GID!
      $fields: [UpdateProfileFieldValueInput!]!
    ) {
      updateProfileFieldValue(profileId: $profileId, fields: $fields) {
        id
      }
    }
  `,
  gql`
    mutation ProfileFormFieldBackgroundCheck_copyReplyContentToProfileFieldValue(
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
