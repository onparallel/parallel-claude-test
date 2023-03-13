import { Center, Flex, HStack, Image, Square, Stack, Text, useTheme } from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { Spacer } from "@parallel/components/common/Spacer";
import { ArcElement, Chart as ChartJS, ChartData, ChartOptions, Legend, Tooltip } from "chart.js";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../../common/IconButtonWithTooltip";

ChartJS.register(ArcElement, Tooltip, Legend);

type ReportsDoughnutChartProps = {
  petitionsTotal: number;
  pendingPetitions: number;
  completedPetitions: number;
  closedPetitions: number;
  onDownload: () => void;
};

export function ReportsDoughnutChart({
  petitionsTotal,
  pendingPetitions,
  completedPetitions,
  closedPetitions,
  onDownload,
}: ReportsDoughnutChartProps) {
  const theme = useTheme();
  const intl = useIntl();

  const { data, options } = useMemo(() => {
    const data = {
      labels: [
        intl.formatMessage(
          {
            id: "component.reports-doughnut-chart.pending",
            defaultMessage: "{count} Pending",
          },
          { count: pendingPetitions }
        ),
        intl.formatMessage(
          {
            id: "component.reports-doughnut-chart.completed",
            defaultMessage: "{count} Completed",
          },
          { count: completedPetitions }
        ),
        intl.formatMessage(
          {
            id: "component.reports-doughnut-chart.closed",
            defaultMessage: "{count} Closed",
          },
          { count: closedPetitions }
        ),
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
    } as ChartData;

    const options = {
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
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

    return { data, options };
  }, [intl.locale, pendingPetitions, completedPetitions, closedPetitions]);

  return (
    <Card
      height="100%"
      padding={6}
      as={Stack}
      spacing={6}
      justifyContent="center"
      maxWidth={{ base: "full", xl: "360px" }}
    >
      <HStack>
        <Text fontWeight={500} padding={0}>
          <FormattedMessage
            id="component.reports-doughnut-chart.status-of-parallels"
            defaultMessage="Status of the parallels"
          />
        </Text>
        <HelpPopover>
          <Stack>
            <Text>
              <FormattedMessage
                id="component.reports-doughnut-chart.status-of-parallels-help-1"
                defaultMessage="This shows the current number of parallels in each state."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.reports-doughnut-chart.status-of-parallels-help-2"
                defaultMessage="The sum of all is the total number of parallels created."
              />
            </Text>
          </Stack>
        </HelpPopover>
        <Spacer />
        <IconButtonWithTooltip
          onClick={onDownload}
          icon={<DownloadIcon boxSize={4} />}
          size="sm"
          placement="bottom"
          label={intl.formatMessage({
            id: "generic.download-report",
            defaultMessage: "Download report",
          })}
          isDisabled={!petitionsTotal}
        />
      </HStack>
      <Center maxWidth="150px" alignSelf="center">
        {petitionsTotal ? (
          <Doughnut data={data as any} options={options as any} />
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
      <Flex wrap="wrap" alignItems="center" justifyContent="center" fontSize="sm" gridGap={2}>
        <HStack>
          <Square size={4} backgroundColor="yellow.500" borderRadius="4px" />
          <Text>
            <FormattedMessage
              id="component.reports-doughnut-chart.pending"
              defaultMessage="{count} Pending"
              values={{ count: pendingPetitions }}
            />
          </Text>
        </HStack>
        <HStack>
          <Square size={4} backgroundColor="green.400" borderRadius="4px" />
          <Text>
            <FormattedMessage
              id="component.reports-doughnut-chart.completed"
              defaultMessage="{count} Completed"
              values={{ count: completedPetitions }}
            />
          </Text>
        </HStack>
        <HStack>
          <Square size={4} backgroundColor="green.600" borderRadius="4px" />
          <Text>
            <FormattedMessage
              id="component.reports-doughnut-chart.closed"
              defaultMessage="{count} Closed"
              values={{ count: closedPetitions }}
            />
          </Text>
        </HStack>
      </Flex>
    </Card>
  );
}
