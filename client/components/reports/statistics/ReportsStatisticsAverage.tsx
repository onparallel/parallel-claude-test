import { Center, Grid, GridItem, ListItem, OrderedList } from "@chakra-ui/react";
import {
  CheckIcon,
  DoubleCheckIcon,
  PaperPlaneIcon,
  SignatureIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { ReportsDoughnutChart } from "@parallel/components/reports/statistics/ReportsDoughnutChart";
import { ReportTypeStatistics } from "@parallel/pages/app/reports/statistics";
import { dateToFilenameFormat } from "@parallel/utils/dates";
import { downloadSpreadsheet } from "@parallel/utils/downloadSpreadsheet";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { TimeSpan } from "../common/TimeSpan";
import { Box, Flex, HStack, Stack, Text } from "@parallel/components/ui";

export function ReportsStatisticsAverage({
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
  const { times, status } = report;
  const pendingToComplete = times.pending_to_complete ?? 0;
  const completeToClose = times.complete_to_close ?? 0;
  const timeToComplete = times.signature_completed ?? 0;

  const pendingToCompletePercent =
    (pendingToComplete / (pendingToComplete + completeToClose)) * 100;
  const completeToClosePercent = (completeToClose / (pendingToComplete + completeToClose)) * 100;
  const signaturesTimeToComplete = (timeToComplete / completeToClose) * 100;

  const pendingPetitions = status.pending;
  const completedPetitions = status.completed;
  const closedPetitions = status.closed;

  const petitionsTotal = closedPetitions + completedPetitions + pendingPetitions;
  const signaturesCompleted = status.signed;

  const downloadExcel = useDownloadAverageReportExcel();
  const handleDownloadExcel = () => {
    downloadExcel({ report, templateId, templateName, range });
  };

  return (
    <Grid
      gridTemplateColumns={{
        base: "repeat(1,1fr)",
        lg: "repeat(3,1fr)",
      }}
      gridTemplateAreas={{
        base: `
            "petitions"
            "petitions-time"
            "signatures"
            "signatures-time"
            "chart"
          `,
        lg: `
            "petitions petitions-time petitions-time"
            "signatures signatures-time signatures-time"
            "chart chart chart"
          `,
        xl: `
            "petitions petitions-time petitions-time chart chart"
            "signatures signatures-time signatures-time chart chart"
          `,
      }}
      gridGap={4}
      paddingTop={4}
    >
      <GridItem gridArea="petitions">
        <Card height="100%" padding={6} as={Stack} gap={3}>
          <HStack height={8}>
            <Center>
              <PaperPlaneIcon />
            </Center>
            <Text fontWeight={500} whiteSpace="nowrap">
              <FormattedMessage
                id="page.reports.started-parallels"
                defaultMessage="Started parallels"
              />
            </Text>
            <HelpPopover>
              <Stack>
                <Text>
                  <FormattedMessage
                    id="page.reports.started-parallels-help-1"
                    defaultMessage="This is the total parallels sent or started, i.e. drafts with at least one response."
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="page.reports.started-parallels-help-2"
                    defaultMessage="This number doesn't include deleted parallels or unanswered drafts."
                  />
                </Text>
              </Stack>
            </HelpPopover>
          </HStack>
          <Text fontWeight="600" fontSize="4xl">
            <FormattedNumber value={petitionsTotal} />
          </Text>
        </Card>
      </GridItem>
      <GridItem gridArea="signatures">
        <Card height="100%" padding={6} as={Stack} gap={3}>
          <HStack height={8}>
            <Center>
              <SignatureIcon />
            </Center>
            <Text fontWeight={500} whiteSpace="nowrap">
              <FormattedMessage
                id="page.reports.esignature-completed"
                defaultMessage="eSignatures completed"
              />
            </Text>
            <HelpPopover>
              <Stack>
                <Text>
                  <FormattedMessage
                    id="page.reports.esignature-sent-help-1"
                    defaultMessage="This is the total completed eSignature processes. Includes all signatures sent through one of our integrated eSignature providers."
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="page.reports.esignature-sent-help-2"
                    defaultMessage="eSignatures processes in which a signer hasn't yet signed aren't included."
                  />
                </Text>
              </Stack>
            </HelpPopover>
          </HStack>
          {signaturesCompleted || !petitionsTotal ? (
            <Text fontWeight="600" fontSize="4xl">
              <FormattedNumber value={signaturesCompleted} />
            </Text>
          ) : (
            <Text fontSize="lg" textStyle="hint">
              <FormattedMessage
                id="page.reports.no-esignatures-sent"
                defaultMessage="No eSignatures sent"
              />
            </Text>
          )}
        </Card>
      </GridItem>
      <GridItem gridArea="petitions-time">
        <Card height="100%" padding={6} as={Stack} gap={3}>
          <HStack height={8}>
            <Text fontWeight={500}>
              <FormattedMessage
                id="page.reports.average-duration"
                defaultMessage="Average duration"
              />
            </Text>
            <HelpPopover>
              <Stack>
                <Text>
                  <FormattedMessage
                    id="page.reports.average-duration-help-1"
                    defaultMessage="Duration is divided into two parts."
                  />
                </Text>
                <Box>
                  <OrderedList>
                    <ListItem>
                      <FormattedMessage
                        id="page.reports.average-duration-help-list-1"
                        defaultMessage="Average time from the start of the parallel until it is completed."
                      />
                    </ListItem>
                    <ListItem>
                      <FormattedMessage
                        id="page.reports.average-duration-help-list-2"
                        defaultMessage="Average time from completion to closure."
                      />
                    </ListItem>
                  </OrderedList>
                </Box>
                <Text>
                  <FormattedMessage
                    id="page.reports.average-duration-help-2"
                    defaultMessage="The sum of the two is the average duration of the parallels."
                  />
                </Text>
              </Stack>
            </HelpPopover>
          </HStack>
          <Grid
            templateColumns={{ base: "repeat(4, 1fr)", md: "repeat(5, 1fr)" }}
            gap={3}
            alignItems="center"
          >
            <GridItem colSpan={{ base: 4, md: 1 }} textAlign={{ base: "left", md: "right" }}>
              <Text whiteSpace="nowrap">
                {isNonNullish(times.pending_to_complete) ? (
                  <TimeSpan duration={pendingToComplete} />
                ) : (
                  "-"
                )}
              </Text>
            </GridItem>
            <GridItem colSpan={4}>
              <HStack>
                <TimeIcon color="yellow.500" />
                <Box
                  width={`${pendingToCompletePercent}%`}
                  minWidth="5px"
                  height="12px"
                  borderRadius="full"
                  background="yellow.400"
                />

                <CheckIcon color="green.400" />
              </HStack>
            </GridItem>
            <GridItem colSpan={{ base: 4, md: 1 }} textAlign={{ base: "left", md: "right" }}>
              <Text whiteSpace="nowrap">
                {isNonNullish(times.complete_to_close) ? (
                  <TimeSpan duration={completeToClose} />
                ) : (
                  "-"
                )}
              </Text>
            </GridItem>
            <GridItem colSpan={4}>
              <HStack>
                <CheckIcon color="green.400" />
                <Box
                  width={`${completeToClosePercent}%`}
                  minWidth="5px"
                  height="12px"
                  borderRadius="full"
                  background="green.600"
                />

                <DoubleCheckIcon color="green.500" />
                {pendingToComplete && !completeToClose ? (
                  <Text textStyle="hint">
                    <FormattedMessage
                      id="page.reports.no-parallels-closed"
                      defaultMessage="No parallels closed"
                    />
                  </Text>
                ) : null}
              </HStack>
            </GridItem>
          </Grid>
        </Card>
      </GridItem>
      <GridItem gridArea="signatures-time">
        <Card height="100%" padding={6} as={Stack} gap={3}>
          <HStack height={8}>
            <Text fontWeight={500}>
              <FormattedMessage
                id="page.reports.average-signing-time"
                defaultMessage="Average signing time"
              />
            </Text>
            <HelpPopover>
              <Stack>
                <Text>
                  <FormattedMessage
                    id="page.reports.average-signing-time-help-1"
                    defaultMessage="This is the average time for documents to be signed since they were sent."
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="page.reports.average-signing-time-help-2"
                    defaultMessage="The bar represents the percentage of the time from the time the parallel is completed until it is closed."
                  />
                </Text>
              </Stack>
            </HelpPopover>
          </HStack>
          <Grid
            templateColumns={{ base: "repeat(4, 1fr)", md: "repeat(5, 1fr)" }}
            gap={3}
            alignItems="center"
          >
            {signaturesCompleted || !petitionsTotal ? (
              <>
                <GridItem colSpan={{ base: 4, md: 1 }} textAlign={{ base: "left", md: "right" }}>
                  <Text whiteSpace="nowrap">
                    {isNonNullish(times.pending_to_complete) ? (
                      <TimeSpan duration={timeToComplete} />
                    ) : (
                      "-"
                    )}
                  </Text>
                </GridItem>
                <GridItem colSpan={4}>
                  <HStack>
                    <Flex alignItems="center" gridGap={0} position="relative" paddingX={1}>
                      <SignatureIcon color="gray.300" boxSize={4} />
                      <TimeIcon
                        color="yellow.600"
                        fontSize="10px"
                        position="absolute"
                        top={"-4px"}
                        insetEnd={"1px"}
                      />
                    </Flex>
                    <Box
                      width={`${signaturesTimeToComplete}%`}
                      minWidth="5px"
                      height="12px"
                      borderRadius="full"
                      background="yellow.400"
                    />

                    <SignatureIcon />
                  </HStack>
                </GridItem>
              </>
            ) : (
              <Text fontSize="xl">-</Text>
            )}
          </Grid>
        </Card>
      </GridItem>
      <GridItem gridArea="chart">
        <ReportsDoughnutChart
          petitionsTotal={petitionsTotal}
          pendingPetitions={pendingPetitions}
          closedPetitions={closedPetitions}
          completedPetitions={completedPetitions}
          onDownload={handleDownloadExcel}
        />
      </GridItem>
    </Grid>
  );
}

function useDownloadAverageReportExcel() {
  const intl = useIntl();

  return async ({
    report,
    range,
    templateId,
    templateName,
  }: {
    report: ReportTypeStatistics;
    range: Date[] | null;
    templateId: string;
    templateName?: string | null;
  }) => {
    const { status, times } = report;
    await downloadSpreadsheet(
      intl.formatMessage(
        {
          id: "page.reports-statistics.export-file-name",
          defaultMessage: "statistics-{templateId}_{range}",
        },
        {
          templateId,
          range: isNonNullish(range)
            ? range.map((d) => dateToFilenameFormat(d)).join("-")
            : dateToFilenameFormat(new Date()),
        },
      ),
      async (workbook) => {
        const worksheet = workbook.addWorksheet(
          intl.formatMessage({
            id: "page.reports-statistics.worksheet-name",
            defaultMessage: "Statistics report",
          }),
        );

        worksheet.columns = [
          {
            key: "name",
            header: intl.formatMessage({
              id: "generic.template",
              defaultMessage: "Template",
            }),
            width: 30,
          },
          {
            key: "pending",
            header: intl.formatMessage({
              id: "page.reports-overview.pending",
              defaultMessage: "Pending",
            }),
            width: 12,
          },

          {
            key: "completed",
            header: intl.formatMessage({
              id: "page.reports-overview.completed",
              defaultMessage: "Completed",
            }),
            width: 12,
          },
          {
            key: "signed",
            header: intl.formatMessage({
              id: "page.reports-overview.signed",
              defaultMessage: "Signed",
            }),
            width: 12,
          },
          {
            key: "closed",
            header: intl.formatMessage({
              id: "page.reports-overview.closed",
              defaultMessage: "Closed",
            }),
            width: 12,
          },
          {
            key: "total",
            header: intl.formatMessage({
              id: "page.reports-overview.total",
              defaultMessage: "Total",
            }),
            width: 12,
          },

          {
            key: "time_to_complete",
            header: intl.formatMessage({
              id: "page.reports-overview.time-to-complete",
              defaultMessage: "Time to complete",
            }),
            width: 20,
            style: { numFmt: "0.00" },
          },
          {
            key: "time_to_sign",
            header: intl.formatMessage({
              id: "page.reports-overview.time-to-sign",
              defaultMessage: "Time to sign",
            }),
            width: 20,
            style: { numFmt: "0.00" },
          },
          {
            key: "time_to_close",
            header: intl.formatMessage({
              id: "page.reports-overview.time-to-close",
              defaultMessage: "Time to close",
            }),
            width: 20,
            style: { numFmt: "0.00" },
          },
          {
            key: "total_time",
            header: intl.formatMessage({
              id: "page.reports-overview.total",
              defaultMessage: "Total",
            }),
            width: 20,
            style: { numFmt: "0.00" },
          },
        ];

        worksheet.spliceRows(1, 0, []);
        worksheet.mergeCells("B1:F1");
        worksheet.mergeCells("G1:J1");
        worksheet.getCell("A1").value = "";
        worksheet.getCell("B1").value = intl.formatMessage({
          id: "page.reports-overview.status",
          defaultMessage: "Status",
        });
        worksheet.getCell("G1").value = intl.formatMessage({
          id: "page.reports-overview.time-hours",
          defaultMessage: "Time (hours)",
        });
        worksheet.addRow({
          name:
            templateName ||
            intl.formatMessage({
              id: "generic.unnamed-template",
              defaultMessage: "Unnamed template",
            }),
          total: status.all,
          pending: status.pending,
          completed: status.completed,
          signed: status.signed,
          closed: status.closed,
          total_time: ((times.pending_to_complete ?? 0) + (times.complete_to_close ?? 0)) / 3600,
          time_to_complete: isNonNullish(times.pending_to_complete)
            ? times.pending_to_complete / 3600
            : "-",
          time_to_sign: isNonNullish(times.signature_completed)
            ? times.signature_completed / 3600
            : "-",
          time_to_close: isNonNullish(times.complete_to_close)
            ? times.complete_to_close / 3600
            : "-",
        });
      },
    );
  };
}
