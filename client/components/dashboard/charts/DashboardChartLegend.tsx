import { Grid, GridItem, Square, Stack, Text } from "@chakra-ui/react";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import { Fragment } from "react";
import { FormattedMessage } from "react-intl";
import { DashboardNumberValue } from "../shared/DashboardNumberValue";

export interface DashboardChartLegendChartData {
  datasets: {
    data: number[];
    backgroundColor: string[];
  }[];
  labels?: string[];
}

export function DashboardChartLegend({ data }: { data: DashboardChartLegendChartData }) {
  const total = data.datasets.flatMap((dataset) => dataset.data).reduce((a, b) => a + b, 0);

  const reducedData = data.datasets.reduce((acc, dataset) => {
    dataset.data.forEach((value, index) => {
      acc[index] = (acc[index] ?? 0) + value;
    });
    return acc;
  }, [] as number[]);

  return (
    <Stack flex="1">
      <Text>
        <FormattedMessage
          id="component.dashboard-chart-legend.total"
          defaultMessage="Total {count}"
          values={{
            count: (
              <Text as="span" fontWeight={600}>
                {total}
              </Text>
            ),
          }}
        />
      </Text>
      <ScrollShadows flex={1} direction="vertical" overflowY="auto">
        <Grid
          gap={2}
          columnGap={3}
          templateColumns={`auto 1fr auto ${total !== 0 ? "auto" : ""}`}
          alignItems="center"
          paddingEnd={2}
          overflow="hidden"
        >
          {data.labels?.map((label = "", index) => {
            const value = reducedData[index];
            const backgroundColor = data.datasets[0].backgroundColor[index];
            return (
              <Fragment key={index}>
                <GridItem>
                  <Square size={4} backgroundColor={backgroundColor} borderRadius="4px" />
                </GridItem>
                <GridItem minWidth={0}>
                  <OverflownText>{label}</OverflownText>
                </GridItem>
                <GridItem textAlign="end">
                  <DashboardNumberValue value={value} fontSize="xl" fontWeight={600} />
                </GridItem>
                {total === 0 ? null : (
                  <GridItem textAlign="end">
                    <Text as="span" fontSize="sm" fontWeight={400}>
                      <DashboardNumberValue value={value / total} isPercentage />
                    </Text>
                  </GridItem>
                )}
              </Fragment>
            );
          })}
        </Grid>
      </ScrollShadows>
    </Stack>
  );
}
