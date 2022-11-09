import { gql } from "@apollo/client";
import { Box, Button, Flex, Heading, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import { CheckIcon, DeleteIcon, SaveIcon } from "@parallel/chakra/icons";
import { TableColumn } from "@parallel/components/common/Table";
import { DowJonesHints } from "@parallel/components/petition-common/DowJonesHints";
import {
  DowJonesSearchResult_DowJonesKycEntitySearchDocument,
  DowJonesSearchResult_DowJonesKycEntitySearchResultFragment,
  DowJonesSearchResult_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { FORMATS } from "@parallel/utils/dates";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../../common/IconButtonWithTooltip";
import { TablePage } from "../../common/TablePage";
import { DowJonesProfileDetails } from "./DowJonesProfileDetails";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
};

type DowJonesSearchResult = DowJonesSearchResult_DowJonesKycEntitySearchResultFragment;

type DowJonesKycDataColumnsContext = {
  replies: DowJonesSearchResult_PetitionFieldReplyFragment[];
  onDeleteReply: (replyId: string) => void;
  onCreateReply: (profileId: string) => void;
  isDeletingReply: Record<string, boolean>;
  isCreatingReply: Record<string, boolean>;
};

export function DowJonesSearchResult({
  name,
  date,
  replies,
  onResetClick,
  onDeleteReply,
  onCreateReply,
  isDeletingReply,
  isCreatingReply,
}: {
  name: string;
  date: string;
  replies: DowJonesSearchResult_PetitionFieldReplyFragment[];
  onResetClick: () => void;
  onDeleteReply: (id: string) => void;
  onCreateReply: (profileId: string) => void;
  isDeletingReply: Record<string, boolean>;
  isCreatingReply: Record<string, boolean>;
}) {
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { data, loading } = useQueryOrPreviousData(
    DowJonesSearchResult_DowJonesKycEntitySearchDocument,
    {
      variables: {
        offset: state.items * (state.page - 1),
        limit: state.items,
        name: name,
        dateOfBirth: date ? new Date(date).toISOString() : null,
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const result = data?.DowJonesKycEntitySearch;
  const columns = useDowJonesKycDataColumns();
  const handleRowClick = useCallback(function (row: DowJonesSearchResult) {
    setProfileId(row.profileId);
  }, []);

  const handleGoBack = () => {
    setProfileId(null);
  };

  if (profileId) {
    return (
      <DowJonesProfileDetails
        profileId={profileId}
        onProfileIdChange={setProfileId}
        replyId={replies.find((r) => r.content.entity.profileId === profileId)?.id ?? null}
        onGoBack={handleGoBack}
        onCreateReply={onCreateReply}
        onDeleteReply={onDeleteReply}
        isDeletingReply={isDeletingReply}
        isCreatingReply={isCreatingReply}
      />
    );
  }

  return (
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
          <Skeleton height="24px" width="100%" maxWidth="300px" endColor="gray.300" />
          <Skeleton height="24px" width="50px" endColor="gray.300" />
        </HStack>
      )}
      <TablePage
        isHighlightable
        columns={columns}
        context={{ replies, onDeleteReply, onCreateReply, isDeletingReply, isCreatingReply }}
        rows={result?.items}
        rowKeyProp="id"
        page={state.page}
        pageSize={state.items}
        loading={loading}
        totalCount={result?.totalCount}
        onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
        onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items: items as any, page: 1 }))}
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
                  {name}
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
                  {date}
                </Text>
              </Text>
            </HStack>

            <Box>
              <Button variant="outline" fontWeight={500} onClick={onResetClick}>
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
  );
}

function useDowJonesKycDataColumns() {
  const intl = useIntl();
  return useMemo<TableColumn<DowJonesSearchResult, DowJonesKycDataColumnsContext>[]>(
    () => [
      {
        key: "tags",
        header: "",
        CellContent: ({ row: { iconHints } }) => {
          if (!iconHints || iconHints.length === 0) {
            return <></>;
          }
          return (
            <HStack>
              <DowJonesHints hints={iconHints} />
            </HStack>
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
                  colorScheme="purple"
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

DowJonesSearchResult.fragments = {
  get DowJonesKycEntitySearchResult() {
    return gql`
      fragment DowJonesSearchResult_DowJonesKycEntitySearchResult on DowJonesKycEntitySearchResult {
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
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment DowJonesSearchResult_PetitionFieldReply on PetitionFieldReply {
        id
        content
      }
    `;
  },
};

DowJonesSearchResult.queries = [
  gql`
    query DowJonesSearchResult_DowJonesKycEntitySearch(
      $offset: Int
      $limit: Int
      $name: String!
      $dateOfBirth: DateTime
    ) {
      DowJonesKycEntitySearch(
        offset: $offset
        limit: $limit
        name: $name
        dateOfBirth: $dateOfBirth
      ) {
        items {
          ...DowJonesSearchResult_DowJonesKycEntitySearchResult
        }
        totalCount
      }
    }
    ${DowJonesSearchResult.fragments.DowJonesKycEntitySearchResult}
  `,
];
