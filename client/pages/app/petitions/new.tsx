import { gql, useQuery } from "@apollo/client";
import {
  Button,
  Container,
  Flex,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { AddIcon, ChevronDownIcon, FileNewIcon, PaperPlaneIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { TemplateDetailsModal } from "@parallel/components/petition-common/dialogs/TemplateDetailsModal";
import { NewPetitionCategoryFilter } from "@parallel/components/petition-new/NewPetitionCategoryFilter";
import { NewPetitionCategoryMenuFilter } from "@parallel/components/petition-new/NewPetitionCategoryMenuFilter";
import { NewPetitionEmptySearch } from "@parallel/components/petition-new/NewPetitionEmptySearch";
import { NewPetitionEmptyTemplates } from "@parallel/components/petition-new/NewPetitionEmptyTemplates";
import { NewPetitionLanguageFilter } from "@parallel/components/petition-new/NewPetitionLanguageFilter";
import {
  NewPetitionSharedFilter,
  NewPetitionSharedFilterValues,
} from "@parallel/components/petition-new/NewPetitionSharedFilter";
import { NewPetitionTemplatesList } from "@parallel/components/petition-new/NewPetitionTemplatesList";
import {
  NewPetition_templateDocument,
  NewPetition_templatesDocument,
  NewPetition_userDocument,
  PetitionBaseType,
  PetitionLocale,
} from "@parallel/graphql/__types";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { boolean, parseQuery, string, useQueryState, values } from "@parallel/utils/queryState";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit, pick } from "remeda";

const QUERY_STATE = {
  search: string(),
  lang: values<PetitionLocale>(["en", "es"]),
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
    data: { me, hasTemplates: _hasTemplates, publicTemplateCategories },
  } = useAssertQuery(NewPetition_userDocument);

  const { data: templateData } = useQuery(NewPetition_templateDocument, {
    variables: { templateId: state.template! },
    skip: !state.template,
    fetchPolicy: "cache-and-network",
  });

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
      locale: state.lang,
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
    setQueryState((state) => ({ ...state, lang }));
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
    setQueryState((state) => ({
      ...pick(state, ["lang"]),
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

  const handleCreatePetitionTemplate = useCallback(
    async (type: PetitionBaseType) => {
      try {
        const id = await createPetition({ type });
        goToPetition(id, "compose", { query: { new: "true" } });
      } catch {}
    },
    [goToPetition, createPetition]
  );

  useEffect(() => {
    if (!hasTemplates) {
      handleTabChange(1);
    }
  }, []);

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
      user={me}
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
                borderTopRadius="md"
                _selected={selectTabStyles}
                whiteSpace="nowrap"
                paddingX={3}
              >
                <FormattedMessage id="new-petition.my-templates" defaultMessage="My templates" />
              </Tab>
              <Tab
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
            <Menu placement="bottom-end">
              <MenuButton
                as={Button}
                data-action="create-template"
                aria-label={intl.formatMessage({
                  id: "new-petition.create",
                  defaultMessage: "Create",
                })}
                padding={{ base: 0, md: 4 }}
                alignSelf="flex-end"
                colorScheme="purple"
                isDisabled={me.role === "COLLABORATOR"}
              >
                <Flex alignItems="center" justifyContent="center">
                  <AddIcon fontSize={{ base: "16px", md: "12px" }} />
                  <Flex alignItems="center" marginLeft={2} display={{ base: "none", md: "flex" }}>
                    <Text as="span">
                      <FormattedMessage id="new-petition.create" defaultMessage="Create" />
                    </Text>
                    <ChevronDownIcon marginLeft={2} />
                  </Flex>
                </Flex>
              </MenuButton>
              <Portal>
                <MenuList width="min-content" minWidth="154px" whiteSpace="nowrap">
                  <MenuItem
                    onClick={() => handleCreatePetitionTemplate("TEMPLATE")}
                    icon={<FileNewIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="new-petition.new-template"
                      defaultMessage="New template"
                    />
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleCreatePetitionTemplate("PETITION")}
                    icon={<PaperPlaneIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="new-petition.blank-petition"
                      defaultMessage="Blank petition"
                    />
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
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
                    value={state.lang}
                    onChange={handleLocaleChange}
                    backgroundColor="white"
                    flex="1 0 auto"
                  />
                </Stack>
              </Stack>
              {templates.length > 0 ? (
                <NewPetitionTemplatesList
                  items={templates}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  onClickTemplate={handleTemplateClick}
                />
              ) : hasTemplates ? (
                <NewPetitionEmptySearch
                  flex="1"
                  marginBottom={16}
                  onClickNewTemplate={() => handleCreatePetitionTemplate("TEMPLATE")}
                  onClickPublicTemplates={() => handleTabChange(1)}
                />
              ) : (
                <NewPetitionEmptyTemplates
                  flex="1"
                  marginBottom={16}
                  onClickNewTemplate={() => handleCreatePetitionTemplate("TEMPLATE")}
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
                  value={state.lang}
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
                <NewPetitionTemplatesList
                  items={templates}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  onClickTemplate={handleTemplateClick}
                />
              ) : (
                <NewPetitionEmptySearch
                  flex="1"
                  marginBottom={16}
                  onClickNewTemplate={() => handleCreatePetitionTemplate("TEMPLATE")}
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
        />
      ) : null}
    </AppLayout>
  );
}

NewPetition.fragments = {
  PetitionTemplate: gql`
    fragment NewPetition_PetitionTemplate on PetitionTemplate {
      ...NewPetitionTemplatesList_PetitionTemplate
    }
    ${NewPetitionTemplatesList.fragments.PetitionTemplate}
  `,
  User: gql`
    fragment NewPetition_User on User {
      ...AppLayout_User
      ...TemplateDetailsModal_User
    }
    ${AppLayout.fragments.User}
    ${TemplateDetailsModal.fragments.User}
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
      me {
        ...NewPetition_User
      }
      hasTemplates: petitions(filters: { type: TEMPLATE }) {
        totalCount
      }
      publicTemplateCategories
    }
    ${NewPetition.fragments.User}
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

NewPetition.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const state = parseQuery(query, QUERY_STATE);
  await Promise.all([
    fetchQuery(NewPetition_templatesDocument, {
      variables: {
        offset: 0,
        limit: PAGE_SIZE,
        search: state.search,
        isPublic: state.public,
        locale: state.lang,
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
