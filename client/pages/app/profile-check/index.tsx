import { gql } from "@apollo/client";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from "@chakra-ui/react";
import { CheckIcon, DeleteIcon, SaveIcon, SearchIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { ProfilePropertyContent } from "@parallel/components/common/ProfilePropertyContent";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { ProfileTypeReference } from "@parallel/components/common/ProfileTypeReference";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import {
  ProfileSearch_conflictCheckProfileSearchDocument,
  ProfileSearch_conflictCheckProfileSearchQuery,
  ProfileSearch_createPetitionFieldRepliesDocument,
  ProfileSearch_petitionFieldDocument,
  ProfileSearch_petitionFieldQuery,
  ProfileSearch_ProfileFragment,
  ProfileSearch_profileTypesDocument,
  ProfileSearch_profileTypesQuery,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import Head from "next/head";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, pick } from "remeda";

type ProfileSearchProps = UnwrapPromise<ReturnType<typeof ProfileSearch.getInitialProps>>;

function ProfileSearch({ fieldId, petitionId, profileTypeIds, parentReplyId }: ProfileSearchProps) {
  const intl = useIntl();
  const toast = useToast();
  const { data: petitionFieldData } = useAssertQuery(ProfileSearch_petitionFieldDocument, {
    variables: {
      petitionId: petitionId!,
      petitionFieldId: fieldId!,
    },
  });

  const { data: profileTypesData } = useAssertQuery(ProfileSearch_profileTypesDocument, {
    variables: {
      filter: {
        profileTypeId: profileTypeIds,
      },
    },
  });

  const [conflictCheckProfileSearch, { data: conflictCheckProfileSearchData }] = useLazyQuery(
    ProfileSearch_conflictCheckProfileSearchDocument,
  );

  const [savedProfileIds, setSavedProfileIds] = useState<string[]>([]);
  const [currentSearch, setCurrentSearch] = useState<string | null>(null);

  const handleDeleteProfile = (profileId: string) => {
    setSavedProfileIds((prev) => prev.filter((id) => id !== profileId));
  };

  const handleSaveProfile = (profileId: string) => {
    setSavedProfileIds((prev) => [...prev, profileId]);
  };

  const { control, handleSubmit } = useForm({
    defaultValues: {
      search: "",
    },
  });

  const onSubmit = (data: any) => {
    setSavedProfileIds([]);
    conflictCheckProfileSearch({
      variables: {
        petitionId: petitionId!,
        fieldId: fieldId!,
        search: data.search,
      },
    });
    setCurrentSearch(data.search);
  };
  const [createPetitionFieldReplies] = useMutation(
    ProfileSearch_createPetitionFieldRepliesDocument,
  );

  const handleSaveProfileSearchData = async () => {
    await createPetitionFieldReplies({
      variables: {
        petitionId: petitionId!,
        fields: [
          {
            id: fieldId!,
            content: {
              search: currentSearch,
              totalResults: conflictCheckProfileSearchData?.conflictCheckProfileSearch.length ?? 0,
              profileIds: savedProfileIds,
            },
            parentReplyId,
          },
        ],
      },
    });

    toast({
      title: intl.formatMessage({
        id: "page.profile-check.save-profile-search-success",
        defaultMessage: "Profile search saved",
      }),
      status: "success",
    });
    window.opener?.postMessage("refresh");
  };

  return (
    <>
      <Head>
        <title>
          {
            // eslint-disable-next-line formatjs/no-literal-string-in-jsx
            `${intl.formatMessage({
              id: "page.profile-check.title",
              defaultMessage: "Profile check",
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
        maxWidth="100vw"
        backgroundColor="gray.50"
      >
        <Heading size="md">
          <FormattedMessage id="page.profile-check.title" defaultMessage="Profile check" />
        </Heading>

        <Flex gap={{ base: 4, md: 2 }} flexDirection={{ base: "column", md: "row" }}>
          <Controller
            control={control}
            name="search"
            render={({ field }) => (
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", width: "100%" }}>
                <Input
                  backgroundColor="white"
                  placeholder={intl.formatMessage({
                    id: "page.profile-check.search-in-profiles",
                    defaultMessage: "Search in profiles...",
                  })}
                  {...field}
                  width="100%"
                  maxWidth={{ base: "100%", md: "420px" }}
                />
                <Box marginStart={2}>
                  <Button type="submit" leftIcon={<SearchIcon />}>
                    <FormattedMessage id="page.profile-check.search" defaultMessage="Search" />
                  </Button>
                </Box>
              </form>
            )}
          />

          <Box alignSelf="flex-end">
            <Button
              colorScheme="primary"
              leftIcon={<SaveIcon />}
              isDisabled={
                !currentSearch || petitionFieldData.petitionField.petition.type === "TEMPLATE"
              }
              onClick={handleSaveProfileSearchData}
            >
              {savedProfileIds.length ? (
                <FormattedMessage
                  id="page.profile-check.save-with-relevant"
                  defaultMessage="Save whit {count} relevant results"
                  values={{
                    count: savedProfileIds.length,
                  }}
                />
              ) : (
                <FormattedMessage
                  id="page.profile-check.save-whitout-relevant"
                  defaultMessage="Save without relevant results"
                />
              )}
            </Button>
          </Box>
        </Flex>

        <ProfileSearchTabs
          profileTypesData={profileTypesData}
          petitionFieldData={petitionFieldData}
          conflictCheckProfileSearchData={conflictCheckProfileSearchData}
          savedProfileIds={savedProfileIds}
          onDeleteProfile={handleDeleteProfile}
          onSaveProfile={handleSaveProfile}
          currentSearch={currentSearch}
        />
      </Stack>
    </>
  );
}

function ProfileSearchTabs({
  profileTypesData,
  petitionFieldData,
  conflictCheckProfileSearchData,
  savedProfileIds,
  onDeleteProfile,
  onSaveProfile,
  currentSearch,
}: {
  profileTypesData: ProfileSearch_profileTypesQuery;
  petitionFieldData: ProfileSearch_petitionFieldQuery;
  conflictCheckProfileSearchData?: ProfileSearch_conflictCheckProfileSearchQuery;
  savedProfileIds: string[];
  onDeleteProfile: (profileId: string) => void;
  onSaveProfile: (profileId: string) => void;
  currentSearch: string | null;
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const options = petitionFieldData.petitionField.options;

  const [{ page, search, items }, setTableState] = useState({
    page: 1,
    search: "",
    items: 10,
  });
  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const profileTypeId = profileTypesData.profileTypes.items[tabIndex].id;
  const profileTypeFieldIds =
    options?.searchIn?.find((s: any) => s.profileTypeId === profileTypeId)?.profileTypeFieldIds ??
    [];

  const columns = useProfileSearchTableColumns({
    profileTypesData,
    profileTypeId,
    profileTypeFieldIds,
  });

  const [tableRows, totalCount] = useMemo(() => {
    const rows =
      conflictCheckProfileSearchData?.conflictCheckProfileSearch.filter(
        (profile) => profile.profileType.id === profileTypeId,
      ) ?? [];

    return [rows.slice((page - 1) * items, page * items), rows.length];
  }, [profileTypeId, conflictCheckProfileSearchData, page, search, items]);

  const context = useMemo(
    () => ({
      savedProfileIds,
      onDeleteProfile,
      onSaveProfile,
    }),
    [savedProfileIds, onDeleteProfile, onSaveProfile],
  );

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  return (
    <Stack {...extendFlexColumn}>
      {currentSearch ? (
        <Text>
          <FormattedMessage
            id="page.profile-check.showing-results-for"
            defaultMessage="Showing results for: <b>{search}</b>"
            values={{ search: currentSearch }}
          />
        </Text>
      ) : null}
      <Tabs
        variant="enclosed"
        index={tabIndex}
        onChange={handleTabsChange}
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        display="flex"
        flexDirection="column"
        minHeight={0}
      >
        <TabList>
          {profileTypesData.profileTypes.items.map((profileType, index) => {
            const count =
              conflictCheckProfileSearchData?.conflictCheckProfileSearch.filter(
                (profile) => profile.profileType.id === profileType.id,
              ) ?? [];
            return (
              <Tab
                key={profileType.id}
                backgroundColor={index === tabIndex ? "white" : undefined}
                zIndex={10}
              >
                <ProfileTypeReference profileType={profileType} />
                {isNonNullish(conflictCheckProfileSearchData) ? (
                  <Text as="span" marginStart={1}>{`(${count.length})`}</Text>
                ) : null}
              </Tab>
            );
          })}
        </TabList>
        <TabPanels padding={0} {...extendFlexColumn}>
          {profileTypesData.profileTypes.items.map((profileType) => {
            return (
              <TabPanel key={profileType.id} padding={0} {...extendFlexColumn}>
                <TablePage
                  borderTopRadius={0}
                  flex="0 1 auto"
                  borderStart="none"
                  borderEnd="none"
                  borderBottom="none"
                  minHeight={0}
                  isHighlightable
                  columns={columns}
                  rows={tableRows}
                  rowKeyProp={(row: any) => row.id}
                  context={context}
                  loading={false}
                  page={page}
                  pageSize={items}
                  totalCount={totalCount}
                  onPageChange={(page) => setTableState((s) => ({ ...s, page }))}
                  onPageSizeChange={(items) => setTableState((s) => ({ ...s, items, page: 1 }))}
                  header={
                    <Stack direction="row" padding={2}>
                      <Box flex="0 1 400px">
                        <SearchInput
                          value={search ?? ""}
                          onChange={(e) => setTableState((s) => ({ ...s, search: e.target.value }))}
                        />
                      </Box>
                    </Stack>
                  }
                  body={
                    search && tableRows.length === 0 ? (
                      <Center flex="1" minHeight="200px">
                        <Text color="gray.400" fontSize="lg">
                          <FormattedMessage
                            id="component.profile-types-table.no-results"
                            defaultMessage="There's no profile types matching your criteria"
                          />
                        </Text>
                      </Center>
                    ) : tableRows.length === 0 ? (
                      <Center flex="1" minHeight="200px">
                        <Text color="gray.400" fontSize="lg">
                          <FormattedMessage
                            id="component.dow-jones-search-result.no-results"
                            defaultMessage="No results found for this search"
                          />
                        </Text>
                      </Center>
                    ) : null
                  }
                />
              </TabPanel>
            );
          })}
        </TabPanels>
      </Tabs>
    </Stack>
  );
}

ProfileSearch.fragments = {
  ProfileType: gql`
    fragment ProfileSearch_ProfileType on ProfileType {
      id
      name
    }
  `,
  Profile: gql`
    fragment ProfileSearch_Profile on Profile {
      id
      name
      profileType {
        id
      }
      properties {
        value {
          id
          ...ProfilePropertyContent_ProfileFieldValue
        }
        files {
          id
          ...ProfilePropertyContent_ProfileFieldFile
        }
        field {
          id
          ...ProfilePropertyContent_ProfileTypeField
        }
      }
      ...ProfileReference_Profile
    }
    ${ProfilePropertyContent.fragments.ProfileFieldFile}
    ${ProfilePropertyContent.fragments.ProfileFieldValue}
    ${ProfilePropertyContent.fragments.ProfileTypeField}
    ${ProfileReference.fragments.Profile}
  `,
};

interface ProfileSearchTableContext {
  savedProfileIds: string[];
  onDeleteProfile: (profileId: string) => void;
  onSaveProfile: (profileId: string) => void;
}

function useProfileSearchTableColumns({
  profileTypesData,
  profileTypeId,
  profileTypeFieldIds,
}: {
  profileTypesData: ProfileSearch_profileTypesQuery;
  profileTypeId: string;
  profileTypeFieldIds: string[];
}): TableColumn<ProfileSearch_ProfileFragment, ProfileSearchTableContext>[] {
  const intl = useIntl();

  const profileTypeFields =
    profileTypesData.profileTypes.items
      .find((profileType) => profileType.id === profileTypeId)
      ?.fields.filter((field) => profileTypeFieldIds.includes(field.id)) ?? [];

  return useMemo(
    () => [
      {
        key: "name",
        isFixed: true,
        label: intl.formatMessage({
          id: "generic.name",
          defaultMessage: "Name",
        }),
        headerProps: {
          minWidth: "240px",
        },
        cellProps: {
          maxWidth: 0,
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return (
            <OverflownText>
              <ProfileReference profile={row} />
            </OverflownText>
          );
        },
      },
      ...profileTypeFields.map((field) => ({
        key: `field_${field.id}`,
        label: localizableUserTextRender({
          intl,
          value: field.name,
          default: intl.formatMessage({
            id: "generic.unnamed-profile-type-field",
            defaultMessage: "Unnamed property",
          }),
        }),
        headerProps: {
          minWidth: 0,
          maxWidth: "340px",
        },
        cellProps: {
          minWidth: "160px",
          whiteSpace: "nowrap",
          maxWidth: "340px",
        },
        CellContent: ({ row: profile }: { row: any }) => {
          const property = profile.properties.find((p: any) => p.field.id === field.id);
          if (isNonNullish(property)) {
            return (
              <ProfilePropertyContent
                {...pick(property, ["field", "files", "value"])}
                profileId={profile.id}
                singleLine
              />
            );
          } else {
            return null;
          }
        },
      })),
      {
        key: "actions",
        label: "",
        CellContent: ({ row, context }) => {
          const rowProfileIsSaved = context.savedProfileIds.includes(row.id);
          const handleSaveClick = async () => {
            context.onSaveProfile(row.id);
          };
          const handleDeleteClick = async () => {
            context.onDeleteProfile(row.id);
          };
          return (
            <Flex justifyContent="end">
              {rowProfileIsSaved ? (
                <HStack>
                  <CheckIcon color="green.500" />
                  <Text fontWeight={500}>
                    <FormattedMessage
                      id="component.profile-search-table.relevant"
                      defaultMessage="Relevant"
                    />
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
                  />
                </HStack>
              ) : (
                <Button
                  size="sm"
                  fontSize="md"
                  variant="solid"
                  colorScheme="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveClick();
                  }}
                  fontWeight={500}
                >
                  <FormattedMessage
                    id="component.profile-search-table.mark-as-relevant"
                    defaultMessage="Mark as relevant"
                  />
                </Button>
              )}
            </Flex>
          );
        },
      },
    ],
    [intl.locale, profileTypeId],
  );
}

ProfileSearch.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const fieldId = query.fieldId as string | null | undefined;
  const petitionId = query.petitionId as string | null | undefined;
  const parentReplyId = query.parentReplyId as string | null | undefined;

  const { data } = await fetchQuery(ProfileSearch_petitionFieldDocument, {
    variables: {
      petitionId: petitionId!,
      petitionFieldId: fieldId!,
    },
  });

  const profileTypeIds = data.petitionField.options.searchIn.map(
    ({ profileTypeId }: { profileTypeId: string }) => profileTypeId,
  );

  await fetchQuery(ProfileSearch_profileTypesDocument, {
    variables: {
      filter: {
        profileTypeId: profileTypeIds,
      },
    },
  });

  return { fieldId, petitionId, profileTypeIds, parentReplyId };
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILE_SEARCH_FIELD"),
  withApolloData,
)(ProfileSearch);

const _queries = [
  gql`
    query ProfileSearch_petitionField($petitionId: GID!, $petitionFieldId: GID!) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        id
        options
        petition {
          type
        }
      }
    }
  `,
  gql`
    query ProfileSearch_profileTypes($filter: ProfileTypeFilter) {
      profileTypes(filter: $filter, limit: 100, offset: 0) {
        items {
          id
          name
          fields {
            id
            name
          }
          ...ProfileTypeReference_ProfileType
        }
        totalCount
      }
    }
    ${ProfileTypeReference.fragments.ProfileType}
  `,
  gql`
    query ProfileSearch_conflictCheckProfileSearch(
      $petitionId: GID!
      $fieldId: GID!
      $search: String!
    ) {
      conflictCheckProfileSearch(petitionId: $petitionId, fieldId: $fieldId, search: $search) {
        ...ProfileSearch_Profile
      }
    }
    ${ProfileSearch.fragments.Profile}
  `,
];

const _mutations = [
  gql`
    mutation ProfileSearch_createPetitionFieldReplies(
      $petitionId: GID!
      $fields: [CreatePetitionFieldReplyInput!]!
      $overwriteExisting: Boolean
    ) {
      createPetitionFieldReplies(
        petitionId: $petitionId
        fields: $fields
        overwriteExisting: $overwriteExisting
      ) {
        id
      }
    }
  `,
];
