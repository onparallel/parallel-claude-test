import { Badge, HStack } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { BusinessIcon, LinkIcon, UserIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { isNullish } from "remeda";
import { BACKGROUND_CHECK_TOPICS } from "../../utils/backgroundCheckTopics";
import { Text } from "@parallel/components/ui";

export const BackgroundCheckRiskLabel = chakraForwardRef<"span", { risk: string }>(
  function BackgroundCheckRiskLabel({ risk, ...props }, ref) {
    const label = BACKGROUND_CHECK_TOPICS[risk];
    const text = risk.split(".")?.[1] ?? risk;
    const icon = ["sanction.linked"].includes(risk) ? (
      <LinkIcon />
    ) : /^corp(-?|$)/.test(risk) ? (
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
