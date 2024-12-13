import { gql } from "@apollo/client";
import { Box, Center, Stack, useBreakpointValue } from "@chakra-ui/react";
import { DashboardProfilesPieChartModule_DashboardProfilesPieChartModuleFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { DashboardChartLegend } from "../charts/DashboardChartLegend";
import { DashboardDoughnutChart } from "../charts/DashboardDoughnutChart";
import { DashboardPieChart } from "../charts/DashboardPieChart";
import { DashboardModuleAlertIncongruent } from "../shared/DashboardModuleAlertIncongruent";
import { DashboardModuleCard } from "../shared/DashboardModuleCard";
import { DashboardModuleSpinner } from "../shared/DashboardModuleSpinner";

export function DashboardProfilesPieChartModule({
  module,
}: {
  module: DashboardProfilesPieChartModule_DashboardProfilesPieChartModuleFragment;
}) {
  const data = {
    datasets: [
      {
        data: module.profilesPieChartResult?.value ?? [],
        backgroundColor: module.profilesPieChartSettings?.colors ?? [],
        borderColor: "white",
        hoverBackgroundColor: module.profilesPieChartSettings?.colors ?? [],
        hoverBorderColor: "white",
      },
    ],
    labels: module.profilesPieChartSettings?.labels ?? [],
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
        module.profilesPieChartResult?.isIncongruent ? (
          <DashboardModuleAlertIncongruent />
        ) : undefined
      }
      rows={rows}
    >
      {isNonNullish(module.profilesPieChartResult) ? (
        <Stack
          direction={{ base: "column", md: "row" }}
          alignItems="stretch"
          spacing={{ base: 2, md: 8 }}
          flex="1"
          minHeight={0}
        >
          <Center>
            <Box position="relative" boxSize={`${chartSize}px`}>
              {module.profilesPieChartSettings?.graphicType === "DOUGHNUT" ? (
                <DashboardDoughnutChart data={data} />
              ) : (
                <DashboardPieChart data={data} />
              )}
            </Box>
          </Center>
          <DashboardChartLegend data={data} />
        </Stack>
      ) : (
        <DashboardModuleSpinner />
      )}
    </DashboardModuleCard>
  );
}

DashboardProfilesPieChartModule.fragments = {
  get DashboardProfilesPieChartModule() {
    return gql`
      fragment DashboardProfilesPieChartModule_DashboardProfilesPieChartModule on DashboardProfilesPieChartModule {
        id
        size
        title
        profilesPieChartResult: result {
          value
          isIncongruent
        }
        profilesPieChartSettings: settings {
          graphicType
          labels
          colors
        }
      }
    `;
  },
};
