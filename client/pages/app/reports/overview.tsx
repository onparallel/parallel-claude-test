import { gql } from "@apollo/client";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Grid,
  Heading,
  HStack,
  Stack,
  Text,
  useRadioGroup,
} from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { RadioButton } from "@parallel/components/common/RadioButton";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { Spacer } from "@parallel/components/common/Spacer";
import { TableColumn, TableSorting } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { DateRangePickerButton } from "@parallel/components/reports/DateRangePickerButton";
import { ReportsErrorMessage } from "@parallel/components/reports/ReportsErrorMessage";
import { ReportsLoadingMessage } from "@parallel/components/reports/ReportsLoadingMessage";
import { ReportsReadyMessage } from "@parallel/components/reports/ReportsReadyMessage";
import { TimeSpan } from "@parallel/components/reports/TimeSpan";
import { Maybe, Overview_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { stallFor } from "@parallel/utils/promises/stallFor";
import { date, useQueryState } from "@parallel/utils/queryState";
import { useTemplatesOverviewReportBackgroundTask } from "@parallel/utils/tasks/useTemplatesOverviewReportTask";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useReportsSections } from "@parallel/utils/useReportsSections";
import { ReactNode, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, sortBy, sumBy } from "remeda";

interface PetitionStatusCount {
  all: number;
  pending: number;
  completed: number;
  closed: number;
  signed: number;
}

interface TemplateStats {
  aggregation_type: "TEMPLATE" | "NO_ACCESS" | "NO_TEMPLATE";
  template_id?: Maybe<string>;
  template_name?: Maybe<string>;
  template_count?: number;
  status: PetitionStatusCount;
  times: {
    pending_to_complete: Maybe<number>;
    complete_to_close: Maybe<number>;
    signature_completed: Maybe<number>;
  };
}

export const QUERY_STATE = {
  range: date().list(2),
};

type OverviewTableSorting =
  | "template_name"
  | "status.all"
  | "status.completed"
  | "status.signed"
  | "status.closed"
  | "times.total"
  | "times.pending_to_complete"
  | "times.signature_completed"
  | "times.complete_to_close";

type OverviewTableType = "STATUS" | "TIME";

export function Overview() {
  const intl = useIntl();
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: { me, realMe },
  } = useAssertQuery(Overview_userDocument);

  const sections = useReportsSections();

  const [{ status, report, activeRange }, setState] = useState<{
    status: "IDLE" | "LOADING" | "LOADED" | "ERROR";
    report: TemplateStats[] | null;
    activeRange: Date[] | null;
  }>({
    status: "IDLE",
    report: null,
    activeRange: null,
  });

  const [{ page, search, items, sort, tableType }, setTableState] = useState({
    page: 1,
    search: "",
    items: 10,
    sort: {
      field: "status.all",
      direction: "DESC",
    } as TableSorting<OverviewTableSorting>,
    tableType: "STATUS" as OverviewTableType,
  });
  const [_search, setSearch] = useState("");

  const [tableRows, totalCount] = useMemo(() => {
    let rows = report ?? [];
    if (search) {
      const _search = search.toLowerCase();
      rows = rows.filter((t) => t.template_name?.toLowerCase().includes(_search));
    }
    switch (sort.field) {
      case "template_name":
        rows = sortBy(rows, [(r) => r.template_name ?? "", sort.direction.toLowerCase() as any]);
        break;
      case "times.total":
        rows = sortBy(rows, [
          (r) => (r.times.pending_to_complete ?? 0) + (r.times.complete_to_close ?? 0),
          sort.direction.toLowerCase() as any,
        ]);
        break;
      default:
        rows = sortBy(rows, [
          (r) => sort.field.split(".").reduce((acc, prop) => acc?.[prop], r as any) ?? 0,
          sort.direction.toLowerCase() as any,
        ]);
        break;
    }
    return [rows.slice((page - 1) * items, page * items), rows.length];
  }, [report, page, search, items, sort.field, sort.direction, tableType]);

  const debouncedSearchChange = useDebouncedCallback(
    (value) => {
      setTableState((current) => ({
        ...current,
        search: value,
        page: 1,
      }));
    },
    300,
    [setTableState]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSearchChange(value);
  };

  const taskAbortController = useRef<AbortController | null>(null);

  const templatesOverviewTask = useTemplatesOverviewReportBackgroundTask();

  const handleGenerateReportClick = async () => {
    try {
      setState((state) => ({ ...state, status: "LOADING", activeRange: queryState.range }));
      taskAbortController.current?.abort();
      taskAbortController.current = new AbortController();
      const { task } = await stallFor(
        () =>
          templatesOverviewTask(
            {
              startDate: queryState.range?.[0].toISOString() ?? null,
              endDate: queryState.range?.[1].toISOString() ?? null,
            },
            { signal: taskAbortController.current!.signal, timeout: 60_000 }
          ),
        2_000 + 1_000 * Math.random()
      );
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

  const columns = useOverviewColumns(tableType);

  const downloadExcel = useDownloadOverviewExcel();
  const handleDownloadReport = async () => {
    downloadExcel({ range: activeRange, templates: report ?? [] });
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
            value={queryState.range as [Date, Date] | null}
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
                amount={sumBy(report ?? [], (r) => r.status.all)}
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
                amount={sumBy(report ?? [], (r) => r.status.completed)}
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
                amount={sumBy(report ?? [], (r) => r.status.signed)}
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
                amount={sumBy(report ?? [], (r) => r.status.closed)}
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
              columns={columns}
              rows={tableRows}
              rowKeyProp={(row) =>
                row.aggregation_type === "TEMPLATE" ? row.template_id! : row.aggregation_type
              }
              loading={false}
              page={page}
              pageSize={items}
              totalCount={totalCount}
              sort={sort}
              onPageChange={(page) => setTableState((s) => ({ ...s, page }))}
              onPageSizeChange={(items) => setTableState((s) => ({ ...s, items, page: 1 }))}
              onSortChange={(sort) => setTableState((s) => ({ ...s, sort, page: 1 }))}
              header={
                <OverviewReportsListTableHeader
                  search={_search}
                  tableType={tableType}
                  onSearchChange={handleSearchChange}
                  onTableTypeChange={(tableType) => {
                    setTableState((s) => ({
                      ...s,
                      tableType,
                      page: 1,
                      sort: { field: "status.all", direction: "DESC" },
                    }));
                  }}
                  onReportDownload={handleDownloadReport}
                />
              }
              body={
                tableRows.length === 0 ? (
                  search ? (
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

interface OverviewReportsListTableHeaderProps {
  tableType: OverviewTableType;
  search: string;
  onSearchChange: (value: string) => void;
  onTableTypeChange: (value: OverviewTableType) => void;
  onReportDownload: () => void;
}

function OverviewReportsListTableHeader({
  tableType,
  search,
  onSearchChange,
  onTableTypeChange,
  onReportDownload,
}: OverviewReportsListTableHeaderProps) {
  const intl = useIntl();

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "categories",
    value: tableType,
    onChange: onTableTypeChange,
  });

  return (
    <Stack direction="row" padding={2}>
      <Box flex="0 1 400px">
        <SearchInput value={search ?? ""} onChange={(e) => onSearchChange(e.target.value)} />
      </Box>
      <Spacer />
      <ButtonGroup isAttached variant="outline" {...getRootProps()}>
        <RadioButton {...getRadioProps({ value: "STATUS" })} minWidth="fit-content">
          <FormattedMessage
            id="component.overview-reports-list-table-header.status"
            defaultMessage="Status"
          />
        </RadioButton>
        <RadioButton {...getRadioProps({ value: "TIME" })}>
          <FormattedMessage
            id="component.overview-reports-list-table-header.time"
            defaultMessage="Time"
          />
        </RadioButton>
      </ButtonGroup>
      <IconButtonWithTooltip
        onClick={onReportDownload}
        icon={<DownloadIcon />}
        label={intl.formatMessage({
          id: "component.overview-reports-list-table-header.download-report",
          defaultMessage: "Download report",
        })}
      />
    </Stack>
  );
}

function useOverviewColumns(tableType: OverviewTableType): TableColumn<TemplateStats>[] {
  const intl = useIntl();
  return useMemo(
    () =>
      [
        {
          key: "template_name",
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
            return row.aggregation_type === "NO_ACCESS" ? (
              <OverflownText fontStyle="italic">
                <FormattedMessage
                  id="page.reports-overview.other-templates"
                  defaultMessage="Other templates not shared with me ({count})"
                  values={{ count: row.template_count ?? 0 }}
                />
              </OverflownText>
            ) : row.aggregation_type === "NO_TEMPLATE" ? (
              <OverflownText fontStyle="italic">
                <FormattedMessage
                  id="page.reports-overview.parallels-scratch"
                  defaultMessage="Parallels created from scratch"
                />
              </OverflownText>
            ) : (
              <OverflownText textStyle={row.template_name ? undefined : "hint"}>
                {row.template_name ||
                  intl.formatMessage({
                    id: "generic.unnamed-template",
                    defaultMessage: "Unnamed template",
                  })}
              </OverflownText>
            );
          },
        },
        ...(tableType === "STATUS"
          ? ([
              {
                key: "status.all",
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
                key: "status.completed",
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
                key: "status.signed",
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
                key: "status.closed",
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
            ] as TableColumn<TemplateStats>[])
          : ([
              {
                key: "times.total",
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
                    duration={
                      (row.times.pending_to_complete ?? 0) + (row.times.complete_to_close ?? 0)
                    }
                  />
                ),
              },
              {
                key: "times.pending_to_complete",
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
                CellContent: ({ row }) => (
                  <TimeSpan duration={row.times.pending_to_complete ?? 0} />
                ),
              },
              {
                key: "times.signature_completed",
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
                CellContent: ({ row }) => (
                  <TimeSpan duration={row.times.signature_completed ?? 0} />
                ),
              },
              {
                key: "times.complete_to_close",
                isSortable: true,
                header: intl.formatMessage({
                  id: "page.reports-overview.time-to-close",
                  defaultMessage: "Time to close",
                }),
                headerHelp: intl.formatMessage({
                  id: "page.reports-overview.time-to-close-help",
                  defaultMessage:
                    "Average time from the completion of the parallel until it is closed.",
                }),
                cellProps: {
                  width: "10%",
                  minWidth: "120px",
                },
                CellContent: ({ row }) => <TimeSpan duration={row.times.complete_to_close ?? 0} />,
              },
            ] as TableColumn<TemplateStats>[])),
      ] as TableColumn<TemplateStats>[],
    [intl.locale, tableType]
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
      templates.map((row) => ({
        name:
          row.aggregation_type === "NO_ACCESS"
            ? intl.formatMessage(
                {
                  id: "page.reports-overview.other-templates",
                  defaultMessage: "Other templates not shared with me ({count})",
                },
                { count: row.template_count ?? 0 }
              )
            : row.aggregation_type === "NO_TEMPLATE"
            ? intl.formatMessage({
                id: "page.reports-overview.parallels-scratch",
                defaultMessage: "Parallels created from scratch",
              })
            : row.template_name ||
              intl.formatMessage({
                id: "generic.unnamed-template",
                defaultMessage: "Unnamed template",
              }),
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
