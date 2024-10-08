import { gql } from "@apollo/client";
import { Box, Button, Center, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { CheckIcon, DownloadIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { NakedHelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionSelect } from "@parallel/components/common/PetitionSelect";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { ReportsSidebarLayout } from "@parallel/components/layout/ReportsSidebarLayout";
import { DateRangePickerButton } from "@parallel/components/reports/common/DateRangePickerButton";
import { ReportsLoadingMessage } from "@parallel/components/reports/common/ReportsLoadingMessage";
import { ReportsReadyMessage } from "@parallel/components/reports/common/ReportsReadyMessage";
import { ReportsReplies_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { date, string, useQueryState } from "@parallel/utils/queryState";
import { useTemplateRepliesReportTask } from "@parallel/utils/tasks/useTemplateRepliesReportTask";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const QUERY_STATE = {
  range: date().list({ maxItems: 2 }),
  template: string(),
};

export function ReportsReplies() {
  const intl = useIntl();
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const { data: queryObject } = useAssertQuery(ReportsReplies_userDocument);

  const [{ status, activeTemplateId, activeRange, showDownload }, setState] = useState<{
    status: "IDLE" | "LOADING" | "ERROR";
    activeTemplateId: string | null;
    activeRange: Date[] | null;
    showDownload: boolean;
  }>({
    status: "IDLE",
    activeTemplateId: null,
    activeRange: null,
    showDownload: false,
  });

  const handleGenerateReportClick = () => {
    setState((state) => ({ ...state, status: "LOADING" }));

    setTimeout(() => {
      setState((state) => ({
        ...state,
        status: "IDLE",
        showDownload: true,
        activeTemplateId: queryState.template,
        activeRange: queryState.range,
      }));
    }, 2000);
  };

  const handleTemplateRepliesReportTask = useTemplateRepliesReportTask();

  return (
    <ReportsSidebarLayout
      title={intl.formatMessage({
        id: "page.reports.replies",
        defaultMessage: "Replies",
      })}
      queryObject={queryObject}
      header={
        <HStack width="100%" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h3" size="md">
            <FormattedMessage id="page.reports.replies" defaultMessage="Replies" />
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

        <Stack direction={{ base: "column", lg: "row" }} spacing={0} gridGap={2} flex="1">
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
                  setQueryState((state) => ({ ...state, template: template?.id ?? null }));
                  setState((state) => ({ ...state, showDownload: false }));
                }}
                placeholder={intl.formatMessage({
                  id: "page.reports.select-a-template",
                  defaultMessage: "Select a template...",
                })}
                isDisabled={status === "LOADING"}
              />
            </Box>
          </HStack>
          <DateRangePickerButton
            value={queryState.range as [Date, Date] | null}
            onChange={(range) => {
              setQueryState((s) => ({ ...s, range }));
              setState((state) => ({ ...state, showDownload: false }));
            }}
          />
          <Button
            minWidth="fit-content"
            colorScheme="primary"
            onClick={handleGenerateReportClick}
            fontWeight="500"
            isDisabled={showDownload || !queryState.template}
          >
            <FormattedMessage id="page.reports.generate" defaultMessage="Generate" />
          </Button>
        </Stack>
        {showDownload ? (
          <Center as={Stack} spacing={6} padding={6} paddingTop={16}>
            <Center margin="auto" borderRadius="full" background="green.500" boxSize={10}>
              <CheckIcon color="white" role="presentation" boxSize={6} />
            </Center>
            <Text>
              <FormattedMessage
                id="page.reports-replies.generated-successfully"
                defaultMessage="Report generated successfully"
              />
            </Text>
            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="primary"
              onClick={() =>
                handleTemplateRepliesReportTask(
                  activeTemplateId!,
                  activeRange?.[0].toISOString() ?? null,
                  activeRange?.[1].toISOString() ?? null,
                )
              }
            >
              <OverflownText>
                <FormattedMessage
                  id="page.reports-replies.download-replies"
                  defaultMessage="Download replies"
                />
              </OverflownText>
            </Button>
          </Center>
        ) : (
          <Stack minHeight="340px" alignItems="center" justifyContent="center" textAlign="center">
            {status === "LOADING" ? (
              <ReportsLoadingMessage />
            ) : (
              <ReportsReadyMessage
                title={intl.formatMessage({
                  id: "page.reports-replies.ready-to-generate",
                  defaultMessage: "Analyze the replies from a template",
                })}
                body={intl.formatMessage({
                  id: "page.reports-replies.generate-report-replies",
                  defaultMessage: "Download a report with the replies to your templates.",
                })}
              />
            )}
          </Stack>
        )}
      </Stack>
    </ReportsSidebarLayout>
  );
}

ReportsReplies.fragments = {
  PetitionTemplate: gql`
    fragment ReportsReplies_PetitionTemplate on PetitionTemplate {
      id
      name
    }
  `,
};

ReportsReplies.queries = [
  gql`
    query ReportsReplies_user {
      ...ReportsSidebarLayout_Query
    }
    ${ReportsSidebarLayout.fragments.Query}
  `,
];

ReportsReplies.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(ReportsReplies_userDocument);
};

export default compose(
  withDialogs,
  withPermission("REPORTS:TEMPLATE_REPLIES"),
  withApolloData,
)(ReportsReplies);
