import { gql } from "@apollo/client";
import { Box, Center, Stack } from "@chakra-ui/react";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { DashboardProfilesPieChartModule_DashboardProfilesPieChartModuleFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { DashboardChartLegend } from "../../charts/DashboardChartLegend";
import { DashboardDoughnutChart } from "../../charts/DashboardDoughnutChart";
import { DashboardPieChart } from "../../charts/DashboardPieChart";
import { DashboardModuleAlertIncongruent } from "../../shared/DashboardModuleAlertIncongruent";
import { DashboardModuleCard } from "../../shared/DashboardModuleCard";
import { DashboardModuleSpinner } from "../../shared/DashboardModuleSpinner";

export const DashboardProfilesPieChartModule = Object.assign(
  forwardRef<
    HTMLDivElement,
    {
      module: DashboardProfilesPieChartModule_DashboardProfilesPieChartModuleFragment;
      isEditing: boolean;
      isDragging: boolean;
      onEdit: () => void;
      onDelete: () => void;
    }
  >(function DashboardProfilesPieChartModule({ module, ...rest }, ref) {
    const intl = useIntl();
    const type = module.profilesPieChartSettings.type;
    const data = {
      datasets: [
        {
          data:
            module.profilesPieChartResult?.items?.map((item) =>
              type === "COUNT" ? item.count : (item.aggr ?? 0),
            ) ?? [],
          backgroundColor:
            module.profilesPieChartResult?.items?.map((item) => item.color ?? "#E2E8F0") ?? [],
          borderColor: "white",
          hoverBackgroundColor:
            module.profilesPieChartResult?.items?.map((item) => item.color ?? "#E2E8F0") ?? [],
          hoverBorderColor: "white",
        },
      ],
      labels:
        module.profilesPieChartResult?.items?.map(({ label }) =>
          label === null
            ? intl.formatMessage({
                id: "component.dashboard-pie-chart-module.not-replied",
                defaultMessage: "Not replied",
              })
            : typeof label === "string"
              ? label
              : localizableUserTextRender({ intl, value: label, default: "" }),
        ) ?? [],
    };

    return (
      <DashboardModuleCard
        ref={ref}
        module={module}
        headerAddon={
          module.profilesPieChartResult?.isIncongruent ? (
            <DashboardModuleAlertIncongruent />
          ) : undefined
        }
        gridRow={{
          base: "span 4",
          md: "span 2",
          lg: module.size === "LARGE" ? "span 3" : "span 2",
        }}
        {...rest}
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
              <Box
                position="relative"
                boxSize={{
                  base: "300px",
                  md: "207px",
                  lg: module.size === "LARGE" ? "353px" : "207px",
                }}
              >
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
  }),
  {
    fragments: {
      get DashboardProfilesPieChartModule() {
        return gql`
          fragment DashboardProfilesPieChartModule_DashboardProfilesPieChartModule on DashboardProfilesPieChartModule {
            id
            size
            title
            profilesPieChartResult: result {
              items {
                count
                aggr
                label
                color
              }
              isIncongruent
            }
            profilesPieChartSettings: settings {
              graphicType
              type
            }
          }
        `;
      },
    },
  },
);
