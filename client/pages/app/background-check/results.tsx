import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  Skeleton,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  BusinessIcon,
  CheckIcon,
  DeleteIcon,
  RepeatIcon,
  SaveIcon,
  StarEmptyIcon,
  UndoIcon,
  UserIcon,
  UserXIcon,
  XCircleIcon,
} from "@parallel/chakra/icons";
import { NewResultItemBadge } from "@parallel/components/common/BackgroundCheckBadges";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { BackgroundCheckRiskLabel } from "@parallel/components/petition-common/BackgroundCheckRiskLabel";
import { usePreviewPetitionFieldBackgroundCheckFalsePositivesDialog } from "@parallel/components/petition-preview/dialogs/PreviewPetitionFieldBackgroundCheckFalsePositivesDialog";
import { usePreviewPetitionFieldBackgroundCheckReplaceReplyDialog } from "@parallel/components/petition-preview/dialogs/PreviewPetitionFieldBackgroundCheckReplaceReplyDialog";
import { BackgroundCheckSearchDifferencesAlert } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckSearchDifferencesAlert";
import { useBackgroundCheckContentsNotUpdatedDialog } from "@parallel/components/profiles/dialogs/BackgroundCheckContentsNotUpdatedDialog";
import { useConfirmModifyBackgroundCheckSearch } from "@parallel/components/profiles/dialogs/ConfirmModifyBackgroundCheckSearchDialog";
import { Tooltip } from "@parallel/components/ui";
import {
  BackgroundCheckEntitySearchType,
  BackgroundCheckFieldSearchResults_backgroundCheckEntitySearchDocument,
  BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema_BackgroundCheckEntitySearchCompany_Fragment,
  BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema_BackgroundCheckEntitySearchPerson_Fragment,
  BackgroundCheckFieldSearchResults_saveProfileFieldValueDraftDocument,
  BackgroundCheckFieldSearchResults_updateBackgroundCheckEntityDocument,
  BackgroundCheckFieldSearchResults_updateBackgroundCheckSearchFalsePositivesDocument,
  BackgroundCheckFieldSearchResults_updateProfileFieldValueDocument,
  BackgroundCheckFieldSearchResults_updateProfileFieldValueOptionsDocument,
} from "@parallel/graphql/__types";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { formatPartialDate } from "@parallel/utils/formatPartialDate";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { withError } from "@parallel/utils/promises/withError";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { useBackgroundCheckResultsDownloadTask } from "@parallel/utils/tasks/useBackgroundCheckResultsDownloadTask";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import { useLoadOpenSanctionsCountryNames } from "@parallel/utils/useLoadOpenSanctionsCountryNames";
import { createHash } from "crypto";
import Head from "next/head";
import { useRouter } from "next/router";
import { Fragment, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, pick } from "remeda";
type BackgroundCheckFieldSearchResults_Selection = { isNew: boolean } & (
  | ({
      type: "Person";
    } & BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema_BackgroundCheckEntitySearchPerson_Fragment)
  | ({
      type: "Company";
    } & BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema_BackgroundCheckEntitySearchCompany_Fragment)
);
interface BackgroundCheckFieldSearchResultsTableContext {
  savedEntityId: string | null;
  onDeleteEntity: (entityId: string) => void;
  onSaveEntity: (entityId: string) => void;
  isDeletingEntity: Record<string, boolean>;
  isSavingEntity: Record<string, boolean>;
  isReadOnly: boolean;
  isDisabled: boolean;
  onFalsePositiveClick: (entityIds: string[], isFalsePositive: boolean) => Promise<void>;
}

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
};

function BackgroundCheckFieldSearchResults({
  token,
  name,
  date,
  type,
  country,
  birthCountry,
  isDisabled,
}: UnwrapPromise<ReturnType<typeof BackgroundCheckFieldSearchResults.getInitialProps>>) {
  const router = useRouter();
  const { query } = router;
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [isDeletingEntity, setIsDeletingEntity] = useState<Record<string, boolean>>({});
  const [isSavingEntity, setIsSavingEntity] = useState<Record<string, boolean>>({});
  const isReadOnly = query.readonly === "true";
  const isTemplate = query.template === "true";

  const countryNames = useLoadCountryNames(intl.locale);

  const countryName =
    country && isNonNullish(countryNames.countries)
      ? countryNames.countries[country.toUpperCase()]
      : country;

  const birthCountryName =
    birthCountry && isNonNullish(countryNames.countries)
      ? countryNames.countries[birthCountry.toUpperCase()]
      : birthCountry;

  const entityTypeLabel = getEntityTypeLabel(intl, type);

  const { data, loading, error, refetch } = useQuery(
    BackgroundCheckFieldSearchResults_backgroundCheckEntitySearchDocument,
    {
      variables: {
        token,
        name,
        date: date ? new Date(date).toISOString().substring(0, 10) : null,
        type,
        country,
        birthCountry: type === "PERSON" ? birthCountry : null,
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const result = data?.backgroundCheckEntitySearch;

  const savedEntityId = result?.items.find((i) => i.isMatch)?.id ?? null;

  const showGenericErrorToast = useGenericErrorToast();
  if (isNonNullish(error)) {
    showGenericErrorToast();
  }

  const showPetitionFieldBackgroundCheckReplaceReplyDialog =
    usePreviewPetitionFieldBackgroundCheckReplaceReplyDialog();

  const [updateBackgroundCheckEntity] = useMutation(
    BackgroundCheckFieldSearchResults_updateBackgroundCheckEntityDocument,
  );

  const handleSave = useCallback(
    async (entityId: string) => {
      setIsSavingEntity((curr) => ({ ...curr, [entityId]: true }));

      try {
        if (savedEntityId) {
          await showPetitionFieldBackgroundCheckReplaceReplyDialog();
        }
        await updateBackgroundCheckEntity({
          variables: {
            token,
            entityId,
          },
        });
        await refetch({ force: false });
        window.opener?.postMessage("refresh");
      } catch {
      } finally {
        setIsSavingEntity(({ [entityId]: _, ...curr }) => curr);
      }
    },
    [token, name, date, savedEntityId, refetch],
  );

  const handleDelete = useCallback(
    async (entityId: string) => {
      setIsDeletingEntity((curr) => ({ ...curr, [entityId]: true }));

      try {
        await updateBackgroundCheckEntity({
          variables: {
            token,
            entityId: null,
          },
        });
        await refetch({ force: false });
        window.opener?.postMessage("refresh");
      } catch {
      } finally {
        setIsDeletingEntity(({ [entityId]: _, ...curr }) => curr);
      }
    },
    [token, refetch],
  );

  const columns = useBackgroundCheckDataColumns({ type });

  const handleRowClick = useCallback(
    function (row: BackgroundCheckFieldSearchResults_Selection) {
      router.push(
        `/app/background-check/${row.id}?${new URLSearchParams({
          token,
          name,
          ...(date ? { date } : {}),
          ...(type ? { type } : {}),
          ...(country ? { country } : {}),
          ...(birthCountry ? { birthCountry } : {}),
          ...(isReadOnly ? { readonly: "true" } : {}),
          ...(isTemplate ? { template: "true" } : {}),
        })}`,
      );
    },
    [token, name, date, type, country, birthCountry, isReadOnly, isTemplate],
  );

  const showConfirmModifySearchDialog = useConfirmModifyBackgroundCheckSearch();
  const [updateProfileFieldValue] = useMutation(
    BackgroundCheckFieldSearchResults_updateProfileFieldValueDocument,
  );
  const handleResetClick = async () => {
    try {
      const tokenData = JSON.parse(atob(token));
      if (result?.hasStoredValue && "profileId" in tokenData) {
        await showConfirmModifySearchDialog({ hasMonitoring: true });
        await updateProfileFieldValue({
          variables: {
            profileId: tokenData.profileId as string,
            fields: [
              {
                profileTypeFieldId: tokenData.profileTypeFieldId as string,
                content: null,
              },
            ],
          },
        });
      }

      router.push(
        `/app/background-check?${new URLSearchParams({
          token,
          name,
          ...(date ? { date } : {}),
          ...(type ? { type } : {}),
          ...(country ? { country } : {}),
          ...(birthCountry ? { birthCountry } : {}),
          ...(isTemplate ? { template: "true" } : {}),
        })}`,
      );
    } catch {}
  };

  const showPreviewPetitionFieldBackgroundCheckFalsePositivesDialog =
    usePreviewPetitionFieldBackgroundCheckFalsePositivesDialog();

  const [updateBackgroundCheckSearchFalsePositives] = useMutation(
    BackgroundCheckFieldSearchResults_updateBackgroundCheckSearchFalsePositivesDocument,
  );

  const handleSetFalsePositives = useCallback(
    async (entityIds: string[], isFalsePositive: boolean) => {
      await updateBackgroundCheckSearchFalsePositives({
        variables: {
          token,
          entityIds,
          isFalsePositive,
        },
      });
      await refetch({ force: false });
      window.opener?.postMessage("refresh");
    },
    [token, refetch],
  );

  const handleFalsePositivesButtonClick = async () => {
    try {
      await showPreviewPetitionFieldBackgroundCheckFalsePositivesDialog();
      await handleSetFalsePositives(result?.items.map((i) => i.id) ?? [], true);
    } catch {}
  };

  const handleDownloadPdfClick = async () => {
    try {
      await downloadBackgroundCheckResultsPdf({
        token,
        name,
        date,
        type,
        country,
        birthCountry,
      });
    } catch {}
  };

  const context = useMemo(
    () => ({
      savedEntityId,
      isDeletingEntity,
      isSavingEntity,
      onDeleteEntity: handleDelete,
      onSaveEntity: handleSave,
      isReadOnly: isTemplate || isReadOnly,
      isDisabled,
      onFalsePositiveClick: handleSetFalsePositives,
    }),
    [savedEntityId, isDeletingEntity, isSavingEntity, isDisabled],
  );

  const { page, items } = state;

  const [tableRows, totalCount] = useMemo(() => {
    const rows = result?.items.map((i) => ({
      ...i,
      isNew: result.reviewDiff?.items?.added?.some((addedItem) => addedItem.id === i.id) ?? false,
    })) as BackgroundCheckFieldSearchResults_Selection[] | undefined;
    if (!rows) {
      return [[], 0];
    }
    return [rows.slice((page - 1) * items, page * items), result?.totalCount];
  }, [result, page, items]);

  const isProfile = "profileId" in JSON.parse(atob(token));

  const [saveProfileFieldValueDraft] = useMutation(
    BackgroundCheckFieldSearchResults_saveProfileFieldValueDraftDocument,
  );

  const handleSaveToProfile = async () => {
    try {
      const data = JSON.parse(atob(token));
      if (!("profileId" in data)) {
        return;
      }
      await saveProfileFieldValueDraft({
        variables: {
          profileId: data.profileId,
          profileTypeFieldId: data.profileTypeFieldId,
        },
      });
      await refetch({ force: false });
      window.opener?.postMessage("refresh");
    } catch {}
  };

  const toast = useToast();
  const showBackgroundCheckContentsNotUpdatedDialog = useBackgroundCheckContentsNotUpdatedDialog();
  const downloadBackgroundCheckResultsPdf = useBackgroundCheckResultsDownloadTask();

  const handleRefreshSearch = useCallback(async () => {
    try {
      const oldData = result ? pick(result, ["items", "totalCount"]) : null;
      const { data } = await refetch({ force: true });
      const newData = data ? pick(data.backgroundCheckEntitySearch, ["items", "totalCount"]) : null;

      const oldMd5 = createHash("md5").update(JSON.stringify(oldData)).digest("hex");
      const newMd5 = createHash("md5").update(JSON.stringify(newData)).digest("hex");
      if (oldMd5 === newMd5) {
        await withError(showBackgroundCheckContentsNotUpdatedDialog());
      } else {
        toast({
          title: intl.formatMessage({
            id: "component.background-check-search-result.search-refreshed-toast-title",
            defaultMessage: "Search refreshed",
          }),
          description: intl.formatMessage({
            id: "component.background-check-search-result.search-refreshed-toast-description",
            defaultMessage: "The search results have been refreshed.",
          }),
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch {}
  }, [result, refetch]);

  const [updateProfileFieldValueOptions] = useMutation(
    BackgroundCheckFieldSearchResults_updateProfileFieldValueOptionsDocument,
  );

  const handleConfirmChangesClick = async () => {
    try {
      const data = JSON.parse(atob(token));
      if (!("profileId" in data)) {
        return;
      }

      await updateProfileFieldValueOptions({
        variables: {
          profileId: data.profileId,
          profileTypeFieldId: data.profileTypeFieldId,
          data: { pendingReview: false },
        },
      });

      window.opener?.postMessage("refresh");

      await refetch();

      toast({
        title: intl.formatMessage({
          id: "component.background-check-search-result.search-refreshed-toast-title",
          defaultMessage: "Search refreshed",
        }),
        description: intl.formatMessage({
          id: "component.background-check-search-result.search-refreshed-toast-description",
          defaultMessage: "The search results have been refreshed.",
        }),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch {}
  };

  return (
    <>
      <Head>
        <title>
          {
            // eslint-disable-next-line formatjs/no-literal-string-in-jsx
            `${intl.formatMessage({
              id: "generic.petition-field-type-background-check",
              defaultMessage: "Background check",
            })} | Parallel`
          }
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Stack paddingX={6} paddingY={5} spacing={6} minHeight="100vh" backgroundColor="gray.50">
        <HStack justify="space-between" flexWrap="wrap">
          {result && (totalCount || !loading) ? (
            <>
              <Heading size="md">
                <FormattedMessage
                  id="component.background-check-search-result.results-found"
                  defaultMessage="Results found: {amount}"
                  values={{ amount: totalCount }}
                />
              </Heading>
              <HStack>
                <Text as="span">
                  <FormattedMessage
                    id="generic.results-for"
                    defaultMessage="Results for {date}"
                    values={{
                      date: intl.formatDate(result.createdAt, FORMATS.FULL),
                    }}
                  />
                </Text>
                {!isReadOnly && !isDisabled ? (
                  <IconButtonWithTooltip
                    variant="outline"
                    label={intl.formatMessage({
                      id: "component.background-check-search-result.refresh-search",
                      defaultMessage: "Refresh search",
                    })}
                    icon={<RepeatIcon />}
                    onClick={handleRefreshSearch}
                    isDisabled={isDisabled}
                  />
                ) : null}
              </HStack>
            </>
          ) : (
            <>
              <HStack flex="1">
                <Skeleton height="24px" width="100%" maxWidth="300px" />
                <Skeleton height="24px" width="50px" />
              </HStack>
              <Skeleton height="24px" width="100%" maxWidth="260px" />
            </>
          )}
          {!isReadOnly &&
          !isDisabled &&
          result?.hasPendingReview &&
          (totalCount === 0 || result.reviewDiff?.items?.added) ? (
            <BackgroundCheckSearchDifferencesAlert
              diff={result.reviewDiff}
              onConfirmChangesClick={handleConfirmChangesClick}
            />
          ) : null}
        </HStack>
        <TablePage
          isHighlightable
          columns={columns}
          context={context}
          rows={tableRows}
          rowKeyProp="id"
          rowProps={(row) => ({
            backgroundColor: row.isNew ? "green.50" : undefined,
          })}
          page={state.page}
          pageSize={state.items}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
          }
          loading={loading}
          totalCount={totalCount}
          onRowClick={isDisabled ? undefined : handleRowClick}
          header={
            <Flex
              direction={{ base: "column", sm: "row" }}
              gridGap={3}
              paddingX={4}
              paddingY={2}
              justifyContent={"space-between"}
            >
              <Box alignSelf="center">
                <Text as="span" fontWeight={600}>
                  <FormattedMessage
                    id="component.background-check-search-result.searching-for"
                    defaultMessage="Searching for"
                  />
                  {": "}
                </Text>
                <Text as="span">
                  {[entityTypeLabel, name, date, countryName, birthCountryName]
                    .filter(isNonNullish)
                    .join(" | ")}
                </Text>
              </Box>

              <HStack>
                <ResponsiveButtonIcon
                  fontWeight={500}
                  variant="outline"
                  icon={<SaveIcon />}
                  onClick={handleDownloadPdfClick}
                  label={intl.formatMessage({
                    id: "component.background-check-search-result.download-pdf",
                    defaultMessage: "Download PDF",
                  })}
                  breakpoint="lg"
                />
                <Button
                  variant="outline"
                  fontWeight={500}
                  onClick={handleResetClick}
                  isDisabled={query.readonly === "true" || isDisabled}
                >
                  <FormattedMessage
                    id="component.background-check-search-result.modify-search"
                    defaultMessage="Modify search"
                  />
                </Button>

                {isProfile && result?.isDraft && totalCount === 0 ? (
                  <ResponsiveButtonIcon
                    colorScheme="purple"
                    icon={<SaveIcon boxSize={5} />}
                    onClick={handleSaveToProfile}
                    label={intl.formatMessage({
                      id: "page.adverse-media-search.save-search",
                      defaultMessage: "Save to profile",
                    })}
                    breakpoint="lg"
                    isDisabled={isDisabled}
                  />
                ) : (
                  <Button
                    variant="outline"
                    fontWeight={500}
                    color="primary.500"
                    borderColor="primary.500"
                    onClick={handleFalsePositivesButtonClick}
                    isDisabled={
                      isTemplate ||
                      isReadOnly ||
                      totalCount === 0 ||
                      isNonNullish(savedEntityId) ||
                      result?.items.every((i) => i.isFalsePositive) ||
                      isDisabled
                    }
                  >
                    <FormattedMessage
                      id="component.background-check-search-result.mark-as-false-positives"
                      defaultMessage="Mark as false positives"
                    />
                  </Button>
                )}
              </HStack>
            </Flex>
          }
          body={
            result?.items.length === 0 && !loading ? (
              <Stack flex="1" alignItems="center" justifyContent="center" spacing={4}>
                <Image
                  maxWidth="166px"
                  height="77px"
                  width="100%"
                  src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/search/empty-search.svg`}
                />
                <Stack textAlign="center">
                  <Text>
                    <FormattedMessage
                      id="component.background-check-search-result.no-results-found"
                      defaultMessage="It seems that the entity you are looking for is not listed anywhere!"
                    />
                  </Text>
                  <Text>
                    {isProfile && result.isDraft ? (
                      <FormattedMessage
                        id="component.background-check-search-result.manual-save-search-profile-text"
                        defaultMessage="<b>Save the search to the profile</b> to preserve the evidence for a future audit."
                      />
                    ) : (
                      <FormattedMessage
                        id="component.background-check-search-result.automatically-saved-search-text"
                        defaultMessage="We have automatically saved the search to preserve the evidence for a future audit."
                      />
                    )}
                  </Text>
                </Stack>
              </Stack>
            ) : null
          }
        />
      </Stack>
    </>
  );
}

function useBackgroundCheckDataColumns({ type }: { type: string | null }) {
  const intl = useIntl();
  const { countries } = useLoadOpenSanctionsCountryNames(intl.locale);
  return useMemo<
    TableColumn<
      BackgroundCheckFieldSearchResults_Selection,
      BackgroundCheckFieldSearchResultsTableContext
    >[]
  >(
    () => [
      {
        key: "name",
        label: intl.formatMessage({
          id: "component.background-check-search-result.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => {
          return (
            <Flex alignItems="center" gap={2}>
              {row.type === "Person" ? (
                <Tooltip
                  placement="bottom-end"
                  label={intl.formatMessage({
                    id: "component.background-check-search-result.person",
                    defaultMessage: "Person",
                  })}
                >
                  <UserIcon />
                </Tooltip>
              ) : (
                <Tooltip
                  placement="bottom-end"
                  label={intl.formatMessage({
                    id: "component.background-check-search-result.company",
                    defaultMessage: "Company",
                  })}
                >
                  <BusinessIcon />
                </Tooltip>
              )}
              {row.name}
              {row.isNew ? <NewResultItemBadge /> : null}
            </Flex>
          );
        },
      },
      {
        key: "country",
        label: intl.formatMessage({
          id: "component.background-check-search-result.country-territory",
          defaultMessage: "Country/Territory",
        }),
        CellContent: ({ row }) => {
          if (row.type === "Person") {
            return (
              <Flex gap={2} flexWrap="wrap">
                {row.properties.country?.map((c, i) => (
                  <Text as="span" key={i}>
                    {countries?.[c] ?? countries?.[c.toUpperCase()] ?? "-"}
                  </Text>
                )) ?? "-"}
              </Flex>
            );
          } else if (row.type === "Company") {
            return (
              <Flex gap={2} flexWrap="wrap">
                {row.properties.jurisdiction?.map((c, i) => (
                  <Text as="span" key={i}>
                    {countries?.[c] ?? countries?.[c.toUpperCase()] ?? "-"}
                  </Text>
                )) ?? "-"}
              </Flex>
            );
          } else {
            return <>{"-"}</>;
          }
        },
      },
      {
        key: "gender",
        label: intl.formatMessage({
          id: "component.background-check-search-result.gender",
          defaultMessage: "Gender",
        }),
        CellContent: ({ row }) => {
          if (row.type === "Person") {
            return (
              <Flex gap={2} flexWrap="wrap">
                {row.properties.gender?.map((g, i) => (
                  <Text as="span" key={i}>
                    {g === "male"
                      ? intl.formatMessage({ id: "generic.male", defaultMessage: "Male" })
                      : g === "female"
                        ? intl.formatMessage({ id: "generic.female", defaultMessage: "Female" })
                        : g || "-"}
                  </Text>
                )) ?? "-"}
              </Flex>
            );
          } else {
            return <>{"-"}</>;
          }
        },
      },
      {
        key: "tags",
        label: intl.formatMessage({
          id: "component.background-check-search-result.risk-labels",
          defaultMessage: "Risk labels",
        }),
        CellContent: ({ row }) => {
          return (
            <Flex gap={2} flexWrap="wrap">
              {row.properties?.topics?.map((hint, i) => (
                <BackgroundCheckRiskLabel key={i} risk={hint} />
              )) ?? "-"}
            </Flex>
          );
        },
      },
      ...(type !== "COMPANY"
        ? [
            {
              key: "countryOfBirth",
              label: intl.formatMessage({
                id: "component.background-check-search-result.country-of-birth",
                defaultMessage: "Country of birth",
              }),
              CellContent: ({ row }: { row: BackgroundCheckFieldSearchResults_Selection }) => {
                if (row.type === "Person") {
                  return (
                    <Flex gap={2} flexWrap="wrap">
                      {row.properties.countryOfBirth?.map((c, i) => (
                        <Text as="span" key={i}>
                          {countries?.[c] ?? countries?.[c.toUpperCase()] ?? "-"}
                        </Text>
                      )) ?? "-"}
                    </Flex>
                  );
                } else {
                  return <>{"-"}</>;
                }
              },
            },
          ]
        : []),
      {
        key: "dateOfBirth",
        label:
          type === "COMPANY"
            ? intl.formatMessage({
                id: "component.background-check-search-result.incorporation-date",
                defaultMessage: "Incorporation date",
              })
            : intl.formatMessage({
                id: "component.background-check-search-result.date-of-birth",
                defaultMessage: "Date of birth",
              }),
        CellContent: ({ row }) => {
          if (row.type === "Person") {
            return (
              <Flex gap={2} flexWrap="wrap">
                {row.properties.birthDate?.map((date, i) => (
                  <Fragment key={i}>
                    <Text as="span" key={i}>
                      {formatPartialDate({ date })}
                    </Text>
                    {i < row.properties.birthDate!.length - 1 && (
                      <Text as="span" aria-hidden="true">
                        &middot;
                      </Text>
                    )}
                  </Fragment>
                )) ?? "-"}
              </Flex>
            );
          } else if (row.type === "Company") {
            return (
              <Flex gap={2} flexWrap="wrap">
                {row.properties.incorporationDate?.map((date, i) => (
                  <Text as="span" key={i}>
                    {formatPartialDate({ date })}
                  </Text>
                )) ?? "-"}
              </Flex>
            );
          } else {
            return <>{"-"} </>;
          }
        },
      },
      {
        key: "score",
        label: intl.formatMessage({
          id: "component.background-check-search-result.score",
          defaultMessage: "Score",
        }),
        CellContent: ({ row }) => {
          return (
            <>
              {row.score
                ? intl.formatNumber(row.score, {
                    style: "percent",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                : "-"}
            </>
          );
        },
      },
      {
        key: "actions",
        label: "",
        CellContent: ({ row, context }) => {
          const handleSaveClick = async () => {
            context.onSaveEntity(row.id);
          };
          const handleDeleteClick = async () => {
            context.onDeleteEntity(row.id);
          };
          return (
            <Flex justifyContent="end">
              {row.id === context.savedEntityId ? (
                <HStack>
                  <CheckIcon color="green.500" />
                  <Text fontWeight={500}>
                    <FormattedMessage id="generic.saved" defaultMessage="Saved" />
                  </Text>
                  <IconButtonWithTooltip
                    size="sm"
                    fontSize="md"
                    label={intl.formatMessage({ id: "generic.delete", defaultMessage: "Delete" })}
                    icon={<DeleteIcon />}
                    isLoading={context.isDeletingEntity[row.id]}
                    isDisabled={
                      context.isSavingEntity[row.id] || context.isReadOnly || context.isDisabled
                    }
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick();
                    }}
                    placement="bottom-end"
                  />
                </HStack>
              ) : row.isFalsePositive ? (
                <HStack>
                  <XCircleIcon color="red.500" />
                  <Text fontWeight={500}>
                    {row.type === "Person" ? (
                      <FormattedMessage
                        id="component.background-check-search-result.not-the-person"
                        defaultMessage="Not the person"
                      />
                    ) : (
                      <FormattedMessage
                        id="component.background-check-search-result.not-the-entity"
                        defaultMessage="Not the entity"
                      />
                    )}
                  </Text>
                  <IconButtonWithTooltip
                    size="sm"
                    fontSize="md"
                    label={intl.formatMessage({
                      id: "component.background-check-search-result.unmark-as-false-positive",
                      defaultMessage: "Unmark as false positive",
                    })}
                    icon={<UndoIcon />}
                    isLoading={context.isDeletingEntity[row.id]}
                    isDisabled={
                      context.isSavingEntity[row.id] ||
                      context.isReadOnly ||
                      isNonNullish(context.savedEntityId) ||
                      context.isDisabled
                    }
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      context.onFalsePositiveClick([row.id], false);
                    }}
                    placement="bottom-end"
                  />
                </HStack>
              ) : (
                <Grid gridTemplateColumns="1fr 1fr" gap={2}>
                  <ResponsiveButtonIcon
                    label={intl.formatMessage({
                      id: "component.background-check-search-result.save-match",
                      defaultMessage: "Save match",
                    })}
                    size="sm"
                    fontSize="md"
                    isLoading={context.isSavingEntity[row.id]}
                    isDisabled={context.isReadOnly || context.isDisabled}
                    variant="solid"
                    colorScheme="primary"
                    icon={<StarEmptyIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveClick();
                    }}
                  />
                  <ResponsiveButtonIcon
                    label={
                      row.type === "Person"
                        ? intl.formatMessage({
                            id: "component.background-check-search-result.not-the-person",
                            defaultMessage: "Not the person",
                          })
                        : intl.formatMessage({
                            id: "component.background-check-search-result.not-the-entity",
                            defaultMessage: "Not the entity",
                          })
                    }
                    size="sm"
                    fontSize="md"
                    icon={<UserXIcon />}
                    isDisabled={
                      context.isReadOnly ||
                      isNonNullish(context.savedEntityId) ||
                      context.isDisabled
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      context.onFalsePositiveClick([row.id], true);
                    }}
                  />
                </Grid>
              )}
            </Flex>
          );
        },
      },
    ],
    [intl.locale, countries, type],
  );
}

const _fragments = {
  BackgroundCheckEntitySearchSchema: gql`
    fragment BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema on BackgroundCheckEntitySearchSchema {
      id
      type
      name
      score
      isFalsePositive
      isMatch
      ... on BackgroundCheckEntitySearchPerson {
        properties {
          countryOfBirth
          birthDate
          country
          gender
          topics
        }
      }
      ... on BackgroundCheckEntitySearchCompany {
        properties {
          incorporationDate
          jurisdiction
          topics
        }
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation BackgroundCheckFieldSearchResults_updateBackgroundCheckEntity(
      $token: String!
      $entityId: String
    ) {
      updateBackgroundCheckEntity(token: $token, entityId: $entityId)
    }
  `,
  gql`
    mutation BackgroundCheckFieldSearchResults_updateBackgroundCheckSearchFalsePositives(
      $token: String!
      $entityIds: [String!]!
      $isFalsePositive: Boolean!
    ) {
      updateBackgroundCheckSearchFalsePositives(
        token: $token
        entityIds: $entityIds
        isFalsePositive: $isFalsePositive
      )
    }
  `,
  gql`
    mutation BackgroundCheckFieldSearchResults_saveProfileFieldValueDraft(
      $profileId: GID!
      $profileTypeFieldId: GID!
    ) {
      saveProfileFieldValueDraft(profileId: $profileId, profileTypeFieldId: $profileTypeFieldId)
    }
  `,
  gql`
    mutation BackgroundCheckFieldSearchResults_updateProfileFieldValue(
      $profileId: GID!
      $fields: [UpdateProfileFieldValueInput!]!
    ) {
      updateProfileFieldValue(profileId: $profileId, fields: $fields) {
        id
      }
    }
  `,
  gql`
    mutation BackgroundCheckFieldSearchResults_updateProfileFieldValueOptions(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $data: UpdateProfileFieldValueOptionsDataInput!
    ) {
      updateProfileFieldValueOptions(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        data: $data
      ) {
        id
      }
    }
  `,
];

const _queries = [
  gql`
    query BackgroundCheckFieldSearchResults_backgroundCheckEntitySearch(
      $token: String!
      $name: String!
      $date: Date
      $type: BackgroundCheckEntitySearchType
      $country: String
      $birthCountry: String
      $force: Boolean
    ) {
      backgroundCheckEntitySearch(
        token: $token
        name: $name
        date: $date
        type: $type
        country: $country
        birthCountry: $birthCountry
        force: $force
      ) {
        totalCount
        createdAt
        items {
          ...BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema
        }
        isDraft
        hasStoredValue
        hasPendingReview
        reviewDiff {
          ...BackgroundCheckSearchDifferencesAlert_BackgroundCheckEntitySearchReviewDiff
        }
      }
    }
    ${_fragments.BackgroundCheckEntitySearchSchema}
    ${BackgroundCheckSearchDifferencesAlert.fragments.BackgroundCheckEntitySearchReviewDiff}
  `,
];

BackgroundCheckFieldSearchResults.getInitialProps = async ({ query }: WithApolloDataContext) => {
  const token = query.token as string;
  const name = query.name as string;
  const date = query.date as string | null;
  const type = query.type as BackgroundCheckEntitySearchType | null;
  const country = query.country as string | null;
  const birthCountry = query.birthCountry as string | null;
  const isDisabled = query.disabled === "true";

  return { token, name, date, type, country, birthCountry, isDisabled };
};

export default compose(
  withDialogs,
  withFeatureFlag("BACKGROUND_CHECK"),
  withApolloData,
)(BackgroundCheckFieldSearchResults);
