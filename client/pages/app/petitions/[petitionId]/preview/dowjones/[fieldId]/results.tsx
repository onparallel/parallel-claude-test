import { gql, useMutation } from "@apollo/client";
import { Box, Button, Flex, Heading, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import { CheckIcon, DeleteIcon, SaveIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { DowJonesRiskLabel } from "@parallel/components/petition-common/DowJonesRiskLabel";
import {
  DowJonesFieldSearchResults_createDowJonesKycReplyDocument,
  DowJonesFieldSearchResults_deletePetitionFieldReplyDocument,
  DowJonesFieldSearchResults_DowJonesKycEntitySearchResultFragment,
  DowJonesFieldSearchResults_petitionFieldDocument,
  DowJonesFieldSearchResults_PetitionFieldFragment,
  DowJonesFieldSearchResults_searchDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { integer, string, useQueryState, values } from "@parallel/utils/queryState";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { isValidDateString } from "@parallel/utils/validation";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

type DowJonesFieldSearchResults_Selection =
  DowJonesFieldSearchResults_DowJonesKycEntitySearchResultFragment;

interface DowJonesFieldSearchResultsTableContext {
  replies: DowJonesFieldSearchResults_PetitionFieldFragment["replies"];
  onDeleteReply: (replyId: string) => void;
  onCreateReply: (profileId: string) => void;
  isDeletingReply: Record<string, boolean>;
  isCreatingReply: Record<string, boolean>;
}

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  dateOfBirth: string().withValidation(isValidDateString),
  name: string(),
};

function DowJonesFieldSearchResults({
  petitionId,
  petitionFieldId,
}: UnwrapPromise<ReturnType<typeof DowJonesFieldSearchResults.getInitialProps>>) {
  const router = useRouter();
  const {
    data: {
      petitionField: { replies },
    },
  } = useAssertQuery(DowJonesFieldSearchResults_petitionFieldDocument, {
    variables: { petitionId, petitionFieldId },
  });

  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const { data, loading } = useQueryOrPreviousData(DowJonesFieldSearchResults_searchDocument, {
    variables: {
      offset: state.items * (state.page - 1),
      limit: state.items,
      name: state.name!,
      dateOfBirth: state.dateOfBirth ? new Date(state.dateOfBirth).toISOString() : null,
    },
    fetchPolicy: "cache-and-network",
  });

  const result = data?.dowJonesKycEntitySearch;
  const columns = useDowJonesKycDataColumns();
  const handleRowClick = useCallback(
    function (row: DowJonesFieldSearchResults_Selection) {
      const { petitionId, fieldId, ...rest } = router.query;

      router.push(
        `/app/petitions/${petitionId}/preview/dowjones/${fieldId}/${
          row.profileId
        }?${new URLSearchParams({
          ...(rest as any),
          ...state,
        })}`
      );
    },
    [state, router.query]
  );

  const showGenericErrorToast = useGenericErrorToast();

  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const [isCreatingReply, setIsCreatingReply] = useState<Record<string, boolean>>({});

  const handleResetClick = () => {
    router.push(`/app/petitions/${petitionId}/preview/dowjones/${petitionFieldId}`);
  };

  const [createDowJonesKycReply] = useMutation(
    DowJonesFieldSearchResults_createDowJonesKycReplyDocument
  );
  const [deletePetitionFieldReply] = useMutation(
    DowJonesFieldSearchResults_deletePetitionFieldReplyDocument
  );

  const context = useMemo(
    () => ({
      replies,
      isDeletingReply,
      isCreatingReply,
      onDeleteReply: async (replyId: string) => {
        try {
          setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
          await deletePetitionFieldReply({ variables: { petitionId, replyId } });

          window.opener.postMessage("refresh", window.origin);
        } catch (e) {
          showGenericErrorToast(e);
        }
        setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
      },
      onCreateReply: async (profileId: string) => {
        try {
          setIsCreatingReply((curr) => ({ ...curr, [profileId]: true }));
          await createDowJonesKycReply({
            variables: { profileId, petitionId, fieldId: petitionFieldId },
          });

          window.opener.postMessage("refresh", window.origin);
        } catch (e) {
          showGenericErrorToast(e);
        }
        setIsCreatingReply(({ [profileId]: _, ...curr }) => curr);
      },
    }),
    [replies, isDeletingReply, isCreatingReply]
  );

  return (
    <>
      <Head>
        <title>{"Dow Jones | Parallel"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Stack paddingX={6} paddingY={5} spacing={6}>
        {result?.totalCount || !loading ? (
          <Heading size="md">
            <FormattedMessage
              id="component.dow-jones-search-result.results-found"
              defaultMessage="Results found: {amount}"
              values={{ amount: result?.totalCount }}
            />
          </Heading>
        ) : (
          <HStack>
            <Skeleton height="24px" width="100%" maxWidth="300px" />
            <Skeleton height="24px" width="50px" />
          </HStack>
        )}
        <TablePage
          isHighlightable
          columns={columns}
          context={context}
          rows={result?.items}
          rowKeyProp="id"
          page={state.page}
          pageSize={state.items}
          loading={loading}
          totalCount={result?.totalCount}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
          }
          onRowClick={handleRowClick}
          header={
            <Flex
              direction={{ base: "column", sm: "row" }}
              gridGap={3}
              paddingX={4}
              paddingY={2}
              justifyContent={"space-between"}
            >
              <HStack spacing={0} gridGap={3} wrap="wrap">
                <Text>
                  <Text as="span" fontWeight={600}>
                    <FormattedMessage
                      id="component.dow-jones-search-result.searching-for"
                      defaultMessage="Searching for"
                    />
                    {": "}
                  </Text>
                  <Text as="span" whiteSpace="nowrap">
                    {state.name}
                  </Text>
                </Text>
                <Text>
                  <Text as="span" fontWeight={600}>
                    <FormattedMessage
                      id="component.dow-jones-search-result.date-of-birth"
                      defaultMessage="Date of birth"
                    />
                    {": "}
                  </Text>
                  <Text as="span" whiteSpace="nowrap">
                    {state.dateOfBirth}
                  </Text>
                </Text>
              </HStack>

              <Box>
                <Button variant="outline" fontWeight={500} onClick={handleResetClick}>
                  <FormattedMessage
                    id="component.dow-jones-search-result.modify-search"
                    defaultMessage="Modify search"
                  />
                </Button>
              </Box>
            </Flex>
          }
          body={
            result?.items.length === 0 && !loading ? (
              <Flex flex="1" alignItems="center" justifyContent="center">
                <Text fontSize="lg">
                  <FormattedMessage
                    id="component.dow-jones-search-result.no-results"
                    defaultMessage="No results found for this search"
                  />
                </Text>
              </Flex>
            ) : null
          }
        />
      </Stack>
    </>
  );
}

function useDowJonesKycDataColumns() {
  const intl = useIntl();
  return useMemo<
    TableColumn<DowJonesFieldSearchResults_Selection, DowJonesFieldSearchResultsTableContext>[]
  >(
    () => [
      {
        key: "tags",
        header: "",
        CellContent: ({ row: { iconHints } }) => {
          return (
            <Flex gap={2} flexWrap="wrap">
              {iconHints?.map((hint, i) => (
                <DowJonesRiskLabel key={i} risk={hint} />
              ))}
            </Flex>
          );
        },
      },
      {
        key: "name",
        header: intl.formatMessage({
          id: "component.dow-jones-search-result.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row: { name } }) => {
          return <>{name}</>;
        },
      },
      {
        key: "gender",
        header: intl.formatMessage({
          id: "component.dow-jones-search-result.gender",
          defaultMessage: "Gender",
        }),
        CellContent: ({ row }) => {
          if (row.__typename === "DowJonesKycEntitySearchResultPerson") {
            return <>{row.gender}</>;
          } else {
            return <>{"-"}</>;
          }
        },
      },
      {
        key: "dateOfBirth",
        header: intl.formatMessage({
          id: "component.dow-jones-search-result.date-of-birth",
          defaultMessage: "Date of birth",
        }),
        CellContent: ({ row }) => {
          if (row.__typename === "DowJonesKycEntitySearchResultPerson") {
            const { year, month, day } = row.dateOfBirth ?? {};
            return (
              <>
                {year && month && day
                  ? intl.formatDate(new Date(year, month - 1, day), FORMATS.ll)
                  : year
                  ? year
                  : "-"}
              </>
            );
          } else {
            return <>{"-"} </>;
          }
        },
      },
      {
        key: "country",
        header: intl.formatMessage({
          id: "component.dow-jones-search-result.country-territory",
          defaultMessage: "Country/Territory",
        }),
        CellContent: ({ row: { countryTerritoryName } }) => {
          return <>{countryTerritoryName || "-"} </>;
        },
      },
      {
        key: "subsidiary",
        header: intl.formatMessage({
          id: "component.dow-jones-search-result.subsidiary",
          defaultMessage: "Subsidiary",
        }),
        CellContent: ({ row }) => {
          if (row.__typename === "DowJonesKycEntitySearchResultPerson") {
            return <>{"-"}</>;
          }
          return (
            <>
              {row.isSubsidiary ? (
                <FormattedMessage id="generic.yes" defaultMessage="Yes" />
              ) : (
                <FormattedMessage id="generic.no" defaultMessage="No" />
              )}
            </>
          );
        },
      },
      {
        key: "actions",
        header: "",
        CellContent: ({ row, context }) => {
          const profileReply = context.replies.find(
            (r) => r.content.entity.profileId === row.profileId
          );
          const handleSaveClick = async () => {
            context.onCreateReply(row.profileId);
          };
          const handleDeleteClick = async () => {
            context.onDeleteReply(profileReply!.id);
          };
          return (
            <Flex justifyContent="end">
              {!!profileReply ? (
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
                    isDisabled={context.isCreatingReply[profileReply!.id]}
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
                  isLoading={context.isCreatingReply[row.profileId]}
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
    [intl.locale]
  );
}

const _fragments = {
  DowJonesKycEntitySearchResult: gql`
    fragment DowJonesFieldSearchResults_DowJonesKycEntitySearchResult on DowJonesKycEntitySearchResult {
      id
      profileId
      type
      name
      title
      countryTerritoryName
      isSubsidiary
      iconHints
      ... on DowJonesKycEntitySearchResultPerson {
        gender
        dateOfBirth {
          year
          month
          day
        }
      }
    }
  `,
  PetitionField: gql`
    fragment DowJonesFieldSearchResults_PetitionField on PetitionField {
      id
      replies {
        id
        content
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation DowJonesFieldSearchResults_createDowJonesKycReply(
      $petitionId: GID!
      $fieldId: GID!
      $profileId: ID!
    ) {
      createDowJonesKycReply(petitionId: $petitionId, fieldId: $fieldId, profileId: $profileId) {
        id
        field {
          id
          replies {
            id
            content
          }
        }
      }
    }
  `,
  gql`
    mutation DowJonesFieldSearchResults_deletePetitionFieldReply(
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
];

const _queries = [
  gql`
    query DowJonesFieldSearchResults_petitionField($petitionId: GID!, $petitionFieldId: GID!) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        ...DowJonesFieldSearchResults_PetitionField
      }
    }
    ${_fragments.PetitionField}
  `,
  gql`
    query DowJonesFieldSearchResults_search(
      $offset: Int
      $limit: Int
      $name: String!
      $dateOfBirth: DateTime
    ) {
      dowJonesKycEntitySearch(
        offset: $offset
        limit: $limit
        name: $name
        dateOfBirth: $dateOfBirth
      ) {
        items {
          ...DowJonesFieldSearchResults_DowJonesKycEntitySearchResult
        }
        totalCount
      }
    }
    ${_fragments.DowJonesKycEntitySearchResult}
  `,
];

DowJonesFieldSearchResults.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  const petitionFieldId = query.fieldId as string;
  await Promise.all([
    fetchQuery(DowJonesFieldSearchResults_petitionFieldDocument, {
      variables: { petitionId, petitionFieldId },
      ignoreCache: true,
    }),
  ]);
  return { petitionId, petitionFieldId };
};

export default compose(
  withDialogs,
  withFeatureFlag("DOW_JONES_KYC"),
  withApolloData
)(DowJonesFieldSearchResults);
