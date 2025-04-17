import {
  FormControl,
  Grid,
  GridItem,
  HStack,
  Input,
  Stack,
  Text,
  useRadioGroup,
} from "@chakra-ui/react";
import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import { DashboardModuleSize, DashboardRatioModuleSettingsType } from "@parallel/graphql/__types";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { DashboardModuleFormLabel } from "./components/DashboardModuleFormLabel";
import { ModuleSettingsRadioButton } from "./components/ModuleSettingsRadioButton";
import { DashboardModuleDrawerFormData, ModuleCategory } from "./DashboardModuleDrawer";
import { DashboardModulePetitionForm } from "./modules/petitions/DashboardModulePetitionForm";
import { DashboardModuleProfileForm } from "./modules/profiles/DashboardModuleProfileForm";

export function DashboardModuleForm() {
  const intl = useIntl();
  const {
    control,
    register,
    formState: { errors },
    watch,
  } = useFormContext<DashboardModuleDrawerFormData>();

  const selectedModule = watch("selectedModule");
  const moduleType = selectedModule?.type;

  return (
    <Stack as={ScrollShadows} padding={6} spacing={4} overflow="auto" height="100%">
      <FormControl isInvalid={!!errors.name}>
        <DashboardModuleFormLabel field="name">
          <FormattedMessage
            id="component.dashboard-module-form.module-name"
            defaultMessage="Name"
          />
        </DashboardModuleFormLabel>
        <Input
          {...register("name", { required: true })}
          placeholder={intl.formatMessage({
            id: "component.dashboard-module-form.module-name-placeholder",
            defaultMessage: "Module name",
          })}
        />
      </FormControl>
      <FormControl>
        <DashboardModuleFormLabel field="size">
          <FormattedMessage
            id="component.dashboard-module-form.module-size"
            defaultMessage="Size"
          />
        </DashboardModuleFormLabel>
        <Controller
          name="size"
          control={control}
          render={({ field: { value, onChange } }) => (
            <DashboardModuleSizes value={value} onChange={onChange} />
          )}
        />
      </FormControl>
      {isNonNullish(moduleType) ? (
        <>
          {moduleType.includes("Ratio") ? (
            <FormControl>
              <DashboardModuleFormLabel field="settings.ratioGraphicType">
                <FormattedMessage
                  id="component.dashboard-module-form.ratio-type-label"
                  defaultMessage="Type"
                />
              </DashboardModuleFormLabel>
              <Controller
                name="settings.ratioGraphicType"
                defaultValue="RATIO"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DashboardModuleRatioType value={value} onChange={onChange} />
                )}
              />
            </FormControl>
          ) : null}

          {moduleType.includes("Profiles") ? (
            <DashboardModuleProfileForm />
          ) : moduleType.includes("Petition") ? (
            <DashboardModulePetitionForm moduleType={moduleType} />
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}

export const minSizeByCategory = {
  NUMBER: "SMALL",
  RATIO: "SMALL",
  CHART: "MEDIUM",
  BUTTON: "SMALL",
} as Record<ModuleCategory, DashboardModuleSize>;

const maxSizeByCategory = {
  NUMBER: "MEDIUM",
  RATIO: "MEDIUM",
  CHART: "LARGE",
  BUTTON: "MEDIUM",
} as Record<ModuleCategory, DashboardModuleSize>;

interface DashboardModuleSizesProps {
  value: DashboardModuleSize;
  onChange: (value: DashboardModuleSize) => void;
}

function DashboardModuleSizes({ value, onChange }: DashboardModuleSizesProps) {
  const { watch } = useFormContext<DashboardModuleDrawerFormData>();

  const selectedModule = watch("selectedModule");
  const minSize = minSizeByCategory[selectedModule?.category ?? "NUMBER"];
  const maxSize = maxSizeByCategory[selectedModule?.category ?? "NUMBER"];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "size",
    value,
    defaultValue: "SMALL",
    onChange,
  });

  return (
    <HStack {...getRootProps()}>
      <ModuleSettingsRadioButton
        {...getRadioProps({ value: "SMALL" })}
        isDisabled={minSize === "MEDIUM" || minSize === "LARGE"}
      >
        <Text>
          <FormattedMessage
            id="component.dashboard-module-form.sizes-small"
            defaultMessage="Small"
          />
        </Text>
        <Grid templateColumns="repeat(4, 1fr)" gap={1} width="100%">
          <GridItem height={6} borderRadius="md" bg="primary.200" />
          <GridItem height={6} borderRadius="md" border="1px solid" borderColor="gray.300" />
          <GridItem height={6} borderRadius="md" border="1px solid" borderColor="gray.300" />
          <GridItem height={6} borderRadius="md" border="1px solid" borderColor="gray.300" />
        </Grid>
      </ModuleSettingsRadioButton>
      <ModuleSettingsRadioButton
        {...getRadioProps({ value: "MEDIUM" })}
        isDisabled={minSize === "LARGE" || maxSize === "SMALL"}
      >
        <Text>
          <FormattedMessage
            id="component.dashboard-module-form.sizes-medium"
            defaultMessage="Medium"
          />
        </Text>
        <Grid templateColumns="repeat(4, 1fr)" gap={1} width="100%">
          <GridItem colSpan={2} height={6} borderRadius="md" bg="primary.200" />
          <GridItem height={6} borderRadius="md" border="1px solid" borderColor="gray.300" />
          <GridItem height={6} borderRadius="md" border="1px solid" borderColor="gray.300" />
        </Grid>
      </ModuleSettingsRadioButton>
      <ModuleSettingsRadioButton
        {...getRadioProps({ value: "LARGE" })}
        isDisabled={maxSize === "SMALL" || maxSize === "MEDIUM"}
      >
        <Text>
          <FormattedMessage
            id="component.dashboard-module-form.sizes-large"
            defaultMessage="Large"
          />
        </Text>
        <GridItem width="100%" height={6} borderRadius="md" bg="primary.200" />
      </ModuleSettingsRadioButton>
    </HStack>
  );
}

interface DashboardModuleRatioTypeProps {
  value?: DashboardRatioModuleSettingsType;
  onChange: (value: DashboardRatioModuleSettingsType) => void;
}

function DashboardModuleRatioType({ value, onChange }: DashboardModuleRatioTypeProps) {
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "ratioGraphicType",
    value,
    defaultValue: "RATIO",
    onChange,
  });

  return (
    <HStack {...getRootProps()}>
      <ModuleSettingsRadioButton {...getRadioProps({ value: "RATIO" })}>
        <Text>
          <FormattedMessage
            id="component.dashboard-module-form.ratio-type-ratio"
            defaultMessage="Ratio"
          />
        </Text>
      </ModuleSettingsRadioButton>
      <ModuleSettingsRadioButton {...getRadioProps({ value: "PERCENTAGE" })}>
        <Text>
          <FormattedMessage
            id="component.dashboard-module-form.ratio-type-percentage"
            defaultMessage="Percentage"
          />
        </Text>
      </ModuleSettingsRadioButton>
    </HStack>
  );
}
