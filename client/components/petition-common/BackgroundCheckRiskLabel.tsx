import { Badge, HStack, Text } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { BusinessIcon, UserIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { isNullish } from "remeda";

const LABELS = {
  crime: "Crime",
  "crime.fraud": "Fraud",
  "crime.cyber": "Cybercrime",
  "crime.fin": "Financial crime",
  "crime.env": "Environmental violations",
  "crime.theft": "Theft",
  "crime.war": "War crimes",
  "crime.boss": "Criminal leadership",
  "crime.terror": "Terrorism",
  "crime.traffick": "Trafficking",
  "crime.traffick.drug": "Drug trafficking",
  "crime.traffick.human": "Human trafficking",
  "corp.offshore": "Offshore",
  "corp.shell": "Shell company",
  "corp.public": "Public listed company",
  gov: "Government",
  "gov.national": "National government",
  "gov.state": "State government",
  "gov.muni": "Municipal government",
  "gov.soe": "State-owned enterprise",
  "gov.igo": "Intergovernmental organization",
  "gov.head": "Head of government or state",
  "gov.admin": "Civil service",
  "gov.executive": "Executive branch of government",
  "gov.legislative": "Legislative branch of government",
  "gov.judicial": "Judicial branch of government",
  "gov.security": "Security services",
  "gov.financial": "Central banking and financial integrity",
  fin: "Financial services",
  "fin.bank": "Bank",
  "fin.fund": "Fund",
  "fin.advisor": "Financial advisor",
  "role.rca": "Close Associate",
  "role.judge": "Judge",
  "role.civil": "Civil servant",
  "role.diplo": "Diplomat",
  "role.lawyer": "Lawyer",
  "role.acct": "Accountant",
  "role.spy": "Spy",
  "role.oligarch": "Oligarch",
  "role.journo": "Journalist",
  "role.act": "Activist",
  "pol.party": "Political party",
  "pol.union": "Union",
  rel: "Religion",
  mil: "Military",
  "asset.frozen": "Frozen asset",
  sanction: "Sanctioned entity",
  "sanction.linked": "Sanction-linked entity",
  "export.control": "Export controlled",
  debarment: "Debarred entity",
  poi: "Person of interest",
  wanted: "Wanted",
  "corp.disqual": "Disqualified",
  "reg.action": "Regulator action",
  "reg.warn": "Regulator warning",
  "role.pol": "Non-PEP",
  "role.pep": "Politician", // update of "Political"
  "role.lobby": "Lobbyist",
  "sanction.counter": "Counter-sanctioned entity",
  "export.risk": "Trade risk",
} as Record<string, string>;

export const BackgroundCheckRiskLabel = chakraForwardRef<"span", { risk: string }>(
  function BackgroundCheckRiskLabel({ risk, ...props }, ref) {
    const label = LABELS[risk];
    const text = risk.split(".")[1] || risk;
    const icon =
      /^corp(-?|$)/.test(risk) || ["sanction.linked"].includes(risk) ? (
        <BusinessIcon />
      ) : /^role(-?|$)/.test(risk) ? (
        <UserIcon />
      ) : null;
    return (
      <Tooltip placement="right" label={label} isDisabled={isNullish(label)}>
        <Badge
          as={HStack}
          display="inline-flex"
          spacing={1}
          colorScheme={
            risk === "role.pep"
              ? "green"
              : risk === "role.rca"
                ? "blue"
                : /^san(-?|$)/.test(risk)
                  ? "red"
                  : /^ool(-?|$)/.test(risk)
                    ? "orange"
                    : /^poi(-?|$)/.test(risk)
                      ? "yellow"
                      : undefined
          }
          {...props}
        >
          {icon}
          <Text as="span">{text}</Text>
        </Badge>
      </Tooltip>
    );
  },
);
