import { gql } from "@apollo/client";
import { Box, Center, Text } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { ExternalLink } from "@parallel/components/common/ExternalLink";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { BackgroundCheckEntityDetailsDatasets_BackgroundCheckEntityDetailsDatasetFragment } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function BackgroundCheckEntityDetailsDatasets({
  datasets,
}: {
  datasets: BackgroundCheckEntityDetailsDatasets_BackgroundCheckEntityDetailsDatasetFragment[];
}) {
  const datasetsColumns = useBackgroundCheckDatasetsColumns();

  return (
    <Card>
      <CardHeader omitDivider={datasets?.length > 0}>
        <Text as="span" fontWeight={600} fontSize="xl">
          <FormattedMessage
            id="component.background-check-entity-details-datasets.data-sources"
            defaultMessage="Data sources"
          />{" "}
          {`(${datasets?.length ?? 0})`}
        </Text>
      </CardHeader>
      {datasets?.length ? (
        <Box overflowX="auto">
          <Table columns={datasetsColumns} rows={datasets} rowKeyProp="name" />
        </Box>
      ) : (
        <Center height="120px" textAlign="center">
          <Text>
            <FormattedMessage
              id="component.background-check-entity-details-datasets.no-data-sources-found-message"
              defaultMessage="We have not found any data sources for this entity."
            />
          </Text>
        </Center>
      )}
    </Card>
  );
}

const _fragments = {
  BackgroundCheckEntityDetailsDataset: gql`
    fragment BackgroundCheckEntityDetailsDatasets_BackgroundCheckEntityDetailsDataset on BackgroundCheckEntityDetailsDataset {
      name
      title
      summary
      url
    }
  `,
};

function useBackgroundCheckDatasetsColumns() {
  const intl = useIntl();

  return useMemo<
    TableColumn<
      BackgroundCheckEntityDetailsDatasets_BackgroundCheckEntityDetailsDatasetFragment,
      {}
    >[]
  >(
    () => [
      {
        key: "title",
        label: intl.formatMessage({
          id: "component.background-check-entity-details-datasets.source",
          defaultMessage: "Source",
        }),
        CellContent: ({ row }) => {
          return row.url ? (
            <ExternalLink href={row.url} title={row.url} hideIcon>
              <Text as="span">{row.title}</Text>
              <ExternalLinkIcon marginStart={1.5} marginBottom={0.5} />
            </ExternalLink>
          ) : (
            <Text>{row.title}</Text>
          );
        },
      },
      {
        key: "summary",
        label: intl.formatMessage({
          id: "component.background-check-entity-details-datasets.description",
          defaultMessage: "Description",
        }),

        CellContent: ({ row }) => {
          return <Text>{row.summary}</Text>;
        },
      },
    ],
    [intl.locale],
  );
}
