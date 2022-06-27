import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Container,
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
  ReportsIcon,
  SignatureIcon,
  TableIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { NakedHelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { ReportsDoughnutChart } from "@parallel/components/reports/ReportsDoughnutChart";
import { ReportsErrorMessage } from "@parallel/components/reports/ReportsErrorMessage";
import { ReportsLoadingMessage } from "@parallel/components/reports/ReportsLoadingMessage";
import { ReportsReadyMessage } from "@parallel/components/reports/ReportsReadyMessage";
import { Reports_templatesDocument, Reports_userDocument } from "@parallel/graphql/__types";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { stallFor } from "@parallel/utils/promises/stallFor";
import { useBackgroundTask } from "@parallel/utils/useBackgroundTask";
import { useTemplateRepliesReportTask } from "@parallel/utils/useTemplateRepliesReportTask";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { TimeSpan } from "../../../components/reports/TimeSpan";

type ReportType = {
  pending: number;
  completed: number;
  closed: number;
  pending_to_complete: number;
  complete_to_close: number;
  signatures: {
    completed: number;
    time_to_complete: number;
  };
};

export function Reports() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQuery(Reports_userDocument);

  const [{ status, templateId, prevTemplateId, report }, setState] = useState<{
    status: "IDLE" | "LOADING" | "ERROR";
    templateId: string | null;
    prevTemplateId: string | null;
    report: ReportType | null;
  }>({
    status: "IDLE",
    templateId: null,
    prevTemplateId: null,
    report: null,
  });
  const taskAbortController = useRef<AbortController | null>(null);

  const {
    data: {
      templates: { items: templates },
    },
  } = useAssertQueryOrPreviousData(Reports_templatesDocument, {
    variables: {
      offset: 0,
      limit: 1999,
      isPublic: false,
    },
  });

  const templateStatsTask = useBackgroundTask("TEMPLATE_STATS_REPORT");

  const handleGenerateReportClick = async () => {
    try {
      setState((state) => ({ ...state, status: "LOADING", prevTemplateId: state.templateId }));
      taskAbortController.current?.abort();
      if (isDefined(templateId)) {
        taskAbortController.current = new AbortController();
        // add a fake delay
        const { task } = await stallFor(
          () =>
            templateStatsTask(
              { templateId: templateId },
              { signal: taskAbortController.current!.signal }
            ),
          2_000 + 1_000 * Math.random()
        );
        setState((state) => ({ ...state, report: task.output as any, status: "IDLE" }));
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

  const canGenerateReport = !templateId || (prevTemplateId === templateId && status === "LOADING");

  return (
    <AppLayout
      id="main-container"
      title={intl.formatMessage({
        id: "page.reports.title",
        defaultMessage: "Reports",
      })}
      me={me}
      realMe={realMe}
    >
      <Container
        maxWidth="container.xl"
        flex="1"
        display="flex"
        flexDirection="column"
        padding={{ base: 9, md: 9 }}
        gridGap={7}
      >
        <HStack width="100%" justifyContent="space-between" flexWrap="wrap">
          <HStack>
            <ReportsIcon boxSize={6} />
            <Heading as="h2" size="lg">
              <FormattedMessage id="page.reports.title" defaultMessage="Reports" />
            </Heading>
          </HStack>
          <Button
            as={NakedHelpCenterLink}
            variant="ghost"
            fontWeight="normal"
            colorScheme="purple"
            articleId={6272487}
          >
            <FormattedMessage id="generic.help-question" defaultMessage="Help?" />
          </Button>
        </HStack>
        <Stack direction={{ base: "column", md: "row" }} spacing={0} gridGap={2}>
          <Stack direction={{ base: "column", md: "row" }} spacing={0} gridGap={2} flex="1">
            <HStack flex="1" maxWidth={{ base: "100%", md: "500px" }}>
              <Text>
                <FormattedMessage id="generic.template" defaultMessage="Template" />:
              </Text>
              <Box flex="1">
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
                  onChange={(templateId) => setState((state) => ({ ...state, templateId }))}
                />
              </Box>
            </HStack>
            <Button
              colorScheme="purple"
              isDisabled={canGenerateReport}
              onClick={handleGenerateReportClick}
            >
              <FormattedMessage
                id="page.reports.generate-report"
                defaultMessage="Generate report"
              />
            </Button>
          </Stack>
          {isDefined(report) && status === "IDLE" ? (
            <Button
              leftIcon={<TableIcon />}
              colorScheme="purple"
              onClick={() => handleTemplateRepliesReportTask(prevTemplateId!)}
            >
              <FormattedMessage
                id="page.reports.download-replies"
                defaultMessage="Download replies"
              />
            </Button>
          ) : null}
        </Stack>
        {isDefined(report) && status === "IDLE" ? (
          <TemplateStatsReport report={report} />
        ) : (
          <Stack minHeight="340px" alignItems="center" justifyContent="center" textAlign="center">
            {status === "LOADING" ? (
              <ReportsLoadingMessage />
            ) : status === "ERROR" ? (
              <ReportsErrorMessage />
            ) : (
              <ReportsReadyMessage />
            )}
          </Stack>
        )}
      </Container>
    </AppLayout>
  );
}

Reports.fragments = {
  PetitionTemplate: gql`
    fragment Reports_PetitionTemplate on PetitionTemplate {
      id
      name
    }
  `,
};

Reports.queries = [
  gql`
    query Reports_templates($offset: Int!, $limit: Int!, $isPublic: Boolean!) {
      templates(offset: $offset, limit: $limit, isPublic: $isPublic) {
        items {
          ...Reports_PetitionTemplate
        }
        totalCount
      }
    }
    ${Reports.fragments.PetitionTemplate}
  `,
  gql`
    query Reports_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
];

Reports.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery(Reports_templatesDocument, {
      variables: {
        offset: 0,
        limit: 1999,
        isPublic: false,
      },
    }),
    fetchQuery(Reports_userDocument),
  ]);
};

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(Reports);
function TemplateStatsReport({ report }: { report: ReportType }) {
  const pendingToComplete = report.pending_to_complete;
  const completeToClose = report.complete_to_close;
  const timeToComplete = report.signatures.time_to_complete;

  const pendingToCompletePercent =
    (pendingToComplete / (pendingToComplete + completeToClose)) * 100;
  const completeToClosePercent = (completeToClose / (pendingToComplete + completeToClose)) * 100;
  const signaturesTimeToComplete = (timeToComplete / completeToClose) * 100;

  const pendingPetitions = report.pending;
  const completedPetitions = report.completed;
  const closedPetitions = report.closed;

  const petitionsTotal = closedPetitions + completedPetitions + pendingPetitions;
  const signaturesCompleted = report.signatures.completed;
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
    >
      <GridItem gridArea="petitions">
        <Card height="100%" padding={6} as={Stack} spacing={3}>
          <HStack>
            <Center>
              <PaperPlaneIcon />
            </Center>
            <Text>
              <FormattedMessage
                id="page.reports.started-petitions"
                defaultMessage="Started petitions"
              />
            </Text>
            <HelpPopover>
              <Stack>
                <Text>
                  <FormattedMessage
                    id="page.reports.started-petitions-help-1"
                    defaultMessage="This is the total petitions sent or started, i.e. drafts with at least one response."
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="page.reports.started-petitions-help-2"
                    defaultMessage="This number doesn't include deleted petitions or unanswered drafts."
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
                        defaultMessage="Average time from the start of the petition until it is completed."
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
                    defaultMessage="The sum of the two is the average duration of the petitions."
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
                <TimeSpan seconds={pendingToComplete} />
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
                <TimeSpan seconds={completeToClose} />
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
                      id="page.reports.no-petitions-closed"
                      defaultMessage="No petitions closed"
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
                    defaultMessage="The bar represents the percentage of the time from the time the petition is completed until it is closed."
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
                    <TimeSpan seconds={timeToComplete} />
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
