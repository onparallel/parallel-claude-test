import { Box, Heading, Text } from "@chakra-ui/react";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { TableColumn } from "@parallel/components/common/Table";
import { ProfileType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { noop } from "remeda";
import { TablePage } from "../common/TablePage";

type FakeProfilesType = {
  id: string;
  name: string;
  createdAt: string;
  relationship: string;
  profileType: ProfileType;
};

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
] as FakeProfilesType[];

export function FakeProfileTables({ me }: { me: any }) {
  const columnsProfiles = useFakeProfileTableColumns();
  return (
    <>
      <TablePage
        flex="0 1 auto"
        minHeight="200px"
        columns={columnsProfiles}
        rows={fakeProfilesItems}
        rowKeyProp="id"
        context={me}
        isHighlightable
        loading={false}
        onRowClick={noop}
        page={1}
        pageSize={10}
        totalCount={fakeProfilesItems.length}
        onPageChange={noop}
        onPageSizeChange={noop}
        onSortChange={noop}
        header={
          <Box paddingX={4} paddingY={3}>
            <Heading size="md">
              <FormattedMessage
                id="component.app-layout-navbar.profiles-link"
                defaultMessage="Profiles"
              />
            </Heading>
          </Box>
        }
        body={null}
      />
    </>
  );
}

function useFakeProfileTableColumns(): TableColumn<FakeProfilesType>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        header: intl.formatMessage({
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
        header: intl.formatMessage({
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
        header: intl.formatMessage({
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
              {localizableUserTextRender({
                value: name,
                intl,
                default: intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                }),
              })}
            </Text>
          );
        },
      },
    ],
    [intl.locale]
  );
}
