import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from "@chakra-ui/react";
import { RepeatIcon, SaveIcon, SparklesIcon, UserIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AdverseMediaArticleCard } from "@parallel/components/petition-preview/fields/adverse-media-search/AdverseMediaArticleCard";
import { AdverseMediaSearchInput } from "@parallel/components/petition-preview/fields/adverse-media-search/AdverseMediaSearchInput";
import {
  AdverseMediaArticleRelevance,
  AdverseMediaSearch_adverseMediaAlternativeSearchSuggestionsDocument,
  AdverseMediaSearch_adverseMediaArticleSearchDocument,
  AdverseMediaSearch_classifyAdverseMediaArticleDocument,
  AdverseMediaSearch_saveAdverseMediaChangesDocument,
  AdverseMediaSearchTermInput,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { UnwrapPromise } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useWindowEvent } from "@parallel/utils/useWindowEvent";
import { isAfter } from "date-fns";
import Head from "next/head";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, omit, omitBy, uniqueBy } from "remeda";

type AdverseMediaSearchProps = UnwrapPromise<ReturnType<typeof AdverseMediaSearch.getInitialProps>>;

const SEARCH_DEBOUNCE_MS = 800;

interface AdverseMediaSearchData {
  search: AdverseMediaSearchTermInput[];
}

function AdverseMediaSearch({
  token,
  articleId,
  defaultTabIndex,
  savedSearch,
  autoCompleteSearch,
  isReadOnly,
  isTemplate,
  hasReply,
}: AdverseMediaSearchProps) {
  const intl = useIntl();

  const startTimestamp = useRef(Date.now());
  const [isSearching, setIsSearching] = useState(false);
  const lastSearchRef = useRef<string | null>(null);

  const showGenericError = useGenericErrorToast();
  const toast = useToast();

  const {
    data: _data,
    loading: queryLoading,
    refetch,
  } = useAssertQuery(AdverseMediaSearch_adverseMediaArticleSearchDocument, {
    variables: {
      token,
      search: !hasReply && autoCompleteSearch.length ? autoCompleteSearch : null,
    },
  });

  const isProfile = "profileId" in JSON.parse(atob(token));

  const loading = queryLoading || isSearching;

  const [isDraft, setIsDraft] = useState(_data?.adverseMediaArticleSearch?.isDraft);

  const articles = _data?.adverseMediaArticleSearch?.articles.items ?? [];
  const search = (_data?.adverseMediaArticleSearch?.search ?? []).map((item) =>
    omitBy(item, (value, key) => isNullish(value) || key === "__typename"),
  );
  const createdAt = _data?.adverseMediaArticleSearch?.articles.createdAt ?? null;

  const savedArticles = useMemo(() => {
    return articles.filter((article) => article.classification === "RELEVANT");
  }, [articles]);

  const dismissedArticles = useMemo(() => {
    return articles.filter((article) => article.classification === "DISMISSED");
  }, [articles]);

  const nonRelevantArticles = useMemo(() => {
    return articles.filter((article) => article.classification === "IRRELEVANT");
  }, [articles]);

  const [activeTab, setActiveTab] = useState(defaultTabIndex ?? 0);

  useWindowEvent(
    "message",
    async (e) => {
      if (e.data.event === "info-updated") {
        await refetch();
      }
    },
    [],
  );

  const form = useForm<AdverseMediaSearchData>({
    defaultValues: {
      search: savedSearch?.length ? savedSearch : search,
    },
    mode: "onChange",
  });

  const performSearch = useCallback(
    async (searchData: AdverseMediaSearchTermInput[]) => {
      if (isNonNullish(searchData) && searchData.length > 0) {
        const searchId = Date.now().toString();
        lastSearchRef.current = searchId;

        setIsSearching(true);
        try {
          const { data: refetchData } = await refetch({
            search: searchData,
          } as any);
          if (lastSearchRef.current === searchId) {
            setIsDraft(refetchData?.adverseMediaArticleSearch?.isDraft);
          }
        } catch (error: unknown) {
          await showGenericError(error);
        } finally {
          if (lastSearchRef.current === searchId) {
            setIsSearching(false);
          }
        }
      }
    },
    [refetch, setIsSearching, setIsDraft, showGenericError],
  );

  const debouncedSearch = useDebouncedCallback(performSearch, SEARCH_DEBOUNCE_MS, []);

  const onSubmit = form.handleSubmit(async (data) => {
    if (isNonNullish(data.search) && data.search.length > 0) {
      debouncedSearch(data.search);
    }
  });

  const [classifyAdverseMediaArticle] = useMutation(
    AdverseMediaSearch_classifyAdverseMediaArticleDocument,
  );

  const handleClassifyArticle = useCallback(
    async (id: string, classification: AdverseMediaArticleRelevance) => {
      try {
        await classifyAdverseMediaArticle({ variables: { id, token, classification } });
        window.opener?.postMessage("refresh");
        setIsDraft(true);
      } catch (error) {
        await showGenericError(error);
      }
    },
    [classifyAdverseMediaArticle, token],
  );

  const [saveAdverseMediaChanges] = useMutation(AdverseMediaSearch_saveAdverseMediaChangesDocument);

  const handleSaveAdverseMediaChanges = async () => {
    try {
      const { data } = await saveAdverseMediaChanges({ variables: { token } });
      window.opener?.postMessage("refresh");
      setIsDraft(data?.saveAdverseMediaChanges?.isDraft);
      toast({
        title: intl.formatMessage({
          id: "page.adverse-media-search.search-saved",
          defaultMessage: "Search saved",
        }),
        description: intl.formatMessage({
          id: "page.adverse-media-search.search-saved-description",
          defaultMessage: "Your search has been saved to your profile",
        }),
        status: "success",
      });
    } catch (error) {
      await showGenericError(error);
    }
  };

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  return (
    <>
      <Head>
        <title>
          {
            // eslint-disable-next-line formatjs/no-literal-string-in-jsx
            `${intl.formatMessage({
              id: "generic.petition-field-type-adverse-media-search",
              defaultMessage: "Adverse media search",
            })} | Parallel`
          }
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Stack
        paddingX={6}
        paddingY={5}
        spacing={6}
        height="100vh"
        minHeight="0"
        overflow="hidden"
        backgroundColor="gray.50"
      >
        <Flex flexDirection={{ base: "column", md: "row" }} justifyContent="space-between">
          <Heading size="lg">
            <FormattedMessage
              id="generic.petition-field-type-adverse-media-search"
              defaultMessage="Adverse media search"
            />
          </Heading>
          <HStack spacing={4}>
            {createdAt && (
              <Text>
                {intl.formatMessage(
                  {
                    id: "generic.results-for",
                    defaultMessage: "Results for {date}",
                  },
                  {
                    date: intl.formatDate(createdAt, FORMATS.FULL),
                  },
                )}
              </Text>
            )}
          </HStack>
        </Flex>
        <FormProvider {...form}>
          <Tabs
            index={activeTab}
            onChange={(index) => {
              setActiveTab(index);
            }}
            {...extendFlexColumn}
            gap={4}
            variant="unstyled"
          >
            <HStack spacing={0} overflowX="auto" overflowY="hidden" alignItems="flex-end">
              <TabList position="relative" borderBottom="1px solid" borderColor="gray.200" flex="1">
                <ArticleTab>
                  <FormattedMessage id="page.adverse-media-search.search" defaultMessage="Search" />
                </ArticleTab>
                <ArticleTab>
                  {`${intl.formatMessage({
                    id: "page.adverse-media-search.relevant-articles",
                    defaultMessage: "Relevant articles",
                  })} ${savedArticles?.length ? `(${savedArticles?.length})` : ""}`}
                </ArticleTab>
                <ArticleTab>
                  {`${intl.formatMessage({
                    id: "page.adverse-media-search.non-relevant-articles",
                    defaultMessage: "Non-relevant articles",
                  })} ${nonRelevantArticles?.length ? `(${nonRelevantArticles?.length})` : ""}`}
                </ArticleTab>
                <ArticleTab>
                  {`${intl.formatMessage({
                    id: "page.adverse-media-search.dismissed-articles",
                    defaultMessage: "Dismissed articles",
                  })} ${dismissedArticles?.length ? `(${dismissedArticles?.length})` : ""}`}
                </ArticleTab>
                <TabIndicator
                  mt="-1.5px"
                  height="2px"
                  bg="blue.500"
                  borderRadius="1px"
                  bottom={0}
                />
              </TabList>
              {isProfile ? (
                <ResponsiveButtonIcon
                  colorScheme="purple"
                  isDisabled={!isDraft}
                  icon={<SaveIcon boxSize={5} />}
                  onClick={handleSaveAdverseMediaChanges}
                  label={intl.formatMessage({
                    id: "page.adverse-media-search.save-search",
                    defaultMessage: "Save to profile",
                  })}
                  breakpoint="lg"
                />
              ) : null}
            </HStack>

            <SearchInputWithSuggestions
              onSubmit={onSubmit}
              isReadOnly={isReadOnly}
              defaultSuggestions={autoCompleteSearch}
              isLoading={isSearching}
              token={token}
            />

            <TabPanels {...extendFlexColumn}>
              <TabPanel {...extendFlexColumn} padding={0}>
                <AdverseMediaArticleCard
                  token={token}
                  articles={articles.filter(
                    (article) =>
                      article.classification === null ||
                      (article.classifiedAt &&
                        isAfter(article.classifiedAt, startTimestamp.current)),
                  )}
                  onClassifyArticle={handleClassifyArticle}
                  search={search}
                  isLoadingList={loading}
                  includeQuotes={true}
                  isReadOnly={isReadOnly || isTemplate}
                  isSelected={activeTab === 0}
                />
              </TabPanel>
              <TabPanel {...extendFlexColumn} padding={0}>
                <AdverseMediaArticleCard
                  token={token}
                  articles={savedArticles}
                  onClassifyArticle={handleClassifyArticle}
                  search={search}
                  isLoadingList={loading}
                  defaultArticleId={articleId}
                  isReadOnly={isReadOnly || isTemplate}
                  isSelected={activeTab === 1}
                />
              </TabPanel>
              <TabPanel {...extendFlexColumn} padding={0}>
                <AdverseMediaArticleCard
                  token={token}
                  articles={nonRelevantArticles}
                  onClassifyArticle={handleClassifyArticle}
                  search={search}
                  isLoadingList={loading}
                  isReadOnly={isReadOnly || isTemplate}
                  isSelected={activeTab === 2}
                />
              </TabPanel>
              <TabPanel {...extendFlexColumn} padding={0}>
                <AdverseMediaArticleCard
                  token={token}
                  articles={dismissedArticles}
                  onClassifyArticle={handleClassifyArticle}
                  search={search}
                  isLoadingList={loading}
                  isReadOnly={isReadOnly || isTemplate}
                  isSelected={activeTab === 3}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </FormProvider>
      </Stack>
    </>
  );
}

function ArticleTab({ children }: { children: ReactNode }) {
  const selectTabStyles = {
    color: "blue.600",
  };
  return <Tab _selected={selectTabStyles}>{children}</Tab>;
}

function SearchInputWithSuggestions({
  onSubmit,
  isReadOnly,
  defaultSuggestions,
  isLoading,
  token,
}: {
  onSubmit: () => void;
  isReadOnly: boolean;
  isLoading: boolean;
  defaultSuggestions: AdverseMediaSearchTermInput[];
  token: string;
}) {
  const intl = useIntl();
  const { control } = useFormContext<AdverseMediaSearchData>();

  const [suggestions, setSuggestions] = useState<AdverseMediaSearchTermInput[]>(defaultSuggestions);

  const search = defaultSuggestions.filter((s) => s.term);

  const { data: alternativeSearchSuggestions, loading: loadingSuggestions } = useQuery(
    AdverseMediaSearch_adverseMediaAlternativeSearchSuggestionsDocument,
    {
      variables: {
        token,
        search: search[0]?.term ?? "",
      },
      skip: isNullish(search[0]?.term),
    },
  );

  useEffect(() => {
    if (!loadingSuggestions) {
      setSuggestions(
        uniqueBy(
          [
            ...defaultSuggestions,
            ...(alternativeSearchSuggestions?.adverseMediaAlternativeSearchSuggestions ?? []),
          ],
          (s) => s.term || s.wikiDataId || s.entityId,
        ),
      );
    }
  }, [alternativeSearchSuggestions, loadingSuggestions]);

  return (
    <Controller
      control={control}
      name="search"
      render={({ field: { onChange, value, ref } }) => {
        const filteredSuggestions = suggestions.filter(
          (suggestion) =>
            !value.some(
              (v) =>
                (v.entityId && v.entityId === suggestion.entityId) ||
                (v.term && v.term === suggestion.term) ||
                (v.wikiDataId && v.wikiDataId === suggestion.wikiDataId),
            ),
        );
        return (
          <Flex gap={{ base: 3, lg: 4 }} flexDirection={{ base: "column", lg: "row" }}>
            <HStack maxWidth={{ base: "100%", lg: "720px" }} width="100%">
              <Box width="100%">
                <AdverseMediaSearchInput
                  ref={ref}
                  value={value.map((v) => ({
                    label: v.label ?? v.term ?? "",
                    value: v.term || v.entityId || v.wikiDataId || "",
                    _search: {
                      entityId: v.entityId,
                      term: v.term,
                      wikiDataId: v.wikiDataId,
                      label: v.label,
                    },
                  }))}
                  onChange={(newValue) => {
                    const newValues = newValue.map((v) => ({
                      term: v._search.term,
                      entityId: v._search.entityId,
                      wikiDataId: v._search.wikiDataId,
                      label: v._search.label,
                    }));
                    onChange(newValues);
                    if (newValues.length !== value.length) {
                      onSubmit();
                    }
                  }}
                  isDisabled={isReadOnly}
                />
              </Box>
              <IconButtonWithTooltip
                variant="outline"
                backgroundColor="white"
                icon={<RepeatIcon />}
                label={intl.formatMessage({
                  id: "page.adverse-media-search.refresh-search",
                  defaultMessage: "Refresh search",
                })}
                onClick={onSubmit}
                isDisabled={isReadOnly || isLoading}
              />
            </HStack>
            {filteredSuggestions.length > 0 ? (
              <HStack flexWrap="wrap" gap={2} spacing={0}>
                <SparklesIcon color="purple.400" boxSize={6} />
                {filteredSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    leftIcon={suggestion.wikiDataId ? <UserIcon boxSize={4} /> : undefined}
                    variant="outline"
                    colorScheme="purple"
                    borderRadius="full"
                    size="xs"
                    fontWeight={400}
                    fontSize="sm"
                    onClick={() => {
                      onChange([
                        ...value,
                        {
                          term: suggestion.term,
                          label: suggestion.label,
                          entityId: suggestion.entityId,
                          wikiDataId: suggestion.wikiDataId,
                        },
                      ]);
                      onSubmit();
                    }}
                    isDisabled={isReadOnly}
                  >
                    {suggestion.label}
                  </Button>
                ))}
              </HStack>
            ) : null}
          </Flex>
        );
      }}
    />
  );
}

const _fragments = {
  get AdverseMediaArticle() {
    return gql`
      fragment AdverseMediaSearch_AdverseMediaArticle on AdverseMediaArticle {
        id
        classification
        classifiedAt
        ...AdverseMediaArticleCard_AdverseMediaArticleListItem
      }
      ${AdverseMediaArticleCard.fragments.AdverseMediaArticleListItem}
    `;
  },
};

const _queries = [
  gql`
    query AdverseMediaSearch_adverseMediaArticleSearch(
      $search: [AdverseMediaSearchTermInput!]
      $token: String!
    ) {
      adverseMediaArticleSearch(search: $search, token: $token) {
        isDraft
        articles {
          totalCount
          createdAt
          items {
            id
            ...AdverseMediaSearch_AdverseMediaArticle
          }
        }
        search {
          entityId
          label
          term
          wikiDataId
        }
      }
    }
    ${_fragments.AdverseMediaArticle}
  `,
  gql`
    query AdverseMediaSearch_adverseMediaAlternativeSearchSuggestions(
      $token: String!
      $search: String!
    ) {
      adverseMediaAlternativeSearchSuggestions(token: $token, search: $search) {
        term
        wikiDataId
        entityId
        label
      }
    }
  `,
];

const _mutations = [
  gql`
    mutation AdverseMediaSearch_classifyAdverseMediaArticle(
      $id: String!
      $token: String!
      $classification: AdverseMediaArticleRelevance
    ) {
      classifyAdverseMediaArticle(id: $id, token: $token, classification: $classification) {
        id
        classification
        classifiedAt
      }
    }
  `,
  gql`
    mutation AdverseMediaSearch_saveAdverseMediaChanges($token: String!) {
      saveAdverseMediaChanges(token: $token) {
        isDraft
        articles {
          totalCount
          createdAt
          items {
            id
            ...AdverseMediaSearch_AdverseMediaArticle
          }
        }
        search {
          entityId
          label
          term
          wikiDataId
        }
      }
    }
  `,
];

AdverseMediaSearch.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const token = query.token as string;

  const decodedEntity = query.entity ? JSON.parse(atob(query.entity as string)) : null;

  const autoCompleteSearch = [
    decodedEntity
      ? {
          label: decodedEntity.name,
          wikiDataId: decodedEntity.id,
        }
      : null,
    query.name
      ? {
          label: query.name as string,
          term: query.name as string,
        }
      : null,
  ].filter(isNonNullish);

  const { data } = await fetchQuery(AdverseMediaSearch_adverseMediaArticleSearchDocument, {
    variables: {
      token,
      search: isNullish(query.hasReply) && autoCompleteSearch.length ? autoCompleteSearch : null,
    },
  });
  const search = data?.adverseMediaArticleSearch?.search ?? [];

  return {
    token,
    articleId: query.articleId as string,
    defaultTabIndex: query.defaultTabIndex ? parseInt(query.defaultTabIndex as string) : undefined,
    savedSearch: search.map((item) => omit(item, ["__typename"])),
    autoCompleteSearch,
    hasReply: query.hasReply === "true",
    isReadOnly: query.readonly === "true",
    isTemplate: query.template === "true",
  };
};

export default compose(
  withDialogs,
  withFeatureFlag("ADVERSE_MEDIA_SEARCH"),
  withApolloData,
)(AdverseMediaSearch);
