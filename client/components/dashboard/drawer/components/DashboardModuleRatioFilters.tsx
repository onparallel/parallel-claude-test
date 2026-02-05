import { HStack, RadioProps, Text, useRadioGroup } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { ModuleSettingsRadioButton } from "./ModuleSettingsRadioButton";

interface DashboardModuleRatioFiltersProps {
  value: "NUMERATOR" | "DENOMINATOR";
  onChange: (value: "NUMERATOR" | "DENOMINATOR") => void;
}

export function DashboardModuleRatioFilters({ value, onChange }: DashboardModuleRatioFiltersProps) {
  const { getRootProps, getRadioProps } = useRadioGroup({ name: "filters", value, onChange });

  return (
    <HStack {...getRootProps()}>
      <ModuleSettingsRadioButton {...(getRadioProps({ value: "NUMERATOR" }) as RadioProps)}>
        <Text>
          <FormattedMessage
            id="component.dashboard-module-ratio-filters.numerator"
            defaultMessage="Numerator"
          />
        </Text>
      </ModuleSettingsRadioButton>
      <Text as="span" fontSize="2xl" color="gray.400">
        /
      </Text>
      <ModuleSettingsRadioButton {...(getRadioProps({ value: "DENOMINATOR" }) as RadioProps)}>
        <Text>
          <FormattedMessage
            id="component.dashboard-module-ratio-filters.denominator"
            defaultMessage="Denominator"
          />
        </Text>
      </ModuleSettingsRadioButton>
    </HStack>
  );
}
