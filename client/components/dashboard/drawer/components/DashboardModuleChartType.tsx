import { HStack, Image, RadioProps, useRadio, useRadioGroup } from "@chakra-ui/react";
import { DashboardPieChartModuleSettingsType } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { Button, Text } from "@parallel/components/ui";

interface DashboardModuleChartTypeProps {
  value?: DashboardPieChartModuleSettingsType;
  onChange: (value: DashboardPieChartModuleSettingsType) => void;
}

export function DashboardModuleChartType({ value, onChange }: DashboardModuleChartTypeProps) {
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "chartType",
    value,
    defaultValue: "PIE",
    onChange,
  });

  return (
    <HStack {...getRootProps()}>
      <ModuleSizeRadioButton {...(getRadioProps({ value: "PIE" }) as RadioProps)}>
        <Text>
          <FormattedMessage id="component.dashborad-module-chart-type.pie" defaultMessage="Pie" />
        </Text>
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/modules/CHART_PIE.svg`}
        />
      </ModuleSizeRadioButton>
      <ModuleSizeRadioButton {...(getRadioProps({ value: "DOUGHNUT" }) as RadioProps)}>
        <Text>
          <FormattedMessage
            id="component.dashborad-module-chart-type.doughnut"
            defaultMessage="Doughnut"
          />
        </Text>
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/modules/CHART_DOUGHNUT.svg`}
        />
      </ModuleSizeRadioButton>
    </HStack>
  );
}

function ModuleSizeRadioButton(props: RadioProps) {
  const { getInputProps, getRadioProps } = useRadio(props);

  return (
    <Button
      as="label"
      variant="unstyled"
      display="flex"
      maxHeight="auto"
      height="auto"
      cursor="pointer"
      gridArea={props.value}
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      fontWeight={500}
      _checked={{
        borderColor: "primary.500",
        backgroundColor: "primary.50",
      }}
      _hover={{
        backgroundColor: "primary.50",
      }}
      flex="1"
      padding={4}
      paddingY={3}
      {...getRadioProps()}
    >
      <input {...getInputProps()} />
      <HStack flex="1" align="center" justify="center" spacing={3}>
        {props.children}
      </HStack>
    </Button>
  );
}
