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

export interface BackgroundCheckProfileProps {
  assetsUrl: string;
  entity: EntityDetailsResponse;
  query?: EntitySearchRequest;
  search?: EntitySearchResponse;
}

const COUNTRIES = {
  zz: "Global",
  eu: "European Union",
  zr: "Zaire",
  cz: "Czech Republic",
  xk: "Kosovo",
  dd: "East Germany",
  yucs: "Yugoslavia",
  csxx: "Serbia and Montenegro",
  cshh: "Czechoslovakia",
  suhh: "Soviet Union",
  "ge-ab": "Abkhazia (Occupied Georgia)",
  "x-so": "South Ossetia (Occupied Georgia)",
  "ua-lpr": "Luhansk (Occupied Ukraine)",
  "ua-dpr": "Donetsk (Occupied Ukraine)",
  "ua-cri": "Crimea (Occupied Ukraine)",
  "so-som": "Somaliland",
  "cy-trnc": "Northern Cyprus",
  "az-nk": "Nagorno-Karabakh",
  "cn-xz": "Tibet",
  "gg-srk": "Sark",
  "gb-wls": "Wales",
  "gb-sct": "Scotland",
  "gb-nir": "Northern Ireland",
  "md-pmr": "Transnistria (PMR)",
  ac: "Ascension Island",
  ad: "Andorra",
  ae: "United Arab Emirates",
  af: "Afghanistan",
  ag: "Antigua & Barbuda",
  ai: "Anguilla",
  al: "Albania",
  am: "Armenia",
  ao: "Angola",
  aq: "Antarctica",
  ar: "Argentina",
  as: "American Samoa",
  at: "Austria",
  au: "Australia",
  aw: "Aruba",
  ax: "Åland Islands",
  az: "Azerbaijan",
  ba: "Bosnia & Herzegovina",
  bb: "Barbados",
  bd: "Bangladesh",
  be: "Belgium",
  bf: "Burkina Faso",
  bg: "Bulgaria",
  bh: "Bahrain",
  bi: "Burundi",
  bj: "Benin",
  bl: "St. Barthélemy",
  bm: "Bermuda",
  bn: "Brunei",
  bo: "Bolivia",
  bq: "Caribbean Netherlands",
  br: "Brazil",
  bs: "Bahamas",
  bt: "Bhutan",
  bv: "Bouvet Island",
  bw: "Botswana",
  by: "Belarus",
  bz: "Belize",
  ca: "Canada",
  cc: "Cocos (Keeling) Islands",
  cd: "Congo - Kinshasa",
  cf: "Central African Republic",
  cg: "Congo - Brazzaville",
  ch: "Switzerland",
  ci: "Côte d'Ivoire",
  ck: "Cook Islands",
  cl: "Chile",
  cm: "Cameroon",
  cn: "China",
  co: "Colombia",
  cp: "Clipperton Island",
  cq: "Sark",
  cr: "Costa Rica",
  cu: "Cuba",
  cv: "Cape Verde",
  cw: "Curaçao",
  cx: "Christmas Island",
  cy: "Cyprus",
  de: "Germany",
  dg: "Diego Garcia",
  dj: "Djibouti",
  dk: "Denmark",
  dm: "Dominica",
  do: "Dominican Republic",
  dz: "Algeria",
  ea: "Ceuta & Melilla",
  ec: "Ecuador",
  ee: "Estonia",
  eg: "Egypt",
  eh: "Western Sahara",
  er: "Eritrea",
  es: "Spain",
  et: "Ethiopia",
  ez: "Eurozone",
  fi: "Finland",
  fj: "Fiji",
  fk: "Falkland Islands",
  fm: "Micronesia",
  fo: "Faroe Islands",
  fr: "France",
  ga: "Gabon",
  gb: "United Kingdom",
  gd: "Grenada",
  ge: "Georgia",
  gf: "French Guiana",
  gg: "Guernsey",
  gh: "Ghana",
  gi: "Gibraltar",
  gl: "Greenland",
  gm: "Gambia",
  gn: "Guinea",
  gp: "Guadeloupe",
  gq: "Equatorial Guinea",
  gr: "Greece",
  gs: "South Georgia & South Sandwich Islands",
  gt: "Guatemala",
  gu: "Guam",
  gw: "Guinea-Bissau",
  gy: "Guyana",
  hk: "Hong Kong SAR China",
  hm: "Heard & McDonald Islands",
  hn: "Honduras",
  hr: "Croatia",
  ht: "Haiti",
  hu: "Hungary",
  ic: "Canary Islands",
  id: "Indonesia",
  ie: "Ireland",
  il: "Israel",
  im: "Isle of Man",
  in: "India",
  io: "British Indian Ocean Territory",
  iq: "Iraq",
  ir: "Iran",
  is: "Iceland",
  it: "Italy",
  je: "Jersey",
  jm: "Jamaica",
  jo: "Jordan",
  jp: "Japan",
  ke: "Kenya",
  kg: "Kyrgyzstan",
  kh: "Cambodia",
  ki: "Kiribati",
  km: "Comoros",
  kn: "St. Kitts & Nevis",
  kp: "North Korea",
  kr: "South Korea",
  kw: "Kuwait",
  ky: "Cayman Islands",
  kz: "Kazakhstan",
  la: "Laos",
  lb: "Lebanon",
  lc: "St. Lucia",
  li: "Liechtenstein",
  lk: "Sri Lanka",
  lr: "Liberia",
  ls: "Lesotho",
  lt: "Lithuania",
  lu: "Luxembourg",
  lv: "Latvia",
  ly: "Libya",
  ma: "Morocco",
  mc: "Monaco",
  md: "Moldova",
  me: "Montenegro",
  mf: "St. Martin",
  mg: "Madagascar",
  mh: "Marshall Islands",
  mk: "North Macedonia",
  ml: "Mali",
  mm: "Myanmar (Burma)",
  mn: "Mongolia",
  mo: "Macao SAR China",
  mp: "Northern Mariana Islands",
  mq: "Martinique",
  mr: "Mauritania",
  ms: "Montserrat",
  mt: "Malta",
  mu: "Mauritius",
  mv: "Maldives",
  mw: "Malawi",
  mx: "Mexico",
  my: "Malaysia",
  mz: "Mozambique",
  na: "Namibia",
  nc: "New Caledonia",
  ne: "Niger",
  nf: "Norfolk Island",
  ng: "Nigeria",
  ni: "Nicaragua",
  nl: "Netherlands",
  no: "Norway",
  np: "Nepal",
  nr: "Nauru",
  nu: "Niue",
  nz: "New Zealand",
  om: "Oman",
  pa: "Panama",
  pe: "Peru",
  pf: "French Polynesia",
  pg: "Papua New Guinea",
  ph: "Philippines",
  pk: "Pakistan",
  pl: "Poland",
  pm: "St. Pierre & Miquelon",
  pn: "Pitcairn Islands",
  pr: "Puerto Rico",
  ps: "Palestinian Territories",
  pt: "Portugal",
  pw: "Palau",
  py: "Paraguay",
  qa: "Qatar",
  qo: "Outlying Oceania",
  re: "Réunion",
  ro: "Romania",
  rs: "Serbia",
  ru: "Russia",
  rw: "Rwanda",
  sa: "Saudi Arabia",
  sb: "Solomon Islands",
  sc: "Seychelles",
  sd: "Sudan",
  se: "Sweden",
  sg: "Singapore",
  sh: "St. Helena",
  si: "Slovenia",
  sj: "Svalbard & Jan Mayen",
  sk: "Slovakia",
  sl: "Sierra Leone",
  sm: "San Marino",
  sn: "Senegal",
  so: "Somalia",
  sr: "Suriname",
  ss: "South Sudan",
  st: "São Tomé & Príncipe",
  sv: "El Salvador",
  sx: "Sint Maarten",
  sy: "Syria",
  sz: "Eswatini",
  ta: "Tristan da Cunha",
  tc: "Turks & Caicos Islands",
  td: "Chad",
  tf: "French Southern Territories",
  tg: "Togo",
  th: "Thailand",
  tj: "Tajikistan",
  tk: "Tokelau",
  tl: "Timor-Leste",
  tm: "Turkmenistan",
  tn: "Tunisia",
  to: "Tonga",
  tr: "Türkiye",
  tt: "Trinidad & Tobago",
  tv: "Tuvalu",
  tw: "Taiwan",
  tz: "Tanzania",
  ua: "Ukraine",
  ug: "Uganda",
  um: "U.S. Outlying Islands",
  un: "United Nations",
  us: "United States",
  uy: "Uruguay",
  uz: "Uzbekistan",
  va: "Vatican City",
  vc: "St. Vincent & Grenadines",
  ve: "Venezuela",
  vg: "British Virgin Islands",
  vi: "U.S. Virgin Islands",
  vn: "Vietnam",
  vu: "Vanuatu",
  wf: "Wallis & Futuna",
  ws: "Samoa",
  xa: "Pseudo-Accents",
  xb: "Pseudo-Bidi",
  ye: "Yemen",
  yt: "Mayotte",
  za: "South Africa",
  zm: "Zambia",
  zw: "Zimbabwe",
} as Record<string, string>;

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
                      : "Person/Entity"}
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
              <View style={styles.row}>
                <Text style={styles.boldText}>Country:</Text>
                <Text style={styles.normalText}>
                  {props.query?.country ? COUNTRIES[props.query.country.toLowerCase()] : "Any"}
                </Text>
              </View>
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
                      {props.entity.properties?.nationality?.map((n) => COUNTRIES[n]).join(" · ") ??
                        " - "}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Country:</Text>
                    <Text style={styles.normalText}>
                      {props.entity.properties?.country?.map((c) => COUNTRIES[c]).join(" · ") ??
                        " - "}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Date of birth:</Text>
                    <Text style={styles.normalText}>
                      {props.entity.properties?.dateOfBirth
                        ?.map((date) => formatPartialDate({ date }))
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
                        ?.map((n) => COUNTRIES[n])
                        .join(" · ") ?? " - "}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.boldText}>Date of registration:</Text>
                    <Text style={styles.normalText}>
                      {props.entity.properties?.dateOfRegistration
                        ?.map((date) => formatPartialDate({ date }))
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
                              .map((date) => formatPartialDate({ date }))
                              .join(" · ")
                          : "-"}
                      </Text>
                      <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.to]}>
                        {sanction.properties?.endDate
                          ? sanction.properties.endDate
                              .map((date) => formatPartialDate({ date }))
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
                        ?.map((date) => formatPartialDate({ date }))
                        .join(" · ") ?? "-"}
                    </Text>
                    <Text style={[tableStyles.cell, tableStyles.bodyCell, tableStyles.to]}>
                      {relationship.properties?.endDate
                        ?.map((date) => formatPartialDate({ date }))
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
