import { gql } from "@apollo/client";
import { Button, Flex, Grid, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { DateRangePickerButton } from "@parallel/components/reports/DateRangePickerButton";
import {
  OverviewReportsListTableHeader,
  OverviewTableType,
} from "@parallel/components/reports/OverviewReportsListTableHeader";
import { ReportsErrorMessage } from "@parallel/components/reports/ReportsErrorMessage";
import { ReportsLoadingMessage } from "@parallel/components/reports/ReportsLoadingMessage";
import { ReportsReadyMessage } from "@parallel/components/reports/ReportsReadyMessage";
import { TimeSpan } from "@parallel/components/reports/TimeSpan";
import { Maybe, Overview_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { stallFor } from "@parallel/utils/promises/stallFor";
import { date, integer, sorting, string, useQueryState, values } from "@parallel/utils/queryState";
import { useTemplatesOverviewReportBackgroundTask } from "@parallel/utils/tasks/useTemplatesOverviewReportTask";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useReportsSections } from "@parallel/utils/useReportsSections";
import { ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, sort, sortBy } from "remeda";

const SORTING = ["name", "total", "completed", "signed", "closed"] as const;

interface PetitionStatusCount {
  all: number;
  pending: number;
  completed: number;
  closed: number;
  signed: number;
}
interface TemplateStats {
  from_template_id: string;
  name: Maybe<string>;
  status: PetitionStatusCount;
  times: {
    pending_to_complete: Maybe<number>;
    complete_to_close: Maybe<number>;
    signature_completed: Maybe<number>;
  };
}

interface ReportType {
  totals: PetitionStatusCount;
  templates: TemplateStats[];
  other_templates?: TemplateStats;
  petitions_scratch?: TemplateStats;
}

export const QUERY_STATE = {
  range: date().list(2),
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
  sort: sorting(SORTING).orDefault({
    field: "name",
    direction: "ASC",
  }),
};

function StatsCard({ title, amount, help }: { title: string; amount: number; help: ReactNode }) {
  return (
    <Card padding={6}>
      <HStack>
        <Text fontWeight={500} color="gray.600">
          {title}
        </Text>
        <HelpPopover>{help}</HelpPopover>
      </HStack>
      <Text fontWeight={600} fontSize="3xl">
        {amount}
      </Text>
    </Card>
  );
}

export function Overview() {
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: { me, realMe },
  } = useAssertQuery(Overview_userDocument);

  const sections = useReportsSections();

  const [{ status, report, tableType }, setState] = useState<{
    status: "IDLE" | "LOADING" | "LOADED" | "ERROR";
    report: ReportType | null;
    tableType: OverviewTableType;
  }>({
    status: "IDLE",
    report: null,
    tableType: "STATUS",
  });

  const reportDateRange = useRef<Date[] | null>(null);

  const otherTemplates = report?.other_templates
    ? {
        ...report!.other_templates,
        name: intl.formatMessage(
          {
            id: "page.reports-overview.other-templates",
            defaultMessage: "Other templates not shared with me ({count})",
          },
          {
            count: 80,
          }
        ),
      }
    : null;

  const parallelsScratch = report?.petitions_scratch
    ? {
        ...report!.petitions_scratch,
        name: intl.formatMessage({
          id: "page.reports-overview.parallels-scratch",
          defaultMessage: "Parallels created from scratch",
        }),
      }
    : null;

  const [list, searchedList] = useMemo(() => {
    const {
      items,
      page,
      search,
      sort: { direction, field },
    } = state;

    let templates = report?.templates ?? [];

    otherTemplates && templates.push(otherTemplates);
    parallelsScratch && templates.push(parallelsScratch);

    if (search) {
      templates = templates.filter(({ name }) => {
        return name && name.includes(search);
      });
    }

    if (field === "name") {
      templates = sort(templates, (a, b) => (a[field] ?? "").localeCompare(b[field] ?? ""));
    } else {
      templates = sortBy(templates, (row) => {
        switch (field) {
          case "total":
            return tableType === "TIME"
              ? (row.times.pending_to_complete ?? 0) + (row.times.complete_to_close ?? 0)
              : row.status.pending + row.status.completed + row.status.closed;

          case "signed":
            return tableType === "TIME"
              ? (row.times.pending_to_complete ?? 0) + (row.times.complete_to_close ?? 0)
              : row.status.signed;

          case "completed":
            return tableType === "TIME" ? row.times.pending_to_complete ?? 0 : row.status.completed;

          case "closed":
            return tableType === "TIME" ? row.times.complete_to_close ?? 0 : row.status.closed;

          default:
            return row[field];
        }
      });
    }

    if (direction === "DESC") {
      templates = templates.reverse();
    }

    return [templates.slice((page - 1) * items, page * items), templates];
  }, [report, state, tableType]);

  const [search, setSearch] = useState(state.search);
  const debouncedOnSearchChange = useDebouncedCallback(
    (value) => {
      setQueryState((current) => ({
        ...current,
        search: value,
        page: 1,
      }));
    },
    300,
    [setQueryState]
  );

  const handleSearchChange = useCallback(
    (value: string | null) => {
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );

  const taskAbortController = useRef<AbortController | null>(null);

  const templatesOverviewTask = useTemplatesOverviewReportBackgroundTask();

  const handleGenerateReportClick = async () => {
    try {
      setState((state) => ({ ...state, status: "LOADING" }));
      taskAbortController.current?.abort();
      taskAbortController.current = new AbortController();
      const { task } = await stallFor(
        () =>
          templatesOverviewTask(
            {
              startDate: state.range?.[0].toISOString() ?? null,
              endDate: state.range?.[1].toISOString() ?? null,
            },
            { signal: taskAbortController.current!.signal, timeout: 60_000 }
          ),
        2_000 + 1_000 * Math.random()
      );
      reportDateRange.current = state.range;
      setState((state) => ({ ...state, report: task.output as any, status: "LOADED" }));
    } catch (e: any) {
      if (e.message === "ABORTED") {
        // nothing
      } else {
        setState((state) => ({ ...state, status: "ERROR" }));
      }
    }
  };

  const handleDateRangeChange = (range: [Date, Date] | null) => {
    setState((state) => ({ ...state, status: "IDLE" }));
    setQueryState((s) => ({ ...s, range }));
  };

  const columnsStatus = useOverviewTemplateStatusColumns();
  const columnsTime = useOverviewTemplateTimesColumns();

  const downloadExcel = useDownloadOverviewExcel();
  const handleDownloadReport = async () => {
    let templates = [...report!.templates];

    otherTemplates && templates.push(otherTemplates);
    parallelsScratch && templates.push(parallelsScratch);

    downloadExcel({ range: state.range, templates });
  };

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "page.reports.overview",
        defaultMessage: "Overview",
      })}
      basePath="/app/reports"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="page.reports.title" defaultMessage="Reports" />}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="page.reports.overview" defaultMessage="Overview" />
        </Heading>
      }
    >
      <Stack spacing={6} padding={6}>
        <Stack direction={{ base: "column", md: "row" }} spacing={0} gridGap={2} flex="1">
          <DateRangePickerButton
            value={state.range as [Date, Date] | null}
            onChange={handleDateRangeChange}
            isDisabled={status === "LOADING"}
          />
          <Button
            minWidth="fit-content"
            colorScheme="primary"
            onClick={handleGenerateReportClick}
            fontWeight="500"
            isDisabled={status === "LOADED" || status === "LOADING"}
          >
            <FormattedMessage id="page.reports.generate" defaultMessage="Generate" />
          </Button>
        </Stack>
        {isDefined(report) && (status === "LOADED" || status === "IDLE") ? (
          <>
            <Grid
              templateColumns={{
                lg: "repeat(2, 1fr)",
                xl: "repeat(4, 1fr)",
              }}
              gap={4}
            >
              <StatsCard
                title={intl.formatMessage({
                  id: "page.reports-overview.total-parallels",
                  defaultMessage: "Total parallels",
                })}
                amount={report.totals.all}
                help={
                  <Stack>
                    <Text>
                      <FormattedMessage
                        id="page.reports-overview.total-parallels-description"
                        defaultMessage="This is the total number of parallels created in the organization. "
                      />
                    </Text>
                    <Text>
                      <FormattedMessage
                        id="page.reports-overview.not-include-deleted-or-drafts"
                        defaultMessage="This number doesn't include deleted o parallels or unanswered drafts."
                      />
                    </Text>
                  </Stack>
                }
              />
              <StatsCard
                title={intl.formatMessage({
                  id: "page.reports-overview.completed-parallels",
                  defaultMessage: "Completed",
                })}
                amount={report.totals.completed}
                help={
                  <Stack>
                    <Text>
                      <FormattedMessage
                        id="page.reports-overview.completed-parallels-description"
                        defaultMessage="This is the total parallels completed in the organization."
                      />
                    </Text>
                    <Text>
                      <FormattedMessage
                        id="page.reports-overview.not-include-deleted-or-drafts"
                        defaultMessage="This number doesn't include deleted o parallels or unanswered drafts."
                      />
                    </Text>
                  </Stack>
                }
              />
              <StatsCard
                title={intl.formatMessage({
                  id: "page.reports-overview.signed-parallels",
                  defaultMessage: "Signed",
                })}
                amount={report.totals.signed}
                help={
                  <Stack>
                    <Text>
                      <FormattedMessage
                        id="page.reports-overview.signed-parallels-description"
                        defaultMessage="This is the total signatures completed in the organization, through one of our integrated eSignature providers."
                      />
                    </Text>
                    <Text>
                      <FormattedMessage
                        id="page.reports-overview.not-include-unsigned"
                        defaultMessage="Processes in which a signer hasn't yet signed aren't included."
                      />
                    </Text>
                  </Stack>
                }
              />
              <StatsCard
                title={intl.formatMessage({
                  id: "page.reports-overview.closed-parallels",
                  defaultMessage: "Closed",
                })}
                amount={report.totals.closed}
                help={
                  <Stack>
                    <Text>
                      <FormattedMessage
                        id="page.reports-overview.closed-parallels-description"
                        defaultMessage="This is the total parallels closed in the organization."
                      />
                    </Text>
                    <Text>
                      <FormattedMessage
                        id="page.reports-overview.not-include-deleted-or-drafts"
                        defaultMessage="This number doesn't include deleted o parallels or unanswered drafts."
                      />
                    </Text>
                  </Stack>
                }
              />
            </Grid>
            <TablePage
              zIndex={1}
              flex="0 1 auto"
              minHeight={0}
              isHighlightable
              columns={tableType === "STATUS" ? columnsStatus : columnsTime}
              rows={list}
              rowKeyProp="from_template_id"
              loading={false}
              page={state.page}
              pageSize={state.items}
              totalCount={searchedList?.length ?? 0}
              sort={state.sort}
              onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
              onPageSizeChange={(items) =>
                setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
              }
              onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
              header={
                <OverviewReportsListTableHeader
                  search={search}
                  tableType={tableType}
                  onSearchChange={handleSearchChange}
                  onChangeTableType={(tableType: OverviewTableType) =>
                    setState((s) => ({ ...s, tableType }))
                  }
                  onDownloadReport={handleDownloadReport}
                />
              }
              body={
                list.length === 0 ? (
                  state.search ? (
                    <Flex flex="1" alignItems="center" justifyContent="center">
                      <Text color="gray.300" fontSize="lg">
                        <FormattedMessage
                          id="page.reports-overview.no-templates-matching-search"
                          defaultMessage="There's no templates matching your search"
                        />
                      </Text>
                    </Flex>
                  ) : (
                    <Stack flex="1" alignItems="center" justifyContent="center">
                      <Text fontSize="lg">
                        <FormattedMessage
                          id="page.reports-overview.no-templates-found"
                          defaultMessage="We have not found any template."
                        />
                      </Text>
                      <Text fontSize="lg">
                        <FormattedMessage
                          id="page.reports-overview.select-dates-or-create"
                          defaultMessage="Please select other dates or create a new template."
                        />
                      </Text>
                    </Stack>
                  )
                ) : null
              }
            />
          </>
        ) : (
          <Stack minHeight="340px" alignItems="center" justifyContent="center" textAlign="center">
            {status === "LOADING" ? (
              <ReportsLoadingMessage />
            ) : status === "ERROR" ? (
              <ReportsErrorMessage />
            ) : (
              <ReportsReadyMessage
                title={intl.formatMessage({
                  id: "page.reports-overview.ready-to-generate",
                  defaultMessage: "We are ready to generate your overview report!",
                })}
                body={intl.formatMessage({
                  id: "page.reports-overview.choose-date-range",
                  defaultMessage:
                    "Choose the date range you need to view the results of your templates",
                })}
              />
            )}
          </Stack>
        )}
      </Stack>
    </SettingsLayout>
  );
}

Overview.fragments = {
  PetitionTemplate: gql`
    fragment Overview_PetitionTemplate on PetitionTemplate {
      id
      name
    }
  `,
};

Overview.queries = [
  gql`
    query Overview_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
];

Overview.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Overview_userDocument);
};

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(Overview);

function useOverviewTemplateStatusColumns(): TableColumn<TemplateStats>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.template",
          defaultMessage: "Template",
        }),
        cellProps: {
          width: "60%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return (
            <OverflownText textStyle={row.name ? undefined : "hint"}>
              {row.name ||
                intl.formatMessage({
                  id: "generic.unnamed-template",
                  defaultMessage: "Unnamed template",
                })}
            </OverflownText>
          );
        },
      },
      {
        key: "total",
        isSortable: true,
        header: intl.formatMessage({
          id: "page.reports-overview.total",
          defaultMessage: "Total",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <>{row.status.all}</>,
      },
      {
        key: "completed",
        isSortable: true,
        header: intl.formatMessage({
          id: "page.reports-overview.completed",
          defaultMessage: "Completed",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <>{row.status.completed}</>,
      },
      {
        key: "signed",
        isSortable: true,
        header: intl.formatMessage({
          id: "page.reports-overview.signed",
          defaultMessage: "Signed",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <>{row.status.signed}</>,
      },
      {
        key: "closed",
        isSortable: true,
        header: intl.formatMessage({
          id: "page.reports-overview.closed",
          defaultMessage: "Closed",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <>{row.status.closed}</>,
      },
    ],
    [intl.locale]
  );
}

function useOverviewTemplateTimesColumns(): TableColumn<TemplateStats>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.template",
          defaultMessage: "Template",
        }),
        cellProps: {
          width: "60%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return (
            <OverflownText textStyle={row.name ? undefined : "hint"}>
              {row.name ||
                intl.formatMessage({
                  id: "generic.unnamed-template",
                  defaultMessage: "Unnamed template",
                })}
            </OverflownText>
          );
        },
      },
      {
        key: "total",
        isSortable: true,
        header: intl.formatMessage({
          id: "page.reports-overview.total",
          defaultMessage: "Total",
        }),
        headerHelp: (
          <Stack>
            <Text>
              <FormattedMessage
                id="page.reports-overview.total-help-1"
                defaultMessage="This total is the average time from the start of the parallel until it is closed. That is, from when it's pending (🕒) until it's closed (✅✅)."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="page.reports-overview.total-help-2"
                defaultMessage="This number doesn't include deleted o parallels or unanswered drafts."
              />
            </Text>
          </Stack>
        ),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => (
          <TimeSpan
            duration={(row.times.pending_to_complete ?? 0) + (row.times.complete_to_close ?? 0)}
          />
        ),
      },
      {
        key: "completed",
        isSortable: true,
        header: intl.formatMessage({
          id: "page.reports-overview.time-to-complete",
          defaultMessage: "Time to complete",
        }),
        headerHelp: (
          <Stack>
            <Text>
              <FormattedMessage
                id="page.reports-overview.time-to-complete-help-1"
                defaultMessage="Average time from the start of the parallel until it is completed."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="page.reports-overview.time-to-complete-help-2"
                defaultMessage="This figure counts parallels completed internally as well as those sent to a third party."
              />
            </Text>
          </Stack>
        ),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <TimeSpan duration={row.times.pending_to_complete ?? 0} />,
      },
      {
        key: "signed",
        isSortable: true,
        header: intl.formatMessage({
          id: "page.reports-overview.time-to-sign",
          defaultMessage: "Time to sign",
        }),
        headerHelp: intl.formatMessage({
          id: "page.reports-overview.time-to-sign-help",
          defaultMessage:
            "This is the average time for documents to be signed since they were sent.",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <TimeSpan duration={row.times.signature_completed ?? 0} />,
      },
      {
        key: "closed",
        isSortable: true,
        header: intl.formatMessage({
          id: "page.reports-overview.time-to-close",
          defaultMessage: "Time to close",
        }),
        headerHelp: intl.formatMessage({
          id: "page.reports-overview.time-to-close-help",
          defaultMessage: "Average time from the completion of the parallel until it is closed.",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <TimeSpan duration={row.times.complete_to_close ?? 0} />,
      },
    ],
    [intl.locale]
  );
}

function useDownloadOverviewExcel() {
  const intl = useIntl();

  const worksheetColumns = useMemo(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "generic.template",
          defaultMessage: "Template",
        }),
        width: 30,
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
        key: "total_time",
        header: intl.formatMessage({
          id: "page.reports-overview.total",
          defaultMessage: "Total",
        }),
        width: 20,
        style: { numFmt: "0.00" },
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
    ],
    [intl.locale]
  );

  return async ({
    range: dateRange,
    templates,
  }: {
    range: Date[] | null;
    templates: TemplateStats[];
  }) => {
    const exceljs = (await import("exceljs")).default;

    const startDate = dateRange?.[0];
    const endDate = dateRange?.[1];
    const range = startDate
      ? `${intl
          .formatDate(startDate, {
            ...FORMATS["L"],
          })
          .replace(/\//g, "-")}_${intl
          .formatDate(endDate, {
            ...FORMATS["L"],
          })
          .replace(/\//g, "-")}`
      : intl
          .formatDate(new Date(), {
            ...FORMATS["L"],
          })
          .replace(/\//g, "-");

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet(
      intl.formatMessage({
        id: "page.reports-overview.worksheet-name",
        defaultMessage: "Overview report",
      })
    );

    const _templates = sort(templates, (a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

    worksheet.columns = worksheetColumns;
    worksheet.spliceRows(1, 0, []);
    worksheet.mergeCells("B1:E1");
    worksheet.mergeCells("F1:I1");
    worksheet.getCell("A1").value = "";
    worksheet.getCell("B1").value = intl.formatMessage({
      id: "page.reports-overview.status",
      defaultMessage: "Status",
    });
    worksheet.getCell("F1").value = intl.formatMessage({
      id: "page.reports-overview.time-hours",
      defaultMessage: "Time (hours)",
    });
    worksheet.addRows(
      _templates.map((row) => ({
        name: row.name,
        total: row.status.all,
        completed: row.status.completed,
        signed: row.status.signed,
        closed: row.status.closed,
        total_time:
          ((row.times.pending_to_complete ?? 0) + (row.times.complete_to_close ?? 0)) / 3600,
        time_to_complete: (row.times.pending_to_complete ?? 0) / 3600,
        time_to_sign: (row.times.signature_completed ?? 0) / 3600,
        time_to_close: (row.times.complete_to_close ?? 0) / 3600,
      }))
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = intl.formatMessage(
      {
        id: "page.reports-overview.export-file-name",
        defaultMessage: "overview-report_{range}",
      },
      {
        range,
      }
    );
    link.click();
  };
}
