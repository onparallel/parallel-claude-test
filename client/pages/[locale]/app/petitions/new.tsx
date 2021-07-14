import { gql } from "@apollo/client";
import {
  Button,
  Container,
  Flex,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useTemplateDetailsDialog } from "@parallel/components/petition-common/TemplateDetailsDialog";
import { NewPetitionMyTemplatesHeader } from "@parallel/components/petition-new/NewPetitionMyTemplatesHeader";
import { NewPetitionPublicTemplatesHeader } from "@parallel/components/petition-new/NewPetitionPublicTemplatesHeader";
import { NewPetitionTemplatesList } from "@parallel/components/petition-new/NewPetitionTemplatesList";
import {
  NewPetitionPublicTemplatesQuery,
  NewPetitionPublicTemplatesQueryVariables,
  NewPetitionTemplatesQuery,
  NewPetitionTemplatesQueryVariables,
  NewPetition_PetitionTemplateFragment,
  PetitionLocale,
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
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

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
        },
      },
    })
  );
  const templates = templatesData.templates
    .items as NewPetition_PetitionTemplateFragment[];
  const allTemplatesLoaded =
    templatesData.templates.items.length === templatesData.templates.totalCount;
  const hasTemplates = templatesData.hasTemplates.totalCount > 0;

  const [search, setSearch] = useState("");
  const [locale, setLocale] = useState(null as Maybe<PetitionLocale>);

  const [publicSearch, setPublicSearch] = useState("");
  const [publicLocale, setPublicLocale] = useState(
    null as Maybe<PetitionLocale>
  );

  const debouncedPublicTemplatesRefetch = useDebouncedCallback(
    publicTemplatesRefetch,
    300,
    [publicTemplatesRefetch]
  );
  const debouncedTemplatesRefetch = useDebouncedCallback(
    templatesRefetch,
    300,
    [templatesRefetch]
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      setSearch(search);

      debouncedTemplatesRefetch({
        offset: 0,
        limit: 20,
        search: search || null,
      });
    },
    [locale, debouncedTemplatesRefetch]
  );

  const handleLocaleChange = useCallback(
    (locale: Maybe<PetitionLocale>) => {
      setLocale(locale);
      debouncedTemplatesRefetch.immediate({
        offset: 0,
        limit: 20,
        filters: { locale, type: "TEMPLATE" },
      });
    },
    [search, debouncedTemplatesRefetch]
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
            items: [
              ...prev.publicTemplates.items,
              ...fetchMoreResult!.publicTemplates.items,
            ],
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
            items: [
              ...prev.templates.items,
              ...fetchMoreResult!.templates.items,
            ],
          },
        };
      },
    });
  }, [templatesFetchMore, templates]);

  const createPetition = useCreatePetition();
  const goToPetition = useGoToPetition();
  const showTemplateDetails = useTemplateDetailsDialog();
  const handleTemplateClick = useMemoFactory(
    (templateId: string | null) => async () => {
      try {
        if (templateId) {
          await showTemplateDetails(templateId, me.id);
        } else {
          const id = await createPetition();
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
    color: "blue.500",
    fontWeight: "semibold",
    borderBottom: "2px solid",
    borderColor: "blue.500",
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
      <Container maxWidth="container.xl" padding={10}>
        <Tabs defaultIndex={templates.length === 0 && !hasTemplates ? 1 : 0}>
          <TabList flexWrap="wrap-reverse">
            <Tab
              borderTopLeftRadius="md"
              borderTopRightRadius="md"
              _selected={selectTabStyles}
            >
              <FormattedMessage
                id="new-petition.my-templates"
                defaultMessage="My templates"
              />
            </Tab>
            <Tab
              borderTopLeftRadius="md"
              borderTopRightRadius="md"
              _selected={selectTabStyles}
            >
              <FormattedMessage
                id="new-petition.public-templates"
                defaultMessage="Public templates"
              />
            </Tab>
            <Flex flex="1" justifyContent="flex-end" paddingBottom={4}>
              <Button
                alignSelf="flex-end"
                borderColor="gray.100"
                leftIcon={<AddIcon fontSize="12px" />}
                onClick={() => handleCreatePetitionTemplate("PETITION")}
              >
                <FormattedMessage
                  id="new-petition.empty-petition-create"
                  defaultMessage="Create a blank petition"
                />
              </Button>
            </Flex>
          </TabList>
          <TabPanels>
            <TabPanel paddingX={0} paddingY={8}>
              <NewPetitionMyTemplatesHeader
                search={search}
                onSearchChange={handleSearchChange}
                locale={locale}
                onLocaleChange={handleLocaleChange}
              />
              {templates.length === 0 ? (
                <Stack
                  justifyContent="center"
                  alignItems="center"
                  minHeight="160px"
                >
                  <Text color="gray.500">
                    {hasTemplates ? (
                      <FormattedMessage
                        id="new-petition.no-templates-found"
                        defaultMessage="We couldn't find any templates with that search"
                      />
                    ) : (
                      <FormattedMessage
                        id="new-petition.no-templates"
                        defaultMessage="You don't have any templates yet"
                      />
                    )}
                  </Text>
                  <Button
                    variant="ghost"
                    colorScheme="purple"
                    size="sm"
                    onClick={handleCreatePetitionTemplate}
                  >
                    <FormattedMessage
                      id="new-petition.create-new-template"
                      defaultMessage="Create new template"
                    />
                  </Button>
                </Stack>
              ) : (
                <NewPetitionTemplatesList
                  items={templates}
                  isPublic={false}
                  onLoadMore={handleTemplatesLoadMore}
                  hasMore={!allTemplatesLoaded}
                  onClickTemplate={handleTemplateClick}
                />
              )}
            </TabPanel>
            <TabPanel paddingX={0} paddingY={8}>
              <NewPetitionPublicTemplatesHeader
                search={publicSearch}
                onSearchChange={handlePublicSearchChange}
                locale={publicLocale}
                onLocaleChange={handlePublicLocaleChange}
              />
              {publicTemplates.length === 0 ? (
                <Stack
                  justifyContent="center"
                  alignItems="center"
                  minHeight="160px"
                >
                  <Text color="gray.500">
                    {publicSearch ? (
                      <FormattedMessage
                        id="new-petition.no-templates-found"
                        defaultMessage="We couldn't find any templates with that search"
                      />
                    ) : (
                      <FormattedMessage
                        id="new-petition.no-public-templates"
                        defaultMessage="There are no public templates yet"
                      />
                    )}
                  </Text>
                </Stack>
              ) : (
                <NewPetitionTemplatesList
                  items={publicTemplates}
                  isPublic={true}
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
  get PetitionTemplate() {
    return gql`
      fragment NewPetition_PetitionTemplate on PetitionTemplate {
        id
        name
        description
        locale
        owner {
          id
          fullName
        }
      }
    `;
  },
  get User() {
    return gql`
      fragment NewPetition_User on User {
        ...AppLayout_User
      }
      ${AppLayout.fragments.User}
    `;
  },
};

NewPetition.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<
      NewPetitionPublicTemplatesQuery,
      NewPetitionPublicTemplatesQueryVariables
    >(
      gql`
        query NewPetitionPublicTemplates(
          $offset: Int!
          $limit: Int!
          $search: String
          $locale: PetitionLocale
        ) {
          publicTemplates(
            offset: $offset
            limit: $limit
            search: $search
            locale: $locale
          ) {
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
