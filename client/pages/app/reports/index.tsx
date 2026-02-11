import { gql } from "@apollo/client";
import {
  Badge,
  Center,
  Container,
  Grid,
  Heading,
  HStack,
  Image,
  LinkBox,
  LinkOverlay,
  Stack,
} from "@chakra-ui/react";
import { ReportsIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { NakedHelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import NextLink from "next/link";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { Button, Text } from "@parallel/components/ui";
import { Reports_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function Reports() {
  const intl = useIntl();
  const { data: queryObject } = useAssertQuery(Reports_userDocument);

  const hasOverviewAccess = useHasPermission("REPORTS:OVERVIEW");
  const hasTemplateStatisticsAccess = useHasPermission("REPORTS:TEMPLATE_STATISTICS");
  const hasTemplateRepliesAccess = useHasPermission("REPORTS:TEMPLATE_REPLIES");

  const navigate = useHandleNavigation();
  const reports = useMemo(() => {
    const withAccess = [];
    if (hasOverviewAccess) {
      withAccess.push({
        imgSrc: `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/reports/reports_overview.png`,
        title: intl.formatMessage({ id: "page.reports.overview", defaultMessage: "Overview" }),
        description: intl.formatMessage({
          id: "page.reports.overview-description",
          defaultMessage: "Get an overview of the volume and status of all the parallels.",
        }),
        href: "/app/reports/overview",
      });
    }

    if (hasTemplateStatisticsAccess) {
      withAccess.push({
        imgSrc: `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/reports/reports_templates.png`,
        title: intl.formatMessage({
          id: "page.reports.statistics",
          defaultMessage: "Template statistics",
        }),
        description: intl.formatMessage({
          id: "page.reports.statistics-description",
          defaultMessage: "Analyze the statistics obtained from the parallels of a template.",
        }),
        href: "/app/reports/statistics",
      });
    }

    if (hasTemplateRepliesAccess) {
      withAccess.push({
        imgSrc: `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/reports/reports_replies.png`,
        title: intl.formatMessage({ id: "page.reports.replies", defaultMessage: "Replies" }),
        description: intl.formatMessage({
          id: "page.reports.replies-description",
          defaultMessage: "Analyze the answers obtained in the parallels.",
        }),
        href: "/app/reports/replies",
      });
    }
    return withAccess;
  }, [navigate, intl.locale]);

  return (
    <AppLayout
      id="main-container"
      title={intl.formatMessage({
        id: "page.reports.title",
        defaultMessage: "Reports",
      })}
      queryObject={queryObject}
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
            colorPalette="primary"
            articleId={6272487}
          >
            <FormattedMessage id="generic.help-question" defaultMessage="Help?" />
          </Button>
        </HStack>
        <Stack spacing={6}>
          <Text>
            <FormattedMessage
              id="page.reports.choose-report"
              defaultMessage="Choose what type of report you need:"
            />
          </Text>
          <Grid
            gap={5}
            templateColumns={{
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            }}
          >
            {reports.map((report, i) => (
              <ReportsCard key={i} {...report} />
            ))}
          </Grid>
        </Stack>
      </Container>
    </AppLayout>
  );
}

interface ReportsCardProps {
  imgSrc: string;
  title: string;
  description: string;
  href: string;
  isPending?: boolean;
}

const ReportsCard = chakraComponent<"div", ReportsCardProps>(function ReportsCard({
  ref,
  imgSrc,
  title,
  description,
  href,
  isPending,
  ...props
}) {
  return (
    <LinkBox
      ref={ref}
      as={Card}
      minHeight="160px"
      outline="none"
      isInteractive
      overflow="hidden"
      minWidth={0}
      cursor={isPending ? "default" : "pointer"}
      {...props}
    >
      <Stack spacing={0} height="100%">
        <Center
          position="relative"
          _before={
            isPending
              ? {
                  position: "absolute",
                  content: `""`,
                  top: 0,
                  insetStart: 0,
                  width: "100%",
                  height: "100%",
                  background: "purple.800",
                  opacity: 0.2,
                }
              : {}
          }
          height="100%"
        >
          <Image
            loading="lazy"
            height="100%"
            objectFit="contain"
            src={imgSrc}
            role="presentation"
          />
        </Center>
        <Stack padding={4} paddingTop={2} paddingBottom={6} minHeight="124px">
          <HStack align="center" wrap="wrap" spacing={0} gap={2}>
            {isPending ? (
              <>
                <Text as="h2" fontSize="2xl" fontWeight="bold">
                  {title}
                </Text>
                <Badge colorScheme="purple">
                  <FormattedMessage id="generic.coming-soon" defaultMessage="Coming soon" />
                </Badge>
              </>
            ) : (
              <LinkOverlay as={NextLink} href={href}>
                <Text as="h2" fontSize="2xl" fontWeight="bold">
                  {title}
                </Text>
              </LinkOverlay>
            )}
          </HStack>
          <Text>{description}</Text>
        </Stack>
      </Stack>
    </LinkBox>
  );
});

Reports.queries = [
  gql`
    query Reports_user {
      ...AppLayout_Query
    }
  `,
];

Reports.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Reports_userDocument);
};

export default compose(
  withDialogs,
  withPermission(["REPORTS:OVERVIEW", "REPORTS:TEMPLATE_STATISTICS", "REPORTS:TEMPLATE_REPLIES"], {
    operator: "OR",
  }),
  withApolloData,
)(Reports);
