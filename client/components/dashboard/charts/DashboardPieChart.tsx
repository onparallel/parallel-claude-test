import { useTheme } from "@chakra-ui/react";
import { ArcElement, Chart, ChartData, ChartOptions, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";

Chart.register(ArcElement, Tooltip, Legend);

export function DashboardPieChart({ data }: { data: ChartData }) {
  const theme = useTheme();

  const total = data.datasets
    .flatMap((dataset) => dataset.data as number[])
    .reduce((a, b) => a + b, 0);

  const placeholderData = {
    datasets: [
      {
        data: [1],
        backgroundColor: [theme.colors.gray[100]],
        hoverBackgroundColor: [theme.colors.gray[100]],
        hoverBorderColor: [theme.colors.gray[100]],
        borderColor: [theme.colors.gray[100]],
        hoverOffset: 0,
      },
    ],
    labels: [],
  };

  const options = {
    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        enabled: total === 0 ? false : true,
        backgroundColor: theme.colors.white,
        bodyColor: theme.colors.gray[800],
        titleColor: theme.colors.gray[800],
        borderColor: theme.colors.gray[300],
        borderWidth: 1,
        padding: 8,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          labelPointStyle: function () {
            return {
              pointStyle: "rectRounded",
              rotation: 0,
            };
          },
          title: function () {
            return "";
          },
          label: function (obj) {
            return obj.label;
          },
        },
      },
    },
  } as ChartOptions;

  return <Pie data={total === 0 ? placeholderData : (data as any)} options={options as any} />;
}
