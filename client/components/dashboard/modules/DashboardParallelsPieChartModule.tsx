import { gql } from "@apollo/client";
import { Center, Stack, useBreakpointValue } from "@chakra-ui/react";

import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import { DashboardParallelsPieChartModule_DashboardParallelsPieChartModuleFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { DashboardChartLegend } from "../charts/DashboardChartLegend";
import { DashboardDoughnutChart } from "../charts/DashboardDoughnutChart";
import { DashboardPieChart } from "../charts/DashboardPieChart";
import { DashboardModuleAlertIncongruent } from "../shared/DashboardModuleAlertIncongruent";
import { DashboardModuleCard } from "../shared/DashboardModuleCard";
import { DashboardModuleSpinner } from "../shared/DashboardModuleSpinner";

export function DashboardParallelsPieChartModule({
  module,
}: {
  module: DashboardParallelsPieChartModule_DashboardParallelsPieChartModuleFragment;
}) {
  const data = {
    datasets: [
      {
        data: module.parallelsPieChartResult?.value ?? [],
        backgroundColor: module.parallelsPieChartSettings?.colors ?? [],
      },
    ],
    labels: module.parallelsPieChartSettings?.labels ?? [],
  };

  const rows = useBreakpointValue({ base: 4, md: 2, lg: module.size === "LARGE" ? 3 : 2 });
  const chartSize = useBreakpointValue({
    base: 300,
    md: 207,
    lg: module.size === "LARGE" ? 353 : 207,
  });
  return (
    <DashboardModuleCard
      module={module}
      headerAddon={
        module.parallelsPieChartResult?.isIncongruent ? (
          <DashboardModuleAlertIncongruent />
        ) : undefined
      }
      rows={rows}
    >
      {isNonNullish(module.parallelsPieChartResult) ? (
        <Stack
          direction={{ base: "column", md: "row" }}
          alignItems="stretch"
          spacing={{ base: 2, md: 8 }}
          flex="1"
          minHeight={0}
        >
          <Center>
            <Center position="relative" boxSize={`${chartSize}px`}>
              {module.parallelsPieChartSettings?.graphicType === "DOUGHNUT" ? (
                <DashboardDoughnutChart data={data} />
              ) : (
                <DashboardPieChart data={data} />
              )}
            </Center>
          </Center>
          <ScrollShadows flex={1} direction="vertical" overflowY="auto">
            <DashboardChartLegend data={data} />
          </ScrollShadows>
        </Stack>
      ) : (
        <DashboardModuleSpinner />
      )}
    </DashboardModuleCard>
  );
}

DashboardParallelsPieChartModule.fragments = {
  get DashboardParallelsPieChartModule() {
    return gql`
      fragment DashboardParallelsPieChartModule_DashboardParallelsPieChartModule on DashboardParallelsPieChartModule {
        id
        title
        size
        parallelsPieChartResult: result {
          value
          isIncongruent
        }
        parallelsPieChartSettings: settings {
          graphicType
          labels
          colors
        }
      }
    `;
  },
};
