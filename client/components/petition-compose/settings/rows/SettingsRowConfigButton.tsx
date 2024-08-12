import { HStack, Stack } from "@chakra-ui/react";
import { SettingsIcon } from "@parallel/chakra/icons";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../../../common/IconButtonWithTooltip";
import { SettingsRow, SettingsRowProps } from "./SettingsRow";

interface SettingsRowConfigButtonProps extends Omit<SettingsRowProps, "children" | "onChange"> {
  icon?: ReactNode;
  onConfig: () => void;
  children?: ReactNode;
}

export function SettingsRowConfigButton({
  onConfig,
  children,
  ...props
}: SettingsRowConfigButtonProps) {
  const intl = useIntl();

  return (
    <Stack spacing={0}>
      <SettingsRow {...props}>
        <HStack>
          {children}
          <IconButtonWithTooltip
            isDisabled={props.isDisabled}
            icon={<SettingsIcon />}
            label={intl.formatMessage({
              id: "component.settings-row-button.edit-settings",
              defaultMessage: "Edit settings",
            })}
            placement="bottom-start"
            size="sm"
            onClick={() => onConfig?.()}
          />
        </HStack>
      </SettingsRow>
    </Stack>
  );
}
