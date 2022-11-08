import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Center,
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
  DowJonesSearchResult_createDowJonesKycResearchReplyDocument,
  DowJonesSearchResult_deletePetitionFieldReplyDocument,
  Maybe,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { useLoadCountryNames } from "@parallel/utils/useCountryName";
import { useDowJonesProfileDownloadTask } from "@parallel/utils/useDowJonesProfileDownloadTask";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { Card, CardHeader } from "../../common/Card";
import { IconButtonWithTooltip } from "../../common/IconButtonWithTooltip";
import { DowJonesHints } from "../../petition-common/DowJonesHints";

type DowJonesProfileDetailsProps = {
  id: string;
  onGoBack: () => void;
  petitionId: string;
  fieldId: string;
  replyId: Maybe<string>;
};

export function DowJonesProfileDetails({
  id,
  replyId,
  petitionId,
  fieldId,
  onGoBack,
}: DowJonesProfileDetailsProps) {
  const intl = useIntl();
  const showGenericErrorToast = useGenericErrorToast();
  const { data, loading, refetch } = useQuery(
    DowJonesProfileDetails_dowJonesRiskEntityProfileDocument,
    {
      variables: {
        profileId: id,
      },
    }
  );

  const [createDowJonesKycResearchReply, { loading: isSavingProfile }] = useMutation(
    DowJonesSearchResult_createDowJonesKycResearchReplyDocument
  );

  const handleSaveClick = async () => {
    try {
      await createDowJonesKycResearchReply({
        variables: {
          profileId: id,
          petitionId,
          fieldId,
        },
      });
    } catch (e) {
      showGenericErrorToast(e);
    }
  };

  const [deletePetitionFieldReply] = useMutation(
    DowJonesSearchResult_deletePetitionFieldReplyDocument
  );

  const handleDeleteClick = async () => {
    try {
      if (isDefined(replyId)) {
        await deletePetitionFieldReply({
          variables: {
            petitionId,
            replyId,
          },
        });
      }
    } catch (e) {
      showGenericErrorToast(e);
    }
  };

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
            id="component.dow-jones-profile-details.profile-details"
            defaultMessage="Profile details"
          />
        </Heading>
      </HStack>

      <Card>
        <CardHeader minHeight="65px">
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
                    <DowJonesHints hints={details?.iconHints ?? []} />
                  </Text>
                </>
              )}
            </HStack>
            <Box>
              {replyId ? (
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
                  variant="solid"
                  colorScheme="purple"
                  leftIcon={<SaveIcon />}
                  onClick={handleSaveClick}
                  isLoading={isSavingProfile}
                >
                  <FormattedMessage id="generic.save" defaultMessage="Save" />
                </Button>
              )}
            </Box>
          </HStack>
        </CardHeader>
        {loading ? (
          <Box height={"85px"}></Box>
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
              id="component.dow-jones-profile-details.sanction-lists"
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
              id="component.dow-jones-profile-details.relationships"
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
              rowKeyProp="id"
              onRowClick={handleRelationshipsRowClick}
            />
          </Box>
        ) : (
          <Box height="120px"></Box>
        )}
      </Card>

      {loading || !details ? null : (
        <HStack justifyContent="space-between" flexWrap="wrap" spacing={0} gridGap={2}>
          <Text>
            <FormattedMessage
              id="component.dow-jones-profile-details.results-obtained-on"
              defaultMessage="Results obtained on {date}"
              values={{
                date: intl.formatDate(details.updatedAt, FORMATS.FULL),
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
              id="component.dow-jones-profile-details.get-full-pdf"
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
          <FormattedMessage id="component.dow-jones-profile-details.type" defaultMessage="Type" />:
        </Text>
        <HStack>
          <UserIcon />
          <Text>
            <FormattedMessage
              id="component.dow-jones-profile-details.person"
              defaultMessage="Person"
            />
          </Text>
        </HStack>
      </Stack>

      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage id="component.dow-jones-profile-details.birth" defaultMessage="Birth" />
          :
        </Text>
        <HStack>
          {birthFlag}
          <Text>{placeOfBirthCountryCode ? countries?.[placeOfBirthCountryCode] : "-"}</Text>
        </HStack>
      </Stack>

      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage
            id="component.dow-jones-profile-details.citizenship"
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
            id="component.dow-jones-profile-details.resident-of"
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
            id="component.dow-jones-profile-details.jurisdiction"
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
            id="component.dow-jones-search-result.date-of-birth"
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
            id="component.dow-jones-profile-details.deceased"
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
          <FormattedMessage id="component.dow-jones-profile-details.type" defaultMessage="Type" />:
        </Text>
        <HStack>
          <BusinessIcon />
          <Text>
            <FormattedMessage
              id="component.dow-jones-profile-details.entity"
              defaultMessage="Entity"
            />
          </Text>
        </HStack>
      </Stack>
      <Stack>
        <Text {...detailsSpanProps}>
          <FormattedMessage
            id="component.dow-jones-profile-details.date-of-registration"
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
          id: "component.dow-jones-search-result.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row: { name } }) => {
          return <>{name}</>;
        },
      },
      {
        key: "from",
        header: intl.formatMessage({
          id: "component.dow-jones-profile-details.from",
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
        key: "type",
        header: intl.formatMessage({
          id: "component.dow-jones-profile-details.type",
          defaultMessage: "Type",
        }),
        CellContent: ({ row: { type } }) => {
          if (type === "Entity") {
            return (
              <HStack>
                <BusinessIcon />
                <Text>
                  <FormattedMessage
                    id="component.dow-jones-profile-details.entity"
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
                    id="component.dow-jones-profile-details.person"
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
          id: "component.dow-jones-profile-details.relation",
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
        updatedAt
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
