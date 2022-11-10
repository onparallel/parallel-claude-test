import { Badge, HStack, Tooltip, Text } from "@chakra-ui/react";
import { BusinessIcon, UserIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { isDefined } from "remeda";

const LABELS = {
  "SI-PERSON": "Special Interest - Person",
  "SI-ENTITY": "Special Interest - Entity",
  "SI-LT-PERSON": "Special Interest - Person (Lower Threshold)",
  "SI-LT-ENTITY": "Special Interest - Entity (Lower Threshold)",
  "ECR-PERSON": "Enhanced Country Risk - Person",
  "ECR-ENTITY": "Enhanced Country Risk - Entity",
  "ECR-SHIP": "Enhanced Country Risk - Entity(Ship/Vessel)",
  "ECR-AIRCRAFT": "Enhanced Country Risk - Entity (Aircraft)",
  "ECR-COUNTRY": "Enhanced Country Risk - Entity (Country)",
  "ECR-BANK": "Enhanced Country Risk - Entity (Bank)",
  PEP: "Politically Exposed Person",
  RCA: "Relative & Close Associate",
  "SAN-PERSON": "Sanctions List - Person",
  "SAN-ENTITY": "Sanctions List - Entity",
  "SAN-SHIP": "Sanctions List - Entity (Ship)",
  "SAN-AIRCRAFT": "Sanctions List - Entity (Aircraft)",
  "SAN-COUNTRY": "Sanctions List - Entity (Country)",
  "SAN-BANK": "Sanctions List - Entity (Bank)",
  "OOL-PERSON": "Other Official List - Person",
  "OOL-ENTITY": "Other Official List - Entity",
  "OOL-SHIP": "Other Official List - Entity (Ship)",
  "OOL-AIRCRAFT": "Other Official List - Entity (Aircraft)",
  "OOL-COUNTRY": "Other Official List - Entity (Country)",
  "OOL-BANK": "Other Official List - Entity (Bank)",
  "OEL-PERSON": "Other Exclusion List - Person",
  "OEL-ENTITY": "Other Exclusion List - Entity",
  SOC: "State Owned Company",
  BRD: "Board Member",
  AM: "Adverse Media - Entity",
  SOR: "Sanctions Ownership Research - Entity",
  "SOR-BANK": "Sanctions Ownership Research - Entity (Bank)",
  "LOCATIONS-COUNTRY": "Enhanced Country Risk - Entity (Country)",
} as Record<string, string>;

export const DowJonesRiskLabel = chakraForwardRef<"span", { risk: string }>(
  function DowJonesRiskLabel({ risk, ...props }, ref) {
    const label = LABELS[risk];
    const text = /-(ENTITY|PERSON)$/.test(risk) ? risk.replace(/-(ENTITY|PERSON)$/, "") : risk;
    const icon = /-ENTITY$/.test(risk) ? (
      <BusinessIcon />
    ) : /-PERSON$/.test(risk) ? (
      <UserIcon />
    ) : /-(SHIP|AIRCRAFT|COUNTRY|BANK)$/.test(risk) ? null : ["SOC", "AM", "SOR"].includes(risk) ? (
      <BusinessIcon />
    ) : (
      <UserIcon />
    );
    return (
      <Tooltip placement="right" label={label} isDisabled={!isDefined(label)}>
        <Badge
          as={HStack}
          display="inline-flex"
          spacing={1}
          colorScheme={
            risk === "PEP"
              ? "green"
              : risk === "RCA"
              ? "blue"
              : /^SAN(-?|$)/.test(risk)
              ? "red"
              : /^OOL(-?|$)/.test(risk)
              ? "orange"
              : /^SI(-?|$)/.test(risk)
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
  }
);
