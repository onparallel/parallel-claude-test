import {
  MutationHookOptions,
  useMutation,
  useQuery
} from "@apollo/react-hooks";
import { Box, Button, Flex, Icon, Input, Text } from "@chakra-ui/core";
import { selectUnit } from "@formatjs/intl-utils";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog
} from "@parallel/components/common/DialogOpenerProvider";
import { PetitionProgressBar } from "@parallel/components/common/PetitionProgressBar";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { Title } from "@parallel/components/common/Title";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { PetitionListHeader } from "@parallel/components/petitions/PetitionListHeader";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  PetitionsQuery,
  PetitionsQueryVariables,
  PetitionStatus,
  PetitionsUserQuery,
  Petitions_createPetitionMutation,
  Petitions_createPetitionMutationVariables,
  Petitions_deletePetitionsMutation,
  Petitions_deletePetitionsMutationVariables,
  Petitions_PetitionsListFragment
} from "@parallel/graphql/__types";
import { clearCache } from "@parallel/utils/apollo";
import { FORMATS } from "@parallel/utils/dates";
import {
  enums,
  integer,
  parseQuery,
  string,
  useQueryState
} from "@parallel/utils/queryState";
import { UnwrapArray } from "@parallel/utils/types";
import { useQueryData } from "@parallel/utils/useQueryData";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { ChangeEvent, KeyboardEvent, memo, useRef, useState } from "react";
import {
  FormattedDate,
  FormattedMessage,
  FormattedRelativeTime,
  useIntl
} from "react-intl";

const PAGE_SIZE = 10;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  status: enums<PetitionStatus>(["DRAFT", "SCHEDULED", "PENDING", "COMPLETED"]),
  search: string()
};

function Petitions() {
  const intl = useIntl();
  const router = useRouter();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const { me } = useQueryData<PetitionsUserQuery>(GET_PETITIONS_USER_DATA);
  const { data, loading, refetch } = useQuery<
    PetitionsQuery,
    PetitionsQueryVariables
  >(GET_PETITIONS_DATA, {
    variables: {
      offset: PAGE_SIZE * (state.page - 1),
      limit: PAGE_SIZE,
      search: state.search,
      status: state.status
    }
  });
  const [createPetition] = useCreatePetition({
    update(cache) {
      // clear caches where new item would appear
      clearCache(
        cache,
        /\$ROOT_QUERY\.petitions\(.*"status":(null|"DRAFT")[,}]/
      );
      if (state.status === null || state.status === "DRAFT") {
        refetch();
      }
    }
  });

  const [deletePetition] = useDeletePetition({
    update(cache) {
      clearCache(cache, /\$ROOT_QUERY\.petitions\(/);
      refetch();
    }
  });

  const { petitions } = data!;

  const [selected, setSelected] = useState<string[]>();
  const confirmDelete = useDialog(ConfirmDelete, [selected, petitions]);
  const askPetitionName = useDialog(AskPetitionName, [selected, petitions]);

  function handleSearchChange(value: string | null) {
    setQueryState(current => ({
      ...current,
      search: value,
      page: 1
    }));
  }

  function handleStatusChange(value: any) {
    setQueryState(current => ({
      ...current,
      status: value === "ALL" ? null : value,
      page: 1
    }));
  }

  async function handleDeleteClick() {
    try {
      await confirmDelete({
        selected: petitions.items.filter(p => selected!.includes(p.id))
      });
      await deletePetition({
        variables: { ids: selected! }
      });
    } catch {}
  }

  async function handleCreateClick() {
    try {
      const name = await askPetitionName({});
      const { data, errors } = await createPetition({
        variables: {
          name,
          locale: router.query.locale as any
        }
      });
      if (errors) {
        throw errors;
      }
      goToPetition(data!.createPetition.id, "compose");
    } catch {}
  }

  function handleRowClick(row: PetitionSelection) {
    goToPetition(
      row.id,
      ({
        DRAFT: "compose",
        SCHEDULED: "send",
        PENDING: "review",
        COMPLETED: "review"
      } as const)[row.status]
    );
  }

  function handlePageChange(page: number) {
    setQueryState(current => ({
      ...current,
      page
    }));
  }

  function goToPetition(id: string, section: "compose" | "send" | "review") {
    router.push(
      `/[locale]/app/petitions/[petitionId]/${section}`,
      `/${router.query.locale}/app/petitions/${id}/${section}`
    );
  }

  return (
    <>
      <Title>
        {intl.formatMessage({
          id: "petitions.title",
          defaultMessage: "Petitions"
        })}
      </Title>
      <AppLayout user={me}>
        <TablePage
          columns={COLUMNS}
          rows={petitions.items}
          rowKeyProp={"id"}
          selectable
          loading={loading}
          onRowClick={handleRowClick}
          header={
            <PetitionListHeader
              search={state.search}
              status={state.status}
              showActions={Boolean(selected?.length)}
              onSearchChange={handleSearchChange}
              onStatusChange={handleStatusChange}
              onDeleteClick={handleDeleteClick}
              onCreateClick={handleCreateClick}
            />
          }
          body={
            petitions.totalCount === 0 && !loading ? (
              state.search ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="petitions.no-results"
                      defaultMessage="There's no petitions matching your search"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="petitions.no-petitions"
                      defaultMessage="You have no petitions yet. Start by creating one now!"
                    />
                  </Text>
                </Flex>
              )
            ) : null
          }
          page={state.page}
          pageSize={PAGE_SIZE}
          totalCount={petitions.totalCount}
          onSelectionChange={setSelected}
          onPageChange={handlePageChange}
          margin={6}
        ></TablePage>
      </AppLayout>
    </>
  );
}

type PetitionSelection = UnwrapArray<Petitions_PetitionsListFragment["items"]>;

const COLUMNS: TableColumn<PetitionSelection>[] = [
  {
    key: "name",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.header.name"
        defaultMessage="Petition name"
      />
    )),
    Cell: memo(({ row }) => (
      <>
        {row.name || (
          <Text as="span" color="gray.400" fontStyle="italic">
            <FormattedMessage
              id="generic.untitled-petition"
              defaultMessage="Untitled petition"
            />
          </Text>
        )}
      </>
    ))
  },
  {
    key: "customRef",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.header.custom-ref"
        defaultMessage="Reference"
      />
    )),
    Cell: memo(({ row }) => <>{row.customRef}</>)
  },
  {
    key: "recipient",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.header.recipient"
        defaultMessage="Recipient"
      />
    )),
    Cell: memo(({ row }) => {
      if (row.accessess.length === 0) {
        return null;
      }
      const [{ contact }, ...rest] = row.accessess;
      if (contact) {
        const { email, fullName } = contact;
        return <Text>{fullName ? `${fullName} (${email})` : email}</Text>;
      } else {
        return null;
      }
    })
  },
  {
    key: "deadline",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.header.deadline"
        defaultMessage="Deadline"
      />
    )),
    Cell: memo(({ row: { deadline } }) => {
      if (deadline) {
        const { value, unit } = selectUnit(new Date(deadline));
        if (["second", "minute", "hour"].includes(unit)) {
          return (
            <time dateTime={deadline!}>
              <FormattedRelativeTime value={value} unit={unit} />
            </time>
          );
        } else {
          return (
            <time dateTime={deadline!}>
              <FormattedDate value={deadline} {...FORMATS.LL} />
            </time>
          );
        }
      } else {
        return (
          <Text as="span" color="gray.400" fontStyle="italic">
            <FormattedMessage
              id="petitions.no-deadline"
              defaultMessage="No deadline"
            />
          </Text>
        );
      }
    })
  },
  {
    key: "progress",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.header.progress"
        defaultMessage="Progress"
      />
    )),
    Cell: memo(({ row }) => (
      <PetitionProgressBar
        status={row.status}
        {...row.progress}
      ></PetitionProgressBar>
    ))
  },
  {
    key: "status",
    Header: memo(() => (
      <FormattedMessage id="petitions.header.status" defaultMessage="Status" />
    )),
    Cell: memo(({ row }) =>
      row.status === "PENDING" ? (
        <Text as="span" color="yellow.600" whiteSpace="nowrap">
          <Icon name="time" size="18px" marginBottom="2px" marginRight={3} />
          <FormattedMessage
            id="generic.petition-status.pending"
            defaultMessage="Pending"
          />
        </Text>
      ) : row.status === "COMPLETED" ? (
        <Text color="green.500" whiteSpace="nowrap">
          <Icon name="check" size="18px" marginBottom="2px" marginRight={3} />
          <FormattedMessage
            id="generic.petition-status.completed"
            defaultMessage="Completed"
          />
        </Text>
      ) : row.status === "SCHEDULED" ? (
        <Text as="span" color="blue.500" whiteSpace="nowrap">
          <Box
            display="inline-block"
            position="relative"
            width="26px"
            height="18px"
            marginRight={1}
            marginBottom="-2px"
          >
            <Icon
              name={"paper-plane" as any}
              size="16px"
              position="absolute"
              left="0"
              top="0"
            />
            <Box
              position="absolute"
              right={0}
              bottom={0}
              borderRadius="100%"
              width="14px"
              height="14px"
              backgroundColor="white"
            >
              <Icon name="time" size="14px" position="absolute" />
            </Box>
          </Box>
          <FormattedMessage
            id="generic.petition-status.scheduled"
            defaultMessage="Scheduled"
          />
        </Text>
      ) : row.status === "DRAFT" ? (
        <Text as="span" color="gray.500" whiteSpace="nowrap">
          <Icon name="edit" size="18px" marginBottom="2px" marginRight={3} />
          <FormattedMessage
            id="generic.petition-status.draft"
            defaultMessage="Draft"
          />
        </Text>
      ) : null
    )
  }
];

function useCreatePetition(
  options?: MutationHookOptions<
    Petitions_createPetitionMutation,
    Petitions_createPetitionMutationVariables
  >
) {
  return useMutation<
    Petitions_createPetitionMutation,
    Petitions_createPetitionMutationVariables
  >(
    gql`
      mutation Petitions_createPetition(
        $name: String!
        $locale: PetitionLocale!
      ) {
        createPetition(name: $name, locale: $locale) {
          id
        }
      }
    `,
    options
  );
}

function useDeletePetition(
  options?: MutationHookOptions<
    Petitions_deletePetitionsMutation,
    Petitions_deletePetitionsMutationVariables
  >
) {
  return useMutation<
    Petitions_deletePetitionsMutation,
    Petitions_deletePetitionsMutationVariables
  >(
    gql`
      mutation Petitions_deletePetitions($ids: [ID!]!) {
        deletePetitions(ids: $ids)
      }
    `,
    options
  );
}

function ConfirmDelete({
  selected,
  ...props
}: {
  selected: PetitionSelection[];
} & DialogCallbacks<void>) {
  const count = selected.length;
  const name = selected.length && selected[0].name;
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petitions.confirm-delete.header"
          defaultMessage="Delete petitions"
        />
      }
      body={
        <FormattedMessage
          id="petitions.confirm-delete.body"
          defaultMessage="Are you sure you want to delete {count, plural, =1 {<b>{name}</b>} other {the <b>#</b> selected petitions}}?"
          values={{
            count,
            name,
            b: (...chunks: any[]) => <b>{chunks}</b>
          }}
        />
      }
      confirm={
        <Button variantColor="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petitions.confirm-delete.confirm-button"
            defaultMessage="Yes, delete"
          />
        </Button>
      }
      {...props}
    />
  );
}

function AskPetitionName(props: DialogCallbacks<string>) {
  const [name, setName] = useState("");
  const intl = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  function handleInputKeyPress(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && name.length > 0) {
      props.onResolve(name);
    }
  }

  return (
    <ConfirmDialog
      focusRef={inputRef}
      header={
        <FormattedMessage
          id="petitions.create-new-petition.header"
          defaultMessage="Create a new petition"
        />
      }
      body={
        <Box>
          <Text>
            <FormattedMessage
              id="petitions.create-new-petition.body"
              defaultMessage="Give your new petition a name"
            />
          </Text>
          <Input
            ref={inputRef}
            value={name}
            placeholder={intl.formatMessage({
              id: "generic.untitled-petition",
              defaultMessage: "Untitled petition"
            })}
            onChange={handleInputChange}
            onKeyPress={handleInputKeyPress}
            marginTop={2}
          />
        </Box>
      }
      confirm={
        <Button
          isDisabled={name.length === 0}
          variantColor="purple"
          onClick={() => props.onResolve(name)}
        >
          <FormattedMessage
            id="petitions.create-new-petition.continue-button"
            defaultMessage="Continue"
          />
        </Button>
      }
      {...props}
    />
  );
}

Petitions.fragments = {
  petitions: gql`
    fragment Petitions_PetitionsList on PetitionPagination {
      items {
        id
        customRef
        name
        status
        deadline
        progress {
          validated
          replied
          optional
          total
        }
        accessess {
          contact {
            id
            fullName
            email
          }
        }
      }
      totalCount
    }
  `,
  user: gql`
    fragment Petitions_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.user}
  `
};

const GET_PETITIONS_DATA = gql`
  query Petitions(
    $offset: Int!
    $limit: Int!
    $search: String
    $status: PetitionStatus
  ) {
    petitions(
      offset: $offset
      limit: $limit
      search: $search
      status: $status
    ) {
      ...Petitions_PetitionsList
    }
  }
  ${Petitions.fragments.petitions}
`;

const GET_PETITIONS_USER_DATA = gql`
  query PetitionsUser {
    me {
      ...Petitions_User
    }
  }
  ${Petitions.fragments.user}
`;

Petitions.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  const { page, search, status } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    apollo.query<PetitionsQuery, PetitionsQueryVariables>({
      query: GET_PETITIONS_DATA,
      variables: {
        offset: PAGE_SIZE * (page - 1),
        limit: PAGE_SIZE,
        search,
        status
      }
    }),
    apollo.query<PetitionsUserQuery>({ query: GET_PETITIONS_USER_DATA })
  ]);
};

export default withData(Petitions);
