import {
  Box,
  Center,
  Flex,
  HStack,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useTheme,
} from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { AlertPopover } from "@parallel/components/common/AlertPopover";
import { Card } from "@parallel/components/common/Card";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { Spacer } from "@parallel/components/common/Spacer";
import { ReportTypeStatistics } from "@parallel/pages/app/reports/statistics";
import { dateToFilenameFormat } from "@parallel/utils/dates";
import { downloadSpreadsheet } from "@parallel/utils/downloadSpreadsheet";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { BoxAndWiskers, BoxPlotController } from "@sgratzl/chartjs-chart-boxplot";
import {
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useMemo, useState } from "react";
import { Chart } from "react-chartjs-2";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { TimeSpan } from "../common/TimeSpan";

type RadioValues = "opened" | "first_reply" | "completed" | "signed" | "closed";

ChartJS.register(BoxPlotController, BoxAndWiskers, LinearScale, CategoryScale, Tooltip);

export function ReportsStatisticsTime({
  report,
  range,
  templateId,
  templateName,
}: {
  report: ReportTypeStatistics;
  range: Date[] | null;
  templateId: string;
  templateName?: string | null;
}) {
  const intl = useIntl();
  const { colors } = useTheme();
  const [selectedValue, setSelectedValue] = useState<RadioValues>("opened");
  const radioButtonsRef = useMultipleRefs<HTMLInputElement>();

  const { has_signature_config: hasSignature, time_statistics: timeStatistics } = report;

  const maxDuration = {
    minutes: (timeStatistics[selectedValue]!.max ?? 0) / 60,
    hours: (timeStatistics[selectedValue]!.max ?? 0) / 3_600,
    days: (timeStatistics[selectedValue]!.max ?? 0) / 86_400,
  };

  const hoursDaysOrMinutes = maxDuration.hours > 120 ? "d" : maxDuration.minutes > 240 ? "h" : "'";
  const divideBy = maxDuration.hours > 120 ? 86_400 : maxDuration.minutes > 240 ? 3_600 : 60;

  const tootlipTitle = useMemo(() => {
    if (hoursDaysOrMinutes === "d") {
      return intl.formatMessage({
        id: "component.reports-statistics-time.days",
        defaultMessage: "Days",
      });
    } else if (hoursDaysOrMinutes === "h") {
      return intl.formatMessage({
        id: "component.reports-statistics-time.hours",
        defaultMessage: "Hours",
      });
    } else {
      return intl.formatMessage({
        id: "component.reports-statistics-time.minutes",
        defaultMessage: "Minutes",
      });
    }
  }, [hoursDaysOrMinutes]);

  const hasEnoughData = Object.values(timeStatistics).some(
    (value) => value && Object.values(value).some((v) => (v ?? 0) > 0)
  );

  const labels = useMemo<{ value: RadioValues; label: string }[]>(() => {
    return [
      {
        value: "opened",
        label: intl.formatMessage({
          id: "component.reports-statistics-time.opened",
          defaultMessage: "Opened",
        }),
      },
      {
        value: "first_reply",
        label: intl.formatMessage({
          id: "component.reports-statistics-time.first-reply",
          defaultMessage: "First reply added",
        }),
      },
      {
        value: "completed",
        label: intl.formatMessage({
          id: "component.reports-statistics-time.completed",
          defaultMessage: "Completed",
        }),
      },
      ...(hasSignature || isDefined(timeStatistics.signed.max)
        ? [
            {
              value: "signed" as RadioValues,
              label: intl.formatMessage({
                id: "component.reports-statistics-time.signed",
                defaultMessage: "Signed",
              }),
            },
          ]
        : []),
      {
        value: "closed",
        label: intl.formatMessage({
          id: "component.reports-statistics-time.closed",
          defaultMessage: "Closed",
        }),
      },
    ];
  }, [intl.locale, timeStatistics.signed.max, hasSignature]);

  const { data, options } = useMemo(() => {
    const data = {
      labels: hasEnoughData ? [labels.find((label) => label.value === selectedValue)?.label] : [],
      datasets: [
        {
          backgroundColor: `${colors.purple[600]}25`,
          borderColor: colors.purple[600],
          outlierBorderColor: "transparent",
          outlierBackgroundColor: "transparent",
          outlierHitRadius: 0,
          borderWidth: 1,
          data:
            hasEnoughData && (timeStatistics[selectedValue]!.max ?? 0) > 0
              ? [
                  {
                    min: Number(((timeStatistics[selectedValue]!.min ?? 0) / divideBy).toFixed(2)),
                    max: Number(((timeStatistics[selectedValue]!.max ?? 0) / divideBy).toFixed(2)),
                    mean: Number(
                      ((timeStatistics[selectedValue]!.mean ?? 0) / divideBy).toFixed(2)
                    ),
                    q1: Number(((timeStatistics[selectedValue]!.q1 ?? 0) / divideBy).toFixed(2)),
                    median: Number(
                      ((timeStatistics[selectedValue]!.median ?? 0) / divideBy).toFixed(2)
                    ),
                    q3: Number(((timeStatistics[selectedValue]!.q3 ?? 0) / divideBy).toFixed(2)),
                  } as any,
                ]
              : [],
          barPercentage: 0.4,
          categoryPercentage: 0.4,
        },
      ],
    } as ChartData;

    const options = {
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: "index",
          enabled: true,
          backgroundColor: colors.white,
          bodyColor: colors.gray[800],
          titleColor: colors.gray[800],
          borderColor: colors.gray[300],
          borderWidth: 1,
          padding: 14,
          callbacks: {
            title: function () {
              return tootlipTitle;
            },
            beforeBody: function (obj) {
              const parsed = obj[0].parsed;
              const { min, max, mean, median, q1, q3 } = parsed;
              const meanMedian = [
                intl.formatMessage(
                  {
                    id: "component.reports-statistics-time.mean-tooltip",
                    defaultMessage: "Mean: {value}",
                  },
                  { value: mean }
                ),
                intl.formatMessage(
                  {
                    id: "component.reports-statistics-time.median-tooltip",
                    defaultMessage: "Median: {value}",
                  },
                  { value: median }
                ),
              ];

              return [
                intl.formatMessage(
                  {
                    id: "component.reports-statistics-time.max-tooltip",
                    defaultMessage: "Max: {value}",
                  },
                  { value: max }
                ),
                intl.formatMessage(
                  {
                    id: "component.reports-statistics-time.p75-tooltip",
                    defaultMessage: "P75: {value}",
                  },
                  { value: q3 }
                ),
                ...(median > mean ? meanMedian.reverse() : meanMedian),
                intl.formatMessage(
                  {
                    id: "component.reports-statistics-time.p25-tooltip",
                    defaultMessage: "P25: {value}",
                  },
                  { value: q1 }
                ),
                intl.formatMessage(
                  {
                    id: "component.reports-statistics-time.min-tooltip",
                    defaultMessage: "Min: {value}",
                  },
                  { value: min }
                ),
              ];
            },
            label: function () {
              return "";
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          border: {
            display: false,
          },
        },
        y: {
          ticks: {
            callback: function (value) {
              return value + hoursDaysOrMinutes;
            },
            maxTicksLimit: 10,
          },
          grid: {
            lineWidth: 2,
            color: function () {
              return colors.gray[100];
            },
          },
          border: {
            dash: [8, 6],
            display: false,
          },
        },
      },
    } as ChartOptions;

    return { data, options };
  }, [hasEnoughData, labels, selectedValue, timeStatistics]);

  const downloadExcel = useDownloadTimeReportExcel();
  const handleDownloadExcel = () => {
    downloadExcel({ range, templateId, templateName, timeStatistics, labels });
  };

  return (
    <Card paddingX={8} paddingY={5}>
      <HStack>
        <Text fontWeight={500}>
          <FormattedMessage
            id="component.reports-statistics-time.time-statistics"
            defaultMessage="Time statistics"
          />
        </Text>
        <HelpPopover>
          <Stack>
            <Text>
              <FormattedMessage
                id="component.reports-statistics-time.time-statistics-help-1"
                defaultMessage="This table represents the different times for each step. "
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.reports-statistics-time.time-statistics-help-2"
                defaultMessage="All times are counted from the previous step, not with respect to the total."
              />
            </Text>
          </Stack>
        </HelpPopover>
        <Spacer />
        <IconButtonWithTooltip
          onClick={handleDownloadExcel}
          icon={<DownloadIcon boxSize={4} />}
          size="sm"
          placement="bottom"
          label={intl.formatMessage({
            id: "generic.download-report",
            defaultMessage: "Download report",
          })}
          isDisabled={!hasEnoughData}
        />
      </HStack>
      <Flex gap={10} direction={{ base: "column", xl: "row" }} marginTop={2}>
        <Box overflow="auto" flex="1">
          <RadioGroup aria-label="step" name="step" value={selectedValue}>
            <TableContainer>
              <Table
                size="sm"
                variant="unstyled"
                sx={{
                  tr: {
                    borderBottom: "1px solid",
                    borderColor: "gray.200",
                  },
                }}
              >
                <Thead
                  backgroundColor="gray.50"
                  sx={{
                    "tr > th": {
                      fontSize: "14px",
                      fontWeight: "normal",
                    },
                  }}
                  height={9}
                >
                  <Tr textTransform="uppercase">
                    <Th fontSize="14px" fontWeight="normal">
                      <Text marginLeft={6}>
                        <FormattedMessage
                          id="component.reports-statistics-time.steps"
                          defaultMessage="Steps"
                        />
                      </Text>
                    </Th>
                    <Th textAlign="end">
                      <FormattedMessage
                        id="component.reports-statistics-time.mean"
                        defaultMessage="Mean"
                      />
                    </Th>
                    <Th textAlign="end">P25</Th>
                    <Th textAlign="end">
                      <FormattedMessage
                        id="component.reports-statistics-time.median"
                        defaultMessage="Median"
                      />
                    </Th>
                    <Th textAlign="end">P75</Th>
                  </Tr>
                </Thead>

                {hasEnoughData ? (
                  <Tbody>
                    {labels.map(({ value, label }, index) => (
                      <Tr
                        key={value}
                        height={9}
                        sx={{
                          "&:hover": {
                            backgroundColor: "purple.50",
                            cursor: "pointer",
                          },
                        }}
                        onClick={() => {
                          setSelectedValue(value);
                          radioButtonsRef[index]?.current?.focus();
                        }}
                      >
                        <Td>
                          <Radio
                            ref={radioButtonsRef[index]}
                            value={value}
                            id={`radio-button-${value}`}
                          >
                            <HStack>
                              <Text fontWeight={500} fontSize="sm">
                                {label}
                              </Text>
                              {value === "signed" && !hasSignature ? (
                                <AlertPopover>
                                  <Text>
                                    <FormattedMessage
                                      id="page.reports-statistics.parallels-signed-alert"
                                      defaultMessage="Some parallels have been signed even though the template has no signature process set up."
                                    />
                                  </Text>
                                </AlertPopover>
                              ) : null}
                            </HStack>
                          </Radio>
                        </Td>
                        <Td textAlign="end">
                          {isDefined(timeStatistics[value]!.mean) ? (
                            <TimeSpan duration={timeStatistics[value]!.mean ?? 0} />
                          ) : (
                            "-"
                          )}
                        </Td>
                        <Td textAlign="end">
                          {isDefined(timeStatistics[value]!.q1) ? (
                            <TimeSpan duration={timeStatistics[value]!.q1 ?? 0} />
                          ) : (
                            "-"
                          )}
                        </Td>
                        <Td textAlign="end">
                          {isDefined(timeStatistics[value]!.median) ? (
                            <TimeSpan duration={timeStatistics[value]!.median ?? 0} />
                          ) : (
                            "-"
                          )}
                        </Td>
                        <Td textAlign="end">
                          {isDefined(timeStatistics[value]!.q3) ? (
                            <TimeSpan duration={timeStatistics[value]!.q3 ?? 0} />
                          ) : (
                            "-"
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                ) : null}
              </Table>
            </TableContainer>
          </RadioGroup>
          {hasEnoughData ? null : (
            <Center flex="1" height="160px">
              <Text as="span" textStyle="hint">
                <FormattedMessage
                  id="component.reports-statistics-conversion.not-enough-data"
                  defaultMessage="Not enough data available to generate this report"
                />
              </Text>
            </Center>
          )}
        </Box>
        <Box height="100%" margin="0 auto" width="300px">
          <Chart type="boxplot" data={data} height={230} options={options} />
        </Box>
      </Flex>
    </Card>
  );
}

function useDownloadTimeReportExcel() {
  const intl = useIntl();

  return async ({
    range,
    timeStatistics,
    templateId,
    templateName,
    labels,
  }: {
    range: Date[] | null;
    timeStatistics: ReportTypeStatistics["time_statistics"];
    templateId: string;
    templateName?: string | null;
    labels: { value: RadioValues; label: string }[];
  }) => {
    await downloadSpreadsheet(
      intl.formatMessage(
        {
          id: "component.reports-statistics-time.export-file-name",
          defaultMessage: "time-statistics-{templateId}-{range}",
        },
        {
          templateId,
          range: isDefined(range)
            ? range.map((d) => dateToFilenameFormat(d)).join("-")
            : dateToFilenameFormat(new Date()),
        }
      ),
      async (workbook) => {
        const worksheet = workbook.addWorksheet(
          intl.formatMessage({
            id: "component.reports-statistics-time.time-statistics",
            defaultMessage: "Time statistics",
          })
        );

        worksheet.columns = [
          {
            key: "steps",
            header: intl.formatMessage({
              id: "component.reports-statistics-time.steps",
              defaultMessage: "Steps",
            }),
            width: 30,
          },
          {
            key: "min",
            header: intl.formatMessage({
              id: "component.reports-statistics-time.minimum",
              defaultMessage: "Minimum",
            }),
            width: 12,
            style: { numFmt: "0.00" },
          },
          {
            key: "q1",
            header: "P25",
            width: 12,
            style: { numFmt: "0.00" },
          },
          {
            key: "mean",
            header: intl.formatMessage({
              id: "component.reports-statistics-time.mean",
              defaultMessage: "Mean",
            }),
            width: 12,
            style: { numFmt: "0.00" },
          },
          {
            key: "median",
            header: intl.formatMessage({
              id: "component.reports-statistics-time.median",
              defaultMessage: "Median",
            }),
            width: 12,
            style: { numFmt: "0.00" },
          },
          {
            key: "q3",
            header: "P75",
            width: 12,
            style: { numFmt: "0.00" },
          },
          {
            key: "max",
            header: intl.formatMessage({
              id: "component.reports-statistics-time.maximum",
              defaultMessage: "Maximum",
            }),
            width: 12,
            style: { numFmt: "0.00" },
          },
        ];
        worksheet.spliceRows(1, 0, []);
        worksheet.mergeCells("B1:G1");
        worksheet.getCell("A1").value =
          templateName ||
          intl.formatMessage({
            id: "generic.unnamed-template",
            defaultMessage: "Unnamed template",
          });
        worksheet.getCell("B1").value = intl.formatMessage({
          id: "page.reports-overview.time-hours",
          defaultMessage: "Time (hours)",
        });
        worksheet.addRows(
          labels.map(({ value, label }) => ({
            steps: label,
            min: isDefined(timeStatistics[value]!.min)
              ? (timeStatistics[value]!.min ?? 0) / 3_600
              : "-",
            q1: isDefined(timeStatistics[value]!.q1)
              ? (timeStatistics[value]!.q1 ?? 0) / 3_600
              : "-",
            mean: isDefined(timeStatistics[value]!.mean)
              ? (timeStatistics[value]!.mean ?? 0) / 3_600
              : "-",
            median: isDefined(timeStatistics[value]!.median)
              ? (timeStatistics[value]!.median ?? 0) / 3_600
              : "-",
            q3: isDefined(timeStatistics[value]!.q3)
              ? (timeStatistics[value]!.q3 ?? 0) / 3_600
              : "-",
            max: isDefined(timeStatistics[value]!.max)
              ? (timeStatistics[value]!.max ?? 0) / 3_600
              : "-",
          }))
        );
      }
    );
  };
}
