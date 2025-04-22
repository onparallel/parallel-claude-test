import { HStack, Text, useRadioGroup } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { ModuleSettingsRadioButton } from "./ModuleSettingsRadioButton";

interface DashboardModuleRatioFiltersProps {
  value: number;
  onChange: (value: number) => void;
}

export function DashboardModuleRatioFilters({ value, onChange }: DashboardModuleRatioFiltersProps) {
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "filters",
    value: value.toString(),
    defaultValue: "0",
    onChange: (value) => onChange(parseInt(value)),
  });

  return (
    <HStack {...getRootProps()}>
      <ModuleSettingsRadioButton {...getRadioProps({ value: "0" })}>
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
      <ModuleSettingsRadioButton {...getRadioProps({ value: "1" })}>
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
