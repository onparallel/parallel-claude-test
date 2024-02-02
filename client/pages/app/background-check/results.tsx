import { gql, useMutation, useQuery } from "@apollo/client";
import { Box, Button, Flex, Heading, HStack, Image, Skeleton, Stack, Text } from "@chakra-ui/react";
import { CheckIcon, DeleteIcon, SaveIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { BackgroundCheckRiskLabel } from "@parallel/components/petition-common/BackgroundCheckRiskLabel";
import { usePreviewPetitionFieldBackgroundCheckReplaceReplyDialog } from "@parallel/components/petition-preview/dialogs/PreviewPetitionFieldBackgroundCheckReplaceReplyDialog";
import { usePreviewPetitionFieldBackgroundCheckSaveSearchDialog } from "@parallel/components/petition-preview/dialogs/PreviewPetitionFieldBackgroundCheckSaveSearchDialog";
import { useBackgroundCheckEntityTypeSelectOptions } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityTypeSelect";
import {
  BackgroundCheckEntitySearchType,
  BackgroundCheckFieldSearchResults_backgroundCheckEntitySearchDocument,
  BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema_BackgroundCheckEntitySearchCompany_Fragment,
  BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema_BackgroundCheckEntitySearchPerson_Fragment,
  BackgroundCheckFieldSearchResults_updateBackgroundCheckEntityDocument,
} from "@parallel/graphql/__types";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { formatPartialDate } from "@parallel/utils/formatPartialDate";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useLoadOpenSanctionsCountryNames } from "@parallel/utils/useLoadOpenSanctionsCountryNames";
import { useWindowEvent } from "@parallel/utils/useWindowEvent";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
type BackgroundCheckFieldSearchResults_Selection =
  | ({
      type: "Person";
    } & BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema_BackgroundCheckEntitySearchPerson_Fragment)
  | ({
      type: "Company";
    } & BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema_BackgroundCheckEntitySearchCompany_Fragment);

interface BackgroundCheckFieldSearchResultsTableContext {
  savedEntityIds: string[];
  onDeleteEntity: (entityId: string) => void;
  onSaveEntity: (entityId: string) => void;
  isDeletingEntity: Record<string, boolean>;
  isSavingEntity: Record<string, boolean>;
  isReadOnly: boolean;
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
}: UnwrapPromise<ReturnType<typeof BackgroundCheckFieldSearchResults.getInitialProps>>) {
  const router = useRouter();
  const { query } = router;
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [savedEntityIds, setSavedEntityIds] = useState<string[]>([]);
  const [isDeletingEntity, setIsDeletingEntity] = useState<Record<string, boolean>>({});
  const [isSavingEntity, setIsSavingEntity] = useState<Record<string, boolean>>({});
  const isReadOnly = query.readonly === "true";
  const isTemplate = query.template === "true";

  const entityTypeOptions = useBackgroundCheckEntityTypeSelectOptions();
  const entityTypeLabel = entityTypeOptions.find((option) => option.value === type)?.label;

  const { data, loading, error } = useQuery(
    BackgroundCheckFieldSearchResults_backgroundCheckEntitySearchDocument,
    {
      variables: {
        token,
        name,
        date: date ? new Date(date).toISOString().substring(0, 10) : null,
        type,
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const result = data?.backgroundCheckEntitySearch;

  useEffect(() => {
    window.opener?.postMessage(
      {
        event: "update-info",
        token,
      },
      window.origin,
    );
  }, []);

  useWindowEvent(
    "message",
    (e) => {
      if (e.data.event === "info-updated") {
        setSavedEntityIds(e.data.entityIds);
      } else if (e.data === "close") {
        window.close();
      }
    },
    [],
  );

  const showGenericErrorToast = useGenericErrorToast();
  if (isDefined(error)) {
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
        if (savedEntityIds.length) {
          await showPetitionFieldBackgroundCheckReplaceReplyDialog();
        }
        await updateBackgroundCheckEntity({
          variables: {
            token,
            entityId,
          },
        });
        setSavedEntityIds([entityId]);
        window.opener?.postMessage("refresh");
      } catch {
      } finally {
        setIsSavingEntity(({ [entityId]: _, ...curr }) => curr);
      }
    },
    [token, name, date, savedEntityIds.length],
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
        setSavedEntityIds([]);
        window.opener?.postMessage("refresh");
      } catch {
      } finally {
        setIsDeletingEntity(({ [entityId]: _, ...curr }) => curr);
      }
    },
    [token],
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
          ...(isReadOnly ? { readonly: "true" } : {}),
          ...(isTemplate ? { template: "true" } : {}),
        })}`,
      );
    },
    [token, name, date, type, isReadOnly, isTemplate],
  );

  const handleResetClick = () => {
    router.push(
      `/app/background-check?${new URLSearchParams({
        token,
        name,
        ...(date ? { date } : {}),
        ...(type ? { type } : {}),
        ...(isTemplate ? { template: "true" } : {}),
      })}`,
    );
  };

  const showPreviewPetitionFieldBackgroundCheckSaveSearchDialog =
    usePreviewPetitionFieldBackgroundCheckSaveSearchDialog();

  const handleNoneOfTheResultsClick = async () => {
    try {
      await showPreviewPetitionFieldBackgroundCheckSaveSearchDialog();
    } catch {}
  };

  const context = useMemo(
    () => ({
      savedEntityIds,
      isDeletingEntity,
      isSavingEntity,
      onDeleteEntity: handleDelete,
      onSaveEntity: handleSave,
      isReadOnly: isTemplate || isReadOnly,
    }),
    [savedEntityIds, isDeletingEntity, isSavingEntity],
  );

  const { page, items } = state;

  const [tableRows, totalCount] = useMemo(() => {
    const rows = result?.items as BackgroundCheckFieldSearchResults_Selection[] | undefined;
    if (!rows) {
      return [[], 0];
    }
    return [rows.slice((page - 1) * items, page * items), result?.totalCount];
  }, [result, page, items]);

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

              <Text as="span">
                <FormattedMessage
                  id="component.background-check-search-result.results-obtained-on"
                  defaultMessage="Results from {date}"
                  values={{
                    date: intl.formatDate(result.createdAt, FORMATS.FULL),
                  }}
                />
              </Text>
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
        </HStack>
        <TablePage
          isHighlightable
          columns={columns}
          context={context}
          rows={tableRows}
          rowKeyProp="id"
          page={state.page}
          pageSize={state.items}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
          }
          loading={loading}
          totalCount={totalCount}
          onRowClick={handleRowClick}
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
                <Text as="span">{[entityTypeLabel, name, date].filter(isDefined).join(" | ")}</Text>
              </Box>

              <HStack>
                <Button
                  variant="outline"
                  fontWeight={500}
                  onClick={handleResetClick}
                  isDisabled={query.readonly === "true"}
                >
                  <FormattedMessage
                    id="component.background-check-search-result.modify-search"
                    defaultMessage="Modify search"
                  />
                </Button>
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
                  src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/search/empty-search.svg`}
                />
                <Stack textAlign="center">
                  <Text>
                    <FormattedMessage
                      id="component.background-check-search-result.no-results-found"
                      defaultMessage="It seems that the entity you are looking for is not listed anywhere!"
                    />
                  </Text>
                  <Text>
                    <FormattedMessage
                      id="component.background-check-search-result.save-search-text"
                      defaultMessage="We have automatically saved the search to preserve the evidence for a future audit."
                    />
                  </Text>
                </Stack>
              </Stack>
            ) : null
          }
        />
        <Box>
          <Button variant="link" onClick={handleNoneOfTheResultsClick} fontWeight={600}>
            <FormattedMessage
              id="component.background-check-search-result.none-of-these-results"
              defaultMessage="None of these results?"
            />
          </Button>
        </Box>
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
          return <>{row.name}</>;
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
                  <Text as="span" key={i}>
                    {formatPartialDate({ date })}
                  </Text>
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
        key: "actions",
        label: "",
        CellContent: ({ row, context }) => {
          const rowEntityIsSaved = context.savedEntityIds.includes(row.id);
          const handleSaveClick = async () => {
            context.onSaveEntity(row.id);
          };
          const handleDeleteClick = async () => {
            context.onDeleteEntity(row.id);
          };
          return (
            <Flex justifyContent="end">
              {rowEntityIsSaved ? (
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
                    isDisabled={context.isSavingEntity[row.id] || context.isReadOnly}
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick();
                    }}
                  />
                </HStack>
              ) : (
                <Button
                  size="sm"
                  fontSize="md"
                  isLoading={context.isSavingEntity[row.id]}
                  isDisabled={context.isReadOnly}
                  variant="solid"
                  colorScheme="primary"
                  leftIcon={<SaveIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveClick();
                  }}
                >
                  <FormattedMessage id="generic.save" defaultMessage="Save" />
                </Button>
              )}
            </Flex>
          );
        },
      },
    ],
    [intl.locale, countries],
  );
}

const _fragments = {
  BackgroundCheckEntitySearchSchema: gql`
    fragment BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema on BackgroundCheckEntitySearchSchema {
      id
      type
      name
      ... on BackgroundCheckEntitySearchPerson {
        properties {
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
    mutation BackgroundCheckFieldSearchResults_deletePetitionFieldReply(
      $petitionId: GID!
      $replyId: GID!
    ) {
      deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
        id
        replies {
          id
          content
        }
      }
    }
  `,
  gql`
    mutation BackgroundCheckFieldSearchResults_updateBackgroundCheckEntity(
      $token: String!
      $entityId: String
    ) {
      updateBackgroundCheckEntity(token: $token, entityId: $entityId)
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
    ) {
      backgroundCheckEntitySearch(token: $token, name: $name, date: $date, type: $type) {
        totalCount
        createdAt
        items {
          ...BackgroundCheckFieldSearchResults_BackgroundCheckEntitySearchSchema
        }
      }
    }
    ${_fragments.BackgroundCheckEntitySearchSchema}
  `,
];

BackgroundCheckFieldSearchResults.getInitialProps = async ({ query }: WithApolloDataContext) => {
  const token = query.token as string;
  const name = query.name as string;
  const date = query.date as string | null;
  const type = query.type as BackgroundCheckEntitySearchType | null;

  return { token, name, date, type };
};

export default compose(
  withDialogs,
  withFeatureFlag("BACKGROUND_CHECK"),
  withApolloData,
)(BackgroundCheckFieldSearchResults);
