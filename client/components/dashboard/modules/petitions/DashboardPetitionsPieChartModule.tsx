import { gql } from "@apollo/client";
import { Center, Grid, GridItem, Square } from "@chakra-ui/react";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import { DashboardPetitionsPieChartModule_DashboardPetitionsPieChartModuleFragment } from "@parallel/graphql/__types";
import { removeTypenames } from "@parallel/utils/apollo/removeTypenames";
import { buildPetitionsQueryStateUrl } from "@parallel/utils/petitionsQueryState";
import { Fragment, RefAttributes, useMemo } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { isNonNullish, sumBy, zip } from "remeda";
import { DashboardDoughnutChart } from "../../charts/DashboardDoughnutChart";
import { DashboardPieChart } from "../../charts/DashboardPieChart";
import { DashboardLinkToResults } from "../../shared/DashboardLinkToResults";
import { DashboardModuleAlertIncongruent } from "../../shared/DashboardModuleAlertIncongruent";
import { DashboardModuleCard } from "../../shared/DashboardModuleCard";
import { DashboardModuleSpinner } from "../../shared/DashboardModuleSpinner";
import { Box, Stack, Text } from "@parallel/components/ui";

export function DashboardPetitionsPieChartModule({
  module,
  ...rest
}: {
  module: DashboardPetitionsPieChartModule_DashboardPetitionsPieChartModuleFragment;
  isEditing: boolean;
  isDragging: boolean;
  isReadOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
} & RefAttributes<HTMLDivElement>) {
  const intl = useIntl();

  const data = useMemo(
    () => ({
      datasets: [
        {
          data: module.petitionsPieChartResult?.items?.map((item) => item.count) ?? [],
          backgroundColor:
            module.petitionsPieChartResult?.items?.map((item) => item.color ?? "#E2E8F0") ?? [],
          borderColor: "white",
          hoverBackgroundColor:
            module.petitionsPieChartResult?.items?.map((item) => item.color ?? "#E2E8F0") ?? [],
          hoverBorderColor: "white",
        },
      ],

      labels: module.petitionsPieChartResult?.items?.map(({ label }) => label) ?? [],
    }),
    [module],
  );
  const totalCount = sumBy(module.petitionsPieChartResult?.items ?? [], (item) => item.count);
  const resultsUrls = useMemo(() => {
    return module.petitionsPieChartSettings.items.map((item) => {
      const { tags, ...filters } = removeTypenames(item.filter);
      return buildPetitionsQueryStateUrl(
        {
          view: "-ALL", // this forces ALL instead of the default view
          ...filters,
          tagsFilters: tags,
        },
        {
          fromDashboardModule:
            module.title ||
            intl.formatMessage({
              id: "component.dashboard-module-card.untitled-module",
              defaultMessage: "Untitled module",
            }),
        },
      );
    });
  }, [module, intl.locale]);

  return (
    <DashboardModuleCard
      module={module}
      headerAddon={
        module.petitionsPieChartResult?.isIncongruent ? (
          <DashboardModuleAlertIncongruent />
        ) : undefined
      }
      gridRow={{
        base: "span 4",
        md: "span 2",
        lg: module.size === "LARGE" ? "span 3" : "span 2",
      }}
      {...rest}
    >
      {isNonNullish(module.petitionsPieChartResult) ? (
        <Stack
          direction={{ base: "column", md: "row" }}
          alignItems="stretch"
          gap={{ base: 2, md: 4 }}
          flex="1"
          minHeight={0}
        >
          <Center>
            <Box
              position="relative"
              boxSize={{
                base: "300px",
                md: "207px",
                lg: module.size === "LARGE" ? "353px" : "207px",
              }}
            >
              {module.petitionsPieChartSettings?.graphicType === "DOUGHNUT" ? (
                <DashboardDoughnutChart data={data} />
              ) : (
                <DashboardPieChart data={data} />
              )}
            </Box>
          </Center>
          <Stack flex="1">
            <Text>
              <FormattedMessage id="generic.total" defaultMessage="Total" />
              {": "}
              <Text as="span" fontWeight={600}>
                <FormattedNumber value={totalCount} />
              </Text>
            </Text>
            <ScrollShadows flex={1} direction="vertical" overflowY="auto">
              <Grid
                gap={1}
                columnGap={2}
                templateColumns="auto 1fr auto auto auto"
                alignItems="center"
                paddingEnd={2}
                overflow="hidden"
              >
                {zip(module.petitionsPieChartResult.items, resultsUrls).map(
                  ([item, href], index) => {
                    return (
                      <Fragment key={index}>
                        <GridItem>
                          <Square size={4} backgroundColor={item.color!} borderRadius="4px" />
                        </GridItem>
                        <GridItem minWidth={0}>
                          <OverflownText>{item.label}</OverflownText>
                        </GridItem>
                        <GridItem textAlign="end" fontSize="xl" fontWeight={600}>
                          <FormattedNumber value={item.count} />
                        </GridItem>
                        <GridItem textAlign="end" fontSize="sm">
                          {totalCount === 0 ? (
                            "-"
                          ) : (
                            <FormattedNumber
                              value={item.count / totalCount}
                              style="percent"
                              maximumSignificantDigits={3}
                            />
                          )}
                        </GridItem>
                        <GridItem>
                          <DashboardLinkToResults
                            href={href}
                            label={intl.formatMessage(
                              {
                                id: "component.dashboard-petitions-pie-chart-module.view-petitions",
                                defaultMessage: "View parallels for: {segment}",
                              },
                              { segment: item.label },
                            )}
                          />
                        </GridItem>
                      </Fragment>
                    );
                  },
                )}
              </Grid>
            </ScrollShadows>
          </Stack>
        </Stack>
      ) : (
        <DashboardModuleSpinner />
      )}
    </DashboardModuleCard>
  );
}

const _fragments = {
  DashboardPetitionsPieChartModule: gql`
    fragment DashboardPetitionsPieChartModule_DashboardPetitionsPieChartModule on DashboardPetitionsPieChartModule {
      id
      title
      size
      petitionsPieChartResult: result {
        items {
          count
          label
          color
        }
        isIncongruent
      }
      petitionsPieChartSettings: settings {
        graphicType
        items {
          filter {
            ...fullDashboardModulePetitionFilter
          }
        }
      }
    }
  `,
};
