import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  ListItem,
  OrderedList,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  CheckIcon,
  DoubleCheckIcon,
  PaperPlaneIcon,
  SignatureIcon,
  TableIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { NakedHelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { DateRangePickerButton } from "@parallel/components/reports/DateRangePickerButton";
import { ReportsDoughnutChart } from "@parallel/components/reports/ReportsDoughnutChart";
import { ReportsErrorMessage } from "@parallel/components/reports/ReportsErrorMessage";
import { ReportsLoadingMessage } from "@parallel/components/reports/ReportsLoadingMessage";
import { ReportsReadyMessage } from "@parallel/components/reports/ReportsReadyMessage";
import {
  ReportsTemplates_templatesDocument,
  ReportsTemplates_userDocument,
} from "@parallel/graphql/__types";
import { assertTypenameArray } from "@parallel/utils/apollo/typename";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { stallFor } from "@parallel/utils/promises/stallFor";
import { date, useQueryState } from "@parallel/utils/queryState";
import { useTemplateRepliesReportTask } from "@parallel/utils/tasks/useTemplateRepliesReportTask";
import { useTemplateStatsReportBackgroundTask } from "@parallel/utils/tasks/useTemplateStatsReportTask";
import { Maybe } from "@parallel/utils/types";
import { useReportsSections } from "@parallel/utils/useReportsSections";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { TimeSpan } from "../../../components/reports/TimeSpan";

interface ReportType {
  from_template_id: string;
  status: {
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
}

const QUERY_STATE = {
  range: date().list(2),
};

export function ReportsTemplates() {
  const intl = useIntl();
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: { me, realMe },
  } = useAssertQuery(ReportsTemplates_userDocument);

  const sections = useReportsSections();

  const [{ status, templateId, activeTemplateId, activeRange, report }, setState] = useState<{
    status: "IDLE" | "LOADING" | "LOADED" | "ERROR";
    templateId: string | null;
    activeTemplateId: string | null;
    activeRange: Date[] | null;
    report: ReportType | null;
  }>({
    status: "IDLE",
    templateId: null,
    activeTemplateId: null,
    activeRange: null,
    report: null,
  });
  const taskAbortController = useRef<AbortController | null>(null);

  const {
    data: {
      templates: { items: templates },
    },
  } = useAssertQueryOrPreviousData(ReportsTemplates_templatesDocument, {
    variables: {
      offset: 0,
      limit: 1999,
      isPublic: false,
    },
  });
  assertTypenameArray(templates, "PetitionTemplate");

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
        activeTemplateId: state.templateId,
        activeRange: queryState.range,
      }));
      taskAbortController.current?.abort();
      if (isDefined(templateId)) {
        taskAbortController.current = new AbortController();
        // add a fake delay
        const { task } = await stallFor(
          () =>
            templateStatsReportBackgroundTask(
              {
                templateId: templateId,
                startDate: queryState.range?.[0].toISOString() ?? null,
                endDate: queryState.range?.[1].toISOString() ?? null,
              },
              { signal: taskAbortController.current!.signal, timeout: 60_000 }
            ),
          2_000 + 1_000 * Math.random()
        );
        setState((state) => ({ ...state, report: task.output as any, status: "LOADED" }));
      }
    } catch (e: any) {
      if (e.message === "ABORTED") {
        // nothing
      } else {
        setState((state) => ({ ...state, status: "ERROR" }));
      }
    }
  };

  const handleTemplateRepliesReportTask = useTemplateRepliesReportTask();

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "page.reports.statistics",
        defaultMessage: "Template statistics",
      })}
      basePath="/app/reports"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="page.reports.title" defaultMessage="Reports" />}
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
          <Stack direction={{ base: "column", lg: "row" }} spacing={0} gridGap={2} flex="1">
            <HStack
              data-section="reports-select-template"
              flex="1"
              maxWidth={{ base: "100%", lg: "500px" }}
            >
              <Box flex="1" minWidth="0">
                <SimpleSelect
                  options={templates.map((t) => ({
                    label:
                      t.name ??
                      intl.formatMessage({
                        id: "generic.unnamed-template",
                        defaultMessage: "Unnamed template",
                      }),
                    value: t.id,
                  }))}
                  placeholder={intl.formatMessage({
                    id: "page.reports.select-a-template",
                    defaultMessage: "Select a template...",
                  })}
                  isSearchable={true}
                  value={templateId}
                  onChange={(templateId) =>
                    setState((state) => ({ ...state, templateId, status: "IDLE" }))
                  }
                  isDisabled={status === "LOADING"}
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
              isDisabled={status === "LOADED" || status === "LOADING" || !templateId}
              onClick={handleGenerateReportClick}
              fontWeight="500"
            >
              <FormattedMessage id="page.reports.generate" defaultMessage="Generate" />
            </Button>
          </Stack>
          {isDefined(report) && (status === "IDLE" || status === "LOADED") ? (
            <Button
              leftIcon={<TableIcon />}
              colorScheme="primary"
              onClick={() =>
                handleTemplateRepliesReportTask(
                  activeTemplateId!,
                  activeRange?.[0].toISOString() ?? null,
                  activeRange?.[1].toISOString() ?? null
                )
              }
            >
              <OverflownText>
                <FormattedMessage
                  id="page.reports.download-replies"
                  defaultMessage="Download replies"
                />
              </OverflownText>
            </Button>
          ) : null}
        </Stack>
        {isDefined(report) && (status === "IDLE" || status === "LOADED") ? (
          <TemplateStatsReport report={report} />
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
    </SettingsLayout>
  );
}

ReportsTemplates.fragments = {
  PetitionTemplate: gql`
    fragment ReportsTemplates_PetitionTemplate on PetitionTemplate {
      id
      name
    }
  `,
};

ReportsTemplates.queries = [
  gql`
    query ReportsTemplates_templates($offset: Int!, $limit: Int!, $isPublic: Boolean!) {
      templates(offset: $offset, limit: $limit, isPublic: $isPublic) {
        items {
          ...ReportsTemplates_PetitionTemplate
        }
        totalCount
      }
    }
    ${ReportsTemplates.fragments.PetitionTemplate}
  `,
  gql`
    query ReportsTemplates_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
];

ReportsTemplates.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery(ReportsTemplates_templatesDocument, {
      variables: {
        offset: 0,
        limit: 1999,
        isPublic: false,
      },
    }),
    fetchQuery(ReportsTemplates_userDocument),
  ]);
};

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(ReportsTemplates);

function TemplateStatsReport({ report }: { report: ReportType }) {
  const pendingToComplete = report.times.pending_to_complete ?? 0;
  const completeToClose = report.times.complete_to_close ?? 0;
  const timeToComplete = report.times.signature_completed ?? 0;

  const pendingToCompletePercent =
    (pendingToComplete / (pendingToComplete + completeToClose)) * 100;
  const completeToClosePercent = (completeToClose / (pendingToComplete + completeToClose)) * 100;
  const signaturesTimeToComplete = (timeToComplete / completeToClose) * 100;

  const pendingPetitions = report.status.pending;
  const completedPetitions = report.status.completed;
  const closedPetitions = report.status.closed;

  const petitionsTotal = closedPetitions + completedPetitions + pendingPetitions;
  const signaturesCompleted = report.status.signed;
  return (
    <Grid
      gridTemplateColumns={{
        base: "repeat(1,1fr)",
        lg: "repeat(3,1fr)",
        xl: "repeat(4,1fr)",
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
        <Card height="100%" padding={6} as={Stack} spacing={3}>
          <HStack>
            <Center>
              <PaperPlaneIcon />
            </Center>
            <Text>
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
            {petitionsTotal}
          </Text>
        </Card>
      </GridItem>
      <GridItem gridArea="signatures">
        <Card height="100%" padding={6} as={Stack} spacing={3}>
          <HStack>
            <Center>
              <SignatureIcon />
            </Center>
            <Text>
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
              {signaturesCompleted}
            </Text>
          ) : (
            <Text fontSize="xl" textStyle="hint">
              <FormattedMessage
                id="page.reports.no-esignatures-sent"
                defaultMessage="No eSignatures sent"
              />
            </Text>
          )}
        </Card>
      </GridItem>
      <GridItem gridArea="petitions-time">
        <Card height="100%" padding={6} as={Stack} spacing={3}>
          <HStack>
            <Text>
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
                        defaultMessage="Average time from completion to closure. "
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
                <TimeSpan duration={pendingToComplete} />
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
                <TimeSpan duration={completeToClose} />
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
        <Card height="100%" padding={6} as={Stack} spacing={3}>
          <HStack>
            <Text>
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
                    <TimeSpan duration={timeToComplete} />
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
                        right={"1px"}
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
        />
      </GridItem>
    </Grid>
  );
}
