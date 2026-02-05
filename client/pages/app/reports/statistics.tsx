import { gql } from "@apollo/client";
import { Box, Button, Heading, HStack, Stack } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { NakedHelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { PetitionSelect } from "@parallel/components/common/PetitionSelect";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { ReportsSidebarLayout } from "@parallel/components/layout/ReportsSidebarLayout";
import { DateRangePickerButton } from "@parallel/components/reports/common/DateRangePickerButton";
import { ReportsErrorMessage } from "@parallel/components/reports/common/ReportsErrorMessage";
import { ReportsLoadingMessage } from "@parallel/components/reports/common/ReportsLoadingMessage";
import { ReportsReadyMessage } from "@parallel/components/reports/common/ReportsReadyMessage";
import { ReportsStatisticsAverage } from "@parallel/components/reports/statistics/ReportsStatisticsAverage";
import { ReportsStatisticsConversion } from "@parallel/components/reports/statistics/ReportsStatisticsConversion";
import { ReportsStatisticsTime } from "@parallel/components/reports/statistics/ReportsStatisticsTime";
import { ReportsTemplates_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { stallFor } from "@parallel/utils/promises/stallFor";
import { date, string, useQueryState } from "@parallel/utils/queryState";
import { useTemplateStatsReportBackgroundTask } from "@parallel/utils/tasks/useTemplateStatsReportTask";
import { Maybe } from "@parallel/utils/types";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { Text } from "@parallel/components/ui";

export interface ReportTypeStatistics {
  from_template_id: string;
  has_replied_unsent: boolean;
  has_signature_config: boolean;
  status: {
    all: number;
    pending: number;
    completed: number;
    closed: number;
    signed: number;
  };
  times: {
    pending_to_complete: Maybe<number>;
    complete_to_close: Maybe<number>;
    signature_completed: Maybe<number>;
  };
  conversion_funnel: {
    sent: number;
    opened: number;
    first_reply: number;
    completed: number;
    signed: number;
    closed: number;
  };
  time_statistics: {
    opened: TimeStatistic;
    first_reply: TimeStatistic;
    completed: TimeStatistic;
    signed: TimeStatistic;
    closed: TimeStatistic;
  };
}

interface TimeStatistic {
  min: number | null;
  max: number | null;
  q1: number | null;
  q3: number | null;
  mean: number | null;
  median: number | null;
}

const QUERY_STATE = {
  range: date().list({ maxItems: 2 }),
  template: string(),
  name: string(),
};

export interface ActiveReportData {
  templateName?: string | null;
  templateId: string;
  range: Date[] | null;
  report: ReportTypeStatistics;
}

export function ReportsTemplates() {
  const intl = useIntl();
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const { data: queryObject } = useAssertQuery(ReportsTemplates_userDocument);

  const [{ status, activeTemplateId, templateName, report, activeRange }, setState] = useState<{
    status: "IDLE" | "LOADING" | "LOADED" | "ERROR";
    activeTemplateId: string | null;
    report: ReportTypeStatistics | null;
    activeRange: Date[] | null;
    templateName: string | null;
  }>({
    status: "IDLE",
    activeTemplateId: null,
    report: null,
    activeRange: null,
    templateName: null,
  });

  const taskAbortController = useRef<AbortController | null>(null);

  const handleDateRangeChange = (range: [Date, Date] | null) => {
    setState((state) => ({ ...state, status: "IDLE" }));
    setQueryState((s) => ({ ...s, range }));
  };

  const templateStatsReportBackgroundTask = useTemplateStatsReportBackgroundTask();

  const handleGenerateReportClick = async () => {
    try {
      setState((state) => ({
        ...state,
        status: "LOADING",
      }));
      taskAbortController.current?.abort();
      if (isNonNullish(queryState.template)) {
        taskAbortController.current = new AbortController();
        // add a fake delay
        const { task } = await stallFor(
          () =>
            templateStatsReportBackgroundTask(
              {
                templateId: queryState.template!,
                startDate: queryState.range?.[0].toISOString() ?? null,
                endDate: queryState.range?.[1].toISOString() ?? null,
              },
              { signal: taskAbortController.current!.signal, timeout: 60_000 },
            ),
          2_000 + 1_000 * Math.random(),
        );
        setState((state) => ({
          ...state,
          report: task.output as any,
          status: "LOADED",
          activeRange: queryState.range,
          activeTemplateId: queryState.template,
          templateName: queryState.name,
        }));
      }
    } catch (e: any) {
      if (e.message === "ABORTED") {
        // nothing
      } else {
        setState((state) => ({ ...state, status: "ERROR" }));
      }
    }
  };

  return (
    <ReportsSidebarLayout
      title={intl.formatMessage({
        id: "page.reports.statistics",
        defaultMessage: "Template statistics",
      })}
      queryObject={queryObject}
      header={
        <HStack width="100%" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h3" size="md">
            <FormattedMessage id="page.reports.statistics" defaultMessage="Template statistics" />
          </Heading>
          <Button
            as={NakedHelpCenterLink}
            variant="ghost"
            fontWeight="normal"
            colorScheme="primary"
            articleId={6272487}
          >
            <FormattedMessage id="generic.help-question" defaultMessage="Help?" />
          </Button>
        </HStack>
      }
    >
      <Stack spacing={2} padding={6}>
        <Text>
          <FormattedMessage id="generic.template" defaultMessage="Template" />:
        </Text>
        <Stack direction={{ base: "column", lg: "row" }} spacing={0} gridGap={2}>
          <HStack
            data-section="reports-select-template"
            flex="1"
            maxWidth={{ base: "100%", lg: "500px" }}
          >
            <Box flex="1" minWidth="0">
              <PetitionSelect
                type="TEMPLATE"
                value={queryState.template}
                onChange={(template) => {
                  setQueryState((state) => ({
                    ...state,
                    template: template?.id ?? null,
                    name: template?.name ?? null,
                  }));
                  setState((state) => ({ ...state, status: "IDLE" }));
                }}
                placeholder={intl.formatMessage({
                  id: "page.reports.select-a-template",
                  defaultMessage: "Select a template...",
                })}
                isDisabled={status === "LOADING"}
                noOfLines={2}
              />
            </Box>
          </HStack>
          <DateRangePickerButton
            value={queryState.range as [Date, Date] | null}
            onChange={handleDateRangeChange}
            isDisabled={status === "LOADING"}
          />

          <Button
            minWidth="fit-content"
            colorScheme="primary"
            isDisabled={status === "LOADED" || status === "LOADING" || !queryState.template}
            onClick={handleGenerateReportClick}
            fontWeight="500"
          >
            <FormattedMessage id="page.reports.generate" defaultMessage="Generate" />
          </Button>
        </Stack>
        {isNonNullish(report) && (status === "IDLE" || status === "LOADED") ? (
          <Stack spacing={6}>
            <ReportsStatisticsAverage
              report={report}
              range={activeRange}
              templateId={activeTemplateId!}
              templateName={templateName}
            />

            <ReportsStatisticsConversion
              report={report}
              range={activeRange}
              templateId={activeTemplateId!}
              templateName={templateName}
            />

            <ReportsStatisticsTime
              report={report}
              range={activeRange}
              templateId={activeTemplateId!}
              templateName={templateName}
            />
          </Stack>
        ) : (
          <Stack minHeight="340px" alignItems="center" justifyContent="center" textAlign="center">
            {status === "LOADING" ? (
              <ReportsLoadingMessage />
            ) : status === "ERROR" ? (
              <ReportsErrorMessage />
            ) : (
              <ReportsReadyMessage
                title={intl.formatMessage({
                  id: "page.reports-templates.ready-to-generate",
                  defaultMessage: "We are ready to generate your template report!",
                })}
              />
            )}
          </Stack>
        )}
      </Stack>
    </ReportsSidebarLayout>
  );
}

const _fragments = {
  PetitionTemplate: gql`
    fragment ReportsTemplates_PetitionTemplate on PetitionTemplate {
      id
      name
    }
  `,
};

ReportsTemplates.queries = [
  gql`
    query ReportsTemplates_user {
      ...ReportsSidebarLayout_Query
    }
  `,
];

ReportsTemplates.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(ReportsTemplates_userDocument);
};

export default compose(
  withDialogs,
  withPermission("REPORTS:TEMPLATE_STATISTICS"),
  withApolloData,
)(ReportsTemplates);
