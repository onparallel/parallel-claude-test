import { gql, useMutation } from "@apollo/client";
import { Box, Button, Flex, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { CheckIcon, DeleteIcon, SaveIcon } from "@parallel/chakra/icons";
import { TableColumn } from "@parallel/components/common/Table";
import { DowJonesHints } from "@parallel/components/petition-common/DowJonesHints";
import {
  DowJonesSearchResult_createDowJonesKycResearchReplyDocument,
  DowJonesSearchResult_deletePetitionFieldReplyDocument,
  DowJonesSearchResult_dowJonesRiskEntitySearchDocument,
  DowJonesSearchResult_DowJonesRiskEntitySearchResultFragment,
  DowJonesSearchResult_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { FORMATS } from "@parallel/utils/dates";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../../common/IconButtonWithTooltip";
import { TablePage } from "../../common/TablePage";
import { DowJonesProfileDetails } from "./DowJonesProfileDetails";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
};

type FactivaSelection = DowJonesSearchResult_DowJonesRiskEntitySearchResultFragment;

type DowJonesFactivaDataColumnsContext = {
  petitionId: string;
  fieldId: string;
  replies: DowJonesSearchResult_PetitionFieldReplyFragment[];
};

export function DowJonesSearchResult({
  name,
  date,
  petitionId,
  fieldId,
  onResetClick,
  replies,
}: {
  name: string;
  date: string;
  onResetClick: () => void;
  petitionId: string;
  fieldId: string;
  replies: DowJonesSearchResult_PetitionFieldReplyFragment[];
}) {
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { data, loading } = useQueryOrPreviousData(
    DowJonesSearchResult_dowJonesRiskEntitySearchDocument,
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

  const result = data?.dowJonesRiskEntitySearch;
  const columns = useDowJonesFactivaDataColumns();
  const handleRowClick = useCallback(function (row: FactivaSelection) {
    setProfileId(row.profileId);
  }, []);

  const handleGoBack = () => {
    setProfileId(null);
  };

  if (profileId) {
    return (
      <DowJonesProfileDetails
        id={profileId}
        petitionId={petitionId}
        fieldId={fieldId}
        replyId={replies.find((r) => r.content.entity.profileId === profileId)?.id ?? null}
        onGoBack={handleGoBack}
      />
    );
  }

  return (
    <Stack paddingX={6} paddingY={5} spacing={6}>
      <Heading size="md">
        <FormattedMessage
          id="component.dow-jones-search-result.results-found"
          defaultMessage="Results found: {amount}"
          values={{ amount: result?.totalCount ?? "..." }}
        />
      </Heading>
      <TablePage
        isHighlightable
        columns={columns}
        context={{ petitionId, fieldId, replies }}
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

function useDowJonesFactivaDataColumns() {
  const intl = useIntl();
  const showGenericErrorToast = useGenericErrorToast();

  return useMemo<TableColumn<FactivaSelection, DowJonesFactivaDataColumnsContext>[]>(
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
          if (row.__typename === "DowJonesRiskEntitySearchResultPerson") {
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
          if (row.__typename === "DowJonesRiskEntitySearchResultPerson") {
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
          if (row.__typename === "DowJonesRiskEntitySearchResultPerson") {
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
          const [createDowJonesKycResearchReply, { loading: isSavingProfile }] = useMutation(
            DowJonesSearchResult_createDowJonesKycResearchReplyDocument
          );
          const [deletePetitionFieldReply] = useMutation(
            DowJonesSearchResult_deletePetitionFieldReplyDocument
          );

          const profileReply = context.replies.find(
            (r) => r.content.entity.profileId === row.profileId
          );
          const handleSaveClick = async () => {
            try {
              await createDowJonesKycResearchReply({
                variables: {
                  profileId: row.profileId,
                  petitionId: context.petitionId,
                  fieldId: context.fieldId,
                },
              });
            } catch (e) {
              showGenericErrorToast(e);
            }
          };
          const handleDeleteClick = async () => {
            try {
              await deletePetitionFieldReply({
                variables: {
                  petitionId: context.petitionId,
                  replyId: profileReply!.id,
                },
              });
            } catch (e) {
              showGenericErrorToast(e);
            }
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
                  isLoading={isSavingProfile}
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
  get DowJonesRiskEntitySearchResult() {
    return gql`
      fragment DowJonesSearchResult_DowJonesRiskEntitySearchResult on DowJonesRiskEntitySearchResult {
        id
        profileId
        type
        name
        title
        countryTerritoryName
        isSubsidiary
        iconHints
        ... on DowJonesRiskEntitySearchResultPerson {
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
    query DowJonesSearchResult_dowJonesRiskEntitySearch(
      $offset: Int
      $limit: Int
      $name: String!
      $dateOfBirth: DateTime
    ) {
      dowJonesRiskEntitySearch(
        offset: $offset
        limit: $limit
        name: $name
        dateOfBirth: $dateOfBirth
      ) {
        items {
          ...DowJonesSearchResult_DowJonesRiskEntitySearchResult
        }
        totalCount
      }
    }
    ${DowJonesSearchResult.fragments.DowJonesRiskEntitySearchResult}
  `,
];

const _mutations = [
  gql`
    mutation DowJonesSearchResult_createDowJonesKycResearchReply(
      $petitionId: GID!
      $fieldId: GID!
      $profileId: ID!
    ) {
      createDowJonesKycResearchReply(
        petitionId: $petitionId
        fieldId: $fieldId
        profileId: $profileId
      ) {
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
    mutation DowJonesSearchResult_deletePetitionFieldReply($petitionId: GID!, $replyId: GID!) {
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
