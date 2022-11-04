import { gql, useQuery } from "@apollo/client";
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
  PreviewFactivaTable_dowJonesRiskEntitySearchDocument,
  PreviewFactivaTable_DowJonesRiskEntitySearchResultFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { useLoadCountryNames } from "@parallel/utils/useCountryName";
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

export function PreviewFactivaTable({
  name,
  date,
  onResetClick,
}: {
  name: string;
  date: string;
  onResetClick: () => void;
}) {
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [profileId, setProfileId] = useState<string | null>(null);

  const { data, loading } = useQuery(PreviewFactivaTable_dowJonesRiskEntitySearchDocument, {
    variables: {
      offset: state.items * (state.page - 1),
      limit: state.items,
      name: name,
    },
    fetchPolicy: "cache-and-network",
  });

  const result = data?.dowJonesRiskEntitySearch;

  const columns = useDowJonesFactivaDataColumns();

  const handleRowClick = useCallback(function (row: FactivaSelection, event: MouseEvent) {
    console.log("Row clicked: ", row);
    setProfileId(row.id);
  }, []);

  if (profileId) {
    return <DowJonesProfileDetails id={profileId} onGoBack={() => setProfileId(null)} />;
  }

  return (
    <Stack paddingX={6} paddingY={5} spacing={6}>
      <Heading size="md">
        <FormattedMessage
          id="component.recipient-view-petition-field-kyc-research.results-found"
          defaultMessage="Results found: {amount}"
          values={{ amount: loading ? "..." : result?.totalCount }}
        />
      </Heading>
      <TablePage
        isHighlightable
        columns={columns}
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
                  id="view.group.no-users"
                  defaultMessage="No users added to this team yet"
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

  return useMemo<TableColumn<FactivaSelection>[]>(
    () => [
      {
        key: "tags",
        header: "",
        CellContent: ({ row: { iconHints } }) => {
          if (!iconHints || iconHints.length === 0) {
            return <></>;
          }

          return (
            <Stack direction="row">
              {iconHints.map((item, i) => (
                <Badge key={i}>{item}</Badge>
              ))}
            </Stack>
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
            return <>{`${row.dateOfBirth?.year} `}</>;
          } else {
            return <>{"-"}</>;
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
          return <>{countryTerritoryName}</>;
        },
      },
      {
        key: "subsidiary",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.subsidiary",
          defaultMessage: "Subsidiary",
        }),
        CellContent: ({ row: { isSubsidiary } }) => {
          return <>{isSubsidiary ? "YEST" : "N/A"}</>;
        },
      },
      {
        key: "actions",
        header: "",
        CellContent: ({ row }) => {
          return (
            <Flex justifyContent="end">
              <Button variant="solid" colorScheme="purple" leftIcon={<SaveIcon />}>
                <FormattedMessage id="generic.save" defaultMessage="Save" />
              </Button>
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

  const handleSanctionsRowClick = ({ sources }) => {
    if (isDefined(sources[0])) {
      openNewWindow(sources[0]);
    }
  };
  const handleRelationshipsRowClick = ({ profileId }) => {
    refetch({
      profileId: profileId,
    });
  };

  const sanctionsColumns = useDowJonesFactivaSanctionsColumns();
  const relationshipsColumns = useDowJonesFactivaRelationshipsColumns();

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
          <HStack>
            {loading ? (
              <Skeleton height="20px" />
            ) : (
              <>
                <Text fontSize="xl">{details?.name}</Text>
                <Stack direction="row" lineHeight="1.5">
                  {details?.iconHints?.map((item, i) => (
                    <Badge key={i}>{item}</Badge>
                  ))}
                </Stack>
              </>
            )}
          </HStack>
        </CardHeader>
        {details?.__typename === "DowJonesRiskEntityProfileResultEntity" ? (
          <ProfileResultEntity data={details} />
        ) : (
          <ProfileResultPerson data={details} />
        )}
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
          <Table
            isHighlightable
            columns={sanctionsColumns}
            rows={details?.sanctions}
            rowKeyProp="name"
            onRowClick={handleSanctionsRowClick}
          />
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
          <Table
            isHighlightable
            columns={relationshipsColumns}
            rows={details?.relationships}
            rowKeyProp="profileId"
            onRowClick={handleRelationshipsRowClick}
          />
        ) : (
          <Box height="120px"></Box>
        )}
      </Card>

      <HStack justifyContent="space-between">
        <Text>
          <FormattedMessage
            id="component.preview-factiva-table.results-obtained-on"
            defaultMessage="Results obtained on {date}"
            values={{
              date: intl.formatDate(new Date(), FORMATS.FULL),
            }}
          />
        </Text>
        <Button variant="ghost" colorScheme="purple" leftIcon={<DownloadIcon />}>
          <FormattedMessage
            id="component.preview-factiva-table.get-full-pdf"
            defaultMessage="Get full PDF"
          />
        </Button>
      </HStack>
    </Stack>
  );
}

function ProfileResultPerson({ data }: { data: DowJonesRiskEntityProfileResultPerson }) {
  const intl = useIntl();

  const { countries } = useLoadCountryNames(intl.locale);

  const { placeOfBirth, citizenship, residence, jurisdiction, isDeceased } = data ?? {};

  const placeOfBirthCountryCode = placeOfBirth?.countryCode;
  const citizenshipCountryCode = citizenship?.countryCode;
  const residentCountryCode = residence?.countryCode;
  const jurisdictionCountryCode = jurisdiction?.countryCode;

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
    <HStack paddingX={6} paddingY={4} gridGap={8} spacing={0} wrap="wrap" alignItems="start">
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
          <Text>{placeOfBirthCountryCode ? countries?.[placeOfBirthCountryCode] : ""}</Text>
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
          <Text>{citizenshipCountryCode ? countries?.[citizenshipCountryCode] : ""}</Text>
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
          <Text>{residentCountryCode ? countries?.[residentCountryCode] : ""}</Text>
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
          <Text>{jurisdictionCountryCode ? countries?.[jurisdictionCountryCode] : ""}</Text>
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
          <Text>7 de Octubre de 1952</Text>
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
  const detailsSpanProps = {
    color: "gray.600",
    fontSize: "sm",
  };

  return (
    <HStack paddingX={6} paddingY={4} gridGap={8} spacing={0} wrap="wrap">
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
          <Text>7 de Octubre de 1952</Text>
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
          const { year, month, day } = fromDate;

          return <>{`${year} ${month} ${day}`}</>;
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
            <Stack direction="row">
              {iconHints.map((item, i) => (
                <Badge key={i}>{item}</Badge>
              ))}
            </Stack>
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

DowJonesProfileDetails.fragments = {
  get DowJonesRiskEntitySanction() {
    return gql`
      fragment DowJonesProfileDetails_DowJonesRiskEntitySanction on DowJonesRiskEntitySanction {
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
    query DowJonesProfileDetails_dowJonesRiskEntityProfile($profileId: String!) {
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
