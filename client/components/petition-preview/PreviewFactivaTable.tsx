import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { ArrowBackIcon } from "@parallel/chakra/icons";
import { TableColumn } from "@parallel/components/common/Table";
import { nanoid } from "nanoid";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Card } from "../common/Card";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
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

export function PreviewFactivaTable({ name, date }: { name: string; date: string }) {
  const intl = useIntl();
  const columns = useDowJonesFactivaDataColumns();

  const [details, setDetails] = useState<any>(null);

  const handleRowClick = (data: any) => {
    setDetails(data);
  };

  const context = useMemo(() => ({}), []);

  if (details) {
    return (
      <Card>
        <HStack padding={4} borderBottom="1px solid" borderColor="gray.200">
          <IconButtonWithTooltip
            icon={<ArrowBackIcon />}
            variant="ghost"
            label={intl.formatMessage({
              id: "generic.go-back",
              defaultMessage: "Go back",
            })}
            onClick={() => setDetails(null)}
          />{" "}
          <Heading size="md">{details.id}</Heading>
        </HStack>
        <Stack padding={4}>
          <Text>{details.data}</Text>
        </Stack>
      </Card>
    );
  }

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
      onRowClick={handleRowClick}
      header={
        <Box padding={4}>
          <Text as="span" fontWeight={600}>
            <FormattedMessage
              id="component.preview-factiva-table.searching-for"
              defaultMessage="Searching for"
            />
            {": "}
          </Text>
          <Text as="span">{name}</Text>

          <Text as="span" marginLeft={4} fontWeight={600}>
            <FormattedMessage
              id="component.preview-factiva-table.date-of-birth"
              defaultMessage="Date of birth"
            />
            {": "}
          </Text>
          <Text as="span">{date}</Text>
        </Box>
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
