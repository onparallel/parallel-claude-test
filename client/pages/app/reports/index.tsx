import { gql } from "@apollo/client";
import {
  Badge,
  Button,
  Center,
  Container,
  Grid,
  Heading,
  HStack,
  Image,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ReportsIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { NakedHelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { NakedLink } from "@parallel/components/common/Link";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { Reports_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function Reports() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(Reports_userDocument);

  const navigate = useHandleNavigation();
  const reports = useMemo(
    () => [
      {
        imgSrc: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/reports/reports_overview.png`,
        title: intl.formatMessage({ id: "page.reports.overview", defaultMessage: "Overview" }),
        description: intl.formatMessage({
          id: "page.reports.overview-description",
          defaultMessage: "Get an overview of the volume and status of all the parallels.",
        }),
        href: "/app/reports/overview",
      },
      {
        imgSrc: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/reports/reports_templates.png`,
        title: intl.formatMessage({
          id: "page.reports.statistics",
          defaultMessage: "Template statistics",
        }),
        description: intl.formatMessage({
          id: "page.reports.statistics-description",
          defaultMessage: "Analyze the statistics obtained from the parallels of a template.",
        }),
        href: "/app/reports/statistics",
      },
      {
        imgSrc: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/reports/reports_replies.png`,
        title: intl.formatMessage({ id: "page.reports.replies", defaultMessage: "Replies" }),
        description: intl.formatMessage({
          id: "page.reports.replies-description",
          defaultMessage: "Analyze the answers obtained in the parallels.",
        }),
        href: "/app/reports/replies",
      },
    ],
    [navigate, intl.locale],
  );

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
            colorScheme="primary"
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

const ReportsCard = chakraForwardRef<"div", ReportsCardProps>(function ReportsCard(
  { imgSrc, title, description, href, isPending, ...props },
  ref,
) {
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
                  left: 0,
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
              <NakedLink href={href}>
                <LinkOverlay>
                  <Text as="h2" fontSize="2xl" fontWeight="bold">
                    {title}
                  </Text>
                </LinkOverlay>
              </NakedLink>
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
    ${AppLayout.fragments.Query}
  `,
];

Reports.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Reports_userDocument);
};

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(Reports);
