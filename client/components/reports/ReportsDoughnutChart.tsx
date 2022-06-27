import { Box, Center, HStack, Image, Stack, Text, useTheme } from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { FormattedMessage, useIntl } from "react-intl";

ChartJS.register(ArcElement, Tooltip, Legend);

type ReportsDoughnutChartProps = {
  petitionsTotal: number;
  pendingPetitions: number;
  completedPetitions: number;
  closedPetitions: number;
};

export function ReportsDoughnutChart({
  petitionsTotal,
  pendingPetitions,
  completedPetitions,
  closedPetitions,
}: ReportsDoughnutChartProps) {
  const theme = useTheme();
  const intl = useIntl();

  const data = {
    labels: [
      intl.formatMessage({
        id: "component.reports-doughnut-chart.pending",
        defaultMessage: "Pending",
      }),
      intl.formatMessage({
        id: "component.reports-doughnut-chart.completed",
        defaultMessage: "Completed",
      }),
      intl.formatMessage({
        id: "component.reports-doughnut-chart.closed",
        defaultMessage: "Closed",
      }),
    ],
    datasets: [
      {
        data: [pendingPetitions, completedPetitions, closedPetitions],
        backgroundColor: [
          theme.colors.yellow[500],
          theme.colors.green[400],
          theme.colors.green[600],
        ],
      },
    ],
  };

  return (
    <Card
      height="100%"
      padding={6}
      as={Stack}
      spacing={3}
      alignItems="center"
      justifyContent="center"
      maxWidth={{ base: "full", xl: "360px" }}
    >
      <HStack>
        <Text>
          <FormattedMessage
            id="component.reports-doughnut-chart.status-of-petitions"
            defaultMessage="Status of the petitions"
          />
        </Text>
        <HelpPopover>
          <Stack>
            <Text>
              <FormattedMessage
                id="component.reports-doughnut-chart.status-of-petitions-help-1"
                defaultMessage="This shows the current number of petitions in each state."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.reports-doughnut-chart.status-of-petitions-help-2"
                defaultMessage="The sum of all is the total number of petitions created."
              />
            </Text>
          </Stack>
        </HelpPopover>
      </HStack>
      <Center maxWidth="150px" position="relative">
        {petitionsTotal ? (
          <Doughnut
            data={data}
            options={{
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: theme.colors.white,
                  bodyColor: theme.colors.gray[800],
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
                  },
                },
              },
            }}
          />
        ) : (
          <Image
            maxWidth="150px"
            maxHeight="150px"
            width="100%"
            height="100%"
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/reports/empty-doughnut.svg`}
          />
        )}
      </Center>
      <HStack
        wrap="wrap"
        alignItems="center"
        justifyContent="center"
        fontSize="sm"
        spacing={2}
        gridGap={2}
      >
        <HStack>
          <Box w={4} h={4} bg="yellow.500" borderRadius="4px"></Box>
          <Text>{`${pendingPetitions} ${intl.formatMessage({
            id: "component.reports-doughnut-chart.pending",
            defaultMessage: "Pending",
          })}`}</Text>
        </HStack>
        <HStack>
          <Box w={4} h={4} bg="green.400" borderRadius="4px"></Box>
          <Text>{`${completedPetitions} ${intl.formatMessage({
            id: "component.reports-doughnut-chart.completed",
            defaultMessage: "Completed",
          })}`}</Text>
        </HStack>
        <HStack>
          <Box w={4} h={4} bg="green.600" borderRadius="4px"></Box>
          <Text>{`${closedPetitions} ${intl.formatMessage({
            id: "component.reports-doughnut-chart.closed",
            defaultMessage: "Closed",
          })}`}</Text>
        </HStack>
      </HStack>
    </Card>
  );
}
