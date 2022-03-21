import { Box, Collapse, Switch } from "@chakra-ui/react";
import { ReactNode } from "react";
import { SettingsRow, SettingsRowProps } from "./settings/SettingsRow";

export interface SwitchSettingProps extends Omit<SettingsRowProps, "children" | "onChange"> {
  icon?: ReactNode;
  isChecked: boolean;
  onChange: (value: boolean) => void;
  children?: ReactNode;
}

export function SettingsRowSwitch({ isChecked, onChange, children, ...props }: SwitchSettingProps) {
  return (
    <Box>
      <SettingsRow isActive={isChecked} {...props}>
        <Switch
          isChecked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
          id={props.controlId}
          isDisabled={props.isDisabled}
        />
      </SettingsRow>
      {children ? (
        <Collapse in={isChecked}>
          <Box marginTop={2}>{children}</Box>
        </Collapse>
      ) : null}
    </Box>
  );
}
