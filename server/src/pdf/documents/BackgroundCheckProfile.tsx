import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Fragment } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import {
  EntityDetailsResponse,
  EntitySearchRequest,
  EntitySearchResponse,
} from "../../services/BackgroundCheckService";
import { FORMATS } from "../../util/dates";
import { Header } from "../components/background-check/Header";
import { RiskLabel } from "../components/background-check/RiskLabel";
import { WithInternationalFontFamily } from "../components/WithInternationalFontFamily";
import { formatPartialDate } from "../utils/formatPartialDate";
import { getCountryName } from "../utils/getCountryName";

export interface BackgroundCheckProfileProps {
  assetsUrl: string;
  entity: EntityDetailsResponse;
  query?: EntitySearchRequest;
  search?: EntitySearchResponse;
}

const gray200 = "#E2E8F0";

const styles = StyleSheet.create({
  page: {
    paddingLeft: `0.75in`,
    paddingRight: `0.75in`,
    paddingTop: `0.75in`,
    paddingBottom: `0.75in`,
    lineHeight: 1.4,
    fontFamily: "Noto Sans",
  },
  boldText: {
    fontSize: "8.25pt", //11px
    fontWeight: 600,
    color: "#1A202C",
    paddingRight: "1.3mm", //4px
  },
  normalText: {
    fontSize: "9pt", //12px
    fontWeight: 400,
    color: "#1A202C",
    flexWrap: "wrap",
  },
  overviewBoldText: {
    width: "18%",
    height: "100%",
    alignSelf: "flex-start",
  },
  overviewNormalText: {
    width: "82%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "6.5mm", //20px
    gap: "2.6mm", //8px
  },
  sectionTitle: {
    fontSize: "10.5pt", //14px
    fontWeight: 600,
    marginTop: "4.5mm", //14px
    marginBottom: "0.65mm", //2px
  },
  dividerLine: {
    borderBottom: `0.32mm solid ${gray200}`,
    marginBottom: "3.9mm", //12px
  },
  section: {
    flexDirection: "column",
    gap: "2.6mm", //8px
  },
  gap12: {
    gap: "3.9mm", //12px
  },
  searchSummary: {
    borderBottom: `0.32mm solid ${gray200}`,
    paddingBottom: "3.9mm", //12px
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  cell: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: "2.6mm", //8px
  },
});

const tableStyles = StyleSheet.create({
  table: {
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    borderBottom: `0.32mm solid ${gray200}`,
    paddingBottom: "1.3mm", //4px
    marginBottom: "1.3mm", //4px
  },
  row: {
    flexDirection: "row",
    borderBottom: `0.32mm solid ${gray200}`,
    paddingTop: "1.3mm", //4px
    paddingBottom: "1.3mm", //4px
  },
  cell: {
    flex: 1,
    flexWrap: "wrap",
    fontSize: "9pt", //12px
    paddingRight: "2.6mm", //8px
  },
  headerCell: {
    fontWeight: 400,
    fontSize: "7.5pt", //10px
    textTransform: "uppercase",
  },
  bodyCell: {
    fontWeight: 400,
    fontSize: "9pt", //12px
  },
  authority: {
    flexBasis: "30%",
  },
  program: {
    flexBasis: "40%",
  },
  from: {
    flexBasis: "15%",
  },
  to: {
    flexBasis: "15%",
    paddingRight: "0mm",
  },
  name: {
    flexBasis: "30%",
  },
  type: {
    flexBasis: "15%",
  },
  relation: {
    flexBasis: "25%",
    textTransform: "capitalize",
  },
});

function ListOfTexts({ values }: { values?: string[] }) {
  return (
    <>
      {values?.map((value, i) => (
        <Fragment key={i}>
          {i > 0 ? " · " : null}
          <WithInternationalFontFamily>{value}</WithInternationalFontFamily>
        </Fragment>
      )) ?? " - "}
    </>
  );
}

export default function BackgroundCheckProfile(props: BackgroundCheckProfileProps) {
  const intl = useIntl();
  return (
    <Document>
      <Page style={styles.page} wrap>
        <Header assetsUrl={props.assetsUrl} />
        {isNonNullish(props.search) ? (
          <>
            <Text style={styles.sectionTitle}>Search Summary</Text>
            <View style={styles.dividerLine} />
            <View style={[styles.row, styles.gap12, styles.searchSummary]}>
              <View style={styles.row}>
                <Text style={styles.boldText}>Searching for:</Text>
                <Text style={styles.normalText}>
                  {props.query?.type === "PERSON"
                    ? "Person"
                    : props.query?.type === "COMPANY"
                      ? "Entity"
                      : "person / entity"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.boldText}>Name:</Text>
                <Text style={styles.normalText}>{props.query?.name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.boldText}>Birthdate:</Text>
                <Text style={styles.normalText}>{props.query?.date ?? "All"}</Text>
              </View>
              {props.query?.type === "PERSON" ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Nationality:</Text>
                    <Text style={styles.normalText}>
                      {props.query?.country
                        ? getCountryName(props.query.country, intl.locale)
                        : "Any"}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Country of birth:</Text>
                    <Text style={styles.normalText}>
                      {props.query?.birthCountry
                        ? getCountryName(props.query.birthCountry, intl.locale)
                        : "Any"}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.row}>
                  <Text style={styles.boldText}>Country:</Text>
                  <Text style={styles.normalText}>
                    {props.query?.country
                      ? getCountryName(props.query.country, intl.locale)
                      : "Any"}
                  </Text>
                </View>
              )}

              <View style={styles.row}>
                <Text style={styles.boldText}>Saved on:</Text>
                <Text style={styles.normalText}>
                  {intl.formatDate(new Date((props.entity as any)?.createdAt), FORMATS.FULL)}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {props.entity.type === "Company" || props.entity.type === "Person" ? (
          <>
            <View
              style={[
                {
                  flexDirection: "row",
                  alignItems: "flex-end",
                  flexWrap: "wrap",
                  gap: "2.6mm", //8px
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { marginRight: "1.3mm" }]}>
                {props.entity.name}
              </Text>

              {props.entity.properties.topics
                ? props.entity.properties.topics.map((risk, i) => <RiskLabel key={i} risk={risk} />)
                : null}
            </View>
            <View style={styles.dividerLine} />
            <View style={[styles.row, styles.gap12]}>
              <View style={styles.row}>
                <Text style={styles.boldText}>Type:</Text>
                <Text style={styles.normalText}>{props.entity.type}</Text>
              </View>
              {props.entity.type === "Person" ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Gender:</Text>
                    <Text style={[styles.normalText, { textTransform: "capitalize" }]}>
                      {props.entity.properties?.gender?.join(" · ") ?? " - "}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Nationality:</Text>
                    <Text style={styles.normalText}>
                      {props.entity.properties?.nationality
                        ?.map((n) => getCountryName(n, intl.locale))
                        .join(" · ") ?? " - "}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Country:</Text>
                    <Text style={styles.normalText}>
                      {props.entity.properties?.country
                        ?.map((c) => getCountryName(c, intl.locale))
                        .join(" · ") ?? " - "}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Date of birth:</Text>
                    <Text style={styles.normalText}>
                      {props.entity.properties?.dateOfBirth
                        ?.map((date) => formatPartialDate({ date, intl }))
                        .join(" · ") ?? " - "}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Jurisdiction:</Text>
                    <Text style={styles.normalText}>
                      {props.entity.properties?.jurisdiction
                        ?.map((n) => getCountryName(n, intl.locale))
                        .join(" · ") ?? " - "}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Date of registration:</Text>
                    <Text style={styles.normalText}>
                      {props.entity.properties?.dateOfRegistration
                        ?.map((date) => formatPartialDate({ date, intl }))
                        .join(" · ") ?? " - "}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.dividerLine} />
            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={[styles.boldText, styles.overviewBoldText]}>Other Name:</Text>
                <Text style={[styles.normalText, styles.overviewNormalText]}>
                  <ListOfTexts values={props.entity.properties?.name} />
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.boldText, styles.overviewBoldText]}>Alias:</Text>
                <Text style={[styles.normalText, styles.overviewNormalText]}>
                  <ListOfTexts values={props.entity.properties?.alias} />
                </Text>
              </View>
              {props.entity.type === "Person" ? (
                <>
                  <View style={styles.row}>
                    <Text style={[styles.boldText, styles.overviewBoldText]}>Place of birth:</Text>
                    <Text style={[styles.normalText, styles.overviewNormalText]}>
                      <ListOfTexts values={props.entity.properties?.birthPlace} />
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.boldText, styles.overviewBoldText]}>Position:</Text>
                    <Text style={[styles.normalText, styles.overviewNormalText]}>
                      <ListOfTexts values={props.entity.properties?.position} />
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.boldText, styles.overviewBoldText]}>Education:</Text>
                    <Text style={[styles.normalText, styles.overviewNormalText]}>
                      <ListOfTexts values={props.entity.properties?.education} />
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.boldText, styles.overviewBoldText]}>Status:</Text>
                    <Text style={[styles.normalText, styles.overviewNormalText]}>
                      {props.entity.properties.status?.join(" · ") ?? " - "}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.boldText, styles.overviewBoldText]}>Religion:</Text>
                    <Text style={[styles.normalText, styles.overviewNormalText]}>
                      {props.entity.properties.religion?.join(" · ") ?? " - "}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.boldText, styles.overviewBoldText]}>Ethnicity:</Text>
                    <Text style={[styles.normalText, styles.overviewNormalText]}>
                      {props.entity.properties?.ethnicity?.join(" · ") ?? " - "}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.row}>
                    <Text style={[styles.boldText, styles.overviewBoldText]}>Address:</Text>
                    <Text style={[styles.normalText, styles.overviewNormalText]}>
                      {props.entity.properties?.address?.join(" · ") ?? " - "}
                    </Text>
                  </View>
                </>
              )}
            </View>
            <Text style={styles.sectionTitle}>
              Sanctions Lists ({props.entity.properties.sanctions?.length ?? 0})
            </Text>
            <View style={styles.dividerLine} />
            {props.entity.properties.sanctions?.length ? (
              <View style={tableStyles.table}>
                <View style={tableStyles.headerRow}>
                  <Text style={[tableStyles.cell, tableStyles.headerCell, tableStyles.authority]}>
                    List name / Authority
                  </Text>
                  <Text style={[tableStyles.cell, tableStyles.headerCell, tableStyles.program]}>
                    Program
                  </Text>
                  <Text style={[tableStyles.cell, tableStyles.headerCell, tableStyles.from]}>
                    From
                  </Text>
                  <Text style={[tableStyles.cell, tableStyles.headerCell, tableStyles.to]}>To</Text>
                </View>

                {props.entity.properties?.sanctions?.map((sanction, i) => {
                  const authority = sanction.properties?.authority?.join(" · ") ?? "-";
                  const datasets = sanction.datasets?.map((d) => d.title).join(" · ") || null;
                  return (
                    <View key={i} style={tableStyles.row}>
                      <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.authority]}>
                        {`${[datasets, authority].filter(isNonNullish).join(" / ")}`}
                      </Text>
                      <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.program]}>
                        <ListOfTexts values={sanction.properties?.program} />
                      </Text>
                      <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.from]}>
                        {sanction.properties?.startDate
                          ? sanction.properties.startDate
                              .map((date) => formatPartialDate({ date, intl }))
                              .join(" · ")
                          : "-"}
                      </Text>
                      <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.to]}>
                        {sanction.properties?.endDate
                          ? sanction.properties.endDate
                              .map((date) => formatPartialDate({ date, intl }))
                              .join(" · ")
                          : "-"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View>
                <Text style={styles.normalText}>
                  We have not found this entity on any sanctions list.
                </Text>
              </View>
            )}
            <Text style={styles.sectionTitle}>
              Relationships ({props.entity.properties.relationships?.length ?? 0})
            </Text>
            <View style={styles.dividerLine} />
            {props.entity.properties?.relationships?.length ? (
              <View style={tableStyles.table}>
                <View style={tableStyles.headerRow}>
                  <Text style={[tableStyles.cell, tableStyles.headerCell, tableStyles.name]}>
                    Name
                  </Text>
                  <Text style={[tableStyles.cell, tableStyles.headerCell, tableStyles.type]}>
                    Type
                  </Text>
                  <Text
                    style={[
                      tableStyles.cell,
                      tableStyles.headerCell,
                      tableStyles.relation,
                      { textTransform: "uppercase" },
                    ]}
                  >
                    Relation
                  </Text>
                  <Text style={[tableStyles.cell, tableStyles.headerCell, tableStyles.from]}>
                    From
                  </Text>
                  <Text style={[tableStyles.cell, tableStyles.headerCell, tableStyles.to]}>To</Text>
                </View>
                {props.entity.properties?.relationships?.map((relationship, i) => (
                  <View key={i} style={tableStyles.row}>
                    <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.name]}>
                      {relationship.properties?.entityA?.name === props.entity.name
                        ? relationship.properties?.entityB?.name
                        : relationship.properties?.entityA?.name}
                    </Text>
                    <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.type]}>
                      {relationship.type}
                    </Text>
                    <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.relation]}>
                      {relationship.properties?.relationship?.join(" · ") ?? " - "}
                    </Text>
                    <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.from]}>
                      {relationship.properties?.startDate
                        ?.map((date) => formatPartialDate({ date, intl }))
                        .join(" · ") ?? "-"}
                    </Text>
                    <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.to]}>
                      {relationship.properties?.endDate
                        ?.map((date) => formatPartialDate({ date, intl }))
                        .join(" · ") ?? "-"}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View>
                <Text style={styles.normalText}>
                  We have not found any relevant relationship for this entity.
                </Text>
              </View>
            )}
          </>
        ) : null}
      </Page>
    </Document>
  );
}
