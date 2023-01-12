import { gql } from "@apollo/client";
import { Button, Flex, Grid, Heading, Stack, Text } from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
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
import { stallFor } from "@parallel/utils/promises/stallFor";
import { date, integer, string, useQueryState, values } from "@parallel/utils/queryState";
import { useTemplatesOverviewReportBackgroundTask } from "@parallel/utils/tasks/useTemplatesOverviewReportTask";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useReportsSections } from "@parallel/utils/useReportsSections";
import { useCallback, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

type TemplateStats = {
  template_id: string;
  name: Maybe<string>;
  pending: number;
  completed: number;
  closed: number;
  pending_to_complete: number | null;
  complete_to_close: number | null;
  signatures: { completed: number; time_to_complete: number | null };
};

interface ReportType {
  total: number;
  completed: number;
  signed: number;
  closed: number;
  templates: TemplateStats[];
}

export const QUERY_STATE = {
  range: date().list(2),
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
};

function StatsCard({ title, amount }: { title: string; amount: number }) {
  return (
    <Card padding={6}>
      <Text fontWeight={500} color="gray.600">
        {title}
      </Text>
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
    status: "IDLE" | "LOADING" | "ERROR";
    report: ReportType | null;
    tableType: OverviewTableType;
  }>({
    status: "IDLE",
    report: null,
    tableType: "STATUS",
  });

  const [list, searchedList] = useMemo(() => {
    const { items, page, search } = state;

    let templates = report?.templates ?? [];
    if (search) {
      templates = templates.filter(({ name }) => {
        return name && name.includes(search);
      });
    }

    return [templates.slice((page - 1) * items, page * items), templates];
  }, [report, state]);

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
      console.log("handleGenerateReportClick start");
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
      setState((state) => ({ ...state, report: task.output as any, status: "IDLE" }));
    } catch (e: any) {
      if (e.message === "ABORTED") {
        // nothing
      } else {
        setState((state) => ({ ...state, status: "ERROR" }));
      }
    }
  };

  const columnsStatus = useOverviewTemplateStatusColumns();
  const columnsTime = useOverviewTemplateTimesColumns();

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
            onChange={(range) => setQueryState((s) => ({ ...s, range }))}
          />
          <Button
            minWidth="fit-content"
            colorScheme="primary"
            isDisabled={false}
            onClick={handleGenerateReportClick}
            fontWeight="500"
          >
            <FormattedMessage id="page.reports.generate" defaultMessage="Generate" />
          </Button>
        </Stack>
        {isDefined(report) && status === "IDLE" ? (
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
                amount={report.total}
              />
              <StatsCard
                title={intl.formatMessage({
                  id: "page.reports-overview.completed-parallels",
                  defaultMessage: "Completed",
                })}
                amount={report.completed}
              />
              <StatsCard
                title={intl.formatMessage({
                  id: "page.reports-overview.signed-parallels",
                  defaultMessage: "Signed",
                })}
                amount={report.signed}
              />
              <StatsCard
                title={intl.formatMessage({
                  id: "page.reports-overview.closed-parallels",
                  defaultMessage: "Closed",
                })}
                amount={report.closed}
              />
            </Grid>
            <TablePage
              zIndex={1}
              flex="0 1 auto"
              minHeight={0}
              isHighlightable
              columns={tableType === "STATUS" ? columnsStatus : columnsTime}
              rows={list}
              rowKeyProp="template_id"
              loading={false}
              page={state.page}
              pageSize={state.items}
              totalCount={searchedList?.length ?? 0}
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
        header: intl.formatMessage({
          id: "page.reports-overview.total",
          defaultMessage: "Total",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <>{row.pending + row.completed + row.closed}</>,
      },
      {
        key: "completed",
        header: intl.formatMessage({
          id: "page.reports-overview.completed",
          defaultMessage: "Completed",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <>{row.completed}</>,
      },
      {
        key: "signed",
        header: intl.formatMessage({
          id: "page.reports-overview.signed",
          defaultMessage: "Signed",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <>{row.signatures.completed}</>,
      },
      {
        key: "closed",
        header: intl.formatMessage({
          id: "page.reports-overview.closed",
          defaultMessage: "Closed",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <>{row.closed}</>,
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
        header: intl.formatMessage({
          id: "page.reports-overview.total",
          defaultMessage: "Total",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => (
          <TimeSpan duration={(row.pending_to_complete ?? 0) + (row.complete_to_close ?? 0)} />
        ),
      },
      {
        key: "time_to_complete",
        header: intl.formatMessage({
          id: "page.reports-overview.time-to-complete",
          defaultMessage: "Time to complete",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <TimeSpan duration={row.pending_to_complete ?? 0} />,
      },
      {
        key: "time_to_sign",
        header: intl.formatMessage({
          id: "page.reports-overview.time-to-sign",
          defaultMessage: "Time to sign",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <TimeSpan duration={row.signatures.time_to_complete ?? 0} />,
      },
      {
        key: "time_to_close",
        header: intl.formatMessage({
          id: "page.reports-overview.time-to-close",
          defaultMessage: "Time to close",
        }),
        cellProps: {
          width: "10%",
          minWidth: "120px",
        },
        CellContent: ({ row }) => <TimeSpan duration={row.complete_to_close ?? 0} />,
      },
    ],
    [intl.locale]
  );
}
