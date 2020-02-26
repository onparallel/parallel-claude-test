import { useQuery } from "@apollo/react-hooks";
import {
  Box,
  Button,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text
} from "@chakra-ui/core";
import { selectUnit } from "@formatjs/intl-utils";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { useDialog } from "@parallel/components/common/DialogProvider";
import { PetitionProgressBar } from "@parallel/components/common/PetitionProgressBar";
import { PetitionStatusFilter } from "@parallel/components/common/PetitionStatusFilter";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { Spacer } from "@parallel/components/common/Spacer";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { Title } from "@parallel/components/common/Title";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  PetitionsQuery,
  PetitionsQueryVariables,
  PetitionStatus,
  PetitionsUserQuery,
  Petitions_PetitionsListFragment
} from "@parallel/graphql/__types";
import {
  enums,
  integer,
  parseQuery,
  string,
  useQueryState
} from "@parallel/utils/queryState";
import { ExtractArrayGeneric } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useQueryData } from "@parallel/utils/useQueryData";
import { gql } from "apollo-boost";
import { ChangeEvent, memo, useState } from "react";
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
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [search, setSearch] = useState(state.search);
  const setSearchState = useDebouncedCallback(
    (value: string) => setQueryState({ search: value?.length ? value : null }),
    300,
    []
  );
  const { me } = useQueryData<PetitionsUserQuery>(GET_PETITIONS_USER_DATA);
  const { data, loading } = useQuery<PetitionsQuery, PetitionsQueryVariables>(
    GET_PETITIONS_DATA,
    {
      variables: {
        offset: PAGE_SIZE * (state.page - 1),
        limit: PAGE_SIZE,
        search: state.search,
        status: state.status
      }
    }
  );
  const { petitions } = data!;

  const [selected, setSelected] = useState<string[]>();
  const openDialog = useDialog();

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSearch(value);
    setSearchState(value);
  }

  function handleFilterStatusChange(value: any) {
    setQueryState({ ...state, status: value === "ALL" ? null : value }); // go to page 1
  }

  async function handleDeleteClick() {
    const count = selected?.length ?? 0;
    const name =
      selected?.length && petitions.items.find(p => p.id === selected[0])?.name;
    try {
      await openDialog(dialog => (
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
            <FormattedMessage
              id="petitions.confirm-delete.confirm-button"
              defaultMessage="Yes, delete"
            />
          }
          confirmButtonProps={{ variantColor: "red" }}
          {...dialog}
        />
      ));
      // continue
    } catch {}
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
          header={
            <Stack direction="row" padding={4}>
              <Box flex="0 1 400px">
                <SearchInput
                  value={search ?? ""}
                  onChange={handleSearchChange}
                />
              </Box>
              <PetitionStatusFilter
                value={state.status ?? "ALL"}
                onChange={handleFilterStatusChange}
              />
              <Spacer />
              {selected?.length ? (
                <Box>
                  <Menu>
                    <MenuButton as={Button} {...{ rightIcon: "chevron-down" }}>
                      Actions
                    </MenuButton>
                    <MenuList minWidth="160px">
                      <MenuItem onClick={handleDeleteClick}>
                        <Icon name="delete" marginRight={2} />
                        <FormattedMessage
                          id="petitions.delete-label"
                          defaultMessage="Delete {count, plural, =1 {petition} other {# petitions}}"
                          values={{ count: selected?.length }}
                        />
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Box>
              ) : null}
              <Button variantColor="purple">
                <FormattedMessage
                  id="petitions.create-petition-button"
                  defaultMessage="Create petition"
                />
              </Button>
            </Stack>
          }
          page={state.page}
          pageSize={PAGE_SIZE}
          totalCount={petitions.totalCount}
          onSelectionChange={setSelected}
          onPageChange={page => setQueryState({ page, search })}
          flex="1"
          margin={6}
        ></TablePage>
      </AppLayout>
    </>
  );
}

type PetitionSelection = ExtractArrayGeneric<
  Petitions_PetitionsListFragment["items"]
>;

const COLUMNS: TableColumn<PetitionSelection>[] = [
  {
    key: "name",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.header.name"
        defaultMessage="Petition name"
      />
    )),
    Cell: memo(({ row }) => <>{row.name}</>)
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
              <FormattedDate
                value={deadline}
                day="numeric"
                month="long"
                year="numeric"
                hour12={false}
              />
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
