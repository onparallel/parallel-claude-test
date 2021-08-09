import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Container,
  Flex,
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
} from "@chakra-ui/react";
import { AddIcon, ChevronDownIcon, FileNewIcon, PaperPlaneIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useTemplateDetailsDialog } from "@parallel/components/petition-common/TemplateDetailsDialog";
import { NewPetitionEmptySearch } from "@parallel/components/petition-new/NewPetitionEmptySearch";
import { NewPetitionEmptyTempaltes } from "@parallel/components/petition-new/NewPetitionEmptyTemplates";
import { NewPetitionLanguageFilter } from "@parallel/components/petition-new/NewPetitionLanguageFilter";
import { NewPetitionPublicTemplatesHeader } from "@parallel/components/petition-new/NewPetitionPublicTemplatesHeader";
import { NewPetitionSearch } from "@parallel/components/petition-new/NewPetitionSearch";
import {
  NewPetitionSharedFilter,
  NewPetitionSharedFilterValues,
} from "@parallel/components/petition-new/NewPetitionSharedFilter";
import { NewPetitionTemplatesList } from "@parallel/components/petition-new/NewPetitionTemplatesList";
import {
  NewPetitionPublicTemplatesQuery,
  NewPetitionPublicTemplatesQueryVariables,
  NewPetitionTemplatesQuery,
  NewPetitionTemplatesQueryVariables,
  NewPetition_PetitionTemplateFragment,
  PetitionLocale,
  PetitionSharedWithFilter,
  PetitionsUserQuery,
  useNewPetitionPublicTemplatesQuery,
  useNewPetitionTemplatesQuery,
  useNewPetitionUserQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCallback, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import ResizeObserver, { DOMRect } from "react-resize-observer";

function NewPetition() {
  const intl = useIntl();

  const {
    data: { me },
  } = assertQuery(useNewPetitionUserQuery());
  const {
    data: publicTemplatesData,
    fetchMore: publicTemplatesFetchMore,
    refetch: publicTemplatesRefetch,
  } = assertQuery(
    useNewPetitionPublicTemplatesQuery({
      variables: {
        offset: 0,
        limit: 20,
        locale: null,
        search: null,
      },
    })
  );
  const publicTemplates = publicTemplatesData.publicTemplates
    .items as NewPetition_PetitionTemplateFragment[];
  const allPublicTemplatesLoaded =
    publicTemplatesData.publicTemplates.items.length ===
    publicTemplatesData.publicTemplates.totalCount;
  const {
    data: templatesData,
    fetchMore: templatesFetchMore,
    refetch: templatesRefetch,
  } = assertQuery(
    useNewPetitionTemplatesQuery({
      variables: {
        offset: 0,
        limit: 20,
        search: null,
        filters: {
          locale: null,
          type: "TEMPLATE",
          sharedWith: null,
        },
      },
    })
  );
  const templates = templatesData.templates.items as NewPetition_PetitionTemplateFragment[];
  const allTemplatesLoaded =
    templatesData.templates.items.length === templatesData.templates.totalCount;
  const hasTemplates = templatesData.hasTemplates.totalCount > 0;

  const [search, setSearch] = useState("");
  const [locale, setLocale] = useState(null as Maybe<PetitionLocale>);
  const [sharedFilter, setSharedFilter] = useState(null as Maybe<NewPetitionSharedFilterValues>);

  const [publicSearch, setPublicSearch] = useState("");
  const [publicLocale, setPublicLocale] = useState(null as Maybe<PetitionLocale>);

  const [headerTop, setHeaderTop] = useState(74);

  const publicTemplatesTabRef = useRef<HTMLButtonElement>(null);

  const readjustHeight = useCallback(function (rect: DOMRect) {
    setHeaderTop(rect.height);
  }, []);

  const debouncedPublicTemplatesRefetch = useDebouncedCallback(publicTemplatesRefetch, 300, [
    publicTemplatesRefetch,
  ]);
  const debouncedTemplatesRefetch = useDebouncedCallback(templatesRefetch, 300, [templatesRefetch]);

  const handleSearchChange = useCallback(
    (search: string) => {
      setSearch(search);

      debouncedTemplatesRefetch({
        offset: 0,
        limit: 20,
        search: search || null,
      });
    },
    [debouncedTemplatesRefetch]
  );

  const handleLocaleChange = useCallback(
    (locale: Maybe<PetitionLocale>) => {
      setLocale(locale);
      debouncedTemplatesRefetch.immediate({
        offset: 0,
        limit: 20,
        filters: {
          locale,
          type: "TEMPLATE",
        },
      });
    },
    [debouncedTemplatesRefetch]
  );

  const handleSharedFilterChange = useCallback(
    (sharedFilter: Maybe<NewPetitionSharedFilterValues>) => {
      const sharedFilterValue = sharedFilter
        ? {
            operator: "AND",
            filters: [{ operator: sharedFilter, value: me.id }],
          }
        : null;

      setSharedFilter(sharedFilter ?? null);
      debouncedTemplatesRefetch.immediate({
        offset: 0,
        limit: 20,
        filters: {
          locale,
          type: "TEMPLATE",
          sharedWith: sharedFilterValue as PetitionSharedWithFilter,
        },
      });
    },
    [locale, debouncedTemplatesRefetch]
  );

  const handlePublicSearchChange = useCallback(
    (search: string) => {
      setPublicSearch(search);
      debouncedPublicTemplatesRefetch({
        offset: 0,
        limit: 20,
        search: search || null,
      });
    },
    [publicSearch, debouncedPublicTemplatesRefetch]
  );

  const handlePublicLocaleChange = useCallback(
    (locale: Maybe<PetitionLocale>) => {
      setPublicLocale(locale);
      debouncedPublicTemplatesRefetch.immediate({
        offset: 0,
        limit: 20,
        locale,
      });
    },
    [publicLocale, debouncedPublicTemplatesRefetch]
  );

  const handlePublicTemplatesLoadMore = useCallback(() => {
    publicTemplatesFetchMore({
      variables: {
        offset: publicTemplates.length,
        limit: 20,
      },
      updateQuery(prev, { fetchMoreResult }) {
        return {
          publicTemplates: {
            ...fetchMoreResult!.publicTemplates,
            items: [...prev.publicTemplates.items, ...fetchMoreResult!.publicTemplates.items],
          },
        };
      },
    });
  }, [publicTemplatesFetchMore, publicTemplates]);

  const handleTemplatesLoadMore = useCallback(() => {
    templatesFetchMore({
      variables: {
        offset: templates.length,
        limit: 20,
      },
      updateQuery(prev, { fetchMoreResult }) {
        return {
          ...fetchMoreResult!,
          templates: {
            ...fetchMoreResult!.templates,
            items: [...prev.templates.items, ...fetchMoreResult!.templates.items],
          },
        };
      },
    });
  }, [templatesFetchMore, templates]);

  const createPetition = useCreatePetition();
  const goToPetition = useGoToPetition();
  const showTemplateDetails = useTemplateDetailsDialog();
  const handleTemplateClick = useCallback(
    async (templateId: string | null) => {
      try {
        if (templateId) {
          await showTemplateDetails(templateId, me.id);
        } else {
          const id = await createPetition({ type: "TEMPLATE" });
          goToPetition(id, "compose");
        }
      } catch {}
    },
    [goToPetition, showTemplateDetails, createPetition]
  );

  const handleCreatePetitionTemplate = useCallback(
    async (type = "TEMPLATE") => {
      try {
        const id = await createPetition({ type });
        goToPetition(id, "compose");
      } catch {}
    },
    [goToPetition, createPetition]
  );

  const selectTabStyles = {
    color: "blue.600",
    fontWeight: "semibold",
    borderBottom: "2px solid",
    borderColor: "blue.600",
  };

  return (
    <AppLayout
      id="main-container"
      title={intl.formatMessage({
        id: "new-petition.title",
        defaultMessage: "New petition",
      })}
      user={me}
    >
      <Container maxWidth="container.xl">
        <Tabs defaultIndex={templates.length === 0 && !hasTemplates ? 1 : 0} paddingY={4}>
          <Box
            position="sticky"
            top="0px"
            paddingTop={6}
            backgroundColor="gray.50"
            zIndex={1}
            paddingX={2}
          >
            <TabList flexWrap="wrap-reverse" marginX={4}>
              <Tab borderTopLeftRadius="md" borderTopRightRadius="md" _selected={selectTabStyles}>
                <FormattedMessage id="new-petition.my-templates" defaultMessage="My templates" />
              </Tab>
              <Tab
                borderTopLeftRadius="md"
                borderTopRightRadius="md"
                _selected={selectTabStyles}
                ref={publicTemplatesTabRef}
              >
                <FormattedMessage
                  id="new-petition.public-templates"
                  defaultMessage="Public templates"
                />
              </Tab>
              <Flex flex="1" justifyContent="flex-end" paddingBottom={4}>
                <Menu placement="bottom-end">
                  <MenuButton
                    as={Button}
                    alignSelf="flex-end"
                    leftIcon={<AddIcon fontSize="12px" />}
                    rightIcon={<ChevronDownIcon />}
                    colorScheme="purple"
                  >
                    <FormattedMessage id="new-petition.create" defaultMessage="Create" />
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
              </Flex>
            </TabList>
            <ResizeObserver onResize={readjustHeight} />
          </Box>

          <TabPanels>
            <TabPanel paddingX={0} paddingY={0}>
              <Stack
                paddingX={6}
                paddingTop={8}
                paddingBottom={6}
                position="sticky"
                top={`${headerTop}px`}
                backgroundColor="gray.50"
                zIndex={1}
              >
                <NewPetitionSearch
                  search={search}
                  handleSearchChange={handleSearchChange}
                  templateColumns={"1fr auto auto"}
                >
                  <NewPetitionSharedFilter
                    option={sharedFilter}
                    onSharedFilterChange={handleSharedFilterChange}
                    backgroundColor="white"
                  />
                  <NewPetitionLanguageFilter
                    locale={locale}
                    onLocaleChange={handleLocaleChange}
                    backgroundColor="white"
                  />
                </NewPetitionSearch>
              </Stack>
              {templates.length === 0 ? (
                hasTemplates ? (
                  <NewPetitionEmptySearch
                    onClickNewTemplate={() => handleCreatePetitionTemplate("TEMPLATE")}
                    onClickPublicTemplates={() => publicTemplatesTabRef?.current?.click()}
                  />
                ) : (
                  <NewPetitionEmptyTempaltes
                    onClickNewTemplate={() => handleCreatePetitionTemplate("TEMPLATE")}
                    onClickPublicTemplates={() => publicTemplatesTabRef?.current?.click()}
                  />
                )
              ) : (
                <NewPetitionTemplatesList
                  items={templates}
                  onLoadMore={handleTemplatesLoadMore}
                  hasMore={!allTemplatesLoaded}
                  onClickTemplate={handleTemplateClick}
                />
              )}
            </TabPanel>
            <TabPanel paddingX={0} paddingY={0}>
              <NewPetitionPublicTemplatesHeader
                search={publicSearch}
                onSearchChange={handlePublicSearchChange}
                locale={publicLocale}
                onLocaleChange={handlePublicLocaleChange}
                spacing={4}
                paddingX={6}
                paddingTop={8}
                paddingBottom={6}
                position="sticky"
                top={`${headerTop}px`}
                backgroundColor="gray.50"
                zIndex={1}
              />
              {publicTemplates.length === 0 ? (
                <NewPetitionEmptySearch
                  onClickNewTemplate={() => handleCreatePetitionTemplate("TEMPLATE")}
                />
              ) : (
                <NewPetitionTemplatesList
                  items={publicTemplates}
                  onLoadMore={handlePublicTemplatesLoadMore}
                  hasMore={!allPublicTemplatesLoaded}
                  onClickTemplate={handleTemplateClick}
                />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
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
    }
    ${AppLayout.fragments.User}
  `,
};

NewPetition.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<NewPetitionPublicTemplatesQuery, NewPetitionPublicTemplatesQueryVariables>(
      gql`
        query NewPetitionPublicTemplates(
          $offset: Int!
          $limit: Int!
          $search: String
          $locale: PetitionLocale
        ) {
          publicTemplates(offset: $offset, limit: $limit, search: $search, locale: $locale) {
            items {
              ...NewPetition_PetitionTemplate
            }
            totalCount
          }
        }
        ${NewPetition.fragments.PetitionTemplate}
      `,
      {
        variables: {
          offset: 0,
          limit: 20,
          search: null,
          locale: null,
        },
      }
    ),
    fetchQuery<NewPetitionTemplatesQuery, NewPetitionTemplatesQueryVariables>(
      gql`
        query NewPetitionTemplates(
          $offset: Int!
          $limit: Int!
          $search: String
          $filters: PetitionFilter
        ) {
          templates: petitions(
            offset: $offset
            limit: $limit
            search: $search
            sortBy: [lastUsedAt_DESC]
            filters: $filters
          ) {
            items {
              ...NewPetition_PetitionTemplate
            }
            totalCount
          }
          hasTemplates: petitions(filters: { type: TEMPLATE }) {
            totalCount
          }
        }
        ${NewPetition.fragments.PetitionTemplate}
      `,
      {
        variables: {
          offset: 0,
          limit: 20,
          search: null,
          filters: {
            locale: null,
            type: "TEMPLATE",
            sharedWith: null,
          },
        },
      }
    ),

    fetchQuery<PetitionsUserQuery>(gql`
      query NewPetitionUser {
        me {
          ...NewPetition_User
        }
      }
      ${NewPetition.fragments.User}
    `),
  ]);
};

export default compose(withDialogs, withApolloData)(NewPetition);
