import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ReportsIcon, TableIcon } from "@parallel/chakra/icons";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { EmptyReportsIlustration } from "@parallel/components/reports/EmptyReportsIlustration";
import { LoadingDynamicText } from "@parallel/components/reports/LoadingDynamicText";
import { Reports_templatesDocument, Reports_userDocument } from "@parallel/graphql/__types";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";

export function Reports() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQuery(Reports_userDocument);

  const [loading, setLoading] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const [report, setReport] = useState<any>(null);
  const prevTemplateId = useRef<string | null>(null);

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

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
        setReport({
          pending: 60,
          completed: 40,
          closed: 50,
          timeToComplete: 3321312,
          timeToClose: 3123213213,
          signatures: {
            completed: 100,
            timeToComplete: 123123,
          },
        });
      }, 3500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [loading]);

  const handleGenerateReportClick = () => {
    setReport(null);
    setLoading(true);
    prevTemplateId.current = templateId;
  };

  const handleDownloadReports = () => {};

  return (
    <AppLayout
      id="main-container"
      title={intl.formatMessage({
        id: "new-petition.title",
        defaultMessage: "New petition",
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
            <Heading as="h3" size="lg">
              Informes
            </Heading>
          </HStack>
          <Button variant="ghost" fontWeight="normal" color="purple.600">
            ¿Ayuda?
          </Button>
        </HStack>
        <Stack direction={{ base: "column", md: "row" }} spacing={0} gridGap={2}>
          <Stack direction={{ base: "column", md: "row" }} spacing={0} gridGap={2} flex="1">
            <HStack flex="1" maxWidth={{ base: "100%", md: "500px" }}>
              <Text>Plantilla:</Text>
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
                  isSearchable={true}
                  value={templateId}
                  onChange={(select) => {
                    setTemplateId(select);
                  }}
                />
              </Box>
            </HStack>
            <Button
              colorScheme="purple"
              isDisabled={!templateId || prevTemplateId.current === templateId}
              onClick={handleGenerateReportClick}
            >
              Generar informe
            </Button>
          </Stack>
          {isDefined(report) ? (
            <Button leftIcon={<TableIcon />} colorScheme="purple" onClick={handleDownloadReports}>
              Descargar resultados
            </Button>
          ) : null}
        </Stack>
        {isDefined(report) ? (
          <Grid
            h="300px"
            templateRows={{ base: "repeat(5, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(2, 1fr)" }}
            templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", xl: "repeat(5, 1fr)" }}
            gridGap={4}
          >
            <GridItem bg="papayawhip" />
            <GridItem bg="papayawhip" />
            <GridItem bg="tomato" />
            <GridItem bg="tomato" />
            <GridItem bg="pink" />
          </Grid>
        ) : (
          <Stack minHeight="340px" alignItems="center" justifyContent="center">
            {loading ? (
              <>
                <Center h="100px" marginBottom={6}>
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="purple.600"
                    size="xl"
                  />
                </Center>

                <Text fontWeight="bold">Espera mientras cargamos tus informes...</Text>
                <LoadingDynamicText />
              </>
            ) : (
              <>
                <EmptyReportsIlustration
                  maxWidth="225px"
                  height="100px"
                  width="100%"
                  marginBottom={6}
                />
                <Text fontWeight="bold">¡Estamos listos para generar tus informes!</Text>
                <Text>Elige una plantilla para ver sus estadísticas y resultados</Text>
              </>
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

export default withApolloData(Reports);
