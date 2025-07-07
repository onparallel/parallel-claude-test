import { outdent } from "outdent";
import { IntlShape } from "react-intl";
import { isNullish, unique } from "remeda";
import {
  EntityDetailsResponse,
  EntitySearchRequest,
  EntitySearchResponse,
} from "../../services/BackgroundCheckService";
import { FORMATS } from "../../util/dates";
import { hashString } from "../../util/token";
import { formatPartialDate } from "../utils/formatPartialDate";
import { PdfDocument } from "../utils/pdf";

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

// Simplified version to avoid React context issues

function formatListOfTexts(values?: string[]): string {
  return values?.join(" · ") ?? " - ";
}

function formatDate(date: string): string {
  try {
    return formatPartialDate({ date });
  } catch {
    return date;
  }
}

function BackgroundCheckProfileTypst(props: BackgroundCheckProfileProps, intl: IntlShape) {
  const isPerson = props.entity.type === "Person";
  const isCompany = props.entity.type === "Company";
  const notSet = `text(fill: rgb("#A0AEC0"), style: "italic")[Any]`;

  // Generate search summary section
  const searchSummarySection = props.search
    ? outdent`
    // Search Summary
    #stack(
      spacing: 6pt,
      text(size: 10.5pt, weight: 600)[Search Summary],
      line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    )
    
    #item("Searching for", "${props.query?.type === "PERSON" ? "Person" : props.query?.type === "COMPANY" ? "Entity" : "person / entity"}")
    #item("Name", ${isNullish(props.query?.name) ? notSet : `"${props.query.name}"`})
    #item("Birthdate", ${isNullish(props.query?.date) ? notSet : `"${props.query.date}"`})
    ${
      props.query?.type === "PERSON"
        ? outdent`
    #item("Nationality", ${isNullish(props.query?.country) ? notSet : `"${COUNTRIES[props.query.country.toLowerCase()]}"`})
    #item("Country of birth", ${isNullish(props.query?.birthCountry) ? notSet : `"${COUNTRIES[props.query.birthCountry.toLowerCase()]}"`})`
        : outdent`
    #item("Country", ${isNullish(props.query?.country) ? notSet : `"${COUNTRIES[props.query.country.toLowerCase()]}"`})`
    }
    #item("Saved on", "${intl.formatDate(new Date((props.entity as any)?.createdAt), FORMATS.FULL)}")
  
    #v(6pt)
  `
    : "";

  // Generate entity-specific fields
  const entityFields =
    isCompany || isPerson
      ? outdent`
      #item("Type", "${props.entity.type}")
      ${
        isPerson
          ? outdent`
      #item("Gender", [#capitalize("${formatListOfTexts((props.entity.properties as any)?.gender)}")])
      #item("Nationality", "${(props.entity.properties as any)?.nationality?.map((n: string) => COUNTRIES[n]).join(" · ") ?? " - "}")
      #item("Country", "${(props.entity.properties as any)?.country?.map((c: string) => COUNTRIES[c]).join(" · ") ?? " - "}")
      #item("Date of birth", "${(props.entity.properties as any)?.dateOfBirth?.map((date: string) => formatDate(date)).join(" · ") ?? " - "}")`
          : outdent`
      #item("Jurisdiction", "${(props.entity.properties as any)?.jurisdiction?.map((n: string) => COUNTRIES[n]).join(" · ") ?? " - "}")
      #item("Date of registration", "${(props.entity.properties as any)?.dateOfRegistration?.map((date: string) => formatDate(date)).join(" · ") ?? " - "}")`
      }
  `
      : "";

  // Generate overview fields
  const overviewFields = outdent`
    #grid(
      columns: (15%, 85%),
      column-gutter: 4pt,
      row-gutter: 12pt,
      [#text(size: 8.25pt, weight: 600)[Other Name:]], [#text(size: 9pt)[${formatListOfTexts(props.entity.properties?.name)}]],
      [#text(size: 8.25pt, weight: 600)[Alias:]], [#text(size: 9pt)[${formatListOfTexts(props.entity.properties?.alias)}]],
      ${
        isPerson
          ? outdent`
      [#text(size: 8.25pt, weight: 600)[Place of birth:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.birthPlace)}]],
      [#text(size: 8.25pt, weight: 600)[Position:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.position)}]],
      [#text(size: 8.25pt, weight: 600)[Education:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.education)}]],
      [#text(size: 8.25pt, weight: 600)[Status:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.status)}]],
      [#text(size: 8.25pt, weight: 600)[Religion:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.religion)}]],
      [#text(size: 8.25pt, weight: 600)[Ethnicity:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.ethnicity)}]],
      `
          : outdent`
      [#text(size: 8.25pt, weight: 600)[Address:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.address)}]],
      `
      }
    )
  `;

  // Generate sanctions table
  const sanctionsTable = props.entity.properties.sanctions?.length
    ? outdent`
    #table(
      columns: (30%, 40%, 15%, 15%),
      [List Name / Authority], [Program], [From], [To],
      ${props.entity.properties.sanctions
        ?.map((sanction) => {
          const authority = sanction.properties?.authority?.join(" · ") ?? "-";
          const datasets = sanction.datasets?.map((d) => d.title).join(" · ") || null;
          const combinedAuthority = [datasets, authority].filter(Boolean).join(" / ");
          const program = formatListOfTexts(sanction.properties?.program);
          const startDate =
            sanction.properties?.startDate?.map((date) => formatDate(date)).join(" · ") ?? "-";
          const endDate =
            sanction.properties?.endDate?.map((date) => formatDate(date)).join(" · ") ?? "-";

          return outdent`[${combinedAuthority}], [${program}], [${startDate}], [${endDate}],`;
        })
        .join("")}
    )
  `
    : outdent`
    #v(0pt)
    #line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    #v(2pt)
    #text(size: 9pt)[We have not found this entity on any sanctions list.]
  `;

  // Generate relationships table
  console.log(props.entity.properties.relationships?.map((r) => r.properties?.relationship));
  const relationshipsTable = props.entity.properties?.relationships?.length
    ? outdent`
    #table(
      columns: (30%, 15%, 25%, 15%, 15%),
      [Name], [Type], [Relation], [From], [To],
      ${props.entity.properties.relationships
        ?.map((relationship) => {
          const name =
            relationship.properties?.entityA?.name === props.entity.name
              ? relationship.properties?.entityB?.name
              : relationship.properties?.entityA?.name;
          const type = relationship.type;
          const relationships = unique(
            relationship.properties?.relationship?.map((r) => r.replaceAll("-", " ")) ?? [],
          );
          const relation = formatListOfTexts(relationships);
          const startDate =
            relationship.properties?.startDate?.map((date) => formatDate(date)).join(" · ") ?? "-";
          const endDate =
            relationship.properties?.endDate?.map((date) => formatDate(date)).join(" · ") ?? "-";

          return `[${name}], [${type}], [${relation}], [${startDate}], [${endDate}],`;
        })
        .join("")}
    )
  `
    : `
    #v(0pt)
    #line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    #v(2pt)
    #text(size: 9pt)[We have not found any relevant relationship for this entity.]
  `;

  return outdent`
    #import "@preview/prequery:0.1.0"
    #let capitalize(text) = if text.len() > 0 { upper(text.slice(0, 1)) + lower(text.slice(1)) } else { text }
    
    #let item(label, content) = box(
      inset: (x: 0pt, y: 2pt),
      stroke: none,
      [
        #text(size: 8.25pt, weight: 600)[#label:] #text(size: 9pt)[#content] #h(12pt)
      ]
    )
    
    #let risk-label(risk) = {
      let bg-color = if risk == "role.pep" {
        rgb("#C6F6D5")
      } else if risk == "role.rca" {
        rgb("#CEEDFF") 
      } else if risk.starts-with("san") {
        rgb("#FED7D7")
      } else if risk.starts-with("ool") {
        rgb("#FEEBC8")
      } else if risk.starts-with("poi") {
        rgb("#FEFCBF")
      } else {
        rgb("#EDF2F7")
      }
      
      let text-color = if risk == "role.pep" {
        rgb("#22543D")
      } else if risk == "role.rca" {
        rgb("#153E75")
      } else if risk.starts-with("san") {
        rgb("#822727")
      } else if risk.starts-with("ool") {
        rgb("#7B341E")
      } else if risk.starts-with("poi") {
        rgb("#744210")
      } else {
        rgb("#2D3748")
      }
      
      let display-text = if risk.contains(".") {
        risk.split(".").at(1)
      } else {
        risk
      }
      
      box(
        fill: bg-color,
        inset: (x: 4pt, y: 3pt),
        radius: 2pt,
        text(
          size: 7.5pt,
          weight: 500,
          fill: text-color
        )[#upper(display-text)]
      )
    }
    #set page(
      margin: (
        top: 0.75in,
        right: 0.75in,
        bottom: 0.75in,
        left: 0.75in,
      ),
    )
    #set text(
      font: ("Noto Sans", "Noto Emoji"),
      size: 12pt,
      fill: rgb("#1A202C"),
    )
    #set par(leading: 0.98em, justify: false)

    #set table(
      stroke: (x: none, y: rgb("#E2E8F0")),
      inset: (x, y) => (
        left: if x == 0 { 0pt } else { 16pt },
        y: if y == 0 { 10pt } else { 8pt }
      ),
    )
    #show table.cell: it => {
      if (it.y == 0) {
        text(size: 7.5pt, weight: 600, upper(it))
      } else {
        text(size: 9pt, it)
      }
    }
    
    // Header
    #stack(
      dir: ltr,
      spacing: 8pt,
      [
        #context {
          let url = ${JSON.stringify(`${props.assetsUrl}/static/emails/logo.png`)}
          let path = ${JSON.stringify(`assets/${hashString(`${props.assetsUrl}/static/emails/logo.png`)}`)}
          prequery.image(url, path, width: 32mm)
        }
      ],
      [#align(horizon)[#line(angle: 90deg, length: 15pt, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))]],
      [#align(horizon)[#text(size: 10.5pt, fill: rgb("#4A5568"))[Background check]]]
    )
    
    #v(20pt)
    
    ${searchSummarySection}
    
    ${
      isCompany || isPerson
        ? `
    // Entity Name and Topics
    #stack(
      spacing: 6pt,
      stack(
      dir: ltr,
        spacing: 4pt,
        text(size: 10.5pt, weight: 600)[${props.entity.name}],
        h(4pt),
        ${props.entity.properties.topics?.map((topic) => `box[#v(-2pt)#risk-label("${topic}")]`).join(",") ?? ""}
      ),
      line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    )
    
    // Basic Information
    ${entityFields}
    
    #v(12pt)
    
    // Overview Section
    #stack(
      spacing: 6pt,
      text(size: 10.5pt, weight: 600)[Overview],
      line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    )
    
    ${overviewFields}
    
    #v(12pt)
    
    // Sanctions Lists
    #text(size: 10.5pt, weight: 600)[Sanctions Lists (${props.entity.properties.sanctions?.length ?? 0})]
    #v(-6pt)
    ${sanctionsTable}
    
    #v(12pt)
    
    // Relationships
    #text(size: 10.5pt, weight: 600)[Relationships (${props.entity.properties.relationships?.length ?? 0})]
    #v(-6pt)
    ${relationshipsTable}
    `
        : ""
    }
  `;
}

BackgroundCheckProfileTypst.TYPST = true;

export default BackgroundCheckProfileTypst as PdfDocument<{}, BackgroundCheckProfileProps>;
