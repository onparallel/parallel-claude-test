import { gql, useQuery } from "@apollo/client";
import {
  Button,
  Container,
  Flex,
  Grid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { TemplateDetailsModal } from "@parallel/components/petition-common/dialogs/TemplateDetailsModal";
import { useNewTemplateDialog } from "@parallel/components/petition-new/dialogs/NewTemplateDialog";
import { GridInfiniteScrollList } from "@parallel/components/petition-new/GridInfiniteScrollList";
import { NewPetitionCategoryFilter } from "@parallel/components/petition-new/NewPetitionCategoryFilter";
import { NewPetitionCategoryMenuFilter } from "@parallel/components/petition-new/NewPetitionCategoryMenuFilter";
import { NewPetitionEmptySearch } from "@parallel/components/petition-new/NewPetitionEmptySearch";
import { NewPetitionEmptyTemplates } from "@parallel/components/petition-new/NewPetitionEmptyTemplates";
import { NewPetitionLanguageFilter } from "@parallel/components/petition-new/NewPetitionLanguageFilter";
import {
  NewPetitionSharedFilter,
  NewPetitionSharedFilterValues,
} from "@parallel/components/petition-new/NewPetitionSharedFilter";
import { PublicTemplateCard } from "@parallel/components/petition-new/PublicTemplateCard";
import { TemplateCard } from "@parallel/components/petition-new/TemplateCard";
import {
  NewPetition_templateDocument,
  NewPetition_templatesDocument,
  NewPetition_userDocument,
  PetitionLocale,
} from "@parallel/graphql/__types";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { boolean, parseQuery, string, useQueryState, values } from "@parallel/utils/queryState";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";

const QUERY_STATE = {
  search: string(),
  lang: values<PetitionLocale | "ALL">(["en", "es", "ALL"]),
  public: boolean().orDefault(false),
  owner: boolean(),
  category: string(),
  template: string(),
};

const PAGE_SIZE = 18;

function NewPetition() {
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const mainRef = useRef<HTMLDivElement>(null);

  const {
    data: { me, realMe, hasTemplates: _hasTemplates, publicTemplateCategories },
  } = useAssertQuery(NewPetition_userDocument);

  const { data: templateData } = useQuery(NewPetition_templateDocument, {
    variables: { templateId: state.template! },
    skip: !state.template,
    fetchPolicy: "cache-and-network",
  });

  let locale: PetitionLocale | null = null;
  if (state.lang === "ALL") {
    locale = null;
  } else if (state.public && state.lang === null) {
    locale = intl.locale as PetitionLocale;
  } else {
    locale = state.lang;
  }

  const {
    data: {
      templates: { items: templates, totalCount },
    },
    fetchMore,
    refetch,
  } = useAssertQueryOrPreviousData(NewPetition_templatesDocument, {
    variables: {
      offset: 0,
      limit: PAGE_SIZE,
      search: state.search,
      isPublic: state.public,
      locale: locale,
      isOwner: state.owner,
      category: state.category,
    },
  });
  const hasMore = templates.length < totalCount;
  const hasTemplates = _hasTemplates.totalCount > 0;

  const [search, setSearch] = useState(state.search ?? "");

  const debouncedSearch = useDebouncedCallback(
    (search: string) => {
      mainRef.current!.scrollTo(0, 0);
      setQueryState((current) => ({ ...current, search: search || null }));
    },
    300,
    [refetch]
  );

  const handleSearchChange = (search: string) => {
    mainRef.current!.scrollTo(0, 0);
    setSearch(search);
    debouncedSearch(search);
  };

  const handleLocaleChange = (lang: Maybe<PetitionLocale>) => {
    mainRef.current!.scrollTo(0, 0);
    setQueryState((state) => ({ ...state, lang: state.public && lang === null ? "ALL" : lang }));
  };

  const handleSharedFilterChange = (shared: Maybe<NewPetitionSharedFilterValues>) => {
    setQueryState((state) => ({
      ...state,
      owner: shared === "IS_OWNER" ? true : shared === "NOT_IS_OWNER" ? false : null,
    }));
  };

  const handleCategoryChange = (category: Maybe<string>) => {
    mainRef.current!.scrollTo(0, 0);
    setQueryState((state) => ({ ...state, category }));
  };

  const handleTabChange = (index: number) => {
    setSearch("");
    setQueryState(() => ({
      public: index === 1 ? true : false,
    }));
  };

  const handleLoadMore = useCallback(() => {
    fetchMore({ variables: { offset: templates.length, limit: PAGE_SIZE } });
  }, [fetchMore, templates]);

  const createPetition = useCreatePetition();
  const goToPetition = useGoToPetition();
  const handleTemplateClick = useCallback(
    (template: string) => {
      setQueryState((current) => ({ ...current, template }));
    },
    [setQueryState]
  );

  const handleCreateTemplate = useCallback(async () => {
    try {
      const id = await createPetition({ type: "TEMPLATE" });
      goToPetition(id, "compose", { query: { new: "true" } });
    } catch {}
  }, [goToPetition, createPetition]);

  useEffect(() => {
    if (!hasTemplates && !state.public) {
      handleTabChange(1);
    }
  }, []);

  const clonePetitions = useClonePetitions();
  const showNewTemplateDialog = useNewTemplateDialog();
  const handleCreateTemplateClick = async () => {
    try {
      const templateId = await showNewTemplateDialog({});
      if (!templateId) {
        handleCreateTemplate();
      } else {
        const petitionIds = await clonePetitions({
          petitionIds: [templateId],
          keepTitle: true,
        });
        goToPetition(petitionIds[0], "compose", { query: { new: "true" } });
      }
    } catch {}
  };

  const selectTabStyles = {
    color: "blue.600",
    fontWeight: "semibold",
    borderBottom: "2px solid",
    borderColor: "blue.600",
  };

  return (
    <AppLayout
      ref={mainRef}
      id="main-container"
      title={intl.formatMessage({
        id: "new-petition.title",
        defaultMessage: "New petition",
      })}
      me={me}
      realMe={realMe}
    >
      <Container maxWidth="container.xl" flex="1" display="flex" flexDirection="column">
        <Tabs
          index={state.public ? 1 : 0}
          onChange={handleTabChange}
          isLazy
          flex="1"
          display="flex"
          flexDirection="column"
        >
          <Stack
            direction="row"
            position="sticky"
            top={0}
            backgroundColor="gray.50"
            spacing={2}
            paddingTop={10}
            paddingX={6}
            paddingBottom={1}
            zIndex={1}
          >
            <TabList flex="1">
              <Tab
                data-link="my-templates"
                borderTopRadius="md"
                _selected={selectTabStyles}
                whiteSpace="nowrap"
                paddingX={3}
              >
                <FormattedMessage id="new-petition.my-templates" defaultMessage="My templates" />
              </Tab>
              <Tab
                data-link="public-templates"
                borderTopRadius="md"
                _selected={selectTabStyles}
                whiteSpace="nowrap"
                paddingX={3}
              >
                <FormattedMessage
                  id="new-petition.public-templates"
                  defaultMessage="Public templates"
                />
              </Tab>
            </TabList>
            <Button
              data-action="create-template"
              aria-label={intl.formatMessage({
                id: "new-petition.create",
                defaultMessage: "Create",
              })}
              padding={{ base: 0, md: 4 }}
              alignSelf="flex-end"
              colorScheme="primary"
              isDisabled={me.role === "COLLABORATOR"}
              onClick={handleCreateTemplateClick}
            >
              <Flex alignItems="center" justifyContent="center">
                <AddIcon fontSize={{ base: "16px", md: "12px" }} />
                <Flex alignItems="center" marginLeft={2} display={{ base: "none", md: "flex" }}>
                  <Text as="span">
                    <FormattedMessage id="new-petition.create" defaultMessage="Create" />
                  </Text>
                </Flex>
              </Flex>
            </Button>
          </Stack>
          <TabPanels flex="1" display="flex" flexDirection="column">
            <TabPanel padding={0} flex="1" display="flex" flexDirection="column">
              <Stack
                direction={{ base: "column", md: "row" }}
                spacing={2}
                paddingX={6}
                paddingY={{ base: 4, md: 6 }}
                position="sticky"
                backgroundColor="gray.50"
                top="86px"
                zIndex={1}
              >
                <SearchInput
                  value={search ?? ""}
                  onChange={(event) => handleSearchChange(event?.target.value)}
                  backgroundColor="white"
                  placeholder={intl.formatMessage({
                    id: "new-petition.search-placeholder",
                    defaultMessage: "What are you looking for?",
                  })}
                />
                <Stack direction={{ base: "column", md: "row" }}>
                  <NewPetitionSharedFilter
                    value={
                      state.owner === true
                        ? "IS_OWNER"
                        : state.owner === false
                        ? "NOT_IS_OWNER"
                        : null
                    }
                    onChange={handleSharedFilterChange}
                    backgroundColor="white"
                    flex="1 0 auto"
                  />
                  <NewPetitionLanguageFilter
                    value={locale}
                    onChange={handleLocaleChange}
                    backgroundColor="white"
                    flex="1 0 auto"
                  />
                </Stack>
              </Stack>
              {templates.length > 0 ? (
                <GridInfiniteScrollList
                  items={templates}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                >
                  {(template, i) => {
                    return (
                      <TemplateCard
                        data-template-id={template.id}
                        data-template-first={i === 0 ? "" : undefined}
                        key={template.id}
                        template={template}
                        onPress={() => handleTemplateClick(template.id)}
                      />
                    );
                  }}
                </GridInfiniteScrollList>
              ) : hasTemplates ? (
                <NewPetitionEmptySearch
                  flex="1"
                  marginBottom={16}
                  onClickNewTemplate={() => handleCreateTemplate()}
                  onClickPublicTemplates={() => handleTabChange(1)}
                />
              ) : (
                <NewPetitionEmptyTemplates
                  flex="1"
                  marginBottom={16}
                  onClickNewTemplate={() => handleCreateTemplate()}
                  onClickPublicTemplates={() => handleTabChange(1)}
                />
              )}
            </TabPanel>
            <TabPanel padding={0} flex="1" display="flex" flexDirection="column">
              <Grid
                gridTemplateColumns={{ base: "auto", md: "1fr auto" }}
                gridGap={2}
                paddingX={6}
                paddingY={{ base: 4, md: 6 }}
                position="sticky"
                backgroundColor="gray.50"
                top="86px"
                zIndex={1}
              >
                <SearchInput
                  value={search ?? ""}
                  onChange={(event) => handleSearchChange(event?.target.value)}
                  backgroundColor="white"
                  placeholder={intl.formatMessage({
                    id: "new-petition.search-placeholder",
                    defaultMessage: "What are you looking for?",
                  })}
                  gridColumn="1"
                />
                <NewPetitionLanguageFilter
                  value={locale}
                  onChange={handleLocaleChange}
                  backgroundColor="white"
                  flex="1 0 auto"
                />
                <NewPetitionCategoryFilter
                  value={state.category}
                  onChange={handleCategoryChange}
                  categories={publicTemplateCategories}
                  display={{ base: "none", md: "flex" }}
                  gridColumn="1 / 3"
                />
                <NewPetitionCategoryMenuFilter
                  value={state.category}
                  onChange={handleCategoryChange}
                  categories={publicTemplateCategories}
                  backgroundColor="white"
                  display={{ base: "flex", md: "none" }}
                />
              </Grid>
              {templates.length > 0 ? (
                <GridInfiniteScrollList
                  items={templates}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                >
                  {(template, i) => {
                    return (
                      <PublicTemplateCard
                        data-template-id={template.id}
                        data-template-first={i === 0 ? "" : undefined}
                        key={template.id}
                        template={template}
                        onPress={() => handleTemplateClick(template.id)}
                      />
                    );
                  }}
                </GridInfiniteScrollList>
              ) : (
                <NewPetitionEmptySearch
                  flex="1"
                  marginBottom={16}
                  onClickNewTemplate={() => handleCreateTemplate()}
                />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
      {state.template && templateData ? (
        <TemplateDetailsModal
          isOpen
          onClose={() => setQueryState((current) => omit(current, ["template"]))}
          me={me}
          template={templateData?.petition as any}
          isFromPublicTemplates={state.public}
        />
      ) : null}
    </AppLayout>
  );
}

NewPetition.fragments = {
  PetitionTemplate: gql`
    fragment NewPetition_PetitionTemplate on PetitionTemplate {
      ...TemplateCard_PetitionTemplate
      ...PublicTemplateCard_PetitionTemplate
    }
    ${TemplateCard.fragments.PetitionTemplate}
    ${PublicTemplateCard.fragments.PetitionTemplate}
  `,
};

NewPetition.queries = [
  gql`
    query NewPetition_templates(
      $offset: Int!
      $limit: Int!
      $search: String
      $locale: PetitionLocale
      $isPublic: Boolean!
      $isOwner: Boolean
      $category: String
    ) {
      templates(
        offset: $offset
        limit: $limit
        search: $search
        isPublic: $isPublic
        isOwner: $isOwner
        locale: $locale
        category: $category
      ) {
        items {
          ...NewPetition_PetitionTemplate
        }
        totalCount
      }
    }
    ${NewPetition.fragments.PetitionTemplate}
  `,
  gql`
    query NewPetition_user {
      ...AppLayout_Query
      me {
        ...TemplateDetailsModal_User
      }
      hasTemplates: petitions(filters: { type: TEMPLATE }) {
        totalCount
      }
      publicTemplateCategories
    }
    ${AppLayout.fragments.Query}
    ${TemplateDetailsModal.fragments.User}
  `,
  gql`
    query NewPetition_template($templateId: GID!) {
      petition(id: $templateId) {
        ...TemplateDetailsModal_PetitionTemplate
      }
    }
    ${TemplateDetailsModal.fragments.PetitionTemplate}
  `,
];

NewPetition.getInitialProps = async ({
  query,
  fetchQuery,
  locale: _locale,
}: WithApolloDataContext) => {
  const state = parseQuery(query, QUERY_STATE);
  let locale: PetitionLocale | null = null;
  if (state.lang === "ALL") {
    locale = null;
  } else if (state.public && state.lang === null) {
    locale = _locale as PetitionLocale;
  } else {
    locale = state.lang;
  }
  await Promise.all([
    fetchQuery(NewPetition_templatesDocument, {
      variables: {
        offset: 0,
        limit: PAGE_SIZE,
        search: state.search,
        isPublic: state.public,
        locale: locale,
        isOwner: state.owner,
        category: state.category,
      },
    }),
    fetchQuery(NewPetition_userDocument),
    state.template
      ? fetchQuery(NewPetition_templateDocument, {
          variables: { templateId: state.template },
        })
      : undefined,
  ]);
};

export default compose(withDialogs, withApolloData)(NewPetition);
