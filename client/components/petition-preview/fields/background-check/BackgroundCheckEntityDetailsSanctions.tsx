import { gql } from "@apollo/client";
import { Box, Center, Link, Text } from "@chakra-ui/react";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { BackgroundCheckEntityDetailsSanctions_BackgroundCheckEntityDetailsSanctionFragment } from "@parallel/graphql/__types";
import { formatPartialDate } from "@parallel/utils/formatPartialDate";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

export function BackgroundCheckEntityDetailsSanctions({
  sanctions,
}: {
  sanctions: BackgroundCheckEntityDetailsSanctions_BackgroundCheckEntityDetailsSanctionFragment[];
}) {
  const sanctionsColumns = useBackgroundCheckSanctionsColumns();

  return (
    <Card>
      <CardHeader omitDivider={sanctions?.length > 0}>
        <Text as="span" fontWeight={600} fontSize="xl">
          <FormattedMessage
            id="component.background-check-entity-details-sanctions.sanction-lists"
            defaultMessage="Sanction lists"
          />{" "}
          {`(${sanctions?.length || 0})`}
        </Text>
      </CardHeader>
      {sanctions?.length ? (
        <Box overflowX="auto">
          <Table
            isHighlightable
            columns={sanctionsColumns}
            rows={
              sanctions as BackgroundCheckEntityDetailsSanctions_BackgroundCheckEntityDetailsSanctionFragment[]
            }
            rowKeyProp="id"
          />
        </Box>
      ) : (
        <Center height="120px" textAlign="center">
          <Text>
            <FormattedMessage
              id="component.background-check-entity-details-sanctions.no-sanctions-found-message"
              defaultMessage="We have not found this entity on any sanctions list"
            />
          </Text>
        </Center>
      )}
    </Card>
  );
}

BackgroundCheckEntityDetailsSanctions.fragments = {
  get BackgroundCheckEntityDetailsSanction() {
    return gql`
      fragment BackgroundCheckEntityDetailsSanctions_BackgroundCheckEntityDetailsSanction on BackgroundCheckEntityDetailsSanction {
        id
        type
        datasets {
          title
        }
        properties {
          authority
          startDate
          endDate
          program
          sourceUrl
        }
      }
    `;
  },
};

function useBackgroundCheckSanctionsColumns() {
  const intl = useIntl();

  return useMemo<
    TableColumn<BackgroundCheckEntityDetailsSanctions_BackgroundCheckEntityDetailsSanctionFragment>[]
  >(
    () => [
      {
        key: "authority",
        label: intl.formatMessage({
          id: "page.background-check-profile-details.authority",
          defaultMessage: "List name / Authority",
        }),
        CellContent: ({ row }) => {
          const properties = row.properties ?? {};

          const authorities = properties.authority
            ? intl.formatList(properties.authority, { type: "conjunction" })
            : "-";
          const datasets =
            row.datasets && row.datasets.length > 0
              ? intl.formatList(
                  row.datasets.map(({ title }) => title),
                  { type: "conjunction" },
                )
              : null;

          return <>{`${[datasets, authorities].filter(isNonNullish).join(" / ")}`}</>;
        },
      },
      {
        key: "program",
        label: intl.formatMessage({
          id: "page.background-check-profile-details.program",
          defaultMessage: "Program",
        }),

        CellContent: ({ row }) => {
          const properties = row.properties ?? {};
          return (
            <>{properties.program?.map((program, i) => <Text key={i}>{program}</Text>) ?? "-"}</>
          );
        },
      },
      {
        key: "sources",
        label: intl.formatMessage({
          id: "page.background-check-profile-details.sources",
          defaultMessage: "Sources",
        }),
        cellProps: {
          whiteSpace: "nowrap",
          minWidth: "120px",
        },
        CellContent: ({ row }) => {
          const properties = row.properties ?? {};
          return (
            <>
              {properties.sourceUrl?.map((url, i) => (
                <Link key={i} isExternal href={url}>
                  [{i + 1}]
                </Link>
              ))}
            </>
          );
        },
      },
      {
        key: "from",
        label: intl.formatMessage({
          id: "page.background-check-profile-details.from",
          defaultMessage: "From",
        }),
        cellProps: {
          whiteSpace: "nowrap",
          minWidth: "160px",
        },
        CellContent: ({ row }) => {
          const properties = row.properties ?? {};
          return (
            <>
              {properties.startDate?.map((date, i) => (
                <Text key={i}>{formatPartialDate({ date, intl })}</Text>
              )) ?? "-"}
            </>
          );
        },
      },
      {
        key: "to",
        label: intl.formatMessage({
          id: "page.background-check-profile-details.to",
          defaultMessage: "To",
        }),
        cellProps: {
          whiteSpace: "nowrap",
          width: "180px",
        },
        CellContent: ({ row }) => {
          const properties = row.properties ?? {};
          return (
            <>
              {properties.endDate?.map((date, i) => (
                <Text key={i}>{formatPartialDate({ date, intl })}</Text>
              )) ?? "-"}
            </>
          );
        },
      },
    ],
    [intl.locale],
  );
}
