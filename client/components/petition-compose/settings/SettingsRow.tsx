import { Center, FormControl, FormControlProps, FormLabel, Stack, Text } from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { Spacer } from "@parallel/components/common/Spacer";
import { ReactNode } from "react";

export interface SettingsRowProps extends Omit<FormControlProps, "label"> {
  label: ReactNode;
  icon?: ReactNode;
  isActive?: boolean;
  controlId: string;
  children: ReactNode;
  description?: ReactNode;
  ignoreSpacer?: boolean;
}

export function SettingsRow({
  label,
  icon,
  isActive,
  controlId,
  description,
  ignoreSpacer,
  children,
  ...props
}: SettingsRowProps) {
  return (
    <FormControl display="flex" alignItems="center" id={controlId} {...props}>
      <FormLabel
        alignSelf="flex-start"
        display="flex"
        alignItems="center"
        fontWeight="normal"
        whiteSpace="nowrap"
        margin={0}
        minHeight={8}
      >
        <Stack direction="row" alignItems="center">
          {icon ? <Center color={isActive ? "purple.600" : undefined}>{icon}</Center> : null}
          <Text as="span" whiteSpace="break-spaces">
            {label}
          </Text>
        </Stack>
        {description ? <HelpPopover>{description}</HelpPopover> : null}
      </FormLabel>
      {ignoreSpacer ? null : <Spacer minWidth={6} />}
      {children}
    </FormControl>
  );
}
