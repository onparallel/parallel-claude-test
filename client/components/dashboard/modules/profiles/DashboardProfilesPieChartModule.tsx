import { gql } from "@apollo/client";
import { Box, Center, Grid, GridItem, Square, Stack, Text } from "@chakra-ui/react";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import { DashboardProfilesPieChartModule_DashboardProfilesPieChartModuleFragment } from "@parallel/graphql/__types";
import {
  ProfileFieldValuesFilterGroup,
  simplifyProfileFieldValuesFilter,
} from "@parallel/utils/ProfileFieldValuesFilter";
import { buildProfilesQueryStateUrl } from "@parallel/utils/profilesQueryState";
import { forwardRef, Fragment, useMemo } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { isNonNullish, sumBy, zip } from "remeda";
import { DashboardDoughnutChart } from "../../charts/DashboardDoughnutChart";
import { DashboardPieChart } from "../../charts/DashboardPieChart";
import {
  cleanDashboardModuleProfileFilter,
  fullDashboardModuleProfileFilter,
} from "../../drawer/utils/moduleUtils";
import { DashboardLinkToResults } from "../../shared/DashboardLinkToResults";
import { DashboardModuleAlertIncongruent } from "../../shared/DashboardModuleAlertIncongruent";
import { DashboardModuleCard } from "../../shared/DashboardModuleCard";
import { DashboardModuleSpinner } from "../../shared/DashboardModuleSpinner";

export const DashboardProfilesPieChartModule = Object.assign(
  forwardRef<
    HTMLDivElement,
    {
      module: DashboardProfilesPieChartModule_DashboardProfilesPieChartModuleFragment;
      isEditing: boolean;
      isDragging: boolean;
      isReadOnly: boolean;
      onEdit: () => void;
      onDelete: () => void;
    }
  >(function DashboardProfilesPieChartModule({ module, ...rest }, ref) {
    const intl = useIntl();
    const data = useMemo(
      () => ({
        datasets: [
          {
            data:
              module.profilesPieChartResult?.items?.map((item) =>
                module.profilesPieChartSettings.type === "COUNT" ? item.count : (item.aggr ?? 0),
              ) ?? [],
            backgroundColor:
              module.profilesPieChartResult?.items?.map((item) => item.color ?? "#E2E8F0") ?? [],
            borderColor: "white",
            hoverBackgroundColor:
              module.profilesPieChartResult?.items?.map((item) => item.color ?? "#E2E8F0") ?? [],
            hoverBorderColor: "white",
          },
        ],
        labels:
          module.profilesPieChartResult?.items?.map(({ label }) =>
            label === null
              ? intl.formatMessage({
                  id: "generic.profile-property-no-value",
                  defaultMessage: "No value",
                })
              : typeof label === "string"
                ? label
                : localizableUserTextRender({ intl, value: label, default: "" }),
          ) ?? [],
      }),
      [module, intl],
    );
    const isAggregate = module.profilesPieChartSettings.type === "AGGREGATE";
    const totalCount = sumBy(module.profilesPieChartResult?.items ?? [], (i) => i.count);
    const totalAggr = isAggregate
      ? sumBy(module.profilesPieChartResult?.items ?? [], (i) => i.aggr!)
      : 0;
    const resultsUrls = useMemo(() => {
      if (isNonNullish(module.profilesPieChartSettings.groupByProfileTypeFieldId)) {
        const groupBy = cleanDashboardModuleProfileFilter(
          module.profilesPieChartSettings.groupByFilter!,
        );
        return (
          module.profilesPieChartResult?.items.map((item) => {
            const valueFilter = {
              logicalOperator: "AND",
              conditions: [
                isNonNullish(item.value)
                  ? {
                      profileTypeFieldId: module.profilesPieChartSettings.groupByProfileTypeFieldId,
                      operator: "EQUAL",
                      value: item.value,
                    }
                  : {
                      profileTypeFieldId: module.profilesPieChartSettings.groupByProfileTypeFieldId,
                      operator: "NOT_HAS_VALUE",
                      value: null,
                    },
              ],
            } as ProfileFieldValuesFilterGroup;
            if (isNonNullish(groupBy.values)) {
              // add global filter
              valueFilter.conditions.push(groupBy.values);
            }
            if (module.profilesPieChartSettings.type === "AGGREGATE") {
              // when aggregating, we need to add a filter to exclude profiles without a value
              valueFilter.conditions.push({
                profileTypeFieldId: module.profilesPieChartSettings.profileTypeFieldId!,
                operator: "HAS_VALUE",
                value: null,
              });
            }
            return buildProfilesQueryStateUrl({
              view: "-ALL", // this forces ALL instead of the default view
              type: module.profilesPieChartSettings.profileTypeId,
              status: groupBy.status,
              values: simplifyProfileFieldValuesFilter(valueFilter),
            });
          }) ?? []
        );
      } else {
        return module.profilesPieChartSettings.items.map((item) => {
          const { status, values } = cleanDashboardModuleProfileFilter(item.filter);
          const valueFilter = {
            logicalOperator: "AND",
            conditions: [],
          } as ProfileFieldValuesFilterGroup;
          if (isNonNullish(values)) {
            valueFilter.conditions.push(values);
          }
          if (module.profilesPieChartSettings.type === "AGGREGATE") {
            // when aggregating, we need to add a filter to exclude profiles without a value
            valueFilter.conditions.push({
              profileTypeFieldId: module.profilesPieChartSettings.profileTypeFieldId!,
              operator: "HAS_VALUE",
              value: null,
            });
          }
          return buildProfilesQueryStateUrl({
            view: "-ALL", // this forces ALL instead of the default view
            type: module.profilesPieChartSettings.profileTypeId,
            status,
            values:
              valueFilter.conditions.length > 0
                ? simplifyProfileFieldValuesFilter(valueFilter)
                : null,
          });
        });
      }
    }, [module]);

    return (
      <DashboardModuleCard
        ref={ref}
        module={module}
        headerAddon={
          module.profilesPieChartResult?.isIncongruent ? (
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
        {isNonNullish(module.profilesPieChartResult) ? (
          <Stack
            direction={{ base: "column", md: "row" }}
            alignItems="stretch"
            spacing={{ base: 2, md: 4 }}
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
                {module.profilesPieChartSettings?.graphicType === "DOUGHNUT" ? (
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
                  <FormattedNumber value={isAggregate ? totalAggr : totalCount} />
                </Text>{" "}
                {isAggregate && (
                  <Text as="span" fontSize="sm">
                    (<FormattedNumber value={totalCount} />)
                  </Text>
                )}
              </Text>
              <ScrollShadows flex={1} direction="vertical" overflowY="auto">
                <Grid
                  gap={1}
                  columnGap={2}
                  templateColumns={`auto 1fr ${isAggregate ? "auto auto" : "auto"} auto auto`}
                  alignItems="center"
                  paddingEnd={2}
                  overflow="hidden"
                >
                  {zip(module.profilesPieChartResult.items, resultsUrls).map(
                    ([item, href], index) => {
                      const label =
                        typeof item.label === "string"
                          ? item.label
                          : item.label === null
                            ? intl.formatMessage({
                                id: "generic.profile-property-no-value",
                                defaultMessage: "No value",
                              })
                            : localizableUserTextRender({
                                intl,
                                value: item.label,
                                default: "",
                              });
                      return (
                        <Fragment key={index}>
                          <GridItem>
                            <Square
                              size={4}
                              backgroundColor={item.color ?? "#E2E8F0"}
                              borderRadius="4px"
                            />
                          </GridItem>
                          <GridItem minWidth={0}>
                            <OverflownText>{label}</OverflownText>
                          </GridItem>
                          <GridItem textAlign="end" fontSize="xl" fontWeight={600}>
                            <FormattedNumber value={isAggregate ? item.aggr! : item.count} />
                          </GridItem>
                          {isAggregate && (
                            <GridItem textAlign="end" fontSize="sm">
                              (<FormattedNumber value={item.count} />)
                            </GridItem>
                          )}
                          <GridItem textAlign="end" fontSize="sm">
                            {totalCount === 0 ? (
                              "-"
                            ) : (
                              <FormattedNumber
                                value={
                                  isAggregate ? item.aggr! / totalAggr : item.count / totalCount
                                }
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
                                  id: "component.dashboard-profiles-pie-chart-module.view-profiles",
                                  defaultMessage: "View profiles for: {segment}",
                                },
                                { segment: label },
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
  }),
  {
    fragments: {
      get DashboardProfilesPieChartModule() {
        return gql`
          fragment DashboardProfilesPieChartModule_DashboardProfilesPieChartModule on DashboardProfilesPieChartModule {
            id
            size
            title
            profilesPieChartResult: result {
              items {
                count
                aggr
                label
                color
                value
              }
              isIncongruent
            }
            profilesPieChartSettings: settings {
              graphicType
              type
              profileTypeId
              profileTypeFieldId
              items {
                filter {
                  ...fullDashboardModuleProfileFilter
                }
              }
              groupByProfileTypeFieldId
              groupByFilter {
                ...fullDashboardModuleProfileFilter
              }
            }
          }
          ${fullDashboardModuleProfileFilter}
        `;
      },
    },
  },
);
