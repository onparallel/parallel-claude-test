import { gql } from "@apollo/client";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Collapse,
  Flex,
  Grid,
  Heading,
  Select,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/core";
import { AddIcon, ChevronDownIcon } from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import { BreakLines } from "@parallel/components/common/BreakLines";
import { Card } from "@parallel/components/common/Card";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useTemplateDetailsDialog } from "@parallel/components/petition-common/TemplateDetailsDialog";
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
import { assertQuery } from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import {
  ChangeEvent,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
        limit: 5,
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
        limit: 3,
        locale: null,
        search: null,
      },
    })
  );
  const templates = templatesData.templates
    .items as NewPetition_PetitionTemplateFragment[];
  const allTemplatesLoaded =
    templatesData.templates.items.length === templatesData.templates.totalCount;
  const hasTemplates = templatesData.hasTemplates.totalCount > 0;

  const [{ search, locale }, setState] = useState({
    search: "",
    locale: null as Maybe<PetitionLocale>,
  });

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
      setState({ locale, search });
      debouncedPublicTemplatesRefetch({
        offset: 0,
        limit: 5,
        search: search || null,
      });
      debouncedTemplatesRefetch({
        offset: 0,
        limit: 3,
        search: search || null,
      });
    },
    [locale, debouncedPublicTemplatesRefetch, debouncedTemplatesRefetch]
  );

  const handleLocaleChange = useCallback(
    (locale: Maybe<PetitionLocale>) => {
      setState({ locale, search });
      debouncedPublicTemplatesRefetch.immediate({
        offset: 0,
        limit: 5,
        locale,
      });
      debouncedTemplatesRefetch.immediate({
        offset: 0,
        limit: 3,
        locale,
      });
    },
    [search, debouncedPublicTemplatesRefetch, debouncedTemplatesRefetch]
  );

  const handlePublicTemplatesLoadMore = useCallback(() => {
    publicTemplatesFetchMore({
      variables: {
        offset: publicTemplates.length,
        limit: 6,
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
        limit: 6,
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

  const handleCreatePetitionTemplate = useCallback(async () => {
    try {
      const id = await createPetition({ type: "TEMPLATE" });
      goToPetition(id, "compose");
    } catch {}
  }, [goToPetition, createPetition]);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current!.focus();
  }, []);

  return (
    <AppLayout
      title={intl.formatMessage({
        id: "new-petition.title",
        defaultMessage: "New petition",
      })}
      user={me}
    >
      <NewPetitionHeader
        inputRef={inputRef}
        search={search}
        locale={locale}
        onSearchChange={handleSearchChange}
        onLocaleChange={handleLocaleChange}
        paddingTop={6}
        paddingBottom={4}
        backgroundColor="gray.50"
        position="sticky"
        top={0}
        zIndex={1}
        borderBottom="1px solid"
        borderBottomColor="gray.200"
      />
      <NewPetitionSection header={"Parallel"} marginTop={4}>
        <Grid
          templateColumns={{
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap={4}
        >
          <EmptyPetitionCard
            id="empty-petition-card"
            onPress={handleTemplateClick(null)}
          />
          {publicTemplates.map(
            (template: NewPetition_PetitionTemplateFragment) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPress={handleTemplateClick(template.id)}
              />
            )
          )}
        </Grid>
        <Stack direction="row" justifyContent="flex-end" marginTop={4}>
          <Button
            variant="ghost"
            size="sm"
            colorScheme="purple"
            isDisabled={allPublicTemplatesLoaded}
            onClick={handlePublicTemplatesLoadMore}
          >
            <FormattedMessage
              id="generic.load-more"
              defaultMessage="Load more"
            />
          </Button>
        </Stack>
      </NewPetitionSection>
      <NewPetitionSection
        header={intl.formatMessage({
          id: "new-petition.my-templates",
          defaultMessage: "My templates",
        })}
        paddingBottom={2}
      >
        {templates.length === 0 ? (
          <Stack justifyContent="center" alignItems="center" minHeight="120px">
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
          <>
            <Grid
              templateColumns={{
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              }}
              gap={4}
            >
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPress={handleTemplateClick(template.id)}
                />
              ))}
            </Grid>
            <Stack direction="row" justifyContent="flex-end" marginTop={4}>
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
              <Button
                variant="ghost"
                size="sm"
                colorScheme="purple"
                isDisabled={allTemplatesLoaded}
                onClick={handleTemplatesLoadMore}
              >
                <FormattedMessage
                  id="generic.load-more"
                  defaultMessage="Load more"
                />
              </Button>
            </Stack>
          </>
        )}
      </NewPetitionSection>
    </AppLayout>
  );
}

function NewPetitionContainer({ children, ...props }: ExtendChakra) {
  return (
    <Box {...props}>
      <Box
        margin="auto"
        width={{
          base: "100%",
          sm: "calc(min(360px, 100vw - 7rem))",
          md: "calc(min(1024px, 100vw - 7rem))",
        }}
        paddingX={4}
      >
        {children}
      </Box>
    </Box>
  );
}

function NewPetitionHeader({
  inputRef,
  search,
  locale,
  onSearchChange,
  onLocaleChange,
  ...props
}: ExtendChakra<{
  inputRef: Ref<HTMLInputElement>;
  search: string;
  locale: Maybe<PetitionLocale>;
  onSearchChange: (search: string) => void;
  onLocaleChange: (locale: Maybe<PetitionLocale>) => void;
}>) {
  const intl = useIntl();
  const suggestions = useMemo(
    () => [
      intl.formatMessage({
        id: "new-petition.suggestion-kyc",
        defaultMessage: "KYC",
      }),
      intl.formatMessage({
        id: "new-petition.suggestion-corporate",
        defaultMessage: "corporate",
      }),
      intl.formatMessage({
        id: "new-petition.suggestion-due",
        defaultMessage: "due diligence",
      }),
      intl.formatMessage({
        id: "new-petition.suggestion-sales",
        defaultMessage: "sales",
      }),
      intl.formatMessage({
        id: "new-petition.suggestion-tax",
        defaultMessage: "tax",
      }),
    ],
    [intl.locale]
  );
  const locales = useSupportedLocales();
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onSearchChange(event.target.value);
    },
    [onSearchChange]
  );
  const handleLocaleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onLocaleChange((event.target.value || null) as Maybe<PetitionLocale>);
    },
    [onLocaleChange]
  );
  const handleAddSuggestion = useMemoFactory(
    (suggestion: string) => () => onSearchChange(suggestion),
    [onSearchChange]
  );
  return (
    <NewPetitionContainer {...props}>
      <SearchInput
        ref={inputRef}
        placeholder={intl.formatMessage({
          id: "new-petition.search-placeholder",
          defaultMessage: "What are you looking for?",
        })}
        value={search}
        onChange={handleSearchChange}
      />
      <Flex marginTop={2} fontSize="sm">
        <Flex flexWrap="wrap" paddingLeft={2}>
          <Box marginRight={2} marginLeft={2}>
            <Text as="strong">
              <FormattedMessage
                id="new-petition.suggested-searches"
                defaultMessage="Suggested searches:"
              />
            </Text>
          </Box>
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="link"
              marginX={2}
              size="sm"
              colorScheme="purple"
              fontWeight="normal"
              onClick={handleAddSuggestion(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </Flex>
        <Spacer />
        <Select
          aria-label={intl.formatMessage({
            id: "new-petition.select-label",
            defaultMessage: "Language filter",
          })}
          variant="unstyled"
          size="sm"
          width="auto"
          textAlign="right"
          value={locale ?? ""}
          onChange={handleLocaleChange}
        >
          <option value="">
            {intl.formatMessage({
              id: "generic.all-languages",
              defaultMessage: "All languages",
            })}
          </option>
          {locales.map(({ key, localizedLabel }) => (
            <option key={key} value={key}>
              {localizedLabel}
            </option>
          ))}
        </Select>
      </Flex>
    </NewPetitionContainer>
  );
}

const NewPetitionSection = memo(function NewPetitionSection({
  header,
  children,
  ...props
}: ExtendChakra<{
  header: ReactNode;
  children: ReactNode;
}>) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  return (
    <NewPetitionContainer {...props}>
      <Flex marginBottom={4}>
        <Flex
          as="button"
          outline="none"
          alignItems="center"
          aria-expanded={isOpen}
          onClick={onToggle}
        >
          <ChevronDownIcon
            transition="transform 250ms ease"
            transform={isOpen ? "none" : "rotate(-90deg)"}
          />
          <Heading as="h3" size="sm" marginLeft={2}>
            {header}
          </Heading>
        </Flex>
      </Flex>
      <Collapse isOpen={isOpen}>{children}</Collapse>
    </NewPetitionContainer>
  );
});

const TemplateCard = memo(function TemplateCard({
  template,
  onPress,
  ...props
}: ExtendChakra<{
  template: NewPetition_PetitionTemplateFragment;
  onPress: () => void;
}>) {
  const intl = useIntl();
  const locales = useSupportedLocales();
  const localeLabel = locales.find(({ key }) => key === template.locale)!
    .localizedLabel;
  const buttonProps = useRoleButton(onPress, [onPress]);

  return (
    <Card
      display="flex"
      flexDirection="column"
      padding={4}
      minHeight="160px"
      outline="none"
      transition="all 150ms ease"
      _hover={{
        borderColor: "gray.300",
        boxShadow: "lg",
        transform: "scale(1.025)",
      }}
      _focus={{
        boxShadow: "outline",
        borderColor: "gray.200",
      }}
      minWidth={0}
      {...buttonProps}
      {...props}
    >
      <Heading size="xs" noOfLines={2}>
        {template.name ||
          intl.formatMessage({
            id: "generic.untitled-template",
            defaultMessage: "Untitled template",
          })}
      </Heading>
      <Text fontSize="sm" noOfLines={2}>
        {template.description ? (
          <BreakLines text={template.description} />
        ) : (
          <Text fontStyle="italic">
            <FormattedMessage
              id="template-details.no-description-provided"
              defaultMessage="No description provided."
            />
          </Text>
        )}
      </Text>
      <Spacer />
      <Flex alignItems="center" marginTop={2}>
        <Tooltip label={localeLabel}>
          <Badge as="abbr" aria-label={localeLabel}>
            {template.locale}
          </Badge>
        </Tooltip>
        <Spacer />
        <Avatar name={template.owner.fullName!} size="xs" role="presentation" />
        <Text fontSize="xs" marginLeft={2}>
          <FormattedMessage
            id="generic.by"
            defaultMessage="by {name}"
            values={{ name: template.owner.fullName }}
          />
        </Text>
      </Flex>
    </Card>
  );
});

const EmptyPetitionCard = memo(function EmptyPetitionCard({
  onPress,
  ...props
}: ExtendChakra<{ onPress: () => void }>) {
  const buttonProps = useRoleButton(onPress, [onPress]);
  return (
    <Card
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      padding={4}
      minHeight="160px"
      outline="none"
      transition="all 150ms ease"
      _hover={{
        borderColor: "gray.300",
        boxShadow: "lg",
        transform: "scale(1.025)",
      }}
      _focus={{
        boxShadow: "outline",
        borderColor: "gray.200",
      }}
      {...buttonProps}
      {...props}
    >
      <Heading size="xs" marginBottom={4}>
        <FormattedMessage
          id="new-petition.empty-petition-header"
          defaultMessage="Not finding what you're looking for?"
        />
      </Heading>
      <AddIcon boxSize="36px" color="purple.500" marginBottom={4} />
      <Heading size="xs">
        <FormattedMessage
          id="new-petition.empty-petition-create"
          defaultMessage="Create a petition from scratch"
        />
      </Heading>
    </Card>
  );
});

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
          limit: 5,
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
          $locale: PetitionLocale
        ) {
          templates: petitions(
            offset: $offset
            limit: $limit
            search: $search
            locale: $locale
            type: TEMPLATE
          ) {
            items {
              ...NewPetition_PetitionTemplate
            }
            totalCount
          }
          hasTemplates: petitions(type: TEMPLATE) {
            totalCount
          }
        }
        ${NewPetition.fragments.PetitionTemplate}
      `,
      {
        variables: {
          offset: 0,
          limit: 3,
          search: null,
          locale: null,
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

export default compose(withApolloData)(NewPetition);
