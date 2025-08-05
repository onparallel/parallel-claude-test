import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  HStack,
  Skeleton,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { CheckIcon, RepeatIcon, ShortSearchIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { usePreviewPetitionFieldBackgroundCheckReplaceReplyDialog } from "@parallel/components/petition-preview/dialogs/PreviewPetitionFieldBackgroundCheckReplaceReplyDialog";
import { BackgroundCheckEntityDetailsCompanyBasic } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsCompanyBasic";
import { BackgroundCheckEntityDetailsCompanyOverview } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsCompanyOverview";
import { BackgroundCheckEntityDetailsDatasets } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsDatasets";
import { BackgroundCheckEntityDetailsPersonBasic } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsPersonBasic";
import { BackgroundCheckEntityDetailsPersonOverview } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsPersonOverview";
import { BackgroundCheckEntityDetailsRelationships } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsRelationships";
import { BackgroundCheckEntityDetailsSanctions } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsSanctions";
import { useBackgroundCheckContentsNotUpdatedDialog } from "@parallel/components/profiles/dialogs/BackgroundCheckContentsNotUpdatedDialog";
import {
  BackgroundCheckEntitySearchType,
  BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsFragment,
  BackgroundCheckProfileDetails_backgroundCheckEntityDetailsDocument,
  BackgroundCheckProfileDetails_updateBackgroundCheckEntityDocument,
  BackgroundCheckProfileDetails_updateProfileFieldValueOptionsDocument,
} from "@parallel/graphql/__types";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { withError } from "@parallel/utils/promises/withError";
import { useBackgroundCheckProfileDownloadTask } from "@parallel/utils/tasks/useBackgroundCheckProfileDownloadTask";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useInterval } from "@parallel/utils/useInterval";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import { createHash } from "crypto";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, pick } from "remeda";

function BackgroundCheckProfileDetails({
  entityId,
  token,
  name,
  date,
  type,
  country,
  birthCountry,
}: UnwrapPromise<ReturnType<typeof BackgroundCheckProfileDetails.getInitialProps>>) {
  const intl = useIntl();
  const router = useRouter();
  const { query } = router;
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingReply, setIsDeletingReply] = useState(false);
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
    BackgroundCheckProfileDetails_backgroundCheckEntityDetailsDocument,
    {
      variables: {
        token,
        entityId,
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const showGenericErrorToast = useGenericErrorToast();
  if (isNonNullish(error)) {
    showGenericErrorToast();
  }

  const details = data?.backgroundCheckEntityDetails as
    | BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsFragment
    | undefined;

  useInterval(
    () => {
      if (!window.opener) {
        window.close();
      }
    },
    1000,
    [],
  );

  const [updateBackgroundCheckEntity] = useMutation(
    BackgroundCheckProfileDetails_updateBackgroundCheckEntityDocument,
  );

  const showPetitionFieldBackgroundCheckReplaceReplyDialog =
    usePreviewPetitionFieldBackgroundCheckReplaceReplyDialog();

  const handleSaveClick = async () => {
    setIsSavingProfile(true);
    try {
      if (details?.hasStoredEntity && !details?.isStoredEntity) {
        await showPetitionFieldBackgroundCheckReplaceReplyDialog();
      }
      await updateBackgroundCheckEntity({
        variables: {
          token,
          entityId,
        },
      });
      window.opener?.postMessage("refresh");
      await refetch({ force: false });
    } catch {
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteClick = async () => {
    setIsDeletingReply(true);
    try {
      await updateBackgroundCheckEntity({
        variables: {
          token,
          entityId: null,
        },
      });
      window.opener?.postMessage("refresh");
      await refetch({ force: false });
    } catch {
    } finally {
      setIsDeletingReply(false);
    }
  };

  const handleGoBackClick = () => {
    router.push(
      `/app/background-check/results?${new URLSearchParams({
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
  };

  const downloadBackgroundCheckProfilePdf = useBackgroundCheckProfileDownloadTask();
  const handleDownloadPDFClick = async () => {
    try {
      await downloadBackgroundCheckProfilePdf({
        token,
        entityId,
      });
    } catch {}
  };

  const [updateProfileFieldValueOptions] = useMutation(
    BackgroundCheckProfileDetails_updateProfileFieldValueOptionsDocument,
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
      await refetch({ force: false });
    } catch {}
  };

  const toast = useToast();
  const showBackgroundCheckContentsNotUpdatedDialog = useBackgroundCheckContentsNotUpdatedDialog();
  const handleRefreshEntity = useCallback(async () => {
    try {
      const oldData = details
        ? pick(details, ["id", "name", "properties", "type", "datasets"])
        : null;
      const { data } = await refetch({ force: true });
      const newData = data
        ? pick(data.backgroundCheckEntityDetails, ["id", "name", "properties", "type", "datasets"])
        : null;

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
  }, [details, refetch]);
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
      <Stack paddingX={6} paddingY={5} spacing={2} minHeight="100vh" backgroundColor="gray.50">
        <HStack justifyContent="space-between">
          <HStack spacing={4}>
            <IconButtonWithTooltip
              icon={<ShortSearchIcon />}
              label={intl.formatMessage({
                id: "page.background-check-profile-details.see-other-results",
                defaultMessage: "See other results",
              })}
              onClick={handleGoBackClick}
              variant="outline"
              backgroundColor="white"
            />
            <Box>
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
          </HStack>

          <HStack>
            {loading || !details || !details.createdAt ? (
              <Skeleton height="18px" width="280px" />
            ) : (
              <Text>
                <FormattedMessage
                  id="generic.results-for"
                  defaultMessage="Results for {date}"
                  values={{
                    date: intl.formatDate(details.createdAt, FORMATS.FULL),
                  }}
                />
              </Text>
            )}
            {details?.hasPendingReview ? (
              <Button
                colorScheme="primary"
                leftIcon={<CheckIcon />}
                onClick={handleConfirmChangesClick}
              >
                <FormattedMessage
                  id="component.background-check-profile-details.mark-as-reviewed"
                  defaultMessage="Mark as reviewed"
                />
              </Button>
            ) : details?.isStoredEntity && !isReadOnly ? (
              <IconButtonWithTooltip
                variant="outline"
                label={intl.formatMessage({
                  id: "component.background-check-search-result.refresh-search",
                  defaultMessage: "Refresh search",
                })}
                icon={<RepeatIcon />}
                onClick={handleRefreshEntity}
              />
            ) : null}
          </HStack>
        </HStack>

        {loading || !details ? (
          <>
            <Card>
              <CardHeader minHeight="65px">
                <HStack>
                  <HStack flex="1">
                    <Skeleton height="24px" width="100%" maxWidth="320px" />
                    <Skeleton height="18px" width="50px" />
                    <Skeleton height="18px" width="40px" />
                  </HStack>
                  <HStack spacing={4}>
                    <Skeleton height="18px" width="100px" />
                    <Skeleton height="40px" width="110px" />
                  </HStack>
                </HStack>
              </CardHeader>
              <Box height={"85px"}>
                <Center height="100%">
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="purple.500"
                    size="xl"
                  />
                </Center>
              </Box>
            </Card>
            <Card>
              <CardHeader>
                <Text fontWeight={600} fontSize="xl">
                  <FormattedMessage
                    id="page.background-check-profile-details.overview"
                    defaultMessage="Overview"
                  />
                </Text>
              </CardHeader>
              <Center minHeight="160px" height="100%">
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="purple.500"
                  size="xl"
                />
              </Center>
            </Card>
            <Card>
              <CardHeader>
                <Text as="span" fontWeight={600} fontSize="xl">
                  <FormattedMessage
                    id="page.background-check-profile-details.sanction-lists"
                    defaultMessage="Sanction lists"
                  />
                </Text>
              </CardHeader>
              <Center minHeight="160px" height="100%">
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="purple.500"
                  size="xl"
                />
              </Center>
            </Card>
          </>
        ) : (
          <>
            {details.__typename === "BackgroundCheckEntityDetailsCompany" ? (
              <>
                <BackgroundCheckEntityDetailsCompanyBasic
                  hasReply={details.isStoredEntity ?? false}
                  isReadOnly={isReadOnly || isTemplate}
                  isDeleting={isDeletingReply}
                  isSaving={isSavingProfile}
                  onDelete={handleDeleteClick}
                  onDownloadPDF={handleDownloadPDFClick}
                  onSave={handleSaveClick}
                  data={details}
                />
                <BackgroundCheckEntityDetailsCompanyOverview overview={details} />
              </>
            ) : details.__typename === "BackgroundCheckEntityDetailsPerson" ? (
              <>
                <BackgroundCheckEntityDetailsPersonBasic
                  hasReply={details.isStoredEntity ?? false}
                  isReadOnly={isReadOnly || isTemplate}
                  isDeleting={isDeletingReply}
                  isSaving={isSavingProfile}
                  onDelete={handleDeleteClick}
                  onDownloadPDF={handleDownloadPDFClick}
                  onSave={handleSaveClick}
                  data={details}
                />
                <BackgroundCheckEntityDetailsPersonOverview overview={details} />
              </>
            ) : null}

            {isNonNullish(details.properties.sanctions) ? (
              <BackgroundCheckEntityDetailsSanctions sanctions={details.properties.sanctions} />
            ) : null}

            {isNonNullish(details.properties.relationships) ? (
              <BackgroundCheckEntityDetailsRelationships
                entityId={entityId}
                relationships={details.properties.relationships}
              />
            ) : null}

            {isNonNullish(details.datasets) ? (
              <BackgroundCheckEntityDetailsDatasets datasets={details.datasets} />
            ) : null}
          </>
        )}
      </Stack>
    </>
  );
}

const _fragments = {
  get BackgroundCheckEntityDetailsPerson() {
    return gql`
      fragment BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsPerson on BackgroundCheckEntityDetailsPerson {
        id
        ...BackgroundCheckEntityDetailsPersonBasic_BackgroundCheckEntityDetailsPerson
        ...BackgroundCheckEntityDetailsPersonOverview_BackgroundCheckEntityDetailsPerson
        properties {
          relationships {
            ...BackgroundCheckEntityDetailsRelationships_BackgroundCheckEntityDetailsRelationship
          }
          sanctions {
            ...BackgroundCheckEntityDetailsSanctions_BackgroundCheckEntityDetailsSanction
          }
        }
      }
      ${BackgroundCheckEntityDetailsPersonBasic.fragments.BackgroundCheckEntityDetailsPersonBasic}
      ${BackgroundCheckEntityDetailsPersonOverview.fragments
        .BackgroundCheckEntityDetailsPersonOverview}
      ${BackgroundCheckEntityDetailsRelationships.fragments
        .BackgroundCheckEntityDetailsRelationship}
      ${BackgroundCheckEntityDetailsSanctions.fragments.BackgroundCheckEntityDetailsSanction}
    `;
  },

  get BackgroundCheckEntityDetailsCompany() {
    return gql`
      fragment BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsCompany on BackgroundCheckEntityDetailsCompany {
        id
        ...BackgroundCheckEntityDetailsCompanyBasic_BackgroundCheckEntityDetailsCompany
        ...BackgroundCheckEntityDetailsCompanyOverview_BackgroundCheckEntityDetailsCompany
        properties {
          relationships {
            ...BackgroundCheckEntityDetailsRelationships_BackgroundCheckEntityDetailsRelationship
          }
          sanctions {
            ...BackgroundCheckEntityDetailsSanctions_BackgroundCheckEntityDetailsSanction
          }
        }
      }
      ${BackgroundCheckEntityDetailsCompanyBasic.fragments.BackgroundCheckEntityDetailsCompanyBasic}
      ${BackgroundCheckEntityDetailsCompanyOverview.fragments
        .BackgroundCheckEntityDetailsCompanyOverview}
      ${BackgroundCheckEntityDetailsRelationships.fragments
        .BackgroundCheckEntityDetailsRelationship}
      ${BackgroundCheckEntityDetailsSanctions.fragments.BackgroundCheckEntityDetailsSanction}
    `;
  },

  get BackgroundCheckEntityDetails() {
    return gql`
      fragment BackgroundCheckProfileDetails_BackgroundCheckEntityDetails on BackgroundCheckEntityDetails {
        id
        type
        name
        ... on BackgroundCheckEntityDetailsPerson {
          ...BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsPerson
        }
        ... on BackgroundCheckEntityDetailsCompany {
          ...BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsCompany
        }
        datasets {
          ...BackgroundCheckEntityDetailsDatasets_BackgroundCheckEntityDetailsDataset
        }
        createdAt
        hasStoredEntity
        isStoredEntity
        hasPendingReview
      }
      ${BackgroundCheckEntityDetailsDatasets.fragments.BackgroundCheckEntityDetailsDataset}
      ${this.BackgroundCheckEntityDetailsPerson}
      ${this.BackgroundCheckEntityDetailsCompany}
    `;
  },
};

const _queries = [
  gql`
    query BackgroundCheckProfileDetails_backgroundCheckEntityDetails(
      $token: String!
      $entityId: String!
      $force: Boolean
    ) {
      backgroundCheckEntityDetails(token: $token, entityId: $entityId, force: $force) {
        ...BackgroundCheckProfileDetails_BackgroundCheckEntityDetails
      }
    }
    ${_fragments.BackgroundCheckEntityDetails}
  `,
];

const _mutations = [
  gql`
    mutation BackgroundCheckProfileDetails_updateBackgroundCheckEntity(
      $token: String!
      $entityId: String
    ) {
      updateBackgroundCheckEntity(token: $token, entityId: $entityId)
    }
  `,
  gql`
    mutation BackgroundCheckProfileDetails_updateProfileFieldValueOptions(
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
        hasPendingReview
      }
    }
  `,
];

BackgroundCheckProfileDetails.getInitialProps = async ({ query }: WithApolloDataContext) => {
  const entityId = query.entityId as string;
  const token = query.token as string;
  const name = query.name as string;
  const date = query.date as string | null;
  const type = query.type as BackgroundCheckEntitySearchType | null;
  const country = query.country as string | null;
  const birthCountry = query.birthCountry as string | null;

  return { entityId, token, name, date, type, country, birthCountry };
};

export default compose(
  withDialogs,
  withFeatureFlag("BACKGROUND_CHECK"),
  withApolloData,
)(BackgroundCheckProfileDetails);
