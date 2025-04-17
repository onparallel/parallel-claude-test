import { HStack, Text, useRadioGroup } from "@chakra-ui/react";
import { untranslated } from "@parallel/utils/untranslated";
import { ModuleSettingsRadioButton } from "./ModuleSettingsRadioButton";

interface DashboardModuleRatioFiltersProps {
  value: number;
  onChange: (value: number) => void;
  filtersCount: [number, number];
}

export function DashboardModuleRatioFilters({
  value,
  onChange,
  filtersCount,
}: DashboardModuleRatioFiltersProps) {
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "filters",
    value: value.toString(),
    defaultValue: "0",
    onChange: (value) => onChange(parseInt(value)),
  });

  return (
    <HStack {...getRootProps()}>
      <ModuleSettingsRadioButton {...getRadioProps({ value: "0" })}>
        <Text>{untranslated(`A (${filtersCount[0]})`)}</Text>
      </ModuleSettingsRadioButton>
      <ModuleSettingsRadioButton {...getRadioProps({ value: "1" })}>
        <Text>{untranslated(`B (${filtersCount[1]})`)}</Text>
      </ModuleSettingsRadioButton>
    </HStack>
  );
}
