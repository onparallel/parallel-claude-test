import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Image,
  Skeleton,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  BusinessIcon,
  CheckIcon,
  DeleteIcon,
  DownloadIcon,
  FieldDateIcon,
  SaveIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { Table, TableColumn } from "@parallel/components/common/Table";
import {
  DowJonesProfileDetails_dowJonesRiskEntityProfileDocument,
  DowJonesProfileDetails_DowJonesRiskEntityRelationshipFragment,
  DowJonesProfileDetails_DowJonesRiskEntitySanctionFragment,
  DowJonesRiskEntityProfileResultEntity,
  DowJonesRiskEntityProfileResultPerson,
  PreviewFactivaTable_createDowJonesKycResearchReplyDocument,
  PreviewFactivaTable_deletePetitionFieldReplyDocument,
  PreviewFactivaTable_dowJonesRiskEntitySearchDocument,
  PreviewFactivaTable_DowJonesRiskEntitySearchResultFragment,
  PreviewFactivaTable_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { FORMATS } from "@parallel/utils/dates";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { useLoadCountryNames } from "@parallel/utils/useCountryName";
import { useDowJonesProfileDownloadTask } from "@parallel/utils/useDowJonesProfileDownloadTask";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { Card, CardHeader } from "../common/Card";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { TablePage } from "../common/TablePage";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
};

type FactivaSelection = PreviewFactivaTable_DowJonesRiskEntitySearchResultFragment;

type DowJonesFactivaDataColumnsContext = {
  petitionId: string;
  fieldId: string;
  replies: PreviewFactivaTable_PetitionFieldReplyFragment[];
};

export function PreviewFactivaTable({
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
  replies: PreviewFactivaTable_PetitionFieldReplyFragment[];
}) {
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [profileId, setProfileId] = useState<string | null>(null);

  const { data, loading } = useQueryOrPreviousData(
    PreviewFactivaTable_dowJonesRiskEntitySearchDocument,
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

  const handleRowClick = useCallback(function (row: FactivaSelection, event: MouseEvent) {
    setProfileId(row.id);
  }, []);

  const handleGoBack = () => {
    setProfileId(null);
  };

  console.log("loading: ", loading);
  // console.log("loading: ", loading);

  if (profileId) {
    return <DowJonesProfileDetails id={profileId} onGoBack={handleGoBack} />;
  }

  return (
    <Stack paddingX={6} paddingY={5} spacing={6}>
      <Heading size="md">
        <FormattedMessage
          id="component.recipient-view-petition-field-kyc-research.results-found"
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
                    id="component.preview-factiva-table.searching-for"
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
                    id="component.preview-factiva-table.date-of-birth"
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
              <Button variant="outline" onClick={onResetClick}>
                <FormattedMessage
                  id="component.preview-factiva-table.modify-search"
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
                  id="component.preview-factiva-table.no-results"
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
              <IconHints hints={iconHints} />
            </HStack>
          );
        },
      },
      {
        key: "name",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row: { name } }) => {
          return <>{name}</>;
        },
      },
      {
        key: "gender",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.gender",
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
          id: "component.preview-factiva-table.date-of-birth",
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
          id: "component.preview-factiva-table.country-territory",
          defaultMessage: "Country/Territory",
        }),
        CellContent: ({ row: { countryTerritoryName } }) => {
          return <>{countryTerritoryName} </>;
        },
      },
      {
        key: "subsidiary",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.subsidiary",
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
            PreviewFactivaTable_createDowJonesKycResearchReplyDocument
          );
          const [deletePetitionFieldReply] = useMutation(
            PreviewFactivaTable_deletePetitionFieldReplyDocument
          );
          const profileReply = context.replies.find((r) => r.content.entity.profileId === row.id);
          const handleSaveClick = async () => {
            await createDowJonesKycResearchReply({
              variables: {
                profileId: row.id,
                petitionId: context.petitionId,
                fieldId: context.fieldId,
              },
            });
          };
          const handleDeleteClick = async () => {
            await deletePetitionFieldReply({
              variables: {
                petitionId: context.petitionId,
                replyId: profileReply!.id,
              },
            });
          };
          return (
            <Flex justifyContent="end">
              {!!profileReply ? (
                <HStack>
                  <CheckIcon color="green.500" />
                  <Text fontWeight={500}>
                    <FormattedMessage
                      id="component.preview-factiva-table.profile-saved"
                      defaultMessage="Saved"
                    />
                  </Text>
                  <IconButtonWithTooltip
                    size="sm"
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

type DowJonesProfileDetailsProps = {
  id: string;
  onGoBack: () => void;
};

function DowJonesProfileDetails({ id, onGoBack }: DowJonesProfileDetailsProps) {
  const intl = useIntl();

  const { data, loading, refetch } = useQuery(
    DowJonesProfileDetails_dowJonesRiskEntityProfileDocument,
    {
      variables: {
        profileId: id,
      },
    }
  );

  console.log("DATA DETAILS: ", data);

  const details = data?.dowJonesRiskEntityProfile;

  const handleSanctionsRowClick = useCallback(function (
    row: DowJonesProfileDetails_DowJonesRiskEntitySanctionFragment,
    event: MouseEvent
  ) {
    if (isDefined(row.sources[0])) {
      openNewWindow(row.sources[0]);
    }
  },
  []);

  const handleRelationshipsRowClick = useCallback(function (
    row: DowJonesProfileDetails_DowJonesRiskEntityRelationshipFragment,
    event: MouseEvent
  ) {
    if (isDefined(row.profileId)) {
      refetch({
        profileId: row.profileId.toString(),
      });
    }
  },
  []);

  const sanctionsColumns = useDowJonesFactivaSanctionsColumns();
  const relationshipsColumns = useDowJonesFactivaRelationshipsColumns();
  const downloadDowJonesProfilePdf = useDowJonesProfileDownloadTask();
  return (
    <Stack paddingX={6} paddingY={5} spacing={6}>
      <HStack>
        <IconButtonWithTooltip
          icon={<ArrowBackIcon />}
          variant="ghost"
          label={intl.formatMessage({
            id: "generic.go-back",
            defaultMessage: "Go back",
          })}
          onClick={onGoBack}
        />
        <Heading size="md">
          <FormattedMessage
            id="component.recipient-view-petition-field-kyc-research.profile-details"
            defaultMessage="Profile details"
          />
        </Heading>
      </HStack>

      <Card>
        <CardHeader>
          <HStack justifyContent="space-between" spacing={0} gridGap={3} wrap="wrap">
            <HStack flex="1">
              {loading ? (
                <>
                  <Skeleton height="20px" width="100%" maxWidth="320px" endColor="gray.300" />
                  <Skeleton height="20px" width="50px" endColor="gray.300" />
                </>
              ) : (
                <>
                  <Text
                    fontSize="xl"
                    display="flex"
                    alignItems="center"
                    gridGap={2}
                    flexWrap="wrap"
                    whiteSpace="break-spaces"
                  >
                    {details?.name}
                    <IconHints hints={details?.iconHints ?? []} />
                  </Text>
                </>
              )}
            </HStack>
            <Box>
              <Button variant="solid" colorScheme="purple" leftIcon={<SaveIcon />}>
                <FormattedMessage id="generic.save" defaultMessage="Save" />
              </Button>
            </Box>
          </HStack>
        </CardHeader>
        {loading ? (
          <Box height={"80px"}></Box>
        ) : details?.__typename === "DowJonesRiskEntityProfileResultEntity" ? (
          <ProfileResultEntity data={details} />
        ) : details?.__typename === "DowJonesRiskEntityProfileResultPerson" ? (
          <ProfileResultPerson data={details} />
        ) : null}
      </Card>

      <Card>
        <CardHeader omitDivider={loading || !details?.sanctions?.length ? false : true}>
          <Text as="span" fontWeight={600} fontSize="xl">
            <FormattedMessage
              id="component.preview-factiva-table.sanction-lists"
              defaultMessage="Sanction lists"
            />{" "}
            {`(${details?.sanctions?.length ?? 0})`}
          </Text>
        </CardHeader>
        {loading ? (
          <Center minHeight={"136px"}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="purple.500"
              size="xl"
            />
          </Center>
        ) : details?.sanctions?.length ? (
          <Box overflowX="auto">
            <Table
              isHighlightable
              columns={sanctionsColumns}
              rows={
                details.sanctions as DowJonesProfileDetails_DowJonesRiskEntitySanctionFragment[]
              }
              rowKeyProp="id"
              onRowClick={handleSanctionsRowClick}
            />
          </Box>
        ) : (
          <Box height="120px"></Box>
        )}
      </Card>

      <Card>
        <CardHeader omitDivider={loading || !details?.relationships?.length ? false : true}>
          <Text as="span" fontWeight={600} fontSize="xl">
            <FormattedMessage
              id="component.preview-factiva-table.relationships"
              defaultMessage="Relationships"
            />{" "}
            {`(${details?.relationships?.length ?? 0})`}
          </Text>
        </CardHeader>
        {loading ? (
          <Center minHeight={"136px"}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="purple.500"
              size="xl"
            />
          </Center>
        ) : details?.relationships?.length ? (
          <Box overflowX="auto">
            <Table
              isHighlightable
              columns={relationshipsColumns}
              rows={
                details.relationships as DowJonesProfileDetails_DowJonesRiskEntityRelationshipFragment[]
              }
              rowKeyProp="profileId"
              onRowClick={handleRelationshipsRowClick}
            />
          </Box>
        ) : (
          <Box height="120px"></Box>
        )}
      </Card>

      {loading ? null : (
        <HStack justifyContent="space-between" flexWrap="wrap" spacing={0} gridGap={2}>
          <Text>
            <FormattedMessage
              id="component.preview-factiva-table.results-obtained-on"
              defaultMessage="Results obtained on {date}"
              values={{
                date: intl.formatDate(new Date(), FORMATS.FULL),
              }}
            />
          </Text>
          <Button
            variant="ghost"
            colorScheme="purple"
            leftIcon={<DownloadIcon />}
            onClick={() => downloadDowJonesProfilePdf(id)}
          >
            <FormattedMessage
              id="component.preview-factiva-table.get-full-pdf"
              defaultMessage="Get full PDF"
            />
          </Button>
        </HStack>
      )}
    </Stack>
  );
}

function ProfileResultPerson({ data }: { data: DowJonesRiskEntityProfileResultPerson }) {
  const intl = useIntl();

  const { countries } = useLoadCountryNames(intl.locale);

  const { placeOfBirth, citizenship, residence, jurisdiction, isDeceased, dateOfBirth } =
    data ?? {};

  const placeOfBirthCountryCode = placeOfBirth?.countryCode;
  const citizenshipCountryCode = citizenship?.countryCode;
  const residentCountryCode = residence?.countryCode;
  const jurisdictionCountryCode = jurisdiction?.countryCode;

  const { year, month, day } = dateOfBirth ?? {};

  const birthFlag = placeOfBirthCountryCode ? (
    <Image
      alt={countries?.[placeOfBirthCountryCode]}
      boxSize={6}
      src={`${
        process.env.NEXT_PUBLIC_ASSETS_URL
      }/static/countries/flags/${placeOfBirthCountryCode.toLowerCase()}.png`}
    />
  ) : null;

  const citizenshipFlag = citizenshipCountryCode ? (
    <Image
      alt={countries?.[citizenshipCountryCode]}
      boxSize={6}
      src={`${
        process.env.NEXT_PUBLIC_ASSETS_URL
      }/static/countries/flags/${citizenshipCountryCode.toLowerCase()}.png`}
    />
  ) : null;

  const residentFlag = residentCountryCode ? (
    <Image
      alt={countries?.[residentCountryCode]}
      boxSize={6}
      src={`${
        process.env.NEXT_PUBLIC_ASSETS_URL
      }/static/countries/flags/${residentCountryCode.toLowerCase()}.png`}
    />
  ) : null;

  const jurisdictionFlag = jurisdictionCountryCode ? (
    <Image
      alt={countries?.[jurisdictionCountryCode]}
      boxSize={6}
      src={`${
        process.env.NEXT_PUBLIC_ASSETS_URL
      }/static/countries/flags/${jurisdictionCountryCode.toLowerCase()}.png`}
    />
  ) : null;

  const detailsSpanProps = {
    color: "gray.600",
    fontSize: "sm",
  };

  return (
    <HStack
      paddingX={6}
      paddingY={4}
      gridGap={{ base: 4, md: 8 }}
      spacing={0}
      wrap="wrap"
      alignItems="start"
    >
      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage id="component.preview-factiva-table.type" defaultMessage="Type" />:
        </Text>
        <HStack>
          <UserIcon />
          <Text>
            <FormattedMessage id="component.preview-factiva-table.person" defaultMessage="Person" />
          </Text>
        </HStack>
      </Stack>

      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage id="component.preview-factiva-table.birth" defaultMessage="Birth" />:
        </Text>
        <HStack>
          {birthFlag}
          <Text>{placeOfBirthCountryCode ? countries?.[placeOfBirthCountryCode] : "-"}</Text>
        </HStack>
      </Stack>

      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage
            id="component.preview-factiva-table.citizenship"
            defaultMessage="Citizenship"
          />
          :
        </Text>
        <HStack>
          {citizenshipFlag}
          <Text>{citizenshipCountryCode ? countries?.[citizenshipCountryCode] : "-"}</Text>
        </HStack>
      </Stack>

      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage
            id="component.preview-factiva-table.resident-of"
            defaultMessage="Resident of"
          />
          :
        </Text>
        <HStack>
          {residentFlag}
          <Text>{residentCountryCode ? countries?.[residentCountryCode] : "-"}</Text>
        </HStack>
      </Stack>

      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage
            id="component.preview-factiva-table.jurisdiction"
            defaultMessage="Jurisdiction"
          />
          :
        </Text>
        <HStack>
          {jurisdictionFlag}
          <Text>{jurisdictionCountryCode ? countries?.[jurisdictionCountryCode] : "-"}</Text>
        </HStack>
      </Stack>

      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage
            id="component.preview-factiva-table.date-of-birth"
            defaultMessage="Date of birth"
          />
          :
        </Text>
        <HStack>
          <FieldDateIcon />
          <Text>
            {year && month && day
              ? intl.formatDate(new Date(year, month - 1, day), FORMATS.ll)
              : "-"}
          </Text>
        </HStack>
      </Stack>

      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage
            id="component.preview-factiva-table.deceased"
            defaultMessage="Deceased"
          />
          :
        </Text>
        <Text>
          {isDeceased ? (
            <FormattedMessage id="generic.yes" defaultMessage="Yes" />
          ) : (
            <FormattedMessage id="generic.no" defaultMessage="No" />
          )}
        </Text>
      </Stack>
    </HStack>
  );
}

function ProfileResultEntity({ data }: { data: DowJonesRiskEntityProfileResultEntity }) {
  const intl = useIntl();

  const { year, month, day } = data.dateOfRegistration ?? {};

  const detailsSpanProps = {
    color: "gray.600",
    fontSize: "sm",
  };

  return (
    <HStack paddingX={6} paddingY={4} gridGap={{ base: 4, md: 8 }} spacing={0} wrap="wrap">
      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage id="component.preview-factiva-table.type" defaultMessage="Type" />:
        </Text>
        <HStack>
          <BusinessIcon />
          <Text>
            <FormattedMessage id="component.preview-factiva-table.entity" defaultMessage="Entity" />
          </Text>
        </HStack>
      </Stack>
      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage
            id="component.preview-factiva-table.date-of-registration"
            defaultMessage="Date of registration"
          />
          :
        </Text>
        <HStack>
          <FieldDateIcon />
          <Text>
            {year && month && day
              ? intl.formatDate(new Date(year, month - 1, day), FORMATS.ll)
              : "-"}
          </Text>
        </HStack>
      </Stack>
    </HStack>
  );
}

function useDowJonesFactivaSanctionsColumns() {
  const intl = useIntl();

  return useMemo<TableColumn<DowJonesProfileDetails_DowJonesRiskEntitySanctionFragment>[]>(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row: { name } }) => {
          return <>{name}</>;
        },
      },
      {
        key: "from",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.from",
          defaultMessage: "From",
        }),
        CellContent: ({ row: { fromDate } }) => {
          const { year, month, day } = fromDate ?? {};

          return (
            <>
              {year && month && day
                ? intl.formatDate(new Date(year, month - 1, day), FORMATS.ll)
                : "-"}
            </>
          );
        },
      },
    ],
    [intl.locale]
  );
}

function useDowJonesFactivaRelationshipsColumns() {
  const intl = useIntl();

  return useMemo<TableColumn<DowJonesProfileDetails_DowJonesRiskEntityRelationshipFragment>[]>(
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
              <IconHints hints={iconHints} />
            </HStack>
          );
        },
      },
      {
        key: "name",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row: { name } }) => {
          return <>{name}</>;
        },
      },
      {
        key: "type",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.type",
          defaultMessage: "Type",
        }),
        CellContent: ({ row: { type } }) => {
          if (type === "Entity") {
            return (
              <HStack>
                <BusinessIcon />
                <Text>
                  <FormattedMessage
                    id="component.preview-factiva-table.entity"
                    defaultMessage="Entity"
                  />
                </Text>
              </HStack>
            );
          } else {
            return (
              <HStack>
                <UserIcon />
                <Text>
                  <FormattedMessage
                    id="component.preview-factiva-table.person"
                    defaultMessage="Person"
                  />
                </Text>
              </HStack>
            );
          }
        },
      },
      {
        key: "connectionType",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.relation",
          defaultMessage: "Relation",
        }),
        CellContent: ({ row: { connectionType } }) => {
          return <>{connectionType}</>;
        },
      },
    ],
    [intl.locale]
  );
}

function IconHints({ hints }: { hints: string[] }) {
  return (
    <>
      {hints.map((item, i) => {
        if (item.includes("PEP")) {
          return (
            <Badge colorScheme="green" key={i}>
              {item}
            </Badge>
          );
        }

        if (item.includes("SAN")) {
          return (
            <Badge colorScheme="red" key={i}>
              {item}
            </Badge>
          );
        }

        return <Badge key={i}>{item}</Badge>;
      })}
    </>
  );
}

DowJonesProfileDetails.fragments = {
  get DowJonesRiskEntitySanction() {
    return gql`
      fragment DowJonesProfileDetails_DowJonesRiskEntitySanction on DowJonesRiskEntitySanction {
        id
        name
        sources
        fromDate {
          year
          month
          day
        }
      }
    `;
  },
  get DowJonesRiskEntityRelationship() {
    return gql`
      fragment DowJonesProfileDetails_DowJonesRiskEntityRelationship on DowJonesRiskEntityRelationship {
        profileId
        connectionType
        iconHints
        name
        type
      }
    `;
  },
  get DowJonesRiskEntityProfileResult() {
    return gql`
      fragment DowJonesProfileDetails_DowJonesRiskEntityProfileResult on DowJonesRiskEntityProfileResult {
        id
        type
        name
        iconHints
        sanctions {
          ...DowJonesProfileDetails_DowJonesRiskEntitySanction
        }
        relationships {
          ...DowJonesProfileDetails_DowJonesRiskEntityRelationship
        }
        ... on DowJonesRiskEntityProfileResultEntity {
          dateOfRegistration {
            year
            month
            day
          }
        }
        ... on DowJonesRiskEntityProfileResultPerson {
          placeOfBirth {
            descriptor
            countryCode
          }
          dateOfBirth {
            year
            month
            day
          }
          citizenship {
            descriptor
            countryCode
          }
          residence {
            descriptor
            countryCode
          }
          jurisdiction {
            descriptor
            countryCode
          }
          isDeceased
        }
      }
      ${DowJonesProfileDetails.fragments.DowJonesRiskEntitySanction}
      ${DowJonesProfileDetails.fragments.DowJonesRiskEntityRelationship}
    `;
  },
};

DowJonesProfileDetails.queries = [
  gql`
    query DowJonesProfileDetails_dowJonesRiskEntityProfile($profileId: ID!) {
      dowJonesRiskEntityProfile(profileId: $profileId) {
        ...DowJonesProfileDetails_DowJonesRiskEntityProfileResult
      }
    }
    ${DowJonesProfileDetails.fragments.DowJonesRiskEntityProfileResult}
  `,
];

PreviewFactivaTable.fragments = {
  get DowJonesRiskEntitySearchResult() {
    return gql`
      fragment PreviewFactivaTable_DowJonesRiskEntitySearchResult on DowJonesRiskEntitySearchResult {
        id
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
      fragment PreviewFactivaTable_PetitionFieldReply on PetitionFieldReply {
        id
        content
      }
    `;
  },
};

PreviewFactivaTable.queries = [
  gql`
    query PreviewFactivaTable_dowJonesRiskEntitySearch(
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
          ...PreviewFactivaTable_DowJonesRiskEntitySearchResult
        }
        totalCount
      }
    }
    ${PreviewFactivaTable.fragments.DowJonesRiskEntitySearchResult}
  `,
];

const _mutations = [
  gql`
    mutation PreviewFactivaTable_createDowJonesKycResearchReply(
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
    mutation PreviewFactivaTable_deletePetitionFieldReply($petitionId: GID!, $replyId: GID!) {
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
