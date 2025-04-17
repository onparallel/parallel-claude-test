import { FormControl } from "@chakra-ui/react";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";

import { DashboardModuleChartItems } from "../../components/DashboardModuleChartItems";
import { DashboardModuleChartType } from "../../components/DashboardModuleChartType";
import { DashboardModuleFormLabel } from "../../components/DashboardModuleFormLabel";
import { DashboardModuleDrawerFormData } from "../../DashboardModuleDrawer";

export function PetitionsChartModuleSettings() {
  const { control } = useFormContext<DashboardModuleDrawerFormData>();

  return (
    <>
      <FormControl>
        <DashboardModuleFormLabel field="settings.chartGraphicType">
          <FormattedMessage
            id="component.petitions-chart-module-settings.chart-type-label"
            defaultMessage="Chart type"
          />
        </DashboardModuleFormLabel>
        <Controller
          name="settings.chartGraphicType"
          defaultValue="PIE"
          control={control}
          render={({ field: { value, onChange } }) => (
            <DashboardModuleChartType value={value} onChange={onChange} />
          )}
        />
      </FormControl>
      <DashboardModuleChartItems />
    </>
  );
}
