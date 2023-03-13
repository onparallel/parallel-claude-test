import {
  Box,
  ButtonGroup,
  Center,
  HStack,
  Spinner,
  Stack,
  Text,
  useRadioGroup,
  useTheme,
} from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { AlertPopover } from "@parallel/components/common/AlertPopover";
import { Card } from "@parallel/components/common/Card";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { RadioButton } from "@parallel/components/common/RadioButton";
import { Spacer } from "@parallel/components/common/Spacer";
import { ReportTypeStatistics } from "@parallel/pages/app/reports/statistics";
import { dateToFilenameFormat } from "@parallel/utils/dates";
import { downloadSpreadsheet } from "@parallel/utils/downloadSpreadsheet";
import { useAsyncEffect } from "@parallel/utils/useAsyncEffect";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

type CalculatedData = {
  id: string;
  label: string;
  percentage: number;
  relativePercentage: number;
  dropOff: number;
  dropOffPercentage: number;
  total: number;
};

export function ReportsStatisticsConversion({
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

  const [chartType, setChartType] = useState<"RELATIVE" | "ABSOLUTE">("RELATIVE");
  const [isLoading, setIsLoading] = useState(true);

  const {
    conversion_funnel: conversionFunnel,
    has_signature_config: hasSignature,
    has_replied_unsent: hasCompletedUnsent,
  } = report;

  const hasEnoughData = Object.values(conversionFunnel).some((value) => (value ?? 0) > 0);

  useAsyncEffect(async (isMounted) => {
    // Loading stacked100 library async only in browser because incompatibility with SSR
    const ChartjsPluginStacked100 = (await import("chartjs-plugin-stacked100")).default;
    ChartJS.register(
      CategoryScale,
      LinearScale,
      BarElement,
      Title,
      Tooltip,
      Legend,
      ChartjsPluginStacked100
    );
    if (isMounted()) {
      setIsLoading(false);
    }
  }, []);

  const calculatedData = useMemo<CalculatedData[]>(() => {
    const { sent, opened, first_reply: firstReply, completed, signed, closed } = conversionFunnel;

    return [
      {
        id: "sent",
        label: intl.formatMessage({
          id: "component.reports-statistics-conversion.sent",
          defaultMessage: "Sent",
        }),
        percentage: sent && 100,
        relativePercentage: sent && 100,
        dropOff: 0,
        dropOffPercentage: 0,
        total: sent,
      },
      {
        id: "opened",
        label: intl.formatMessage({
          id: "component.reports-statistics-conversion.opened",
          defaultMessage: "Opened",
        }),
        percentage: opened && (opened / sent) * 100,
        relativePercentage: opened && (opened / sent) * 100,
        dropOff: sent - opened,
        dropOffPercentage: ((sent - opened) / sent) * 100,
        total: opened,
      },
      {
        id: "firstReply",
        label: intl.formatMessage({
          id: "component.reports-statistics-conversion.first-reply",
          defaultMessage: "First reply",
        }),
        percentage: firstReply && (firstReply / opened) * 100,
        relativePercentage: firstReply && (firstReply / sent) * 100,
        dropOff: opened - firstReply,
        dropOffPercentage: ((opened - firstReply) / opened) * 100,
        total: firstReply,
      },
      {
        id: "completed",
        label: intl.formatMessage({
          id: "component.reports-statistics-conversion.completed",
          defaultMessage: "Completed",
        }),
        percentage: completed && (completed / firstReply) * 100,
        relativePercentage: completed && (completed / sent) * 100,
        dropOff: firstReply - completed,
        dropOffPercentage: ((firstReply - completed) / firstReply) * 100,
        total: completed,
      },
      ...(hasSignature || signed > 0
        ? [
            {
              id: "signed",
              label: intl.formatMessage({
                id: "component.reports-statistics-conversion.signed",
                defaultMessage: "Signed",
              }),
              percentage: (signed / completed) * 100,
              relativePercentage: signed && (signed / sent) * 100,
              dropOff: completed - signed,
              dropOffPercentage: ((completed - signed) / completed) * 100,
              total: signed,
            },
          ]
        : []),
      // if has signature we compare with signed parallels, otherwise with the completed
      {
        id: "closed",
        label: intl.formatMessage({
          id: "component.reports-statistics-conversion.closed",
          defaultMessage: "Closed",
        }),
        percentage: closed && (closed / (hasSignature ? signed : completed)) * 100,
        relativePercentage: closed && (closed / sent) * 100,
        dropOff: (hasSignature ? signed : completed) - closed,
        dropOffPercentage:
          (((hasSignature ? signed : completed) - closed) / (hasSignature ? signed : completed)) *
          100,
        total: closed,
      },
    ];
  }, [intl.locale, Object.values(conversionFunnel).join(",")]);

  const { options, data } = useMemo(() => {
    const options = {
      indexAxis: "x",
      plugins: {
        stacked100: { enable: chartType === "ABSOLUTE" ? true : false },
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
              const { datasetIndex, dataIndex } = obj;

              //Pick the correct percentage to show depends of what dataset is coming from
              const percentage =
                datasetIndex === 1
                  ? Math.round(calculatedData[dataIndex].dropOffPercentage)
                  : Math.round(calculatedData[dataIndex].relativePercentage);

              // To avoid print the dropOff data in the first column
              if (datasetIndex === 1 && dataIndex === 0) {
                return "";
              }

              if (datasetIndex === 1) {
                //DropOff label
                return intl.formatMessage(
                  {
                    id: "component.reports-statistics-conversion.drop-off",
                    defaultMessage: "{percentage}% drop off ({amount})",
                  },
                  { percentage, amount: calculatedData[dataIndex].dropOff ?? 0 }
                );
              }

              //Percentage of total label
              return intl.formatMessage(
                {
                  id: "component.reports-statistics-conversion.of-total",
                  defaultMessage: "{percentage}% of total",
                },
                { percentage }
              );
            },
          },
        },
      },
      aspectRatio: 6,
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          position: "top",
          stacked: true,
          grid: {
            display: false,
          },
          ticks: {
            display: false,
          },
          border: {
            display: false,
          },
        },
        y: {
          min: 0,
          max: 100,
          stacked: chartType === "ABSOLUTE" ? true : false,
          ticks: {
            callback: function (value, index, arr) {
              return value + "%  ";
            },
            stepSize: 25,
            fontSize: "12px",
          },
          grid: {
            lineWidth: 2,
            color: function (context) {
              if (context.index === 0) {
                return "transparent";
              }
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

    const data = {
      labels: calculatedData.map((data) => data.label),
      datasets: [
        {
          data: calculatedData.map((data) =>
            chartType === "ABSOLUTE" ? data.percentage : data.relativePercentage
          ),
          barPercentage: 0.95,
          categoryPercentage: 0.95,
          backgroundColor: [
            colors.purple[200],
            colors.purple[300],
            colors.purple[400],
            colors.purple[500],
            colors.purple[600],
            colors.purple[700],
          ],
          hoverBackgroundColor: [
            colors.purple[200],
            colors.purple[300],
            colors.purple[400],
            colors.purple[500],
            colors.purple[600],
            colors.purple[700],
          ],
          borderColor: "transparent",
          hoverBorderColor: colors.blue[400],
          borderWidth: 1,
        },
        {
          data: calculatedData.map((data, index, arr) => {
            if (chartType === "ABSOLUTE") {
              return index === 0 ? 0 : data.dropOffPercentage;
            }

            // if has signed without signature we compare with the completed instead of the signed column
            return index === 0
              ? data.relativePercentage
              : data.id === "closed" && conversionFunnel.signed > 0 && !hasSignature
              ? arr[index - 2].relativePercentage
              : arr[index - 1].relativePercentage;
          }),
          barPercentage: 0.95,
          categoryPercentage: 0.95,
          backgroundColor: [
            `${colors.purple[200]}23`,
            `${colors.purple[200]}23`,
            `${colors.purple[300]}23`,
            `${colors.purple[400]}23`,
            `${colors.purple[500]}23`,
            `${colors.purple[600]}23`,
          ],
          hoverBackgroundColor: [
            `${colors.purple[200]}23`,
            `${colors.purple[200]}23`,
            `${colors.purple[300]}23`,
            `${colors.purple[400]}23`,
            `${colors.purple[500]}23`,
            `${colors.purple[600]}23`,
          ],
          borderColor: "transparent",
          hoverBorderColor: colors.blue[400],
          borderWidth: 1,
        },
      ],
    } as ChartData;

    return { options, data };
  }, [calculatedData, chartType]);

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "chartType",
    value: chartType,
    onChange: (value: "RELATIVE" | "ABSOLUTE") => setChartType(value),
  });

  const downloadExcel = useDownloadConversionReportExcel();
  const handleDownloadExcel = () => {
    downloadExcel({ range, templateId, templateName, data: calculatedData });
  };

  return (
    <Card padding={6}>
      <HStack>
        <Text fontWeight={500}>
          <FormattedMessage
            id="component.reports-statistics-conversion.conversion-funnel"
            defaultMessage="Conversion funnel"
          />
        </Text>
        <HelpPopover>
          <Stack>
            <Text>
              <FormattedMessage
                id="component.reports-statistics-conversion.conversion-funnel-help-1"
                defaultMessage="This is the conversion funnel from sending the parallel until it is closed. The percentage is calculated with respect to the previous step."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.reports-statistics-conversion.conversion-funnel-help-2"
                defaultMessage="This report doesn't include parallels that have not been sent."
              />
            </Text>
          </Stack>
        </HelpPopover>
        <Spacer />
        <HStack>
          <ButtonGroup isAttached variant="outline" size="sm" {...getRootProps()}>
            <RadioButton {...getRadioProps({ value: "RELATIVE" })} minWidth="fit-content">
              <FormattedMessage
                id="component.reports-statistics-conversion.relative"
                defaultMessage="Relative"
              />
            </RadioButton>
            <RadioButton {...getRadioProps({ value: "ABSOLUTE" })}>
              <FormattedMessage
                id="component.reports-statistics-conversion.absolute"
                defaultMessage="Absolute"
              />
            </RadioButton>
          </ButtonGroup>
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
      </HStack>
      <Box overflow="auto" marginTop={4}>
        <Center maxWidth="container.xl" minWidth="920px" margin="0 auto" as={Stack}>
          <HStack
            flex="1"
            width="100%"
            spacing={8}
            paddingLeft={14}
            paddingRight={4}
            justifyContent="space-between"
          >
            {calculatedData.map(({ id, label, total, percentage }) => {
              return (
                <Stack key={id} spacing={0} paddingX={0} width="100%">
                  <HStack>
                    <Text fontWeight={500} color="gray.600" as="span">
                      {label}
                    </Text>
                    {id === "sent" && hasCompletedUnsent ? (
                      <AlertPopover>
                        <Text>
                          <FormattedMessage
                            id="component.reports-statistics-conversion.parallels-closed-no-sent"
                            defaultMessage="Some parallels were completed without being sent. This funnel only includes parallels sent to one recipient."
                          />
                        </Text>
                      </AlertPopover>
                    ) : null}
                    {id === "signed" && !hasSignature ? (
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
                  {hasEnoughData ? (
                    <HStack fontWeight={600}>
                      <Text fontSize="2xl" as="span">{`${
                        percentage ? Math.round(percentage) : 0
                      }%`}</Text>
                      <Text fontSize="sm" as="span">
                        ({total})
                      </Text>
                    </HStack>
                  ) : (
                    <Text fontSize="2xl" as="span">
                      -
                    </Text>
                  )}
                </Stack>
              );
            })}
          </HStack>
          {hasEnoughData ? (
            isLoading ? (
              <Center height={52}>
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="primary.500"
                  size="xl"
                />
              </Center>
            ) : (
              <Bar options={options as any} data={data as any} />
            )
          ) : (
            <Center height={20}>
              <Text as="span" textStyle="hint">
                <FormattedMessage
                  id="component.reports-statistics-conversion.not-enough-data"
                  defaultMessage="Not enough data available to generate this report"
                />
              </Text>
            </Center>
          )}
        </Center>
      </Box>
    </Card>
  );
}

function useDownloadConversionReportExcel() {
  const intl = useIntl();

  return async ({
    range,
    data,
    templateId,
    templateName,
  }: {
    range: Date[] | null;
    data: CalculatedData[];
    templateId: string;
    templateName?: string | null;
  }) => {
    await downloadSpreadsheet(
      intl.formatMessage(
        {
          id: "component.reports-statistics-conversion.export-file-name",
          defaultMessage: "conversion-report-{templateId}-{range}",
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
            id: "component.reports-statistics-conversion.conversion-report",
            defaultMessage: "Conversion report",
          })
        );

        worksheet.columns = [
          {
            key: "steps",
            header: intl.formatMessage({
              id: "component.reports-statistics-conversion.steps",
              defaultMessage: "Steps",
            }),
            width: 30,
          },
          {
            key: "total",
            header: intl.formatMessage({
              id: "petitions.title",
              defaultMessage: "Parallels",
            }),
            width: 12,
          },
          {
            key: "percentageRelative",
            header: intl.formatMessage({
              id: "component.reports-statistics-conversion.percentage-relative",
              defaultMessage: "Percentage relative",
            }),
            width: 16,
            style: { numFmt: "0.00" },
          },
          {
            key: "percentageTotal",
            header: intl.formatMessage({
              id: "component.reports-statistics-conversion.percentage-total",
              defaultMessage: "Percentage of total",
            }),
            width: 20,
            style: { numFmt: "0.00" },
          },
          {
            key: "dropOff",
            header: intl.formatMessage({
              id: "component.reports-statistics-conversion.column-drop-off",
              defaultMessage: "Drop off",
            }),
            width: 12,
          },
          {
            key: "dropOffPercentage",
            header: intl.formatMessage({
              id: "component.reports-statistics-conversion.drop-off-percentage",
              defaultMessage: "Drop off percentage",
            }),
            width: 20,
            style: { numFmt: "0.00" },
          },
        ];
        worksheet.spliceRows(1, 0, []);
        worksheet.mergeCells("B1:F1");
        worksheet.getCell("A1").value = intl.formatMessage({
          id: "generic.template",
          defaultMessage: "Template",
        });
        worksheet.getCell("B1").value =
          templateName ||
          intl.formatMessage({
            id: "generic.unnamed-template",
            defaultMessage: "Unnamed template",
          });
        worksheet.addRows(
          data.map((row) => ({
            steps: row.label,
            total: row.total,
            percentageTotal: row.percentage,
            percentageRelative: row.relativePercentage,
            dropOff: row.dropOff,
            dropOffPercentage: row.dropOffPercentage,
          }))
        );
      }
    );
  };
}
