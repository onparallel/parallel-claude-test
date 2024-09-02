import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  HStack,
  MenuDivider,
  MenuItem,
  MenuList,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/react";
import { BusinessIcon, RepeatIcon, SearchIcon, UserIcon } from "@parallel/chakra/icons";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { BackgroundCheckRiskLabel } from "@parallel/components/petition-common/BackgroundCheckRiskLabel";
import { RestrictedPetitionFieldAlert } from "@parallel/components/petition-common/RestrictedPetitionFieldAlert";
import {
  ProfileFormFieldBackgroundCheck_copyBackgroundCheckReplyToProfileFieldValueDocument,
  ProfileFormFieldBackgroundCheck_updateProfileFieldValueDocument,
  ProfileFormField_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useBackgroundCheckProfileDownloadTask } from "@parallel/utils/tasks/useBackgroundCheckProfileDownloadTask";
import { unMaybeArray } from "@parallel/utils/types";
import { useHasBackgroundCheck } from "@parallel/utils/useHasBackgroundCheck";
import { useInterval } from "@parallel/utils/useInterval";
import { useWindowEvent } from "@parallel/utils/useWindowEvent";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { ProfileFieldSuggestion } from "../ProfileFieldSuggestion";
import { useConfirmRemoveEntityDialog } from "../dialogs/ConfirmRemoveEntityDialog";
import { useConfirmUpdateEntityDialog } from "../dialogs/ConfirmUpdateEntityDialog";
import { ProfileFormFieldProps } from "./ProfileFormField";
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
  index,
  field,
  expiryDate,
  register,
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
  const [state, setState] = useState<"IDLE" | "FETCHING">("IDLE");

  const hasReply = isNonNullish(props.value?.content);
  const [showSuggestions, setShowSuggestions] = useState(!hasReply);
  const browserTabRef = useRef<Window>();
  const entityButtonRef = useRef<HTMLButtonElement>(null);

  const tokenBase64 = btoa(
    JSON.stringify({
      profileTypeFieldId: field.id,
      profileId,
    }),
  );

  useEffect(() => {
    if (router.query.profileTypeField === field.id) {
      entityButtonRef.current?.focus();
    }
  }, [router.query.profileTypeField]);

  useEffect(() => {
    if (showSuggestions && hasReply) {
      setShowSuggestions(false);
    }
    if (!showSuggestions && !hasReply) {
      setShowSuggestions(true);
    }
  }, [hasReply]);

  const hasBackgroundCheck = useHasBackgroundCheck();

  const { entity, query, search } = props.value?.content ?? {};

  const isSearch = isNullish(entity) && isNonNullish(query);

  const savedOn = isSearch ? search?.createdAt : entity?.createdAt;

  const entityTypeLabel = getEntityTypeLabel(intl, query?.type);

  const entityOrSearchName =
    entity?.name ?? [entityTypeLabel, query?.name, query?.date].filter(isNonNullish).join(" | ");

  useInterval(
    async (done) => {
      if (isNonNullish(browserTabRef.current) && browserTabRef.current.closed) {
        setState("IDLE");
        done();
      } else if (state === "FETCHING") {
        onRefreshField();
      }
    },
    5000,
    [onRefreshField, state],
  );

  useEffect(() => {
    const handleRouteChange = () => {
      if (isNonNullish(browserTabRef.current)) {
        browserTabRef.current.close();
      }
    };

    router.events.on("routeChangeStart", handleRouteChange);

    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, []);

  useWindowEvent(
    "message",
    async (e) => {
      const browserTab = browserTabRef.current;
      if (isNullish(browserTab) || e.source !== browserTab) {
        return;
      }
      if (e.data === "refresh") {
        onRefreshField();
      } else if (e.data.event === "update-info") {
        const token = e.data.token;
        if (token !== tokenBase64) {
          return;
        }

        browserTab.postMessage(
          {
            event: "info-updated",
            entityIds: [entity?.id].filter(isNonNullish),
          },
          browserTab.origin,
        );
      }
    },
    [onRefreshField, tokenBase64],
  );

  const { monitoring } = field.options as ProfileTypeFieldOptions<"BACKGROUND_CHECK">;

  const hasActivationCondition = isNonNullish(monitoring?.activationCondition);
  const hasMonitoring = isNonNullish(monitoring);

  const checkIfMonitoringIsActive = () => {
    const conditions = monitoring!.activationCondition;
    const property = properties?.find(({ field }) => field.id === conditions?.profileTypeFieldId);
    return conditions?.values?.includes(property?.value?.content?.value) ?? false;
  };

  const getSearchFrequency = () => {
    if (monitoring?.searchFrequency?.type === "FIXED") {
      return monitoring.searchFrequency.frequency.split("_");
    } else {
      const searchFrequency = monitoring!.searchFrequency;
      const property = properties?.find(
        ({ field }) => field.id === searchFrequency?.profileTypeFieldId,
      );
      const frequency = searchFrequency.options.find(
        ({ value }) => value === property?.value?.content?.value,
      )?.frequency;
      return frequency?.split("_") ?? ["3", "YEARS"];
    }
  };

  const isMonitoringActive = hasActivationCondition ? checkIfMonitoringIsActive() : hasMonitoring;
  const monitoringFrequency = hasMonitoring ? getSearchFrequency() : null;

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

      if (browserTabRef.current) {
        browserTabRef.current.close();
        setState("IDLE");
      }

      onRefreshField();
    } catch {}
  };

  const handleModifySearch = async () => {
    try {
      setState("FETCHING");
      let url = `/${intl.locale}/app/background-check`;

      const { date, name, type } = query ?? {};

      const searchParams = new URLSearchParams({
        token: tokenBase64,
        ...(name ? { name } : {}),
        ...(date ? { date } : {}),
        ...(type ? { type } : {}),
      });

      url += `?${searchParams.toString()}`;

      browserTabRef.current = await openNewWindow(url);
    } catch {}
  };

  const handleOpenSearchOrEntity = async () => {
    try {
      let url = `/${intl.locale}/app/background-check`;

      const { name, date, type } = query ?? {};
      const urlParams = new URLSearchParams({
        token: tokenBase64,
        ...(name ? { name } : {}),
        ...(date ? { date } : {}),
        ...(type ? { type } : {}),
        ...(isDisabled ? { readonly: "true" } : {}),
      });

      if (entity) {
        // Go to details
        url += `/${entity.id}?${urlParams}`;
      } else if (isSearch) {
        // Go to results because is a search
        url += `/results?${urlParams}`;
      }

      browserTabRef.current = await openNewWindow(url);
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

  const handleStart = async () => {
    setState("FETCHING");
    let url = `/${intl.locale}/app/background-check`;

    const searchParams = new URLSearchParams({
      token: tokenBase64,
    });

    url += `?${searchParams.toString()}`;

    try {
      browserTabRef.current = await openNewWindow(url);
    } catch {}
  };

  const handleCancelClick = () => {
    setState("IDLE");
    browserTabRef.current?.close();
  };

  const [copyBackgroundCheckReplyToProfileFieldValue] = useMutation(
    ProfileFormFieldBackgroundCheck_copyBackgroundCheckReplyToProfileFieldValueDocument,
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
      await copyBackgroundCheckReplyToProfileFieldValue({
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
              ]
                .filter(isNonNullish)
                .join(" | "),
          value:
            reply.content.entity?.id ??
            [reply.content.query.type, reply.content.query.name, reply.content.query.date]
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
                value !== [query?.type, query?.name, query?.date].filter(isNonNullish).join("-")
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
              <HStack
                wrap="wrap"
                flex="1"
                lineHeight={1.5}
                spacing={isSearch ? 1 : 2}
                paddingTop={0.5}
              >
                <Button
                  ref={entityButtonRef}
                  variant="link"
                  fontWeight={500}
                  whiteSpace="pre-wrap"
                  textAlign="left"
                  onClick={handleOpenSearchOrEntity}
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
                  <HStack>
                    {(entity?.properties?.topics as string[] | undefined)?.map((topic, i) => (
                      <BackgroundCheckRiskLabel key={i} risk={topic} />
                    ))}
                  </HStack>
                )}
              </HStack>
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

            {hasMonitoring && isMonitoringActive ? (
              <HStack>
                <SmallPopover
                  content={
                    <Text fontSize="sm">
                      <FormattedMessage
                        id="component.profile-field-background-check.active-monitoring"
                        defaultMessage="Active monitoring"
                      />{" "}
                      {monitoringFrequency![1] === "MONTHS" ? (
                        <FormattedMessage
                          id="component.profile-field-background-check.results-monitored-x-months"
                          defaultMessage="The results are monitored every {count, plural, =1 {month} other {# months}}."
                          values={{ count: parseInt(monitoringFrequency![0]) }}
                        />
                      ) : (
                        <FormattedMessage
                          id="component.profile-field-background-check.results-monitored-x-years"
                          defaultMessage="The results are monitored every {count, plural, =1 {year} other {# years}}."
                          values={{ count: parseInt(monitoringFrequency![0]) }}
                        />
                      )}
                    </Text>
                  }
                  placement="bottom"
                  width="250px"
                >
                  <RepeatIcon color="yellow.500" marginBottom={0.5} />
                </SmallPopover>
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.profile-field-background-check.last-updated-on"
                    defaultMessage="Last updated on {date}"
                    values={{
                      date: intl.formatDate(new Date(savedOn), FORMATS.LL),
                    }}
                  />
                </Text>
              </HStack>
            ) : (
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.profile-field-background-check.saved-on"
                  defaultMessage="Saved on {date}"
                  values={{
                    date: intl.formatDate(new Date(savedOn), FORMATS.LL),
                  }}
                />
              </Text>
            )}
          </Stack>
        ) : (
          <Stack width="100%" spacing={3}>
            <Box>
              <Button
                size="sm"
                fontSize="md"
                isDisabled={isDisabled || !hasBackgroundCheck || state === "FETCHING"}
                onClick={handleStart}
              >
                <FormattedMessage
                  id="component.profile-field-background-check.run-background-check"
                  defaultMessage="Run background check"
                />
              </Button>
            </Box>
            {state === "FETCHING" ? (
              <Stack>
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.profile-field-background-check.wait-perform-search"
                    defaultMessage="Please wait while we run the background check..."
                  />
                </Text>
                <HStack>
                  <Progress
                    size="md"
                    isIndeterminate
                    colorScheme="green"
                    borderRadius="full"
                    width="100%"
                  />
                  <Button size="sm" fontWeight="normal" onClick={handleCancelClick}>
                    <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
                  </Button>
                </HStack>
              </Stack>
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
    mutation ProfileFormFieldBackgroundCheck_copyBackgroundCheckReplyToProfileFieldValue(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $petitionId: GID!
      $replyId: GID!
      $expiryDate: Date
    ) {
      copyBackgroundCheckReplyToProfileFieldValue(
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
