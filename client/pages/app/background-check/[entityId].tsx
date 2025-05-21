import { gql, useMutation, useQuery } from "@apollo/client";
import { Box, Center, HStack, Skeleton, Spinner, Stack, Text } from "@chakra-ui/react";
import { ShortSearchIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { usePreviewPetitionFieldBackgroundCheckReplaceReplyDialog } from "@parallel/components/petition-preview/dialogs/PreviewPetitionFieldBackgroundCheckReplaceReplyDialog";
import { BackgroundCheckEntityDetailsCompanyBasic } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsCompanyBasic";
import { BackgroundCheckEntityDetailsCompanyOverview } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsCompanyOverview";
import { BackgroundCheckEntityDetailsPersonBasic } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsPersonBasic";
import { BackgroundCheckEntityDetailsPersonOverview } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsPersonOverview";
import { BackgroundCheckEntityDetailsRelationships } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsRelationships";
import { BackgroundCheckEntityDetailsSanctions } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityDetailsSanctions";
import {
  BackgroundCheckEntitySearchType,
  BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsCompanyFragment,
  BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsPersonFragment,
  BackgroundCheckProfileDetails_backgroundCheckEntityDetailsDocument,
  BackgroundCheckProfileDetails_updateBackgroundCheckEntityDocument,
} from "@parallel/graphql/__types";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { useBackgroundCheckProfileDownloadTask } from "@parallel/utils/tasks/useBackgroundCheckProfileDownloadTask";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useInterval } from "@parallel/utils/useInterval";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import { useWindowEvent } from "@parallel/utils/useWindowEvent";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

type BackgroundCheckProfileDetails_Selection = { createdAt: string } & (
  | ({
      type: "Person";
    } & BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsPersonFragment)
  | ({
      type: "Company";
    } & BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsCompanyFragment)
);

function BackgroundCheckProfileDetails({
  entityId,
  token,
  name,
  date,
  type,
  country,
}: UnwrapPromise<ReturnType<typeof BackgroundCheckProfileDetails.getInitialProps>>) {
  const intl = useIntl();
  const router = useRouter();
  const { query } = router;
  const [savedEntityIds, setSavedEntityIds] = useState<string[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingReply, setIsDeletingReply] = useState(false);
  const isSaved = savedEntityIds.includes(entityId);
  const isReadOnly = query.readonly === "true";
  const isTemplate = query.template === "true";

  const countryNames = useLoadCountryNames(intl.locale);
  const countryName =
    country && isNonNullish(countryNames.countries)
      ? countryNames.countries[country.toUpperCase()]
      : country;
  const entityTypeLabel = getEntityTypeLabel(intl, type);

  const { data, loading, error } = useQuery(
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

  const details = data?.backgroundCheckEntityDetails as BackgroundCheckProfileDetails_Selection;

  useInterval(
    () => {
      if (!window.opener) {
        window.close();
      }
    },
    1000,
    [],
  );

  useEffect(() => {
    window.opener?.postMessage(
      {
        event: "update-info",
        token,
      },
      window.origin,
    );
  }, [entityId]);

  useWindowEvent(
    "message",
    (e) => {
      if (e.data.event === "info-updated") {
        setSavedEntityIds(e.data.entityIds);
      }
    },
    [entityId],
  );

  const [updateBackgroundCheckEntity] = useMutation(
    BackgroundCheckProfileDetails_updateBackgroundCheckEntityDocument,
  );

  const showPetitionFieldBackgroundCheckReplaceReplyDialog =
    usePreviewPetitionFieldBackgroundCheckReplaceReplyDialog();

  const handleSaveClick = async () => {
    setIsSavingProfile(true);
    try {
      if (savedEntityIds.length && !isSaved) {
        await showPetitionFieldBackgroundCheckReplaceReplyDialog();
      }
      await updateBackgroundCheckEntity({
        variables: {
          token,
          entityId,
        },
      });
      setSavedEntityIds((curr) => [...curr, entityId]);
      window.opener?.postMessage("refresh");
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
      setSavedEntityIds((curr) => curr.filter((id) => id !== entityId));
      window.opener?.postMessage("refresh");
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
                {[entityTypeLabel, name, date, countryName].filter(isNonNullish).join(" | ")}
              </Text>
            </Box>
          </HStack>

          {loading || !details ? (
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
            {details.type === "Company" ? (
              <BackgroundCheckEntityDetailsCompanyBasic
                hasReply={isSaved}
                isReadOnly={isReadOnly || isTemplate}
                isDeleting={isDeletingReply}
                isSaving={isSavingProfile}
                onDelete={handleDeleteClick}
                onDownloadPDF={handleDownloadPDFClick}
                onSave={handleSaveClick}
                data={details}
              />
            ) : details.type === "Person" ? (
              <BackgroundCheckEntityDetailsPersonBasic
                hasReply={isSaved}
                isReadOnly={isReadOnly || isTemplate}
                isDeleting={isDeletingReply}
                isSaving={isSavingProfile}
                onDelete={handleDeleteClick}
                onDownloadPDF={handleDownloadPDFClick}
                onSave={handleSaveClick}
                data={details}
              />
            ) : null}

            {details.type === "Company" ? (
              <BackgroundCheckEntityDetailsCompanyOverview overview={details} />
            ) : details.type === "Person" ? (
              <BackgroundCheckEntityDetailsPersonOverview overview={details} />
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
          </>
        )}
      </Stack>
    </>
  );
}

const _fragments = {
  get PetitionField() {
    return gql`
      fragment BackgroundCheckProfileDetails_PetitionField on PetitionField {
        id
        type
        replies {
          id
          content
        }
      }
    `;
  },
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
};

const _queries = [
  gql`
    query BackgroundCheckProfileDetails_petitionField($petitionId: GID!, $petitionFieldId: GID!) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        ...BackgroundCheckProfileDetails_PetitionField
      }
    }
    ${_fragments.PetitionField}
  `,

  gql`
    query BackgroundCheckProfileDetails_backgroundCheckEntityDetails(
      $token: String!
      $entityId: String!
    ) {
      backgroundCheckEntityDetails(token: $token, entityId: $entityId) {
        id
        type
        name
        ... on BackgroundCheckEntityDetailsPerson {
          ...BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsPerson
        }
        ... on BackgroundCheckEntityDetailsCompany {
          ...BackgroundCheckProfileDetails_BackgroundCheckEntityDetailsCompany
        }
        createdAt
      }
    }
    ${_fragments.BackgroundCheckEntityDetailsPerson}
    ${_fragments.BackgroundCheckEntityDetailsCompany}
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
];

BackgroundCheckProfileDetails.getInitialProps = async ({ query }: WithApolloDataContext) => {
  const entityId = query.entityId as string;
  const token = query.token as string;
  const name = query.name as string;
  const date = query.date as string | null;
  const type = query.type as BackgroundCheckEntitySearchType | null;
  const country = query.country as string | null;

  return { entityId, token, name, date, type, country };
};

export default compose(
  withDialogs,
  withFeatureFlag("BACKGROUND_CHECK"),
  withApolloData,
)(BackgroundCheckProfileDetails);
