import { gql } from "@apollo/client";
import { Center, Grid, Spinner, Stack, Text, useBreakpointValue } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import {
  BookOpenIcon,
  ForbiddenIcon,
  SearchIcon,
  ShortSearchIcon,
  StarIcon,
  UserXIcon,
} from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Divider } from "@parallel/components/common/Divider";
import { AdverseMediaArticleDetails } from "@parallel/components/petition-preview/fields/adverse-media-search/AdverseMediaArticleDetails";
import { AdverseMediaArticleHeader } from "@parallel/components/petition-preview/fields/adverse-media-search/AdverseMediaArticleHeader";
import {
  AdverseMediaArticleCard_adverseMediaArticleDetailsDocument,
  AdverseMediaArticleCard_AdverseMediaArticleFragment,
  AdverseMediaArticleRelevance,
  AdverseMediaSearchTermInput,
} from "@parallel/graphql/__types";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { FORMATS } from "@parallel/utils/dates";
import React, { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";

export function AdverseMediaArticleCard({
  token,
  articles = [],
  onClassifyArticle,
  search,
  isLoadingList,
  includeQuotes = false,
  defaultArticleId,
  isReadOnly,
  isSelected,
}: {
  token: string;
  articles?: AdverseMediaArticleCard_AdverseMediaArticleFragment[];
  onClassifyArticle: (id: string, classification: AdverseMediaArticleRelevance) => void;
  search: AdverseMediaSearchTermInput[];
  isLoadingList: boolean;
  includeQuotes?: boolean;
  defaultArticleId?: string;
  isReadOnly: boolean;
  isSelected: boolean;
}) {
  const intl = useIntl();

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    defaultArticleId ?? articles?.[0]?.id ?? null,
  );

  useEffect(() => {
    if (defaultArticleId) {
      setSelectedArticleId(defaultArticleId);
    }
  }, [defaultArticleId]);

  useEffect(() => {
    if (articles.some((article) => article.id === selectedArticleId)) return;
    setSelectedArticleId(articles?.[0]?.id ?? null);
  }, [articles, selectedArticleId]);

  const selectedArticle = articles.find((article) => article.id === selectedArticleId);

  const [showArticleDetail, setShowArticleDetail] = useState(true);

  const { data, loading: loadingDetails } = useQueryOrPreviousData(
    AdverseMediaArticleCard_adverseMediaArticleDetailsDocument,
    {
      variables: {
        articleId: selectedArticleId ?? "",
        token,
        search: includeQuotes && search.length > 0 ? search : null,
        includeQuotes: includeQuotes && search.length > 0 ? true : false,
      },
      skip: isNullish(selectedArticleId) || !isSelected || isLoadingList,
    },
  );

  const isMobile = useBreakpointValue({ base: true, lg: false });

  const handleArticleSelect = (articleId: string) => {
    setSelectedArticleId(articleId);
    if (isMobile) {
      setShowArticleDetail(true);
    }
  };

  const handleBackToList = () => {
    setShowArticleDetail(false);
  };

  const handleClassifyArticle = (id: string, classification: AdverseMediaArticleRelevance) => {
    onClassifyArticle(id, classification);
  };

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  return (
    <Card {...extendFlexColumn}>
      <Grid
        templateColumns={{
          base: "minmax(0,1fr)",
          lg: "minmax(0,360px) minmax(0,1fr)",
          xl: "minmax(0,500px) minmax(0,1fr)",
        }}
        overflow="hidden"
        flex="1"
      >
        <Stack
          maxWidth={{ base: "100%", lg: "500px" }}
          borderEnd="1px solid"
          borderColor="gray.200"
          overflow="auto"
          spacing={0}
          display={isMobile && showArticleDetail ? "none" : "flex"}
        >
          {articles.length > 0 && !isLoadingList ? (
            articles.map((article) => {
              const timestamp = article.timestamp
                ? intl.formatDate(new Date(article.timestamp * 1000), FORMATS["L+LT"])
                : undefined;
              const source = article.source;
              return (
                <React.Fragment key={article.id}>
                  <Stack
                    id={`article-${article.id}`}
                    paddingY={4}
                    paddingX={6}
                    onClick={() => handleArticleSelect(article.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleArticleSelect(article.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-selected={selectedArticleId === article.id}
                    cursor="pointer"
                    _hover={{ backgroundColor: "gray.50" }}
                    backgroundColor={selectedArticleId === article.id ? "gray.100" : undefined}
                    position="relative"
                  >
                    {isNonNullish(article.classification) ? (
                      <Tooltip
                        label={
                          article.classification === "RELEVANT"
                            ? intl.formatMessage({
                                id: "component.adverse-media-article-header.saved-as-relevant",
                                defaultMessage: "Saved as relevant",
                              })
                            : article.classification === "IRRELEVANT"
                              ? intl.formatMessage({
                                  id: "component.adverse-media-article-header.saved-as-not-relevant",
                                  defaultMessage: "Non-relevant article",
                                })
                              : intl.formatMessage({
                                  id: "component.adverse-media-article-header.saved-as-not-the-person",
                                  defaultMessage: "Not the person",
                                })
                        }
                      >
                        {article.classification === "RELEVANT" ? (
                          <StarIcon
                            boxSize={4}
                            position="absolute"
                            top={4}
                            insetEnd={6}
                            sx={{ color: "primary.500", path: { fill: "primary.500" } }}
                          />
                        ) : article.classification === "IRRELEVANT" ? (
                          <ForbiddenIcon boxSize={4} position="absolute" top={4} insetEnd={6} />
                        ) : article.classification === "DISMISSED" ? (
                          <UserXIcon boxSize={4} position="absolute" top={4} insetEnd={6} />
                        ) : null}
                      </Tooltip>
                    ) : null}

                    <Text as="span" whiteSpace="break-spaces" paddingEnd={4}>
                      {[timestamp, source].filter(isNonNullish).join(" | ")}
                    </Text>
                    <Text
                      whiteSpace="break-spaces"
                      fontSize="xl"
                      dangerouslySetInnerHTML={{ __html: article.header ?? "" }}
                      sx={{
                        match: {
                          backgroundColor: "yellow.100",
                          fontWeight: 500,
                          paddingX: 1,
                        },
                      }}
                    />
                  </Stack>
                  <Divider />
                </React.Fragment>
              );
            })
          ) : isLoadingList ? (
            <Center flex="1" flexDirection="column" alignItems="center" gap={1} padding={6}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="primary.500"
                size="xl"
                marginBottom={4}
              />
              {isNonNullish(search) && search.length > 0 ? (
                <Text textStyle="hint" textAlign="center" as="span" verticalAlign="middle">
                  <SearchIcon boxSize={4} color="gray.400" marginEnd={2} marginBottom={1} />
                  <FormattedMessage
                    id="page.adverse-media-search.loading-articles"
                    defaultMessage="Searching for matches across more than 235,000 news sources for: <b>{search}</b>..."
                    values={{
                      search: search.map((s) => s.label || s.term).join(", "),
                    }}
                  />
                </Text>
              ) : null}
              <Text textStyle="hint" textAlign="center">
                <FormattedMessage
                  id="page.adverse-media-search.loading-articles-take-a-seat"
                  defaultMessage="This may take a few seconds."
                />
              </Text>
              <Text textStyle="hint" textAlign="center" fontWeight="bold">
                <FormattedMessage
                  id="page.adverse-media-search.loading-articles-take-a-seat-please-do-not-close-or-reload-the-page"
                  defaultMessage="Please do not close or reload the page."
                />
              </Text>
            </Center>
          ) : (
            <Center flex="1">
              <Stack alignItems="center" spacing={4}>
                <ShortSearchIcon boxSize={20} color="gray.400" />
                <Text textStyle="hint" fontSize="lg">
                  <FormattedMessage
                    id="page.adverse-media-search.no-articles-found"
                    defaultMessage="No articles found"
                  />
                </Text>
              </Stack>
            </Center>
          )}
        </Stack>
        <Stack
          {...extendFlexColumn}
          spacing={0}
          display={isMobile && !showArticleDetail ? "none" : "flex"}
        >
          {isNullish(selectedArticleId) ? (
            <Center flex="1" padding={6}>
              <Stack alignItems="center" spacing={4}>
                <BookOpenIcon boxSize={20} color="gray.400" />
                <Text textStyle="hint" fontSize="lg">
                  <FormattedMessage
                    id="page.adverse-media-search.no-article-selected"
                    defaultMessage="No article selected"
                  />
                </Text>
              </Stack>
            </Center>
          ) : loadingDetails ? (
            <Center flex="1">
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="primary.500"
                size="xl"
              />
            </Center>
          ) : isNonNullish(data?.adverseMediaArticleDetails) ? (
            <>
              <AdverseMediaArticleHeader
                article={{
                  id: data.adverseMediaArticleDetails.id,
                  header: data.adverseMediaArticleDetails.header,
                  classification: selectedArticle?.classification ?? null,
                }}
                onClassifyArticle={(classification) =>
                  handleClassifyArticle(data.adverseMediaArticleDetails.id, classification)
                }
                onBackToList={isMobile ? handleBackToList : undefined}
                isReadOnly={isReadOnly}
              />
              <Stack {...extendFlexColumn} overflow="auto" paddingX={6} paddingY={2}>
                <AdverseMediaArticleDetails article={data?.adverseMediaArticleDetails} />
              </Stack>
            </>
          ) : (
            <Center flex="1" padding={6}>
              <Stack alignItems="center" spacing={4}>
                <ShortSearchIcon boxSize={20} color="gray.400" />
                <Text textStyle="hint" fontSize="lg">
                  <FormattedMessage
                    id="page.adverse-media-search.article-not-found"
                    defaultMessage="Article not found"
                  />
                </Text>
              </Stack>
            </Center>
          )}
        </Stack>
      </Grid>
    </Card>
  );
}

const _fragments = {
  AdverseMediaArticleListItem: gql`
    fragment AdverseMediaArticleCard_AdverseMediaArticleListItem on AdverseMediaArticle {
      id
      header
      source
      timestamp
      classification
    }
  `,
  AdverseMediaArticle: gql`
    fragment AdverseMediaArticleCard_AdverseMediaArticle on AdverseMediaArticle {
      id
      header
      source
      timestamp
      classification
      ...AdverseMediaArticleDetails_AdverseMediaArticle
      ...AdverseMediaArticleHeader_AdverseMediaArticle
    }
  `,
};

const _queries = [
  gql`
    query AdverseMediaArticleCard_adverseMediaArticleDetails(
      $articleId: String!
      $token: String!
      $search: [AdverseMediaSearchTermInput!]
      $includeQuotes: Boolean!
    ) {
      adverseMediaArticleDetails(id: $articleId, search: $search, token: $token) {
        id
        ...AdverseMediaArticleCard_AdverseMediaArticle
      }
    }
  `,
];
