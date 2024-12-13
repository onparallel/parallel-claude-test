import { gql } from "@apollo/client";
import { Box, Center, Stack, useBreakpointValue } from "@chakra-ui/react";

import { DashboardPetitionsPieChartModule_DashboardPetitionsPieChartModuleFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { DashboardChartLegend } from "../charts/DashboardChartLegend";
import { DashboardDoughnutChart } from "../charts/DashboardDoughnutChart";
import { DashboardPieChart } from "../charts/DashboardPieChart";
import { DashboardModuleAlertIncongruent } from "../shared/DashboardModuleAlertIncongruent";
import { DashboardModuleCard } from "../shared/DashboardModuleCard";
import { DashboardModuleSpinner } from "../shared/DashboardModuleSpinner";

export function DashboardPetitionsPieChartModule({
  module,
}: {
  module: DashboardPetitionsPieChartModule_DashboardPetitionsPieChartModuleFragment;
}) {
  const data = {
    datasets: [
      {
        data: module.petitionsPieChartResult?.value ?? [],
        backgroundColor: module.petitionsPieChartSettings?.colors ?? [],
        hoverBackgroundColor: module.petitionsPieChartSettings?.colors ?? [],
        borderColor: "white",
        hoverBorderColor: "white",
      },
    ],
    labels: module.petitionsPieChartSettings?.labels ?? [],
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
        module.petitionsPieChartResult?.isIncongruent ? (
          <DashboardModuleAlertIncongruent />
        ) : undefined
      }
      rows={rows}
    >
      {isNonNullish(module.petitionsPieChartResult) ? (
        <Stack
          direction={{ base: "column", md: "row" }}
          alignItems="stretch"
          spacing={{ base: 2, md: 8 }}
          flex="1"
          minHeight={0}
        >
          <Center>
            <Box position="relative" boxSize={`${chartSize}px`}>
              {module.petitionsPieChartSettings?.graphicType === "DOUGHNUT" ? (
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

DashboardPetitionsPieChartModule.fragments = {
  get DashboardPetitionsPieChartModule() {
    return gql`
      fragment DashboardPetitionsPieChartModule_DashboardPetitionsPieChartModule on DashboardPetitionsPieChartModule {
        id
        title
        size
        petitionsPieChartResult: result {
          value
          isIncongruent
        }
        petitionsPieChartSettings: settings {
          graphicType
          labels
          colors
        }
      }
    `;
  },
};
