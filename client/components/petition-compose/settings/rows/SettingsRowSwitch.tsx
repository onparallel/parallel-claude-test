import { Switch } from "@chakra-ui/react";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { Box, Stack } from "@parallel/components/ui";
import { ReactNode } from "react";
import { SettingsRow, SettingsRowProps } from "./SettingsRow";

export interface SettingsRowSwitchProps extends Omit<SettingsRowProps, "children" | "onChange"> {
  icon?: ReactNode;
  disabledReadon?: ReactNode;
  isChecked: boolean;
  onChange: (value: boolean) => void;
  children?: ReactNode;
}

export function SettingsRowSwitch({
  isChecked,
  onChange,
  children,
  isDisabled,
  disabledReadon,
  ...props
}: SettingsRowSwitchProps) {
  return (
    <Stack gap={0}>
      <SettingsRow isActive={isChecked} isDisabled={isDisabled} {...props}>
        <SmallPopover isDisabled={!isDisabled || !disabledReadon} content={disabledReadon}>
          <Box>
            <Switch
              isChecked={isChecked}
              onChange={(e) => onChange(e.target.checked)}
              id={props.controlId}
              isDisabled={isDisabled}
            />
          </Box>
        </SmallPopover>
      </SettingsRow>
      {children ? (
        <PaddedCollapse open={isChecked}>
          <Box marginTop={2}>{children}</Box>
        </PaddedCollapse>
      ) : null}
    </Stack>
  );
}
