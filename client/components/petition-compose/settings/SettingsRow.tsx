import { FormControl, FormControlProps, FormLabel } from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { Spacer } from "@parallel/components/common/Spacer";
import { ReactNode } from "react";

export interface SettingsRowProps extends Omit<FormControlProps, "label"> {
  label: ReactNode;
  controlId: string;
  children: ReactNode;
  description?: ReactNode;
}

export function SettingsRow({
  label,
  controlId,
  description,
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
        {label}
        {description ? <HelpPopover>{description}</HelpPopover> : null}
      </FormLabel>
      <Spacer minWidth={6} />
      {children}
    </FormControl>
  );
}
