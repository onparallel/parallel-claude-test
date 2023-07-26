import { gql } from "@apollo/client";
import { Center, HStack, Heading, Image, Stack, Text } from "@chakra-ui/react";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { TableColumn } from "@parallel/components/common/Table";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { noop } from "remeda";
import {
  LocalizableUserText,
  LocalizableUserTextRender,
} from "../common/LocalizableUserTextRender";
import { TablePage } from "../common/TablePage";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
};

export function ProfileRelationshipsTable({}: {}) {
  const [state, setQueryState] = useQueryState(QUERY_STATE, { prefix: "r_" });
  const columns = useProfileRelationshipsTableColumns();
  const rows = process.env.NEXT_PUBLIC_ENVIRONMENT === "staging" ? fakeProfilesItems : [];

  return (
    <TablePage
      flex="1 1 auto"
      minHeight={0}
      rowKeyProp="id"
      isHighlightable
      loading={false}
      columns={columns}
      rows={rows}
      onRowClick={noop}
      page={state.page}
      pageSize={state.items}
      totalCount={rows.length}
      onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
      onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items: items as any, page: 1 }))}
      onSortChange={noop}
      header={
        <HStack paddingX={4} paddingY={2} height={14}>
          <Heading size="md">
            <FormattedMessage
              id="component.profile-relationships-table.header"
              defaultMessage="Profiles"
            />
          </Heading>
        </HStack>
      }
      body={
        rows.length === 0 ? (
          <Center minHeight="150px" height="full">
            <Stack spacing={1} align="center">
              <Image
                maxWidth="120px"
                height="108px"
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/reports/under-construction.svg`}
              />
              <Text color="gray.600">
                <FormattedMessage
                  id="component.profile-relationships-table.comming-soon"
                  defaultMessage="Relationships between profiles coming soon."
                />
              </Text>
            </Stack>
          </Center>
        ) : null
      }
    />
  );
}
function useProfileRelationshipsTableColumns(): TableColumn<ProfileRelationship>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        label: intl.formatMessage({
          id: "generic.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "40%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return (
            <OverflownText>
              {row.name ||
                intl.formatMessage({
                  id: "generic.unnamed-profile",
                  defaultMessage: "Unnamed profile",
                })}
            </OverflownText>
          );
        },
      },
      {
        key: "relationship",
        label: intl.formatMessage({
          id: "component.profile-table-columns.relationship",
          defaultMessage: "Relationship",
        }),
        cellProps: {
          width: "30%",
          minWidth: "240px",
        },
        CellContent: ({ row: { relationship } }) => {
          return <Text as="span">{relationship}</Text>;
        },
      },
      {
        key: "type",
        label: intl.formatMessage({
          id: "component.profile-table-columns.profile-type",
          defaultMessage: "Profile type",
        }),
        cellProps: {
          width: "30%",
          minWidth: "240px",
        },
        CellContent: ({
          row: {
            profileType: { name },
          },
        }) => {
          return (
            <Text as="span">
              <LocalizableUserTextRender
                value={name}
                default={intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                })}
              />
            </Text>
          );
        },
      },
    ],
    [intl.locale],
  );
}

interface ProfileRelationship {
  id: string;
  name: string;
  createdAt: string;
  relationship: string;
  profileType: { id: string; name: LocalizableUserText };
}

const fakeProfilesItems = [
  {
    id: "1",
    name: "Susana Martínez",
    createdAt: "2023-05-18",
    relationship: "Representante legal",
    profileType: {
      id: "1",
      name: {
        en: "Individual",
        es: "Persona física",
      },
    },
  },
  {
    id: "2",
    name: "Contrato de prestación de servicios - BeWing, S.L.",
    createdAt: "2023-05-19",
    relationship: "Contrato",
    profileType: {
      id: "2",
      name: {
        en: "Contract",
        es: "Contrato",
      },
    },
  },
  {
    id: "3",
    name: "Non-disclosure agreement - BeWing, S.L.",
    createdAt: "2023-05-19",
    relationship: "Contrato",
    profileType: {
      id: "2",
      name: {
        en: "Contract",
        es: "Contrato",
      },
    },
  },
] as ProfileRelationship[];

const _fragments = {
  Profile: gql`
    fragment ProfileRelationshipsTable_Profile on Profile {
      id
      name
    }
  `,
};

ProfileRelationshipsTable.fragments = {
  Profile: _fragments.Profile,
};

const _mutations = [];

const _queries = [];
