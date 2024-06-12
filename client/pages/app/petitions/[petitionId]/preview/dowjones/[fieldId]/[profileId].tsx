import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
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
import { Card, CardHeader } from "@parallel/components/common/Card";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { DowJonesRiskLabel } from "@parallel/components/petition-common/DowJonesRiskLabel";
import {
  DowJonesFieldProfileDetails_DowJonesKycEntityProfileResult_DowJonesKycEntityProfileResultEntity_Fragment,
  DowJonesFieldProfileDetails_DowJonesKycEntityProfileResult_DowJonesKycEntityProfileResultPerson_Fragment,
  DowJonesFieldProfileDetails_DowJonesKycEntityRelationshipFragment,
  DowJonesFieldProfileDetails_DowJonesKycEntitySanctionFragment,
  DowJonesFieldProfileDetails_createDowJonesKycReplyDocument,
  DowJonesFieldProfileDetails_deletePetitionFieldReplyDocument,
  DowJonesFieldProfileDetails_petitionFieldDocument,
  DowJonesFieldProfileDetails_profileDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { useDowJonesProfileDownloadTask } from "@parallel/utils/tasks/useDowJonesProfileDownloadTask";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

function DowJonesFieldProfileDetails({
  petitionId,
  fieldId,
  profileId,
  fieldReplyId,
}: UnwrapPromise<ReturnType<typeof DowJonesFieldProfileDetails.getInitialProps>>) {
  const intl = useIntl();
  const router = useRouter();
  const { query } = router;
  const showGenericErrorToast = useGenericErrorToast();

  const { data, loading, error } = useQuery(DowJonesFieldProfileDetails_profileDocument, {
    variables: { profileId },
  });

  if (isDefined(error)) {
    showGenericErrorToast();
  }

  const details = data?.dowJonesKycEntityProfile;

  const [replyId, setReplyId] = useState<string | null>(fieldReplyId ?? null);

  const [createDowJonesKycReply, { loading: isSavingProfile }] = useMutation(
    DowJonesFieldProfileDetails_createDowJonesKycReplyDocument,
  );
  const [deletePetitionFieldReply, { loading: isDeletingReply }] = useMutation(
    DowJonesFieldProfileDetails_deletePetitionFieldReplyDocument,
  );

  useEffect(() => {
    setReplyId(fieldReplyId);
  }, [fieldReplyId]);

  const handleSaveClick = async () => {
    try {
      const { data } = await createDowJonesKycReply({
        variables: {
          profileId,
          petitionId,
          fieldId,
        },
      });

      const replyId =
        data?.createDowJonesKycReply.field?.replies.find(
          (r) => r.content.entity.profileId === profileId,
        )?.id ?? null;

      setReplyId(replyId);
      window.opener.postMessage("refresh", window.origin);
    } catch (e) {
      if (isApolloError(e, "INVALID_CREDENTIALS")) {
        // don't log error to Sentry if it's an INVALID_CREDENTIALS
        showGenericErrorToast();
      } else {
        showGenericErrorToast(e);
      }
    }
  };

  const handleDeleteClick = async () => {
    try {
      if (replyId) {
        await deletePetitionFieldReply({
          variables: {
            petitionId,
            replyId,
          },
        });
        setReplyId(null);
      }

      window.opener.postMessage("refresh", window.origin);
    } catch (e) {
      showGenericErrorToast(e);
    }
  };

  const handleSanctionsRowClick = useCallback(function (
    row: DowJonesFieldProfileDetails_DowJonesKycEntitySanctionFragment,
  ) {
    if (isDefined(row.sources[0])) {
      openNewWindow(row.sources[0]);
    }
  }, []);

  const handleRelationshipsRowClick = useCallback(function (
    row: DowJonesFieldProfileDetails_DowJonesKycEntityRelationshipFragment,
  ) {
    if (isDefined(row.profileId)) {
      const { petitionId, fieldId } = query;
      router.push(`/app/petitions/${petitionId}/preview/dowjones/${fieldId}/${row.profileId}`);
    }
  }, []);

  const handleGoBackClick = () => {
    window.history.back();
  };

  const sanctionsColumns = useDowJonesKycSanctionsColumns();
  const relationshipsColumns = useDowJonesKycRelationshipsColumns();
  const downloadDowJonesProfilePdf = useDowJonesProfileDownloadTask();
  return (
    <>
      <Head>
        <title>
          {
            // eslint-disable-next-line formatjs/no-literal-string-in-jsx
            "Dow Jones | Parallel"
          }
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Stack paddingX={6} paddingY={5} spacing={6} minHeight="100vh" backgroundColor="gray.50">
        <HStack>
          <IconButtonWithTooltip
            icon={<ArrowBackIcon />}
            variant="ghost"
            label={intl.formatMessage({
              id: "generic.go-back",
              defaultMessage: "Go back",
            })}
            onClick={handleGoBackClick}
          />
          <Heading as="h1" size="md">
            <FormattedMessage
              id="component.dow-jones-profile-details.profile-details"
              defaultMessage="Profile details"
            />
          </Heading>
        </HStack>
        <Card>
          <CardHeader headingLevel="h2" minHeight="65px">
            <Stack direction={{ base: "column", sm: "row" }} spacing={4}>
              <Stack
                direction={{ base: "column", md: "row" }}
                alignItems={{ base: "start", md: "center" }}
                flex="1"
              >
                {loading ? (
                  <>
                    <Skeleton height="24px" width="100%" maxWidth="320px" />
                    <Skeleton height="18px" width="50px" />
                  </>
                ) : (
                  <>
                    <Text as="div" fontSize="xl">
                      {details?.name}
                    </Text>
                    <Flex lineHeight="base" gap={2} flexWrap="wrap">
                      {details?.iconHints?.map((hint, i) => (
                        <DowJonesRiskLabel key={i} risk={hint} />
                      ))}
                    </Flex>
                  </>
                )}
              </Stack>
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
                      isDisabled={isDeletingReply}
                    />
                  </HStack>
                ) : (
                  <Button
                    variant="solid"
                    colorScheme="primary"
                    leftIcon={<SaveIcon />}
                    onClick={handleSaveClick}
                    isLoading={isSavingProfile}
                    isDisabled={loading}
                  >
                    <FormattedMessage id="generic.save" defaultMessage="Save" />
                  </Button>
                )}
              </Box>
            </Stack>
          </CardHeader>
          {loading ? (
            <Box height={"85px"}></Box>
          ) : details?.__typename === "DowJonesKycEntityProfileResultEntity" ? (
            <ProfileResultEntity data={details} />
          ) : details?.__typename === "DowJonesKycEntityProfileResultPerson" ? (
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
                rows={details.sanctions}
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
                rows={details.relationships}
                rowKeyProp="profileId"
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
              colorScheme="primary"
              leftIcon={<DownloadIcon />}
              onClick={() => downloadDowJonesProfilePdf(profileId)}
            >
              <FormattedMessage
                id="component.dow-jones-profile-details.get-full-pdf"
                defaultMessage="Get full PDF"
              />
            </Button>
          </HStack>
        )}
      </Stack>
    </>
  );
}

function ProfileResultPerson({
  data,
}: {
  data: DowJonesFieldProfileDetails_DowJonesKycEntityProfileResult_DowJonesKycEntityProfileResultPerson_Fragment;
}) {
  const intl = useIntl();

  const { countries } = useLoadCountryNames(intl.locale);
  const getCountryName = (code: string) => {
    return countries?.[code];
  };

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
        process.env.NEXT_PUBLIC_ASSETS_URL ?? ""
      }/static/countries/flags/${placeOfBirthCountryCode.toLowerCase()}.png`}
    />
  ) : null;

  const citizenshipFlag = citizenshipCountryCode ? (
    <Image
      alt={getCountryName(citizenshipCountryCode)}
      boxSize={6}
      src={`${
        process.env.NEXT_PUBLIC_ASSETS_URL ?? ""
      }/static/countries/flags/${citizenshipCountryCode.toLowerCase()}.png`}
    />
  ) : null;

  const residentFlag = residentCountryCode ? (
    <Image
      alt={getCountryName(residentCountryCode)}
      boxSize={6}
      src={`${
        process.env.NEXT_PUBLIC_ASSETS_URL ?? ""
      }/static/countries/flags/${residentCountryCode.toLowerCase()}.png`}
    />
  ) : null;

  const jurisdictionFlag = jurisdictionCountryCode ? (
    <Image
      alt={getCountryName(jurisdictionCountryCode)}
      boxSize={6}
      src={`${
        process.env.NEXT_PUBLIC_ASSETS_URL ?? ""
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
          <Text>{placeOfBirthCountryCode ? getCountryName(placeOfBirthCountryCode) : "-"}</Text>
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
          <Text>{citizenshipCountryCode ? getCountryName(citizenshipCountryCode) : "-"}</Text>
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
          <Text>{residentCountryCode ? getCountryName(residentCountryCode) : "-"}</Text>
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
          <Text>{jurisdictionCountryCode ? getCountryName(jurisdictionCountryCode) : "-"}</Text>
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
              : year
                ? year
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

function ProfileResultEntity({
  data,
}: {
  data: DowJonesFieldProfileDetails_DowJonesKycEntityProfileResult_DowJonesKycEntityProfileResultEntity_Fragment;
}) {
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
              : year
                ? year
                : "-"}
          </Text>
        </HStack>
      </Stack>
    </HStack>
  );
}

function useDowJonesKycSanctionsColumns() {
  const intl = useIntl();

  return useMemo<TableColumn<DowJonesFieldProfileDetails_DowJonesKycEntitySanctionFragment>[]>(
    () => [
      {
        key: "name",
        label: intl.formatMessage({
          id: "component.dow-jones-search-result.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row: { name } }) => {
          return <>{name}</>;
        },
      },
      {
        key: "from",
        label: intl.formatMessage({
          id: "component.dow-jones-profile-details.from",
          defaultMessage: "From",
        }),
        CellContent: ({ row: { fromDate } }) => {
          const { year, month, day } = fromDate ?? {};

          return (
            <>
              {year && month && day
                ? intl.formatDate(new Date(year, month - 1, day), FORMATS.ll)
                : year
                  ? year
                  : "-"}
            </>
          );
        },
      },
    ],
    [intl.locale],
  );
}

function useDowJonesKycRelationshipsColumns() {
  const intl = useIntl();

  return useMemo<TableColumn<DowJonesFieldProfileDetails_DowJonesKycEntityRelationshipFragment>[]>(
    () => [
      {
        key: "tags",
        label: "",
        CellContent: ({ row: { iconHints } }) => {
          return (
            <Flex gap={2} flexWrap="wrap">
              {iconHints?.map((hint, i) => <DowJonesRiskLabel key={i} risk={hint} />)}
            </Flex>
          );
        },
      },
      {
        key: "name",
        label: intl.formatMessage({
          id: "component.dow-jones-search-result.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row: { name } }) => {
          return <>{name}</>;
        },
      },
      {
        key: "type",
        label: intl.formatMessage({
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
        label: intl.formatMessage({
          id: "component.dow-jones-profile-details.relation",
          defaultMessage: "Relation",
        }),
        CellContent: ({ row: { connectionType } }) => {
          return <>{connectionType}</>;
        },
      },
    ],
    [intl.locale],
  );
}

const _fragments = {
  get PetitionField() {
    return gql`
      fragment DowJonesFieldProfileDetails_PetitionField on PetitionField {
        id
        type
        replies {
          id
          content
        }
      }
    `;
  },
  get DowJonesKycEntitySanction() {
    return gql`
      fragment DowJonesFieldProfileDetails_DowJonesKycEntitySanction on DowJonesKycEntitySanction {
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
  get DowJonesKycEntityRelationship() {
    return gql`
      fragment DowJonesFieldProfileDetails_DowJonesKycEntityRelationship on DowJonesKycEntityRelationship {
        profileId
        connectionType
        iconHints
        name
        type
      }
    `;
  },
  get DowJonesKycEntityProfileResult() {
    return gql`
      fragment DowJonesFieldProfileDetails_DowJonesKycEntityProfileResult on DowJonesKycEntityProfileResult {
        id
        type
        name
        iconHints
        sanctions {
          ...DowJonesFieldProfileDetails_DowJonesKycEntitySanction
        }
        relationships {
          ...DowJonesFieldProfileDetails_DowJonesKycEntityRelationship
        }
        updatedAt
        ... on DowJonesKycEntityProfileResultEntity {
          dateOfRegistration {
            year
            month
            day
          }
        }
        ... on DowJonesKycEntityProfileResultPerson {
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
      ${_fragments.DowJonesKycEntitySanction}
      ${_fragments.DowJonesKycEntityRelationship}
    `;
  },
};

const _mutations = [
  gql`
    mutation DowJonesFieldProfileDetails_createDowJonesKycReply(
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
    mutation DowJonesFieldProfileDetails_deletePetitionFieldReply(
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
    query DowJonesFieldProfileDetails_profile($profileId: ID!) {
      dowJonesKycEntityProfile(profileId: $profileId) {
        ...DowJonesFieldProfileDetails_DowJonesKycEntityProfileResult
      }
    }
    ${_fragments.DowJonesKycEntityProfileResult}
  `,
  gql`
    query DowJonesFieldProfileDetails_petitionField($petitionId: GID!, $petitionFieldId: GID!) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        ...DowJonesFieldProfileDetails_PetitionField
      }
    }
    ${_fragments.PetitionField}
  `,
];

DowJonesFieldProfileDetails.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  const fieldId = query.fieldId as string;
  const profileId = query.profileId as string;

  const [
    {
      data: { petitionField },
    },
  ] = await Promise.all([
    fetchQuery(DowJonesFieldProfileDetails_petitionFieldDocument, {
      variables: { petitionId, petitionFieldId: fieldId },
      ignoreCache: true,
    }),
  ]);

  const fieldReplyId =
    petitionField.replies.find((r) => r.content.entity.profileId === profileId)?.id ?? null;

  return { petitionId, fieldId, profileId, fieldReplyId };
};

export default compose(
  withDialogs,
  withFeatureFlag("DOW_JONES_KYC"),
  withApolloData,
)(DowJonesFieldProfileDetails);
