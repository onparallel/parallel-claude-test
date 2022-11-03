import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { TableColumn } from "@parallel/components/common/Table";
import { nanoid } from "nanoid";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { TablePage } from "../common/TablePage";

const fakeData = [
  {
    id: nanoid(),
    data: "A",
  },
  {
    id: nanoid(),
    data: "B",
  },
  {
    id: nanoid(),
    data: "C",
  },
];

export function PreviewFactivaTable({
  name,
  date,
  onRowClick,
  onResetClick,
}: {
  name: string;
  date: string;
  onRowClick: (id: string) => void;
  onResetClick: () => void;
}) {
  const columns = useDowJonesFactivaDataColumns();

  const context = useMemo(() => ({}), []);

  return (
    <TablePage
      isHighlightable
      columns={columns}
      context={context}
      rows={fakeData as any[]}
      rowKeyProp="id"
      page={1}
      pageSize={10}
      loading={false}
      totalCount={fakeData.length}
      onSelectionChange={() => {}}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
      onSortChange={() => {}}
      onRowClick={onRowClick}
      header={
        <Flex
          direction={{ base: "column", sm: "row" }}
          gridGap={3}
          paddingX={4}
          paddingY={2}
          justifyContent={"space-between"}
        >
          <HStack spacing={0} gridGap={3} wrap="wrap">
            <Text>
              <Text as="span" fontWeight={600}>
                <FormattedMessage
                  id="component.preview-factiva-table.searching-for"
                  defaultMessage="Searching for"
                />
                {": "}
              </Text>
              <Text as="span" whiteSpace="nowrap">
                {name}
              </Text>
            </Text>
            <Text>
              <Text as="span" fontWeight={600}>
                <FormattedMessage
                  id="component.preview-factiva-table.date-of-birth"
                  defaultMessage="Date of birth"
                />
                {": "}
              </Text>
              <Text as="span" whiteSpace="nowrap">
                {date}
              </Text>
            </Text>
          </HStack>

          <Box>
            <Button variant="outline" onClick={onResetClick}>
              Modificar búsqueda
            </Button>
          </Box>
        </Flex>
      }
    />
  );
}

function useDowJonesFactivaDataColumns() {
  const intl = useIntl();

  return useMemo<TableColumn<any>[]>(
    () => [
      {
        key: "tags",
        header: "",
        CellContent: ({ row }) => {
          return "TAGS" as any;
        },
      },
      {
        key: "profileId",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.profile-id",
          defaultMessage: "Profile id",
        }),
        CellContent: ({ row }) => {
          return "some id";
        },
      },
      {
        key: "name",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => {
          return "Name";
        },
      },
      {
        key: "gender",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.gender",
          defaultMessage: "Gender",
        }),
        CellContent: ({ row }) => {
          return "MALE";
        },
      },
      {
        key: "dateOfBirth",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.date-of-birth",
          defaultMessage: "Date of birth",
        }),
        CellContent: ({ row }) => {
          return "Mar 15, 1933";
        },
      },
      {
        key: "country",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.country-territory",
          defaultMessage: "Country/Territory",
        }),
        CellContent: ({ row }) => {
          return "Belgium";
        },
      },
      {
        key: "subsidiary",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.subsidiary",
          defaultMessage: "Subsidiary",
        }),
        CellContent: ({ row }) => {
          return "N/A";
        },
      },
      {
        key: "details",
        header: intl.formatMessage({
          id: "component.preview-factiva-table.details",
          defaultMessage: "Details",
        }),
        CellContent: ({ row }) => {
          return "";
        },
      },
    ],
    [intl.locale]
  );
}
